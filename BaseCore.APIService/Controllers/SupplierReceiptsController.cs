using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using BaseCore.APIService.Hubs;
using BaseCore.APIService.Helpers;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupplierReceiptsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public SupplierReceiptsController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        private int GetUserId()
            => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private string GetUserRole()
            => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        [HttpGet]
        [Authorize(Roles = "Admin,Supplier,Seller")]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.SupplierReceipts
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Seller)
                .AsQueryable();

            if (GetUserRole() == "Supplier")
                query = query.Where(r => r.SupplierId == GetUserId());
            else if (GetUserRole() == "Seller")
                query = query.Where(r => r.SellerId == GetUserId());

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var list = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ReceiptCode,
                    r.SupplierId,
                    supplierName = r.Supplier.FullName,
                    r.ProductId,
                    productName = r.Product.Name,
                    productImage = r.Product.ImageUrl,
                    r.Quantity,
                    r.UnitPrice,
                    r.TotalAmount,
                    r.Status,
                    r.AdminNote,
                    r.SupplierNote,
                    r.CreatedAt,
                    r.ProcessedAt,
                    r.SellerId,
                    sellerName = r.Seller != null ? r.Seller.FullName : "",
                    r.IsFromProposal
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Supplier,Seller")]
        public async Task<IActionResult> GetById(int id)
        {
            var receipt = await _context.SupplierReceipts
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Seller)
                .Where(r => r.Id == id)
                .Select(r => new
                {
                    r.Id,
                    r.ReceiptCode,
                    r.SupplierId,
                    supplierName = r.Supplier.FullName,
                    r.ProductId,
                    productName = r.Product.Name,
                    productImage = r.Product.ImageUrl,
                    r.Quantity,
                    r.UnitPrice,
                    r.TotalAmount,
                    r.Status,
                    r.AdminNote,
                    r.SupplierNote,
                    r.CreatedAt,
                    r.ProcessedAt,
                    r.SellerId,
                    sellerName = r.Seller != null ? r.Seller.FullName : "",
                    r.IsFromProposal
                })
                .FirstOrDefaultAsync();

            if (receipt == null) return NotFound();

            if (GetUserRole() == "Supplier" && receipt.SupplierId != GetUserId())
                return Forbid();
            if (GetUserRole() == "Seller" && receipt.SellerId != GetUserId())
                return Forbid();

            return Ok(receipt);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> Create([FromBody] CreateReceiptRequest req)
        {
            var supplier = await _context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == req.SupplierId && u.Role.Name == "Supplier");
            if (supplier == null) return BadRequest("Supplier không tồn tại.");

            var product = await _context.Products.FindAsync(req.ProductId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");

            var code = $"RC-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
            var total = req.Quantity * req.UnitPrice;

            var receipt = new SupplierReceipt
            {
                ReceiptCode    = code,
                SupplierId     = req.SupplierId,
                SellerId       = GetUserId(),    
                ProductId      = req.ProductId,
                Quantity       = req.Quantity,
                UnitPrice      = req.UnitPrice,
                TotalAmount    = total,
                Status         = "PendingSupplier",      
                AdminNote      = req.AdminNote,
                IsFromProposal = false,
                CreatedAt      = DateTime.UtcNow
            };

            _context.SupplierReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo yêu cầu biên lai thành công. Đang chờ Supplier xác nhận.", id = receipt.Id, code });
        }

        [HttpPut("{id}/confirm")]
        [Authorize(Roles = "Supplier,Seller")]
        public async Task<IActionResult> Confirm(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            var receipt = await _context.SupplierReceipts
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (receipt == null) return NotFound();

            var userRole = GetUserRole();
            var userId = GetUserId();

            if (receipt.IsFromProposal)
            {
                if (userRole != "Seller" || receipt.SellerId != userId)
                    return Forbid();

                if (receipt.Status != "Pending")
                    return BadRequest("Biên lai không ở trạng thái chờ xác nhận.");

                receipt.Status       = "Confirmed";
                receipt.ProcessedAt  = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(req.Note))
                    receipt.SupplierNote = req.Note;   

                var proposal = await _context.SupplierProposals.FirstOrDefaultAsync(p => p.ReceiptId == receipt.Id);
                if (proposal != null)
                {
                    proposal.Status = "Completed";
                    proposal.ProcessedAt = DateTime.UtcNow;
                }

                receipt.Product.StockQuantity += receipt.Quantity;
                receipt.Product.UpdatedAt = DateTime.UtcNow;

                var product = receipt.Product;
                var oldQty = product.StockQuantity - receipt.Quantity;
                var newQty = receipt.Quantity;
                product.ImportPrice = (oldQty + newQty) > 0
                    ? (product.ImportPrice * oldQty + receipt.UnitPrice * newQty) / (oldQty + newQty)
                    : receipt.UnitPrice;

                _context.StockBatches.Add(new StockBatch
                {
                    ProductId  = receipt.ProductId,
                    BatchCode  = $"LOT-{receipt.ReceiptCode}",
                    Quantity   = receipt.Quantity,
                    CostPrice  = receipt.UnitPrice,
                    SupplierId = receipt.SupplierId,
                    ImportDate = DateTime.UtcNow,
                    Note       = $"Từ đề nghị {receipt.ReceiptCode}",
                    Status     = "Active",
                });
            }
            else
            {
                if (receipt.Status == "PendingSupplier")
                {
                    if (userRole != "Supplier" || receipt.SupplierId != userId)
                        return Forbid();

                    receipt.Status = "PendingSeller";
                    receipt.ProcessedAt = DateTime.UtcNow;
                    if (!string.IsNullOrEmpty(req.Note))
                        receipt.SupplierNote = req.Note;
                }
                else if (receipt.Status == "PendingSeller")
                {
                    if (userRole != "Seller" || receipt.SellerId != userId)
                        return Forbid();

                    receipt.Status = "Confirmed";
                    receipt.ProcessedAt = DateTime.UtcNow;

                    receipt.Product.StockQuantity += receipt.Quantity;
                    receipt.Product.UpdatedAt = DateTime.UtcNow;

                    var product = receipt.Product;
                    var oldQty = product.StockQuantity - receipt.Quantity;
                    var newQty = receipt.Quantity;
                    product.ImportPrice = (oldQty + newQty) > 0
                        ? (product.ImportPrice * oldQty + receipt.UnitPrice * newQty) / (oldQty + newQty)
                        : receipt.UnitPrice;

                    _context.StockBatches.Add(new StockBatch
                    {
                        ProductId  = receipt.ProductId,
                        BatchCode  = $"LOT-{receipt.ReceiptCode}",
                        Quantity   = receipt.Quantity,
                        CostPrice  = receipt.UnitPrice,
                        SupplierId = receipt.SupplierId,
                        ImportDate = DateTime.UtcNow,
                        Note       = $"Từ yêu cầu {receipt.ReceiptCode}",
                        Status     = "Active",
                    });
                }
                else
                {
                    return BadRequest("Biên lai không ở trạng thái hợp lệ để xác nhận.");
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xác nhận biên lai thành công." });
        }

        [HttpPut("{id}/dispute")]
        [Authorize(Roles = "Supplier,Seller")]
        public async Task<IActionResult> Dispute(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            var receipt = await _context.SupplierReceipts.FindAsync(id);
            if (receipt == null) return NotFound();

            var userRole = GetUserRole();
            var userId = GetUserId();

            if (userRole == "Supplier" && receipt.SupplierId != userId) return Forbid();
            if (userRole == "Seller" && receipt.SellerId != userId) return Forbid();

            if (receipt.Status != "Pending" && receipt.Status != "PendingSeller" && receipt.Status != "PendingSupplier")
                return BadRequest("Biên lai không ở trạng thái chờ xác nhận.");

            receipt.Status       = "Disputed";
            receipt.SupplierNote = req.Note;
            receipt.ProcessedAt  = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã ghi nhận khiếu nại." });
        }

        [HttpPut("{id}/resolve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Resolve(int id, [FromBody] AdminResolveRequest req)
        {
            var receipt = await _context.SupplierReceipts.FindAsync(id);
            if (receipt == null) return NotFound();
            if (receipt.Status != "Disputed")
                return BadRequest("Biên lai không ở trạng thái đang khiếu nại.");

            receipt.Status       = "Resolved";
            receipt.AdminNote    = req.AdminNote;
            receipt.ProcessedAt  = DateTime.UtcNow;

            if (req.AdjustedQuantity.HasValue && req.AdjustedQuantity.Value != receipt.Quantity)
            {
                var diff    = req.AdjustedQuantity.Value - receipt.Quantity;
                var product = await _context.Products.FindAsync(receipt.ProductId);
                if (product != null)
                {
                    product.StockQuantity += diff;
                    product.UpdatedAt      = DateTime.UtcNow;
                }
                receipt.Quantity    = req.AdjustedQuantity.Value;
                receipt.TotalAmount = receipt.UnitPrice * receipt.Quantity;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã giải quyết khiếu nại." });
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin,Supplier,Seller")]
        public async Task<IActionResult> GetStats()
        {
            var query = _context.SupplierReceipts.AsQueryable();
            if (GetUserRole() == "Supplier")
                query = query.Where(r => r.SupplierId == GetUserId());
            else if (GetUserRole() == "Seller")
                query = query.Where(r => r.SellerId == GetUserId());

            decimal totalRevenue = 0;
            if (GetUserRole() == "Supplier")
            {
                totalRevenue = await _context.SupplierReceipts
                    .Where(r => r.SupplierId == GetUserId() && r.Status == "Confirmed")
                    .SumAsync(r => (decimal?)r.TotalAmount) ?? 0;
            }
            else
            {
                totalRevenue = await query.Where(r => r.Status == "Confirmed").SumAsync(r => (decimal?)r.TotalAmount) ?? 0;
            }

            var stats = new
            {
                total       = await query.CountAsync(),
                pending     = await query.CountAsync(r => r.Status == "Pending" || r.Status == "PendingSupplier" || r.Status == "PendingSeller"),
                confirmed   = await query.CountAsync(r => r.Status == "Confirmed"),
                disputed    = await query.CountAsync(r => r.Status == "Disputed"),
                resolved    = await query.CountAsync(r => r.Status == "Resolved"),
                totalAmount = totalRevenue,
            };

            return Ok(stats);
        }

        [HttpPut("{id}/resolve-dispute")]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> ResolveDispute(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Note))
            {
                return BadRequest("Lý do giải quyết không được để trống.");
            }

            var receipt = await _context.SupplierReceipts
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (receipt == null) return NotFound();

            var userId = GetUserId();
            if (receipt.SupplierId != userId) return Forbid();

            if (receipt.Status != "Disputed")
                return BadRequest("Biên lai không ở trạng thái đang khiếu nại.");

            receipt.Status = "Resolved";
            receipt.SupplierNote = req.Note;
            receipt.ProcessedAt = DateTime.UtcNow;

            var code = $"RC-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
            var newReceipt = new SupplierReceipt
            {
                ReceiptCode = code,
                SupplierId = receipt.SupplierId,
                SellerId = receipt.SellerId,
                ProductId = receipt.ProductId,
                Quantity = receipt.Quantity,
                UnitPrice = receipt.UnitPrice,
                TotalAmount = receipt.TotalAmount,
                Status = receipt.IsFromProposal ? "Pending" : "PendingSupplier",
                AdminNote = $"Biên lai mới được tạo sau khi giải quyết khiếu nại biên lai {receipt.ReceiptCode}. Lý do: {req.Note}",
                IsFromProposal = receipt.IsFromProposal,
                CreatedAt = DateTime.UtcNow
            };

            _context.SupplierReceipts.Add(newReceipt);
            await _context.SaveChangesAsync();

            if (receipt.SellerId.HasValue)
            {
                try
                {
                    await NotificationHelper.NotifyAsync(
                        _context,
                        _hubContext,
                        receipt.SellerId.Value,
                        "receipt_resolved",
                        $"Biên lai {receipt.ReceiptCode} đã được giải quyết",
                        $"Supplier đã xác nhận khiếu nại và tạo biên lai mới {newReceipt.ReceiptCode}. Lý do: {req.Note}"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error sending notification: {ex.Message}");
                }
            }

            return Ok(new { message = "Đã giải quyết khiếu nại và tạo biên lai mới thành công.", newReceiptId = newReceipt.Id, newReceiptCode = newReceipt.ReceiptCode });
        }

        [HttpPut("{id}/reject-dispute")]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> RejectDispute(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Note))
            {
                return BadRequest("Lý do từ chối không được để trống.");
            }

            var receipt = await _context.SupplierReceipts
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (receipt == null) return NotFound();

            var userId = GetUserId();
            if (receipt.SupplierId != userId) return Forbid();

            if (receipt.Status != "Disputed")
                return BadRequest("Biên lai không ở trạng thái đang khiếu nại.");

            receipt.Status = "Cancelled";
            receipt.SupplierNote = req.Note;
            receipt.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (receipt.SellerId.HasValue)
            {
                try
                {
                    await NotificationHelper.NotifyAsync(
                        _context,
                        _hubContext,
                        receipt.SellerId.Value,
                        "receipt_cancelled",
                        $"Biên lai {receipt.ReceiptCode} đã bị hủy khiếu nại",
                        $"Supplier đã từ chối/hủy khiếu nại cho biên lai {receipt.ReceiptCode} với lý do: {req.Note}"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error sending notification: {ex.Message}");
                }
            }

            return Ok(new { message = "Đã hủy biên lai khiếu nại." });
        }
    }

    public class CreateReceiptRequest
    {
        public int     SupplierId { get; set; }
        public int     ProductId  { get; set; }
        public int     Quantity   { get; set; }
        public decimal UnitPrice  { get; set; }
        public string? AdminNote  { get; set; }
    }

    public class SupplierReceiptReplyRequest
    {
        public string? Note { get; set; }
    }

    public class AdminResolveRequest
    {
        public string? AdminNote         { get; set; }
        public int?    AdjustedQuantity  { get; set; }
    }
}

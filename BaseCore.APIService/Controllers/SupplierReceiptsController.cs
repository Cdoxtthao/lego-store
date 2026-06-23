using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupplierReceiptsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SupplierReceiptsController(AppDbContext context)
            => _context = context;

        private int GetUserId()
            => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private string GetUserRole()
            => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierReceipts
        // Admin: xem tất cả biên lai. Supplier: chỉ thấy biên lai của mình.
        // ─────────────────────────────────────────────────────────────────────
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

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierReceipts/{id}
        // ─────────────────────────────────────────────────────────────────────
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

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/SupplierReceipts
        // Admin tạo biên lai khi nhận hàng thực tế từ Supplier.
        // Ngay khi tạo, tồn kho sản phẩm được cập nhật.
        // ─────────────────────────────────────────────────────────────────────
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
                SellerId       = GetUserId(), // Logged in Seller
                ProductId      = req.ProductId,
                Quantity       = req.Quantity,
                UnitPrice      = req.UnitPrice,
                TotalAmount    = total,
                Status         = "PendingSupplier", // Seller requested, Supplier action pending
                AdminNote      = req.AdminNote,
                IsFromProposal = false,
                CreatedAt      = DateTime.UtcNow
            };

            _context.SupplierReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo yêu cầu biên lai thành công. Đang chờ Supplier xác nhận.", id = receipt.Id, code });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierReceipts/{id}/confirm
        // Supplier xác nhận biên lai (đồng ý với thông tin biên lai)
        // ─────────────────────────────────────────────────────────────────────
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
                // Proposal flow: Seller confirms
                if (userRole != "Seller" || receipt.SellerId != userId)
                    return Forbid();

                if (receipt.Status != "Pending")
                    return BadRequest("Biên lai không ở trạng thái chờ xác nhận.");

                receipt.Status       = "Confirmed";
                receipt.ProcessedAt  = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(req.Note))
                    receipt.SupplierNote = req.Note; // or SellerNote

                // Update linked proposal status to Completed
                var proposal = await _context.SupplierProposals.FirstOrDefaultAsync(p => p.ReceiptId == receipt.Id);
                if (proposal != null)
                {
                    proposal.Status = "Completed";
                    proposal.ProcessedAt = DateTime.UtcNow;
                }

                // Increase stock
                receipt.Product.StockQuantity += receipt.Quantity;
                receipt.Product.UpdatedAt = DateTime.UtcNow;

                // Import price update
                var product = receipt.Product;
                var oldQty = product.StockQuantity - receipt.Quantity;
                var newQty = receipt.Quantity;
                product.ImportPrice = (oldQty + newQty) > 0
                    ? (product.ImportPrice * oldQty + receipt.UnitPrice * newQty) / (oldQty + newQty)
                    : receipt.UnitPrice;

                // Add StockBatch
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
                // Request flow: Seller requested, Supplier ships, Seller confirms
                if (receipt.Status == "PendingSupplier")
                {
                    // Supplier confirms they are shipping
                    if (userRole != "Supplier" || receipt.SupplierId != userId)
                        return Forbid();

                    receipt.Status = "PendingSeller";
                    receipt.ProcessedAt = DateTime.UtcNow;
                    if (!string.IsNullOrEmpty(req.Note))
                        receipt.SupplierNote = req.Note;
                }
                else if (receipt.Status == "PendingSeller")
                {
                    // Seller confirms they received the items
                    if (userRole != "Seller" || receipt.SellerId != userId)
                        return Forbid();

                    receipt.Status = "Confirmed";
                    receipt.ProcessedAt = DateTime.UtcNow;

                    // Increase stock
                    receipt.Product.StockQuantity += receipt.Quantity;
                    receipt.Product.UpdatedAt = DateTime.UtcNow;

                    // Import price update
                    var product = receipt.Product;
                    var oldQty = product.StockQuantity - receipt.Quantity;
                    var newQty = receipt.Quantity;
                    product.ImportPrice = (oldQty + newQty) > 0
                        ? (product.ImportPrice * oldQty + receipt.UnitPrice * newQty) / (oldQty + newQty)
                        : receipt.UnitPrice;

                    // Add StockBatch
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

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierReceipts/{id}/dispute
        // Supplier khiếu nại sai lệch thông tin biên lai
        // ─────────────────────────────────────────────────────────────────────
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

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierReceipts/{id}/resolve
        // Admin giải quyết khiếu nại của Supplier
        // ─────────────────────────────────────────────────────────────────────
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

            // Nếu Admin điều chỉnh số lượng sau khi khiếu nại
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

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierReceipts/stats
        // Thống kê tóm tắt cho Supplier Dashboard
        // ─────────────────────────────────────────────────────────────────────
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
    }

    // ─── Request DTOs ────────────────────────────────────────────────────────

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

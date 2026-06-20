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
        [Authorize(Roles = "Admin,Supplier")]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.SupplierReceipts
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .AsQueryable();

            // Supplier chỉ thấy biên lai của chính mình
            if (GetUserRole() == "Supplier")
                query = query.Where(r => r.SupplierId == GetUserId());

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
                })
                .ToListAsync();

            return Ok(list);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierReceipts/{id}
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Supplier")]
        public async Task<IActionResult> GetById(int id)
        {
            var receipt = await _context.SupplierReceipts
                .Include(r => r.Product)
                .Include(r => r.Supplier)
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
                })
                .FirstOrDefaultAsync();

            if (receipt == null) return NotFound();

            // Supplier chỉ được xem biên lai của mình
            if (GetUserRole() == "Supplier" && receipt.SupplierId != GetUserId())
                return Forbid();

            return Ok(receipt);
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/SupplierReceipts
        // Admin tạo biên lai khi nhận hàng thực tế từ Supplier.
        // Ngay khi tạo, tồn kho sản phẩm được cập nhật.
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateReceiptRequest req)
        {
            // Kiểm tra Supplier tồn tại (phải là User role Supplier)
            var supplier = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == req.SupplierId);
            if (supplier == null) return BadRequest("Supplier không tồn tại.");

            // Kiểm tra sản phẩm tồn tại
            var product = await _context.Products.FindAsync(req.ProductId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");

            var code = $"RC-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
            var total = req.Quantity * req.UnitPrice;

            var receipt = new SupplierReceipt
            {
                ReceiptCode  = code,
                SupplierId   = req.SupplierId,
                ProductId    = req.ProductId,
                Quantity     = req.Quantity,
                UnitPrice    = req.UnitPrice,
                TotalAmount  = total,
                Status       = "Pending",
                AdminNote    = req.AdminNote,
            };

            _context.SupplierReceipts.Add(receipt);

            // Cập nhật tồn kho ngay khi Admin xác nhận đã nhận hàng
            product.StockQuantity += req.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            // Ghi lô hàng vào StockBatches để truy xuất nguồn gốc
            _context.StockBatches.Add(new StockBatch
            {
                ProductId  = req.ProductId,
                BatchCode  = $"LOT-{code}",
                Quantity   = req.Quantity,
                CostPrice  = req.UnitPrice,
                SupplierId = req.SupplierId,
                ImportDate = DateTime.UtcNow,
                Note       = $"Từ biên lai {code}",
                Status     = "Active",
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo biên lai thành công", id = receipt.Id, code });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierReceipts/{id}/confirm
        // Supplier xác nhận biên lai (đồng ý với thông tin biên lai)
        // ─────────────────────────────────────────────────────────────────────
        [HttpPut("{id}/confirm")]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> Confirm(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            var receipt = await _context.SupplierReceipts.FindAsync(id);
            if (receipt == null) return NotFound();
            if (receipt.SupplierId != GetUserId()) return Forbid();
            if (receipt.Status != "Pending")
                return BadRequest("Biên lai không ở trạng thái chờ xác nhận.");

            receipt.Status       = "Confirmed";
            receipt.SupplierNote = req.Note;
            receipt.ProcessedAt  = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xác nhận biên lai." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierReceipts/{id}/dispute
        // Supplier khiếu nại sai lệch thông tin biên lai
        // ─────────────────────────────────────────────────────────────────────
        [HttpPut("{id}/dispute")]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> Dispute(int id, [FromBody] SupplierReceiptReplyRequest req)
        {
            var receipt = await _context.SupplierReceipts.FindAsync(id);
            if (receipt == null) return NotFound();
            if (receipt.SupplierId != GetUserId()) return Forbid();
            if (receipt.Status != "Pending")
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
        [Authorize(Roles = "Admin,Supplier")]
        public async Task<IActionResult> GetStats()
        {
            var query = _context.SupplierReceipts.AsQueryable();
            if (GetUserRole() == "Supplier")
                query = query.Where(r => r.SupplierId == GetUserId());

            var stats = new
            {
                total       = await query.CountAsync(),
                pending     = await query.CountAsync(r => r.Status == "Pending"),
                confirmed   = await query.CountAsync(r => r.Status == "Confirmed"),
                disputed    = await query.CountAsync(r => r.Status == "Disputed"),
                resolved    = await query.CountAsync(r => r.Status == "Resolved"),
                totalAmount = await query.Where(r => r.Status == "Confirmed").SumAsync(r => (decimal?)r.TotalAmount) ?? 0,
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

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
    public class SupplierProposalsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SupplierProposalsController(AppDbContext context)
            => _context = context;

        private int GetUserId()
            => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private string GetUserRole()
            => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierProposals
        // Admin: xem tất cả đề nghị. Supplier: chỉ thấy đề nghị của mình.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet]
        [Authorize(Roles = "Admin,Supplier,Seller")]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.SupplierProposals
                .Include(p => p.Product)
                .Include(p => p.Supplier)
                .Include(p => p.Seller)
                .AsQueryable();

            if (GetUserRole() == "Supplier")
                query = query.Where(p => p.SupplierId == GetUserId());
            else if (GetUserRole() == "Seller")
                query = query.Where(p => p.SellerId == GetUserId());

            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.Status == status);

            var list = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.ProposalCode,
                    p.SupplierId,
                    supplierName      = p.Supplier.FullName,
                    p.ProductId,
                    productName       = p.Product.Name,
                    productImage      = p.Product.ImageUrl,
                    p.ProposedQuantity,
                    p.ProposedUnitPrice,
                    totalEstimate     = p.ProposedQuantity * p.ProposedUnitPrice,
                    p.Status,
                    p.SupplierNote,
                    p.AdminNote,
                    p.EstimatedDelivery,
                    p.CreatedAt,
                    p.ProcessedAt,
                    p.ReceiptId,
                    p.SellerId,
                    sellerName        = p.Seller != null ? p.Seller.FullName : ""
                })
                .ToListAsync();

            return Ok(list);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierProposals/{id}
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Supplier,Seller")]
        public async Task<IActionResult> GetById(int id)
        {
            var proposal = await _context.SupplierProposals
                .Include(p => p.Product)
                .Include(p => p.Supplier)
                .Include(p => p.Seller)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.ProposalCode,
                    p.SupplierId,
                    supplierName      = p.Supplier.FullName,
                    p.ProductId,
                    productName       = p.Product.Name,
                    productImage      = p.Product.ImageUrl,
                    p.ProposedQuantity,
                    p.ProposedUnitPrice,
                    totalEstimate     = p.ProposedQuantity * p.ProposedUnitPrice,
                    p.Status,
                    p.SupplierNote,
                    p.AdminNote,
                    p.EstimatedDelivery,
                    p.CreatedAt,
                    p.ProcessedAt,
                    p.ReceiptId,
                    p.SellerId,
                    sellerName        = p.Seller != null ? p.Seller.FullName : ""
                })
                .FirstOrDefaultAsync();

            if (proposal == null) return NotFound();

            if (GetUserRole() == "Supplier" && proposal.SupplierId != GetUserId())
                return Forbid();
            if (GetUserRole() == "Seller" && proposal.SellerId != GetUserId())
                return Forbid();

            return Ok(proposal);
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/SupplierProposals
        // Supplier tạo đề nghị cung ứng hàng mới gửi lên Admin
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> Create([FromBody] CreateProposalRequest req)
        {
            var product = await _context.Products.FindAsync(req.ProductId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");

            var seller = await _context.Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == req.SellerId && u.Role.Name == "Seller");
            if (seller == null) return BadRequest("Seller không tồn tại.");

            var code = $"PRP-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
            var receiptCode = $"RC-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";

            // Automatically create a corresponding SupplierReceipt in "Pending" status
            var receipt = new SupplierReceipt
            {
                ReceiptCode    = receiptCode,
                SupplierId     = GetUserId(),
                SellerId       = req.SellerId,
                ProductId      = req.ProductId,
                Quantity       = req.ProposedQuantity,
                UnitPrice      = req.ProposedUnitPrice,
                TotalAmount    = req.ProposedQuantity * req.ProposedUnitPrice,
                Status         = "Pending",
                AdminNote      = req.SupplierNote ?? "Đề nghị cung ứng",
                IsFromProposal = true,
                CreatedAt      = DateTime.UtcNow
            };
            _context.SupplierReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            var proposal = new SupplierProposal
            {
                ProposalCode      = code,
                SupplierId        = GetUserId(),
                SellerId          = req.SellerId,
                ProductId         = req.ProductId,
                ProposedQuantity  = req.ProposedQuantity,
                ProposedUnitPrice = req.ProposedUnitPrice,
                SupplierNote      = req.SupplierNote,
                EstimatedDelivery = req.EstimatedDelivery,
                Status            = "Pending",
                ReceiptId         = receipt.Id,
                CreatedAt         = DateTime.UtcNow
            };

            _context.SupplierProposals.Add(proposal);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gửi đề nghị thành công đến Seller.", id = proposal.Id, code, receiptId = receipt.Id });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierProposals/{id}/approve
        // Admin duyệt đề nghị của Supplier
        // ─────────────────────────────────────────────────────────────────────
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id, [FromBody] ProcessProposalRequest req)
        {
            var proposal = await _context.SupplierProposals.FindAsync(id);
            if (proposal == null) return NotFound();
            if (proposal.Status != "Pending")
                return BadRequest("Đề nghị không ở trạng thái chờ duyệt.");

            proposal.Status      = "Approved";
            proposal.AdminNote   = req.AdminNote;
            proposal.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã phê duyệt đề nghị. Supplier có thể chuẩn bị giao hàng." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PUT /api/SupplierProposals/{id}/reject
        // Admin từ chối đề nghị của Supplier
        // ─────────────────────────────────────────────────────────────────────
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id, [FromBody] ProcessProposalRequest req)
        {
            var proposal = await _context.SupplierProposals.FindAsync(id);
            if (proposal == null) return NotFound();
            if (proposal.Status != "Pending")
                return BadRequest("Đề nghị không ở trạng thái chờ duyệt.");

            proposal.Status      = "Rejected";
            proposal.AdminNote   = req.AdminNote;
            proposal.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã từ chối đề nghị." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/SupplierProposals/{id}/complete
        // Admin hoàn tất đề nghị: tạo biên lai nhận hàng chính thức.
        // Khi gọi endpoint này, hệ thống tự tạo SupplierReceipt + cập nhật kho.
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("{id}/complete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Complete(int id, [FromBody] CompleteProposalRequest req)
        {
            var proposal = await _context.SupplierProposals.FindAsync(id);
            if (proposal == null) return NotFound();
            if (proposal.Status != "Approved")
                return BadRequest("Chỉ có thể hoàn tất đề nghị đã được duyệt.");

            var product = await _context.Products.FindAsync(proposal.ProductId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");

            // Số lượng thực nhận (Admin điền khi hàng đến), mặc định dùng theo đề nghị
            var actualQty   = req.ActualQuantity ?? proposal.ProposedQuantity;
            var actualPrice = req.ActualUnitPrice ?? proposal.ProposedUnitPrice;
            var receiptCode = $"RC-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";

            // Tạo biên lai
            var receipt = new SupplierReceipt
            {
                ReceiptCode = receiptCode,
                SupplierId  = proposal.SupplierId,
                ProductId   = proposal.ProductId,
                Quantity    = actualQty,
                UnitPrice   = actualPrice,
                TotalAmount = actualQty * actualPrice,
                Status      = "Pending",   // Supplier sẽ vào xác nhận
                AdminNote   = req.AdminNote ?? $"Từ đề nghị {proposal.ProposalCode}",
            };

            _context.SupplierReceipts.Add(receipt);

            // Cập nhật tồn kho
            product.StockQuantity += actualQty;
            product.UpdatedAt      = DateTime.UtcNow;

            // Ghi lô hàng vào StockBatches
            _context.StockBatches.Add(new StockBatch
            {
                ProductId  = proposal.ProductId,
                BatchCode  = $"LOT-{receiptCode}",
                Quantity   = actualQty,
                CostPrice  = actualPrice,
                SupplierId = proposal.SupplierId,
                ImportDate = DateTime.UtcNow,
                Note       = $"Từ đề nghị {proposal.ProposalCode}",
                Status     = "Active",
            });

            // Cập nhật đề nghị sang hoàn tất
            proposal.Status      = "Completed";
            proposal.ProcessedAt = DateTime.UtcNow;
            proposal.ReceiptId   = receipt.Id;

            await _context.SaveChangesAsync();

            // Gán ReceiptId vào proposal sau khi SaveChanges tạo ID
            proposal.ReceiptId = receipt.Id;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Hoàn tất đề nghị, đã tạo biên lai & cập nhật kho.", receiptId = receipt.Id, receiptCode });
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/SupplierProposals/stats
        // Thống kê tóm tắt cho Supplier Dashboard
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("stats")]
        [Authorize(Roles = "Admin,Supplier")]
        public async Task<IActionResult> GetStats()
        {
            var query = _context.SupplierProposals.AsQueryable();
            if (GetUserRole() == "Supplier")
                query = query.Where(p => p.SupplierId == GetUserId());

            var stats = new
            {
                total     = await query.CountAsync(),
                pending   = await query.CountAsync(p => p.Status == "Pending"),
                approved  = await query.CountAsync(p => p.Status == "Approved"),
                rejected  = await query.CountAsync(p => p.Status == "Rejected"),
                completed = await query.CountAsync(p => p.Status == "Completed"),
            };

            return Ok(stats);
        }

        // ─────────────────────────────────────────────────────────────────────
        // DELETE /api/SupplierProposals/{id}
        // Supplier huỷ đề nghị đang ở trạng thái Pending
        // ─────────────────────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize(Roles = "Supplier")]
        public async Task<IActionResult> Cancel(int id)
        {
            var proposal = await _context.SupplierProposals.FindAsync(id);
            if (proposal == null) return NotFound();
            if (proposal.SupplierId != GetUserId()) return Forbid();
            if (proposal.Status != "Pending")
                return BadRequest("Chỉ có thể huỷ đề nghị đang chờ duyệt.");

            _context.SupplierProposals.Remove(proposal);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã huỷ đề nghị." });
        }
    }

    // ─── Request DTOs ────────────────────────────────────────────────────────

    public class CreateProposalRequest
    {
        public int       ProductId         { get; set; }
        public int       ProposedQuantity  { get; set; }
        public decimal   ProposedUnitPrice { get; set; }
        public string?   SupplierNote      { get; set; }
        public DateTime? EstimatedDelivery { get; set; }
        public int       SellerId          { get; set; }
    }

    public class ProcessProposalRequest
    {
        public string? AdminNote { get; set; }
    }

    public class CompleteProposalRequest
    {
        public int?    ActualQuantity  { get; set; }
        public decimal? ActualUnitPrice { get; set; }
        public string? AdminNote       { get; set; }
    }
}

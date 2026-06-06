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
    public class ReturnItemsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReturnItemsController(AppDbContext context) => _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Admin/Supplier xem tất cả
        [Authorize(Roles = "Admin,Supplier")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var returns = await _context.ReturnItems
                .Include(r => r.Product)
                .Include(r => r.Order)
                    .ThenInclude(o => o.User)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.OrderId,
                    r.ProductId,
                    productName = r.Product.Name,
                    customerName = r.Order.User.FullName,
                    r.Quantity,
                    r.Reason,
                    r.Status,
                    r.CreatedAt,
                    r.UpdatedAt,
                })
                .ToListAsync();
            return Ok(returns);
        }

        // User tạo yêu cầu trả hàng
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReturnItemRequest request)
        {
            // Kiểm tra đơn hàng thuộc về user
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId
                    && o.UserId == GetUserId()
                    && o.Status == "Delivered");

            if (order == null)
                return BadRequest(new { message = "Không tìm thấy đơn hàng hoặc đơn chưa được giao" });

            var orderItem = order.OrderItems
                .FirstOrDefault(oi => oi.ProductId == request.ProductId);

            if (orderItem == null)
                return BadRequest(new { message = "Sản phẩm không có trong đơn hàng" });

            if (request.Quantity > orderItem.Quantity)
                return BadRequest(new { message = "Số lượng trả vượt quá số lượng đã mua" });

            var returnItem = new ReturnItem
            {
                OrderId = request.OrderId,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                Reason = request.Reason,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _context.ReturnItems.Add(returnItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Gửi yêu cầu trả hàng thành công", id = returnItem.Id });
        }

        // Admin/Supplier cập nhật trạng thái
        [Authorize(Roles = "Admin,Supplier")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReturnRequest request)
        {
            var returnItem = await _context.ReturnItems
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (returnItem == null) return NotFound();

            var oldStatus = returnItem.Status;
            returnItem.Status = request.Status;
            returnItem.ProcessedBy = GetUserId();
            returnItem.UpdatedAt = DateTime.UtcNow;

            // Nếu duyệt → hoàn lại tồn kho
            if (request.Status == "Approved" && oldStatus != "Approved")
            {
                var product = await _context.Products.FindAsync(returnItem.ProductId);
                if (product != null)
                {
                    product.StockQuantity += returnItem.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }
    }

    public class ReturnItemRequest
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateReturnRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
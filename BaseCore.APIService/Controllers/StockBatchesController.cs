using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Supplier")]
    public class StockBatchesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public StockBatchesController(AppDbContext context) => _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var batches = await _context.StockBatches
                .Include(b => b.Product)
                .OrderByDescending(b => b.ImportDate)
                .Select(b => new
                {
                    b.Id,
                    b.BatchCode,
                    b.ProductId,
                    productName = b.Product.Name,
                    productImage = b.Product.ImageUrl,
                    b.Quantity,
                    b.CostPrice,
                    b.ImportDate,
                    b.ExpiryDate,
                    b.Note,
                    b.Status,
                })
                .ToListAsync();
            return Ok(batches);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StockBatchRequest request)
        {
            var batch = new StockBatch
            {
                ProductId = request.ProductId,
                BatchCode = request.BatchCode ?? $"LOT-{DateTime.Now:yyyyMMddHHmmss}",
                Quantity = request.Quantity,
                CostPrice = request.CostPrice,
                SupplierId = GetUserId(),
                ImportDate = DateTime.UtcNow,
                Note = request.Note,
                Status = "Active",
            };
            _context.StockBatches.Add(batch);

            // Cập nhật tồn kho
            var product = await _context.Products.FindAsync(request.ProductId);
            if (product != null)
            {
                product.StockQuantity += request.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Nhập kho thành công", id = batch.Id });
        }
    }

    public class StockBatchRequest
    {
        public int ProductId { get; set; }
        public string? BatchCode { get; set; }
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public string? Note { get; set; }
    }
}
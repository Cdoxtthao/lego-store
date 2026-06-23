using BaseCore.DTO.Request;
using BaseCore.Entities;
using BaseCore.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _service;
        private readonly AppDbContext _context;
        public ProductsController(IProductService service, AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ProductSearchRequest request)
        {
            var result = await _service.GetAllAsync(request);
            var now = DateTime.UtcNow;
            var activePromotion = await _context.Promotions
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .OrderByDescending(p => p.DiscountPercent)
                .FirstOrDefaultAsync();
            if (activePromotion != null)
            {
                foreach (var item in result.Items)
                {
                    if (!item.OldPrice.HasValue || item.OldPrice == 0)
                        item.OldPrice = item.Price;
                    item.Price = Math.Round(item.OldPrice.Value * (1 - activePromotion.DiscountPercent / 100m), 0);
                    item.DiscountPercent = activePromotion.DiscountPercent;
                }
            }
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeatured([FromQuery] int count = 8)
        {
            var result = await _service.GetFeaturedAsync(count);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();

            var now = DateTime.UtcNow;
            var activePromotion = await _context.Promotions
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .OrderByDescending(p => p.DiscountPercent)
                .FirstOrDefaultAsync();
            if (activePromotion != null)
            {
                if (!result.OldPrice.HasValue || result.OldPrice == 0)
                    result.OldPrice = result.Price;
                result.Price = Math.Round(result.OldPrice.Value * (1 - activePromotion.DiscountPercent / 100m), 0);
                result.DiscountPercent = activePromotion.DiscountPercent;
            }
            return Ok(result);
        }

        //POST
        [Authorize(Roles = "Admin,Seller")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
        {
            if (User.IsInRole("Seller"))
            {
                request.StockQuantity = 0;
            }
            // Chủ đề (nếu chọn) phải đang được liên kết với danh mục đã chọn,
            // nếu không sản phẩm sẽ không xuất hiện đúng trong menu danh mục -> chủ đề trên Web
            if (request.ThemeId.HasValue)
            {
                var linked = await _context.CategoryThemes.AnyAsync(ct =>
                    ct.CategoryId == request.CategoryId && ct.ThemeId == request.ThemeId.Value);
                if (!linked)
                    return BadRequest(new { message = "Chủ đề đã chọn không thuộc danh mục này" });
            }

            var result = await _service.CreateAsync(request);

            // Lưu ảnh bổ sung nếu có
            if (request.Images?.Any() == true)
            {
                foreach (var (url, i) in request.Images.Select((url, i) => (url, i)))
                {
                    _context.ProductImages.Add(new ProductImage
                    {
                        ProductId = result.Id,
                        ImageUrl = url,
                        IsMain = i == 0,
                        SortOrder = i,
                    });
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        //PUT
        [Authorize(Roles = "Admin,Seller,Supplier")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
        {
            if (User.IsInRole("Supplier") || User.IsInRole("Seller"))
            {
                request.StockQuantity = null;
            }

            // Chủ đề (nếu đổi) phải đang được liên kết với danh mục hiện tại (hoặc danh mục mới nếu đổi cả 2)
            if (request.ThemeId.HasValue)
            {
                var existing = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
                var effectiveCategoryId = request.CategoryId ?? existing?.CategoryId;
                if (effectiveCategoryId.HasValue)
                {
                    var linked = await _context.CategoryThemes.AnyAsync(ct =>
                        ct.CategoryId == effectiveCategoryId.Value && ct.ThemeId == request.ThemeId.Value);
                    if (!linked)
                        return BadRequest(new { message = "Chủ đề đã chọn không thuộc danh mục này" });
                }
            }

            var result = await _service.UpdateAsync(id, request);

            // Cập nhật ảnh bổ sung
            if (request.Images != null)
            {
                // Xóa ảnh cũ
                var oldImages = _context.ProductImages
                    .Where(pi => pi.ProductId == id);
                _context.ProductImages.RemoveRange(oldImages);

                // Thêm ảnh mới
                foreach (var (url, i) in request.Images.Select((url, i) => (url, i)))
                {
                    _context.ProductImages.Add(new ProductImage
                    {
                        ProductId = id,
                        ImageUrl = url,
                        IsMain = i == 0,
                        SortOrder = i,
                    });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(result);
        }

        //DELETE
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound(200);
            return Ok(new { message = "Xoa thanh cong" });
        }

    }
}

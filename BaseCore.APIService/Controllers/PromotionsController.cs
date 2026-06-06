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
    public class PromotionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PromotionsController(AppDbContext context) => _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var promotions = await _context.Promotions
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.DiscountPercent,
                    p.StartDate,
                    p.EndDate,
                    p.IsActive,
                    p.CreatedAt,
                })
                .ToListAsync();
            return Ok(promotions);
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PromotionRequest request)
        {
            var promotion = new Promotion
            {
                Name = request.Name,
                Description = request.Description,
                DiscountPercent = request.DiscountPercent,
                StartDate = DateTime.Parse(request.StartDate),
                EndDate = DateTime.Parse(request.EndDate),
                IsActive = request.IsActive,
                CreatedBy = GetUserId(),
            };
            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo khuyến mãi thành công", id = promotion.Id });
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PromotionRequest request)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound();

            promotion.Name = request.Name;
            promotion.Description = request.Description;
            promotion.DiscountPercent = request.DiscountPercent;
            promotion.StartDate = DateTime.Parse(request.StartDate);
            promotion.EndDate = DateTime.Parse(request.EndDate);
            promotion.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound();
            promotion.IsActive = !promotion.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật trạng thái thành công" });
        }

        [Authorize(Roles = "Admin,Seller")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound();
            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa thành công" });
        }
    }

    public class PromotionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DiscountPercent { get; set; }
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
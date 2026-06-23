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
    public class WishlistController : ControllerBase
    {
        private readonly AppDbContext _context;
        public WishlistController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET api/wishlist
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var items = await _context.Wishlists
                .Include(w => w.Product)
                    .ThenInclude(p => p.Category)
                .Include(w => w.Product)
                    .ThenInclude(p => p.Reviews)
                .Where(w => w.UserId == GetUserId())
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var activePromotion = await _context.Promotions
                .Where(p => p.IsActive && p.StartDate <= now && p.EndDate >= now)
                .OrderByDescending(p => p.DiscountPercent)
                .FirstOrDefaultAsync();

            var response = items.Select(w => {
                var price = w.Product.Price;
                var oldPrice = w.Product.OldPrice;

                if (activePromotion != null)
                {
                    if (!oldPrice.HasValue || oldPrice == 0)
                        oldPrice = price;
                    price = Math.Round(oldPrice.Value * (1 - activePromotion.DiscountPercent / 100m), 0);
                }

                var discountPercent = oldPrice.HasValue && oldPrice > 0
                    ? (int)Math.Round((1 - (double)price / (double)oldPrice.Value) * 100)
                    : (int?)null;

                return new
                {
                    id = w.Id,
                    productId = w.ProductId,
                    productName = w.Product.Name,
                    productImage = w.Product.ImageUrl,
                    price = price,
                    oldPrice = oldPrice,
                    categoryName = w.Product.Category?.Name,
                    theme = w.Product.Theme,
                    isFeatured = w.Product.IsFeatured,
                    stockQuantity = w.Product.StockQuantity,
                    averageRating = w.Product.Reviews.Any()
                        ? w.Product.Reviews.Average(r => r.Rating) : 0,
                    reviewCount = w.Product.Reviews.Count,
                    discountPercent = discountPercent,
                    createdAt = w.CreatedAt,
                };
            }).ToList();

            return Ok(response);
        }

        // POST api/wishlist/{productId}
        [HttpPost("{productId}")]
        public async Task<IActionResult> AddToWishlist(int productId)
        {
            var exists = await _context.Wishlists
                .AnyAsync(w => w.UserId == GetUserId() && w.ProductId == productId);

            if (exists)
                return BadRequest(new { message = "Sản phẩm đã có trong wishlist" });

            var wishlist = new Wishlist
            {
                UserId = GetUserId(),
                ProductId = productId,
            };

            _context.Wishlists.Add(wishlist);
            await _context.SaveChangesAsync();

            var count = await _context.Wishlists.CountAsync(w => w.UserId == GetUserId());
            return Ok(new { message = "Đã thêm vào yêu thích", count });
        }

        // DELETE api/wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var item = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == GetUserId() && w.ProductId == productId);

            if (item == null) return NotFound();

            _context.Wishlists.Remove(item);
            await _context.SaveChangesAsync();

            var count = await _context.Wishlists.CountAsync(w => w.UserId == GetUserId());
            return Ok(new { message = "Đã xóa khỏi yêu thích", count });
        }

        // GET api/wishlist/check/{productId}
        [HttpGet("check/{productId}")]
        public async Task<IActionResult> CheckWishlist(int productId)
        {
            var userId = GetUserId();
            var items = await _context.Wishlists
                .Where(w => w.UserId == userId)
                .Select(w => w.ProductId)
                .ToListAsync();

            return Ok(new
            {
                isWishlisted = items.Contains(productId),
                count = items.Count
            });
        }

        // GET api/wishlist/count
        [HttpGet("count")]
        public async Task<IActionResult> GetCount()
        {
            var count = await _context.Wishlists.CountAsync(w => w.UserId == GetUserId());
            return Ok(new { count });
        }
    }
}
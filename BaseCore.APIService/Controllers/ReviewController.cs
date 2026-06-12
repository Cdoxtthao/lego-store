using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IProductRepository _productRepo;
        private readonly AppDbContext _context;

        public ReviewsController(
            IReviewRepository reviewRepo,
            IProductRepository productRepo,
            AppDbContext context)
        {
            _reviewRepo = reviewRepo;
            _productRepo = productRepo;
            _context = context;
        }

        // GET api/reviews/product/5
        [AllowAnonymous]
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var reviews = await _reviewRepo.GetByProductIdAsync(productId);
            var response = reviews.Select(r => new ReviewResponse
            {
                Id = r.Id,
                UserName = r.User.FullName,
                UserAvatar = r.User.AvatarUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt,
            });
            return Ok(response);
        }

        // POST api/reviews
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            // Đếm số lần đã mua và nhận hàng thành công
            var purchaseCount = await _context.OrderItems
                .Include(oi => oi.Order)
                .CountAsync(oi =>
                    oi.ProductId == request.ProductId &&
                    oi.Order.UserId == userId &&
                    oi.Order.Status == "Delivered");

            // Đếm số lần đã đánh giá
            var reviewCount = await _context.Reviews
                .CountAsync(r => r.ProductId == request.ProductId && r.UserId == userId);

            if (purchaseCount == 0)
                return BadRequest(new { message = "Bạn cần mua và nhận sản phẩm này trước khi đánh giá" });

            if (reviewCount >= purchaseCount)
                return BadRequest(new { message = "Bạn đã đánh giá sản phẩm này tương đương số lần mua rồi" });

            var review = new Review
            {
                ProductId = request.ProductId,
                UserId = userId,
                Rating = request.Rating,
                Comment = request.Comment,
            };

            var created = await _reviewRepo.AddAsync(review);
            return Ok(new { message = "Đánh giá thành công", id = created.Id });
        }

        // GET api/reviews/can-review/{productId}
        [Authorize]
        [HttpGet("can-review/{productId}")]
        public async Task<IActionResult> CanReview(int productId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            var purchaseCount = await _context.OrderItems
                .Include(oi => oi.Order)
                .CountAsync(oi =>
                    oi.ProductId == productId &&
                    oi.Order.UserId == userId &&
                    oi.Order.Status == "Delivered");

            var reviewCount = await _context.Reviews
                .CountAsync(r => r.ProductId == productId && r.UserId == userId);

            return Ok(new
            {
                canReview = purchaseCount > reviewCount,
                hasPurchased = purchaseCount > 0,
                hasReviewed = reviewCount >= purchaseCount,
            });
        }
    }
}
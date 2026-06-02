using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IProductRepository _productRepo;

        public ReviewsController(
            IReviewRepository reviewRepo,
            IProductRepository productRepo)
        {
            _reviewRepo = reviewRepo;
            _productRepo = productRepo;
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

            // Kiểm tra đã review chưa
            var hasReviewed = await _reviewRepo.HasUserReviewedAsync(userId, request.ProductId);
            if (hasReviewed)
                return BadRequest(new { message = "Bạn đã đánh giá sản phẩm này rồi" });

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
    }
}
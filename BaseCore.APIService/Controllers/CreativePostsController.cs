using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CreativePostsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CreativePostsController(AppDbContext context) { _context = context; }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET api/creativeposts — ai cũng xem được (blog chia sẻ)
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            int? me = User?.FindFirst(ClaimTypes.NameIdentifier) is { } c ? int.Parse(c.Value) : null;
            bool isAdmin = User?.IsInRole("Admin") ?? false;

            var posts = await _context.CreativePosts
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    userName = p.User.FullName,
                    userAvatar = p.User.AvatarUrl,
                    content = p.Content,
                    imageUrl = p.ImageUrl,
                    createdAt = p.CreatedAt,
                    canEdit = (me != null && p.UserId == me) || isAdmin,
                })
                .ToListAsync();
            return Ok(posts);
        }

        public class CreativePostRequest
        {
            public string Content { get; set; } = string.Empty;
            public string? ImageUrl { get; set; }
        }

        // POST api/creativeposts — gửi bài (cần đăng nhập)
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreativePostRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                return BadRequest(new { message = "Nội dung không được để trống" });

            var post = new CreativePost
            {
                UserId = GetUserId(),
                Content = req.Content.Trim(),
                ImageUrl = req.ImageUrl,
                CreatedAt = DateTime.UtcNow,
            };
            _context.CreativePosts.Add(post);
            await _context.SaveChangesAsync();
            return Ok(new { id = post.Id, message = "Đã đăng bài" });
        }

        // PUT api/creativeposts/{id} — chỉ chủ bài mới sửa
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreativePostRequest req)
        {
            var post = await _context.CreativePosts.FindAsync(id);
            if (post == null) return NotFound();
            if (post.UserId != GetUserId()) return Forbid();

            post.Content = req.Content.Trim();
            post.ImageUrl = req.ImageUrl;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã cập nhật" });
        }

        // DELETE api/creativeposts/{id} — chủ bài hoặc admin
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var post = await _context.CreativePosts.FindAsync(id);
            if (post == null) return NotFound();
            if (post.UserId != GetUserId() && !User.IsInRole("Admin")) return Forbid();

            _context.CreativePosts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa" });
        }
    }
}

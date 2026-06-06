using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public ImageController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Không có file" });

            // Kiểm tra định dạng
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG, WebP" });

            // Kiểm tra dung lượng (5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Ảnh không được vượt quá 5MB" });

            // Tạo tên file unique
            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var uploadPath = Path.Combine(_env.WebRootPath, "images", "products");

            // Tạo thư mục nếu chưa có
            Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/images/products/{fileName}";
            return Ok(new { url, message = "Upload thành công" });
        }
    }
}
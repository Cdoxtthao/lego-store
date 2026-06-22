using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThemesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ThemesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/themes?categoryId=1 — public
        // Không truyền categoryId -> trả về toàn bộ chủ đề (dùng cho gợi ý trùng tên ở Admin)
        // Một Theme có thể thuộc nhiều Category (nhiều-nhiều), nên trả về "categories" là 1 danh sách
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? categoryId)
        {
            var query = _context.Themes
                .Include(t => t.CategoryThemes).ThenInclude(ct => ct.Category)
                .Where(t => t.IsActive)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(t => t.CategoryThemes.Any(ct => ct.CategoryId == categoryId.Value));

            var themes = await query
                .OrderBy(t => t.Name)
                .ToListAsync();

            var result = themes.Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                categories = t.CategoryThemes
                    .Where(ct => ct.Category.IsActive)
                    .Select(ct => new { id = ct.CategoryId, name = ct.Category.Name })
                    .OrderBy(c => c.name)
                    .ToList(),
                isActive = t.IsActive,
                createdAt = t.CreatedAt,
            });

            return Ok(result);
        }

        // GET api/themes/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var theme = await _context.Themes
                .Include(t => t.CategoryThemes).ThenInclude(ct => ct.Category)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (theme == null) return NotFound();

            return Ok(new
            {
                id = theme.Id,
                name = theme.Name,
                description = theme.Description,
                categories = theme.CategoryThemes
                    .Where(ct => ct.Category.IsActive)
                    .Select(ct => new { id = ct.CategoryId, name = ct.Category.Name })
                    .OrderBy(c => c.name)
                    .ToList(),
                isActive = theme.IsActive,
                createdAt = theme.CreatedAt,
            });
        }

        // POST api/themes — Admin only
        // Logic gộp theo tên nằm hoàn toàn ở Backend:
        // - Nếu đã có Theme cùng tên (không phân biệt hoa/thường) -> dùng lại Theme đó,
        //   chỉ tạo thêm liên kết với danh mục mới (không tạo Theme trùng)
        // - Nếu chưa có -> tạo Theme mới rồi liên kết với danh mục
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ThemeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Tên chủ đề không được để trống" });

            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId && c.IsActive);
            if (!categoryExists)
                return BadRequest(new { message = "Danh mục không tồn tại" });

            var name = request.Name.Trim();

            var theme = await _context.Themes
                .FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());

            if (theme == null)
            {
                theme = new Theme
                {
                    Name = name,
                    Description = request.Description,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                };
                _context.Themes.Add(theme);
                await _context.SaveChangesAsync();
            }

            var linkExists = await _context.CategoryThemes
                .AnyAsync(ct => ct.CategoryId == request.CategoryId && ct.ThemeId == theme.Id);
            if (linkExists)
                return BadRequest(new { message = "Chủ đề đã tồn tại trong danh mục này" });

            _context.CategoryThemes.Add(new CategoryTheme
            {
                CategoryId = request.CategoryId,
                ThemeId = theme.Id,
                CreatedAt = DateTime.UtcNow,
            });
            await _context.SaveChangesAsync();

            return Ok(new { id = theme.Id, message = "Thêm chủ đề thành công" });
        }

        // PUT api/themes/{id} — Admin only
        // Theme giờ là thực thể chung (có thể thuộc nhiều danh mục), nên sửa Tên/Mô tả
        // sẽ ảnh hưởng tới tất cả danh mục đang dùng chủ đề này. Không còn nhận categoryId ở đây
        // (việc gắn/gỡ theo danh mục dùng POST/ DELETE .../categories/{categoryId}).
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ThemeUpdateRequest request)
        {
            var theme = await _context.Themes.FindAsync(id);
            if (theme == null) return NotFound();

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Tên chủ đề không được để trống" });

            var name = request.Name.Trim();

            var duplicate = await _context.Themes
                .AnyAsync(t => t.Id != id && t.Name.ToLower() == name.ToLower());
            if (duplicate)
                return BadRequest(new { message = "Đã có chủ đề khác cùng tên. Hãy thêm chủ đề có sẵn đó vào danh mục thay vì đổi tên." });

            theme.Name = name;
            theme.Description = request.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật chủ đề thành công" });
        }

        // DELETE api/themes/{id} — Admin only
        // Xóa chủ đề khỏi toàn hệ thống (mọi danh mục đang dùng nó cũng mất liên kết)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var theme = await _context.Themes
                .Include(t => t.Products)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (theme == null) return NotFound();

            if (theme.Products?.Any(p => p.IsActive) == true)
                return BadRequest(new { message = "Không thể xóa chủ đề đang có sản phẩm" });

            _context.Themes.Remove(theme);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa chủ đề thành công" });
        }

        // DELETE api/themes/{themeId}/categories/{categoryId} — Admin only
        // Gỡ chủ đề khỏi MỘT danh mục (không xóa Theme khỏi hệ thống, vẫn còn ở các danh mục khác)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{themeId}/categories/{categoryId}")]
        public async Task<IActionResult> Unlink(int themeId, int categoryId)
        {
            var link = await _context.CategoryThemes
                .FirstOrDefaultAsync(ct => ct.ThemeId == themeId && ct.CategoryId == categoryId);
            if (link == null) return NotFound();

            var hasActiveProducts = await _context.Products
                .AnyAsync(p => p.IsActive && p.CategoryId == categoryId && p.ThemeId == themeId);
            if (hasActiveProducts)
                return BadRequest(new { message = "Không thể gỡ chủ đề: vẫn còn sản phẩm trong danh mục này đang dùng chủ đề này" });

            _context.CategoryThemes.Remove(link);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Gỡ chủ đề khỏi danh mục thành công" });
        }
    }

    public class ThemeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
    }

    public class ThemeUpdateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}

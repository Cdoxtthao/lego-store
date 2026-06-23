using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepo;
        public CategoriesController(ICategoryRepository categoryRepo)
        {
            _categoryRepo = categoryRepo;
        }

        // GET api/categories — public
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryRepo.GetAllAsync();
            var response = categories.Select(c => new
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                imageUrl = c.ImageUrl,
                productCount = c.Products?.Count(p => p.IsActive) ?? 0,
                themeCount = c.CategoryThemes?.Count(ct => ct.Theme.IsActive) ?? 0,
            });
            return Ok(response);
        }

        // POST api/categories — Admin/Seller
        [Authorize(Roles = "Admin,Seller")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryRequest request)
        {
            if (await _categoryRepo.ExistsAsync(request.Name))
                return BadRequest(new { message = "Danh mục đã tồn tại" });

            var category = new Category
            {
                Name = request.Name,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
            };

            var created = await _categoryRepo.AddAsync(category);
            return Ok(new { id = created.Id, message = "Tạo danh mục thành công" });
        }

        // PUT api/categories/{id} — Admin/Seller
        [Authorize(Roles = "Admin,Seller")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
        {
            var category = await _categoryRepo.GetByIdAsync(id);
            if (category == null) return NotFound();

            category.Name = request.Name;
            category.Description = request.Description;
            category.ImageUrl = request.ImageUrl;

            await _categoryRepo.UpdateAsync(category);
            return Ok(new { message = "Cập nhật thành công" });
        }

        // DELETE api/categories/{id} — Admin/Seller
        [Authorize(Roles = "Admin,Seller")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);
            if (category == null) return NotFound();

            if (category.Products?.Any(p => p.IsActive) == true)
                return BadRequest(new { message = "Không thể xóa danh mục đang có sản phẩm" });

            await _categoryRepo.DeleteAsync(id);
            return Ok(new { message = "Xóa thành công" });
        }
    }

    public class CategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }
}
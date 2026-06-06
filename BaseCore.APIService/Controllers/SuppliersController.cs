using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SuppliersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SuppliersController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var suppliers = await _context.Suppliers
                .OrderBy(s => s.CompanyName)
                .Select(s => new
                {
                    s.Id,
                    s.CompanyName,
                    s.ContactName,
                    s.Email,
                    s.PhoneNumber,
                    s.Address,
                    s.IsActive,
                    s.CreatedAt,
                })
                .ToListAsync();
            return Ok(suppliers);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierRequest request)
        {
            var supplier = new Supplier
            {
                CompanyName = request.CompanyName,
                ContactName = request.ContactName,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                IsActive = request.IsActive,
            };
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm đối tác thành công", id = supplier.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierRequest request)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();

            supplier.CompanyName = request.CompanyName;
            supplier.ContactName = request.ContactName;
            supplier.Email = request.Email;
            supplier.PhoneNumber = request.PhoneNumber;
            supplier.Address = request.Address;
            supplier.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();
            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa thành công" });
        }
    }

    public class SupplierRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
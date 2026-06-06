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
    public class AddressController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AddressController(AppDbContext context) => _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET api/address
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var addresses = await _context.Addresses
                .Where(a => a.UserId == GetUserId())
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(addresses.Select(a => new
            {
                a.Id,
                a.ReceiverName,
                a.PhoneNumber,
                a.Province,
                a.District,
                a.Ward,
                a.StreetAddress,
                a.IsDefault,
                fullAddress = a.FullAddress,
            }));
        }

        // POST api/address
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AddressRequest request)
        {
            // Nếu đặt làm mặc định → bỏ mặc định cũ
            if (request.IsDefault)
            {
                var existing = await _context.Addresses
                    .Where(a => a.UserId == GetUserId() && a.IsDefault)
                    .ToListAsync();
                existing.ForEach(a => a.IsDefault = false);
            }

            var address = new Address
            {
                UserId = GetUserId(),
                ReceiverName = request.ReceiverName,
                PhoneNumber = request.PhoneNumber,
                Province = request.Province,
                District = request.District,
                Ward = request.Ward,
                StreetAddress = request.StreetAddress,
                IsDefault = request.IsDefault,
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm địa chỉ thành công", id = address.Id });
        }

        // PUT api/address/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddressRequest request)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == GetUserId());
            if (address == null) return NotFound();

            if (request.IsDefault)
            {
                var existing = await _context.Addresses
                    .Where(a => a.UserId == GetUserId() && a.IsDefault && a.Id != id)
                    .ToListAsync();
                existing.ForEach(a => a.IsDefault = false);
            }

            address.ReceiverName = request.ReceiverName;
            address.PhoneNumber = request.PhoneNumber;
            address.Province = request.Province;
            address.District = request.District;
            address.Ward = request.Ward;
            address.StreetAddress = request.StreetAddress;
            address.IsDefault = request.IsDefault;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        // DELETE api/address/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == GetUserId());
            if (address == null) return NotFound();

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa địa chỉ thành công" });
        }

        // PUT api/address/{id}/default
        [HttpPut("{id}/default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var addresses = await _context.Addresses
                .Where(a => a.UserId == GetUserId())
                .ToListAsync();

            addresses.ForEach(a => a.IsDefault = a.Id == id);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã đặt làm địa chỉ mặc định" });
        }
    }

    public class AddressRequest
    {
        public string ReceiverName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
    }
}
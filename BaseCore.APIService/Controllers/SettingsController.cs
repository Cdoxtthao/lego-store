using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var settings = await _context.Settings
                .OrderBy(s => s.Group)
                .ThenBy(s => s.Key)
                .ToListAsync();

            var grouped = settings
                .GroupBy(s => s.Group)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(s => new
                    {
                        s.Id,
                        s.Key,
                        s.Value,
                        s.Description,
                        s.Group,
                        s.UpdatedAt,
                    })
                );

            return Ok(grouped);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMany([FromBody] List<UpdateSettingRequest> requests)
        {
            foreach (var req in requests)
            {
                var setting = await _context.Settings.FindAsync(req.Id);
                if (setting != null)
                {
                    setting.Value = req.Value;
                    setting.UpdatedAt = DateTime.UtcNow;
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu cài đặt thành công" });
        }
    }

    public class UpdateSettingRequest
    {
        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
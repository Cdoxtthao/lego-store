using BaseCore.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    // Cấu hình trang Chương trình (tiêu đề nổi + banner + sản phẩm được chọn) — lưu trong Settings
    [ApiController]
    [Route("api/[controller]")]
    public class CampaignController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CampaignController(AppDbContext context) { _context = context; }

        private async Task<string> Get(string key, string def)
        {
            var s = await _context.Settings.FirstOrDefaultAsync(x => x.Key == key);
            return s?.Value ?? def;
        }

        private async Task Upsert(string key, string value)
        {
            var s = await _context.Settings.FirstOrDefaultAsync(x => x.Key == key);
            if (s == null)
            {
                _context.Settings.Add(new Setting { Key = key, Value = value, Group = "Campaign", UpdatedAt = DateTime.UtcNow });
            }
            else
            {
                s.Value = value;
                s.UpdatedAt = DateTime.UtcNow;
            }
        }

        // GET api/campaign — công khai (trang Web user đọc)
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetConfig()
        {
            return Ok(new
            {
                title = await Get("campaign_title", "Chương trình Khuyến mãi"),
                banner = await Get("campaign_banner", "/images/banners/1.jpg"),
                sideBanner = await Get("campaign_side_banner", ""),
                endDate = await Get("campaign_end_date", ""),
                productIds = await Get("campaign_product_ids", ""),
            });
        }

        public class CampaignRequest
        {
            public string? Title { get; set; }
            public string? Banner { get; set; }
            public string? SideBanner { get; set; }
            public string? EndDate { get; set; }
            public string? ProductIds { get; set; }   // "1,2,3"
        }

        // PUT api/campaign — Seller/Admin chỉnh
        [Authorize(Roles = "Admin,Seller")]
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] CampaignRequest req)
        {
            if (req.Title != null) await Upsert("campaign_title", req.Title);
            if (req.Banner != null) await Upsert("campaign_banner", req.Banner);
            if (req.SideBanner != null) await Upsert("campaign_side_banner", req.SideBanner);
            if (req.EndDate != null) await Upsert("campaign_end_date", req.EndDate);
            if (req.ProductIds != null) await Upsert("campaign_product_ids", req.ProductIds);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã lưu chương trình" });
        }
    }
}

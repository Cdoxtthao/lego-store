using BaseCore.APIService.Helpers;
using BaseCore.APIService.Hubs;
using BaseCore.Entities;
using BaseCore.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hub;
        private readonly ICartService _cartService;

        public VouchersController(AppDbContext context, IHubContext<ChatHub> hub, ICartService cartService)
        {
            _context = context;
            _hub = hub;
            _cartService = cartService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private static object Map(Voucher v) => new
        {
            id = v.Id,
            code = v.Code,
            description = v.Description,
            discountPercent = v.DiscountPercent,
            scopeType = v.ScopeType,
            categoryIds = v.CategoryIds,
            themeIds = v.ThemeIds,
            productIds = v.ProductIds,
            startDate = v.StartDate,
            endDate = v.EndDate,
            isActive = v.IsActive,
        };

        // GET api/vouchers — Seller/Admin xem tất cả
        [Authorize(Roles = "Admin,Seller")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Vouchers.OrderByDescending(v => v.CreatedAt).ToListAsync();
            return Ok(list.Select(Map));
        }

        // GET api/vouchers/active — mã cửa hàng (công khai), không gồm mã sinh nhật
        [AllowAnonymous]
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var now = DateTime.UtcNow;
            var list = await _context.Vouchers
                .Where(v => v.IsActive && v.ScopeType != "Birthday" && v.EndDate >= now)
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync();
            return Ok(list.Select(Map));
        }

        // GET api/vouchers/my — mã của tôi
        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            var list = await _context.UserVouchers
                .Where(uv => uv.UserId == userId)
                .OrderByDescending(uv => uv.CreatedAt)
                .Select(uv => new
                {
                    userVoucherId = uv.Id,
                    isUsed = uv.IsUsed,
                    voucher = Map(uv.Voucher),
                })
                .ToListAsync();
            return Ok(list);
        }

        public class VoucherRequest
        {
            public string Code { get; set; } = string.Empty;
            public string? Description { get; set; }
            public int DiscountPercent { get; set; }
            public string ScopeType { get; set; } = "All";
            public string? CategoryIds { get; set; }
            public string? ThemeIds { get; set; }
            public string? ProductIds { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
        }

        // POST api/vouchers — Seller/Admin tạo mã (check trùng code)
        [Authorize(Roles = "Admin,Seller")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VoucherRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Code))
                return BadRequest(new { message = "Mã không được để trống" });
            var code = req.Code.Trim();
            if (await _context.Vouchers.AnyAsync(v => v.Code == code))
                return BadRequest(new { message = "Mã đã tồn tại, vui lòng chọn mã khác" });
            if (req.ScopeType == "Specific" && string.IsNullOrWhiteSpace(req.ProductIds)
                && string.IsNullOrWhiteSpace(req.CategoryIds) && string.IsNullOrWhiteSpace(req.ThemeIds))
                return BadRequest(new { message = "Giảm cụ thể cần chọn ít nhất sản phẩm/danh mục/chủ đề" });

            var v = new Voucher
            {
                Code = code,
                Description = req.Description,
                DiscountPercent = req.DiscountPercent,
                ScopeType = req.ScopeType,
                CategoryIds = req.CategoryIds,
                ThemeIds = req.ThemeIds,
                ProductIds = req.ProductIds,
                StartDate = req.StartDate ?? DateTime.UtcNow,
                EndDate = req.EndDate ?? DateTime.UtcNow.AddMonths(1),
                IsActive = true,
                CreatedBy = GetUserId(),
                CreatedAt = DateTime.UtcNow,
            };
            _context.Vouchers.Add(v);
            await _context.SaveChangesAsync();
            return Ok(new { id = v.Id, message = "Đã tạo mã" });
        }

        // DELETE api/vouchers/{id} — Seller/Admin xóa
        [Authorize(Roles = "Admin,Seller")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var v = await _context.Vouchers.FindAsync(id);
            if (v == null) return NotFound();
            _context.Vouchers.Remove(v);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa" });
        }

        public class RedeemRequest { public string Code { get; set; } = string.Empty; }

        // POST api/vouchers/redeem — user nhập mã để nhận
        [Authorize]
        [HttpPost("redeem")]
        public async Task<IActionResult> Redeem([FromBody] RedeemRequest req)
        {
            var userId = GetUserId();
            var code = (req.Code ?? "").Trim();
            var now = DateTime.UtcNow;
            var v = await _context.Vouchers.FirstOrDefaultAsync(x =>
                x.Code == code && x.IsActive && x.EndDate >= now);
            if (v == null) return BadRequest(new { message = "Mã không hợp lệ hoặc đã hết hạn" });

            if (await _context.UserVouchers.AnyAsync(uv => uv.UserId == userId && uv.VoucherId == v.Id))
                return BadRequest(new { message = "Bạn đã sở hữu mã này rồi" });

            _context.UserVouchers.Add(new UserVoucher { UserId = userId, VoucherId = v.Id, CreatedAt = now });
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Nhận mã thành công — giảm {v.DiscountPercent}%!" });
        }

        public class SendRequest { public int VoucherId { get; set; } public int UserId { get; set; } }

        // POST api/vouchers/send — Seller/Admin gửi mã (vd sinh nhật) cho 1 user + thông báo
        [Authorize(Roles = "Admin,Seller")]
        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] SendRequest req)
        {
            var v = await _context.Vouchers.FindAsync(req.VoucherId);
            if (v == null) return NotFound(new { message = "Không tìm thấy mã" });

            if (!await _context.UserVouchers.AnyAsync(uv => uv.UserId == req.UserId && uv.VoucherId == v.Id))
            {
                _context.UserVouchers.Add(new UserVoucher { UserId = req.UserId, VoucherId = v.Id, CreatedAt = DateTime.UtcNow });
                await _context.SaveChangesAsync();
            }

            await NotificationHelper.NotifyAsync(_context, _hub, req.UserId, "promotion",
                "Bạn nhận được một mã giảm giá! 🎁",
                $"Mã \"{v.Code}\" — giảm {v.DiscountPercent}%. Hãy dùng khi thanh toán nhé!");

            return Ok(new { message = "Đã gửi mã" });
        }

        public class ApplyRequest
        {
            public string Code { get; set; } = string.Empty;
            public List<int>? SelectedItemIds { get; set; }
        }

        // POST api/vouchers/apply — kiểm tra + tính tiền giảm cho giỏ đang chọn (xem trước khi thanh toán)
        [Authorize]
        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] ApplyRequest req)
        {
            var result = await _cartService.ComputeVoucherDiscountAsync(GetUserId(), req.Code ?? "", req.SelectedItemIds);
            return Ok(result);
        }

        // GET api/vouchers/customers — danh sách khách hàng (cho Seller/Admin chọn người gửi mã sinh nhật)
        [Authorize(Roles = "Admin,Seller")]
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers([FromQuery] string? keyword = null)
        {
            var query = _context.Users.Where(u => u.RoleId == 4); // Customer
            if (!string.IsNullOrWhiteSpace(keyword))
                query = query.Where(u => u.FullName.Contains(keyword) || u.Email.Contains(keyword));
            var users = await query
                .OrderBy(u => u.FullName)
                .Take(50)
                .Select(u => new { id = u.Id, name = u.FullName, email = u.Email })
                .ToListAsync();
            return Ok(users);
        }
    }
}

using BaseCore.DTO.Request;
using BaseCore.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using BaseCore.APIService.Hubs;
using BaseCore.APIService.Helpers;
using BaseCore.Entities;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly AppDbContext _context;

        public CartController(ICartService cartService, IHubContext<ChatHub> hubContext, AppDbContext context)
        {
            _cartService = cartService;
            _hubContext = hubContext;
            _context = context;
        }
         
        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null) throw new UnauthorizedAccessException();
            return int.Parse(claim.Value);
        }

        // GET api/cart
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var result = await _cartService.GetCartAsync(GetUserId());
            return Ok(result);
        }

        // POST api/cart
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            try
            {
                var result = await _cartService.AddToCartAsync(GetUserId(), request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT api/cart/{cartItemId}
        [HttpPut("{cartItemId}")]
        public async Task<IActionResult> UpdateQuantity(int cartItemId, [FromBody] int quantity)
        {
            try
            {
                var result = await _cartService.UpdateQuantityAsync(GetUserId(), cartItemId, quantity);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE api/cart/{cartItemId}
        [HttpDelete("{cartItemId}")]
        public async Task<IActionResult> RemoveItem(int cartItemId)
        {
            var result = await _cartService.RemoveFromCartAsync(GetUserId(), cartItemId);
            return Ok(result);
        }

        // DELETE api/cart
        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            await _cartService.ClearCartAsync(GetUserId());
            return Ok(new { message = "Đã xóa giỏ hàng" });
        }

        // POST api/cart/checkout
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CreateOrderRequest request)
        {
            var result = await _cartService.CheckoutAsync(GetUserId(), request);

            try
            {
                var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Khách hàng";
                await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderNotification", new
                {
                    id = $"order-{result.Id}",
                    type = "new_order",
                    title = "Đơn hàng mới",
                    message = $"{userName} vừa đặt đơn #{result.Id}",
                    amount = result.TotalAmount,
                    createdAt = result.CreatedAt,
                    isRead = false,
                    link = "/admin/orders"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending SignalR notification: {ex.Message}");
            }

            // Thông báo "đặt hàng thành công" cho chính người dùng (lưu DB + real-time)
            try
            {
                await NotificationHelper.NotifyOrderAsync(_context, _hubContext, GetUserId(), result.Id, "Pending");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating user notification: {ex.Message}");
            }

            return Ok(result);
        }
    }
}
using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using BaseCore.Services.Interfaces;

namespace BaseCore.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepo;
        private readonly IProductRepository _productRepo;

        public CartService(ICartRepository cartRepo, IProductRepository productRepo)
        {
            _cartRepo = cartRepo;
            _productRepo = productRepo;
        }

        // Helper map Cart → CartResponse
        private static CartResponse MapToResponse(Cart cart)
        {
            return new CartResponse
            {
                Id = cart.Id,
                Items = cart.CartItems.Select(ci => new CartItemResponse
                {
                    Id = ci.Id,
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    ProductImage = ci.Product.ImageUrl,
                    Price = ci.Price,
                    Quantity = ci.Quantity,
                }).ToList(),
            };
        }

        // Lấy hoặc tạo giỏ hàng
        private async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart == null)
                cart = await _cartRepo.CreateAsync(userId);
            return cart;
        }

        public async Task<CartResponse?> GetCartAsync(int userId)
        {
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart == null) return null;
            return MapToResponse(cart);
        }

        public async Task<CartResponse> AddToCartAsync(int userId, AddToCartRequest request)
        {
            var cart = await GetOrCreateCartAsync(userId);
            var product = await _productRepo.GetByIdAsync(request.ProductId);
            if (product == null) throw new Exception("Sản phẩm không tồn tại");

            var item = new CartItem
            {
                CartId = cart.Id,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                Price = product.Price, // lưu giá tại thời điểm thêm
            };

            await _cartRepo.AddItemAsync(item);
            var updated = await _cartRepo.GetByUserIdAsync(userId);
            return MapToResponse(updated!);
        }

        public async Task<CartResponse> UpdateQuantityAsync(int userId, int cartItemId, int quantity)
        {
            await _cartRepo.UpdateItemQuantityAsync(cartItemId, quantity);
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            return MapToResponse(cart!);
        }

        public async Task<CartResponse> RemoveFromCartAsync(int userId, int cartItemId)
        {
            await _cartRepo.RemoveItemAsync(cartItemId);
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            return MapToResponse(cart!);
        }

        public async Task ClearCartAsync(int userId)
        {
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart != null)
                await _cartRepo.ClearCartAsync(cart.Id);
        }

        public async Task<OrderResponse> CheckoutAsync(int userId, CreateOrderRequest request)
        {
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart == null || !cart.CartItems.Any())
                throw new Exception("Giỏ hàng trống");

            // Tạo Order — cần OrderRepository
            // Tạm thời return placeholder
            await _cartRepo.ClearCartAsync(cart.Id);
            return new OrderResponse
            {
                Id = 0,
                TotalAmount = cart.CartItems.Sum(ci => ci.Price * ci.Quantity),
                Status = "Pending",
                ShippingAddress = request.ShippingAddress,
                CreatedAt = DateTime.UtcNow,
            };
        }
    }
}
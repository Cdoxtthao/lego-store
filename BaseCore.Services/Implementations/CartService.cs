using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using BaseCore.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Services.Implementations
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepo;
        private readonly IProductRepository _productRepo;
        private readonly AppDbContext _context;

        public CartService(ICartRepository cartRepo, IProductRepository productRepo, AppDbContext context)
        {
            _cartRepo = cartRepo;
            _productRepo = productRepo;
            _context = context;
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
            
            var itemsToCheckout = request.SelectedItemIds?.Any() == true
            ? cart.CartItems.Where(ci => request.SelectedItemIds.Contains(ci.Id)).ToList()
            : cart.CartItems.ToList();

            if (!itemsToCheckout.Any())
                throw new Exception("Không có sản phẩm nào được chọn");

            // Kiểm tra tồn kho trước
            foreach (var item in cart.CartItems)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                if (product == null)
                    throw new Exception($"Sản phẩm không tồn tại");
                if (product.StockQuantity < item.Quantity)
                    throw new Exception($"Sản phẩm '{product.Name}' chỉ còn {product.StockQuantity} trong kho");
            }

            // Tạo Order
            var order = new Order
            {
                UserId = userId,
                TotalAmount = itemsToCheckout.Sum(ci => ci.Price * ci.Quantity),
                ShippingAddress = request.ShippingAddress,
                PaymentMethod = request.PaymentMethod,
                Note = request.Note,
                Status = "Pending",
                PaymentStatus = "Unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Lưu OrderItems + cập nhật tồn kho
            foreach (var item in cart.CartItems)
            {
                // Thêm OrderItem
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Price = item.Price,
                });

                // ← Trừ tồn kho
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity = Math.Max(0, product.StockQuantity - item.Quantity);
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            // ← Xóa chỉ những item được chọn
            foreach (var item in itemsToCheckout)
            {
                _context.CartItems.Remove(item);
            }
            await _context.SaveChangesAsync();

            return new OrderResponse
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                ShippingAddress = order.ShippingAddress,
                PaymentMethod = order.PaymentMethod,
                CreatedAt = order.CreatedAt,
                Items = cart.CartItems.Select(ci => new OrderItemResponse
                {
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    ProductImage = ci.Product.ImageUrl,
                    Quantity = ci.Quantity,
                    Price = ci.Price,
                    Subtotal = ci.Price * ci.Quantity,
                }).ToList(),
            };
        }
    }
}
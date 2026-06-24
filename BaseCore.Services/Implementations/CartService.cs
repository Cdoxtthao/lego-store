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
                    Price = ci.Product.Price,
                    Quantity = ci.Quantity,
                }).ToList(),
            };
        }

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

            var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == request.ProductId);
            int currentQtyInCart = existingItem?.Quantity ?? 0;
            int totalRequestedQty = currentQtyInCart + request.Quantity;

            if (totalRequestedQty > product.StockQuantity)
            {
                throw new Exception($"Số lượng sản phẩm trong giỏ ({totalRequestedQty}) vượt quá tồn kho còn lại ({product.StockQuantity})");
            }

            var price = product.Price;
            if (existingItem != null)
            {
                existingItem.Price = price;
                await _cartRepo.UpdateItemQuantityAsync(existingItem.Id, totalRequestedQty);
            }
            else
            {
                var item = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    Price = price,       
                };
                await _cartRepo.AddItemAsync(item);
            }

            var updated = await _cartRepo.GetByUserIdAsync(userId);
            return MapToResponse(updated!);
        }

        public async Task<CartResponse> UpdateQuantityAsync(int userId, int cartItemId, int quantity)
        {
            if (quantity < 1) throw new Exception("Số lượng không hợp lệ");

            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart == null) throw new Exception("Giỏ hàng không tồn tại");

            var cartItem = cart.CartItems.FirstOrDefault(ci => ci.Id == cartItemId);
            if (cartItem == null) throw new Exception("Sản phẩm không có trong giỏ hàng");

            var product = await _productRepo.GetByIdAsync(cartItem.ProductId);
            if (product == null) throw new Exception("Sản phẩm không tồn tại");

            if (quantity > product.StockQuantity)
            {
                throw new Exception($"Số lượng sản phẩm trong giỏ ({quantity}) vượt quá tồn kho còn lại ({product.StockQuantity})");
            }

            var price = product.Price;
            cartItem.Price = price;

            await _cartRepo.UpdateItemQuantityAsync(cartItemId, quantity);
            var updatedCart = await _cartRepo.GetByUserIdAsync(userId);
            return MapToResponse(updatedCart!);
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

            foreach (var item in itemsToCheckout)
            {
                item.Price = item.Product.Price;
            }

            foreach (var item in itemsToCheckout)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                if (product == null)
                    throw new Exception($"Sản phẩm không tồn tại");
                if (product.StockQuantity < item.Quantity)
                    throw new Exception($"Sản phẩm '{product.Name}' chỉ còn {product.StockQuantity} trong kho");
            }

            var (voucherDiscount, appliedVoucher) = await EvaluateVoucherInternalAsync(userId, request.VoucherCode, itemsToCheckout);

            var giftFee = request.GiftFee > 0 ? request.GiftFee : 0;
            var shippingFee = request.ShippingFee > 0 ? request.ShippingFee : 0;
            string? voucherNote = appliedVoucher != null
                ? $"🏷️ Mã giảm giá: {appliedVoucher.Code} (-{voucherDiscount.ToString("#,##0")}đ)"
                : null;
            var combinedNote = string.Join("\n",
                new[] { request.Note, request.GiftNote, voucherNote }
                    .Where(s => !string.IsNullOrWhiteSpace(s)));

            var goodsTotal = itemsToCheckout.Sum(ci => ci.Price * ci.Quantity) + shippingFee + giftFee - voucherDiscount;
            if (goodsTotal < 0) goodsTotal = 0;

            var order = new Order
            {
                UserId = userId,
                TotalAmount = goodsTotal,
                ShippingAddress = request.ShippingAddress,
                PaymentMethod = request.PaymentMethod,
                Note = string.IsNullOrWhiteSpace(combinedNote) ? null : combinedNote,
                Status = "Pending",
                PaymentStatus = "Unpaid",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            foreach (var item in itemsToCheckout)
            {
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Price = item.Price,
                });

                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity = Math.Max(0, product.StockQuantity - item.Quantity);
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            if (appliedVoucher != null)
            {
                var uv = await _context.UserVouchers
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.VoucherId == appliedVoucher.Id && !x.IsUsed);
                if (uv != null) uv.IsUsed = true;
                else _context.UserVouchers.Add(new UserVoucher { UserId = userId, VoucherId = appliedVoucher.Id, IsUsed = true, CreatedAt = DateTime.UtcNow });
                await _context.SaveChangesAsync();
            }

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
                Items = itemsToCheckout.Select(ci => new OrderItemResponse
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

        private static List<int> ParseIds(string? csv)
            => string.IsNullOrWhiteSpace(csv) ? new List<int>()
               : csv.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var n) ? n : -1)
                    .Where(n => n > 0).ToList();

        private async Task<(int discount, Voucher? voucher)> EvaluateVoucherInternalAsync(int userId, string? code, List<CartItem> items)
        {
            if (string.IsNullOrWhiteSpace(code)) return (0, null);
            var now = DateTime.UtcNow;
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == code.Trim());
            if (voucher == null || !voucher.IsActive) return (0, null);
            if (now < voucher.StartDate || now > voucher.EndDate) return (0, null);

            var alreadyUsed = await _context.UserVouchers.AnyAsync(x => x.UserId == userId && x.VoucherId == voucher.Id && x.IsUsed);
            if (alreadyUsed) return (0, null);

            var owned = await _context.UserVouchers.AnyAsync(x => x.UserId == userId && x.VoucherId == voucher.Id && !x.IsUsed);
            if (!owned) return (0, null);

            var catIds = ParseIds(voucher.CategoryIds);
            var themeIds = ParseIds(voucher.ThemeIds);
            var prodIds = ParseIds(voucher.ProductIds);

            decimal eligible = 0;
            foreach (var ci in items)
            {
                bool ok;
                if (voucher.ScopeType == "Specific")
                {
                    var p = ci.Product;
                    if (p == null)
                    {
                        ok = false;
                    }
                    else
                    {
                        bool matchProd = !prodIds.Any() || prodIds.Contains(ci.ProductId);
                        bool matchCat = !catIds.Any() || catIds.Contains(p.CategoryId);
                        bool matchTheme = !themeIds.Any() || (p.ThemeId.HasValue && themeIds.Contains(p.ThemeId.Value));
                        ok = matchProd && matchCat && matchTheme;
                    }
                }
                else ok = true;         
                if (ok) eligible += ci.Price * ci.Quantity;
            }
            if (eligible <= 0) return (0, null);
            var discount = (int)Math.Round(eligible * voucher.DiscountPercent / 100m);
            return (discount, voucher);
        }

        public async Task<VoucherApplyResult> ComputeVoucherDiscountAsync(int userId, string code, List<int>? selectedItemIds)
        {
            var cart = await _cartRepo.GetByUserIdAsync(userId);
            if (cart == null || !cart.CartItems.Any())
                return new VoucherApplyResult { Valid = false, Message = "Giỏ hàng trống" };
            var items = selectedItemIds?.Any() == true
                ? cart.CartItems.Where(ci => selectedItemIds.Contains(ci.Id)).ToList()
                : cart.CartItems.ToList();
            if (!items.Any()) return new VoucherApplyResult { Valid = false, Message = "Chưa chọn sản phẩm" };

            var now = DateTime.UtcNow;
            var v = await _context.Vouchers.FirstOrDefaultAsync(x => x.Code == (code ?? "").Trim());
            if (v == null) return new VoucherApplyResult { Valid = false, Message = "Mã không tồn tại" };
            if (!v.IsActive) return new VoucherApplyResult { Valid = false, Message = "Mã không còn hiệu lực" };
            if (now < v.StartDate) return new VoucherApplyResult { Valid = false, Message = "Mã chưa đến ngày sử dụng" };
            if (now > v.EndDate) return new VoucherApplyResult { Valid = false, Message = "Mã đã hết hạn" };

            var alreadyUsed = await _context.UserVouchers.AnyAsync(x => x.UserId == userId && x.VoucherId == v.Id && x.IsUsed);
            if (alreadyUsed) return new VoucherApplyResult { Valid = false, Message = "Bạn đã sử dụng mã giảm giá này rồi" };

            var owned = await _context.UserVouchers.AnyAsync(x => x.UserId == userId && x.VoucherId == v.Id && !x.IsUsed);
            if (!owned) return new VoucherApplyResult { Valid = false, Message = "Bạn chưa sở hữu mã giảm giá này hoặc mã đã được sử dụng" };

            var (discount, voucher) = await EvaluateVoucherInternalAsync(userId, code, items);
            if (voucher == null || discount <= 0)
                return new VoucherApplyResult { Valid = false, Message = "Mã không áp dụng cho sản phẩm đã chọn" };
            return new VoucherApplyResult { Valid = true, Discount = discount, VoucherId = voucher.Id, Message = $"Đã áp dụng — giảm {discount.ToString("#,##0")}đ" };
        }
    }
}
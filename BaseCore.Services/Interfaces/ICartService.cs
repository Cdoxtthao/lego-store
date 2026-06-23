using BaseCore.DTO.Request;
using BaseCore.DTO.Response;

namespace BaseCore.Services.Interfaces
{
    public interface ICartService
    {
        Task<CartResponse?> GetCartAsync(int userId);
        Task<CartResponse> AddToCartAsync(int userId, AddToCartRequest request);
        Task<CartResponse> UpdateQuantityAsync(int userId, int cartItemId, int quantity);
        Task<CartResponse> RemoveFromCartAsync(int userId, int cartItemId);
        Task ClearCartAsync(int userId);
        Task<OrderResponse> CheckoutAsync(int userId, CreateOrderRequest request);
        // Tính số tiền giảm của 1 mã giảm giá trên các sản phẩm đang chọn (server-side)
        Task<VoucherApplyResult> ComputeVoucherDiscountAsync(int userId, string code, List<int>? selectedItemIds);
    }
}
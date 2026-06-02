using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface ICartRepository
    {
        Task<Cart?> GetByUserIdAsync(int userId);
        Task<Cart> CreateAsync(int userId);
        Task AddItemAsync(CartItem item);
        Task UpdateItemQuantityAsync(int cartItemId, int quantity);
        Task RemoveItemAsync(int cartItemId);
        Task ClearCartAsync(int cartId);
    }
}
using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface IOrderRepository
    {
        Task<(IEnumerable<Order> Items, int TotalCount)> GetAllAsync(int page, int pageSize, string? status = null);
        Task<Order?> GetByIdAsync(int id);
        Task<IEnumerable<Order>> GetByUserIdAsync(int userId);
        Task<Order> AddAsync(Order order);
        Task UpdateStatusAsync(int id, string status);
        Task<int> GetTotalCountAsync();
    }
}
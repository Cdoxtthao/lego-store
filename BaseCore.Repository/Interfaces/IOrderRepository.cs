using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface IOrderRepository
    {
        Task<IEnumerable<Order>> GetAllAsync(int page, int pageSize);
        Task<IEnumerable<Order>> GetByUserIdAsync(int userId);
        Task<Order?> GetByIdAsync(int id);
        Task<Order> AddAsync(Order order);
        Task UpdateStatusAsync(int id, string status);
        Task<int> GetTotalCountAsync();
    }
}
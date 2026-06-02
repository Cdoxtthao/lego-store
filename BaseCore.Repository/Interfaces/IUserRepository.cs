using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllAsync(int page, int pageSize);
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByEmailAsync(string email);  // dùng cho đăng nhập
        Task<User> AddAsync(User user);
        Task UpdateAsync(User user);
        Task<bool> EmailExistsAsync(string email);  // kiểm tra email trùng
        Task<int> GetTotalCountAsync();
    }
}
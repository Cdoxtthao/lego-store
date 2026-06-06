using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllAsync(int page, int pageSize, string? keyword = null)
        {
            var query = _context.Users.Include(u => u.Role).AsQueryable();
            if (!string.IsNullOrEmpty(keyword))
                query = query.Where(u =>
                    u.FullName.Contains(keyword) ||
                    u.Email.Contains(keyword));
            return await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<User?> GetByIdAsync(int id)
            => await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

        public async Task<User?> GetByEmailAsync(string email)
            => await _context.Users
                .Include(u => u.Role)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

        public async Task<User> AddAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> EmailExistsAsync(string email)
            => await _context.Users.AnyAsync(u => u.Email == email);

        public async Task<int> GetTotalCountAsync(string? keyword = null)
        {
            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(keyword))
                query = query.Where(u =>
                    u.FullName.Contains(keyword) ||
                    u.Email.Contains(keyword));
            return await query.CountAsync();
        }
    }
}
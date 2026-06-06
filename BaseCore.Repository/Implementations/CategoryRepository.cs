using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.Implementations
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _context;
        public CategoryRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Category>> GetAllAsync()
            => await _context.Categories
                .Include(c => c.Products)
                .OrderBy(c => c.Name)
                .AsNoTracking()
                .ToListAsync();

        public async Task<Category?> GetByIdAsync(int id)
            => await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

        public async Task<Category> AddAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task UpdateAsync(Category category)
        {
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category != null)
            {
                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(string name)
            => await _context.Categories.AnyAsync(c => c.Name == name);
    }
}
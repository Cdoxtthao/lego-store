using BaseCore.DTO.Request;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.Implementations
{
    public class ProductRepository : IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Product> Items, int TotalCount)> GetAllAsync(ProductSearchRequest request)
        {
            // Bắt đầu từ query cơ bản
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ThemeNav)
                .Include(p => p.Reviews)
                .Include(p => p.Images)
                .Where(p => p.IsActive)
                .AsNoTracking()
                .AsQueryable();

            // Lọc theo từng tiêu chí — chỉ áp dụng nếu có giá trị
            if (!string.IsNullOrEmpty(request.Keyword))
                query = query.Where(p =>
                    p.Name.Contains(request.Keyword));

            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId);

            if (request.ThemeId.HasValue)
                query = query.Where(p => p.ThemeId == request.ThemeId);
            else if (!string.IsNullOrEmpty(request.Theme))
                query = query.Where(p => p.Theme == request.Theme);

            if (!string.IsNullOrEmpty(request.AgeRange))
            {
                if (request.AgeRange.Contains('-'))
                {
                    if (request.AgeRange == "6-10")
                    {
                        query = query.Where(p => 
                            p.AgeRange == "6+" || p.AgeRange == "8+" || p.AgeRange == "9+" || p.AgeRange == "10+" || p.AgeRange == "6-10" ||
                            (p.Description != null && (p.Description.Contains("6 tuổi") || p.Description.Contains("7 tuổi") || p.Description.Contains("8 tuổi") || p.Description.Contains("9 tuổi") || p.Description.Contains("10 tuổi") || p.Description.Contains("6+") || p.Description.Contains("8+") || p.Description.Contains("9+") || p.Description.Contains("10+"))) ||
                            (p.Highlights != null && (p.Highlights.Contains("6 tuổi") || p.Highlights.Contains("7 tuổi") || p.Highlights.Contains("8 tuổi") || p.Highlights.Contains("9 tuổi") || p.Highlights.Contains("10 tuổi") || p.Highlights.Contains("6+") || p.Highlights.Contains("8+") || p.Highlights.Contains("9+") || p.Highlights.Contains("10+")))
                        );
                    }
                    else if (request.AgeRange == "10-12")
                    {
                        query = query.Where(p => 
                            p.AgeRange == "10+" || p.AgeRange == "12+" || p.AgeRange == "10-12" ||
                            (p.Description != null && (p.Description.Contains("10 tuổi") || p.Description.Contains("11 tuổi") || p.Description.Contains("12 tuổi") || p.Description.Contains("10+") || p.Description.Contains("12+"))) ||
                            (p.Highlights != null && (p.Highlights.Contains("10 tuổi") || p.Highlights.Contains("11 tuổi") || p.Highlights.Contains("12 tuổi") || p.Highlights.Contains("10+") || p.Highlights.Contains("12+")))
                        );
                    }
                    else if (request.AgeRange == "12-14")
                    {
                        query = query.Where(p => 
                            p.AgeRange == "12+" || p.AgeRange == "14+" || p.AgeRange == "12-14" ||
                            (p.Description != null && (p.Description.Contains("12 tuổi") || p.Description.Contains("13 tuổi") || p.Description.Contains("14 tuổi") || p.Description.Contains("12+") || p.Description.Contains("14+"))) ||
                            (p.Highlights != null && (p.Highlights.Contains("12 tuổi") || p.Highlights.Contains("13 tuổi") || p.Highlights.Contains("14 tuổi") || p.Highlights.Contains("12+") || p.Highlights.Contains("14+")))
                        );
                    }
                    else if (request.AgeRange == "14-17" || request.AgeRange == "14-18")
                    {
                        query = query.Where(p => 
                            p.AgeRange == "14+" || p.AgeRange == "14-17" || p.AgeRange == "14-18" ||
                            (p.Description != null && (p.Description.Contains("14 tuổi") || p.Description.Contains("15 tuổi") || p.Description.Contains("16 tuổi") || p.Description.Contains("17 tuổi") || p.Description.Contains("18 tuổi") || p.Description.Contains("14+"))) ||
                            (p.Highlights != null && (p.Highlights.Contains("14 tuổi") || p.Highlights.Contains("15 tuổi") || p.Highlights.Contains("16 tuổi") || p.Highlights.Contains("17 tuổi") || p.Highlights.Contains("18 tuổi") || p.Highlights.Contains("14+")))
                        );
                    }
                    else
                    {
                        query = query.Where(p => p.AgeRange == request.AgeRange);
                    }
                }
                else
                {
                    query = query.Where(p => p.AgeRange == request.AgeRange || 
                        (p.Description != null && p.Description.Contains(request.AgeRange)) ||
                        (p.Highlights != null && p.Highlights.Contains(request.AgeRange)));
                }
            }

            if (!string.IsNullOrEmpty(request.Gender))
            {
                if (request.Gender == "Nam")
                    query = query.Where(p => p.Gender == "Nam" || p.Gender == "Khác");
                else if (request.Gender == "Nữ")
                    query = query.Where(p => p.Gender == "Nữ" || p.Gender == "Khác");
                else
                    query = query.Where(p => p.Gender == request.Gender);
            }

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.Price >= request.MinPrice);

            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= request.MaxPrice);

            if (request.IsFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == request.IsFeatured);

            // Sắp xếp
            query = request.SortBy switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                // Bán chạy nhất: tính theo tổng số lượng đã bán qua OrderItems,
                // loại trừ đơn hàng đã hủy — tự cập nhật theo đơn hàng thực tế
                "bestseller" => query.OrderByDescending(p =>
                                         p.OrderItems
                                            .Where(oi => oi.Order.Status != "Cancelled")
                                            .Sum(oi => oi.Quantity))
                                     .ThenByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.IsFeatured)
                                     .ThenByDescending(p => p.OrderItems
                                                        .Where(oi => oi.Order.Status != "Cancelled")
                                                        .Sum(oi => oi.Quantity))
                                     .ThenByDescending(p => p.CreatedAt)
            };

            // Đếm tổng TRƯỚC khi phân trang — để tính TotalPages
            var totalCount = await query.CountAsync();

            // Phân trang ở backend
            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Product?> GetByIdAsync(int id)
            => await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ThemeNav)
                .Include(p => p.Reviews)
                    .ThenInclude(r => r.User)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        public async Task<IEnumerable<Product>> GetFeaturedAsync(int count = 8)
            => await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive && p.IsFeatured)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .ToListAsync();

        public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId, int page, int pageSize)
            => await _context.Products
                .Include(p => p.Category)
                .Where(p => p.CategoryId == categoryId && p.IsActive)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

        public async Task<Product> AddAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task UpdateAsync(Product product)
        {
            product.UpdatedAt = DateTime.UtcNow;
            _context.Products.Update(product);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                product.IsActive = false; // xóa mềm, không xóa khỏi DB
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
            => await _context.Products.AnyAsync(p => p.Id == id && p.IsActive);

        public async Task<Dictionary<int, int>> GetSoldCountsAsync(IEnumerable<int> productIds)
        {
            var ids = productIds.ToList();
            if (ids.Count == 0) return new Dictionary<int, int>();

            return await _context.OrderItems
                .Where(oi => ids.Contains(oi.ProductId) && oi.Order.Status != "Cancelled")
                .GroupBy(oi => oi.ProductId)
                .Select(g => new { ProductId = g.Key, Total = g.Sum(oi => oi.Quantity) })
                .ToDictionaryAsync(x => x.ProductId, x => x.Total);
        }
    }
}

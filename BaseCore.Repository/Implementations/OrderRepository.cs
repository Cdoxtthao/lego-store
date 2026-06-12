using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.Implementations
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _context;
        public OrderRepository(AppDbContext context) => _context = context;

        public async Task<(IEnumerable<Order> Items, int TotalCount)> GetAllAsync(
            int page, int pageSize, string? status = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                if (status == "Confirmed" || status == "Shipping")
                {
                    query = query.Where(o => o.Status == "Confirmed" || o.Status == "Shipping");
                }
                else
                {
                    query = query.Where(o => o.Status == status);
                }
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<Order?> GetByIdAsync(int id)
            => await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

        public async Task<IEnumerable<Order>> GetByUserIdAsync(int userId)
            => await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

        public async Task<Order> AddAsync(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task UpdateStatusAsync(int id, string status)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order != null)
            {
                var oldStatus = order.Status;
                order.Status = status;
                order.UpdatedAt = DateTime.UtcNow;

                // ← Hoàn lại tồn kho khi hủy đơn
                if (status == "Cancelled" && oldStatus != "Cancelled")
                {
                    foreach (var item in order.OrderItems)
                    {
                        var product = await _context.Products.FindAsync(item.ProductId);
                        if (product != null)
                        {
                            product.StockQuantity += item.Quantity;
                            product.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetTotalCountAsync()
            => await _context.Orders.CountAsync();
    }
}
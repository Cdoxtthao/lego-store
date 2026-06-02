using BaseCore.DTO.Request;
using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface IProductRepository
    {
        // Lấy tất cả có phân trang
        Task<(IEnumerable<Product> Items, int TotalCount)> GetAllAsync(ProductSearchRequest request);

        // Lấy theo Id
        Task<Product?> GetByIdAsync(int id);

        // Lấy sản phẩm nổi bật cho trang chủ
        Task<IEnumerable<Product>> GetFeaturedAsync(int count = 8);

        // Lấy sản phẩm theo danh mục
        Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId, int page, int pageSize);

        // Thêm mới
        Task<Product> AddAsync(Product product);

        // Cập nhật
        Task UpdateAsync(Product product);

        // Xóa mềm (IsActive = false)
        Task DeleteAsync(int id);

        // Kiểm tra tồn tại
        Task<bool> ExistsAsync(int id);
    }
}
using BaseCore.DTO.Request;
using BaseCore.DTO.Response;

namespace BaseCore.Services.Interfaces
{
    public interface IProductService
    {
        Task<PagedResponse<ProductResponse>> GetAllAsync(ProductSearchRequest request);
        Task<ProductResponse?> GetByIdAsync(int id);
        Task<IEnumerable<ProductResponse>> GetFeaturedAsync(int count = 8);
        Task<ProductResponse> CreateAsync(CreateProductRequest request);
        Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
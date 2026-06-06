using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Implementations;
using BaseCore.Repository.Interfaces;
using BaseCore.Services.Interfaces;

namespace BaseCore.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        public ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        private static ProductResponse MapToResponse(Product product)
        {
            return new ProductResponse
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                OldPrice = product.OldPrice,
                StockQuantity = product.StockQuantity,
                CategoryName = product.Category?.Name,
                Theme = product.Theme,
                AgeRange = product.AgeRange,
                PieceCount = product.PieceCount,
                SetNumber = product.SetNumber,
                IsFeatured = product.IsFeatured,
                CreatedAt = product.CreatedAt,
                SoldCount = product.SoldCount,

                AverageRating = product.Reviews.Any()
                    ? product.Reviews.Average(r => r.Rating) : 0,

                ReviewCount = product.Reviews.Count(),
                Images = product.Images
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new ProductImageResponse
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        IsMain = i.IsMain,
                        SortOrder = i.SortOrder
                    }).ToList(),
                ImageUrl = product.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl
                   ?? product.Images.FirstOrDefault()?.ImageUrl
                   ?? product.ImageUrl,
            };
        }

        //=============== GET ALL ======================

        public async Task<PagedResponse<ProductResponse>> GetAllAsync(ProductSearchRequest request)
        {
            var (items, totalCount) = await _productRepository.GetAllAsync(request);
            var mapped = items.Select(p => MapToResponse(p));
            return new PagedResponse<ProductResponse>
            {
                Items = mapped,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
            };
        }

        //=============== GET BY ID ======================

        public async Task<ProductResponse?> GetByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return null;
            return MapToResponse(product);
        }

        //=============== GET FEATURED ======================
        public async Task<IEnumerable<ProductResponse>> GetFeaturedAsync(int count = 8)
        {
            var product = await _productRepository.GetFeaturedAsync(count);
            return product.Select(p => MapToResponse(p));
        }

        //=============== CREATE ======================
        public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
        {
            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                OldPrice = request.OldPrice,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId,
                Theme = request.Theme,
                AgeRange = request.AgeRange,
                PieceCount = request.PieceCount,
                SetNumber = request.SetNumber,
                IsFeatured = request.IsFeatured,
            };

            var created = await _productRepository.AddAsync(product);
            return MapToResponse(created);
        }

        // ========== UPDATE ==========
        public async Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return null;

            if (request.Name != null) product.Name = request.Name;
            if (request.Description != null) product.Description = request.Description;
            if (request.Price.HasValue) product.Price = request.Price.Value;
            if (request.OldPrice.HasValue) product.OldPrice = request.OldPrice.Value;
            if (request.StockQuantity.HasValue) product.StockQuantity = request.StockQuantity.Value;
            if (request.ImageUrl != null) product.ImageUrl = request.ImageUrl;
            if (request.Theme != null) product.Theme = request.Theme;
            if (request.AgeRange != null) product.AgeRange = request.AgeRange;
            if (request.PieceCount.HasValue) product.PieceCount = request.PieceCount.Value;
            if (request.SetNumber != null) product.SetNumber = request.SetNumber;
            if (request.IsFeatured.HasValue) product.IsFeatured = request.IsFeatured.Value;
            product.UpdatedAt = DateTime.UtcNow;

            await _productRepository.UpdateAsync(product);
            return MapToResponse(product);
        }

        // ========== DELETE ==========
        public async Task<bool> DeleteAsync(int id)
        {
            var exists = await _productRepository.ExistsAsync(id);
            if (!exists) return false;

            await _productRepository.DeleteAsync(id);
            return true;
        }
    }
}
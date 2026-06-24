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

        // soldCount được tính thực tế từ OrderItems (xem GetSoldCountsAsync),
        // KHÔNG dùng cột Product.SoldCount lưu sẵn (cột này không được cập nhật theo đơn hàng)
        private static ProductResponse MapToResponse(Product product, int soldCount)
        {
            return new ProductResponse
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                OldPrice = product.OldPrice,
                DiscountPercent = product.DiscountPercent > 0 ? product.DiscountPercent : null,
                ImportPrice = product.ImportPrice,
                StockQuantity = product.StockQuantity,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name,
                Theme = product.ThemeNav?.Name ?? product.Theme,
                ThemeId = product.ThemeId,
                AgeRange = product.AgeRange,
                Gender = product.Gender,
                Highlights = product.Highlights,
                SetNumber = product.SetNumber,
                IsFeatured = product.IsFeatured,
                CreatedAt = product.CreatedAt,
                SoldCount = soldCount,

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
            var soldCounts = await _productRepository.GetSoldCountsAsync(items.Select(p => p.Id));
            var mapped = items.Select(p => MapToResponse(p, soldCounts.GetValueOrDefault(p.Id))).ToList();
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
            var soldCounts = await _productRepository.GetSoldCountsAsync(new[] { id });
            return MapToResponse(product, soldCounts.GetValueOrDefault(id));
        }

        //=============== GET FEATURED ======================
        public async Task<IEnumerable<ProductResponse>> GetFeaturedAsync(int count = 8)
        {
            var products = await _productRepository.GetFeaturedAsync(count);
            var soldCounts = await _productRepository.GetSoldCountsAsync(products.Select(p => p.Id));
            return products.Select(p => MapToResponse(p, soldCounts.GetValueOrDefault(p.Id))).ToList();
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
                ImportPrice = request.ImportPrice,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                CategoryId = request.CategoryId,
                Theme = request.Theme,
                ThemeId = request.ThemeId,
                AgeRange = request.AgeRange,
                Gender = request.Gender,
                Highlights = request.Highlights,
                SetNumber = request.SetNumber,
                IsFeatured = request.IsFeatured,
                DiscountPercent = request.DiscountPercent,
            };
            if (product.DiscountPercent > 0 && product.OldPrice.HasValue && product.OldPrice.Value > 0)
            {
                product.Price = Math.Round(product.OldPrice.Value * (1 - product.DiscountPercent / 100m), 0);
            }
            else if (product.DiscountPercent == 0 && product.OldPrice.HasValue && product.OldPrice.Value > 0)
            {
                product.Price = product.OldPrice.Value;
            }

            var created = await _productRepository.AddAsync(product);
            return MapToResponse(created, 0); // sản phẩm vừa tạo, chưa có đơn hàng nào
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
            if (request.ImportPrice.HasValue) product.ImportPrice = request.ImportPrice.Value;
            if (request.StockQuantity.HasValue) product.StockQuantity = request.StockQuantity.Value;
            if (request.ImageUrl != null) product.ImageUrl = request.ImageUrl;
            if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
            if (request.Theme != null) product.Theme = request.Theme;
            if (request.ThemeId.HasValue) product.ThemeId = request.ThemeId.Value;
            else if (request.ThemeId == null && request.Theme != null) product.ThemeId = null;
            if (request.AgeRange != null) product.AgeRange = request.AgeRange;
            if (request.Gender != null) product.Gender = request.Gender;
            if (request.Highlights != null) product.Highlights = request.Highlights;
            if (request.SetNumber != null) product.SetNumber = request.SetNumber;
            if (request.IsFeatured.HasValue) product.IsFeatured = request.IsFeatured.Value;
            if (request.DiscountPercent.HasValue) product.DiscountPercent = request.DiscountPercent.Value;
            if (product.DiscountPercent > 0 && product.OldPrice.HasValue && product.OldPrice.Value > 0)
            {
                product.Price = Math.Round(product.OldPrice.Value * (1 - product.DiscountPercent / 100m), 0);
            }
            else if (product.DiscountPercent == 0 && product.OldPrice.HasValue && product.OldPrice.Value > 0)
            {
                product.Price = product.OldPrice.Value;
            }
            product.UpdatedAt = DateTime.UtcNow;

            await _productRepository.UpdateAsync(product);

            // Fetch lại để load đúng navigation property (Category, Images, Reviews)
            var updated = await _productRepository.GetByIdAsync(id);
            var soldCounts = await _productRepository.GetSoldCountsAsync(new[] { id });
            var soldCount = soldCounts.GetValueOrDefault(id);
            return updated != null ? MapToResponse(updated, soldCount) : MapToResponse(product, soldCount);
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

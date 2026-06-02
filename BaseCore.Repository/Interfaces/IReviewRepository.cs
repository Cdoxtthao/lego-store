using BaseCore.Entities;

namespace BaseCore.Repository.Interfaces
{
    public interface IReviewRepository
    {
        Task<IEnumerable<Review>> GetByProductIdAsync(int productId);
        Task<Review> AddAsync(Review review);
        Task<bool> HasUserReviewedAsync(int userId, int productId);
        Task<double> GetAverageRatingAsync(int productId);
    }
}
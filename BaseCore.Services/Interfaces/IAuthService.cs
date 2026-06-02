    using BaseCore.DTO.Request;
    using BaseCore.DTO.Response;

    namespace BaseCore.Services.Interfaces
    {
        public interface IAuthService
        {
            Task<AuthResponse?> LoginAsync(LoginRequest request);
            Task<bool> RegisterAsync(RegisterRequest request);
            Task<AuthResponse?> GetCurrentUserAsync(int id);
        }
    }
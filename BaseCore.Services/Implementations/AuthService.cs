using BaseCore.DTO.Request;
using BaseCore.DTO.Response;
using BaseCore.Entities;
using BaseCore.Repository.Interfaces;
using BaseCore.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BaseCore.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration; 
        public AuthService( IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        // ======================= LOGIN ==============================
        public async Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);
            if (user == null) return null;
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!isPasswordValid) return null;

            // Tài khoản bị admin ngừng hoạt động (IsActive = false) thì không cho đăng nhập
            if (!user.IsActive)
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị ngừng hoạt động. Vui lòng liên hệ 3TL-Store.");

            var token = GenerateToken(user);

            return new AuthResponse
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                AvatarUrl = user.AvatarUrl,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
            };

        }
        // ======================= REGISTER ==============================
        public async Task<bool> RegisterAsync(RegisterRequest request)
        {
            var emailExists = await _userRepository.EmailExistsAsync(request.Email);
            if (emailExists) return false;
            var harsedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = harsedPassword,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                RoleId = 4
            };

            await _userRepository.AddAsync(user);
            return true;
        }

        // ======================= GET CURRENT USER ==============================
        public async Task<AuthResponse?> GetCurrentUserAsync (int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return null;

            return new AuthResponse
            {
                Token = string.Empty,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                ExpiresAt= DateTime.MinValue
            };
        }
        // ========== HELPER: TẠO JWT TOKEN =========
        private string GenerateToken(User user)
        {
            // Claims = thông tin nhúng vào token
            // Khi nhận request, server giải mã token lấy ra các claim này
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role.Name), // quan trọng cho phân quyền
            };

            // Đọc secret key từ appsettings.json
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            // Tạo token
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            Console.WriteLine($"Token parts: {tokenString.Split('.').Length}"); // phải = 3
            Console.WriteLine($"Token: {tokenString}");
            return tokenString;

            // Chuyển thành chuỗi string để trả về
            //return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
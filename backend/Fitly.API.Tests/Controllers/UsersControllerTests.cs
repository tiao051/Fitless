using Fitly.API.Controllers;
using Fitly.API.Data;
using Fitly.API.DTOs;
using Fitly.API.Models;
using Fitly.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Fitly.API.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly FitlyDbContext _dbContext;
        private readonly Mock<IJwtService> _mockJwtService;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            var options = new DbContextOptionsBuilder<FitlyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new FitlyDbContext(options);
            _mockJwtService = new Mock<IJwtService>();
            _controller = new UsersController(_dbContext, _mockJwtService.Object);
        }

        [Fact]
        public async Task Register_WithValidRequest_CreatesUserAndReturnsToken()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "SecurePassword123",
                FirstName = "John",
                LastName = "Doe"
            };

            _mockJwtService
                .Setup(x => x.GenerateToken(It.IsAny<User>()))
                .Returns("fake-jwt-token");

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<AuthResponse>(okResult.Value);
            
            Assert.NotNull(response.User);
            Assert.Equal("newuser@example.com", response.User.Email);
            Assert.Equal("John", response.User.FirstName);
            Assert.Equal("fake-jwt-token", response.Token);
            Assert.Equal("User registered successfully.", response.Message);
        }

        [Fact]
        public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            var existingUser = new User
            {
                Email = "existing@example.com",
                PasswordHash = "hash",
                FirstName = "Existing",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(existingUser);
            await _dbContext.SaveChangesAsync();

            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "SecurePassword123",
                FirstName = "John",
                LastName = "Doe"
            };

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var badResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Email already in use.", badResult.Value);
        }

        [Fact]
        public async Task Register_WithMissingFields_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "",
                FirstName = "John",
                LastName = "Doe"
            };

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var badResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("All fields are required.", badResult.Value);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsToken()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                PasswordHash = HashPassword("SecurePassword123"),
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            _mockJwtService
                .Setup(x => x.GenerateToken(It.IsAny<User>()))
                .Returns("fake-jwt-token");

            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "SecurePassword123"
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<AuthResponse>(okResult.Value);
            
            Assert.NotNull(response.User);
            Assert.Equal("test@example.com", response.User.Email);
            Assert.Equal("fake-jwt-token", response.Token);
            Assert.Equal("Login successful.", response.Message);
        }

        [Fact]
        public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "SecurePassword123"
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
            Assert.Equal("Invalid email or password.", unauthorizedResult.Value);
        }

        [Fact]
        public async Task Login_WithWrongPassword_ReturnsUnauthorized()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                PasswordHash = HashPassword("CorrectPassword"),
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
            Assert.Equal("Invalid email or password.", unauthorizedResult.Value);
        }

        [Fact]
        public async Task Login_WithMissingFields_ReturnsBadRequest()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = ""
            };

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var badResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Email and password are required.", badResult.Value);
        }

        [Fact]
        public async Task GetUser_WithValidId_ReturnsUser()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Email = "test@example.com",
                PasswordHash = "hash",
                FirstName = "John",
                LastName = "Doe",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            // Act
            var result = await _controller.GetUser(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<UserResponse>(okResult.Value);
            
            Assert.Equal(1, response.Id);
            Assert.Equal("test@example.com", response.Email);
            Assert.Equal("John", response.FirstName);
        }

        [Fact]
        public async Task GetUser_WithInvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetUser(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("User not found.", notFoundResult.Value);
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}

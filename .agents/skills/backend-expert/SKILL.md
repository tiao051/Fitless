---
name: backend-expert
description: "Use when: implementing API endpoints, service layer logic, DTOs, entity models, database queries, authentication. Tech: .NET 9, ASP.NET Core, EF Core, PostgreSQL, JWT. Refer to `.github/project-brief.md` for core principles (KISS, TDD, SOLID)."
---

# Fitly Backend Guidelines (.NET 9)

## Technical Standards

### Framework & Architecture
- **Framework**: ASP.NET Core with .NET 9
- **Pattern**: Controller-Service-Repository (or Service only if no separate repo layer)
- **Database**: EF Core 9.0 with PostgreSQL (async all the way)
- **Naming**: PascalCase for public methods/properties, camelCase for local variables

### C# Syntax Rules
- **Primary Constructors**: Use them for dependency injection
  ```csharp
  public class WorkoutService(IRepository<Workout> repository)
  {
      // Use 'repository' directly, no field needed
  }
  ```
- **File-Scoped Namespaces**: Always use
  ```csharp
  namespace Fitly.API.Services;
  ```
- **Async/Await**: All DB operations must be `async Task` or `async Task<T>`
- **Nullable Reference Types**: Always enabled; use `string?` for optional fields

### Result Pattern (Error Handling)
Instead of throwing exceptions for business logic failures, return `Result<T>`:

```csharp
public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }

    public static Result<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
}

// Usage in Service
public async Task<Result<WorkoutSetDto>> CompleteSet(string setId)
{
    var set = await _repository.GetAsync(setId);
    if (set == null)
        return Result<WorkoutSetDto>.Failure("Set not found");

    set.IsCompleted = true;
    set.CompletedAt = DateTime.UtcNow;
    await _repository.SaveAsync(set);

    return Result<WorkoutSetDto>.Success(_mapper.Map<WorkoutSetDto>(set));
}

// Usage in Controller
[HttpPost("{setId}/complete")]
public async Task<IActionResult> CompleteSet(string setId)
{
    var result = await _workoutService.CompleteSet(setId);
    if (!result.IsSuccess)
        return BadRequest(new { error = result.Error });

    return Ok(result.Data);
}
```

---

## API Design & Documentation

### Endpoint Structure
- RESTful paths: `/api/resource/{id}` or `/api/parent/{parentId}/child`
- Standard HTTP verbs: `GET`, `POST`, `PUT`, `DELETE`
- Query params for filtering: `/?date=2026-03-27&limit=10`
- Request bodies for complex data (not query params)

### Example Endpoints
```
GET    /api/exercises                    (List all, public)
GET    /api/exercises/{id}               (Get one, public)
POST   /api/exercises                    (Create, auth required)
PUT    /api/exercises/{id}               (Update, auth required)
DELETE /api/exercises/{id}               (Delete, auth required)

GET    /api/users/{userId}/workouts      (List user's workouts)
POST   /api/users/{userId}/workouts      (Create workout)
GET    /api/workoutplans/today           (Get today's plan)
POST   /api/workoutplans/sets            (Record completed set)
```

### Response Format
```csharp
// Success (200 OK)
{
  "data": { ... },
  "success": true
}

// Error (400 Bad Request)
{
  "error": "Descriptive error message",
  "success": false
}

// Validation (400 Bad Request)
{
  "errors": {
    "Reps": ["Reps must be between 1 and 100"],
    "Weight": ["Weight is required"]
  }
}
```

### Swagger/OpenAPI
Every endpoint must have documentation:

```csharp
[HttpPost("{setId}/complete")]
[Authorize]
[ProducesResponseType(typeof(WorkoutSetDto), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> CompleteSet(
    [FromRoute] string setId,
    [FromBody] CompleteSetRequest request)
{
    // ...
}
```

---

## Security & Authentication

### JWT Implementation
- **Token Issuer**: Configured in `appsettings.json` or environment
- **Token Audience**: `fitly-api`
- **Token Lifetime**: Default 60 minutes (configurable)
- **Token Format**: Bearer scheme (`Authorization: Bearer <token>`)

### Middleware Setup
```csharp
// In Program.cs
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });

app.UseAuthentication();
app.UseAuthorization();
```

### Protected Endpoints
```csharp
[Authorize]  // Requires valid JWT
public async Task<IActionResult> GetUserWorkouts(string userId)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (userId == null)
        return Unauthorized();

    // ...
}
```

### Password Hashing
Use secure hashing (never plain text):
```csharp
public class JwtService
{
    public string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = HashPassword(password);
        return hashOfInput == hash; // In production, use bcrypt!
    }
}
```

---

## Data Validation

### DTO Validation with Data Annotations
```csharp
public class CreateWorkoutRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 1000, ErrorMessage = "Duration must be 1-1000 minutes")]
    public int DurationMinutes { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
```

### FluentValidation (Alternative)
```csharp
public class CreateWorkoutValidator : AbstractValidator<CreateWorkoutRequest>
{
    public CreateWorkoutValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name max 100 chars");

        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(1).WithMessage("Duration >= 1")
            .LessThanOrEqualTo(1000).WithMessage("Duration <= 1000");
    }
}
```

---

## Service Layer Patterns

### Service Interface
```csharp
public interface IWorkoutService
{
    Task<Result<WorkoutDto>> CreateWorkoutAsync(string userId, CreateWorkoutRequest request);
    Task<List<WorkoutDto>> GetUserWorkoutsAsync(string userId);
    Task<Result<WorkoutDto>> GetWorkoutAsync(string id);
    Task<Result<bool>> DeleteWorkoutAsync(string id);
}

public class WorkoutService(
    IRepository<Workout> workoutRepository,
    IRepository<Exercise> exerciseRepository,
    IMapper mapper) : IWorkoutService
{
    public async Task<Result<WorkoutDto>> CreateWorkoutAsync(string userId, CreateWorkoutRequest request)
    {
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = request.Name,
            DurationMinutes = request.DurationMinutes,
            WorkoutDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

        await workoutRepository.AddAsync(workout);
        await workoutRepository.SaveAsync();

        return Result<WorkoutDto>.Success(mapper.Map<WorkoutDto>(workout));
    }

    public async Task<List<WorkoutDto>> GetUserWorkoutsAsync(string userId)
    {
        var workouts = await workoutRepository
            .GetQueryable()
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.WorkoutDate)
            .ToListAsync();

        return mapper.Map<List<WorkoutDto>>(workouts);
    }

    // ... other methods
}
```

---

## Testing with xUnit & Moq

### Service Tests
```csharp
public class WorkoutServiceTests
{
    private readonly Mock<IRepository<Workout>> _mockRepository;
    private readonly WorkoutService _service;

    public WorkoutServiceTests()
    {
        _mockRepository = new Mock<IRepository<Workout>>();
        _service = new WorkoutService(_mockRepository.Object);
    }

    [Fact]
    public async Task CreateWorkoutAsync_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateWorkoutRequest { Name = "Chest", DurationMinutes = 60 };
        var userId = Guid.NewGuid().ToString();

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Workout>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SaveAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateWorkoutAsync(userId, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal("Chest", result.Data.Name);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Workout>()), Times.Once);
        _mockRepository.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task GetUserWorkoutsAsync_ReturnsListOrdered()
    {
        // Arrange
        var workouts = new List<Workout>
        {
            new() { Id = "1", Name = "Chest", WorkoutDate = DateTime.UtcNow },
            new() { Id = "2", Name = "Back", WorkoutDate = DateTime.UtcNow.AddDays(-1) },
        }.AsQueryable();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(workouts);

        // Act
        var result = await _service.GetUserWorkoutsAsync("user-1");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Chest", result[0].Name); // Newest first
    }
}
```

### Controller Tests
```csharp
public class WorkoutsControllerTests
{
    private readonly Mock<IWorkoutService> _mockService;
    private readonly WorkoutsController _controller;

    [Fact]
    public async Task Post_ReturnsBadRequest_OnServiceFailure()
    {
        // Arrange
        var request = new CreateWorkoutRequest { Name = "" };
        _mockService.Setup(s => s.CreateWorkoutAsync(It.IsAny<string>(), request))
            .ReturnsAsync(Result<WorkoutDto>.Failure("Invalid name"));

        _controller = new WorkoutsController(_mockService.Object);

        // Act
        var result = await _controller.Post("user-1", request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }
}
```

---

## Common Patterns

### Entity to DTO Mapping (AutoMapper)
```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Workout, WorkoutDto>();
        CreateMap<WorkoutSet, WorkoutSetDto>();
        CreateMap<Exercise, ExerciseDto>();
    }
}
```

### Idempotent Operations
```csharp
public async Task<Exercise> SeedExerciseAsync(string name)
{
    // Check if exists (safe to run multiple times)
    var existing = await _repository
        .GetQueryable()
        .FirstOrDefaultAsync(e => e.Name.ToLower() == name.ToLower());

    if (existing != null)
        return existing;

    // Create new
    var exercise = new Exercise { Id = Guid.NewGuid().ToString(), Name = name };
    await _repository.AddAsync(exercise);
    await _repository.SaveAsync();

    return exercise;
}
```

---

## Pitfalls to Avoid

1. **Async/sync mismatch**: Never use `.Result` or `.Wait()` → always `await`
2. **N+1 queries**: Use `.Include()` for related entities
3. **Throwing exceptions for business logic**: Use `Result<T>` pattern
4. **No validation**: Always validate DTOs server-side
5. **Hardcoded magic numbers**: Use named constants or config
6. **Not handling null cases**: Check before access
7. **Missing Swagger docs**: Every endpoint needs documentation

---

## Reference

- Refer to `.github/project-brief.md` for core principles (KISS, TDD, SOLID)
- Refer to `mobile-expert` skill for frontend consumption patterns
- Refer to `fitness-logic` skill for domain calculations
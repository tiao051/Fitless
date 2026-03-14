using Fitly.API.Data;
using Fitly.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using dotenv.net;
using System.Text;
using Npgsql;

// Load .env file from root directory if it exists (for local development)
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env");
if (File.Exists(envPath))
{
    DotEnv.Load(new DotEnvOptions(envFilePaths: new[] { envPath }));
}

// Wait for database to be ready (Docker startup)
var maxRetries = 30;
var retryCount = 0;
var database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "fitly_db";
var user = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "fitly_user";
var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "fitly_password";
var host = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
var port = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";

while (retryCount < maxRetries)
{
    try
    {
        var connString = $"Host={host};Port={port};Database=postgres;Username={user};Password={password};";
        using (var conn = new NpgsqlConnection(connString))
        {
            await conn.OpenAsync();
            conn.Close();
        }
        break;
    }
    catch (Exception)
    {
        retryCount++;
        if (retryCount >= maxRetries)
        {
            Console.WriteLine("Warning: Max database retries reached. Continuing...");
        }
        else
        {
            await Task.Delay(1000);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register domain services
builder.Services.AddScoped<IExerciseService, ExerciseService>();
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
builder.Services.AddScoped<INutritionService, NutritionService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<FoodSeeder>();

// Configure JWT Authentication
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
    ?? throw new InvalidOperationException("JWT_KEY is not configured in .env");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "fitly-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "fitly-client";
var jwtExpirationMinutes = int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES"), out var minutes) ? minutes : 60;

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Store JWT settings in configuration for use in JwtService
builder.Configuration["Jwt:Key"] = jwtKey;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;
builder.Configuration["Jwt:ExpirationMinutes"] = jwtExpirationMinutes.ToString();

// Add DbContext with PostgreSQL
var connectionString = $"Server={host};Port={port};Database={database};User Id={user};Password={password};";

builder.Services.AddDbContext<FitlyDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

// Apply database migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FitlyDbContext>();
    var foodSeeder = scope.ServiceProvider.GetRequiredService<FoodSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Apply pending migrations
        await dbContext.Database.MigrateAsync();

        // Seed food data from CSV
        var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "scripts", "data", "fitly_data.csv");
        await foodSeeder.SeedFoodsAsync(csvPath);
    }
    catch (Exception ex)
    {
        logger.LogError($"Error during database setup: {ex.Message}");
        throw;
    }
}

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

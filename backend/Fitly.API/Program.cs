using Fitly.API.Data;
using Fitly.API.Services;
using Fitly.API.Utilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using dotenv.net;
using System.Text;
using Npgsql;

FileLogger.LogInfo("Fitly.API Startup Initiated");

// Load environment variables from .env file for local development
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env");
if (File.Exists(envPath))
{
    DotEnv.Load(new DotEnvOptions(envFilePaths: new[] { envPath }));
    FileLogger.LogInfo("Environment file loaded successfully");
}

// Database connection parameters
var database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "fitly_db";
var user = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "fitly_user";
var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "fitly_password";
var host = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
var port = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";

// Wait for database availability (Required for Docker orchestration)
var maxRetries = 30;
var retryCount = 0;
while (retryCount < maxRetries)
{
    try
    {
        var connString = $"Host={host};Port={port};Database=postgres;Username={user};Password={password};";
        using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();
        FileLogger.LogInfo("Database connection established");
        break;
    }
    catch
    {
        retryCount++;
        if (retryCount >= maxRetries) 
            FileLogger.LogWarning("Max retries reached. Proceeding with startup...");
        await Task.Delay(1000);
    }
}

var builder = WebApplication.CreateBuilder(args);

// --- CORS Configuration ---
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Application Services
builder.Services.AddScoped<IExerciseService, ExerciseService>();
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
builder.Services.AddScoped<INutritionService, NutritionService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<FoodSeeder>();

// JWT Authentication Setup
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? throw new InvalidOperationException("JWT_KEY environment variable is missing");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "fitly-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "fitly-client";
var jwtExpiration = int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRATION_MINUTES"), out var min) ? min : 60;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Configuration["Jwt:Key"] = jwtKey;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;
builder.Configuration["Jwt:ExpirationMinutes"] = jwtExpiration.ToString();

// Database Context Setup
var connectionString = $"Server={host};Port={port};Database={database};User Id={user};Password={password};";
builder.Services.AddDbContext<FitlyDbContext>(options => options.UseNpgsql(connectionString));

var app = builder.Build();

// Database Initialization (Migrations and Seeding)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var dbContext = services.GetRequiredService<FitlyDbContext>();
        var foodSeeder = services.GetRequiredService<FoodSeeder>();

        FileLogger.LogInfo("Applying database migrations...");
        
        // Add extra delay to ensure database is fully ready
        await Task.Delay(2000);
        
        try
        {
            await dbContext.Database.MigrateAsync();
            FileLogger.LogInfo("Database migrations completed successfully");
        }
        catch (Exception migrationEx)
        {
            FileLogger.LogError($"Migration failed: {migrationEx.GetType().Name} - {migrationEx.Message}", migrationEx);
            throw;
        }
        
        var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "fitly_data.csv");
        if (!File.Exists(csvPath)) 
            csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "scripts", "data", "fitly_data.csv");

        if (File.Exists(csvPath)) 
        {
            FileLogger.LogInfo($"Seeding data from: {csvPath}");
            await foodSeeder.SeedFoodsAsync(csvPath);
            FileLogger.LogInfo("Food seeding completed successfully");
        }
        else
        {
            FileLogger.LogWarning($"CSV file not found at {csvPath}");
        }
    }
    catch (Exception ex) 
    { 
        FileLogger.LogError($"Database initialization error: {ex.GetType().Name}", ex); 
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Middleware Pipeline
app.UseCors(); 
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

FileLogger.LogInfo("Fitly API successfully started on port 5062");
app.Run();
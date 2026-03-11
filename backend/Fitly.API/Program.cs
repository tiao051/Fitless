using Fitly.API.Data;
using Fitly.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using dotenv.net;
using System.Text;

// Load .env file from root directory
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env");
DotEnv.Load(new DotEnvOptions(envFilePaths: new[] { envPath }));

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
// Environment variables are loaded from .env file (via DotNetEnv.Load())
var host = Environment.GetEnvironmentVariable("DATABASE_HOST") 
    ?? throw new InvalidOperationException("DATABASE_HOST is not configured");
var port = Environment.GetEnvironmentVariable("DATABASE_PORT") 
    ?? throw new InvalidOperationException("DATABASE_PORT is not configured");
var database = Environment.GetEnvironmentVariable("DATABASE_NAME") 
    ?? throw new InvalidOperationException("DATABASE_NAME is not configured");
var user = Environment.GetEnvironmentVariable("DATABASE_USER") 
    ?? throw new InvalidOperationException("DATABASE_USER is not configured");
var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") 
    ?? throw new InvalidOperationException("DATABASE_PASSWORD is not configured");

var connectionString = $"Server={host};Port={port};Database={database};User Id={user};Password={password};";

builder.Services.AddDbContext<FitlyDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

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

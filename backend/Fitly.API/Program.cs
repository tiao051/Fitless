using Fitly.API.Data;
using Fitly.API.Services;
using Microsoft.EntityFrameworkCore;
using dotenv.net;

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
app.UseAuthorization();
app.MapControllers();

app.Run();

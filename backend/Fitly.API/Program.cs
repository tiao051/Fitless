using Fitly.API.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext with PostgreSQL
var host = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
var port = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";
var database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "fitly_db";
var user = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "fitly_user";
var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "fitly_password";

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

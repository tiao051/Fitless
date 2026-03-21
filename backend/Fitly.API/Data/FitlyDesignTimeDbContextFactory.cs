using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Fitly.API.Data
{
    // Enables EF CLI commands (migrations/update) without bootstrapping the full web host.
    public class FitlyDesignTimeDbContextFactory : IDesignTimeDbContextFactory<FitlyDbContext>
    {
        public FitlyDbContext CreateDbContext(string[] args)
        {
            var host = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "fitly_db";
            var user = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "fitly_user";
            var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "fitly_password";

            var connectionString = $"Server={host};Port={port};Database={database};User Id={user};Password={password};";

            var optionsBuilder = new DbContextOptionsBuilder<FitlyDbContext>();
            optionsBuilder.UseNpgsql(connectionString);

            return new FitlyDbContext(optionsBuilder.Options);
        }
    }
}

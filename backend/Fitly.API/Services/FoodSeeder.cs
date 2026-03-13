using CsvHelper;
using CsvHelper.Configuration;
using Fitly.API.Data;
using Fitly.API.Models;
using System.Globalization;

namespace Fitly.API.Services
{
    /// <summary>
    /// Seeder for populating the Food database from CSV file.
    /// </summary>
    public class FoodSeeder
    {
        private readonly FitlyDbContext _context;
        private readonly ILogger<FoodSeeder> _logger;

        public FoodSeeder(FitlyDbContext context, ILogger<FoodSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Seeds foods from fitly_data.csv file.
        /// Path should be relative to the application root.
        /// </summary>
        public async Task SeedFoodsAsync(string csvFilePath)
        {
            try
            {
                // Check if CSV file exists
                if (!File.Exists(csvFilePath))
                {
                    _logger.LogWarning($"CSV file not found at path: {csvFilePath}");
                    return;
                }

                // Skip if foods already exist
                var existingFoodCount = _context.Foods.Count();
                if (existingFoodCount > 0)
                {
                    _logger.LogInformation($"Foods already exist in database ({existingFoodCount} rows). Skipping seed.");
                    return;
                }

                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true
                };

                using (var reader = new StreamReader(new FileStream(csvFilePath, FileMode.Open, FileAccess.Read, FileShare.Read)))
                using (var csv = new CsvReader(reader, config))
                {
                    var foods = new List<Food>();
                    csv.Read();
                    csv.ReadHeader();

                    int lineNumber = 1;
                    while (csv.Read())
                    {
                        lineNumber++;
                        try
                        {
                            var food = new Food
                            {
                                Name = csv.GetField("name") ?? "",
                                Brand = csv.GetField("brand"),
                                FdcId = long.TryParse(csv.GetField("fdc_id"), out var fdc) ? fdc : null,
                                IsGeneric = bool.TryParse(csv.GetField("is_generic"), out var isGen) ? isGen : false,
                                CaloriesPer100g = decimal.TryParse(csv.GetField("calories_kcal"), out var cal) ? cal : 0,
                                ProteinPer100g = decimal.TryParse(csv.GetField("protein_g"), out var prot) ? prot : 0,
                                CarbsPer100g = decimal.TryParse(csv.GetField("carb_g"), out var carb) ? carb : 0,
                                FatPer100g = decimal.TryParse(csv.GetField("fat_g"), out var fat) ? fat : 0,
                                FiberPer100g = decimal.TryParse(csv.GetField("fiber_g"), out var fiber) ? fiber : 0,
                                ServingSize = decimal.TryParse(csv.GetField("serving_size"), out var size) ? size : null,
                                ServingUnit = csv.GetField("serving_unit"),
                                ServingText = csv.GetField("serving_text")
                            };

                            if (string.IsNullOrWhiteSpace(food.Name))
                            {
                                _logger.LogWarning($"Skipping line {lineNumber}: missing food name");
                                continue;
                            }

                            foods.Add(food);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Error parsing line {lineNumber}: {ex.Message}");
                            continue;
                        }
                    }

                    if (foods.Count == 0)
                    {
                        _logger.LogWarning("No valid foods found in CSV file");
                        return;
                    }

                    // Bulk insert
                    _context.Foods.AddRange(foods);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Successfully seeded {foods.Count} foods from CSV file");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error seeding foods: {ex.Message}");
                throw;
            }
        }
    }
}

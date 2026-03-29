using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fitly.API.Migrations
{
    /// <inheritdoc />
    public partial class AddChibiSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Chibis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ShoulderWidth = table.Column<int>(type: "integer", nullable: false),
                    CoreDefinition = table.Column<int>(type: "integer", nullable: false),
                    WaistSize = table.Column<int>(type: "integer", nullable: false),
                    LegMuscle = table.Column<int>(type: "integer", nullable: false),
                    ArmMuscle = table.Column<int>(type: "integer", nullable: false),
                    LastBodyUpdateAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OutfitItemId = table.Column<string>(type: "text", nullable: true),
                    AccessoryItemId = table.Column<string>(type: "text", nullable: true),
                    AuraEffectId = table.Column<string>(type: "text", nullable: true),
                    HairColorId = table.Column<string>(type: "text", nullable: true),
                    SkinToneId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chibis", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chibis_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CosmeticItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CostPoints = table.Column<int>(type: "integer", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Rarity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CosmeticItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PointsBalances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChibiId = table.Column<int>(type: "integer", nullable: false),
                    Balance = table.Column<int>(type: "integer", nullable: false),
                    TotalEarned = table.Column<int>(type: "integer", nullable: false),
                    TotalSpent = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsBalances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointsBalances_Chibis_ChibiId",
                        column: x => x.ChibiId,
                        principalTable: "Chibis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PointsTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChibiId = table.Column<int>(type: "integer", nullable: false),
                    TransactionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    RelatedEntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointsTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PointsTransactions_Chibis_ChibiId",
                        column: x => x.ChibiId,
                        principalTable: "Chibis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCosmeticItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChibiId = table.Column<int>(type: "integer", nullable: false),
                    CosmeticItemId = table.Column<string>(type: "text", nullable: false),
                    IsEquipped = table.Column<bool>(type: "boolean", nullable: false),
                    AcquiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCosmeticItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCosmeticItems_Chibis_ChibiId",
                        column: x => x.ChibiId,
                        principalTable: "Chibis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCosmeticItems_CosmeticItems_CosmeticItemId",
                        column: x => x.CosmeticItemId,
                        principalTable: "CosmeticItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chibis_UserId",
                table: "Chibis",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CosmeticItems_Category",
                table: "CosmeticItems",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_CosmeticItems_IsDefault",
                table: "CosmeticItems",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_PointsBalances_ChibiId",
                table: "PointsBalances",
                column: "ChibiId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PointsTransactions_ChibiId_CreatedAt",
                table: "PointsTransactions",
                columns: new[] { "ChibiId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserCosmeticItems_ChibiId_IsEquipped",
                table: "UserCosmeticItems",
                columns: new[] { "ChibiId", "IsEquipped" });

            migrationBuilder.CreateIndex(
                name: "IX_UserCosmeticItems_CosmeticItemId",
                table: "UserCosmeticItems",
                column: "CosmeticItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PointsBalances");

            migrationBuilder.DropTable(
                name: "PointsTransactions");

            migrationBuilder.DropTable(
                name: "UserCosmeticItems");

            migrationBuilder.DropTable(
                name: "Chibis");

            migrationBuilder.DropTable(
                name: "CosmeticItems");
        }
    }
}

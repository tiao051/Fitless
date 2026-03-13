using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitly.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodServingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Foods");

            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "Foods",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FdcId",
                table: "Foods",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FiberPer100g",
                table: "Foods",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsGeneric",
                table: "Foods",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ServingSize",
                table: "Foods",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServingText",
                table: "Foods",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServingUnit",
                table: "Foods",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Foods_Brand",
                table: "Foods",
                column: "Brand");

            migrationBuilder.CreateIndex(
                name: "IX_Foods_IsGeneric",
                table: "Foods",
                column: "IsGeneric");

            migrationBuilder.CreateIndex(
                name: "IX_Foods_Name",
                table: "Foods",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Foods_Brand",
                table: "Foods");

            migrationBuilder.DropIndex(
                name: "IX_Foods_IsGeneric",
                table: "Foods");

            migrationBuilder.DropIndex(
                name: "IX_Foods_Name",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "Brand",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "FdcId",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "FiberPer100g",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "IsGeneric",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "ServingSize",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "ServingText",
                table: "Foods");

            migrationBuilder.DropColumn(
                name: "ServingUnit",
                table: "Foods");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Foods",
                type: "text",
                nullable: true);
        }
    }
}

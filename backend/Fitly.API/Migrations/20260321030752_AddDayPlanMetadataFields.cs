using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fitly.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDayPlanMetadataFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomPlanLabel",
                table: "DayPlans",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DayType",
                table: "DayPlans",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanName",
                table: "DayPlans",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomPlanLabel",
                table: "DayPlans");

            migrationBuilder.DropColumn(
                name: "DayType",
                table: "DayPlans");

            migrationBuilder.DropColumn(
                name: "PlanName",
                table: "DayPlans");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fitly.API.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Weight",
                table: "WorkoutSets",
                newName: "ActualWeight");

            migrationBuilder.RenameColumn(
                name: "Reps",
                table: "WorkoutSets",
                newName: "ActualReps");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "WorkoutSets",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "WorkoutSets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TargetReps",
                table: "WorkoutSets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TargetWeight",
                table: "WorkoutSets",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkoutPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutPlans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DayPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkoutPlanId = table.Column<int>(type: "integer", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    IsRestDay = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DayPlans_WorkoutPlans_WorkoutPlanId",
                        column: x => x.WorkoutPlanId,
                        principalTable: "WorkoutPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlannedExercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DayPlanId = table.Column<int>(type: "integer", nullable: false),
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    TargetSets = table.Column<int>(type: "integer", nullable: false),
                    TargetReps = table.Column<int>(type: "integer", nullable: false),
                    TargetWeight = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlannedExercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlannedExercises_DayPlans_DayPlanId",
                        column: x => x.DayPlanId,
                        principalTable: "DayPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlannedExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DayPlans_WorkoutPlanId",
                table: "DayPlans",
                column: "WorkoutPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_PlannedExercises_DayPlanId",
                table: "PlannedExercises",
                column: "DayPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_PlannedExercises_ExerciseId",
                table: "PlannedExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutPlans_UserId",
                table: "WorkoutPlans",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlannedExercises");

            migrationBuilder.DropTable(
                name: "DayPlans");

            migrationBuilder.DropTable(
                name: "WorkoutPlans");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "WorkoutSets");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "WorkoutSets");

            migrationBuilder.DropColumn(
                name: "TargetReps",
                table: "WorkoutSets");

            migrationBuilder.DropColumn(
                name: "TargetWeight",
                table: "WorkoutSets");

            migrationBuilder.RenameColumn(
                name: "ActualWeight",
                table: "WorkoutSets",
                newName: "Weight");

            migrationBuilder.RenameColumn(
                name: "ActualReps",
                table: "WorkoutSets",
                newName: "Reps");
        }
    }
}

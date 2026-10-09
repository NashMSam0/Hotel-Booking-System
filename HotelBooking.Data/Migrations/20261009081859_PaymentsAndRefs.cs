using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HotelBooking.Data.Migrations
{
    /// <inheritdoc />
    public partial class PaymentsAndRefs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "RoomBookings",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "RoomBookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "RoomBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "DiningBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "ActivityBookings",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PaymentStatus",
                table: "ActivityBookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "ActivityBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingKind = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                });

            // Backfill unique references for pre-existing rows, then enforce NOT NULL + unique.
            migrationBuilder.Sql("UPDATE RoomBookings SET Reference = 'KZ-' + LEFT(REPLACE(CAST(NEWID() AS nvarchar(36)), '-', ''), 6) WHERE Reference IS NULL");
            migrationBuilder.Sql("UPDATE ActivityBookings SET Reference = 'KZ-' + LEFT(REPLACE(CAST(NEWID() AS nvarchar(36)), '-', ''), 6) WHERE Reference IS NULL");
            migrationBuilder.Sql("UPDATE DiningBookings SET Reference = 'KZ-' + LEFT(REPLACE(CAST(NEWID() AS nvarchar(36)), '-', ''), 6) WHERE Reference IS NULL");

            migrationBuilder.AlterColumn<string>(
                name: "Reference",
                table: "RoomBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Reference",
                table: "ActivityBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Reference",
                table: "DiningBookings",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomBookings_Reference",
                table: "RoomBookings",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiningBookings_Reference",
                table: "DiningBookings",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityBookings_Reference",
                table: "ActivityBookings",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Reference",
                table: "Payments",
                column: "Reference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_RoomBookings_Reference",
                table: "RoomBookings");

            migrationBuilder.DropIndex(
                name: "IX_DiningBookings_Reference",
                table: "DiningBookings");

            migrationBuilder.DropIndex(
                name: "IX_ActivityBookings_Reference",
                table: "ActivityBookings");

            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "RoomBookings");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "RoomBookings");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "RoomBookings");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "DiningBookings");

            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "ActivityBookings");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "ActivityBookings");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "ActivityBookings");
        }
    }
}

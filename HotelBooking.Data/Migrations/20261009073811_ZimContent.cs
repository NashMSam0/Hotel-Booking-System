using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HotelBooking.Data.Migrations
{
    /// <inheritdoc />
    public partial class ZimContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "RoomTypes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 15, "Guided rainforest walk to the main viewpoints", 180, "/images/fallsdeal.jpg", "Falls rainforest gate", "Victoria Falls Guided Walk", 35m });

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 40, "Evening boat cruise with drinks and game viewing", 150, "/images/act-cruise.jpg", "Zambezi jetty", "Zambezi Sunset Cruise", 55m });

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 6, "Open-vehicle safari among elephant herds", 300, "/images/safarideal.jpg", "Hwange Main Camp", "Hwange Game Drive", 90m });

            migrationBuilder.InsertData(
                table: "Activities",
                columns: new[] { "Id", "Capacity", "Description", "DurationMinutes", "ImageUrl", "IsActive", "Location", "Name", "PricePerPerson" },
                values: new object[,]
                {
                    { 4, 4, "111m jump off the Victoria Falls Bridge", 120, "/images/act-bungy.jpg", true, "Falls Bridge", "Bridge Bungee Jump", 160m },
                    { 5, 20, "Guided tour of the medieval walled city", 240, "/images/greatzim.jpg", true, "Masvingo gate", "Great Zimbabwe Tour", 30m }
                });

            migrationBuilder.UpdateData(
                table: "RoomTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/room-standard.jpg");

            migrationBuilder.UpdateData(
                table: "RoomTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/room-deluxe.jpg");

            migrationBuilder.UpdateData(
                table: "RoomTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/room-suite.jpg");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "RoomTypes");

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 6, "60-min full body massage", 60, null, "Wellness floor", "Spa Session", 50m });

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 30, "Half-day pool + sauna", 240, null, "Rooftop", "Pool Access", 20m });

            migrationBuilder.UpdateData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Capacity", "Description", "DurationMinutes", "ImageUrl", "Location", "Name", "PricePerPerson" },
                values: new object[] { 15, "Guided 3h city tour", 180, null, "Lobby pickup", "City Tour", 35m });
        }
    }
}

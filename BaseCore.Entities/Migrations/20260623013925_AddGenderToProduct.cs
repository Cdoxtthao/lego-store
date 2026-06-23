using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddGenderToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Gender')
                BEGIN
                    ALTER TABLE Products ADD Gender NVARCHAR(MAX) NULL DEFAULT N'Khác';
                END
            ");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(912));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2925));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2927));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2928));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 5,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2930));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 6,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2931));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 7,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2932));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 8,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2933));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 9,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2935));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 10,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 39, 24, 543, DateTimeKind.Utc).AddTicks(2936));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(3676));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5523));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5526));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5528));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 5,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5529));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 6,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5530));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 7,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5531));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 8,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5532));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 9,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5533));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 10,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 1, 1, 31, 920, DateTimeKind.Utc).AddTicks(5534));
        }
    }
}

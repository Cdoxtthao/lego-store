using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Entities.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSupplierWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFromProposal",
                table: "SupplierReceipts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SellerId",
                table: "SupplierReceipts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SellerId",
                table: "SupplierProposals",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 28, DateTimeKind.Utc).AddTicks(8710));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(544));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(571));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(573));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 5,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(574));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 6,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(575));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 7,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(575));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 8,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(576));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 9,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(577));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 10,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 2, 22, 47, 29, DateTimeKind.Utc).AddTicks(578));

            migrationBuilder.CreateIndex(
                name: "IX_SupplierReceipts_SellerId",
                table: "SupplierReceipts",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierProposals_SellerId",
                table: "SupplierProposals",
                column: "SellerId");

            migrationBuilder.AddForeignKey(
                name: "FK_SupplierProposals_Users_SellerId",
                table: "SupplierProposals",
                column: "SellerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SupplierReceipts_Users_SellerId",
                table: "SupplierReceipts",
                column: "SellerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SupplierProposals_Users_SellerId",
                table: "SupplierProposals");

            migrationBuilder.DropForeignKey(
                name: "FK_SupplierReceipts_Users_SellerId",
                table: "SupplierReceipts");

            migrationBuilder.DropIndex(
                name: "IX_SupplierReceipts_SellerId",
                table: "SupplierReceipts");

            migrationBuilder.DropIndex(
                name: "IX_SupplierProposals_SellerId",
                table: "SupplierProposals");

            migrationBuilder.DropColumn(
                name: "IsFromProposal",
                table: "SupplierReceipts");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "SupplierReceipts");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "SupplierProposals");

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
    }
}

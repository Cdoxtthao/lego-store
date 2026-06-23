using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ImportPrice')
                BEGIN
                    ALTER TABLE Products ADD ImportPrice DECIMAL(18,2) NOT NULL DEFAULT 0;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'IsDeleted')
                BEGIN
                    ALTER TABLE Orders ADD IsDeleted BIT NOT NULL DEFAULT 0;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Vouchers')
                BEGIN
                    CREATE TABLE [Vouchers] (
                        [Id] int NOT NULL IDENTITY,
                        [Code] nvarchar(max) NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [DiscountPercent] int NOT NULL,
                        [ScopeType] nvarchar(max) NOT NULL,
                        [CategoryIds] nvarchar(max) NULL,
                        [ThemeIds] nvarchar(max) NULL,
                        [ProductIds] nvarchar(max) NULL,
                        [StartDate] datetime2 NOT NULL,
                        [EndDate] datetime2 NOT NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedBy] int NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_Vouchers] PRIMARY KEY ([Id])
                    );
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserVouchers')
                BEGIN
                    CREATE TABLE [UserVouchers] (
                        [Id] int NOT NULL IDENTITY,
                        [UserId] int NOT NULL,
                        [VoucherId] int NOT NULL,
                        [IsUsed] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_UserVouchers] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_UserVouchers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
                        CONSTRAINT [FK_UserVouchers_Vouchers_VoucherId] FOREIGN KEY ([VoucherId]) REFERENCES [Vouchers] ([Id]) ON DELETE CASCADE
                    );
                END
            ");

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

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserVouchers_UserId' AND object_id = OBJECT_ID('UserVouchers'))
                BEGIN
                    CREATE INDEX [IX_UserVouchers_UserId] ON [UserVouchers] ([UserId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserVouchers_VoucherId' AND object_id = OBJECT_ID('UserVouchers'))
                BEGIN
                    CREATE INDEX [IX_UserVouchers_VoucherId] ON [UserVouchers] ([VoucherId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserVouchers");

            migrationBuilder.DropTable(
                name: "Vouchers");

            migrationBuilder.DropColumn(
                name: "ImportPrice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(1184));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3489));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3495));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3496));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 5,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3497));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 6,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3498));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 7,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3499));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 8,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3501));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 9,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3531));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 10,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 23, 0, 2, 13, 759, DateTimeKind.Utc).AddTicks(3532));
        }
    }
}

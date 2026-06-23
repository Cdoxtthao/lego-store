using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BaseCore.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationsAndProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ThemeId column if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ThemeId')
                BEGIN
                    ALTER TABLE Products ADD ThemeId INT NULL;
                END
            ");

            // Drop PieceCount if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'PieceCount')
                BEGIN
                    DECLARE @dfName NVARCHAR(200);
                    SELECT @dfName = dc.name
                    FROM sys.default_constraints dc
                    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
                    WHERE dc.parent_object_id = OBJECT_ID('Products') AND c.name = 'PieceCount';

                    IF @dfName IS NOT NULL
                        EXEC('ALTER TABLE Products DROP CONSTRAINT ' + @dfName);

                    ALTER TABLE Products DROP COLUMN PieceCount;
                END
            ");

            // Add Highlights if it does not exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Highlights')
                BEGIN
                    ALTER TABLE Products ADD Highlights NVARCHAR(MAX) NULL;
                END
            ");

            // Add BirthdayEditCount if it does not exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'BirthdayEditCount')
                BEGIN
                    ALTER TABLE Users ADD BirthdayEditCount INT NOT NULL DEFAULT 0;
                END
            ");

            // Add BirthdayRewardReceived if it does not exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'BirthdayRewardReceived')
                BEGIN
                    ALTER TABLE Users ADD BirthdayRewardReceived BIT NOT NULL DEFAULT 0;
                END
            ");

            migrationBuilder.CreateTable(
                name: "ChildProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    BirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChildProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChildProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CreativePosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreativePosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreativePosts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Themes')
                BEGIN
                    CREATE TABLE [Themes] (
                        [Id] int NOT NULL IDENTITY,
                        [Name] nvarchar(max) NOT NULL,
                        [Description] nvarchar(max) NULL,
                        [IsActive] bit NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_Themes] PRIMARY KEY ([Id])
                    );
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CategoryThemes')
                BEGIN
                    CREATE TABLE [CategoryThemes] (
                        [CategoryId] int NOT NULL,
                        [ThemeId] int NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_CategoryThemes] PRIMARY KEY ([CategoryId], [ThemeId]),
                        CONSTRAINT [FK_CategoryThemes_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE,
                        CONSTRAINT [FK_CategoryThemes_Themes_ThemeId] FOREIGN KEY ([ThemeId]) REFERENCES [Themes] ([Id]) ON DELETE CASCADE
                    );
                END
            ");

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

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_ThemeId' AND object_id = OBJECT_ID('Products'))
                BEGIN
                    CREATE INDEX [IX_Products_ThemeId] ON [Products] ([ThemeId]);
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CategoryThemes_ThemeId' AND object_id = OBJECT_ID('CategoryThemes'))
                BEGIN
                    CREATE INDEX [IX_CategoryThemes_ThemeId] ON [CategoryThemes] ([ThemeId]);
                END
            ");

            migrationBuilder.CreateIndex(
                name: "IX_ChildProfiles_UserId",
                table: "ChildProfiles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CreativePosts_UserId",
                table: "CreativePosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Products_Themes_ThemeId' AND parent_object_id = OBJECT_ID('Products'))
                BEGIN
                    ALTER TABLE [Products] ADD CONSTRAINT [FK_Products_Themes_ThemeId] FOREIGN KEY ([ThemeId]) REFERENCES [Themes] ([Id]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Themes_ThemeId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "CategoryThemes");

            migrationBuilder.DropTable(
                name: "ChildProfiles");

            migrationBuilder.DropTable(
                name: "CreativePosts");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Themes");

            migrationBuilder.DropIndex(
                name: "IX_Products_ThemeId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BirthdayEditCount",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BirthdayRewardReceived",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Highlights",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ThemeId",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 948, DateTimeKind.Utc).AddTicks(9745));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1338));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1340));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1341));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 5,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1342));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 6,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1343));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 7,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1344));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 8,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1345));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 9,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1346));

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 10,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 20, 15, 59, 27, 949, DateTimeKind.Utc).AddTicks(1347));
        }
    }
}

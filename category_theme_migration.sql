-- =============================================
-- MIGRATION: Category <-> Theme (1-N) -> (N-N)
-- Chạy script này TRỰC TIẾP trên SQL Server (giống category.sql, product.sql)
-- vì bảng Themes hiện tại không được EF Migrations theo dõi
-- (xem ConfigureWarnings(PendingModelChangesWarning) trong Program.cs).
--
-- Việc này thực hiện:
--   1) Tạo bảng CategoryThemes (bảng nối N-N)
--   2) Backfill CategoryThemes từ Themes.CategoryId hiện có
--   3) Gộp (dedupe) các Theme trùng tên (không phân biệt hoa/thường, đã trim)
--      thành 1 Theme gốc (Id nhỏ nhất), trỏ lại CategoryThemes + Products.ThemeId
--      về Theme gốc, rồi xóa các Theme trùng còn lại
--   4) Xóa cột Themes.CategoryId (không còn dùng — Theme giờ là thực thể
--      độc lập, dùng chung qua bảng nối)
-- =============================================
USE LegoStoreDB;
GO

BEGIN TRANSACTION;

-- ---------------------------------------------
-- BƯỚC 1: Tạo bảng CategoryThemes nếu chưa có
-- ---------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CategoryThemes')
BEGIN
    CREATE TABLE CategoryThemes (
        CategoryId INT NOT NULL,
        ThemeId    INT NOT NULL,
        CreatedAt  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT PK_CategoryThemes PRIMARY KEY (CategoryId, ThemeId),
        CONSTRAINT FK_CategoryThemes_Categories FOREIGN KEY (CategoryId)
            REFERENCES Categories(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CategoryThemes_Themes FOREIGN KEY (ThemeId)
            REFERENCES Themes(Id) ON DELETE NO ACTION
    );
END
GO

-- ---------------------------------------------
-- BƯỚC 2: Backfill liên kết hiện có (Theme.CategoryId -> CategoryThemes)
-- ---------------------------------------------
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Themes') AND name = 'CategoryId')
BEGIN
    INSERT INTO CategoryThemes (CategoryId, ThemeId, CreatedAt)
    SELECT t.CategoryId, t.Id, GETUTCDATE()
    FROM Themes t
    WHERE NOT EXISTS (
        SELECT 1 FROM CategoryThemes ct
        WHERE ct.CategoryId = t.CategoryId AND ct.ThemeId = t.Id
    );
END
GO

-- ---------------------------------------------
-- BƯỚC 3: Gộp các Theme trùng tên (chỉ cần trùng tên = cùng 1 chủ đề)
-- Theme gốc = Id nhỏ nhất trong nhóm cùng tên (đã chuẩn hoá LOWER/TRIM)
-- ---------------------------------------------
IF OBJECT_ID('tempdb..#ThemeCanonical') IS NOT NULL DROP TABLE #ThemeCanonical;

SELECT
    Id,
    LOWER(LTRIM(RTRIM(Name))) AS NameKey,
    MIN(Id) OVER (PARTITION BY LOWER(LTRIM(RTRIM(Name)))) AS CanonicalId
INTO #ThemeCanonical
FROM Themes;

-- 3a) Chuyển các liên kết CategoryThemes của Theme trùng -> Theme gốc (bỏ trùng)
INSERT INTO CategoryThemes (CategoryId, ThemeId, CreatedAt)
SELECT DISTINCT ct.CategoryId, tc.CanonicalId, GETUTCDATE()
FROM CategoryThemes ct
JOIN #ThemeCanonical tc ON tc.Id = ct.ThemeId
WHERE tc.Id <> tc.CanonicalId
  AND NOT EXISTS (
      SELECT 1 FROM CategoryThemes ct2
      WHERE ct2.CategoryId = ct.CategoryId AND ct2.ThemeId = tc.CanonicalId
  );

DELETE ct
FROM CategoryThemes ct
JOIN #ThemeCanonical tc ON tc.Id = ct.ThemeId
WHERE tc.Id <> tc.CanonicalId;

-- 3b) Chuyển Products.ThemeId của Theme trùng -> Theme gốc
UPDATE p
SET p.ThemeId = tc.CanonicalId
FROM Products p
JOIN #ThemeCanonical tc ON tc.Id = p.ThemeId
WHERE tc.Id <> tc.CanonicalId;

-- 3c) Xóa các Theme trùng (không phải Theme gốc)
DELETE t
FROM Themes t
JOIN #ThemeCanonical tc ON tc.Id = t.Id
WHERE tc.Id <> tc.CanonicalId;

DROP TABLE #ThemeCanonical;
GO

-- ---------------------------------------------
-- BƯỚC 4: Xóa cột Themes.CategoryId (đã chuyển hết qua CategoryThemes)
-- ---------------------------------------------
DECLARE @fkName NVARCHAR(200);
SELECT @fkName = fk.name
FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
WHERE t.name = 'Themes'
  AND EXISTS (
      SELECT 1 FROM sys.foreign_key_columns fkc
      JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
      WHERE fkc.constraint_object_id = fk.object_id AND c.name = 'CategoryId'
  );

IF @fkName IS NOT NULL
    EXEC('ALTER TABLE Themes DROP CONSTRAINT ' + @fkName);

-- Xóa index trên CategoryId nếu có
DECLARE @ixName NVARCHAR(200);
SELECT @ixName = i.name
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE t.name = 'Themes' AND c.name = 'CategoryId' AND i.name IS NOT NULL;

IF @ixName IS NOT NULL
    EXEC('DROP INDEX ' + @ixName + ' ON Themes');

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Themes') AND name = 'CategoryId')
    ALTER TABLE Themes DROP COLUMN CategoryId;
GO

COMMIT TRANSACTION;
GO

-- ---------------------------------------------
-- Kiểm tra nhanh sau khi chạy
-- ---------------------------------------------
-- SELECT * FROM CategoryThemes;
-- SELECT t.Id, t.Name, COUNT(ct.CategoryId) AS SoDanhMuc FROM Themes t LEFT JOIN CategoryThemes ct ON ct.ThemeId = t.Id GROUP BY t.Id, t.Name;

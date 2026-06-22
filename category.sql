USE LegoStoreDB;
GO

DELETE FROM Categories
DBCC CHECKIDENT ('Categories', RESEED, 0)
-- =============================================
-- BƯỚC 1: INSERT CATEGORIES
-- =============================================
INSERT INTO Categories (Name, Description, ImageUrl, IsActive, CreatedAt)
VALUES
('Star Wars', 'LEGO Star Wars Collection', '/images/categories/starwars.png', 1, GETDATE()),
('Technic', 'LEGO Technic Vehicles', '/images/categories/technic.png', 1, GETDATE()),
('One Piece', 'LEGO One Piece Collection', '/images/categories/onepiece.png', 1, GETDATE()),
('Pokemon', 'LEGO Pokemon Collection', '/images/categories/pokemon.png', 1, GETDATE()),
('Ninjago', 'LEGO Ninjago Collection', '/images/categories/ninjago.png', 1, GETDATE()),
('Harry Potter', 'LEGO Harry Potter Collection', '/images/categories/harrypotter.png', 1, GETDATE()),
('Icons', 'LEGO Icons Collection', '/images/categories/icons.png', 1, GETDATE()),
('Super Mario', 'LEGO Super Mario Collection', '/images/categories/mario.png', 1, GETDATE()),
('Disney', 'LEGO Disney Collection', '/images/categories/disney.png', 1, GETDATE()),
('Jurassic World', 'LEGO Jurassic World Collection', '/images/categories/jurassic.png', 1, GETDATE()),
('Sports', 'LEGO Sports Collection', '/images/categories/sports.png', 1, GETDATE()),
('Botanicals', 'LEGO Botanical Collection', '/images/categories/botanical.png', 1, GETDATE()),
('Ideas', 'LEGO Ideas Collection', '/images/categories/ideas.png', 1, GETDATE()),
('Creator', 'LEGO Creator Collection', '/images/categories/creator.png', 1, GETDATE());

-- =============================================
-- BƯỚC 2: INSERT PRODUCTS + IMAGES
-- Mỗi sản phẩm gồm:
--   INSERT INTO Products → lấy Id vừa tạo
--   INSERT INTO ProductImages → 5 ảnh
-- =============================================

-- ---- SẢN PHẨM 1: Monkey King Ultra Mech ----
DECLARE @ProductId INT;

INSERT INTO Products (Name, Description, Price, OldPrice, StockQuantity, CategoryId, Theme, AgeRange, Highlights, SetNumber, IsActive, IsFeatured)
VALUES (
    'Monkey King Ultra Mech',
    'Bộ LEGO Monkie Kid với siêu robot Monkey King huyền thoại',
    1299000,   -- giá hiện tại
    1599000,   -- giá gốc (để hiện badge giảm giá)
    50,
    (SELECT Id FROM Categories WHERE Name = 'Monkie Kid'),
    'Monkie Kid',
    '8+',
    N'Robot Khỉ Vương có cánh tay vươn dài và xoay được, đi kèm minifigure Tôn Ngộ Không cùng Gậy Như Ý phát sáng',
    '80048',
    1,
    1  -- IsFeatured = true
);

SET @ProductId = SCOPE_IDENTITY(); -- lấy Id vừa insert

INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder) VALUES
(@ProductId, '/images/products/Monkey-King-Ultra-Me-1.png', 1, 1), -- ảnh chính
(@ProductId, '/images/products/Monkey-King-Ultra-Me-2.png', 0, 2),
(@ProductId, '/images/products/Monkey-King-Ultra-Me-3.png', 0, 3),
(@ProductId, '/images/products/Monkey-King-Ultra-Me-4.png', 0, 4),
(@ProductId, '/images/products/Monkey-King-Ultra-Me-5.png', 0, 5);

-- ---- SẢN PHẨM 2: Mythical Creature Qilin ----
INSERT INTO Products (Name, Description, Price, OldPrice, StockQuantity, CategoryId, Theme, AgeRange, Highlights, SetNumber, IsActive, IsFeatured)
VALUES (
    'Mythical Creature Qilin',
    'Sinh vật thần thoại Kỳ Lân huyền bí từ bộ sưu tập Icons',
    899000,
    NULL,  -- không có giá gốc = không giảm giá
    30,
    (SELECT Id FROM Categories WHERE Name = 'Icons'),
    'Icons',
    '10+',
    N'Mô hình sinh vật thần thoại Kỳ Lân tạo hình uốn lượn sống động, có đế trưng bày kèm bảng tên, thuộc dòng sưu tập Icons',
    '10424',
    1,
    0
);

SET @ProductId = SCOPE_IDENTITY();

INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder) VALUES
(@ProductId, '/images/products/Mythical-Creature-Qilin-1.png', 1, 1),
(@ProductId, '/images/products/Mythical-Creature-Qilin-2.png', 0, 2),
(@ProductId, '/images/products/Mythical-Creature-Qilin-3.png', 0, 3),
(@ProductId, '/images/products/Mythical-Creature-Qilin-4.png', 0, 4),
(@ProductId, '/images/products/Mythical-Creature-Qilin-5.png', 0, 5);

-- ---- SẢN PHẨM 3: Erlang's Celestial Mech ----
INSERT INTO Products (Name, Description, Price, OldPrice, StockQuantity, CategoryId, Theme, AgeRange, Highlights, SetNumber, IsActive, IsFeatured)
VALUES (
    'Erlang''s Celestial Mech',  -- dấu '' để escape dấu nháy đơn
    'Robot thiên đình của Nhị Lang Thần trong bộ Monkie Kid',
    1099000,
    1299000,
    25,
    (SELECT Id FROM Categories WHERE Name = 'Monkie Kid'),
    'Monkie Kid',
    '8+',
    N'Robot thiên giới của Nhị Lang Thần có khớp cử động linh hoạt, trang bị Tam Diện Thần Khí và minifigure Hao Thiên Khuyển',
    '80053',
    1,
    1
);

SET @ProductId = SCOPE_IDENTITY();

INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder) VALUES
(@ProductId, '/images/products/Erlang''s-Celestial-Mech-1.png', 1, 1),
(@ProductId, '/images/products/Erlang''s-Celestial-Mech-2.png', 0, 2),
(@ProductId, '/images/products/Erlang''s-Celestial-Mech-3.png', 0, 3),
(@ProductId, '/images/products/Erlang''s-Celestial-Mech-4.png', 0, 4);
-- Sản phẩm này chỉ có 4 ảnh

-- ---- SẢN PHẨM 4: Celestial Pagoda ----
INSERT INTO Products (Name, Description, Price, OldPrice, StockQuantity, CategoryId, Theme, AgeRange, Highlights, SetNumber, IsActive, IsFeatured)
VALUES (
    'Celestial Pagoda',
    'Tháp thiên đình tráng lệ từ bộ Monkie Kid',
    2499000,
    2999000,
    15,
    (SELECT Id FROM Categories WHERE Name = 'Monkie Kid'),
    'Monkie Kid',
    '14+',
    N'Tháp thiên đình nhiều tầng có thể mở để lộ nội thất chi tiết, đi kèm khu vực chiến đấu và dàn nhân vật Monkie Kid',
    '80058',
    1,
    1
);

SET @ProductId = SCOPE_IDENTITY();

INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder) VALUES
(@ProductId, '/images/products/Celestial-Pagoda-1.png', 1, 1),
(@ProductId, '/images/products/Celestial-Pagoda-2.png', 0, 2),
(@ProductId, '/images/products/Celestial-Pagoda-3.png', 0, 3),
(@ProductId, '/images/products/Celestial-Pagoda-4.png', 0, 4),
(@ProductId, '/images/products/Celestial-Pagoda-5.png', 0, 5);
GO
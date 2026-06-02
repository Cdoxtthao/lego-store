INSERT INTO Products
(Name, Description, Price, OldPrice, StockQuantity, ImageUrl, CategoryId, Theme, AgeRange, PieceCount, SetNumber, IsActive, IsFeatured, CreatedAt, UpdatedAt)
VALUES

--('TIE Interceptor', 'Star Wars TIE Interceptor LEGO Set', 3299000, 3599000, 20, '/images/products/TIE-Interceptor-1.png', 1, 'Star Wars', '18+', 1931, '75382', 1, 1, GETDATE(), GETDATE()),

('AT-RT Driver Helmet', 'Star Wars Helmet Collection', 1899000, 2099000, 15, '/images/products/AT-RT-Driver-Helmet-1.png', 1, 'Star Wars', '18+', 730, '75429', 1, 0, GETDATE(), GETDATE()),

('Anzellan Starship', 'Star Wars Anzellan Starship', 1599000, 1799000, 25, '/images/products/Anzellan-Starship-1.png', 1, 'Star Wars', '10+', 502, '75384', 1, 0, GETDATE(), GETDATE()),

('Bugatti Centodieci', 'LEGO Technic Bugatti Hypercar', 4999000, 5399000, 10, '/images/products/Bugatti-Centodieci-1.png', 2, 'Technic', '18+', 2278, '42160', 1, 1, GETDATE(), GETDATE()),

('Audi Revolut F1', 'Audi Formula 1 LEGO Car', 2499000, 2799000, 18, '/images/products/Audi-Revolut-F1-1.png', 2, 'Technic', '18+', 1100, '42165', 1, 0, GETDATE(), GETDATE()),

('Ducati Panigale V4', 'LEGO Ducati Motorcycle', 2199000, 2399000, 12, '/images/products/Ducati-Panigale-V4-1.png', 2, 'Technic', '18+', 1603, '42107', 1, 0, GETDATE(), GETDATE()),

('Kawasaki Ninja H2R', 'LEGO Kawasaki Ninja Bike', 1999000, 2199000, 14, '/images/products/Kawasaki-Ninja-H2R-1.png', 2, 'Technic', '18+', 643, '42170', 1, 0, GETDATE(), GETDATE()),

('Honda S2000', 'Fast and Furious Honda S2000', 1299000, 1499000, 20, '/images/products/Honda-S2000-1.png', 2, 'Technic', '9+', 300, '76934', 1, 0, GETDATE(), GETDATE()),

('Fast and Furious Toyota MK4', 'Toyota Supra MK4 LEGO', 1499000, 1699000, 16, '/images/products/Fast-and-Furious-Toyota-MK4-1.png', 2, 'Technic', '10+', 810, '76917', 1, 0, GETDATE(), GETDATE()),

('Baratie Restaurant', 'One Piece Floating Restaurant', 3899000, 4299000, 9, '/images/products/Baratie-Restaurant-1.png', 3, 'One Piece', '18+', 3402, 'OP001', 1, 1, GETDATE(), GETDATE()),

('Going Merry', 'One Piece Going Merry Ship', 2599000, 2799000, 14, '/images/products/Going-Merry-1.png', 3, 'One Piece', '14+', 1376, 'OP002', 1, 0, GETDATE(), GETDATE()),

('Gum Gum Fruit', 'One Piece Devil Fruit Display', 899000, 999000, 22, '/images/products/Gum-Gum-Fruit-1.png', 3, 'One Piece', '12+', 250, 'OP003', 1, 0, GETDATE(), GETDATE()),

('Pikachu', 'Pokemon Pikachu LEGO Figure', 999000, 1199000, 25, '/images/products/Pikachu-1.png', 4, 'Pokemon', '8+', 350, 'PK001', 1, 0, GETDATE(), GETDATE()),

('Eevee', 'Pokemon Eevee LEGO Figure', 999000, 1099000, 18, '/images/products/Eevee-1.png', 4, 'Pokemon', '8+', 290, 'PK002', 1, 0, GETDATE(), GETDATE()),

('Venusaur Charizard Blastoise', 'Pokemon Starter Evolution Collection', 3599000, 3899000, 8, '/images/products/Venusaur-Charizard-Blastoise-1.png', 4, 'Pokemon', '16+', 2200, 'PK003', 1, 1, GETDATE(), GETDATE()),

('Lloyd Jet Mech', 'Ninjago Lloyd Mech', 1699000, 1899000, 17, '/images/products/Lloyd''s-Jet-Mech-1.png', 5, 'Ninjago', '10+', 1112, 'NJ001', 1, 0, GETDATE(), GETDATE()),

('Zane Battle Suit Mech', 'Ninjago Zane Mech Armor', 1499000, 1699000, 20, '/images/products/Zane''s-Battle-Suit-Mech-1.png', 5, 'Ninjago', '9+', 890, 'NJ002', 1, 0, GETDATE(), GETDATE()),

('Temple Bounty', 'Ninjago Temple Ship', 4299000, 4699000, 7, '/images/products/The-Temple-Bounty-1.png', 5, 'Ninjago', '18+', 3250, 'NJ003', 1, 1, GETDATE(), GETDATE()),

('Dumbledore Office', 'Harry Potter Hogwarts Office', 2299000, 2499000, 12, '/images/products/Dumbledore''s-Office-1.png', 6, 'Harry Potter', '14+', 1654, 'HP001', 1, 0, GETDATE(), GETDATE()),

('Grand Piano', 'LEGO Grand Piano', 6999000, 7499000, 5, '/images/products/Grand-Piano-1.png', 7, 'Icons', '18+', 3662, '21323', 1, 1, GETDATE(), GETDATE()),

('NASA Launch System', 'NASA Rocket LEGO Set', 5999000, 6499000, 6, '/images/products/NASA-Launch-System-1.png', 7, 'Icons', '18+', 3601, '10341', 1, 1, GETDATE(), GETDATE()),

('Piranha Plant', 'Super Mario Piranha Plant', 1499000, 1699000, 15, '/images/products/Piranha-Plant-1.png', 8, 'Super Mario', '18+', 540, '71426', 1, 0, GETDATE(), GETDATE()),

('Mario Kart', 'Mario Kart Racing Set', 1799000, 1999000, 18, '/images/products/Mario-Kart-1.png', 8, 'Super Mario', '8+', 790, '71431', 1, 0, GETDATE(), GETDATE()),

('Pua', 'Disney Moana Pua Figure', 799000, 899000, 30, '/images/products/Pua-1.png', 9, 'Disney', '6+', 220, 'DS001', 1, 0, GETDATE(), GETDATE()),

('Glinda Wedding Day', 'Wicked Glinda LEGO Set', 1699000, 1899000, 11, '/images/products/Glinda''s-Wedding-Day-1.png', 9, 'Disney', '12+', 1000, 'DS002', 1, 0, GETDATE(), GETDATE()),

('Spinosaurus Escape', 'Jurassic World Dinosaur Escape', 1899000, 2099000, 14, '/images/products/Spinosaurus-Escape-1.png', 10, 'Jurassic World', '10+', 780, 'JW001', 1, 0, GETDATE(), GETDATE()),

('T-Rex', 'Jurassic World T-Rex Attack', 2399000, 2699000, 10, '/images/products/T-Rex-1.png', 10, 'Jurassic World', '12+', 1200, 'JW002', 1, 1, GETDATE(), GETDATE()),

('Triceratops', 'Jurassic World Triceratops Set', 1499000, 1699000, 12, '/images/products/Triceratops-1.png', 10, 'Jurassic World', '8+', 620, 'JW003', 1, 0, GETDATE(), GETDATE()),

('CR7', 'Cristiano Ronaldo LEGO Brickheadz', 999000, 1199000, 22, '/images/products/CR7-1.png', 11, 'Sports', '10+', 400, 'SP001', 1, 0, GETDATE(), GETDATE()),

('Messi', 'Lionel Messi LEGO Brickheadz', 999000, 1199000, 22, '/images/products/Messi-1.png', 11, 'Sports', '10+', 400, 'SP002', 1, 0, GETDATE(), GETDATE()),

('Mbappe', 'Kylian Mbappe LEGO Figure', 999000, 1199000, 22, '/images/products/Mbappe-1.png', 11, 'Sports', '10+', 400, 'SP003', 1, 0, GETDATE(), GETDATE()),

('Vini Jr', 'Vinicius Junior LEGO Figure', 999000, 1199000, 20, '/images/products/Vini-Jr-1.png', 11, 'Sports', '10+', 400, 'SP004', 1, 0, GETDATE(), GETDATE()),

('Soccer Ball', 'LEGO Football Collection', 799000, 899000, 35, '/images/products/Soccer-Ball-1.png', 11, 'Sports', '6+', 250, 'SP005', 1, 0, GETDATE(), GETDATE()),

('Black Dahlia Flower', 'LEGO Botanical Flower', 1299000, 1499000, 20, '/images/products/Black-Dahlia-Flower-1.png', 12, 'Botanicals', '18+', 450, 'BT001', 1, 0, GETDATE(), GETDATE()),

('Woodland Mushrooms', 'LEGO Botanical Mushroom Set', 1199000, 1399000, 18, '/images/products/Woodland-Mushrooms-1.png', 12, 'Botanicals', '18+', 390, 'BT002', 1, 0, GETDATE(), GETDATE()),

('Great Deku Tree', 'Legend of Zelda Deku Tree', 7999000, 8499000, 4, '/images/products/Great-Deku-Tree-1.png', 13, 'Ideas', '18+', 4500, 'IDEA001', 1, 1, GETDATE(), GETDATE()),

('Shrek Donkey', 'Shrek LEGO Display Set', 1999000, 2199000, 9, '/images/products/Shrek-Donkey-1.png', 13, 'Ideas', '16+', 980, 'IDEA002', 1, 0, GETDATE(), GETDATE()),

('Celestial Pagoda', 'Asian Architecture Pagoda', 2599000, 2799000, 8, '/images/products/Celestial-Pagoda-1.png', 14, 'Creator', '16+', 1800, 'CR001', 1, 0, GETDATE(), GETDATE());

-- Image
INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder, CreatedAt)
VALUES
(1, '/images/products/TIE-Interceptor-1.png', 1, 1, GETDATE()),
(1, '/images/products/TIE-Interceptor-2.png', 0, 2, GETDATE()),
(1, '/images/products/TIE-Interceptor-3.png', 0, 3, GETDATE()),
(1, '/images/products/TIE-Interceptor-4.png', 0, 4, GETDATE()),
(1, '/images/products/TIE-Interceptor-5.png', 0, 5, GETDATE());
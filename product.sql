INSERT INTO Products
(Name, Description, Price, OldPrice, StockQuantity, ImageUrl, CategoryId, Theme, AgeRange, Highlights, SetNumber, IsActive, IsFeatured, CreatedAt, UpdatedAt)
VALUES

--('TIE Interceptor', 'Star Wars TIE Interceptor LEGO Set', 3299000, 3599000, 20, '/images/products/TIE-Interceptor-1.png', 1, 'Star Wars', '18+', N'', '75382', 1, 1, GETDATE(), GETDATE()),

('AT-RT Driver Helmet', 'Star Wars Helmet Collection', 1899000, 2099000, 15, '/images/products/AT-RT-Driver-Helmet-1.png', 1, 'Star Wars', '18+', N'Mô hình mũ bảo hộ AT-RT Driver tỉ lệ thật, có đế trưng bày kèm bảng tên nhân vật, thuộc dòng Helmet Collection', '75429', 1, 0, GETDATE(), GETDATE()),

('Anzellan Starship', 'Star Wars Anzellan Starship', 1599000, 1799000, 25, '/images/products/Anzellan-Starship-1.png', 1, 'Star Wars', '10+', N'Tàu vũ trụ nhỏ gọn của tộc Anzellan với khoang lái mở được và thiết kế chi tiết đậm chất Star Wars', '75384', 1, 0, GETDATE(), GETDATE()),

('Bugatti Centodieci', 'LEGO Technic Bugatti Hypercar', 4999000, 5399000, 10, '/images/products/Bugatti-Centodieci-1.png', 2, 'Technic', '18+', N'Mô hình siêu xe Bugatti Centodieci với thiết kế khí động học đặc trưng, cửa mở kiểu cánh chim và nội thất chi tiết', '42160', 1, 1, GETDATE(), GETDATE()),

('Audi Revolut F1', 'Audi Formula 1 LEGO Car', 2499000, 2799000, 18, '/images/products/Audi-Revolut-F1-1.png', 2, 'Technic', '18+', N'Xe đua F1 mô phỏng chi tiết khung gầm, vô lăng xoay được và bánh xe kiểu lốp đua thật', '42165', 1, 0, GETDATE(), GETDATE()),

('Ducati Panigale V4', 'LEGO Ducati Motorcycle', 2199000, 2399000, 12, '/images/products/Ducati-Panigale-V4-1.png', 2, 'Technic', '18+', N'Mô phỏng động cơ Ducati Panigale V4 với piston chuyển động, hộp số 8 cấp, hệ thống lái và chân chống như xe thật', '42107', 1, 0, GETDATE(), GETDATE()),

('Kawasaki Ninja H2R', 'LEGO Kawasaki Ninja Bike', 1999000, 2199000, 14, '/images/products/Kawasaki-Ninja-H2R-1.png', 2, 'Technic', '18+', N'Mô hình xe phân khối lớn Kawasaki Ninja H2R có thể dựng chân chống, xoay tay lái và mô phỏng khung sườn chi tiết', '42170', 1, 0, GETDATE(), GETDATE()),

('Honda S2000', 'Fast and Furious Honda S2000', 1299000, 1499000, 20, '/images/products/Honda-S2000-1.png', 2, 'Technic', '9+', N'Xe đua phong cách Fast & Furious với tem trang trí đặc trưng, đi kèm minifigure tài xế', '76934', 1, 0, GETDATE(), GETDATE()),

('Fast and Furious Toyota MK4', 'Toyota Supra MK4 LEGO', 1499000, 1699000, 16, '/images/products/Fast-and-Furious-Toyota-MK4-1.png', 2, 'Technic', '10+', N'Mô hình xe đua Toyota Supra MK4 phong cách Fast & Furious, đi kèm minifigure và bệ trưng bày có bảng tên', '76917', 1, 0, GETDATE(), GETDATE()),

('Baratie Restaurant', 'One Piece Floating Restaurant', 3899000, 4299000, 9, '/images/products/Baratie-Restaurant-1.png', 3, 'One Piece', '18+', N'Nhà hàng nổi nhiều tầng với khu bếp, quầy phục vụ và khoang thuyền nhỏ, đi kèm các minifigure đầu bếp One Piece', 'OP001', 1, 1, GETDATE(), GETDATE()),

('Going Merry', 'One Piece Going Merry Ship', 2599000, 2799000, 14, '/images/products/Going-Merry-1.png', 3, 'One Piece', '14+', N'Thuyền Going Merry với đầu sư tử biểu tượng, cánh buồm đặc trưng và khoang thuyền chi tiết cho thủy thủ đoàn', 'OP002', 1, 0, GETDATE(), GETDATE()),

('Gum Gum Fruit', 'One Piece Devil Fruit Display', 899000, 999000, 22, '/images/products/Gum-Gum-Fruit-1.png', 3, 'One Piece', '12+', N'Mô hình trưng bày Trái Ác Quỷ Gomu Gomu kèm đế và bảng tên nhân vật Luffy', 'OP003', 1, 0, GETDATE(), GETDATE()),

('Pikachu', 'Pokemon Pikachu LEGO Figure', 999000, 1199000, 25, '/images/products/Pikachu-1.png', 4, 'Pokemon', '8+', N'Mô hình Pikachu có thể đứng vững nhiều góc, chi tiết tai và đuôi đặc trưng, phù hợp trưng bày', 'PK001', 1, 0, GETDATE(), GETDATE()),

('Eevee', 'Pokemon Eevee LEGO Figure', 999000, 1099000, 18, '/images/products/Eevee-1.png', 4, 'Pokemon', '8+', N'Mô hình Eevee với phần lông được tạo hình tỉ mỉ, đi kèm đế trưng bày riêng', 'PK002', 1, 0, GETDATE(), GETDATE()),

('Venusaur Charizard Blastoise', 'Pokemon Starter Evolution Collection', 3599000, 3899000, 8, '/images/products/Venusaur-Charizard-Blastoise-1.png', 4, 'Pokemon', '16+', N'Bộ 3 mô hình tiến hóa Venusaur, Charizard và Blastoise, mỗi mẫu có đế trưng bày và bảng tên riêng', 'PK003', 1, 1, GETDATE(), GETDATE()),

('Lloyd Jet Mech', 'Ninjago Lloyd Mech', 1699000, 1899000, 17, '/images/products/Lloyd''s-Jet-Mech-1.png', 5, 'Ninjago', '10+', N'Robot phản lực của Lloyd với cánh bung mở và vũ khí kiếm sấm sét, đi kèm minifigure Lloyd', 'NJ001', 1, 0, GETDATE(), GETDATE()),

('Zane Battle Suit Mech', 'Ninjago Zane Mech Armor', 1499000, 1699000, 20, '/images/products/Zane''s-Battle-Suit-Mech-1.png', 5, 'Ninjago', '9+', N'Bộ giáp chiến đấu của Zane với tay cử động linh hoạt, trang bị vũ khí băng đặc trưng', 'NJ002', 1, 0, GETDATE(), GETDATE()),

('Temple Bounty', 'Ninjago Temple Ship', 4299000, 4699000, 7, '/images/products/The-Temple-Bounty-1.png', 5, 'Ninjago', '18+', N'Thuyền lùng Temple Bounty nhiều khoang với pháo xoay được và khu vực điều khiển chi tiết', 'NJ003', 1, 1, GETDATE(), GETDATE()),

('Dumbledore Office', 'Harry Potter Hogwarts Office', 2299000, 2499000, 12, '/images/products/Dumbledore''s-Office-1.png', 6, 'Harry Potter', '14+', N'Văn phòng thầy Dumbledore tại Hogwarts với nội thất chi tiết, Thanh Sắp Mũ Phân Loại và phụ kiện phép thuật', 'HP001', 1, 0, GETDATE(), GETDATE()),

('Grand Piano', 'LEGO Grand Piano', 6999000, 7499000, 5, '/images/products/Grand-Piano-1.png', 7, 'Icons', '18+', N'Đàn piano có 25 phím chuyển động thật qua cơ chế búa gõ, kết nối ứng dụng LEGO Powered Up để tự chơi nhạc', '21323', 1, 1, GETDATE(), GETDATE()),

('NASA Launch System', 'NASA Rocket LEGO Set', 5999000, 6499000, 6, '/images/products/NASA-Launch-System-1.png', 7, 'Icons', '18+', N'Mô hình tên lửa đa giai đoạn với tháp phóng di động, khoang Orion có pin năng lượng mặt trời mở ra được', '10341', 1, 1, GETDATE(), GETDATE()),

('Piranha Plant', 'Super Mario Piranha Plant', 1499000, 1699000, 15, '/images/products/Piranha-Plant-1.png', 8, 'Super Mario', '18+', N'Cây Piranha Plant có thể mở miệng và xoay thân, tương tác được với nhân vật LEGO Mario', '71426', 1, 0, GETDATE(), GETDATE()),

('Mario Kart', 'Mario Kart Racing Set', 1799000, 1999000, 18, '/images/products/Mario-Kart-1.png', 8, 'Super Mario', '8+', N'Xe kart đua tốc độ của Mario với cần gạt kích hoạt hiệu ứng, tương thích nhân vật LEGO Mario tương tác', '71431', 1, 0, GETDATE(), GETDATE()),

('Pua', 'Disney Moana Pua Figure', 799000, 899000, 30, '/images/products/Pua-1.png', 9, 'Disney', '6+', N'Mô hình heo con Pua đáng yêu từ phim Moana với tạo hình tỉ mỉ, phù hợp trưng bày', 'DS001', 1, 0, GETDATE(), GETDATE()),

('Glinda Wedding Day', 'Wicked Glinda LEGO Set', 1699000, 1899000, 11, '/images/products/Glinda''s-Wedding-Day-1.png', 9, 'Disney', '12+', N'Mô hình Glinda trong trang phục cưới từ phim Wicked, đi kèm phụ kiện và đế trưng bày', 'DS002', 1, 0, GETDATE(), GETDATE()),

('Spinosaurus Escape', 'Jurassic World Dinosaur Escape', 1899000, 2099000, 14, '/images/products/Spinosaurus-Escape-1.png', 10, 'Jurassic World', '10+', N'Khủng long Spinosaurus có thể cử động hàm và chân, đi kèm xe cứu hộ và minifigure nhân viên công viên', 'JW001', 1, 0, GETDATE(), GETDATE()),

('T-Rex', 'Jurassic World T-Rex Attack', 2399000, 2699000, 10, '/images/products/T-Rex-1.png', 10, 'Jurassic World', '12+', N'Khủng long T-Rex chuyển động được hàm và đầu, đi kèm minifigure và khu vực rào chắn công viên', 'JW002', 1, 1, GETDATE(), GETDATE()),

('Triceratops', 'Jurassic World Triceratops Set', 1499000, 1699000, 12, '/images/products/Triceratops-1.png', 10, 'Jurassic World', '8+', N'Khủng long Triceratops có thể di chuyển đầu và chân, đi kèm lồng vận chuyển và minifigure kiểm lâm', 'JW003', 1, 0, GETDATE(), GETDATE()),

('CR7', 'Cristiano Ronaldo LEGO Brickheadz', 999000, 1199000, 22, '/images/products/CR7-1.png', 11, 'Sports', '10+', N'Mô hình Brickheadz Cristiano Ronaldo với áo đấu và tư thế ăn mừng đặc trưng', 'SP001', 1, 0, GETDATE(), GETDATE()),

('Messi', 'Lionel Messi LEGO Brickheadz', 999000, 1199000, 22, '/images/products/Messi-1.png', 11, 'Sports', '10+', N'Mô hình Brickheadz Lionel Messi trong trang phục đội tuyển, đi kèm đế trưng bày có tên cầu thủ', 'SP002', 1, 0, GETDATE(), GETDATE()),

('Mbappe', 'Kylian Mbappe LEGO Figure', 999000, 1199000, 22, '/images/products/Mbappe-1.png', 11, 'Sports', '10+', N'Mô hình Brickheadz Kylian Mbappe với áo đấu và quả bóng mini đi kèm', 'SP003', 1, 0, GETDATE(), GETDATE()),

('Vini Jr', 'Vinicius Junior LEGO Figure', 999000, 1199000, 20, '/images/products/Vini-Jr-1.png', 11, 'Sports', '10+', N'Mô hình Brickheadz Vinicius Junior trong trang phục thi đấu, đi kèm đế trưng bày', 'SP004', 1, 0, GETDATE(), GETDATE()),

('Soccer Ball', 'LEGO Football Collection', 799000, 899000, 35, '/images/products/Soccer-Ball-1.png', 11, 'Sports', '6+', N'Trái bóng LEGO có thể lắp ráp theo nhiều mẫu áo đội tuyển khác nhau', 'SP005', 1, 0, GETDATE(), GETDATE()),

('Black Dahlia Flower', 'LEGO Botanical Flower', 1299000, 1499000, 20, '/images/products/Black-Dahlia-Flower-1.png', 12, 'Botanicals', '18+', N'Hoa Dơn Đen nở vĩnh cửu không cần chăm sóc, phù hợp trang trí bàn làm việc', 'BT001', 1, 0, GETDATE(), GETDATE()),

('Woodland Mushrooms', 'LEGO Botanical Mushroom Set', 1199000, 1399000, 18, '/images/products/Woodland-Mushrooms-1.png', 12, 'Botanicals', '18+', N'Bộ nấm rừng nhiều màu sắc với từng phiến nấm được tạo hình chi tiết, phù hợp trưng bày cùng cây cảnh', 'BT002', 1, 0, GETDATE(), GETDATE()),

('Great Deku Tree', 'Legend of Zelda Deku Tree', 7999000, 8499000, 4, '/images/products/Great-Deku-Tree-1.png', 13, 'Ideas', '18+', N'Mô hình 2 trong 1 lấy cảm hứng từ Ocarina of Time và Breath of the Wild, có thể mở miệng và đi kèm các minifigure nhân vật Zelda', 'IDEA001', 1, 1, GETDATE(), GETDATE()),

('Shrek Donkey', 'Shrek LEGO Display Set', 1999000, 2199000, 9, '/images/products/Shrek-Donkey-1.png', 13, 'Ideas', '16+', N'Mô hình lừa Donkey từ phim Shrek với biểu cảm vui nhộn đặc trưng, phù hợp trưng bày', 'IDEA002', 1, 0, GETDATE(), GETDATE()),

('Celestial Pagoda', 'Asian Architecture Pagoda', 2599000, 2799000, 8, '/images/products/Celestial-Pagoda-1.png', 14, 'Creator', '16+', N'Tháp chùa kiến trúc Á Đông nhiều tầng với mái cong chi tiết, phù hợp trưng bày phong cách phương Đông', 'CR001', 1, 0, GETDATE(), GETDATE());

-- Image
INSERT INTO ProductImages (ProductId, ImageUrl, IsMain, SortOrder, CreatedAt)
VALUES
(1, '/images/products/TIE-Interceptor-1.png', 1, 1, GETDATE()),
(1, '/images/products/TIE-Interceptor-2.png', 0, 2, GETDATE()),
(1, '/images/products/TIE-Interceptor-3.png', 0, 3, GETDATE()),
(1, '/images/products/TIE-Interceptor-4.png', 0, 4, GETDATE()),
(1, '/images/products/TIE-Interceptor-5.png', 0, 5, GETDATE());
-- =============================================
-- MIGRATION: Bỏ cột Products.PieceCount (số mảnh)
--            Thêm cột Products.Highlights (đặc điểm nổi bật)
-- Chạy script này TRỰC TIẾP trên SQL Server (giống category.sql,
-- product.sql, category_theme_migration.sql) vì thay đổi cột được
-- thực hiện bằng T-SQL thủ công, không qua EF Migrations
-- (xem ConfigureWarnings(PendingModelChangesWarning) trong Program.cs).
--
-- Việc này thực hiện:
--   1) Thêm cột Highlights (NVARCHAR(300) NULL) nếu chưa có
--   2) Backfill nội dung "đặc điểm nổi bật" cho các sản phẩm đã có sẵn
--      trong category.sql / product.sql (khớp theo SetNumber — duy nhất
--      cho từng sản phẩm, tránh nhầm khi có 2 sản phẩm trùng tên
--      "Celestial Pagoda" ở 2 danh mục khác nhau)
--   3) Xóa cột PieceCount (không còn dùng)
-- =============================================
USE LegoStoreDB;
GO

BEGIN TRANSACTION;

-- ---------------------------------------------
-- BƯỚC 1: Thêm cột Highlights nếu chưa có
-- ---------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Highlights')
BEGIN
    ALTER TABLE Products ADD Highlights NVARCHAR(300) NULL;
END
GO

-- ---------------------------------------------
-- BƯỚC 2: Backfill Highlights cho dữ liệu mẫu hiện có (khớp theo SetNumber)
-- ---------------------------------------------
UPDATE Products SET Highlights = N'Robot Khỉ Vương có cánh tay vươn dài và xoay được, đi kèm minifigure Tôn Ngộ Không cùng Gậy Như Ý phát sáng' WHERE SetNumber = '80048' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình sinh vật thần thoại Kỳ Lân tạo hình uốn lượn sống động, có đế trưng bày kèm bảng tên, thuộc dòng sưu tập Icons' WHERE SetNumber = '10424' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Robot thiên giới của Nhị Lang Thần có khớp cử động linh hoạt, trang bị Tam Diện Thần Khí và minifigure Hao Thiên Khuyển' WHERE SetNumber = '80053' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Tháp thiên đình nhiều tầng có thể mở để lộ nội thất chi tiết, đi kèm khu vực chiến đấu và dàn nhân vật Monkie Kid' WHERE SetNumber = '80058' AND Highlights IS NULL;

UPDATE Products SET Highlights = N'Mô hình mũ bảo hộ AT-RT Driver tỉ lệ thật, có đế trưng bày kèm bảng tên nhân vật, thuộc dòng Helmet Collection' WHERE SetNumber = '75429' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Tàu vũ trụ nhỏ gọn của tộc Anzellan với khoang lái mở được và thiết kế chi tiết đậm chất Star Wars' WHERE SetNumber = '75384' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình siêu xe Bugatti Centodieci với thiết kế khí động học đặc trưng, cửa mở kiểu cánh chim và nội thất chi tiết' WHERE SetNumber = '42160' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Xe đua F1 mô phỏng chi tiết khung gầm, vô lăng xoay được và bánh xe kiểu lốp đua thật' WHERE SetNumber = '42165' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô phỏng động cơ Ducati Panigale V4 với piston chuyển động, hộp số 8 cấp, hệ thống lái và chân chống như xe thật' WHERE SetNumber = '42107' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình xe phân khối lớn Kawasaki Ninja H2R có thể dựng chân chống, xoay tay lái và mô phỏng khung sườn chi tiết' WHERE SetNumber = '42170' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Xe đua phong cách Fast & Furious với tem trang trí đặc trưng, đi kèm minifigure tài xế' WHERE SetNumber = '76934' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình xe đua Toyota Supra MK4 phong cách Fast & Furious, đi kèm minifigure và bệ trưng bày có bảng tên' WHERE SetNumber = '76917' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Nhà hàng nổi nhiều tầng với khu bếp, quầy phục vụ và khoang thuyền nhỏ, đi kèm các minifigure đầu bếp One Piece' WHERE SetNumber = 'OP001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Thuyền Going Merry với đầu sư tử biểu tượng, cánh buồm đặc trưng và khoang thuyền chi tiết cho thủy thủ đoàn' WHERE SetNumber = 'OP002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình trưng bày Trái Ác Quỷ Gomu Gomu kèm đế và bảng tên nhân vật Luffy' WHERE SetNumber = 'OP003' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Pikachu có thể đứng vững nhiều góc, chi tiết tai và đuôi đặc trưng, phù hợp trưng bày' WHERE SetNumber = 'PK001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Eevee với phần lông được tạo hình tỉ mỉ, đi kèm đế trưng bày riêng' WHERE SetNumber = 'PK002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Bộ 3 mô hình tiến hóa Venusaur, Charizard và Blastoise, mỗi mẫu có đế trưng bày và bảng tên riêng' WHERE SetNumber = 'PK003' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Robot phản lực của Lloyd với cánh bung mở và vũ khí kiếm sấm sét, đi kèm minifigure Lloyd' WHERE SetNumber = 'NJ001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Bộ giáp chiến đấu của Zane với tay cử động linh hoạt, trang bị vũ khí băng đặc trưng' WHERE SetNumber = 'NJ002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Thuyền lùng Temple Bounty nhiều khoang với pháo xoay được và khu vực điều khiển chi tiết' WHERE SetNumber = 'NJ003' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Văn phòng thầy Dumbledore tại Hogwarts với nội thất chi tiết, Thanh Sắp Mũ Phân Loại và phụ kiện phép thuật' WHERE SetNumber = 'HP001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Đàn piano có 25 phím chuyển động thật qua cơ chế búa gõ, kết nối ứng dụng LEGO Powered Up để tự chơi nhạc' WHERE SetNumber = '21323' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình tên lửa đa giai đoạn với tháp phóng di động, khoang Orion có pin năng lượng mặt trời mở ra được' WHERE SetNumber = '10341' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Cây Piranha Plant có thể mở miệng và xoay thân, tương tác được với nhân vật LEGO Mario' WHERE SetNumber = '71426' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Xe kart đua tốc độ của Mario với cần gạt kích hoạt hiệu ứng, tương thích nhân vật LEGO Mario tương tác' WHERE SetNumber = '71431' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình heo con Pua đáng yêu từ phim Moana với tạo hình tỉ mỉ, phù hợp trưng bày' WHERE SetNumber = 'DS001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Glinda trong trang phục cưới từ phim Wicked, đi kèm phụ kiện và đế trưng bày' WHERE SetNumber = 'DS002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Khủng long Spinosaurus có thể cử động hàm và chân, đi kèm xe cứu hộ và minifigure nhân viên công viên' WHERE SetNumber = 'JW001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Khủng long T-Rex chuyển động được hàm và đầu, đi kèm minifigure và khu vực rào chắn công viên' WHERE SetNumber = 'JW002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Khủng long Triceratops có thể di chuyển đầu và chân, đi kèm lồng vận chuyển và minifigure kiểm lâm' WHERE SetNumber = 'JW003' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Brickheadz Cristiano Ronaldo với áo đấu và tư thế ăn mừng đặc trưng' WHERE SetNumber = 'SP001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Brickheadz Lionel Messi trong trang phục đội tuyển, đi kèm đế trưng bày có tên cầu thủ' WHERE SetNumber = 'SP002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Brickheadz Kylian Mbappe với áo đấu và quả bóng mini đi kèm' WHERE SetNumber = 'SP003' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình Brickheadz Vinicius Junior trong trang phục thi đấu, đi kèm đế trưng bày' WHERE SetNumber = 'SP004' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Trái bóng LEGO có thể lắp ráp theo nhiều mẫu áo đội tuyển khác nhau' WHERE SetNumber = 'SP005' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Hoa Dơn Đen nở vĩnh cửu không cần chăm sóc, phù hợp trang trí bàn làm việc' WHERE SetNumber = 'BT001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Bộ nấm rừng nhiều màu sắc với từng phiến nấm được tạo hình chi tiết, phù hợp trưng bày cùng cây cảnh' WHERE SetNumber = 'BT002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình 2 trong 1 lấy cảm hứng từ Ocarina of Time và Breath of the Wild, có thể mở miệng và đi kèm các minifigure nhân vật Zelda' WHERE SetNumber = 'IDEA001' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Mô hình lừa Donkey từ phim Shrek với biểu cảm vui nhộn đặc trưng, phù hợp trưng bày' WHERE SetNumber = 'IDEA002' AND Highlights IS NULL;
UPDATE Products SET Highlights = N'Tháp chùa kiến trúc Á Đông nhiều tầng với mái cong chi tiết, phù hợp trưng bày phong cách phương Đông' WHERE SetNumber = 'CR001' AND Highlights IS NULL;
GO

-- ---------------------------------------------
-- BƯỚC 3: Xóa cột PieceCount (không còn dùng — đã thay bằng Highlights)
-- ---------------------------------------------
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'PieceCount')
BEGIN
    -- Xóa default constraint trên PieceCount nếu có, trước khi DROP COLUMN
    DECLARE @dfName NVARCHAR(200);
    SELECT @dfName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('Products') AND c.name = 'PieceCount';

    IF @dfName IS NOT NULL
        EXEC('ALTER TABLE Products DROP CONSTRAINT ' + @dfName);

    ALTER TABLE Products DROP COLUMN PieceCount;
END
GO

COMMIT TRANSACTION;
GO

-- ---------------------------------------------
-- Kiểm tra nhanh sau khi chạy
-- ---------------------------------------------
-- SELECT Id, Name, SetNumber, Highlights FROM Products;

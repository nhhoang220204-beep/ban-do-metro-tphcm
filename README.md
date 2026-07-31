# Bản đồ Metro TP.HCM — công cụ tư vấn bất động sản

Bản đồ mạng lưới đường sắt đô thị TP.HCM và Bình Dương, dùng khi tư vấn khách hàng bất động sản theo trục metro.

**Xem bản đồ:** _(link GitHub Pages sẽ hiện ở đây sau khi bật Pages)_

## Nguyên tắc dữ liệu

Bản đồ **chỉ vẽ những gì xác minh được**. Hình học hướng tuyến và toạ độ ga lấy nguyên từ OpenStreetMap (Overpass API, 29/07/2026) — không nội suy, không ước lượng, không tự ghim.

Tuyến hoặc ga nào tài liệu có nhắc nhưng chưa công bố toạ độ thì được liệt kê trong mục **Dữ liệu chưa xác minh** ngay trong ứng dụng, không vẽ lên bản đồ.

Mỗi tuyến hiển thị mức phủ dữ liệu ngay trong danh sách, ví dụ `14/14 ga` (đủ) hay `2/24 ga` (mới xác minh được 2 ga).

## Tính năng

- 10 tuyến metro với hình học hướng tuyến thật, 49 ga đã xác minh toạ độ
- Lọc theo tuyến và theo trạng thái: đang vận hành, đang xây dựng, chuẩn bị khởi công, quy hoạch
- Tìm kiếm ga, tuyến, dự án — gõ không dấu vẫn ra
- Ghim dự án bất động sản, tự tính ga gần nhất kèm thời gian đi bộ và đi xe
- Dữ liệu dự án dùng chung qua Google Sheet, cả nhóm cùng cập nhật
- Chế độ gửi khách: ẩn toàn bộ menu, chỉ còn bản đồ và thông tin liên hệ, dùng để chụp màn hình
- Xuất ảnh PNG, in và xuất PDF khổ A4 ngang
- Chạy tốt trên điện thoại

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Toàn bộ ứng dụng — HTML, CSS, JavaScript thuần trong một file |
| `mau-du-an-bds.csv` | File mẫu để tạo bảng tính dự án dùng chung |
| `HUONG-DAN-CHIA-SE.md` | Hướng dẫn tạo Google Sheet và chia sẻ cho cả nhóm |

Thư viện ngoài duy nhất: [Leaflet](https://leafletjs.com) 1.9.4. Không backend, không framework.

## Nối bảng tính dự án dùng chung

Xem chi tiết trong [HUONG-DAN-CHIA-SE.md](HUONG-DAN-CHIA-SE.md). Tóm tắt: tạo Google Sheet từ file mẫu, mở quyền xem, rồi dán link vào mục **Dữ liệu dùng chung** trong ứng dụng.

Muốn cả nhóm dùng chung một bảng tính mà không phải cấu hình từng máy, dán link vào dòng này trong `index.html`:

```js
const SHEET_URL = '';   // ← dán link Google Sheet vào đây
```

## Cập nhật dữ liệu tuyến

Dữ liệu tuyến nằm ở đầu phần script trong `index.html`:

- `GEO` — hình học hướng tuyến và toạ độ ga, sinh tự động từ OpenStreetMap
- `LINES` — tên tuyến, màu, trạng thái, số liệu theo hồ sơ quy hoạch
- `GAPS` — danh sách dữ liệu còn thiếu

## Nguồn

OpenStreetMap (Overpass API) · Hồ sơ tham vấn cộng đồng của Ban Quản lý Đường sắt đô thị TP.HCM · Tổng hợp báo chí tháng 7/2026.

Khi tư vấn khách nên dẫn kèm câu *"theo hồ sơ đang niêm yết"* — hướng tuyến vẫn có thể điều chỉnh, và chiều dài, số ga, tốc độ thiết kế còn vênh nhau giữa các nguồn.

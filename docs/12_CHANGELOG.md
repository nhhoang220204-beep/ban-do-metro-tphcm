# 12 · CHANGELOG

> Lịch sử các đợt thay đổi lớn, mới nhất ở TRÊN CÙNG. Mỗi mục nêu: đã làm gì,
> vì sao, có push lên GitHub Pages chưa. Chi tiết kỹ thuật đầy đủ hơn (bối
> cảnh, số liệu đo được) nằm trong `BAN-GIAO-DU-AN-METRO.md` mục 3 — file
> này là bản rút gọn dễ tra theo mốc thời gian.

## Giai đoạn 13 — Thêm rồi xoá "Live Mode" livestream trong cùng ngày (07/08/2026, đã push)

Một phiên Claude khác (Opus 5, không phải phiên đang duy trì `docs/`) đã
thêm (commit `af76c54`) rồi thiết kế lại (commit `951cb7b`) một tính năng
UI tên "Live Mode" — lớp trình bày toàn màn hình cho livestream TikTok
(`js/features/livemode.js` + `css/live.css`, ~1.400 dòng): header cố định,
sidebar 6 icon lớp dữ liệu, bộ công cụ thuyết trình (laser/spotlight/kính
lúp/thước đo/vẽ chú thích/story mode), khung camera 4:3, lower third, ticker
chạy. Tên này trùng với khái niệm "Live Mode" đã dùng cho việc chuyển sang
Firebase (QĐ-20, xem [07_LIVE_MODE.md](07_LIVE_MODE.md)) — phát hiện ra khi
đang xây `docs/` cùng ngày. **Hoàng xác nhận không muốn tính năng này, yêu
cầu xoá và khôi phục nguyên trạng.** Đã xoá sạch (commit `ecc68f4`): gỡ
`css/live.css`, `js/features/livemode.js`, nút 🎬 Live trên topbar, import/
khởi tạo trong `app.js`, export `markerCua()` trong `projects.js` (chỉ Live
Mode dùng, không nơi nào khác gọi). Đã kiểm tra lại trên trình duyệt: không
lỗi console, không request tới `live.css`, không còn nút Live — khôi phục
đúng bằng byte với trạng thái trước commit `af76c54` ở 3 file dùng chung
(`index.html`, `app.js`, `projects.js`), không đụng bất kỳ thay đổi hợp lệ
nào khác đã xảy ra xen giữa (Vành đai 2 vẽ lại, ghim dự án, cập nhật giá...).

## 🔴 Giai đoạn 12 — Chuyển sang Firebase (07/08/2026, ĐANG DỞ DANG)

Chưa push, chưa xong. Xem đầy đủ tình trạng ở [07_LIVE_MODE.md](07_LIVE_MODE.md)
và [11_TODO.md](11_TODO.md). Tóm tắt: đã tạo dự án Firebase
`ban-do-metro-tphcm` (gói Spark), kẹt ở bước chọn vùng Firestore, chưa bật
Auth, chưa đặt Rules, chưa lấy config, chưa sửa dòng code nào.

## Giai đoạn 11 — Developer Mode (02/08/2026, đã push)

Mục 5 trong đợt refactor tổng thể. `js/features/dev-mode.js`: bắt lỗi
`window.error`/`unhandledrejection` chạy nền ngay từ lúc module nạp (không
đợi bật panel), nhật ký tối đa 300 dòng, kiểm tra tĩnh (lớp bản đồ lỗi, DOM
thiếu, danh mục rỗng), xuất báo cáo `.txt`. Nói rõ giới hạn trước khi làm:
KHÔNG hứa dò rò rỉ bộ nhớ/responsive tự động — cần công cụ ngoài (DevTools).

## Giai đoạn 10 — Nút "Kiểm tra dữ liệu" (02/08/2026, đã push)

Mục 4 trong đợt refactor. `js/features/data-checker.js`: chỉ đọc, không
sửa, dò 9 loại lỗi (trùng tên, trùng marker, sai toạ độ, giá bất thường
chạy trên TOÀN BỘ 1.148 dự án; thiếu thông tin/ảnh/logo/score CHỈ chạy trên
11 dự án đã kiểm để tránh nhiễu từ ứng viên OSM cố tình để trống). Chạy thử
phát hiện 77 mục, có trùng lặp thật đáng chú ý (VD "Chung cư De Capella"/
"Căn hộ De Capella" cùng toạ độ — khả năng OSM tạo trùng bản ghi).

## Giai đoạn 9 — Project Edit Mode: CRUD dự án + kéo marker (02/08/2026, đã push)

Mục 2+3 trong đợt refactor. `js/features/project-editor.js` (mới): sửa/lưu/
huỷ/xoá/thêm dự án qua form đầy đủ trường, ghi thẳng
`data/projects/index.json` + `chi-tiet/<id>.json` qua endpoint cục bộ
`POST /__luu-du-lieu`. AI Score không cho sửa tay. Xoá phải bấm 2 lần trong
4 giây. Sửa 2 lỗi tìm ra khi kiểm thử (xem
[13_BUG_TRACKER.md](13_BUG_TRACKER.md)): đệ quy vô hạn khi đóng sidebar,
sidebar hiện dữ liệu cũ sau khi lưu.

## Giai đoạn 8 — Lọc lại danh mục theo loại hình (02/08/2026)

Mục 1 trong đợt refactor. Hoàng phản ánh danh mục lẫn nhiều đối tượng không
phải nhà ở (công ty, văn phòng, showroom...). Quét tên 1.154 ứng viên OSM,
xác nhận tay từng cái để tránh xoá nhầm địa danh trong tên chung cư thật
(vd "Chợ Lớn", "Miếu Nổi"). **Đã xoá 17/1.165 dự án** (còn 1.148): Bitexco
Building, Toà Nhà Cityview, Crescent Residence 1/2/3, Sherwood Residence,
Indochine Park Tower, Saigon Mansion, An Khánh, An Phú, Trạm khí tượng Thủ
Dầu Một, Kho Bạc NN quận Phú Nhuận, Chợ Hoa Tươi Đầm Sen, và vài công ty/cơ
sở sản xuất. ⚠️ Giới hạn: chỉ rà kỹ được 61/1.165 dự án, ~1.087 còn lại chỉ
lọc theo từ khoá tên — có thể vẫn sót sai loại hình.

## Giai đoạn 7 — Chế độ biên tập GIS nội bộ (02/08/2026, đã push)

`js/features/gis-editor.js` (mới): panel riêng để Hoàng tự kéo-thả dựng dữ
liệu ga metro/vành đai chưa xác minh. Sinh sẵn 41 ga tạm (Metro số 2 Thủ Dầu
Một + Metro Bình Dương) nội suy đều theo hình học — KHÔNG phải vị trí thật.
Tự nối 41 khúc hở ngắn (≤6km) giữa các đoạn vành đai bằng đoạn thẳng tạm
(`tam-so-hoa`); 1 khúc hở 41km (Vành đai 4) KHÔNG được nối tự động (bịa cả
chục km đường). `tools/serve.mjs` mở endpoint ghi file `POST /__luu-du-lieu`,
đổi hành vi bind chỉ `127.0.0.1` (trước đó nghe cả LAN).

## Giai đoạn 6 — Nghiên cứu tự động khi mở hồ sơ thiếu dữ liệu (02/08/2026)

Hoàng yêu cầu hồ sơ thiếu dữ liệu không được chỉ hiện "Đang cập nhật" mà
phải tự nghiên cứu qua 5 nguồn ưu tiên. Chỉ ra xung đột với kiến trúc
"không backend" (không thể tự nghiên cứu real-time trên site tĩnh) — Hoàng
chọn: Claude nghiên cứu thủ công theo yêu cầu, ghi thẳng vào file (QĐ-16).
Mở rộng schema `chi-tiet/<id>.json` thêm `nguonTheoTruong`, `nghienCuu`.
Thí điểm 50/1.154 ứng viên OSM — phát hiện vài dự án thực chất là văn phòng/
căn hộ dịch vụ cho thuê (đã xử lý tiếp ở Giai đoạn 8).

## Giai đoạn 5 — Lớp Đường Vành đai 2/3/4

`tools/build-ring-roads.mjs`: trạng thái từng đoạn suy trực tiếp từ thẻ
`highway` OSM, không gán một trạng thái cho cả tuyến. Kết quả: 53 đoạn (30
hoàn thành, 17 đang thi công, 6 quy hoạch), khớp hồ sơ trong khoảng 5%.

## Giai đoạn 4 — Hồ sơ mạng lưới metro có nguồn đối chiếu

Đối chiếu 3 văn bản pháp lý (Nghị quyết 188/2025/QH15, QĐ 1125/QĐ-TTg, Đề án
ĐSĐT Sở GTVT). Phát hiện quy hoạch 2013 (có 3A/3B/4B) đã bị thay thế bởi quy
hoạch hiện hành đánh số 1-10. Thuật toán suy hướng tuyến theo tên đường →
299,3km/146 phân đoạn cho 10 tuyến có hình học.

## Giai đoạn 3 — Cơ sở dữ liệu bất động sản toàn diện

Tách kiến trúc 2 tầng: `index.json` (chỉ mục) + `chi-tiet/<id>.json` (hồ sơ
đầy đủ). `build-projects.mjs` lấy ứng viên từ OSM, lọc rác 4 lớp → từ 2.201
đối tượng thô còn 1.154 ứng viên sạch. Danh mục từ 11 → 1.165 dự án. Đo
được: chịu quy mô 5.000 dự án, tra phường/xã 413ms → 17ms.

## Giai đoạn 2 — Viết lại thành ứng dụng nâng cấp (V2)

Từ 1 file HTML 134KB → 22 module JS + 7 CSS + dữ liệu tách file JSON. Map
engine, marker riêng theo loại hình, popup, sidebar 8 tab, AI Score 8 tiêu
chí, so sánh tối đa 3 dự án, Chế độ gửi khách, khoảng cách đo qua OSRM.

## Giai đoạn 1 — Bản đồ metro v1 (đã bị thay thế cấu trúc)

Dựng bản đầu bằng dữ liệu tự suy từ quy hoạch → sai nặng (ga lệch tới 974m,
tuyến zigzag). Phát hiện lỗi, refactor toàn bộ theo nguyên tắc "chỉ dùng dữ
liệu xác minh" — sự kiện khởi nguồn cho QĐ-1, quy tắc số một của toàn dự án.

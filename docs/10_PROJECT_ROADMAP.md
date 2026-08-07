# 10 · PROJECT ROADMAP

> Thứ tự ưu tiên nên làm tiếp theo, và các hạng mục lớn còn treo chưa có
> lịch cụ thể. Khác với [11_TODO.md](11_TODO.md) (checklist việc cụ thể,
> nhỏ, có thể tick), file này nói về HƯỚNG ĐI và ưu tiên tương đối.

## Ưu tiên ngay — việc đang dở, phải xong trước khi làm việc khác

**00 · Hoàn tất chuyển sang Firebase (Giai đoạn 12 / QĐ-20).** Xem đầy đủ ở
[07_LIVE_MODE.md](07_LIVE_MODE.md) — có bước không đảo ngược được (chọn vùng
Firestore) và một mâu thuẫn email đăng nhập chưa chốt với Hoàng. Đây là việc
bắt đầu giữa chừng, ưu tiên trên hết để không để lửng quá lâu.

## Thứ tự ưu tiên tiếp theo (không phụ thuộc việc 00)

**0 · Xin quyền truy cập ArcGIS FeatureServer** của cổng GIS quy hoạch
TP.HCM (Sở Xây dựng / Trung tâm Chuyển đổi số TP.HCM). Nếu được cấp, gần như
toàn bộ việc số hoá thủ công hướng tuyến metro/vành đai trở nên không cần
thiết — nâng độ tin cậy hình học từ ★★☆☆☆ lên ★★★★★.

**1 · Hoàng ghim 9 dự án còn thiếu toạ độ** — quyết định công cụ có dùng
được cho chính công việc hằng ngày của Hoàng hay không. Xem
`HUONG-DAN-NHAP-DU-AN.md`.

**2 · Chạy `node tools/build-around.mjs`** sau khi ghim xong, để tiền tính
tiện ích + khoảng cách metro cho các dự án đó.

**3 · Xin hồ sơ hướng tuyến metro số 6 giai đoạn 1** khi MAUR phê duyệt (dự
kiến 6/2026) — giải quyết dứt điểm MT-01 (xem
[13_BUG_TRACKER.md](13_BUG_TRACKER.md)) và bổ sung 2 ga ngầm sân bay.

**4 · Chốt quyết định Google Sheet (QĐ-4)** — làm tiếp phần đọc dữ liệu dùng
chung qua Google Sheet hay bỏ hẳn, dùng thẳng `index.json` trong repo. Đây
là quyết định cũ chưa từng chốt lại ở kiến trúc mới.

**5 · Chỉ khi các việc trên xong mới tính tới**: xuất PNG/in A4 hoàn chỉnh
(có ở v1, chưa dựng lại kiến trúc mới), bảng tính tài chính trong hồ sơ dự
án, vẽ tuyến đường thật (OSRM geometry) tới ga/vành đai thay vì chỉ hiện con
số, mở rộng ga metro Bình Dương.

## Hạng mục lớn còn treo — chờ Hoàng xác nhận có làm tiếp không

Từ đợt "refactor tổng thể" 9 hạng mục Hoàng yêu cầu 02/08/2026 — mục 1-5 đã
xong (xem [12_CHANGELOG.md](12_CHANGELOG.md) Giai đoạn 8-11), còn lại:

- **Mục 6 — sửa các nút/popup bị treo khác.** Đã sửa được 1 lỗi thật (đệ quy
  vô hạn khi đóng sidebar, xem [13_BUG_TRACKER.md](13_BUG_TRACKER.md)), cần
  Hoàng mô tả cụ thể triệu chứng còn lại (bấm nút gì, ở đâu) — không đoán mò
  tìm bug không có căn cứ.
- **Mục 7 — trang Admin quản lý Metro/Ga/Vành đai/Tiện ích** + Import/
  Export/Backup/Restore. Khối lượng nhiều phiên làm việc.
- **Mục 8 — Undo/Redo cho mọi thao tác chỉnh sửa** (hiện chỉ có Undo/Redo
  cho polyline vành đai trong Chế độ biên tập GIS, chưa áp dụng cho CRUD dự
  án). Khối lượng nhiều phiên làm việc.

Cả 2 mục 7 và 8 đang chờ Hoàng xác nhận có làm tiếp không — không tự bắt tay
làm khi chưa hỏi, vì đây là công sức lớn có thể đổi hướng giữa chừng.

## Việc kỹ thuật khác chưa có deadline cụ thể

- Vành đai 2 đo được 50,96/64km hồ sơ (thiếu 20%) — đoạn dùng chung Quốc lộ
  1 chưa gộp vào danh sách `osmTen` trong `build-ring-roads.mjs`.
- Thêm Vành đai 5 khi có quy hoạch chính thức — chỉ cần thêm 1 mục vào mảng
  `TUYEN` trong `tools/build-ring-roads.mjs`, kiến trúc đã tính sẵn việc mở
  rộng này.
- Bổ sung ga metro (Metro số 2 Thủ Dầu Một thiếu 22/24 ga, Metro Bình Dương
  – Suối Tiên thiếu 19/19 ga) khi có nguồn chính thức.

## Việc chỉ Hoàng làm được — Claude không làm thay

1. Ghim 9 dự án còn thiếu toạ độ.
2. Điền hồ sơ dự án (ít nhất `phapLy`, `giaTu`, `tongSoCan` để chấm được
   Thanh khoản trong AI Score).
3. Quyết định Google Sheet (QĐ-4).
4. Mở app trên điện thoại thật, xem bằng mắt — môi trường Claude chạy không
   dựng khung hình để tự chụp kiểm tra được.
5. Xác nhận điều kiện dùng ảnh nền vệ tinh Esri World Imagery cho mục đích
   thương mại (đang dùng làm 1 trong 3 lựa chọn nền bản đồ).
6. Hỏi giúp quyền ArcGIS FeatureServer nếu có quan hệ ở Sở Xây dựng.
7. Cung cấp thêm chi tiết hướng tuyến metro 6 đoạn Phú Hữu–Bình Thái nếu biết.
8. Duyệt chất lượng các hồ sơ đã nghiên cứu tự động trước khi dùng tư vấn
   khách (xem [13_BUG_TRACKER.md](13_BUG_TRACKER.md) mục dữ liệu cần kiểm
   lại — "Chung cư 22 Tầng" độ tin cậy thấp, "Cư xá Đoàn Văn Bơ" nghi sai
   vị trí/tên).

## Nguyên tắc chung khi đề xuất roadmap mới

Không tự thêm hạng mục lớn vào roadmap chỉ vì "thấy hợp lý" — mọi hạng mục
lớn (nhiều phiên làm việc, thay đổi kiến trúc) phải xuất phát từ yêu cầu
thật của Hoàng hoặc được xác nhận trước khi bắt tay làm. Việc nhỏ (sửa bug,
bổ sung 1 field dữ liệu có nguồn rõ) có thể chủ động làm và báo cáo sau.

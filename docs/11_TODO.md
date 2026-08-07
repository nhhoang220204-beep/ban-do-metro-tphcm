# 11 · TODO

> Checklist việc cụ thể, có thể tick từng dòng. Khác [10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md)
> (hướng đi lớn) — đây là việc nhỏ, rõ ràng, làm xong là xong.

## 🔴 Ưu tiên tuyệt đối — chặn mọi việc Firebase khác

- [ ] **Xác nhận/hoàn tất chọn vùng Firestore = `asia-southeast1 (Singapore)`**
      trước khi bấm "Tạo nên" — KHÔNG đảo ngược được sau khi tạo. Nếu tool tự
      động (Claude in Chrome) vẫn không thao tác được với `<mat-select>` của
      Firebase Console, nhờ Hoàng tự bấm thay vì mạo hiểm. Xem
      [07_LIVE_MODE.md](07_LIVE_MODE.md).
- [ ] **Hoàng trả lời: đăng nhập sửa web dùng email nào** —
      `hn2211609@gmail.com` (tài khoản đang tạo project Firebase) hay
      `n.h.hoang220204@gmail.com` (email trong tài liệu cũ)? Xem
      [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md) mục email.

## Firebase — theo đúng thứ tự sau khi 2 việc trên xong

- [ ] Hoàn tất tạo Firestore Database (đang dở bước 2/3 wizard).
- [ ] Bật Authentication → Email/Password provider.
- [ ] Hoàng tự tạo user trong Authentication (Claude không gõ mật khẩu thay).
- [ ] Đặt Firestore Security Rules đúng email đã chốt (mẫu có sẵn trong
      `HUONG-DAN-FIREBASE.md` mục 4, sửa email nếu khác giả định ban đầu).
- [ ] Lấy khối `firebaseConfig` từ Project settings.
- [ ] Thêm màn hình đăng nhập trong app, chỉ hiện khi bật 🛠 Chế độ biên tập GIS.
- [ ] Chuyển `js/core/luu-local.js` từ gọi `/__luu-du-lieu` sang ghi Firestore.
- [ ] Quyết định + dựng cơ chế đồng bộ định kỳ Firestore → file JSON trong
      `data/` (giữ lịch sử qua git) — chưa có phương án cụ thể.
- [ ] Test kỹ trên GitHub Pages thật (không chỉ máy local) rồi mới báo xong.

## Hoàng làm — Claude không làm thay được

- [ ] Ghim toạ độ 9 dự án còn thiếu (xem `HUONG-DAN-NHAP-DU-AN.md`).
- [ ] Điền `phapLy`, `giaTu`, `tongSoCan` cho các dự án đã kiểm (để chấm
      được tiêu chí Thanh khoản trong AI Score).
- [ ] Quyết định: làm tiếp phần đọc Google Sheet hay bỏ hẳn (QĐ-4).
- [ ] Mở app trên điện thoại thật, xem bằng mắt một lượt.
- [ ] Xác nhận điều kiện dùng ảnh vệ tinh Esri cho mục đích thương mại.
- [ ] Hỏi giúp quyền truy cập ArcGIS FeatureServer nếu có quan hệ ở Sở Xây dựng.
- [ ] Cung cấp thêm chi tiết hướng tuyến metro 6 đoạn Phú Hữu–Bình Thái nếu biết.
- [ ] Mô tả cụ thể triệu chứng "nút/popup bị treo" còn lại (nếu còn) để sửa
      tiếp — không đoán mò tìm bug không có căn cứ.
- [ ] Duyệt lại chất lượng hồ sơ đã nghiên cứu tự động, đặc biệt "Chung cư 22
      Tầng" (độ tin cậy thấp) và "Cư xá Đoàn Văn Bơ" (nghi sai vị trí/tên).

## Kỹ thuật — không phụ thuộc Hoàng

- [ ] Chạy `node tools/build-around.mjs` sau khi Hoàng ghim xong dự án.
- [ ] Dựng lại nút xuất ảnh PNG / in A4 cho Chế độ gửi khách (có ở v1, chưa
      có ở kiến trúc mới).
- [ ] Bảng tính tài chính trong hồ sơ dự án.
- [ ] Vẽ tuyến đường thật (OSRM geometry) từ dự án tới ga/vành đai gần nhất
      thay vì chỉ hiện con số.
- [ ] Bổ sung ga Metro số 2 Thủ Dầu Một (22/24), Metro Bình Dương – Suối
      Tiên (19/19) khi có nguồn chính thức.
- [ ] Bổ sung đoạn Vành đai 2 dùng chung Quốc lộ 1 (thiếu ~13km so với hồ sơ).
- [ ] Giải quyết MT-01 khi có hồ sơ MAUR tuyến 6 GĐ1 (xem
      [13_BUG_TRACKER.md](13_BUG_TRACKER.md)).
- [ ] Xin quyền ArcGIS FeatureServer — nếu được, số hoá lại toàn bộ hình học
      metro/vành đai theo nguồn chính thức thay vì OpenStreetMap.

## Hạng mục lớn — chờ Hoàng xác nhận trước khi bắt tay làm

- [ ] Trang Admin quản lý Metro/Ga/Vành đai/Tiện ích + Import/Export/Backup/Restore.
- [ ] Undo/Redo cho mọi thao tác chỉnh sửa (hiện chỉ có ở polyline vành đai).

## Đã quyết định KHÔNG làm — đừng lặp lại đề xuất

- [x] ~~Publish thành Artifact claude.ai~~ — CSP chặn request ra ngoài, ra
      trang trắng vì cần Leaflet CDN + tile ảnh nền.
- [x] ~~Tự nội suy vị trí ga hoặc hướng tuyến~~ — vi phạm quy tắc số một.
- [x] ~~Dùng danh sách tuyến metro 3A/3B/4B~~ — quy hoạch 2013 đã bị thay thế.
- [x] ~~Gán một trạng thái cho cả tuyến vành đai~~ — vi phạm BR-9.
- [x] ~~Tự chọn một bên khi có mâu thuẫn dữ liệu chưa rõ~~ — vi phạm BR-10.
- [x] ~~Tìm cách vượt qua xác thực 401 của ArcGIS~~ — phải xin quyền chính thức.
- [x] ~~Chuyển bố cục chính sang CSS Grid shorthand~~ — từng gây bug thật
      (bản đồ co về 0 chiều cao).

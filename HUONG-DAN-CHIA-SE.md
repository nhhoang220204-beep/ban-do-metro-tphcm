# Chia sẻ bản đồ Metro cho cả nhóm

Ba việc, làm theo thứ tự. Tổng thời gian khoảng 20 phút.

---

## Bước 1 · Tạo bảng tính dự án dùng chung

1. Mở [sheets.google.com](https://sheets.google.com) → tạo bảng tính mới.
2. Vào **Tệp → Nhập → Tải lên**, chọn file `mau-du-an-bds.csv` (nằm cùng thư mục này).
   Chọn *Thay thế bảng tính*. Bảng tính sẽ có sẵn đúng tên cột.
3. Xoá hai dòng ví dụ, điền dự án thật vào.

**Các cột:**

| Cột | Bắt buộc | Ghi chú |
|---|---|---|
| Tên dự án | ✔ | Thiếu tên thì dòng đó bị bỏ qua |
| Chủ đầu tư | | |
| Loại hình | | Căn hộ, Nhà phố, Đất nền… |
| Vĩ độ | | Số dạng `10.9705` |
| Kinh độ | | Số dạng `106.6845` |
| Ảnh | | Link ảnh trực tiếp (kết thúc bằng .jpg/.png) |
| Website | | |
| Ghi chú | | Giá, tiến độ, pháp lý — muốn xuống dòng thì cứ Alt+Enter |

**Lấy toạ độ:** mở Google Maps → bấm giữ vào vị trí → copy dãy số hiện ra → dán cả cụm `10.9705, 106.6845` vào cột **Vĩ độ**, bảng tính tự tách sang cột bên cạnh khi bạn dán vào app. Nếu dán vào Sheet thì tách tay: số đầu là Vĩ độ, số sau là Kinh độ.

> Dòng chưa có toạ độ vẫn hiện trong danh sách với nhãn **Chưa xác minh toạ độ** nhưng **không bị ghim bừa** lên bản đồ. Toạ độ nằm ngoài Nam Bộ cũng bị chặn, báo **Toạ độ không hợp lệ** — tránh trường hợp gõ nhầm rồi ghim dự án sang tỉnh khác.

### Mở quyền đọc cho bảng tính

Chọn **một** trong hai cách:

- **Cách A (khuyến nghị):** Tệp → Chia sẻ → **Xuất bản lên web** → chọn đúng trang tính → định dạng **Giá trị được phân tách bằng dấu phẩy (.csv)** → Xuất bản. Copy đường link hiện ra.
- **Cách B:** Nút **Chia sẻ** góc phải → đổi thành *Bất kỳ ai có đường liên kết* → quyền **Người xem**. Copy link trên thanh địa chỉ.

App nhận cả hai kiểu link.

---

## Bước 2 · Đưa bản đồ lên mạng

**Bắt buộc phải làm bước này.** Nếu chỉ gửi file qua Zalo cho mọi người mở trực tiếp từ ổ đĩa, trình duyệt sẽ **chặn** việc đọc bảng tính — app sẽ báo lỗi và chỉ hiện dự án riêng của từng máy.

### Cách nhanh nhất — Netlify Drop (2 phút, không cần tài khoản)

1. Tạo một thư mục mới, chép **`ban-do-metro-tphcm.html`** vào, đổi tên thành **`index.html`**.
2. Mở [app.netlify.com/drop](https://app.netlify.com/drop).
3. Kéo cả thư mục thả vào ô giữa trang.
4. Xong — có ngay link dạng `random-name-123.netlify.app`.

Nhược điểm: muốn sửa bản đồ thì kéo thả lại từ đầu. Nên đăng ký tài khoản miễn phí để giữ quyền quản lý link.

### Cách bền hơn — GitHub Pages (10 phút, cần tài khoản)

1. Đăng ký tại [github.com](https://github.com) nếu chưa có.
2. Tạo repository mới, đặt tên tuỳ ý, chọn **Public**.
3. Bấm **Add file → Upload files**, kéo `ban-do-metro-tphcm.html` vào, đổi tên thành `index.html`, bấm **Commit changes**.
4. Vào **Settings → Pages**, mục *Source* chọn nhánh `main`, thư mục `/ (root)`, bấm **Save**.
5. Đợi khoảng 1 phút, link sẽ là `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

Được lợi: có lịch sử thay đổi, nhiều người sửa được, lỡ hỏng thì khôi phục bản cũ.

---

## Bước 3 · Nối bản đồ với bảng tính

Sau khi đã có link web ở bước 2:

1. Mở link bản đồ.
2. Bảng bên trái → mục **Dữ liệu dùng chung**.
3. Dán link Google Sheet vào ô, bấm **Nối bảng tính**.
4. Thấy dòng *"Đã tải N dự án dùng chung"* là xong.

### Để mọi người cùng thấy dữ liệu đó

Cấu hình ở bước trên chỉ lưu trên máy bạn. Có hai cách cho cả nhóm:

**Cách 1 — gửi link kèm bảng tính (nhanh):**
Bấm nút **Sao chép link chia sẻ kèm bảng tính**, gửi link đó cho mọi người. Ai mở link này cũng đọc đúng bảng tính của bạn, không phải cấu hình gì.

**Cách 2 — gắn cố định vào file (gọn hơn, link ngắn):**
Mở `ban-do-metro-tphcm.html` bằng Notepad, tìm dòng:

```js
const SHEET_URL = '';                            /* ← DÁN LINK GOOGLE SHEET VÀO ĐÂY */
```

Dán link vào giữa hai dấu nháy, lưu lại, rồi tải file lên hosting lần nữa. Từ đó ai mở link gốc cũng thấy dữ liệu chung, không cần đuôi `?sheet=`.

---

## Cách nhóm làm việc hằng ngày

- **Đồng nghiệp thêm dự án:** gõ thẳng vào Google Sheet. Bản đồ cập nhật ở lần tải trang sau, hoặc bấm **Tải lại** trong mục Dữ liệu dùng chung.
- **Dự án chung** hiện ghim **xanh dương**, không sửa được trong app — muốn sửa thì sửa trong bảng tính. Cách này tránh hai người ghi đè lên nhau.
- **Dự án riêng** hiện ghim **xanh ngọc**, chỉ nằm trên máy người đó, thêm/sửa/xoá thoải mái trong app. Dùng để nháp trước khi đưa lên bảng tính chung.
- **Gửi cho khách:** bật **Chế độ gửi khách** → ẩn hết menu, chỉ còn bản đồ + chú thích + tên và số điện thoại của bạn → chụp màn hình gửi đi. Hoặc bấm **Lưu ảnh PNG**.

---

## Khi gặp trục trặc

| Hiện tượng | Nguyên nhân và cách xử lý |
|---|---|
| "Đang mở file trực tiếp từ ổ đĩa…" | Chưa làm bước 2. Phải đưa lên hosting mới đọc được bảng tính. |
| "Bảng tính chưa mở quyền xem" | Quay lại bước 1, làm phần *Mở quyền đọc*. |
| "Bảng tính thiếu cột Tên dự án" | Dòng đầu tiên của bảng tính phải là tên cột. Đừng chèn dòng trống hay tiêu đề trang trí phía trên. |
| Sửa Sheet rồi mà bản đồ chưa đổi | Bấm **Tải lại** trong mục Dữ liệu dùng chung. Link *Xuất bản lên web* của Google có thể chậm vài phút. |
| Dự án không lên bản đồ | Kiểm tra cột Vĩ độ / Kinh độ. Vĩ độ TP.HCM – Bình Dương khoảng `10.3–11.2`, kinh độ khoảng `106.4–107.1`. Nếu đảo ngược hai cột thì app sẽ chặn. |
| Bản đồ trắng trơn | Mất mạng hoặc bị chặn `unpkg.com`. App cần internet để tải thư viện bản đồ và ảnh nền. |

---

## Lưu ý khi tư vấn khách

Bản đồ chỉ vẽ dữ liệu xác minh được từ OpenStreetMap. Mỗi tuyến có nhãn mức phủ ngay trong danh sách — ví dụ `14/14 ga` là đủ, `2/24 ga` là mới xác minh được 2 ga. Mục **Dữ liệu chưa xác minh** liệt kê những gì còn thiếu.

Khi khách hỏi số liệu, nói *"theo hồ sơ đang niêm yết"* — hướng tuyến vẫn có thể điều chỉnh, và chiều dài, số ga, tốc độ thiết kế đang vênh nhau giữa các nguồn.

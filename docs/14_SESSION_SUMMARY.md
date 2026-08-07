# 14 · SESSION SUMMARY

> Phiên làm việc GẦN NHẤT — đọc đầu tiên khi vào 1 phiên mới để biết "vừa
> xảy ra chuyện gì" trước khi đọc các file khác. Chỉ giữ phiên MỚI NHẤT chi
> tiết; phiên cũ hơn đã gộp vào [12_CHANGELOG.md](12_CHANGELOG.md). Ghi đè
> nội dung file này ở cuối MỖI phiên có thay đổi đáng kể — đừng cộng dồn vô
> hạn, giữ cho file này luôn là "chuyện vừa xảy ra", không phải nhật ký toàn
> bộ lịch sử.

## Phiên 07/08/2026 — Firebase (dở dang) + xây dựng bộ nhớ `docs/`

### Việc 1: Bắt đầu chuyển sang Firebase (QĐ-20, Giai đoạn 12) — CHƯA XONG

Hoàng thấy toast "Không lưu được xuống file" trên bản GitHub Pages, muốn sửa
được ngay trên web thật không cần mở terminal. Đã hỏi và Hoàng chọn hướng
Firebase (cơ sở dữ liệu đám mây miễn phí). Sau đó Hoàng nói thẳng: *"vào web
của tôi đã đăng nhập và tạo luôn nhé, tôi đã đăng nhập rồi, đến khoản cấp
quyền tôi sẽ hỗ trợ"* — Claude tự thao tác qua Claude in Chrome (trình duyệt
thật của Hoàng, đã đăng nhập sẵn), với ranh giới đã tuyên bố rõ trước khi
bắt đầu: KHÔNG tự gõ mật khẩu dù được cho phép "cứ tạo luôn".

**Kết quả đạt được**: tạo xong dự án Firebase `ban-do-metro-tphcm` (gói
Spark miễn phí), từ chối add-on không cần, bắt đầu tạo Firestore Database
(chọn đúng Standard edition).

**Kẹt lại ở**: bước chọn vùng máy chủ Firestore. Dropdown `<mat-select>` của
Firebase Console không nhận click/`.click()` qua JavaScript từ công cụ tự
động — thử nhiều cách (toạ độ, JS click trực tiếp trên option) đều không
cập nhật giá trị hiển thị (vẫn cứng ở `nam5 (Hoa Kỳ)`). Đây là rủi ro cao vì
Firebase Console cảnh báo vùng máy chủ **không đảo ngược được sau khi tạo**.

**Phát hiện quan trọng chưa giải quyết**: tài khoản Google đang đăng nhập
trong Chrome của Hoàng (`hn2211609@gmail.com`) KHÁC với email giả định trong
`HUONG-DAN-FIREBASE.md` (`n.h.hoang220204@gmail.com`, cũng là email đã lưu
trong `MEMORY.md` auto-memory). Chưa hỏi Hoàng chốt dùng email nào cho đăng
nhập sửa web — bắt buộc phải hỏi trước khi đặt Firestore Security Rules.

Trạng thái đầy đủ, việc còn lại theo đúng thứ tự: xem
[07_LIVE_MODE.md](07_LIVE_MODE.md) và [11_TODO.md](11_TODO.md) mục 🔴 ưu
tiên tuyệt đối.

### Việc 2: Cập nhật `BAN-GIAO-DU-AN-METRO.md` (trước khi bắt đầu Việc 3)

Trước khi Firebase còn dang dở, đã cập nhật tài liệu bàn giao gốc để phản
ánh đúng trạng thái Giai đoạn 12 + sửa số liệu lỗi thời (1.165 → 1.148 dự
án, khớp thực tế sau khi dọn ở Giai đoạn 8 nhưng chưa được cập nhật ở nhiều
chỗ trong file cũ). File này vẫn được giữ nguyên, không xoá — là bản chi
tiết hơn, có đầy đủ bối cảnh lịch sử QĐ-1 đến QĐ-20.

### Việc 3: Xây dựng hệ thống "Project Memory" — `docs/` (15 file)

Hoàng yêu cầu tái cấu trúc để tối ưu chi phí token và dễ bảo trì lâu dài:
tạo `docs/` với 15 file Markdown làm bộ nhớ dài hạn, để phiên mới đọc trước
khi làm việc thay vì phải đọc lại toàn bộ source mỗi lần.

**Cách làm**: chạy 4 agent Explore song song đọc TOÀN BỘ mã nguồn (7 file
CSS, 9 file `js/core/` + `js/map/`, 16 file `js/features/`, toàn bộ
`data/*.json` + 15 file `tools/*.mjs`), báo cáo chi tiết có trích dẫn giá
trị/tên hàm chính xác — sau đó tự viết lại thành 15 file trong `docs/`, kết
hợp với nội dung đã có sẵn trong `BAN-GIAO-DU-AN-METRO.md`.

**Kết quả**: `docs/01_PROJECT_OVERVIEW.md` đến `docs/15_ABOUT_PROJECT.md` —
đã viết đầy đủ, không sơ sài, có bảng schema dữ liệu, công thức AI Score đầy
đủ 8 tiêu chí, sơ đồ event bus, danh sách bug đã sửa/chưa sửa, quy tắc CSS/
JS chi tiết kèm giá trị token thật.

**File này (`14_SESSION_SUMMARY.md`) chính là sản phẩm của việc 3** — phiên
sau đọc file này sẽ biết ngay: Firebase đang dở ở đâu, và bộ `docs/` vừa
được tạo xong nên ưu tiên đọc `docs/` trước khi lục lại `BAN-GIAO-DU-AN-METRO.md`.

## Việc cần làm ngay khi vào phiên tiếp theo

1. Nếu tiếp tục Firebase: đọc [07_LIVE_MODE.md](07_LIVE_MODE.md) mục A đầy
   đủ trước, đặc biệt phần "cảnh báo không đảo ngược được" — không lặp lại
   việc thử click dropdown nhiều lần vô ích, hỏi thẳng Hoàng nếu tool tự
   động vẫn không ăn.
2. Nếu Hoàng đã trả lời câu hỏi email → cập nhật ngay
   [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md) mục email và xoá cảnh báo mâu
   thuẫn ở [07_LIVE_MODE.md](07_LIVE_MODE.md) + [11_TODO.md](11_TODO.md).
3. Sau khi có tiến triển Firebase mới, cập nhật lại chính file
   `14_SESSION_SUMMARY.md` này (ghi đè, không cộng dồn) và thêm dòng mới vào
   [12_CHANGELOG.md](12_CHANGELOG.md) khi Giai đoạn 12 hoàn tất.

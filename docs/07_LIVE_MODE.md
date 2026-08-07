# 07 · LIVE MODE

> ## 📌 Lịch sử tên gọi trùng — ĐÃ GIẢI QUYẾT, đọc để không lặp lại
>
> Trong ngày 07/08/2026, một phiên Claude khác (Opus 5) đã thêm một tính
> năng UI cũng đặt tên "Live Mode" (`js/features/livemode.js` + `css/live.css`
> — lớp trình bày toàn màn hình cho livestream TikTok, khác hẳn nội dung A/B
> dưới đây). Việc này gây trùng tên nghiêm trọng với file này. **Hoàng đã
> yêu cầu xoá tính năng đó và khôi phục về trạng thái trước khi nó tồn tại**
> — đã xoá xong (commit `ecc68f4`, xem
> [12_CHANGELOG.md](12_CHANGELOG.md)). Từ nay cụm "Live Mode" trong dự án
> chỉ còn 2 nghĩa (A) và (B) dưới đây, không còn xung đột. Chi tiết đầy đủ
> về việc phát hiện + xoá: xem `SESSION_SUMMARY.md` ở thư mục gốc.
>
> Ghi lại để nhớ: nếu trong tương lai có ai đề xuất lại một tính năng
> "trình bày cho livestream", đặt tên KHÁC "Live Mode" ngay từ đầu (ví dụ
> "Chế độ phát trực tiếp"/"Broadcast Mode") để tránh lặp lại đúng va chạm
> tên gọi này.

File này gộp 2 khái niệm dễ nhầm lẫn tên nhưng khác hẳn nhau: (A) **môi
trường chạy** — bản "sống" trên GitHub Pages so với chạy cục bộ, và trạng
thái chuyển sang Firebase để ghi được trực tiếp trên bản sống; (B) **Chế
độ gửi khách** (`clientmode.js`) — chế độ trình chiếu rút gọn khi đứng
trước khách. Đọc trước khi động vào bất cứ thứ gì liên quan lưu dữ liệu
hoặc trình chiếu.

---

## A · Môi trường chạy: Local vs Live (GitHub Pages)

### Hai cách mở app

| | Local (`node tools/serve.mjs`) | Live (GitHub Pages) |
|---|---|---|
| URL | `http://localhost:5173` | `https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/` |
| Đọc dữ liệu | ✅ | ✅ |
| Ghi dữ liệu (GIS editor, CRUD dự án) | ✅ qua `POST /__luu-du-lieu` | ❌ báo lỗi rõ ràng, không mất dữ liệu âm thầm |
| Cần mở terminal | Có | Không |

`js/core/luu-local.js` (`luuFile`/`xoaFile`) gọi thẳng `/__luu-du-lieu` —
endpoint này chỉ tồn tại khi `tools/serve.mjs` đang chạy, bind cứng vào
`127.0.0.1` (không mở ra LAN, vì đã có khả năng ghi file). Trên GitHub Pages
(site tĩnh, không có server), request này luôn thất bại → toast cảnh báo:
*"Không lưu được xuống file — chỉ hoạt động khi chạy node tools/serve.mjs
trên máy…"*.

### 🔴 Đang chuyển sang Firebase để ghi được trực tiếp trên bản Live (QĐ-20)

**Lý do bắt đầu:** Hoàng thấy toast lỗi trên và nói thẳng: *"tôi muốn khi mở
web lên thì thằng này phải chạy, tôi chỉnh sửa cho tiện"* — không muốn mở
terminal chỉ để sửa dữ liệu.

**Đã hỏi và Hoàng chọn hướng:** cơ sở dữ liệu đám mây miễn phí
(Firebase/Supabase) — thay vì serverless function + GitHub API, hay chỉ làm
cho chạy local dễ hơn.

**Đây LÀ một lần nới lỏng có chủ đích nguyên tắc "không backend"** đã theo
suốt dự án — không áp dụng ngược cho bất kỳ quyết định "không backend" nào
khác chưa được hỏi lại.

**Kiến trúc dự kiến sau khi hoàn tất** (chưa code, chỉ mới thiết kế + tạo hạ
tầng Firebase):
- Đọc luôn công khai (ai xem web cũng đọc được, giống hiện tại).
- Ghi bắt buộc đăng nhập — chỉ 1 tài khoản được chỉ định mới ghi được, chặn
  ở tầng Firestore Security Rules (server-side), không phải chỉ ẩn nút UI.
- File JSON trong `data/` vẫn giữ làm bản sao lưu/lịch sử qua git — cần cơ
  chế đồng bộ định kỳ từ Firestore về file (**chưa quyết định** tần suất/
  cách làm).
- Thêm màn hình đăng nhập, chỉ hiện khi bật 🛠 Chế độ biên tập GIS.
- `js/core/luu-local.js` sẽ đổi từ gọi `/__luu-du-lieu` sang ghi thẳng
  Firestore.

### ⚠️ Trạng thái thật tại thời điểm viết tài liệu này (07/08/2026) — CHƯA XONG

Đã làm qua Claude in Chrome (trình duyệt Chrome thật của Hoàng, đã đăng nhập
sẵn, theo đúng yêu cầu của Hoàng — Claude chỉ click/điền, KHÔNG gõ mật khẩu):

1. ✅ Tạo dự án Firebase `ban-do-metro-tphcm`, gói **Spark (miễn phí)**.
2. ✅ Từ chối add-on không cần (Google Developer Program, Gemini in Firebase,
   Google Analytics).
3. ✅ Bấm "Create database" trong Firestore, chọn **Standard edition**.
4. 🔴 **KẸT ở bước chọn vùng máy chủ** ("Mã định danh và vị trí cơ sở dữ
   liệu"). Mục tiêu: `asia-southeast1 (Singapore)` (gần Việt Nam nhất trong
   danh sách, theo khuyến nghị trong `HUONG-DAN-FIREBASE.md`). Dropdown chọn
   vùng của Firebase Console là `<mat-select>` (Angular Material) — click
   toạ độ nhiều lần không ăn, `.click()` qua JavaScript trên `<mat-option>`
   cũng không ăn, giá trị hiển thị vẫn cứng ở `nam5 (Hoa Kỳ)` (mặc định).
5. ❌ **CHƯA tạo xong Firestore Database** (còn dở bước 2/3 wizard).
6. ❌ **CHƯA bật Authentication** (Email/Password provider).
7. ❌ **CHƯA tạo user đăng nhập** (bước này Hoàng phải tự làm — Claude không
   gõ mật khẩu).
8. ❌ **CHƯA đặt Firestore Security Rules.**
9. ❌ **CHƯA lấy `firebaseConfig`.**
10. ❌ **CHƯA sửa một dòng code nào** trong `js/core/luu-local.js` hay bất
    cứ đâu — toàn bộ phần "chuyển sang Firestore" vẫn chỉ là thiết kế trên
    giấy, GitHub Pages vẫn báo lỗi lưu như trước khi bắt đầu Giai đoạn này.

### 🔴 CẢNH BÁO KHÔNG ĐẢO NGƯỢC ĐƯỢC — đọc trước khi làm tiếp bước chọn vùng

Firebase Console tự cảnh báo: **"Sau khi bạn đã thiết lập vị trí này, bạn
không thể thay đổi nó sau này."** TUYỆT ĐỐI không bấm "Tạo nên"/"Create" khi
ô Vị trí còn hiện `nam5 (Hoa Kỳ)`. Nếu công cụ tự động (Claude in Chrome)
vẫn không chọn được vùng đúng sau vài lần thử, **nhờ Hoàng tự bấm 3 giây**
thay vì mạo hiểm tạo sai vùng vĩnh viễn — kiểm tra kỹ lại text hiển thị
trong ô "Vị trí" bằng cách đọc, không suy đoán từ hành động đã click.

### 🔴 Mâu thuẫn chưa giải quyết — email đăng nhập Firebase

`HUONG-DAN-FIREBASE.md` giả định Hoàng đăng nhập bằng
`n.h.hoang220204@gmail.com` (Security Rules mẫu trong file đó hard-code đúng
email này). Nhưng tài khoản Google **đang đăng nhập thực tế trong Chrome của
Hoàng** (dùng để tạo project Firebase) là `hn2211609@gmail.com` — khác hẳn.
Dự án Firebase đã được tạo dưới tài khoản `hn2211609@gmail.com`.

**Phải hỏi Hoàng chốt email trước khi**: (a) đặt Firestore Security Rules
(dòng `request.auth.token.email == '...'`), (b) tạo user trong Firebase
Authentication. Chọn sai thì đăng nhập không vào được, hoặc tệ hơn — khoá
luôn quyền ghi của chính Hoàng.

### Việc còn lại theo đúng thứ tự — xem checklist đầy đủ ở [11_TODO.md](11_TODO.md)

1. Xác nhận/hoàn tất chọn vùng Firestore = Singapore, KHÔNG đảo ngược được.
2. Bật Authentication → Email/Password provider.
3. Hỏi Hoàng chốt email đăng nhập.
4. Nhờ Hoàng tự tạo user (Claude không gõ mật khẩu).
5. Đặt Firestore Security Rules đúng email đã chốt (mẫu có sẵn trong
   `HUONG-DAN-FIREBASE.md` mục 4, sửa email nếu khác).
6. Lấy `firebaseConfig` (an toàn để lộ ra ngoài — Firebase thiết kế để lộ ra
   trình duyệt cũng an toàn, bảo mật thật nằm ở Security Rules bước 5, không
   phải giá trị `apiKey`).
7. Viết code: màn hình đăng nhập (chỉ hiện khi bật 🛠), chuyển
   `js/core/luu-local.js` sang ghi Firestore, giữ file JSON làm backup.
8. Test kỹ trên GitHub Pages thật (không chỉ máy local), rồi mới báo xong.

---

## B · Chế độ gửi khách (`js/features/clientmode.js`) — "Live" theo nghĩa trình chiếu

Đừng nhầm với phần A ở trên — đây là một tính năng ĐÃ XONG, không liên quan
Firebase. Ẩn toàn bộ panel điều khiển, chỉ còn bản đồ + thẻ tóm tắt gọn để
chụp màn hình gửi Zalo, không lộ nút bấm/ghi chú nội bộ.

**Cách bật**: nút "📤 Gửi khách" trên topbar, yêu cầu phải có `state.chon`
(đã chọn 1 dự án) — nếu chưa chọn, toast cảnh báo.

**Cơ chế**: `appEl.dataset.client = ''` → CSS (`client.css`) ẩn `!important`
toàn bộ `.topbar, .panel, .sidebar, .cmp, .mapctl, .boot, .toastbox`, chỉ
giữ `#map` và thẻ `.ck`. Bản đồ tự `map.invalidateSize()` sau 220ms và bay
tới dự án ở zoom ≥15.

**Nội dung thẻ `.ck`**: logo, tên, chủ đầu tư, địa chỉ, AI Score (sao + số +
nhãn + thanh bar từng tiêu chí), loại hình, giá từ, quy mô, bàn giao, ga gần
nhất, tối đa 6 tiện ích nổi bật (mỗi nhóm chỉ lấy 1 điểm gần nhất trong 2km),
và dòng chú thích miễn trừ trách nhiệm.

**Bẫy kiến trúc quan trọng** (ghi trong comment `clientmode.js`, liên kết
trực tiếp với QĐ-9 trong [02_ARCHITECTURE.md](02_ARCHITECTURE.md)): bố cục
dùng vị trí tuyệt đối đè lên bản đồ, KHÔNG chia lưới. Bản dựng trước dùng
`grid-template` rút gọn đã xoá mất `grid-template-areas`, làm ô bản đồ co về
0 chiều cao — hỏng đúng tính năng này. Đừng quay lại cách Grid.

Hỗ trợ `@media print` — ẩn UI tương tự, bản đồ `position:relative; height:130mm`
để in ra giấy A4 (xem [06_UI_UX_RULES.md](06_UI_UX_RULES.md) mục 5).
**Xuất ảnh PNG / in A4 hoàn chỉnh chưa dựng lại** ở kiến trúc mới (có ở bản
v1 cũ) — xem [10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md).

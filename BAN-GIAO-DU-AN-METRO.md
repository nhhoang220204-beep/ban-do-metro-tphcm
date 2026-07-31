# BÀN GIAO DỰ ÁN — Bản đồ Metro TP.HCM

> Tài liệu này viết cho một phiên Claude hoàn toàn mới. Đọc xong file này là đủ để tiếp tục công việc, không cần đọc lại lịch sử hội thoại.
>
> **Cập nhật:** 31/07/2026 · **Trạng thái:** Đã chạy trên web, còn chờ chủ dự án tạo Google Sheet

---

## 1 · Project Overview

**Sản phẩm:** Bản đồ mạng lưới đường sắt đô thị TP.HCM và Bình Dương, dạng web app một file HTML.

**Người dùng:** Huy Hoàng — môi giới bất động sản khu vực Bình Dương và TP.HCM. Dùng bản đồ để tư vấn khách hàng theo trục metro, chụp màn hình gửi khách qua Zalo, và cho đồng nghiệp cùng dùng chung danh sách dự án.

**Bài toán nghiệp vụ:** Khách mua BĐS quan tâm "dự án này cách ga metro bao xa, bao giờ có metro". Bản đồ phải trả lời được ngay và **không được nói sai**, vì sai là đi thẳng tới khách hàng.

**Ràng buộc kỹ thuật:**
- Một file HTML duy nhất, không backend, không framework
- Thư viện ngoài duy nhất: Leaflet 1.9.4 (CDN unpkg)
- Chạy tốt trên điện thoại
- Miễn phí hoàn toàn

**Link đang chạy:** https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/

---

## 2 · Current Status

| Hạng mục | Trạng thái |
|---|---|
| Ứng dụng bản đồ | ✅ Hoàn thành, đã refactor toàn bộ |
| Dữ liệu tuyến metro | ✅ 10 tuyến, 49 ga xác minh từ OpenStreetMap |
| Kiểm thử chức năng | ✅ Đã test trên link web thật, không lỗi JS |
| Đưa lên GitHub | ✅ Repo public, đã push 3 commit |
| GitHub Pages | ✅ Đang chạy, HTTP 200 |
| Đọc Google Sheet | ⚠️ Cơ chế đã thông (CORS đã kiểm), **chưa test với Sheet thật** |
| Tạo Google Sheet | ❌ Chủ dự án chưa làm |
| Bản in A4 / ảnh PNG mở ra xem | ⚠️ Code chạy, xuất file đúng, **chưa xem được bố cục bằng mắt** |

**Con số hiện tại:** 10 tuyến · 49 ga đã xác minh toạ độ · 4 khúc gấp >60° (đều là góc rẽ thật) · 0 ga lệch khỏi hình tuyến.

---

## 3 · Completed Tasks

### Giai đoạn 1 — Dựng bản đầu (đã bị thay thế)
Dựng app với dữ liệu tự suy từ quy hoạch. **Toàn bộ dữ liệu này đã bị loại bỏ** vì sai — xem mục Technical Decisions.

### Giai đoạn 2 — Đối chiếu dữ liệu
- Phát hiện toạ độ ga tự suy lệch trung bình **435 m**, chỗ tệ nhất **974 m**, ngay trên tuyến 1 đang vận hành
- Phát hiện tuyến 6 vẽ sai hoàn toàn (quy hoạch cũ Bà Quẹo–Phú Lâm thay vì Tân Sơn Nhất–Phú Hữu)
- Phát hiện thiếu hẳn Metro số 2 Thủ Dầu Một và tuyến Bến Thành–Cần Giờ

### Giai đoạn 3 — Refactor toàn bộ theo nguyên tắc "chỉ dùng dữ liệu xác minh"
- Viết lại toàn bộ app từ đầu, không giữ code cũ
- Lấy hình học hướng tuyến thật từ OpenStreetMap cho cả 10 tuyến
- Xử lý 3 bẫy dữ liệu OSM (xem Known Issues)
- Thêm huy hiệu mức phủ dữ liệu cho từng tuyến, mục "Dữ liệu chưa xác minh"
- Sửa lỗi chế độ gửi khách làm bản đồ co về 0 chiều cao
- Sửa lỗi màn hình chờ không tắt

### Giai đoạn 4 — Chia sẻ nhóm
- Xây lớp đọc Google Sheet: bộ đọc CSV tự viết, gộp hai nguồn dự án chung/riêng
- Viết file mẫu `mau-du-an-bds.csv` và hướng dẫn `HUONG-DAN-CHIA-SE.md`
- Đưa lên GitHub, bật Pages, kiểm tra trên link thật
- Gộp quy trình tạo dữ liệu thành công cụ `tools/build-geo.mjs`

---

## 4 · Pending Tasks

**Chủ dự án phải làm (Claude không làm thay được):**

1. **Tạo Google Sheet dự án** — nhập `mau-du-an-bds.csv`, mở quyền xem, dán link vào app. Hướng dẫn ở `HUONG-DAN-CHIA-SE.md`.
2. **Xem thử bản in A4 và ảnh PNG** — báo lại nếu bố cục lệch.
3. **Đăng nhập `gh` CLI** nếu muốn Claude quản trị repo qua API (đã thử 2 lần không thành, hiện không cần thiết).

**Còn tồn đọng về kỹ thuật:**

4. Test lớp đọc Google Sheet với một Sheet thật (chưa từng chạy end-to-end).
5. Bổ sung dữ liệu ga còn thiếu — xem Business Rules mục "Dữ liệu còn thiếu".

---

## 5 · Technical Decisions

Những quyết định dưới đây đã thống nhất với chủ dự án. **Không tự ý đảo ngược.**

### QĐ-1 · Chỉ vẽ dữ liệu xác minh được — quyết định quan trọng nhất

Bản đồ **không bao giờ** nội suy, ước lượng hay tự đặt vị trí ga, tuyến, dự án. Thiếu toạ độ thì hiển thị "Chưa xác minh" và **không ghim lên bản đồ**.

*Lý do:* Bản dựng đầu tiên tự suy vị trí ga rồi nối thẳng, tạo ra các tuyến zigzag cắt chéo nhau — tuyến bd2 có **13 khúc bẻ trên 60°**. Chủ dự án phát hiện ngay khi nhìn. Dữ liệu sai trên công cụ tư vấn là đi thẳng tới khách hàng.

### QĐ-2 · Nguồn dữ liệu là OpenStreetMap qua Overpass API

OSM có sẵn hình học hướng tuyến của gần như toàn mạng, kể cả các tuyến quy hoạch. Toạ độ tuyến 1 đo ra 19,6 km, khớp con số chính thức 19,7 km.

*Không dùng:* trí nhớ mô hình, suy luận từ tên đường, nội suy giữa các mốc.

### QĐ-3 · Bốn mức trạng thái tuyến

`operating` → `construction` → `preparing` → `planned`. Mức `preparing` (Chuẩn bị khởi công 2026) được thêm riêng vì với nghề môi giới, "sắp đào thật trong năm nay" khác hẳn "còn nằm trên giấy" về mặt giá.

### QĐ-4 · Dự án BĐS tách hai nguồn

- **Dùng chung** — đọc từ Google Sheet, ghim xanh dương, **chỉ đọc** trong app. Sửa bằng cách gõ vào bảng tính.
- **Riêng** — lưu localStorage từng máy, ghim xanh ngọc, sửa được trong app.

*Lý do khoá phần dùng chung:* tránh hai người sửa đè lên nhau. Bảng tính là nguồn sự thật duy nhất.

### QĐ-5 · Không publish thành Artifact trên claude.ai

Artifact chặn mọi request ra ngoài. App cần tải Leaflet từ unpkg và ảnh nền từ máy chủ tile → vào đó ra trang trắng. **Bắt buộc dùng hosting thật.**

### QĐ-6 · Không mở file trực tiếp từ ổ đĩa khi cần Google Sheet

Giao thức `file://` bị trình duyệt chặn đọc dữ liệu từ tên miền khác. App đã tự phát hiện và báo tiếng Việt rõ ràng. Bản đồ tuyến vẫn xem được, chỉ mất phần dùng chung.

### QĐ-7 · Email chủ dự án dùng địa chỉ ẩn danh trong commit

Repo public nên email thật sẽ bị thu thập spam. Dùng `311277811+nhhoang220204-beep@users.noreply.github.com`.

---

## 6 · Files & Folder Structure

```
D:\Claude Cowork\ABOUT ME\
├── ban-do-metro-tphcm.html      ← bản làm việc (giống hệt metro-web/index.html)
├── mau-du-an-bds.csv            ← file mẫu tạo Google Sheet
├── HUONG-DAN-CHIA-SE.md         ← hướng dẫn cho chủ dự án
├── BAN-GIAO-DU-AN-METRO.md      ← file này
│
├── metro-web\                   ← THƯ MỤC GIT, đây là bản đẩy lên GitHub
│   ├── .git\
│   ├── index.html               ← app (134 KB, 1897 dòng)
│   ├── README.md
│   ├── HUONG-DAN-CHIA-SE.md
│   ├── mau-du-an-bds.csv
│   ├── .gitignore
│   └── tools\
│       ├── build-geo.mjs        ← công cụ tái tạo dữ liệu GEO từ OSM
│       └── cache\
│           ├── planned.json     ← ảnh chụp OSM 29/07/2026 (hướng tuyến + ga)
│           └── stations.json    ← ảnh chụp OSM 29/07/2026 (ga đang khai thác)
│
└── (các file khác không liên quan dự án này)
```

**Cấu trúc bên trong `index.html`** — một file, chia mục rõ ràng bằng comment `/* ─── §N · TÊN ─── */`:

| Mục | Nội dung | Dòng ~ |
|---|---|---|
| §1 GEO | Hình học tuyến + toạ độ ga. **Sinh tự động, không sửa tay** | 740 |
| §2 LINES | Tên tuyến, màu, trạng thái, số liệu hồ sơ, từ khoá tìm kiếm | 745 |
| §3 GAPS | Danh sách dữ liệu còn thiếu, khai báo tường minh | 800 |
| §4 UTIL | Hàm dùng chung: haversine, định dạng, bỏ dấu, toast | 816 |
| §5 MAP | Khởi tạo Leaflet, nền bản đồ, lớp | 868 |
| §6 RENDER | Vẽ tuyến, ga, popup, chú thích | 917 |
| §7 UI | Bảng điều khiển, bộ lọc, tìm kiếm | 1045 |
| §8 PROJECT | Dự án BĐS + đọc Google Sheet + tính ga gần nhất | 1224 |
| §9 EXPORT | Xuất PNG (canvas tự vẽ), in, PDF | 1580 |
| §10 BOOT | Sự kiện, khởi động | 1773 |

CSS cũng chia mục tương tự (§1 Tokens → §11 In/PDF).

---

## 7 · Coding Standards

**Ngôn ngữ:** Toàn bộ comment, tên biến nghiệp vụ, chuỗi giao diện bằng **tiếng Việt**. Comment giải thích *tại sao*, không mô tả lại code.

**JavaScript:**
- ES2022 thuần, không transpile. Dùng `?.`, `??`, `.at(-1)`, optional catch binding
- Không framework, không thư viện tiện ích
- Một trình xử lý sự kiện chung dùng `data-*` thay vì gắn listener rải rác — xem `wireDelegates()`
- Hàm ngắn, một việc, đặt tên động từ tiếng Anh nhưng comment tiếng Việt
- `$()` / `$$()` là alias của querySelector — dùng thay cho getElementById

**CSS:**
- Biến CSS ở `:root` cho mọi màu, khoảng cách, bo góc, đổ bóng. **Không hardcode giá trị**
- Thang khoảng cách 4px: `--s1` đến `--s8`
- Đặt tên kiểu BEM rút gọn: `.card`, `.card__body`, `.btn--primary`
- Trạng thái dùng thuộc tính `data-*` thay vì class: `[data-open]`, `[data-present]`
- ⚠️ **Không dùng cú pháp rút gọn `grid-template`** — nó xoá luôn `grid-template-areas`. Đã gây lỗi nghiêm trọng một lần.

**Nguyên tắc chung:**
- Không giữ code chỉ để "chạy được"
- Lỗi mạng hay dữ liệu hỏng không được làm chết ứng dụng — luôn có nhánh xử lý và thông báo tiếng Việt dễ hiểu
- Không dùng `requestAnimationFrame` cho logic khởi động (bị treo khi tab ẩn)

---

## 8 · Business Rules

### BR-1 · Ba mức tin cậy dữ liệu, hiển thị công khai
Mỗi tuyến có huy hiệu ngay trong danh sách: `14/14 ga` (xanh, đủ), `2/24 ga` (cam, một phần), `0/19 ga` (xám, chưa có).

### BR-2 · Toạ độ ngoài phạm vi bị chặn
Chỉ chấp nhận vĩ độ 8–12,5 và kinh độ 105–108,5. Ngoài khoảng này báo "Toạ độ không hợp lệ", không ghim. Chống trường hợp gõ nhầm hoặc đảo hai cột.

### BR-3 · Ước lượng thời gian di chuyển
Đường thực tế = đường chim bay × 1,3. Đi bộ 4,8 km/h. Đi xe nội đô 22 km/h cộng 1 phút. Hằng số `DETOUR` trong §4.

### BR-4 · Ga trung chuyển
Ga nằm trong 80 m của nhiều tuyến được coi là ga trung chuyển, hiện vòng đen to hơn. Hiện có 8 ga: Bến Thành, Thảo Điền, Phước Long, Bình Thái, Thủ Thiêm, Hiệp Bình Phước, Bà Hiện, Phú Hữu.

### BR-5 · Câu nói khi tư vấn khách
Luôn dẫn kèm *"theo hồ sơ đang niêm yết"*. Hướng tuyến vẫn có thể điều chỉnh — tuyến 6 vừa bỏ bớt 1 ga trong tháng 7/2026. Chiều dài, số ga, tốc độ thiết kế đang vênh nhau giữa các nguồn báo chí.

### Dữ liệu còn thiếu (đã khai báo trong §3 GAPS của app)

| Tuyến | Thiếu |
|---|---|
| Metro số 2 Thủ Dầu Một | 22/24 ga — chỉ có ga S5 (C0) và Hiệp Bình Phước (C12) |
| Metro Bình Dương – Suối Tiên | Toàn bộ 19 ga |
| Bến Thành – Cần Giờ | Toàn bộ 6 ga |
| Metro số 2 Bến Thành–Tham Lương | 8/10 ga |
| Metro số 6 | 2 ga ngầm sân bay ST01, ST02 |
| Thủ Thiêm – Long Thành | 1 ga (có 18/19) |
| Tuyến 3, tuyến 7 | Toàn bộ ga |

**Nguồn có thể bổ sung:** file bản đồ hướng tuyến MAUR niêm yết tại phường Bến Thành (link báo Tuổi Trẻ / Tiền Phong tháng 7/2026). Chủ dự án chưa cung cấp.

---

## 9 · Known Issues

### Ba bẫy dữ liệu OpenStreetMap — đã xử lý, đừng bỏ các bước này

**Bẫy 1 · Đường sắt hai chiều thành hai way riêng.** Nối lại thành vòng khép kín, tuyến dài gấp đôi — tuyến 1 ra 33,8 km thay vì 19,7 km, kèm khúc gập 179°. Xử lý: hàm `singleTrack()` phát hiện vòng khép kín rồi giữ một chiều.

**Bẫy 2 · Còn sót khúc gập ngược sau khi tách chiều.** Xử lý: hàm `unfold()` cắt tại khúc quay >150°, giữ nhánh dài hơn.

**Bẫy 3 · Gán ga độc quyền cho tuyến gần nhất làm mất ga trung chuyển.** Ga Bến Thành bị gán cho một tuyến duy nhất. Xử lý: gán cho mọi tuyến trong ngưỡng 80 m.

### Bẫy lập trình đã gặp

**`grid-template` rút gọn xoá `grid-template-areas`** → chế độ gửi khách làm bản đồ co về 0 chiều cao, hỏng hoàn toàn tính năng chụp gửi khách. Luôn viết tách `grid-template-columns` và `grid-template-rows`.

**`requestAnimationFrame` bị treo khi tab ẩn** → màn hình chờ không bao giờ tắt, che toàn bộ giao diện. Không dùng rAF cho logic khởi động.

**Ô nhập toạ độ để `type="number"`** → dán chuỗi "10.98, 106.65" từ Google Maps bị trình duyệt xoá trắng. Phải dùng `type="text"` kèm `inputmode="decimal"`.

**Đo khoảng cách tới polyline phải đo tới CẠNH, không phải tới ĐỈNH.** Đo sai cho kết quả lệch 4,4 km ở nơi thực tế chỉ vài chục mét.

### Hạn chế còn tồn tại

- **`gh` CLI chưa đăng nhập.** Không quản trị repo qua API được. Push thì chạy bình thường nhờ Git Credential Manager.
- **Tuyến 7 có 3 khúc >60° (gấp nhất 83°), tuyến Cần Giờ 1 khúc 64°.** Đây là góc rẽ thật trong dữ liệu OSM, không phải lỗi.
- **Cách đánh số tuyến trong quy hoạch mới khác quy hoạch 2013.** Tuyến 3 giờ là Hiệp Bình Phước–An Hạ, tuyến 7 là Tân Kiên–Vinhomes Grand Park. Các tuyến 3a/4/4b/5 của quy hoạch cũ không có hướng tuyến xác minh nên không vẽ.

---

## 10 · Next Priority

Theo thứ tự:

1. **Chờ chủ dự án tạo Google Sheet** rồi test lớp đọc dữ liệu end-to-end. Đây là mắt xích duy nhất chưa từng chạy thật.
2. **Xin file bản đồ hướng tuyến MAUR** để bổ sung 22 ga còn thiếu của Metro số 2 Thủ Dầu Một — tuyến quan trọng nhất với nghiệp vụ của chủ dự án.
3. **Xác nhận bản in A4 và ảnh PNG** đúng bố cục.
4. Chỉ khi ba việc trên xong mới tính tới mở rộng: lớp Vành đai 3, cao tốc Chơn Thành, vùng TOD 1.120 ha dọc trục Bình Dương, so sánh hai dự án cạnh nhau.

---

## 11 · Important Context

**Về chủ dự án:** Huy Hoàng, xưng hô "fen/tui". Thích câu trả lời thẳng, không vòng vo, không tâng bốc. **Kiểm tra kỹ và bắt lỗi rất nhanh** — đã phát hiện lỗi tuyến vẽ zigzag chỉ bằng cách nhìn bản đồ. Khi bị chỉ ra sai thì phải thừa nhận thẳng, đo bằng số liệu cụ thể, rồi sửa tận gốc chứ không vá.

**Về giọng văn:** Xem `anti-ai-writing-style.md` cùng thư mục. Tránh câu tường thuật kiểu bản tin, tránh cụm mở dẫn sáo như "Điều đáng nói là", "Không phải ai cũng biết".

**Về xác thực:** Claude **không được** nhập mật khẩu, token hay tạo tài khoản thay chủ dự án. Đã xử lý bằng cách để chủ dự án tự đăng nhập qua Git Credential Manager.

**Bài học lớn nhất của dự án này:** Lần dựng đầu tiên Claude tự suy dữ liệu từ trí nhớ và tạo ra sản phẩm trông đẹp nhưng sai ở mọi chỗ quan trọng. Với công cụ đưa thông tin tới khách hàng thật, **tra nguồn trước, dựng sau**. Nếu không tra được thì nói thẳng là chưa xác minh, đừng đoán.

---

## 12 · Reusable Prompts

**Cập nhật dữ liệu tuyến từ OpenStreetMap:**
```
Chạy node tools/build-geo.mjs trong thư mục metro-web để tải lại dữ liệu OSM
và ghi vào index.html. Kiểm tra báo cáo chất lượng: tuyến 1 phải ra ~19,6 km /
14 ga, toàn mạng ~4 khúc gấp >60°, 0 ga lệch khỏi tuyến. Nếu số liệu lệch nhiều
so với mốc này thì dừng lại, đừng ghi đè, báo tôi trước.
```

**Đẩy bản cập nhật lên web:**
```
Copy ban-do-metro-tphcm.html đè lên metro-web/index.html, rồi commit và push.
Không cần đăng nhập lại, Git Credential Manager đã lưu. Sau khi push xong mở
https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/ kiểm tra không lỗi JS
và đủ 10 tuyến 49 ga.
```

**Thêm tuyến mới khi có dữ liệu:**
```
Thêm tên way OSM vào LINE_DEFS trong tools/build-geo.mjs, thêm một mục vào
mảng LINES trong index.html (id, name, route, color, status, docStations, alias,
note), rồi chạy lại build-geo.mjs. Bộ lọc, chú thích, tìm kiếm, xuất ảnh tự cập nhật.
```

**Kiểm tra chất lượng hình học tuyến:**
```
Đo cho từng tuyến: số khúc bẻ trên 60 độ giữa các đoạn liên tiếp, khúc gấp lớn
nhất, và khoảng cách từ mỗi ga tới CẠNH gần nhất của hình tuyến (không phải tới
đỉnh). Tuyến metro thật không zigzag — nhiều khúc gấp là dấu hiệu dữ liệu hỏng.
```

**Bổ sung ga khi có nguồn chính thức:**
```
Tôi có [nguồn]. Đối chiếu với dữ liệu hiện tại, chỉ thêm ga nào có toạ độ xác
minh được. Ga nào nguồn chỉ nêu tên mà không có toạ độ thì giữ trong mục GAPS,
không tự đoán vị trí.
```

---

## 13 · TODO Checklist

### Chủ dự án
- [ ] Tạo Google Sheet từ `mau-du-an-bds.csv`
- [ ] Mở quyền: Tệp → Chia sẻ → Xuất bản lên web → CSV
- [ ] Dán link vào mục "Dữ liệu dùng chung" trong app
- [ ] Bấm "Sao chép link chia sẻ kèm bảng tính", gửi đồng nghiệp
- [ ] Xem thử bản in A4 và ảnh PNG, báo lại nếu lệch
- [ ] Xin file bản đồ hướng tuyến MAUR (nếu có thể)

### Kỹ thuật
- [ ] Test đọc Google Sheet thật (end-to-end)
- [ ] Bổ sung 22 ga Metro số 2 Thủ Dầu Một khi có nguồn
- [ ] Bổ sung 19 ga Metro Bình Dương – Suối Tiên
- [ ] Bổ sung 6 ga Bến Thành – Cần Giờ
- [ ] Cân nhắc dán `SHEET_URL` cố định vào index.html cho link gọn
- [ ] (Tuỳ chọn) Lớp Vành đai 3, cao tốc Chơn Thành
- [ ] (Tuỳ chọn) Vùng TOD 1.120 ha dọc trục Bình Dương

### Không làm
- [x] ~~Publish thành Artifact claude.ai~~ — CSP chặn, ra trang trắng
- [x] ~~Tự nội suy vị trí ga~~ — vi phạm QĐ-1
- [x] ~~Vẽ tramway và monorail quy hoạch cũ~~ — không có hướng tuyến xác minh

---

## 14 · Starter Prompt cho phiên mới

Sao chép nguyên khối dưới đây vào phiên Claude mới:

```
Tôi đang tiếp tục dự án "Bản đồ Metro TP.HCM" — web app một file HTML dùng để
tư vấn bất động sản theo trục metro.

Đọc file bàn giao trước khi làm bất cứ việc gì:
D:\Claude Cowork\ABOUT ME\BAN-GIAO-DU-AN-METRO.md

Tóm tắt để anh nắm nhanh:
- App đang chạy tại https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/
- Mã nguồn ở D:\Claude Cowork\ABOUT ME\metro-web\ (đã là repo git, remote sẵn sàng)
- 10 tuyến metro, 49 ga, dữ liệu lấy nguyên từ OpenStreetMap

QUY TẮC SỐ MỘT, tuyệt đối không vi phạm:
Chỉ vẽ dữ liệu xác minh được. Không nội suy, không ước lượng, không tự đoán vị
trí ga hay dự án. Thiếu toạ độ thì hiển thị "Chưa xác minh" và không ghim lên
bản đồ. Lý do: bản dựng đầu tiên tự suy dữ liệu, tạo ra tuyến metro zigzag cắt
chéo nhau và toạ độ ga lệch tới 1 km. Đây là công cụ đưa thông tin tới khách
hàng thật.

Cách làm việc tôi muốn:
- Nói thẳng, không vòng vo, không khen xã giao
- Sai thì thừa nhận, đo bằng số liệu cụ thể, sửa tận gốc chứ đừng vá
- Kiểm tra thật trước khi báo xong, đừng nói suông

Việc cần làm tiếp: [điền việc cụ thể]
```

---

## 15 · Tham chiếu nhanh

| Thứ | Giá trị |
|---|---|
| Link web | https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/ |
| Repo | https://github.com/nhhoang220204-beep/ban-do-metro-tphcm |
| Tài khoản GitHub | `nhhoang220204-beep` (id 311277811) |
| Email commit | `311277811+nhhoang220204-beep@users.noreply.github.com` |
| Thư mục git | `D:\Claude Cowork\ABOUT ME\metro-web\` |
| Nhánh | `main` |
| Xác thực | Git Credential Manager (đã lưu) · `gh` CLI **chưa** đăng nhập |
| Dòng dán link Sheet | `const SHEET_URL = '';` trong `index.html` |
| Nguồn dữ liệu | OpenStreetMap Overpass API, chụp ngày 29/07/2026 |
| Ảnh chụp dữ liệu gốc | `metro-web/tools/cache/` |
| Công cụ tái tạo | `node tools/build-geo.mjs [--dry] [--cache]` |
| Mốc kiểm tra | tuyến 1 = 19,6 km / 14 ga · 4 khúc gấp · 0 ga lệch |

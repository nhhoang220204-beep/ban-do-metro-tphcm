# BÀN GIAO DỰ ÁN — Bản đồ tư vấn bất động sản TP.HCM (v2)

> Tài liệu này viết cho một phiên Claude hoàn toàn mới. Đọc xong là đủ để tiếp
> tục công việc, không cần đọc lại lịch sử hội thoại.
>
> **Cập nhật:** 31/07/2026 · **Trạng thái:** v2 chạy được trên máy, chờ ghim dự án và đẩy lên web
>
> Chi tiết lỗi đã sửa, dữ liệu còn thiếu và đề xuất tiếp: xem **`BAO-CAO-V2.md`**.

---

## 1 · Sản phẩm là gì

Bản đồ tư vấn bất động sản khu vực Thành phố Hồ Chí Minh (sau sáp nhập 2025, gồm
cả Bình Dương và Bà Rịa – Vũng Tàu cũ).

Người dùng: **Huy Hoàng**, môi giới BĐS. Mở bản đồ khi ngồi với khách, hoặc chụp
màn hình gửi Zalo.

Bài toán: khách hỏi "dự án này cách metro bao xa, quanh đây có gì, có đáng tiền
không". Bản đồ phải trả lời ngay và **không được nói sai**, vì sai là đi thẳng
tới khách hàng.

**Link web:** https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/
*(hiện đang chạy bản v1 — v2 chưa đẩy lên, xem mục 6)*

---

## 2 · Quy tắc số một, tuyệt đối không vi phạm

> Chỉ hiển thị dữ liệu xác minh được. Không nội suy, không ước lượng, không đoán.
> Thiếu thì ghi **"Đang cập nhật"**.

Bản dựng đầu tiên tự suy vị trí ga từ trí nhớ mô hình, sai trung bình 435 m, chỗ
tệ nhất 974 m, ngay trên tuyến đang chạy tàu. Tuyến vẽ zigzag cắt chéo nhau.
Hoàng phát hiện chỉ bằng cách nhìn bản đồ.

Ba hệ quả trong mã v2:
- Ứng dụng **không bao giờ tự sinh toạ độ dự án**. Chỉ có hai nguồn: đối tượng
  cùng tên trong OpenStreetMap, hoặc do Hoàng tự ghim.
- Khoảng cách đo bằng **đường thật qua OSRM**, không phải chim bay × 1,3 như v1.
  Không đo được thì "Đang cập nhật", không quay về ước lượng.
- Điểm đánh giá chỉ chấm tiêu chí có đủ đầu vào, và luôn hiện rõ đã chấm mấy trên tám.

---

## 3 · Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Ứng dụng v2 | ✅ Viết lại toàn bộ, 21 module JS + 7 CSS |
| Dữ liệu nền từ OSM | ✅ 12 lớp, khoảng 1,5 MB |
| Danh mục dự án | ✅ **1.165 dự án** — 11 đã kiểm + 1.154 ứng viên OSM |
| Kiến trúc chịu quy mô | ✅ Đo thật ở 5.000 dự án: vẽ lại 4–11 ms, DOM ~1.200 nút |
| Định tuyến đường thật | ✅ OSRM — tiền tính cho dự án đã kiểm, tự đo tại chỗ cho phần còn lại |
| Kiểm thử trên trình duyệt | ✅ Không lỗi console |
| **Toạ độ 9 dự án Hoàng bán** | ⚠️ **Vẫn chưa ghim** — việc gấp nhất |
| Hồ sơ dự án (giá, pháp lý, số căn) | ⚠️ Phần lớn trống; ứng viên OSM thì trống hoàn toàn theo thiết kế |
| Hồ sơ metro có nguồn đối chiếu | ✅ 10 tuyến, GeoJSON + JSON + CSV — xem `data/metro/` |
| Xuất ảnh PNG / in A4 | ❌ v1 có, v2 chưa dựng lại |
| Đọc Google Sheet (QĐ-4) | ❌ Chưa dựng lại — **cần Hoàng quyết**, xem BAO-CAO-V2 mục XĐ-2 |
| Đẩy v2 lên GitHub Pages | ✅ **Đã lên ngày 01/08/2026**, kiểm thử trên link thật không lỗi |

---

## 4 · Quyết định đã chốt — không tự ý đảo ngược

**QĐ-1 · Chỉ vẽ dữ liệu xác minh được.** Xem mục 2. Quan trọng nhất.

**QĐ-2 · Nguồn dữ liệu là OpenStreetMap qua Overpass API.** Không dùng trí nhớ
mô hình, không suy từ tên đường, không nội suy giữa các mốc.

**QĐ-3 · Bốn mức trạng thái tuyến:** `operating` → `construction` → `preparing`
→ `planned`. Mức `preparing` (chuẩn bị khởi công 2026) tách riêng vì với nghề
môi giới, "sắp đào thật trong năm nay" khác hẳn "còn nằm trên giấy" về mặt giá.

**QĐ-4 · Dự án BĐS tách hai nguồn (dùng chung / riêng).** ⚠️ **v2 chưa dựng lại
phần Google Sheet.** Chưa huỷ quyết định, chỉ là chưa làm — đang chờ Hoàng chốt.

**QĐ-5 · Không publish thành Artifact claude.ai.** Artifact chặn mọi request ra
ngoài; app cần Leaflet từ unpkg và ảnh nền từ máy chủ tile → ra trang trắng.

**QĐ-6 · Không mở file trực tiếp từ ổ đĩa.** `file://` chặn cả `fetch` lẫn module
JavaScript. v2 tự phát hiện và báo tiếng Việt kèm câu lệnh cần chạy.

**QĐ-7 · Email commit dùng địa chỉ ẩn danh**
`311277811+nhhoang220204-beep@users.noreply.github.com` vì repo public.

**QĐ-8 (mới, v2) · Hai cấp hành chính.** TP.HCM sau 01/07/2025 chỉ còn thành phố
và 168 phường/xã. Không còn quận/huyện. Bộ lọc địa bàn dùng phường/xã.

**QĐ-9 (mới, v2) · Bố cục dùng vị trí tuyệt đối, không dùng lưới.** Bản đồ chiếm
trọn khung, mọi bảng nổi lên trên. Nhờ vậy bản đồ không bao giờ đổi kích thước
khi đóng/mở bảng — chính là lỗi từng làm hỏng chế độ gửi khách ở v1.

**QĐ-10 (mới, v2) · Hai mức tin cậy dữ liệu, hiện công khai.** `thu-cong` là hồ
sơ Hoàng đã kiểm, dùng được để tư vấn. `osm` là ứng viên lấy từ OpenStreetMap —
tên và toạ độ có thật nhưng **chưa biết có đang bán hay không**, mang nhãn đỏ
"Chưa kiểm" ở danh sách, bong bóng và đầu hồ sơ. Ứng viên luôn có
`trangThai: "chua-ro"` và mọi ô số liệu là "Đang cập nhật" — công cụ tuyệt đối
không đoán giá, chủ đầu tư, pháp lý hay tình trạng bán.

**QĐ-11 (mới, v2) · Danh mục tách chỉ mục và hồ sơ.** `index.json` nạp ngay
(279 byte/dự án), `chi-tiet/<id>.json` chỉ tải khi mở đúng dự án đó. Thêm dự án
là thêm một object vào chỉ mục, website tự cập nhật, không chạy công cụ nào.

---

## 5 · Cấu trúc

```
D:\Claude Cowork\ABOUT ME\metro-web\      ← THƯ MỤC GIT, đây là bản đẩy lên GitHub
├── index.html              vỏ trang, không dữ liệu và không logic
├── css/  (7 file)          tokens · base · layout · map · panels · sidebar · client
├── js/   (19 module)       core/ · map/ · features/ · app.js
├── data/ (13 file JSON)    toàn bộ dữ liệu, sinh bằng tools/, KHÔNG sửa tay
├── tools/
│   ├── lib/osm.mjs         gọi Overpass, hình học, ghi file
│   ├── lib/route.mjs       ma trận đường thật qua OSRM
│   ├── build-data.mjs      9 lớp nền
│   ├── build-around.mjs    tiện ích + ga metro quanh từng dự án
│   ├── build-geo.mjs       dựng lại hình tuyến metro (ít khi cần)
│   ├── serve.mjs           máy chủ tĩnh
│   └── cache/              ảnh chụp thô, 16 MB, .gitignore bỏ qua
│       └── geo-verified.json   ← NGOẠI LỆ, phải theo repo
├── README.md               tổng quan + cách chạy
├── HUONG-DAN-NHAP-DU-AN.md hướng dẫn cho Hoàng nhập dự án và ghim vị trí
├── HUONG-DAN-CHIA-SE.md    (v1, Google Sheet — đã dán cảnh báo ở đầu file)
├── BAO-CAO-V2.md           báo cáo đầy đủ: lỗi đã sửa, dữ liệu thiếu, đề xuất
└── BAN-GIAO-DU-AN-METRO.md file này
```

**`tools/cache/geo-verified.json` là nguồn sự thật của hình tuyến metro.** Đã qua
kiểm định: tuyến 1 = **19,6 km / 14 ga** (số chính thức 19,7 km), toàn mạng 4
khúc gấp trên 60° đều là góc rẽ thật, 0 ga lệch khỏi hình tuyến. Muốn cập nhật
thì chạy `build-geo.mjs` rồi **đối chiếu lại các mốc trên trước khi ghi đè**.

---

## 6 · Việc cần làm tiếp, theo thứ tự

### Hoàng làm (Claude không làm thay được)

1. **Ghim 9 dự án còn thiếu toạ độ.** Mỗi dự án khoảng 1 phút. Xem
   `HUONG-DAN-NHAP-DU-AN.md`. Đây là việc quyết định công cụ có dùng được không.
2. **Điền hồ sơ dự án** — ít nhất `phapLy`, `giaTu`, `tongSoCan` để chấm được
   tiêu chí Thanh khoản.
3. **Chốt XĐ-2:** có dựng lại phần đọc Google Sheet hay bỏ hẳn.
4. **Mở app bằng mắt một lượt** — môi trường dựng không chụp được màn hình.
5. Xác nhận điều kiện dùng ảnh nền vệ tinh Esri cho mục đích thương mại.

### Kỹ thuật

6. Sau khi Hoàng ghim xong: `node tools/build-around.mjs`
7. Đẩy v2 lên GitHub Pages (chưa push — cần Hoàng đồng ý vì đây là trang public)
8. Dựng lại nút xuất ảnh PNG / in A4 cho chế độ gửi khách
9. Bảng tính tài chính trong hồ sơ dự án
10. Bổ sung ga metro khi có bản đồ hướng tuyến MAUR

---

## 7 · Quy ước mã

**Ngôn ngữ:** comment, tên biến nghiệp vụ, chuỗi giao diện đều **tiếng Việt**.
Comment giải thích *tại sao*, không mô tả lại code.

**JavaScript:** ES2022 thuần, không transpile, không framework. Thư viện ngoài
duy nhất là Leaflet 1.9.4. Hàm ngắn, một việc. `$()` / `$$()` thay cho
`getElementById`. Một trình xử lý chung dùng `data-act` thay vì gắn listener rải rác.

**CSS:** biến ở `:root` cho mọi màu, khoảng cách, bo góc, đổ bóng. Không hardcode.
Thang khoảng cách 4px `--s1`…`--s8`. Đặt tên BEM rút gọn. Trạng thái dùng `data-*`.

**Nguyên tắc:** lỗi mạng hay dữ liệu hỏng không được làm chết ứng dụng — luôn có
nhánh xử lý và thông báo tiếng Việt dễ hiểu.

---

## 8 · Bẫy đã gặp, đừng lặp lại

**Overpass trả HTTP 200 kèm mảng rỗng** khi truy vấn quá nặng, chỉ báo trong
trường `remark`. Đã ghi đè dữ liệu tốt bằng file rỗng mà không ai biết. Lớp gọi
Overpass giờ có ngưỡng số phần tử tối thiểu — **đừng bỏ**.

**`out geom tags` trên relation làm Overpass bỏ hẳn mảng `members`.** Dùng
`out geom` (đã kèm tags sẵn).

**Bộ lọc `area` phải khai báo thành biến** (`area[...]->.hcm;`) rồi mới dùng.
Viết lồng trong ngoặc thì trả rỗng mà không báo lỗi.

**`mảng.length && el(...)` in ra chữ "0"** khi mảng rỗng. Luôn viết
`mảng.length > 0 &&`.

**Vẽ lại cả bảng sau mỗi lần bấm làm nút cũ thành nút mồ côi.** Chỉ cập nhật
đúng phần tử vừa đổi.

**`grid-template` rút gọn xoá luôn `grid-template-areas`** → bản đồ co về 0 chiều
cao, hỏng chế độ gửi khách. v2 không dùng lưới cho bố cục chính (QĐ-9).

**`requestAnimationFrame` bị treo khi thẻ ẩn** → màn hình chờ không bao giờ tắt.
Không dùng rAF cho logic khởi động.

**Ô nhập toạ độ để `type="number"`** → dán chuỗi "10.98, 106.65" bị xoá trắng.
Phải `type="text"` kèm `inputmode="decimal"`.

**Đo khoảng cách tới polyline phải đo tới CẠNH, không phải tới ĐỈNH.** Đo sai
cho kết quả lệch 4,4 km ở nơi thực tế vài chục mét.

**Ba bẫy dữ liệu OSM về đường sắt** (đường đôi thành hai way, khúc gập ngược còn
sót, ga trung chuyển bị gán độc quyền) — đã xử lý trong `build-geo.mjs`, đừng bỏ
các bước `singleTrack()`, `unfold()`, gán ga theo ngưỡng 80 m.

---

## 9 · Về Hoàng

Xưng hô **"fen/tui"**. Thích câu trả lời thẳng, không vòng vo, không tâng bốc.
**Kiểm tra kỹ và bắt lỗi rất nhanh.** Khi bị chỉ ra sai thì phải thừa nhận thẳng,
đo bằng số liệu cụ thể, rồi sửa tận gốc chứ không vá.

Giọng văn: xem `anti-ai-writing-style.md` cùng thư mục cha.

Claude **không được** nhập mật khẩu, token hay tạo tài khoản thay Hoàng.

---

## 10 · Tham chiếu nhanh

| Thứ | Giá trị |
|---|---|
| Chạy trên máy | `node tools/serve.mjs` → http://localhost:5173 |
| Dựng lại dữ liệu nền | `node tools/build-data.mjs` |
| Dựng tiện ích quanh dự án | `node tools/build-around.mjs [id-du-an]` |
| Repo | https://github.com/nhhoang220204-beep/ban-do-metro-tphcm |
| Nhánh | `main` |
| Xác thực | Git Credential Manager (đã lưu) · `gh` CLI **chưa** đăng nhập |
| Mốc kiểm tra metro | tuyến 1 = 19,6 km / 14 ga · 4 khúc gấp · 0 ga lệch |
| Địa giới TP.HCM | relation OSM `1973756` · 168 phường/xã |
| Định tuyến đi xe | router.project-osrm.org |
| Định tuyến đi bộ | routing.openstreetmap.de/routed-foot |

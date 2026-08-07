# DEVELOPER GUIDE — Tiêu chuẩn bắt buộc

> **Đây là tiêu chuẩn bắt buộc cho MỌI lần sửa code trong dự án
> "Bản đồ tư vấn bất động sản TP.HCM". Không được phép vi phạm.**
>
> File này là bản RÚT GỌN THÀNH QUY TẮC THI HÀNH — mỗi mục nêu đúng "phải
> làm gì / không được làm gì", có dẫn ví dụ thật từ code. Bối cảnh đầy đủ
> (vì sao quy tắc tồn tại, số liệu đo được, lịch sử bug) nằm trong bộ
> [docs/](.) 15 file (`01_PROJECT_OVERVIEW.md` … `15_ABOUT_PROJECT.md`) —
> khi một quy tắc ở đây có link, đó là nơi tra cứu sâu hơn, không phải quy
> tắc tuỳ chọn.
>
> Trước khi sửa code: đọc mục liên quan ở đây. Trước khi báo "xong việc":
> chạy qua checklist tương ứng ở cuối file.

---

## 1 · Coding Style

- **Vanilla JavaScript ES2022 thuần** — không framework (React/Vue/Svelte…),
  không transpile (Babel/TypeScript), không build step (Webpack/Vite…),
  không thư viện tiện ích ngoài **Leaflet 1.9.4** (không lodash, không
  jQuery, không axios…). Vi phạm mục này là vi phạm nghiêm trọng nhất — kéo
  theo phải đổi toàn bộ cách deploy (hiện chỉ là commit + push file tĩnh).
- **Thụt lề 2 space**, không tab. Dấu chấm phẩy `;` bắt buộc cuối statement.
  Chuỗi dùng nháy đơn `'...'` trừ khi chuỗi chứa nháy đơn thì dùng nháy kép.
- **Hàm ngắn, một việc.** Nếu một hàm vừa lấy dữ liệu vừa validate vừa vẽ
  DOM, tách thành 3 hàm nhỏ theo đúng ranh giới core/features (xem mục 3).
- **Comment giải thích TẠI SAO, không mô tả lại code.** Tên hàm/biến tiếng
  Việt rõ nghĩa đã tự nói code làm gì; comment chỉ cần thiết khi có quyết
  định không hiển nhiên, một bug đã từng xảy ra, hoặc một ràng buộc nghiệp
  vụ ẩn. Comment "mô tả lại" (`// tăng i lên 1`) bị coi là code smell, xoá
  khi gặp.
- **Toàn bộ code, biến, comment, chuỗi UI bằng tiếng Việt có dấu đầy đủ**
  (tên hàm/biến có thể không dấu vì lý do lịch sử encoding, nhưng bắt buộc
  RÕ NGHĨA tiếng Việt — không đặt tên tiếng Anh generic như `handleClick`,
  `data`, `item`).
- **Không giữ code "chỉ để chạy được".** Không dead code, không comment-out
  code cũ để đó, không TODO không có ngày/người phụ trách.
- **Không dùng `requestAnimationFrame` cho logic khởi động** — trình duyệt
  tạm dừng rAF khi tab ẩn, từng làm màn hình chờ (boot) không bao giờ tắt
  ([13_BUG_TRACKER.md § BUG-11](13_BUG_TRACKER.md)).
- Chi tiết đầy đủ: [03_CODING_RULES.md](03_CODING_RULES.md).

## 2 · Naming Convention

| Đối tượng | Quy ước | Ví dụ thật |
|---|---|---|
| Hàm/biến JS | camelCase tiếng Việt không dấu, rõ nghĩa | `chamDiem`, `veLaiSidebar`, `docToaDo`, `khoiTaoBanDo` |
| Hằng số module-level | UPPER_SNAKE tiếng Việt không dấu | `TOI_DA_SO_SANH`, `GIOI_HAN`, `TRAN_GHIM`, `NGUONG_TRUNG_MARKER_M` |
| File JS | kebab-case tiếng Việt không dấu | `gis-editor.js`, `project-editor.js`, `dev-mode.js` |
| Class CSS | BEM rút gọn: `block__element`, `block--modifier`, block là tiếng Việt viết tắt 2-6 ký tự | `.pcard__ten`, `.sb__scorebar`, `.badge--warn` |
| Custom property CSS động theo instance | `--tien-to-nghia`, set qua `element.style.setProperty()` | `--pin-bg`, `--st-color`, `--vd-mau` |
| Field JSON | camelCase tiếng Việt không dấu | `toaDo`, `chuDauTu`, `xacMinh`, `nguonToaDo` |
| Sự kiện (topic) event bus | kebab-case tiếng Việt không dấu, kết thúc bằng `-doi` khi báo "đã đổi" | `chon-doi`, `sua-du-an-doi`, `bien-tap-doi`, `du-an-luu-xong` |
| `data-act` (event delegation) | kebab-case tiếng Việt không dấu, là ĐỘNG TỪ | `data-act="bat-dau-sua"`, `data-act="luu-sua"`, `data-act="xoa-du-an"` |
| Mã QĐ/BR/BUG/MT (tài liệu) | tiền tố + số thứ tự | `QĐ-20`, `BR-9`, `BUG-07`, `MT-01` |

**Cấm**: đặt tên tiếng Anh generic (`data`, `item`, `handler`, `utils`),
viết tắt khó đoán không có trong bảng trên, đặt tên hàm không phải động từ
cho hàm có side-effect (`ten()` sai, phải là `layTen()`/`veTen()` tuỳ ngữ
cảnh).

## 3 · Folder Convention

Cấu trúc đầy đủ: [04_FOLDER_STRUCTURE.md](04_FOLDER_STRUCTURE.md). Quy tắc
đặt file mới:

```
js/core/      ← chỉ thứ KHÔNG phụ thuộc Leaflet, KHÔNG phụ thuộc map/ hay features/
js/map/       ← chỉ thứ DÙNG Leaflet global L, chỉ phụ thuộc core/
js/features/  ← một tính năng UI cụ thể, phụ thuộc cả core/ và map/
data/         ← CHỈ dữ liệu, sinh bởi tools/ — trừ projects/index.json và
                 projects/chi-tiet/*.json (2 file được thiết kế sửa tay/qua GIS editor)
tools/        ← script .mjs dựng/kiểm tra dữ liệu, chạy bằng `node`, không import js/
docs/         ← tài liệu bộ nhớ dự án (file này thuộc đây)
```

**Quy tắc đặt hàm dùng chung**: nếu 2 module trong `features/` cùng cần 1
hàm và đặt nó vào 1 trong 2 sẽ tạo phụ thuộc vòng, hàm đó PHẢI chuyển vào
`core/` (ví dụ `loc.js` — logic lọc UI nhưng đặt ở `core/` vì cả `panel.js`
và `projects.js` đều cần). Không tự tạo thư mục mới (`js/utils/`, `js/lib/`…)
ngoài 3 thư mục trên trừ khi được xác nhận trước.

## 4 · Animation Rules

- Toàn bộ thời gian transition dùng token trong `tokens.css`, KHÔNG
  hardcode `ms`/`s`:
  ```
  --ease: cubic-bezier(.22, .61, .36, 1);
  --t-fast: .14s var(--ease);   /* hover, nút bấm */
  --t-mid:  .24s var(--ease);   /* panel mở/đóng */
  --t-slow: .36s var(--ease);   /* sidebar trượt full-height */
  ```
- Panel/sidebar ẩn hiện bằng `opacity` + `transform`, KHÔNG `display:none`
  trực tiếp (mất khả năng animate) — dùng `[hidden] { display:flex !important; ...}`
  để ghi đè hành vi mặc định của attribute `hidden`.
- Animation CSS (nét chạy, nhấp nháy) chỉ ăn trên **SVG renderer**, không ăn
  trên canvas — lớp/đoạn cần hiệu ứng chuyển động (vành đai đang thi công,
  ga tạm nhấp nháy) phải vẽ trên `L.svg()`, phần dữ liệu tĩnh còn lại vẫn
  dùng canvas cho nhẹ.
- **Luôn tôn trọng `@media (prefers-reduced-motion: reduce)`** — mọi
  animation mới phải tắt được qua rule này (`animation-duration: .01ms !important`
  đã áp dụng toàn cục trong `base.css`, animation riêng như `.vd-thicong`
  phải khai `animation: none` trong cùng media query nếu không tự tắt theo
  rule chung).
- **Dữ liệu chưa xác minh PHẢI có animation/dấu hiệu trực quan riêng** (nhấp
  nháy cho ga tạm, viền nét đứt cho ghim thủ công) — không bao giờ để trông
  giống dữ liệu đã kiểm (xem mục Color Rules).
- Chi tiết: [06_UI_UX_RULES.md § 8](06_UI_UX_RULES.md).

## 5 · Color Rules

- **Mọi màu PHẢI qua token trong `css/tokens.css`, không hardcode hex/rgb.**
  Bảng đầy đủ giá trị light/dark: [06_UI_UX_RULES.md § 1](06_UI_UX_RULES.md).
- **Màu động theo instance** (marker dự án theo loại hình/trạng thái, ga
  theo tuyến, đoạn vành đai theo trạng thái, logo dự án) truyền qua **CSS
  custom property cục bộ có fallback**:
  ```css
  background: var(--pin-bg, var(--c-brand));
  ```
  ```js
  el.style.setProperty('--pin-bg', mau);
  ```
  **KHÔNG tạo class màu riêng** (`.pin--do`, `.badge-xanh`...) cho từng biến
  thể màu động.
- **Semantic màu cố định, không đảo nghĩa**: `--c-ok` (xanh) = tích cực/hoàn
  thành, `--c-warn` (vàng/cam) = cảnh báo/đang xử lý, `--c-bad` (đỏ) = lỗi/
  chưa có, `--c-info` (xanh dương nhạt) = thông tin trung tính. Trạng thái
  Vành đai dùng ĐÚNG 4 màu cố định theo BR-9: xanh lá=hoàn thành, cam=đang
  thi công, vàng=chuẩn bị, đỏ=quy hoạch — không được đảo hay thêm màu khác
  cho cùng ý nghĩa ở nơi khác trong app.
- `color-mix()` khi cần pha màu theo token động (đổi theo theme);
  `rgba()` cứng chỉ cho overlay/màu KHÔNG đổi theo theme.
- Dark mode: chỉ override `--c-*` và `--sh*` trong `:root[data-theme="dark"]`
  — không tạo token màu riêng "chỉ có ở dark".

## 6 · Typography

```
--ff: 'Segoe UI', system-ui, -apple-system, 'Noto Sans', Roboto, Arial, sans-serif;
--fz0: 11px  --fz1: 12px  --fz2: 13px  --fz3: 14px (mặc định body)
--fz4: 16px  --fz5: 19px  --fz6: 23px  --fz7: 30px (chỉ dùng cho số điểm "hero" ở Chế độ gửi khách)
```

- Không hardcode `font-size` bằng số — luôn dùng `--fz*`.
- Số liệu tabular (giá, khoảng cách, điểm số) dùng `font-variant-numeric: tabular-nums`
  (class `.tnum`) để cột số thẳng hàng khi đổi.
- Tiêu đề/nhãn KHÔNG viết hoa toàn bộ chữ kiểu Anh — chỉ viết hoa chữ đầu
  câu, tiếng Việt tự nhiên.
- Kích thước font tăng dần theo mức độ quan trọng của ngữ cảnh hiển thị:
  sidebar hồ sơ (`--fz3`) < popup bản đồ < thẻ "hero" Chế độ gửi khách
  (`--fz7`, vì đây là bản tóm tắt dùng để chụp gửi khách, cần đọc to rõ).

## 7 · Component Rules

- **Một trình xử lý sự kiện chung dùng `data-act`** (`delegate()` trong
  `core/dom.js`), KHÔNG gắn `addEventListener` rải rác từng phần tử:
  ```js
  delegate($('.topbar'), 'click', { 'panel': btn => batTatPanel(btn) });
  ```
- **Trạng thái động LUÔN qua `data-*`/`aria-*` attribute, KHÔNG qua class**
  (`.is-active`, `.is-open` bị cấm tuyệt đối). Bảng pattern đầy đủ:
  [06_UI_UX_RULES.md § 3](06_UI_UX_RULES.md).
- **Vẽ lại UI thì CHỈ cập nhật đúng phần tử vừa đổi** — `setAttribute()`,
  đổi `textContent`, toggle `aria-*`. **TUYỆT ĐỐI KHÔNG vẽ lại cả khối cha**
  bằng `fill()`/`innerHTML =` sau mỗi lần bấm — đã gây bug "nút mồ côi" ở 4
  nơi khác nhau trong lịch sử dự án
  ([13_BUG_TRACKER.md § BUG-07](13_BUG_TRACKER.md)).
- **Bản nháp (form đang sửa) tách khỏi dữ liệu đã lưu.** Component vẽ đối
  tượng đang sửa (marker, form) phải đọc từ bản nháp (biến module-scope
  riêng), không phải `state` đã commit — nếu không, mọi lần state đổi do sự
  kiện khác sẽ làm giá trị đang sửa "bật ngược" về cũ
  ([13_BUG_TRACKER.md § BUG-03](13_BUG_TRACKER.md)).
- **Ô nhập toạ độ luôn `type="text"` kèm `inputmode="decimal"`** — không
  bao giờ `type="number"` (xoá trắng chuỗi dán từ Google Maps).
- **Component icon bản đồ dùng `L.divIcon` tuỳ biến**, không dùng marker
  mặc định Leaflet ở bất cứ đâu — để đổi màu/nhãn theo token và hỗ trợ dark
  mode.
- **Xác nhận hành động phá huỷ (xoá) PHẢI dùng cơ chế tự viết** (bấm 2 lần
  trong khung thời gian, ví dụ 4 giây), KHÔNG dùng `confirm()` mặc định
  trình duyệt — không khớp phong cách giao diện tự dựng của app.
- Chi tiết component pattern lặp lại (button/card/badge/toast…):
  [06_UI_UX_RULES.md § 7](06_UI_UX_RULES.md).

## 8 · JSON Rules

- **Không có dữ liệu nào nằm trong mã nguồn JavaScript.** Mọi số liệu đọc
  từ `data/*.json` lúc chạy qua `fetch()`.
- **Không sửa tay bất kỳ file nào trong `data/` TRỪ** `data/projects/index.json`
  và `data/projects/chi-tiet/*.json`. Mọi file khác sinh từ `tools/`, sửa
  tay sẽ bị ghi đè ở lần chạy tool kế tiếp mà không ai biết vì sao dữ liệu
  "tự đổi".
- **`tools/cache/geo-verified.json` PHẢI theo git**, dù nằm trong thư mục
  `cache/` thường bị gitignore — đây là nguồn sự thật hình học metro đã
  kiểm định.
- **Schema field bắt buộc tuân theo bảng đã ghi ở [05_DATABASE_STRUCTURE.md](05_DATABASE_STRUCTURE.md)**
  — thêm field mới vào `index.json`/`chi-tiet/<id>.json` phải cập nhật lại
  file đó ngay, không để tài liệu và dữ liệu thật lệch nhau.
- **Toạ độ**: format `[lat, lng]` (EPSG:4326), làm tròn 5 chữ số thập phân
  (≈1m). File `.geojson` đảo thành `[lng, lat]` theo chuẩn GeoJSON — chú ý
  khi đọc/ghi loại file này.
- **Field thiếu dữ liệu**: theo đúng quy ước null/rỗng đã có trong schema
  (đa số string dùng `""`, số dùng `null`) — không tự đổi quy ước giữa các
  field cùng ý nghĩa.
- **`build-projects.mjs` không bao giờ ghi đè bản ghi `nguon:"thu-cong"`
  đã có** trong `index.json`, kể cả khi chạy `--reset-osm`.
- Mỗi công cụ ghi file trong `tools/` phải **idempotent** khi sinh dữ liệu
  tạm (ga tạm, đoạn vành đai tạm) — xoá bản ghi cũ do chính nó sinh ra
  (nhận diện qua cờ `tamThoi`/`trangThai:"tam-so-hoa"`) trước khi sinh lại,
  không đụng dữ liệu đã xác minh.
- Chi tiết pipeline + bẫy Overpass: [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md).

## 9 · Performance Rules

- **Vector nền (đường/vùng/sông) luôn vẽ trên canvas** (`preferCanvas:true`,
  `L.canvas({padding:0.4})` dùng chung) — SVG chỉ dùng cho phần cần CSS
  animation (đoạn đang thi công). Lý do: >120 tuyến đường + 278 ranh KCN +
  hàng trăm đoạn sông, SVG tạo 1 DOM node/đoạn sẽ giật khi kéo bản đồ.
- **Lớp điểm mật độ dày (KCN, trường, bệnh viện, TTTM, công viên) PHẢI
  lazy-render theo viewport** — chỉ vẽ trong `map.getBounds()` đã pad, có
  `zoomToiThieu` riêng (không vẽ khi zoom quá xa), trần tối đa
  `TRAN_GHIM = 260` marker/lần vẽ, và dùng cơ chế "dấu vết" (fingerprint
  chuỗi) để bỏ qua render thừa khi bounds nhích nhẹ nhưng tập điểm không
  đổi.
- **Marker dự án phải gom cụm dưới zoom 15** khi >24 dự án trong khung nhìn
  (`ZOOM_TACH_CUM = 15`, trần `TRAN_GHIM = 300` marker riêng lẻ), gom theo
  lưới PIXEL (không phải lưới toạ độ).
- **Danh mục dự án tách 2 tầng bắt buộc**: chỉ mục nhẹ (`index.json`, luôn
  tải) và hồ sơ chi tiết (`chi-tiet/<id>.json`, chỉ tải khi mở đúng dự án,
  có cache `Map`) — không gộp lại "cho đơn giản".
- **Dữ liệu nạp theo 3 tầng ưu tiên**: bắt buộc (metro/stations) → nạp ngay
  (routes/amenities/roads/boundaries/ring_roads) → nạp sau khi bật lớp
  hoặc nạp nền (industrial/schools/hospitals/shopping/parks/water). Không
  tải hết mọi thứ ngay lúc khởi động.
- **Tra cứu tốn kém (phường/xã, slug tìm kiếm) phải có cache**, dùng bbox-
  first trước khi point-in-polygon đầy đủ. Mốc đã đo: tra thẳng 5.000 dự án
  mất >400ms, có cache + bbox-first còn 17ms.
- **Debounce input tìm kiếm/lọc** (đã dùng 160-200ms) — không tính lại toàn
  bộ danh sách mỗi keystroke.
- Chi tiết đầy đủ: [02_ARCHITECTURE.md § Quản lý lớp bản đồ](02_ARCHITECTURE.md).

## 10 · Responsive Rules

Breakpoint chuẩn — KHÔNG tự thêm breakpoint mới ngoài 4 mốc này trừ khi có
lý do rõ ràng và cập nhật lại tài liệu:

| Breakpoint | Hành vi |
|---|---|
| `max-width: 400px` | Ẩn `.brand__name`, `.topbar__sep` |
| `max-width: 640px` | Ẩn `.btn__lbl` (chỉ còn icon) |
| `max-width: 900px` (chính) | `.panel`/`.sidebar`/`.editor` chuyển bottom-sheet trượt từ đáy, `.legend` ẩn hoàn toàn |
| `min-width: 1600px` | Mở rộng `--w-sidebar:480px`, `--w-panel:360px` |

- Test responsive PHẢI kiểm tra thật ở `375×812` (mobile chuẩn) — dùng
  `resize_window`/DevTools, không chỉ đoán bằng cách đọc CSS.
- `@media print` và Chế độ gửi khách (`data-client`) phải ẩn TOÀN BỘ UI điều
  khiển bằng `!important` — bất kỳ panel mới thêm nào cũng phải được thêm
  vào danh sách ẩn ở `client.css`.
- `@media (prefers-reduced-motion: reduce)` phải luôn được tôn trọng (xem
  mục 4).

## 11 · Error Handling

- **Lỗi mạng hay dữ liệu hỏng KHÔNG được làm chết ứng dụng.** Dùng
  `Promise.allSettled` khi tải nhiều lớp song song (1 lớp lỗi không sập lớp
  khác); `try/catch` quanh mọi `fetch`; luôn có nhánh xử lý + thông báo
  tiếng Việt dễ hiểu qua `toast()`.
- **Phân biệt lỗi BẮT BUỘC vs lỗi CHỈ TẮT TÍNH NĂNG**: thiếu `metro`/
  `stations` → dừng hẳn app (throw); thiếu lớp khác → chỉ tắt lớp đó, app
  vẫn chạy.
- **`file://` protocol phải được phát hiện chủ động** ngay đầu
  `napTatCa()`, throw `LoiFileProtocol` với hướng dẫn tiếng Việt cụ thể
  (`npx serve`) — không để ra trang trắng không rõ lý do.
- **Ghi file thất bại (GIS editor / Firestore) phải toast rõ ràng, không
  bao giờ âm thầm mất dữ liệu người dùng vừa nhập.** Nếu 1 trong nhiều thao
  tác ghi thất bại giữa chừng (ví dụ ghi `index.json` xong nhưng ghi
  `chi-tiet/<id>.json` lỗi), phải cân nhắc rủi ro lệch dữ liệu và báo rõ,
  không coi là "thành công một phần".
- **`window.addEventListener('error'/'unhandledrejection')` phải đăng ký
  sớm** (top-level module, không đợi UI bật) để không bỏ sót lỗi xảy ra
  trước khi Developer Mode được mở xem — xem `dev-mode.js`.
- **1 listener lỗi không được kéo sập listener khác** trong event bus —
  `emit()` phải bọc `try/catch` quanh từng lần gọi `fn(payload)`.
- Không dùng `alert()`/`confirm()` mặc định trình duyệt cho bất cứ luồng
  nào — dùng `toast()` và cơ chế xác nhận tự viết (xem mục 7).

## 12 · Git Commit Convention

- **Message tiếng Việt có dấu đầy đủ**, mở đầu bằng ĐỘNG TỪ mô tả loại thay
  đổi: `Thêm`, `Sửa`, `Cập nhật`, `Xoá`, `Đổi tên`. Không dùng tiền tố kiểu
  Conventional Commits (`feat:`, `fix:`) — không phải quy ước của repo này.
- **Dòng đầu ngắn gọn, súc tích** — nêu ĐÃ LÀM GÌ, không nêu "tại sao" dài
  dòng ở dòng đầu (lý do có thể thêm ở dòng sau nếu cần). Ví dụ thật từ
  lịch sử:
  ```
  Thêm nút "Kiểm tra dữ liệu" — dò trùng tên, trùng marker, sai toạ độ, giá bất thường
  Thêm Project Edit Mode: sửa/thêm/xoá dự án + kéo marker, sửa 2 lỗi treo sidebar
  Sửa lỗi phương pháp suy hướng tuyến + ghi nhận mâu thuẫn tuyến 6
  ```
- **Chỉ commit khi được yêu cầu hoặc đã có uỷ quyền rõ ràng cho đợt việc
  đang làm** ("push lên luôn nhé" áp dụng cho phạm vi công việc đang giao,
  không tự suy rộng ra việc khác chưa nhắc tới).
- **Luôn tạo commit MỚI, không amend** commit đã push, trừ khi được yêu cầu
  rõ ràng.
- Email commit dùng địa chỉ ẩn danh đã cấu hình sẵn trong git (repo public)
  — không đổi cấu hình git.
- **Không dùng `--no-verify`/`--no-gpg-sign`** trừ khi được yêu cầu rõ ràng.
- **Kiểm tra `git status` trước khi `add`** — không `git add -A`/`git add .`
  mù quáng, xem lại danh sách file trước khi commit để tránh dính file
  nhạy cảm hoặc file rác (VD dữ liệu test chưa dọn).
- Nếu Claude là tác nhân tạo commit trong phiên làm việc, thêm trailer
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` theo quy ước
  chung của môi trường làm việc.

## 13 · Backup Rules

- **`data/` là dữ liệu gốc, git là lịch sử/backup chính** — mọi thay đổi dữ
  liệu (qua GIS editor hay sửa tay) chỉ thật sự an toàn sau khi đã commit +
  push.
- **`tools/cache/geo-verified.json` là ngoại lệ backup bắt buộc** — nguồn
  sự thật hình học metro, KHÔNG được để rơi vào `.gitignore` chung của
  `tools/cache/`.
- **Khi Firebase hoàn tất** (xem [07_LIVE_MODE.md](07_LIVE_MODE.md)): file
  JSON trong `data/` vẫn PHẢI giữ làm bản sao lưu/lịch sử qua git — Firestore
  không bao giờ được là nguồn dữ liệu DUY NHẤT không có lịch sử/bản sao.
  Cơ chế đồng bộ định kỳ Firestore → file JSON là điều kiện bắt buộc trước
  khi coi Giai đoạn 12 hoàn tất, không phải tính năng "làm sau cũng được".
- **Trước bất kỳ thao tác có thể mất dữ liệu** (`git checkout`/`reset`/
  `clean`, ghi đè file dữ liệu qua tool `tools/`, chạy lại `build-projects.mjs
  --reset-osm`): kiểm tra `git status`, đảm bảo không có thay đổi chưa
  commit bị mất, cân nhắc dùng `--dry`/`--cache` để xem trước khi ghi thật
  nếu tool hỗ trợ.
- **Không xoá file trong `tools/cache/`** trừ khi chắc chắn có thể tải lại
  bằng `--cache` flag của script tương ứng.

## 14 · Refactor Rules

- **Không refactor "cho gọn" nếu không được yêu cầu.** Dự án cố tình giữ
  vanilla JS + cấu trúc hiện tại vì quy mô vừa đủ để 1 người (Hoàng, không
  đọc code) bảo trì gián tiếp qua Claude — thêm abstraction/framework làm
  tăng chi phí hiểu, không giảm.
- **Trước khi "dọn dẹp" code trông lạ/dư thừa: kiểm tra
  [13_BUG_TRACKER.md](13_BUG_TRACKER.md) và comment tại chỗ trước.** Phần
  lớn code "lạ" trong dự án này là fix có chủ đích cho bug thật đã xảy ra
  — xoá đi sẽ bug lại y hệt (ví dụ: đo tới cạnh thay vì đỉnh, xử lý đường
  đôi OSM, chốt idempotent chống đệ quy).
- **Đảo ngược một Quyết định kiến trúc (QĐ-X) phải được xác nhận rõ ràng**
  trước khi làm, và phải cập nhật LẠI TẤT CẢ file `docs/` có nhắc tới quyết
  định đó, không chỉ sửa 1 chỗ.
- **Refactor dữ liệu (đổi schema JSON) bắt buộc cập nhật đồng thời**:
  `05_DATABASE_STRUCTURE.md`, tool sinh dữ liệu liên quan trong `tools/`,
  và mọi nơi trong `js/` đọc field đó — không để 3 nơi lệch nhau.
- **Refactor UI/CSS không được đổi cơ chế trạng thái** (`data-*` → class)
  hay bố cục chính (`position:absolute` → Grid) — xem mục 4/5/7 và
  [13_BUG_TRACKER.md § BUG-08](13_BUG_TRACKER.md).
- Sau refactor: chạy Testing Checklist (mục 15) đầy đủ trước khi báo xong,
  không chỉ test phần vừa sửa.

---

# CHECKLISTS

> Chạy đúng checklist liên quan trước khi báo "xong việc". Bỏ qua checklist
> không phải lựa chọn — nếu một mục không áp dụng, ghi rõ "không áp dụng vì
> …", không im lặng bỏ qua.

## 15 · Testing Checklist

- [ ] Mở app thật trên trình duyệt (không chỉ đọc code) — `node tools/serve.mjs`
      local hoặc link GitHub Pages thật.
- [ ] Không có lỗi trong console (`read_console_messages`/DevTools).
- [ ] Test đúng tính năng vừa sửa theo golden path (luồng dùng bình thường).
- [ ] Test ít nhất 1 edge case liên quan (dữ liệu thiếu, toạ độ ngoài phạm
      vi, mảng rỗng, người dùng bấm liên tiếp nhiều lần).
- [ ] Nếu sửa UI có bấm nhiều lần được (nút, tab, chip) — bấm LIÊN TIẾP ≥3
      lần để dò bug "nút mồ côi" (BUG-07).
- [ ] Nếu sửa luồng đóng/mở (sidebar, panel, modal) — mở/đóng liên tiếp ≥5
      lần để dò đệ quy/rò rỉ listener (BUG-01).
- [ ] Nếu sửa dữ liệu — kiểm tra bằng cách đọc lại file JSON đã ghi, không
      chỉ tin UI hiển thị đúng (UI có thể cache).
- [ ] Responsive: kiểm tra ở `375×812` (mobile) nếu có thay đổi layout.
- [ ] Dark mode: kiểm tra nếu có thay đổi màu/token.
- [ ] Dọn sạch mọi dữ liệu test khỏi `data/projects/` trước khi coi là xong
      (không để lại dự án test trong danh mục thật).

## 16 · UI Checklist

- [ ] Mọi màu/spacing/radius/shadow dùng token, không hardcode.
- [ ] Trạng thái động dùng `data-*`/`aria-*`, không tạo class `.is-*`.
- [ ] Vẽ lại chỉ đúng phần tử đổi, không `fill()`/`innerHTML` cả khối cha.
- [ ] Tên class theo BEM rút gọn đúng chuẩn `block__element`/`block--modifier`.
- [ ] Nút/link có `aria-label` khi chỉ có icon không có text.
- [ ] Layout mới không dùng CSS Grid shorthand cho vùng chính (topbar/panel/
      sidebar/editor/map).
- [ ] Dữ liệu chưa xác minh/tạm hiển thị khác biệt trực quan rõ ràng (viền
      nét đứt/nhấp nháy/badge "Chưa kiểm").
- [ ] Kiểm tra ở cả 2 theme sáng/tối.

## 17 · Map Checklist

- [ ] Không tự sinh/nội suy toạ độ cho bất kỳ đối tượng nào — chỉ từ OSM
      hoặc người dùng tự bấm/dán (QĐ-1, nguyên tắc số một).
- [ ] Vector nền vẽ canvas, chỉ phần cần animation dùng SVG.
- [ ] Lớp điểm mật độ dày có lazy-render theo viewport + `zoomToiThieu`.
- [ ] Marker mới dùng `L.divIcon` tuỳ biến, không marker mặc định Leaflet.
- [ ] Khoảng cách hiển thị cho người dùng là đường thật (OSRM), trừ trường
      hợp đã ghi rõ là đường thẳng (VD mức hưởng lợi vành đai, BR-3).
- [ ] Đo khoảng cách tới polyline dùng `distToShape`/`distToSegment` (tới
      CẠNH), không tự viết lại phép đo tới đỉnh.
- [ ] Gom cụm marker theo lưới pixel, không lưới toạ độ.
- [ ] Marker đang sửa (draggable) đọc vị trí từ bản nháp, không dữ liệu gốc.
- [ ] Test zoom in/out, pan liên tục không giật/rớt marker.

## 18 · Metro Checklist

- [ ] Số hiệu tuyến theo quy hoạch HIỆN HÀNH (1–10), không dùng 3A/3B/4B
      (quy hoạch 2013 đã bị thay thế).
- [ ] Hình học tuyến lấy từ `tools/cache/geo-verified.json` (đã kiểm định),
      không tự vẽ/suy theo mô tả.
- [ ] Nếu chạy lại `build-geo.mjs`: kiểm mốc audit trước khi ghi đè — tuyến
      1 phải ra ~19,6km/14 ga, toàn mạng ~4 khúc gấp >60°, **0 ga lệch khỏi
      tuyến quá 200m**. Có ga lệch → KHÔNG ghi đè, báo trước.
- [ ] Trạng thái tuyến dùng đúng 4 mức: `operating → construction →
      preparing → planned`, không gộp/bỏ mức `preparing`.
- [ ] Ga trung chuyển (nhiều tuyến trong 80m) hiển thị vòng to hơn, không
      bỏ sót.
- [ ] Nếu có mâu thuẫn dữ liệu (giống MT-01): ghi lại cả 2 phía kèm bằng
      chứng trong `mau_thuan_dang_mo`, KHÔNG tự chọn 1 bên khi chưa có
      nguồn chính thức giải quyết.
- [ ] Số liệu công bố (`docStations`/`docKm`) và số liệu đo được
      (`km`/`soGa`) không được gộp lẫn — giữ tách biệt, hiển thị đúng ý
      nghĩa từng loại.

## 19 · Ring Road Checklist

- [ ] Mỗi ĐOẠN mang trạng thái riêng, KHÔNG gán một trạng thái cho cả tuyến
      (BR-9, vi phạm là lỗi nghiêm trọng).
- [ ] Màu cố định theo trạng thái: xanh lá=hoàn thành, cam=đang thi công,
      vàng=chuẩn bị, đỏ=quy hoạch — đọc từ dữ liệu, không hardcode trong JS.
- [ ] Nếu dựng lại từ Overpass: đã xử lý đường đôi bằng `motChieu()` +
      `boKhucGap()` (bẫy đã gây VĐ4 ra 393km thay vì ~207km thật).
- [ ] Khúc hở tự động nối chỉ áp dụng ≤6.000m (`tam-so-hoa`) — khúc hở lớn
      hơn TUYỆT ĐỐI không tự vẽ, báo Hoàng tự xử lý.
- [ ] Đoạn `tam-so-hoa`/`tamThoi` phải khác biệt trực quan rõ (nét chấm)
      với đoạn đã xác minh.
- [ ] Chú thích (`veChuThich`) vẽ theo TRẠNG THÁI, không theo tuyến.
- [ ] Mức hưởng lợi hạ tầng đo tới CẠNH đoạn gần nhất, nhân hệ số theo
      `HE_SO_TRANG_THAI`, có `canhBao` nếu đoạn chưa hoàn thành.
- [ ] Thêm tuyến vành đai mới chỉ sửa mảng `TUYEN` trong
      `build-ring-roads.mjs`, không sửa `vanhdai.js`.

## 20 · Popup Checklist

- [ ] Popup chỉ hiển thị thông tin ra quyết định ngay (tên, vị trí, giá,
      khoảng cách ga, điểm tổng) — chi tiết đầy đủ để trong sidebar, không
      nhồi tất cả vào popup.
- [ ] Badge "Chưa kiểm" hiện khi `nguon === 'osm'`.
- [ ] Badge "Vị trí tự ghim" hiện khi `xacMinh === 'thu-cong'`.
- [ ] AI Score trong popup dùng cùng thang/nhãn với sidebar, không tính lại
      công thức khác.
- [ ] `width: 300px !important` override Leaflet mặc định vẫn giữ nguyên
      trừ khi có lý do đổi và đã test trên mobile.
- [ ] Nút "Xem hồ sơ" (`data-act="mo-ho-so"`) hoạt động đúng qua event
      delegation ở `document`, không gắn listener riêng trên từng popup.
- [ ] Test popup ở dự án CÓ đủ dữ liệu và dự án THIẾU dữ liệu (ứng viên OSM)
      — không được hiện trống trơn không giải thích.

## 21 · Live Mode Checklist

Xem đầy đủ tình trạng thật: [07_LIVE_MODE.md](07_LIVE_MODE.md) — checklist
này áp dụng khi làm tiếp Firebase HOẶC khi kiểm tra hành vi Local vs Live.

- [ ] Đã đọc [07_LIVE_MODE.md](07_LIVE_MODE.md) mục A trước khi động vào
      bất cứ gì liên quan Firebase — đặc biệt phần "không đảo ngược được".
- [ ] Nếu chọn vùng Firestore: xác nhận LẠI bằng cách đọc text hiển thị
      trong ô "Vị trí" (không suy đoán từ hành động đã click) TRƯỚC khi bấm
      "Tạo nên".
- [ ] KHÔNG tự gõ mật khẩu vào Firebase Authentication dù được cho phép
      "cứ tạo luôn" — dừng đúng bước, nhờ Hoàng tự gõ.
- [ ] Email trong Firestore Security Rules khớp ĐÚNG email Hoàng đã chốt
      dùng để đăng nhập — kiểm tra lại mâu thuẫn email ở
      [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md) trước khi đặt Rules.
- [ ] Test cả 2 môi trường: local (`node tools/serve.mjs`, ghi qua
      `/__luu-du-lieu`) VÀ GitHub Pages thật — không chỉ test 1 bên rồi kết
      luận "xong".
- [ ] Sau khi tích hợp Firestore: xác nhận đọc vẫn công khai (không cần
      đăng nhập), ghi vẫn chặn đúng nếu chưa đăng nhập.
- [ ] File JSON trong `data/` vẫn được đồng bộ/cập nhật làm bản sao lưu —
      không để Firestore thành nguồn dữ liệu duy nhất.
- [ ] Chế độ gửi khách (`clientmode.js`) không bị ảnh hưởng bởi thay đổi
      Live Mode — 2 tính năng độc lập, đừng nhầm lẫn khi sửa.

## 22 · AI Checklist

Áp dụng cho AI Score (`score.js`) VÀ cho chính việc Claude tự viết/sửa code
trong dự án này.

**Với AI Score:**
- [ ] Mỗi tiêu chí thiếu đầu vào trả `null`, KHÔNG hạ xuống 5/10 cho đủ
      hình, KHÔNG lấy điểm tiêu chí khác lấp vào.
- [ ] Điểm tổng chỉ tính trên tiêu chí không null, luôn kèm
      `soTieuChi/tongTieuChi`.
- [ ] Mọi hệ số/mốc nội suy mới thêm phải giải thích được cơ sở (không bịa
      số "cho có vẻ hợp lý") — nếu không có cơ sở rõ, không thêm tiêu chí/
      hệ số mới mà không hỏi trước.
- [ ] Giao diện luôn hiện rõ "đây là thang tham khảo do công cụ tính, không
      phải thẩm định giá" ở nơi hiển thị điểm.

**Với việc Claude tự viết code/nội dung trong dự án:**
- [ ] KHÔNG tự suy dữ liệu bản đồ/dự án từ trí nhớ mô hình — mọi số liệu vị
      trí/hướng tuyến/chiều dài phải tra được từ nguồn (OSM/OSRM/input trực
      tiếp của Hoàng). Đây là quy tắc số một, vi phạm là nghiêm trọng nhất
      trong toàn bộ dự án.
- [ ] Khi không chắc, nói thẳng "chưa xác minh" — không đoán dù kết quả
      trông đẹp và hợp lý.
- [ ] Nội dung hướng tới khách hàng cuối (nếu có) tuân theo
      `anti-ai-writing-style.md` (xem
      [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md)) — không sáo rỗng quảng
      cáo, không phủ định song song kiểu AI.
- [ ] Không tự động hoá việc "nghiên cứu dữ liệu dự án" thành tính năng
      chạy trong app (QĐ-16) — đây vẫn là quy trình THỦ CÔNG Claude làm
      theo yêu cầu từng đợt, ghi vào `nguonTheoTruong`/`nghienCuu`.

## 23 · Code Review Checklist

Chạy trước khi coi một thay đổi là "sẵn sàng":

- [ ] Không vi phạm mục 1-14 ở trên (Coding Style → Refactor Rules).
- [ ] Không phá vỡ QĐ-1 đến QĐ-20 (xem `BAN-GIAO-DU-AN-METRO.md` mục 5, hoặc
      tóm tắt ở [02_ARCHITECTURE.md § Quyết định không đảo ngược](02_ARCHITECTURE.md)).
- [ ] Không tái hiện bug đã có mã trong
      [13_BUG_TRACKER.md](13_BUG_TRACKER.md) (đối chiếu nếu thay đổi đụng
      tới vùng code liên quan: sidebar đóng/mở, vẽ marker draggable, đo
      khoảng cách polyline, xử lý đường đôi OSM, vẽ lại UI...).
- [ ] Đã chạy Testing Checklist (mục 15) và checklist chuyên đề phù hợp
      (UI/Map/Metro/Ring Road/Popup/Live Mode/AI — mục 16-22).
- [ ] Nếu đổi schema dữ liệu/quyết định kiến trúc/quy tắc mới: đã cập nhật
      TƯƠNG ỨNG trong `docs/` (không để tài liệu lệch code).
- [ ] Nếu thêm bug fix: đã thêm mục mới vào
      [13_BUG_TRACKER.md](13_BUG_TRACKER.md) với mã `BUG-XX` tiếp theo.
- [ ] Nếu hoàn tất 1 giai đoạn/tính năng: đã thêm mục vào
      [12_CHANGELOG.md](12_CHANGELOG.md) và cập nhật
      [14_SESSION_SUMMARY.md](14_SESSION_SUMMARY.md).
- [ ] Message commit đúng quy ước mục 12, đã kiểm `git status` trước khi
      `add`.
- [ ] Không còn dữ liệu test/tạm sót lại trong `data/projects/`.
- [ ] Đã báo cáo với Hoàng bằng tiếng Việt thẳng, có số liệu kiểm chứng cụ
      thể — không nói "chắc là ổn" khi chưa tự tay kiểm.

---

*Tài liệu này thuộc bộ [docs/](.) — xem [01_PROJECT_OVERVIEW.md](01_PROJECT_OVERVIEW.md)
để biết cách 15 file kia bổ trợ cho tiêu chuẩn ở đây. Cập nhật file này khi
có quy tắc mới được xác nhận — không tự ý nới lỏng bất kỳ mục nào ở trên
khi chưa có xác nhận rõ ràng từ Hoàng.*

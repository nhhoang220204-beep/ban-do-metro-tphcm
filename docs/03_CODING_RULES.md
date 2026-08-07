# 03 · CODING RULES

> Quy tắc viết code bắt buộc tuân theo. Không phải gợi ý — đây là quy ước đã
> chứng minh tránh được bug thật trong lịch sử dự án này. Đọc trước khi viết
> hoặc sửa bất kỳ dòng code nào.

## Ngôn ngữ

Toàn bộ comment, tên biến/hàm nghiệp vụ, chuỗi giao diện bằng **tiếng Việt
không dấu chỉ khi cần** (biến/hàm thường không dấu để tránh lỗi encoding cũ,
nhưng chuỗi hiển thị UI và comment PHẢI có dấu đầy đủ). Comment giải thích
**TẠI SAO**, không mô tả lại code (code đã tự nói nó làm gì qua tên hàm/biến
tiếng Việt rõ nghĩa).

## JavaScript

- ES2022 thuần, không transpile, không framework, không thư viện tiện ích
  ngoài Leaflet (không lodash, không jQuery, không React...).
- Hàm ngắn, một việc. `$()` / `$$()` (từ `core/dom.js`) thay cho
  `getElementById`/`querySelectorAll` trực tiếp.
- **Một trình xử lý sự kiện chung dùng `data-act`** (`delegate()` trong
  `core/dom.js`) thay vì gắn listener rải rác từng phần tử. Ví dụ:
  ```js
  delegate($('.topbar'), 'click', {
    'panel':     btn => batTatPanel(btn),
    'so-sanh':   () => moSoSanh(),
  });
  ```
  Phần tử tương ứng: `<button data-act="panel">`. Thêm nút mới = thêm 1 dòng
  trong bảng `handlers`, không cần `addEventListener` riêng.
- **Trạng thái động qua `data-*`/`aria-*` attribute, không qua class**
  (`.is-active`, `.is-open` KHÔNG được dùng trong toàn bộ codebase). Xem
  danh sách đầy đủ pattern ở [06_UI_UX_RULES.md](06_UI_UX_RULES.md) mục 3.
- **Vẽ lại một phần giao diện thì CHỈ cập nhật đúng phần tử đổi** — không
  dựng lại cả khối cha bằng `fill()`/`innerHTML =`. Vi phạm quy tắc này đã
  gây bug "nút mồ côi" ở 4 nơi khác nhau trong lịch sử dự án (xem
  [13_BUG_TRACKER.md](13_BUG_TRACKER.md)). Cách đúng: `setAttribute`, đổi
  `textContent`, toggle `aria-*`.
- **Module dùng `export`/`import` ESM chuẩn**, không require/CommonJS trong
  `js/` (thư mục `tools/` dùng `.mjs` cũng là ESM).
  - `core/` không import gì từ `map/` hay `features/` (tránh vòng phụ thuộc).
  - `map/` chỉ import từ `core/`.
  - Nếu 2 module `features/` cùng cần 1 hàm, và đặt hàm đó vào 1 trong 2 sẽ
    tạo vòng phụ thuộc → đặt hàm dùng chung vào `core/` (ví dụ `loc.js` đặt
    ở `core/` dù về bản chất là logic UI, vì cả `panel.js` và `projects.js`
    đều cần).
- **Không giữ code chỉ để "chạy được".** Không dùng `requestAnimationFrame`
  cho logic khởi động (trình duyệt tạm dừng rAF khi tab ẩn, từng làm màn
  hình chờ không bao giờ tắt).
- **Lỗi mạng hay dữ liệu hỏng không được làm chết ứng dụng** — luôn có nhánh
  xử lý (`try/catch`, `Promise.allSettled`) và thông báo tiếng Việt dễ hiểu
  qua `toast()`.
- **Số 0 khác `null`/`false`**: `append()` trong `core/dom.js` chỉ bỏ qua
  `null`/`undefined`/`false`, KHÔNG bỏ qua `0` — viết `mảng.length > 0 && el(...)`,
  không viết `mảng.length && el(...)`.
- **Ô nhập toạ độ luôn `type="text"` kèm `inputmode="decimal"`**, không bao
  giờ `type="number"` — dán chuỗi "10.98, 106.65" từ Google Maps bị trình
  duyệt tự xoá trắng vì không phải một số hợp lệ.
- **Cây trạng thái sửa dở (bản nháp) tách khỏi dữ liệu đã lưu** — khi có form
  sửa (project-editor.js), giữ bản nháp trong biến module-scope riêng
  (`nhap`), KHÔNG ghi thẳng vào `state.duAn` cho tới khi người dùng bấm Lưu
  thật. Component vẽ marker/UI của đối tượng đang sửa phải ưu tiên đọc từ
  bản nháp, không phải dữ liệu gốc — nếu không, mọi lần vẽ lại UI (do sự
  kiện khác trigger) sẽ làm giá trị đang sửa "bật ngược" về dữ liệu cũ.

## CSS

- **Biến ở `:root` cho MỌI màu, khoảng cách, bo góc, đổ bóng, font-size,
  z-index, thời gian transition — không hardcode giá trị.** Toàn bộ token
  khai báo trong `css/tokens.css`. Xem bảng đầy đủ giá trị ở
  [06_UI_UX_RULES.md](06_UI_UX_RULES.md) mục 1.
- **Thang khoảng cách bội số 4px**: `--s1`(4px) … `--s8`(48px).
- **Đặt tên BEM rút gọn**: `block__element`, `block--modifier`. Tên block
  bằng tiếng Việt viết tắt không dấu (`sb`, `pcard`, `gacard`, `ck`, `vd`...),
  KHÔNG phải tiếng Anh đầy đủ. Ví dụ đúng: `.pcard__ten`, `.sb__scorebar`,
  `.badge--warn`. Vài chỗ cũ dùng gạch nối đơn thay vì `__` chuẩn (`.vd-doan__ten`)
  — đây là điểm KHÔNG nhất quán lịch sử, code MỚI phải theo đúng chuẩn
  `block__element`/`block--modifier`, không lặp lại kiểu lai.
- **Trạng thái luôn qua `data-*`/`aria-*` attribute**, class chỉ diễn tả cấu
  trúc/hình dạng. Xem danh sách pattern đầy đủ ở
  [06_UI_UX_RULES.md](06_UI_UX_RULES.md).
- **Màu động theo instance** (pin dự án, ga metro, POI, logo, đoạn vành đai)
  truyền qua CSS custom property cục bộ có fallback:
  ```css
  background: var(--pin-bg, var(--c-brand));
  ```
  JS set bằng `element.style.setProperty('--pin-bg', mau)`. KHÔNG tạo class
  màu riêng cho từng loại (`.pin--do`, `.pin--xanh`...).
- **TUYỆT ĐỐI không dùng CSS Grid shorthand (`grid-template`) cho bố cục
  chính** (topbar/panel/sidebar/editor/map). Cú pháp rút gọn xoá luôn
  `grid-template-areas`, đã một lần làm ô bản đồ co về 0 chiều cao và hỏng
  hẳn tính năng gửi khách. Bố cục chính dùng `position: absolute` (xem
  `css/layout.css`, QĐ-9 trong `BAN-GIAO-DU-AN-METRO.md`).
- **Dữ liệu chưa xác minh/tạm thời phải luôn khác biệt trực quan** với dữ
  liệu chính thức: viền nét đứt, animation nhấp nháy, icon riêng. Không bao
  giờ để dữ liệu tạm trông giống dữ liệu đã kiểm.
- `color-mix()` dùng khi cần pha màu theo token động (đổi theo theme);
  `rgba()` cứng chỉ dùng cho overlay/màu cố định không đổi theo theme.

## Dữ liệu

- **Không có dữ liệu nào nằm trong mã nguồn JavaScript.** Mọi thứ đọc từ
  `data/*.json` lúc chạy (`fetch()`). Cần đổi số liệu → sửa JSON hoặc chạy
  lại công cụ trong `tools/`, không sửa hằng số trong `.js`.
- Công cụ dựng dữ liệu (`tools/*.mjs`) phải có comment giải thích rõ NGUỒN
  và PHƯƠNG PHÁP SUY LUẬN nếu có bất kỳ phép suy diễn nào (nội suy, thuật
  toán đo đạc...) — người đọc sau phải biết ngay số liệu này "chắc" tới đâu.
- Xem quy tắc chi tiết về nguồn dữ liệu, mức tin cậy, cách tránh bẫy Overpass
  API ở [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md).

## Nguyên tắc chung khi mở rộng tính năng

- Kiến trúc phải tính trước cho việc **mở rộng dữ liệu chỉ bằng cách sửa
  file JSON hoặc mảng cấu hình trong `tools/`**, không cần sửa logic hiển
  thị. Ví dụ: thêm loại hình dự án mới = sửa `manifest.json`, không sửa
  `icons.js`; thêm tuyến Vành đai mới = thêm 1 mục vào mảng `TUYEN` trong
  `build-ring-roads.mjs`, không sửa `vanhdai.js`.
- Trước khi "tối ưu" hay "dọn dẹp" một đoạn code có vẻ lạ/dư thừa — kiểm tra
  [13_BUG_TRACKER.md](13_BUG_TRACKER.md) và comment tại chỗ trước. Rất nhiều
  đoạn code "lạ" trong dự án này là fix có chủ đích cho bug thật đã từng xảy
  ra, không phải sơ suất.
- Không thêm abstraction/framework "cho gọn" — dự án cố tình giữ vanilla vì
  quy mô vừa đủ để 1 người bảo trì đọc hiểu trực tiếp không qua build step.

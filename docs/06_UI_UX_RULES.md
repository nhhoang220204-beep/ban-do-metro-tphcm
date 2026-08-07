# 06 · UI/UX RULES

> Hệ thống thiết kế đầy đủ, giá trị thật trích từ `css/*.css`. Đọc trước khi
> thêm/sửa bất kỳ style hay component UI nào.

## 1 · Design tokens (`css/tokens.css`)

Comment đầu file: *"Mọi màu, khoảng cách, bo góc, đổ bóng khai báo một lần ở
đây. Không hardcode giá trị trong các file khác."* — quy tắc bắt buộc.

### Màu nền (light / dark)
| Token | Light | Dark |
|---|---|---|
| `--c-bg` | `#f1f5f9` | `#0b1220` |
| `--c-surface` | `#ffffff` | `#131c2e` |
| `--c-surface-2` | `#f8fafc` | `#18233a` |
| `--c-surface-3` | `#eef2f7` | `#1f2c47` |
| `--c-border` | `#dbe2ea` | `#27354f` |
| `--c-border-strong` | `#c3cede` | `#3a4a6a` |

### Chữ
| Token | Light | Dark |
|---|---|---|
| `--c-text` | `#0f172a` | `#e8eefb` |
| `--c-text-2` | `#475569` | `#a9b6cd` |
| `--c-text-3` | `#7c8ca3` | `#7b8aa5` |
| `--c-text-inv` | `#ffffff` | *(không đổi)* |

### Thương hiệu & ngữ nghĩa
| Token | Light | Dark |
|---|---|---|
| `--c-brand` | `#1d4ed8` | `#5b8def` |
| `--c-brand-dark` | `#1e3a8a` | `#93b4f7` |
| `--c-brand-soft` | `#e6edfd` | `#1b2a4a` |
| `--c-accent` (điểm nhấn AI Score) | `#b45309` | `#f0b429` |
| `--c-accent-soft` | `#fef3c7` | `#3a2e10` |
| `--c-ok` / `--c-ok-soft` | `#15803d` / `#dcfce7` | `#4ade80` / `#12301f` |
| `--c-warn` / `--c-warn-soft` | `#b45309` / `#fef3c7` | `#fbbf24` / `#33270a` |
| `--c-bad` / `--c-bad-soft` | `#b91c1c` / `#fee2e2` | `#f87171` / `#3a1616` |
| `--c-info` / `--c-info-soft` | `#0369a1` / `#e0f2fe` | `#38bdf8` / `#0b2b3d` |

`--c-warn` và `--c-accent` dùng CÙNG giá trị ở light theme — có chủ đích
("điểm nhấn AI" mang tính cảnh báo/nổi bật).

### Spacing scale — bội số 4px
```
--s1: 4px  --s2: 8px  --s3: 12px --s4: 16px
--s5: 20px --s6: 24px --s7: 32px --s8: 48px
```

### Bo góc / đổ bóng
```
--r1: 6px --r2: 10px --r3: 14px --r4: 20px --r-full: 999px

Light:
--sh1: 0 1px 2px rgba(15,23,42,.06)
--sh2: 0 2px 8px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.04)
--sh3: 0 8px 24px rgba(15,23,42,.12), 0 2px 6px rgba(15,23,42,.06)
--sh4: 0 20px 48px rgba(15,23,42,.18), 0 4px 12px rgba(15,23,42,.08)

Dark (đậm hơn, không lớp thứ 2):
--sh1: 0 1px 2px rgba(0,0,0,.4)
--sh2: 0 2px 8px rgba(0,0,0,.45)
--sh3: 0 8px 24px rgba(0,0,0,.5)
--sh4: 0 20px 48px rgba(0,0,0,.6)
```

### Font
```
--ff: 'Segoe UI', system-ui, -apple-system, 'Noto Sans', Roboto, Arial, sans-serif;
--fz0: 11px --fz1: 12px --fz2: 13px --fz3: 14px (mặc định body)
--fz4: 16px --fz5: 19px --fz6: 23px --fz7: 30px
```

### Kích thước bố cục
```
--w-sidebar: 420px  (→ 480px khi ≥1600px)
--w-panel:   324px  (→ 360px khi ≥1600px)
--h-topbar:  60px   (→ 52px khi ≤900px)
```

### Chuyển động & z-index
```
--ease: cubic-bezier(.22, .61, .36, 1);
--t-fast: .14s var(--ease);  --t-mid: .24s var(--ease);  --t-slow: .36s var(--ease);

--z-map: 1  --z-mapctl: 500  --z-panel: 900  --z-topbar: 1000
--z-sidebar: 1100  --z-modal: 1200  --z-toast: 1300
```
`.editor` (Chế độ biên tập GIS + Developer Mode) dùng chung `--z-sidebar`
(1100) — không có `--z-editor` riêng, khớp với việc 2 chế độ này "chấp nhận
chồng lên nhau" (xem mục 7).

### `color-scheme`
`light` ở `:root`, `dark` ở `:root[data-theme="dark"]` — giúp scrollbar/UI
control gốc của trình duyệt tự đổi màu theo.

## 2 · Quy ước đặt tên class — BEM rút gọn, block tiếng Việt

`block__element`, `block--modifier`. Tên block viết tắt tiếng Việt không
dấu, RẤT ngắn (2-6 ký tự): `.btn`, `.card`, `.badge`, `.field`, `.panel`,
`.pin`, `.mapctl`, `.pcard` (project card), `.lyr` (layer row), `.cmp`
(compare), `.tbl` (table), `.sb` (sidebar hồ sơ), `.crit` (criterion), `.am`
(amenity), `.gacard` (station card), `.leg` (leg/chặng), `.pt` (phân tích),
`.pop` (popup Leaflet), `.ck` (client-mode card), `.vd` (vành đai), `.res`
(search result), `.seg` (segmented control).

Ví dụ thật: `.pcard__ten`, `.sb__scorebar`, `.gacard__lines`, `.badge--warn`,
`.pcard__diem--trong`.

Ngoại lệ KHÔNG nhất quán lịch sử (biết để không lặp lại ở code mới):
`.vd-cham`, `.vd-card`, `.vd-doan` dùng gạch nối đơn thay vì `__` chuẩn.
Utility class không theo BEM: `.row`, `.row--between`, `.wrap`, `.grow`,
`.muted`, `.tnum`, `.ellipsis`, `.hidden`, `.sr-only`, `.scroll`, `.pending`.

## 3 · Trạng thái: LUÔN qua `data-*`/`aria-*`, KHÔNG qua class

Không có một class `.active`/`.open`/`.selected`/`.is-*` nào trong toàn bộ
codebase. Ví dụ thật:

| Trạng thái | Cách biểu diễn |
|---|---|
| Panel/sidebar ẩn hiện | `[hidden]` (attribute HTML chuẩn) |
| Sidebar đang mở (ảnh hưởng phần tử khác) | `.app[data-sidebar="open"]` |
| Đang ghim thủ công | `.app[data-pinning]` |
| Chế độ gửi khách | `.app[data-client]` |
| Nút bật/tắt | `[aria-pressed="true"]` |
| Tab đang chọn | `[aria-selected="true"]` |
| Dự án đang chọn trên bản đồ | `.pin-wrap[data-active]` |
| Dự án trong bảng so sánh (số thứ tự) | `.pin-wrap[data-compare]` → CSS đọc `content: attr(data-compare)` |
| Ghim xác minh thủ công | `.pin-wrap[data-verify="thu-cong"]` |
| Layer đang tải | `.lyr[data-dang-tai]` |
| Nút bản đồ đang bận | `.mapctl__btn[data-busy]` |
| Toast đang hiện / loại | `.toast[data-show]`, `.toast[data-kind="ok"|"warn"|"bad"]` |
| Cụm ghim theo cấp độ | `.cum[data-cap="0"..."3"]` |
| Boot screen hoàn tất | `.boot[data-done]` |
| Vô hiệu hoá | `[disabled]` (attribute chuẩn) |

**Quy tắc khi viết component mới**: trạng thái động → attribute (dễ query
bằng `el.dataset`/`el.hasAttribute`), style/cấu trúc → class thuần.

## 4 · Bố cục tổng thể (`css/layout.css`)

> *"Bản đồ chiếm trọn khung, mọi bảng điều khiển nổi lên trên — giống cách
> Google Maps làm. Chọn kiểu này thay vì chia lưới vì bản đồ không bao giờ
> phải đổi kích thước khi mở/đóng bảng, nhờ vậy không lặp lại lỗi cũ: bảng
> đóng làm ô bản đồ co về 0 chiều cao trong chế độ gửi khách."*

→ Toàn bộ layout dùng `position: absolute`, **TUYỆT ĐỐI KHÔNG dùng CSS Grid
shorthand** (`grid-template` xoá mất `grid-template-areas`, đã gây bug thật
— xem [13_BUG_TRACKER.md](13_BUG_TRACKER.md)).

- `.app` — `position:relative; height:100dvh; overflow:hidden`.
- `#map` — `position:absolute; inset:0; z-index:1` — luôn full khung.
- `.topbar` — nổi trên cùng, `inset: var(--s3) var(--s3) auto var(--s3)`.
- `.panel` (bảng trái) — góc trên-trái, width `--w-panel`.
- `.sidebar` (hồ sơ dự án) — full chiều cao bên phải, width `--w-sidebar`.
- `.editor` (Chế độ biên tập GIS / Developer Mode) — góc trên-phải, tự dịch
  sang trái khi sidebar mở: `.app[data-sidebar="open"] .editor { right: calc(var(--w-sidebar) + var(--s3)); }`.
  Devmode và GIS editor dùng CHUNG khung `.editor` — nếu mở cùng lúc thì
  chồng lên nhau, **chấp nhận được, có chủ đích**, không cần "sửa".

Ẩn/hiện bằng transform + opacity (không `display:none` trực tiếp):
```css
.panel[hidden] { display:flex !important; opacity:0; visibility:hidden; transform:translateX(-12px) scale(.98); pointer-events:none; }
.sidebar[hidden] { display:flex !important; visibility:hidden; transform:translateX(100%); }
```

## 5 · Responsive — breakpoint cụ thể

| Breakpoint | Thay đổi chính |
|---|---|
| `max-width: 400px` | Ẩn `.brand__name`, `.topbar__sep` |
| `max-width: 640px` | Ẩn `.btn__lbl` (chỉ còn icon trên nút) |
| `max-width: 900px` (chính) | Topbar co lại 48px; `.panel`/`.sidebar`/`.editor` chuyển thành **bottom-sheet trượt lên từ đáy** (`top:auto; bottom:0`, bo góc trên, thêm "tay cầm" `::before`); `.legend` ẩn hoàn toàn; `.mapctl` né sidebar bottom-sheet |
| `min-width: 1600px` | `--w-sidebar:480px; --w-panel:360px` |
| `@media print` | Ẩn toàn bộ UI điều khiển, bản đồ `position:relative; height:130mm` |
| `@media (prefers-reduced-motion: reduce)` | Tắt hầu hết animation/transition |

## 6 · Theme sáng/tối

- Cơ chế: `data-theme="dark"` trên `<html>` (`:root[data-theme="dark"]`
  override token màu + shadow, xem mục 1).
- Dark mode phục vụ cả sở thích người dùng lẫn nhu cầu chụp màn hình buổi tối.
- **Tile bản đồ đổi theo theme bằng CSS filter** (không đổi provider):
  ```css
  .leaflet-tile-pane { filter: saturate(.92) contrast(.96); }
  :root[data-theme="dark"] .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(.92) contrast(.9) saturate(.7); }
  ```
- Ở Chế độ gửi khách (`data-client`), filter ảnh nền LUÔN reset `none` bất kể
  theme — ảnh chụp gửi khách cần rõ nét, ưu tiên khác với làm việc nội bộ.

## 7 · Component patterns lặp lại

| Component | Ghi chú |
|---|---|
| `.btn` | height 36px, modifier `--primary`/`--ghost`/`--sm`/`--icon`; `[aria-pressed="true"]` → nền brand-soft |
| `.card` | khung + shadow `--sh2`, pattern lặp lại ở `.pcard`, `.gacard`, `.vd-card`, `.crit`, `.am`, `.res` |
| `.badge` | pill bo tròn full, 4 biến thể `--ok/--warn/--bad/--info`, modifier `--dot` |
| `.field` | grid 2 cột (nhãn 104px cố định + giá trị co giãn); class `.pending` (in nghiêng, nhạt) khi dữ liệu chưa có |
| `.lyr__sw` (toggle switch) | track 36×20px, thumb dịch bằng transform |
| `.seg`/`.seg__btn` (segmented control) | nút active nổi bật bằng nền + shadow |
| `.chip` | pill viền, active đổi nền solid brand |
| `.toast` | cố định giữa dưới màn hình, 3 biến thể `data-kind` |
| `.pop` (popup Leaflet) | override toàn bộ style mặc định Leaflet để khớp design system |
| `.inp`/`.search__inp` | focus dùng `box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-brand) 16%, transparent)` |
| `.empty` (empty state) | icon lớn mờ, dùng khi danh sách/kết quả rỗng |
| `.gallery` | `grid-template-columns: repeat(auto-fill, minmax(140px,1fr))`, `aspect-ratio: 4/3` |
| Score/rating display | lặp ở `.sb__scorebar`, `.pop__score`, `.ck__score` — sao + số tabular-nums + nhãn phụ, chỉ khác kích thước font |
| Progress bar | lặp ở `.crit__bar`, `.vd-bar`, `.ck__bartrack`, `.boot__bar` — track nền `--c-surface-3`, bo `--r-full` |

## 8 · Bẫy và quy tắc bất thường — bắt buộc đọc trước khi sửa CSS

1. **CẤM dùng CSS Grid shorthand cho layout chính** (`client.css`, ghi rõ
   trong comment): *"⚠ TUYỆT ĐỐI KHÔNG chuyển bố cục này sang CSS Grid với
   cú pháp rút gọn `grid-template`... đã một lần làm ô bản đồ co về 0 chiều
   cao và hỏng hẳn tính năng chụp gửi khách."*
2. **Vành đai đang thi công vẽ bằng SVG riêng, phần còn lại dùng canvas** —
   hiệu ứng CSS (nét chạy) chỉ ăn trên SVG; canvas nhẹ hơn cho phần lớn dữ
   liệu tĩnh.
3. **Ghim/dữ liệu chưa xác minh phải LUÔN khác biệt trực quan** với dữ liệu
   chính thức: `.pin--thucong` viền nét đứt (*"để không ai nhầm là toạ độ đã
   xác minh"*), ga tạm `.station-tam` nhấp nháy liên tục.
4. **Devmode và Editor GIS chấp nhận chồng lấn** khi mở cùng lúc — trade-off
   có chủ đích, không phải thiếu sót.
5. **Nhãn tên dự án luôn hiển thị trên ghim** — *"người tư vấn cần đọc tên
   mà không phải bấm"* (lý do UX gắn với người dùng thật: nhân viên BĐS quét
   nhanh bản đồ).
6. **Ảnh nền bản đồ giảm tương phản khi làm việc nội bộ, giữ nguyên khi gửi
   khách** — hai mục tiêu khác nhau theo ngữ cảnh.
7. **`!important` chỉ dùng ở 3 chỗ có chủ đích**: ghi đè `display:none` mặc
   định của `[hidden]` (để có transition), đảm bảo Chế độ gửi khách luôn
   thắng mọi rule khác, đảm bảo `@media print` luôn sạch. Không thêm
   `!important` ở chỗ khác.
8. **`color-mix()` khi cần pha màu theo token động (đổi theo theme);
   `rgba()` cứng khi màu cố định không theo theme.**
9. **Màu động theo instance qua CSS custom property cục bộ có fallback**
   (`--pin-bg`, `--st-color`, `--poi-color`, `--vd-mau`, `--logo-bg`,
   `--pop-accent`) — JS set bằng `element.style.setProperty(...)`, không tạo
   class màu riêng cho mỗi loại.

## Tóm tắt quy tắc bắt buộc

1. Không hardcode màu/spacing/radius/shadow — luôn dùng token.
2. Trạng thái động → `data-*`/`aria-*`, không tạo class `.is-*`.
3. Layout chính dùng `position: absolute`, không CSS Grid shorthand.
4. Màu động theo instance → CSS custom property cục bộ, không class màu.
5. Dữ liệu tạm/chưa xác minh phải khác biệt trực quan với dữ liệu chính thức.
6. Breakpoint chuẩn: 400/640/900 (chính)/1600px.
7. Dark mode qua `:root[data-theme="dark"]`, chỉ override `--c-*`/`--sh*`.
8. Gửi khách + in ấn ẩn toàn bộ UI điều khiển bằng `!important` có chủ đích.

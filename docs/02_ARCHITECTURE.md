# 02 · ARCHITECTURE

> Kiến trúc kỹ thuật đầy đủ: luồng khởi động, từng module làm gì, cách các
> module giao tiếp, các quyết định KHÔNG được tự ý đảo ngược. Đọc trước khi
> sửa bất kỳ file `.js` nào.

## Tổng quan 1 câu

Vanilla JS ES2022, không framework, kiến trúc module ESM + một event-bus nhỏ
tự viết (`js/core/store.js`), Leaflet 1.9.4 làm engine bản đồ (nạp qua thẻ
`<script>` global, không qua npm), dữ liệu 100% đọc từ file JSON tĩnh lúc
runtime — không có dữ liệu nào hard-code trong JS.

## Sơ đồ thư mục `js/` theo tầng phụ thuộc

```
js/app.js            ← điểm vào duy nhất, nối mọi module
  │
  ├── js/core/        ← KHÔNG phụ thuộc Leaflet, KHÔNG phụ thuộc nhau vòng tròn
  │     dom.js         tiện ích DOM + toast + event delegation
  │     format.js       định dạng số/chữ hiển thị (nguyên tắc: thiếu → "Đang cập nhật")
  │     geo.js          hình học thuần (haversine, điểm-tới-đoạn, điểm-trong-đa-giác)
  │     store.js        state dùng chung + event bus (on/emit/set) + localStorage
  │     data.js         nạp toàn bộ data/*.json, cache, xử lý lỗi file://
  │     loc.js          bộ lọc danh mục dự án (tách khỏi UI để panel.js và projects.js dùng chung)
  │     luu-local.js    gọi tools/serve.mjs để ghi file (Chế độ biên tập GIS)
  │
  ├── js/map/          ← DÙNG Leaflet global `L`, phụ thuộc core/
  │     engine.js        L.map instance, tile layer nền, cụm nút điều khiển, bay-tới camera
  │     icons.js         mọi L.divIcon tuỳ biến (ghim dự án/ga/POI/cụm/logo)
  │     layers.js        sổ đăng ký 14 lớp bản đồ, bật/tắt, lazy-render theo viewport
  │
  └── js/features/     ← DÙNG Leaflet global `L` một phần, phụ thuộc core/ + map/
        projects.js       ghim dự án, gom cụm, chọn dự án, ghim thủ công, so sánh
        popup.js          nội dung popup Leaflet khi bấm ghim dự án
        sidebar.js        hồ sơ dự án 8 tab, form sửa (CRUD)
        project-editor.js CRUD dự án BĐS: sửa/thêm/xoá, validate, ghi file
        score.js          AI Score — 8 tiêu chí, công thức chấm điểm
        analysis.js       tự sinh nhận định mạnh/yếu/rủi ro từ số liệu đo được
        amenities.js      vòng bán kính + ghim tiện ích quanh dự án đang xem
        compare.js        bảng so sánh tối đa 3 dự án
        search.js         tìm kiếm toàn cục (dự án/ga/tiện ích/đường/KCN/phường xã)
        panel.js          bảng trái: danh sách dự án + lớp bản đồ + bộ lọc
        clientmode.js     chế độ gửi khách — ẩn UI, chỉ còn bản đồ + thẻ tóm tắt
        vanhdai.js        lớp Vành đai (vẽ theo đoạn, không theo tuyến) + phân tích hưởng lợi
        gis-editor.js     Chế độ biên tập GIS — sửa ga metro tạm + polyline vành đai
        dodac.js          đo khoảng cách ga metro tại chỗ qua OSRM (dự án chưa tiền tính)
        data-checker.js   "Kiểm tra dữ liệu" — dò 9 loại lỗi, chỉ đọc không sửa
        dev-mode.js       Developer Mode — bắt lỗi JS/Promise chạy nền, xuất báo cáo
```

Nguyên tắc phân tầng: `core/` không được import bất cứ thứ gì từ `map/` hay
`features/`. `map/` chỉ import từ `core/`. `features/` được import từ cả
`core/` và `map/`. Vi phạm thứ tự này tạo phụ thuộc vòng — nếu thấy cần
`import` ngược từ `features/` vào `core/`, đó là dấu hiệu hàm đặt sai chỗ
(ví dụ `loc.js` cố tình đặt ở `core/` dù về bản chất là logic lọc UI, vì cả
`panel.js` và `projects.js` — hai module `features/` khác nhau — đều cần
dùng chung, đặt trong 1 trong 2 file đó sẽ tạo vòng phụ thuộc).

## Luồng khởi động ứng dụng (`js/app.js`)

```
khoiDong() [app.js]
  1. datChuDe(...)                       — áp theme sáng/tối đã lưu trước khi vẽ gì (tránh nháy màu)
  2. await napTatCa()                    [core/data.js]
       a. Kiểm tra location.protocol === 'file:' → throw LoiFileProtocol nếu đúng
       b. SONG SONG (Promise.all):
          - Promise.allSettled tải BAT_BUOC + NAP_NGAY
            = metro, stations (bắt buộc — thiếu thì throw dừng app)
            + routes, amenities, roads, boundaries, ring_roads (nạp ngay, thiếu thì chỉ tắt tính năng)
          - napDanhMucDuAn() — tải manifest.json rồi các file trong manifest.chiMuc (mặc định index.json)
  3. khoiTaoBanDo()                      [map/engine.js] — L.map(...), tile nền, canvasRenderer
  4. dungNutDieuKhien(...)               [map/engine.js] — cụm nút zoom/locate/reset/fullscreen
  5. set({duAn: tronDuAn()}, 'du-an-doi')
  6. khoiTaoLop()                        [map/layers.js] — bật/tắt 14 lớp theo cài đặt đã lưu
  7. khoiTaoDuAn()                       [features/projects.js]
  8. khoiTaoVanhDai()                    [features/vanhdai.js] — khởi tạo riêng, tự quản lý vẽ
  9. khoiTaoLopGaTam()                   [features/gis-editor.js]
  10. khoiTaoSidebar(), khoiTaoPanel(), khoiTaoTimKiem(), khoiTaoSoSanh(),
      khoiTaoGuiKhach(), khoiTaoBienTap(), khoiTaoKiemTra(), khoiTaoDevMode()
  11. noiSuKien()                        [app.js] — gắn TẤT CẢ listener sự kiện toàn cục
  12. baoLopThieu()                      — toast nếu có lớp dữ liệu nạp lỗi
  13. xong()                             — gỡ màn hình chờ boot
  14. napPhanConLai()  (không await)     [core/data.js] — nạp NAP_SAU (industrial/schools/
                                            hospitals/shopping/parks/water) chạy NỀN sau khi UI hiện
```

Điểm quan trọng: `napTatCa()` chạy song song 2 việc (dữ liệu lớp nền + danh
mục dự án) ngay từ đầu, không chờ nhau. `khoiTaoBanDo()` chạy SAU khi
`napTatCa()` xong nên `duLieu.metro`/`duLieu.stations` chắc chắn đã sẵn khi
`khoiTaoLop()` cần vẽ lớp metro/ga.

**Không dùng `requestAnimationFrame` cho logic khởi động** — trình duyệt tạm
dừng rAF khi tab ẩn, từng làm màn hình chờ không bao giờ tắt và che toàn bộ
giao diện. Dùng `setTimeout` hoặc `await` thẳng.

## Event bus (`js/core/store.js`)

Không dùng Redux/pub-sub library — tự viết ~30 dòng:

```js
export const state = { /* toàn bộ trạng thái dùng chung, xem danh sách field dưới */ };
export function on(topic, fn)      // đăng ký nghe 1 topic, trả về hàm huỷ đăng ký
export function emit(topic, payload)  // phát sự kiện; 1 listener lỗi không kéo sập listener khác (try/catch trong vòng lặp)
export function set(patch, topic = 'change')  // Object.assign(state, patch) rồi emit(topic, state)
```

**`state` — toàn bộ field** (xem `store.js` để biết giá trị mặc định):
`duAn, chon, soSanh, tab, banKinh, nhomTienIch, timKiem, loc{...}, lop{},
guiKhach, ghim, locVD{...}, doanVD, bienTap, locHienThi, doanDangSua, suaDuAn,
devMode`.

**Persist ra localStorage** (khác cơ chế, xem `taiCaiDat()`/`luuCaiDat()`
trong `store.js`, key `bds-map-v2`): CHỈ những gì thuộc về máy cụ thể — dự án
tự ghim tay (`ghimTay`), dự án tự thêm (`duAnRieng`), lựa chọn lớp bản đồ
(`lop`), theme sáng/tối. Danh mục gốc luôn đọc lại từ `data/projects/index.json`,
không bao giờ lưu đè lên localStorage.

### Bảng topic đầy đủ — ai phát, ai nghe

| Topic | Phát bởi | Nghe bởi |
|---|---|---|
| `chon-doi` | `projects.js` (chọn/bỏ chọn dự án), `sidebar.js` (đóng), `project-editor.js` (thêm/xoá dự án) | `app.js` (mở/đóng sidebar), `project-editor.js` (huỷ sửa nếu chuyển dự án khác) |
| `sua-du-an-doi` | `project-editor.js` (bắt đầu sửa/huỷ/đổi toạ độ/lưu) | `gis-editor.js`, `projects.js` (đổi marker draggable), `sidebar.js` (vẽ lại form) |
| `bien-tap-doi` | `gis-editor.js` (bật/tắt Chế độ biên tập) | `project-editor.js` (huỷ mọi thao tác dở), `projects.js` (vẽ lại) |
| `doan-sua-doi` | `gis-editor.js`, `vanhdai.js` (click đoạn khi đang biên tập) | `gis-editor.js` (vẽ lại panel sửa polyline) |
| `du-an-doi` | `project-editor.js`, `projects.js` (ghim/xoá ghim thủ công) | `app.js` (vẽ lại ghim + panel), `gis-editor.js` |
| `du-an-luu-xong` | `project-editor.js` (sau khi lưu thành công) | `sidebar.js` (tải lại hồ sơ nếu đang mở đúng dự án vừa lưu — bắt buộc, vì `dayDu` là cache cục bộ không tự cập nhật) |
| `so-sanh-doi` | `projects.js` | `app.js` (vẽ lại bảng so sánh + panel) |
| `loc-doi` | `panel.js` | `app.js` (vẽ lại ghim + cập nhật panel theo bộ lọc) |
| `lop-doi` | `map/layers.js` | `app.js` (vẽ lại chú thích) |
| `map-view`, `map-nen` | `map/engine.js` | (tiêu thụ theo nhu cầu từng module) |
| `luu-that-bai` | `store.js` (`luuCaiDat` lỗi khi localStorage bị chặn) | `app.js` (toast cảnh báo) |
| `ghim-doi`, `gui-khach-doi`, `dev-mode-doi`, `tab-doi`, `ban-kinh-doi`, `nhom-doi`, `loc-vd-doi`, `doan-vd-doi`, `do-dac-xong` | các module tương ứng | không có `on()` nội bộ trong `features/` — hoặc `app.js` tiêu thụ, hoặc module gọi trực tiếp hàm vẽ ngay sau khi đổi state (xem ghi chú dưới) |

**Ghi chú kiến trúc quan trọng:** event bus KHÔNG phải kênh giao tiếp duy
nhất. Nhiều luồng cập nhật UI đi bằng cách gọi thẳng hàm vẽ ngay sau khi đổi
state, không qua `emit`/`on` — ví dụ `panel.js` không tự `on('so-sanh-doi')`
mà dựa vào `app.js` gọi vẽ lại. Khi thêm tính năng mới, cân nhắc: nếu chỉ 1-2
module cần biết về thay đổi, gọi hàm trực tiếp cho rõ ràng; nếu nhiều module
độc lập cần phản ứng, dùng `emit`/`on` để tránh mỗi module phải biết về nhau.

## Quản lý lớp bản đồ (`js/map/layers.js`)

14 lớp khai báo tĩnh trong mảng `LOP`, chia 5 nhóm UI (Giao thông, Bất động
sản, Tiện ích, Tự nhiên, Hành chính). Mỗi lớp: `{id, nhan, icon, nhom, bat,
can, zoomToiThieu?}`.

- **Bật/tắt** qua `datLop(id, bantat)`: lớp thuộc nhóm dữ liệu nặng
  (`NAP_SAU` trong `data.js`) sẽ tải bất đồng bộ lần đầu bật, có toast lỗi +
  tự khoá lớp nếu tải thất bại.
- **Vẽ**: mỗi lớp có 1 `L.layerGroup` dựng 1 lần, tái sử dụng khi toggle
  (không dựng lại DOM mỗi lần bật/tắt). Vùng/đường luôn vẽ trên **canvas**
  (rẻ, mọi zoom — lý do: >120 tuyến đường + 278 ranh KCN + hàng trăm đoạn
  sông, SVG tạo 1 DOM node/đoạn sẽ giật khi kéo bản đồ). Lớp điểm mật độ dày
  (KCN, trường, bệnh viện, TTTM, công viên — hàng nghìn điểm) có thêm
  sub-layer marker **chỉ vẽ trong viewport hiện tại**.
- **Lazy-render cho lớp mật độ dày** (`dangKyTheoKhungNhin`): dưới
  `zoomToiThieu` thì xoá hết marker; ngược lại lọc trong `map.getBounds()`
  đã pad thêm 0.25, cắt tối đa `TRAN_GHIM = 260` marker/lần, và **chỉ dựng
  lại DOM nếu "dấu vết" thay đổi** (chuỗi fingerprint `"${số lượng}|${id đầu}|${id cuối}"`)
  — tránh render lại khi khung nhìn nhích nhẹ nhưng tập điểm không đổi.
- **Lưu trạng thái bật/tắt** vào localStorage (`luuCaiDat({lop: {...}})`),
  khôi phục ở `khoiTaoLop()` lần mở sau.
- Lớp `duan` và `vanhdai` KHÔNG tự vẽ trong `layers.js` (hàm dựng trả `null`)
  — chúng do `features/projects.js` và `features/vanhdai.js` tự quản lý
  riêng, nhưng vẫn nằm trong sổ đăng ký `LOP` để dùng chung cơ chế bật/tắt.

## Quản lý dữ liệu (`js/core/data.js`)

3 tầng ưu tiên tải:
1. `BAT_BUOC = [metro, stations]` — thiếu thì dừng hẳn app.
2. `NAP_NGAY = [routes, amenities, roads, boundaries, ring_roads]` — tải ngay
   song song, thiếu thì chỉ tắt tính năng liên quan.
3. `NAP_SAU = [industrial, schools, hospitals, shopping, parks, water]` — tải
   khi bật lớp tương ứng, hoặc nạp nền dần bằng `napPhanConLai()`.

Danh mục dự án tách 2 tầng riêng: `manifest.json + index.json` (chỉ mục nhẹ
~220 byte/dự án, luôn tải) và `chi-tiet/<id>.json` (hồ sơ đầy đủ, chỉ tải
khi mở đúng dự án đó, cache trong `Map boNhoChiTiet`).

Xử lý lỗi `file://`: `napTatCa()` kiểm tra `location.protocol === 'file:'`
NGAY ĐẦU TIÊN, throw `LoiFileProtocol` với thông báo tiếng Việt hướng dẫn
`npx serve` — vì mở file trực tiếp từ ổ đĩa khiến fetch bị chặn (mỗi file
coi như 1 origin riêng), nếu không xử lý sẽ ra trang trắng không rõ lý do.

Xử lý lỗi từng lớp: dùng `Promise.allSettled` (không phải `Promise.all`) để
1 lớp lỗi không sập cả app.

`tronDuAn()` — gộp dự án từ 3 nguồn: `danhMuc.duAn` (gốc từ file) +
`ghimTay` (localStorage, đè toạ độ) + `duAnRieng` (dự án tự thêm,
localStorage). Ghim tay đè toạ độ gốc **kể cả khi gốc đã có toạ độ từ OSM**
— nguyên tắc: "người đứng tại chỗ biết rõ hơn cơ sở dữ liệu" — nhưng phải
gắn `xacMinh: 'thu-cong'` và giữ `toaDoGoc` để truy vết.

`phuongXa(c)` — tra phường/xã chứa toạ độ, tối ưu bbox-first trước khi chạy
point-in-polygon đầy đủ (đo thật: tra thẳng cho 5.000 dự án mất >400ms, tối
ưu xuống 17ms).

## Kiến trúc AI Score (`js/features/score.js`)

Xem công thức đầy đủ 8 tiêu chí ở [08_MAP_RULES.md](08_MAP_RULES.md) — phần
này chỉ nói nguyên tắc kiến trúc: mỗi tiêu chí là 1 hàm thuần nhận dữ liệu đo
được, trả về `số 0-10` hoặc `null` (không đủ dữ liệu). Điểm tổng = trung bình
có trọng số CHỈ trên các tiêu chí không null. **Không bao giờ hạ xuống 5/10
cho đủ hình, không lấy điểm tiêu chí khác lấp vào tiêu chí thiếu.**

## Quyết định kiến trúc không được tự ý đảo ngược

Danh sách đầy đủ có mã QĐ-1 đến QĐ-20 (lý do lịch sử, bối cảnh quyết định)
nằm trong `BAN-GIAO-DU-AN-METRO.md` mục 5 — file đó KHÔNG bị xoá, vẫn là
nguồn chi tiết nhất khi cần tra cứu bối cảnh. Tóm tắt các quyết định có ảnh
hưởng trực tiếp tới cách viết code:

- **QĐ-1 (quan trọng nhất):** chỉ vẽ dữ liệu xác minh được, không nội suy.
- **QĐ-9:** bố cục dùng vị trí tuyệt đối, KHÔNG dùng CSS Grid shorthand —
  từng gây bug thật (bản đồ co về 0 chiều cao). Xem [06_UI_UX_RULES.md](06_UI_UX_RULES.md).
- **QĐ-11:** danh mục dự án tách chỉ mục/chi tiết — không gộp lại "cho đơn
  giản", sẽ làm chậm tải trang khi danh mục lớn.
- **QĐ-17:** Chế độ biên tập GIS là ngoại lệ có chủ đích của QĐ-1, chỉ áp
  dụng khi bật nút 🛠, không bao giờ áp dụng cho chế độ xem thường.
- **QĐ-20 (đang triển khai):** nới lỏng "không backend" để thêm Firebase —
  xem [07_LIVE_MODE.md](07_LIVE_MODE.md). Đây là ngoại lệ CÓ CHỦ ĐÍCH, không
  áp dụng ngược cho quyết định "không backend" nào khác.

## Bẫy lập trình đã gặp thật — đọc trước khi "tối ưu lại" code cũ

Xem danh sách đầy đủ với mã lỗi ở [13_BUG_TRACKER.md](13_BUG_TRACKER.md).
Ba bẫy hay bị lặp lại nhất trong lịch sử dự án này:

1. **Vẽ lại cả khối cha sau mỗi lần bấm** → nút cũ thành "nút mồ côi" ngoài
   cây DOM, bấm liên tiếp nhiều lần chỉ lần đầu ăn. Xảy ra lặp lại ở BỐN nơi
   khác nhau trong lịch sử dự án. Quy tắc: chỉ cập nhật đúng phần tử vừa đổi.
2. **`mảng.length && el(...)`** in ra chữ "0" khi mảng rỗng vì `append()` chỉ
   bỏ `null`/`false`, không bỏ số `0`. Luôn viết `mảng.length > 0 && …`.
3. **Đo khoảng cách tới ĐỈNH thay vì CẠNH** của polyline → sai hàng km ở nơi
   thực tế chỉ vài chục mét. Luôn dùng `distToShape`/`distToSegment` từ
   `core/geo.js`, không tự viết lại phép đo điểm-tới-polyline.

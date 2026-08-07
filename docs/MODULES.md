# MODULES — Bản đồ module hoá toàn bộ dự án

> Chia toàn bộ source code thành các module độc lập, mỗi module là một đơn
> vị trách nhiệm rõ ràng. Dùng file này để trả lời nhanh: "sửa file X có
> làm hỏng tính năng Y không", "muốn thêm tính năng Z thì đụng vào những
> đâu". Bổ trợ cho [02_ARCHITECTURE.md](02_ARCHITECTURE.md) (luồng chạy) và
> [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) (quy tắc thi hành) — file này trả
> lời câu hỏi "ranh giới trách nhiệm nằm ở đâu", 2 file kia trả lời "chạy
> thế nào" và "phải làm đúng cách nào".

## Cách đọc bảng phụ thuộc

22 module, chia 5 tầng theo hướng phụ thuộc (tầng dưới không được phụ thuộc
tầng trên):

```
Tầng 0 — Nền tảng, không phụ thuộc module nào khác
  Core

Tầng 1 — Hạ tầng bản đồ + dữ liệu, chỉ phụ thuộc Core
  Database · Map · Layer

Tầng 2 — Miền dữ liệu nghiệp vụ, phụ thuộc Core + Database + Map/Layer
  Project · Metro · RingRoad · Routing · Amenities

Tầng 3 — Tính năng UI, phụ thuộc Tầng 0-2 tuỳ nhu cầu
  Popup · Sidebar · Panel · Compare · Search · Analytics · AI ·
  ClientMode · LiveMode · QA

Tầng 4 — Cross-cutting, không phải file riêng mà là QUY ƯỚC áp lên mọi tầng
  UI (design system) · Animation · Performance
```

Vi phạm hướng phụ thuộc này (VD: `Core` import từ `Project`) là dấu hiệu
code đặt sai module — xem [03_CODING_RULES.md](03_CODING_RULES.md).

---

## 1 · Core

**Chức năng**: hạ tầng dùng chung cho toàn app — thao tác DOM, định dạng số/
chữ, hình học thuần, state + event bus, localStorage. Không có logic nghiệp
vụ BĐS/metro/vành đai nào ở đây.

**File liên quan**:
`js/core/dom.js`, `js/core/format.js`, `js/core/geo.js`, `js/core/store.js`

**Dependency**: KHÔNG — đây là tầng 0, không import bất cứ module nào khác
trong dự án, không phụ thuộc Leaflet.

**API chính**:
```
dom.js:    $(sel), $$(sel), el(spec, attrs, children), append(node, children),
           fill(node, children), delegate(root, type, handlers), esc(s),
           toast(message, kind, ms), debounce(fn, ms)
format.js: CHUA_CO, co(v), hoac(v, fallback), so(n), gia(value, donVi),
           km(m), phut(giay), chuyenDi(leg), ngay(iso), slug(s), chuDau(ten)
geo.js:    hav(a,b), distToShape(point,segments), distToSegment(p,a,b),
           GIOI_HAN, hopLe(c), docToaDo(text), bounds(points), trongDaGiac(point,ring)
store.js:  state, on(topic,fn), emit(topic,payload), set(patch,topic),
           taiCaiDat(), luuCaiDat(patch), luuGhim(id,toaDo)
```

**JSON sử dụng**: không đọc file JSON trực tiếp — chỉ đọc/ghi
`localStorage` key `bds-map-v2` (qua `store.js`).

**Những module ảnh hưởng**: **TẤT CẢ** 21 module còn lại — mọi module đều
import từ Core. Đây là module có bán kính ảnh hưởng lớn nhất toàn dự án.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO NHẤT.** Đổi chữ ký hàm (`el()`, `on()`,
`emit()`, `set()`, `hav()`, `distToShape()`...) làm gãy hàng chục nơi gọi
cùng lúc, không có compiler báo lỗi (vanilla JS). Đặc biệt nguy hiểm:
- Đổi `append()` cách xử lý `0`/`null`/`false` → gãy im lặng khắp UI (xem
  BUG-09 ở [13_BUG_TRACKER.md](13_BUG_TRACKER.md)).
- Đổi cấu trúc `state` trong `store.js` → gãy mọi module đọc field đó.
- Đổi `distToShape`/`distToSegment` → sai lệch âm thầm ở AI Score, phân
  tích Vành đai, kiểm tra dữ liệu — các nơi này không tự validate lại kết
  quả hình học.
Trước khi sửa Core: `grep` toàn bộ nơi gọi hàm định sửa, không chỉ sửa theo
1 use-case đang thấy trước mắt.

---

## 2 · Database (Data Layer)

**Chức năng**: nạp toàn bộ `data/*.json` lúc runtime, quản lý cache/lazy-
load 3 tầng ưu tiên, bộ lọc danh mục dự án, cầu nối ghi file cục bộ cho Chế
độ biên tập GIS.

**File liên quan**:
`js/core/data.js`, `js/core/loc.js`, `js/core/luu-local.js`, toàn bộ
`data/*.json`, toàn bộ `tools/*.mjs` (công cụ SINH ra các file JSON này).

**Dependency**: Core (`store.js` cho `taiCaiDat`, `geo.js` cho
`hopLe`/`trongDaGiac`, `format.js` cho `slug`/`co`, `dom.js` cho `toast`).

**API chính**:
```
data.js: duLieu, thieu, chuaNap, LoiFileProtocol, napTatCa(), danhMuc,
         chiTietDuAn(id), quenChiTiet(id), cacLoaiHinh(), cacTrangThai(),
         cacNguon(), tenLoaiHinh(ma), napLop(ten), napPhanConLai(),
         tronDuAn(), tienIchCua(id), docDoDac()/ghiDoDac()/xoaDoDac(),
         gaCua(duAnHoacId), nhomTienIch(), cacBanKinh(), phuongXa(c)
loc.js:  khuVucCua(p), quenKhuVuc(), coLoc(), lot(p), locDuAn(nguon)
luu-local.js: luuFile(loai, noiDung, {id, imMang}), xoaFile(loai, id)
```

**JSON sử dụng**: **TOÀN BỘ** `data/*.json` — đây là module duy nhất chịu
trách nhiệm `fetch()` chúng. Chi tiết schema: [05_DATABASE_STRUCTURE.md](05_DATABASE_STRUCTURE.md).

**Những module ảnh hưởng**: Project, Metro, RingRoad, Routing, Amenities,
Popup, Sidebar, Panel, Compare, Search, Analytics, AI, ClientMode, LiveMode,
QA — mọi module đọc dữ liệu đều qua đây, không module nào tự `fetch()` JSON.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO.**
- Đổi 3 tầng ưu tiên tải (`BAT_BUOC`/`NAP_NGAY`/`NAP_SAU`) sai vị trí một
  lớp → lớp đó tải chậm bất thường hoặc chặn khởi động không cần thiết.
- Sửa `napTatCa()` mà bỏ sót check `location.protocol === 'file:'` → quay
  lại lỗi trang trắng không rõ lý do khi mở file trực tiếp.
- Sửa `tronDuAn()` sai thứ tự merge (gốc/ghimTay/duAnRieng) → mất toạ độ
  ghim tay của Hoàng một cách âm thầm.
- Sửa `phuongXa()` bỏ tối ưu bbox-first → khựng UI thật ở quy mô ~5.000 dự
  án (đã đo: 400ms → 17ms nhờ tối ưu này).
- Chạy nhầm tool trong `tools/` ghi đè `data/*.json` không dùng `--dry`
  trước → mất dữ liệu đã kiểm định (đặc biệt `tools/cache/geo-verified.json`,
  xem [13_BUG_TRACKER.md](13_BUG_TRACKER.md) BUG-05, BUG-06).

---

## 3 · Map (Map Engine)

**Chức năng**: khởi tạo instance Leaflet, quản lý tile layer nền (3 lựa
chọn: đường/sáng/vệ tinh), cụm nút điều khiển bản đồ, camera bay-tới, và
toàn bộ icon `L.divIcon` tuỳ biến dùng trên bản đồ.

**File liên quan**: `js/map/engine.js`, `js/map/icons.js`

**Dependency**: Core (`dom.js`, `store.js`), **Leaflet global `L`** (nạp
qua `<script>` trong `index.html`, không qua import).

**API chính**:
```
engine.js: VIEW_MAC_DINH, map, canvasRenderer, khoiTaoBanDo(), datNen(key),
           danhSachNen(), dungNutDieuKhien(host), veKhungMacDinh(),
           bayToi(c, zoom), veKhungBao(bounds, padding)
icons.js:  ghimDuAn(duAn, opts), ghimGa(ga, mauTuyen), ghimPoi(icon, mau, nho),
           nhanBanKinh(text), logoDuAn(duAn, size), ghimCum(soLuong)
```

**JSON sử dụng**: không đọc trực tiếp — nhận dữ liệu đã nạp sẵn qua tham số
hàm từ module gọi (Project, Layer...). `icons.js` đọc gián tiếp
`cacLoaiHinh()`/`cacTrangThai()` (từ Database) để tra màu/icon theo
`manifest.json`.

**Những module ảnh hưởng**: Layer, Project, Metro, RingRoad, Popup — mọi
thứ vẽ trên bản đồ đều qua `map` instance và `canvasRenderer` từ đây; mọi
marker tuỳ biến đều qua `icons.js`.

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH-CAO.**
- Đổi `canvasRenderer` sang SVG mặc định → giật/lag khi bật nhiều lớp cùng
  lúc (đã đo cần thiết cho >120 tuyến đường + 278 ranh KCN).
- Sửa `bayToi()` bỏ điều kiện offset theo sidebar → marker bị sidebar che
  mất khi mở hồ sơ dự án.
- Đổi cấu trúc trả về của các hàm `ghim*()` trong `icons.js` (thay đổi HTML
  bên trong `L.divIcon`) → gãy CSS đang style theo cấu trúc cũ (`.pin__glyph`,
  `.station--doi`...) — phải đồng bộ với `css/map.css` khi sửa.
- Thêm nền tile mới vào `NEN` → phải kiểm tra license/điều kiện thương mại
  trước (xem [10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md) mục Esri).

---

## 4 · Layer (Layer Registry)

**Chức năng**: sổ đăng ký 14 lớp bản đồ, cơ chế bật/tắt, vẽ theo canvas/SVG,
lazy-render theo viewport cho lớp mật độ dày, lưu trạng thái bật/tắt.

**File liên quan**: `js/map/layers.js`

**Dependency**: Core (`dom.js`, `store.js`), Database (`data.js` — `duLieu`,
`thieu`, `chuaNap`, `napLop`), Map (`engine.js` — `map`, `canvasRenderer`;
`icons.js` — `ghimGa`, `ghimPoi`), Leaflet global `L`.

**API chính**:
```
LOP (mảng 14 khai báo lớp), khoiTaoLop(), datLop(id, bantat), veChuThich(host)
```

**JSON sử dụng**: `metro.json`, `stations.json`, `roads.json`,
`industrial.json`, `schools.json`, `hospitals.json`, `shopping.json`,
`parks.json`, `water.json`, `boundaries.json` (qua `duLieu` từ Database,
không tự fetch).

**Những module ảnh hưởng**: Metro (vẽ tuyến/ga qua đây), Panel (hiện bảng
bật/tắt lớp đọc từ `LOP`), UI/Performance (mọi tối ưu render viewport nằm
ở đây).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH.**
- Thêm lớp mới vào `LOP` mà quên `zoomToiThieu` cho lớp mật độ dày → có thể
  vẽ hàng nghìn marker cùng lúc, treo trình duyệt.
- Sửa cơ chế "dấu vết" (fingerprint) trong `dangKyTheoKhungNhin` sai → render
  thừa liên tục khi kéo bản đồ (mất tối ưu) hoặc ngược lại không cập nhật
  khi cần (marker "đứng yên" sai vị trí).
- Lớp `duan`/`vanhdai` cố tình trả `null` trong `dungLop()` — nếu vô tình
  "hoàn thiện" 2 lớp này trong `layers.js`, sẽ VẼ TRÙNG với những gì Project/
  RingRoad tự vẽ.
- Đổi ngưỡng `TRAN_GHIM = 260` cần cân nhắc lại hiệu năng thật, không chỉ
  đổi theo cảm tính.

---

## 5 · Project

**Chức năng**: vẽ/gom cụm marker dự án BĐS, chọn/bỏ chọn dự án, ghim toạ độ
thủ công, quản lý bảng so sánh (thêm/bớt), và toàn bộ CRUD (sửa/thêm/xoá)
dự án qua Chế độ biên tập GIS.

**File liên quan**: `js/features/projects.js`, `js/features/project-editor.js`

**Dependency**: Core, Database (`data.js`, `luu-local.js`), Map (`engine.js`,
`icons.js`), Leaflet global `L`.

**API chính**:
```
projects.js:       markerCua(id), khoiTaoDuAn(), veLai(), hienLopDuAn(bat),
                    chonDuAn(id,{bay,moPopup}), boChon(), batDauGhim(id),
                    ghimTheoToaDo(id,text), ketThucGhim(), xoaGhim(id),
                    themSoSanh(id), boSoSanh(id), xoaSoSanh(), TOI_DA_SO_SANH
project-editor.js: dangSua(), banNhap(), batDauSua(p), huySua(), datToaDoTam(c),
                    datTruong(key,value), luuSua(), xacNhanXoa(id,onCanXacNhan),
                    themDuAnMoi(), NHAN_LOAI_HINH, NHAN_TRANG_THAI, DS_DON_VI_GIA
```

**JSON sử dụng**: `data/projects/manifest.json` (qua `cacLoaiHinh`), ĐỌC +
GHI `data/projects/index.json` và `data/projects/chi-tiet/<id>.json`.

**Những module ảnh hưởng**: Popup, Sidebar (hiển thị dữ liệu dự án), Panel
(danh sách), Compare, Search (index dữ liệu tìm kiếm), ClientMode, AI/
Analytics (chấm điểm/phân tích dự án đang chọn), QA (dò lỗi dữ liệu dự án).
Có bán kính ảnh hưởng rộng thứ 2 sau Database.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO — module ghi dữ liệu thật.**
- Vi phạm QĐ-1 (tự sinh toạ độ) là lỗi nghiêm trọng nhất có thể xảy ra ở
  module này — mọi toạ độ chỉ từ OSM hoặc người dùng tự đặt.
- `luuSua()` ghi 2 file KHÔNG có transaction/rollback — nếu 1 trong 2 request
  (`projects-index`, `projects-chi-tiet`) thất bại giữa chừng, `index.json`
  và `chi-tiet/<id>.json` có thể LỆCH NHAU. Sửa luồng lưu phải cân nhắc kỹ
  rủi ro này, xem [02_ARCHITECTURE.md](02_ARCHITECTURE.md) mục C.2.
- `xoaDuAn()`: thứ tự gọi `xoaFile` (chi tiết) trước khi kiểm tra kết quả
  `luuFile` (index) — sửa nhầm thứ tự có thể để lại file chi tiết mồ côi
  hoặc xoá nhầm khi index chưa kịp cập nhật.
- Marker đang sửa phải đọc từ bản nháp (`banNhap()`), không phải `state.duAn`
  — sai chỗ này tái hiện BUG-03 (marker bật ngược vị trí cũ).
- Dự án mới (`themDuAnMoi`) chỉ tồn tại tạm trong bộ nhớ tới khi bấm Lưu —
  không có cảnh báo "thay đổi chưa lưu" khi rời trang, cần lưu ý nếu mở
  rộng luồng này.

---

## 6 · Metro

**Chức năng**: vẽ tuyến/ga metro trên bản đồ (qua Layer), dựng và kiểm định
hình học tuyến từ OpenStreetMap, sổ đăng ký 10 tuyến chính thức kèm nguồn/
độ tin cậy, xuất dữ liệu tham chiếu Excel.

**File liên quan**:
Runtime: `js/map/layers.js` (hàm `lopMetro()`, `lopGa()` — không có file
JS riêng cho "Metro", logic vẽ nằm trong Layer).
Build-time: `tools/build-geo.mjs`, `tools/build-metro-doc.mjs`,
`tools/export-metro-csv.mjs`, `tools/probe-huong-tuyen.mjs`.

**Dependency**: Layer (nơi vẽ), Database (`metro.json`/`stations.json` qua
`duLieu`); build-time scripts phụ thuộc `tools/lib/osm.mjs` + Overpass API.

**API chính**: không có API JS runtime riêng (thuộc `layers.js`). Build-time
scripts chạy qua CLI: `node tools/build-geo.mjs [--dry] [--cache]`,
`node tools/build-metro-doc.mjs [tuyenId...] [--cache]`,
`node tools/export-metro-csv.mjs`.

**JSON sử dụng**: `data/metro.json`, `data/stations.json`,
`data/metro/lines.json`, `data/metro/alignment.geojson`, `data/metro/ga.geojson`,
`data/metro/huong-tuyen.json`, `tools/cache/geo-verified.json` (nguồn sự
thật, sinh bởi `build-geo.mjs`, đọc bởi `build-data.mjs` + `build-metro-doc.mjs`).

**Những module ảnh hưởng**: Layer (vẽ), Routing (đo khoảng cách dự án→ga),
AI (tiêu chí Metro trong AI Score), Popup/Sidebar (hiển thị ga gần nhất).

**Rủi ro khi chỉnh sửa**: 🔴 **CAO — dữ liệu sai ảnh hưởng trực tiếp lời tư
vấn khách.**
- Chạy `build-geo.mjs` mà bỏ qua bước audit (mốc: tuyến 1 ~19,6km/14 ga, 0
  ga lệch >200m) trước khi copy kết quả vào `geo-verified.json` → toàn bộ
  hình học metro sai lan ra mọi nơi dùng dữ liệu này.
- Vi phạm bẫy đường đôi (không chạy `singleTrack()`/`unfold()`) → tuyến dài
  gấp đôi thật (đã xảy ra: 33,8km thay vì 19,7km).
- Sửa `LINE_DEFS` (tên way OSM) không khớp tên thật trên OSM → tuyến "mất
  hình học" hoàn toàn mà không có lỗi rõ ràng.
- Đảo ngược cách đánh số tuyến về 3A/3B/4B (quy hoạch 2013 đã bị thay thế)
  — vi phạm QĐ-12.
- Tự sửa `mau_thuan_dang_mo` (MT-01) chọn 1 phía khi chưa có nguồn chính
  thức — vi phạm BR-10/QĐ-14.

---

## 7 · RingRoad (Vành đai)

**Chức năng**: vẽ 3 tuyến Vành đai 2/3/4 theo trạng thái TỪNG ĐOẠN, bảng
thống kê + bộ lọc, phân tích mức hưởng lợi hạ tầng cho 1 dự án, và luồng
sửa polyline trong Chế độ biên tập GIS.

**File liên quan**: `js/features/vanhdai.js`,
`tools/build-ring-roads.mjs`, `tools/estimate-ring-gaps-tam.mjs`,
`tools/probe-vanh-dai.mjs`.

**Dependency**: Core (`geo.js` cho `distToSegment`, `store.js`), Map
(`engine.js` — dùng cả canvas VÀ SVG renderer riêng cho đoạn thi công),
Database.

**API chính**:
```
coDuLieu(), cacTuyenVD(), bangTrangThai(), tatCaDoan(), datLocVD(patch),
batTatLocVD(truong,giaTri), khoiTaoVanhDai(), veLai(), hienLopVanhDai(bat),
toiDoan(id), veBangVanhDai(host), vanhDaiGanNhat(duAn,banKinhM),
danhGiaHuongLoi(duAn)
```

**JSON sử dụng**: ĐỌC + GHI `data/ring_roads.json` (ghi qua luồng biên tập
GIS trong `gis-editor.js`, gọi `luuFile('ring_roads', ...)`).

**Những module ảnh hưởng**: AI (tiêu chí Khả năng tăng giá dùng khoảng cách
vành đai), Sidebar (tab Phân tích hiển thị `danhGiaHuongLoi`), Popup, Panel
(tab Vành đai riêng), LiveMode (luồng sửa polyline thuộc GIS editor).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH-CAO.**
- Vi phạm BR-9 (gán 1 trạng thái cho cả tuyến thay vì từng đoạn) làm sai
  lệch ý nghĩa hiển thị trên toàn bộ bản đồ.
- `danhGiaHuongLoi()` đo khoảng cách ĐƯỜNG THẲNG (không phải đường thật) —
  nếu quên hiển thị `canhBao`/disclaimer khi thay đổi công thức, vi phạm
  BR-3 (dễ nhầm với số liệu "đường thật" ở tab Metro).
- `estimate-ring-gaps-tam.mjs` phải giữ ngưỡng `NGUONG_M = 6000` — nới lỏng
  ngưỡng này đồng nghĩa tự động "bịa" đường dài hơn, vi phạm QĐ-1.
- Sửa hiệu ứng nét chạy (`hieuUng`) mà không kiểm tra vẫn dùng SVG renderer
  riêng → animation không chạy (canvas không nhận CSS animation).

---

## 8 · Routing (Distance / Khoảng cách)

**Chức năng**: đo khoảng cách/thời gian đường THẬT (không phải chim bay)
giữa dự án và ga metro — vừa có bản tiền tính (build-time), vừa đo tại chỗ
trong trình duyệt (runtime) cho dự án chưa được tiền tính.

**File liên quan**: `js/features/dodac.js` (runtime), `tools/build-around.mjs`
(build-time), `tools/lib/route.mjs` (thư viện gọi OSRM dùng chung).

**Dependency**: Core (`geo.js` cho sàng lọc sơ bộ bằng `hav`), Database
(`data.js` — `gaCua`, `docDoDac`/`ghiDoDac`).

**API chính**:
```
dodac.js: dangDoDuAn(id), doGaMetro(duAn) — async, emit('do-dac-xong')
route.mjs (build-time): table(mode, from, to), bothModes(from, to)
```

**JSON sử dụng**: ĐỌC `data/stations.json`; ĐỌC (ưu tiên) `data/routes.json`
(tiền tính); GHI localStorage `bds-map-do-dac` khi đo tại chỗ (không ghi
file server).

**Những module ảnh hưởng**: AI (tiêu chí Metro cần khoảng cách đúng), Popup,
Sidebar (hiển thị "cách ga X km"), Analytics.

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH.**
- Kết quả đo tại chỗ (`do-tai-cho`) phải tự vô hiệu khi toạ độ dự án đổi —
  bỏ check này sẽ hiển thị khoảng cách của VỊ TRÍ CŨ sau khi ghim lại.
- `SO_GA_DO = 6` (sàng sơ bộ) quá nhỏ có thể bỏ sót ga gần nhất thật ở khu
  vực ga dày đặc; quá lớn làm chậm request OSRM (giới hạn 95 điểm/lần gọi).
- Timeout `HET_GIO_MS = 12000` — giảm quá thấp có thể fail giả (OSRM public
  đôi khi chậm), tăng quá cao làm UX chờ lâu vô ích.
- Không tự ý mở rộng sang đo TIỆN ÍCH tại chỗ (đã cố tình loại trừ — 13 truy
  vấn Overpass/dự án quá chậm cho trải nghiệm mở hồ sơ).

---

## 9 · LiveMode

> 📌 Từng có 1 tính năng UI khác cũng tên "Live Mode" (livestream TikTok,
> `js/features/livemode.js` + `css/live.css`, thêm bởi một phiên khác ngày
> 07/08/2026) trùng tên với module dưới đây. Đã bị xoá theo yêu cầu của
> Hoàng cùng ngày (xem [12_CHANGELOG.md](12_CHANGELOG.md), commit
> `ecc68f4`) — 2 file đó không còn tồn tại trong repo. Module "LiveMode"
> dưới đây chỉ còn đúng 1 nghĩa: ghi dữ liệu trực tiếp (local + Firebase).

**Chức năng**: cầu nối ghi dữ liệu — cục bộ qua `tools/serve.mjs` (đang
dùng) và Firestore (đang triển khai dở, xem
[07_LIVE_MODE.md](07_LIVE_MODE.md)) — cộng toàn bộ Chế độ biên tập GIS cho
ga metro tạm và polyline vành đai.

**File liên quan**: `js/core/luu-local.js`, `tools/serve.mjs`,
`js/features/gis-editor.js`, `tools/estimate-stations-tam.mjs`,
`HUONG-DAN-FIREBASE.md` (chưa có code Firebase thật, chỉ có hướng dẫn).

**Dependency**: Core (`dom.js` cho `toast`), Database (`data.js` — thao tác
trên `duLieu.stations`/`duLieu.ring_roads`), Map (bay tới bounds khi mở sửa
đoạn), RingRoad (mở luồng sửa polyline khi `doan-sua-doi`).

**API chính**:
```
luu-local.js: luuFile(loai, noiDung, opts), xoaFile(loai, id)
serve.mjs:    POST /__luu-du-lieu {file, id?, noiDung?, xoa?} → JSON {loi?}
gis-editor.js: khoiTaoBienTap(node), batTat(bat), khoiTaoLopGaTam(),
               veLaiGaTam(), veNoiDungPanel()
```

**JSON sử dụng**: GHI trực tiếp `data/stations.json`, `data/ring_roads.json`
(qua `serve.mjs`, ghi TOÀN BỘ file mỗi lần, không patch từng phần).

**Những module ảnh hưởng**: Project (dùng chung hạ tầng `luu-local.js`),
Metro (ga tạm), RingRoad (polyline), toàn bộ trải nghiệm sửa dữ liệu của
Hoàng phụ thuộc module này hoạt động đúng.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO NHẤT trong số các module tính năng —
đang ở giữa một cuộc chuyển đổi kiến trúc lớn (QĐ-20) CHƯA HOÀN TẤT.**
- Trạng thái Firebase hiện tại: đã tạo project, CHƯA có Auth/Rules/config,
  CHƯA có 1 dòng code Firestore nào — xem đầy đủ tình trạng và cảnh báo
  không đảo ngược được ở [07_LIVE_MODE.md](07_LIVE_MODE.md).
- `serve.mjs` chỉ bind `127.0.0.1` — nới lỏng ra LAN/0.0.0.0 mà không cân
  nhắc lại bảo mật (endpoint có khả năng GHI FILE) là rủi ro nghiêm trọng.
- Khi tích hợp Firestore: TUYỆT ĐỐI không lộ credential/token có quyền ghi
  không giới hạn ra client — bảo mật phải nằm ở Security Rules server-side,
  không phải giấu giá trị `firebaseConfig` (giá trị đó vốn được thiết kế để
  công khai).
- Ga tạm/polyline ghi TOÀN BỘ file mỗi lần lưu (không phải patch) — 2 tab
  trình duyệt mở cùng lúc có thể ghi đè lẫn nhau (race condition), hiện
  chưa có cơ chế khoá/kiểm tra version.

---

## 10 · Popup

**Chức năng**: nội dung thẻ thông tin (Leaflet popup) hiện khi bấm ghim dự
án — chỉ hiển thị dữ liệu ra quyết định nhanh, không phải hồ sơ đầy đủ.

**File liên quan**: `js/features/popup.js`

**Dependency**: Core (`format.js`, `dom.js` cho `esc`). Không tự đọc
`state`/Database — nhận `duAn` làm tham số từ module gọi (Project).

**API chính**: `popupDuAn(duAn) → string (HTML)`

**JSON sử dụng**: không trực tiếp — dữ liệu do `projects.js` truyền vào
(đã lấy từ Database trước đó).

**Những module ảnh hưởng**: không ảnh hưởng module khác (hàm thuần, đầu ra
chỉ là chuỗi HTML) — module có bán kính ảnh hưởng NHỎ NHẤT trong Tầng 3.

**Rủi ro khi chỉnh sửa**: 🟢 **THẤP.** Rủi ro chính là UX/nhất quán badge:
quên hiện badge "Chưa kiểm" (`nguon==='osm'`) hoặc "Vị trí tự ghim"
(`xacMinh==='thu-cong'`) sẽ khiến người xem lầm tưởng dữ liệu đã xác minh —
vi phạm BR-8. Đổi cấu trúc HTML phải đồng bộ với `.pop__*` trong
`css/map.css`.

---

## 11 · Sidebar

**Chức năng**: hồ sơ dự án đầy đủ bên phải, 8 tab (Thông tin/Tiện ích/
Metro/Phân tích/Hình ảnh/Mặt bằng/Giá/Thanh toán), và toàn bộ form sửa CRUD
hiển thị khi Chế độ biên tập GIS bật.

**File liên quan**: `js/features/sidebar.js`

**Dependency**: Core, Database (`chiTietDuAn`), Project (`project-editor.js`
— đọc `dangSua()`/`banNhap()` để vẽ form), Routing (`dodac.js` — tự động đo
ga metro nếu thiếu), Amenities, Analytics, AI (gọi hiển thị kết quả từng
module này trong các tab tương ứng).

**API chính**:
```
khoiTaoSidebar(node), moHoSo() [async], dong(), veLaiSidebar (=veNoiDung)
```

**JSON sử dụng**: không tự fetch — dùng `chiTietDuAn(id)` từ Database.

**Những module ảnh hưởng**: không module nào phụ thuộc ngược lại Sidebar
(module lá trong cây phụ thuộc) — nhưng chính Sidebar PHỤ THUỘC nhiều module
khác nhất (6 module), nên rủi ro lan truyền LỖI VÀO Sidebar cao dù rủi ro
LAN RA từ Sidebar thấp.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO.**
- `dong()` phải giữ chốt idempotent (`if (state.chon == null && host.hidden) return;`)
  — xoá chốt này tái hiện BUG-01 (đệ quy vô hạn, RangeError).
- `dayDu` là cache module-scope KHÔNG tự đồng bộ theo `state.duAn` — mọi
  luồng ghi dữ liệu mới phải nhớ `emit('du-an-luu-xong', id)` để Sidebar
  tải lại, nếu không sẽ tái hiện BUG-02 (hiện dữ liệu cũ sau khi lưu).
- Dựng lại dải tab (`dungTabs()`) phải chỉ toggle `aria-selected`, KHÔNG vẽ
  lại cả khối — tái hiện BUG-07 (nút mồ côi) nếu vi phạm.
- Input form dùng `oninput` cập nhật thẳng bản nháp, KHÔNG vẽ lại DOM mỗi
  ký tự — vi phạm sẽ làm mất tiêu điểm bàn phím khi gõ.
- 8 tab đều phải tuân "có dữ liệu thì bày, không có thì giải thích rõ tại
  sao trống" — không được để tab trống trơn không lời giải thích.

---

## 12 · Panel

**Chức năng**: bảng trái — 4 tab (Dự án/Vành đai/Lớp/Bộ lọc), danh sách dự
án có phân trang, bảng bật/tắt 14 lớp bản đồ, bộ lọc.

**File liên quan**: `js/features/panel.js`

**Dependency**: Core, Database (`loc.js` — `locDuAn`), Layer (đọc `LOP` để
vẽ bảng bật/tắt).

**API chính**: `khoiTaoPanel(node, chuThich), ve(), capNhatSauLoc()`

**JSON sử dụng**: không trực tiếp — đọc `state.duAn` (đã nạp qua Database).

**Những module ảnh hưởng**: Project (bộ lọc panel ảnh hưởng cả marker trên
bản đồ, không chỉ danh sách — `loc-doi` trigger vẽ lại ghim).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH.**
- `MOI_TRANG = 60` — nhóm "chưa có vị trí" PHẢI hiện đầy đủ riêng, không ăn
  chung hạn mức phân trang với nhóm đã ghim (vi phạm sẽ làm dự án chờ ghim
  "biến mất" sau trang 20 khi danh mục lớn).
- `doiLop()`/`doiLocNhieu()` chỉ được cập nhật đúng hàng/chip vừa bấm — vi
  phạm tái hiện BUG-07.
- Không tự gọi `ve()` sau khi trigger sự kiện mà nơi khác (`app.js`) đã
  nghe để vẽ lại — gọi 2 lần sẽ vẽ đè và có thể mất đúng nút vừa bấm.

---

## 13 · Compare

**Chức năng**: bảng so sánh tối đa 3 dự án, 12 hàng chỉ số, đánh dấu ô "tốt
nhất" khi mọi dự án đều có số.

**File liên quan**: `js/features/compare.js`

**Dependency**: Core, Project (`TOI_DA_SO_SANH`, đọc `state.soSanh`).

**API chính**: `khoiTaoSoSanh(node), mo(), dong(), veLaiSoSanh()`

**JSON sử dụng**: không trực tiếp — đọc `state.duAn`/`state.soSanh`.

**Những module ảnh hưởng**: không ảnh hưởng module khác đáng kể (module lá).

**Rủi ro khi chỉnh sửa**: 🟢 **THẤP-TRUNG BÌNH.** Đánh dấu "tốt nhất"
(`data-tot`) chỉ được bật khi TẤT CẢ dự án trong bảng đều có số ở hàng đó
(`o.every(x => x.num != null)`) — vi phạm sẽ so sánh không công bằng giữa
số thật và ô trống, có thể khiến khách hiểu nhầm 1 dự án "thắng" trong khi
thực ra dự án kia chỉ đang thiếu dữ liệu.

---

## 14 · Search

**Chức năng**: tìm kiếm toàn cục (dự án/ga/tuyến/tiện ích/đường/KCN/phường
xã), không phân biệt dấu, xếp hạng theo độ khớp.

**File liên quan**: `js/features/search.js`

**Dependency**: Core (`format.js` — `slug`), Database (đọc nhiều nguồn dữ
liệu qua `duLieu`).

**API chính**: `khoiTaoTimKiem(input, ketQua), dong(), quenNguonTim()`

**JSON sử dụng**: không trực tiếp — dựng index từ `duLieu` (nhiều lớp) +
`state.duAn`, cache 1 lần trong biến `boNho`.

**Những module ảnh hưởng**: không ảnh hưởng module khác (module lá, chỉ
điều hướng qua `chonDuAn`/`bayToi` của Project/Map khi chọn kết quả).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH.**
- Quên gọi `quenNguonTim()` khi danh mục dự án đổi (sau CRUD) → kết quả tìm
  kiếm dùng dữ liệu CŨ cho tới khi tự dựng lại.
- Bỏ debounce (160ms) → tính lại toàn bộ index mỗi keystroke, giật ở quy mô
  hàng nghìn dự án + hàng nghìn điểm hạ tầng.

---

## 15 · Amenities

**Chức năng**: vẽ vòng bán kính quanh dự án đang xem, ghim tiện ích trong
bán kính đó.

**File liên quan**: `js/features/amenities.js`

**Dependency**: Core, Database (`tienIchCua`, `cacBanKinh`), Map (`engine.js`
— vẽ trên `map`).

**API chính**: `veVongBanKinh(duAn), xoaVongBanKinh(), hienTienIch(duAn), xoaTienIch()`

**JSON sử dụng**: `data/amenities.json` (qua `tienIchCua()` từ Database).

**Những module ảnh hưởng**: Sidebar (tab Tiện ích gọi trực tiếp), AI (tiêu
chí Tiện ích/An cư dùng cùng nguồn `amenities.json` nhưng qua đường tính
riêng, không qua module này).

**Rủi ro khi chỉnh sửa**: 🟢 **THẤP.** Lưu ý duy nhất: vòng tròn vẽ theo bán
kính CHIM BAY trong khi việc tiện ích có "lọt vào" hay không xét theo
khoảng cách ĐƯỜNG THẬT — có điểm nằm trong vòng tròn mà không hiện (đường
vòng qua sông/cầu) là HÀNH VI ĐÚNG, không phải bug, đừng "sửa" nhầm.

---

## 16 · Analytics (Phân tích)

**Chức năng**: tự sinh nhận định điểm mạnh/yếu/đối tượng phù hợp/rủi ro từ
số liệu đo được — không dùng câu quảng cáo viết sẵn.

**File liên quan**: `js/features/analysis.js`

**Dependency**: Database (`tienIchCua`, `gaCua`). Nhận `duAn` và kết quả AI
Score (`diem`) làm tham số, không tự đọc `state`.

**API chính**: `phanTich(duAn, diem) → {manh, yeu, hopVoi, ruiRo, thieuDuLieu}`

**JSON sử dụng**: không trực tiếp — qua tham số truyền vào.

**Những module ảnh hưởng**: Sidebar (tab Phân tích), ClientMode (không dùng
trực tiếp — thẻ gửi khách hiện điểm số, không hiện nhận định).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH — rủi ro về LỜI NÓI, không phải
kỹ thuật.** Mỗi câu nhận định PHẢI kèm dẫn chứng con số cụ thể, giọng văn
phải nêu cả hạn chế — thêm nhận định mới mà khẳng định chắc chắn về tương
lai ("chắc chắn tăng giá", "cơ hội vàng") vi phạm nguyên tắc giọng văn của
dự án (xem [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md) và
`anti-ai-writing-style.md`). Đây là nội dung Hoàng đọc trực tiếp cho khách
— sai giọng văn tương đương sai dữ liệu về mặt hậu quả.

---

## 17 · AI (AI Score)

**Chức năng**: chấm điểm 8 tiêu chí độc lập cho mỗi dự án, mỗi tiêu chí có
công thức riêng dựa trên dữ liệu đo được, vẽ biểu đồ ra-đa.

**File liên quan**: `js/features/score.js`

**Dependency**: Core (`geo.js`, `format.js`), Database (`gaCua`, `tienIchCua`).

**API chính**: `TIEU_CHI, chamDiem(duAn), sao(diem), nhanDiem(diem), radar(ketQua, size)`

**JSON sử dụng**: không trực tiếp — qua `gaCua()`/`tienIchCua()` (đọc
`routes.json`/`amenities.json` gián tiếp).

**Những module ảnh hưởng**: Sidebar, Popup, Compare, ClientMode, Analytics
(nhận điểm làm tham số) — điểm số hiển thị ở **4 nơi khác nhau**, đổi công
thức ảnh hưởng đồng loạt cả 4.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO — con số này Hoàng dùng trực tiếp để
thuyết phục khách mua nhà.**
- Đổi hệ số/mốc `theoMoc()` của bất kỳ tiêu chí nào làm điểm nhảy đột ngột
  cho hàng nghìn dự án cùng lúc — phải test trước/sau trên vài dự án mẫu đã
  biết điểm, không chỉ tin code chạy không lỗi.
- Vi phạm nguyên tắc "thiếu dữ liệu → `null`, không hạ 5/10 cho đủ hình" sẽ
  làm điểm TRÔNG như có cơ sở trong khi thực ra không — nguy hiểm hơn cả
  việc thiếu điểm, vì Hoàng/khách sẽ tin vào một con số vô căn cứ.
  Xem BR-6.
- `radar()` vẽ tiêu chí `null` ở tâm nhưng phải giữ đánh dấu riêng (chấm
  nhỏ hơn/xám) — bỏ đánh dấu này khiến biểu đồ "nói dối" là điểm 0 thay vì
  "chưa chấm được".

---

## 18 · ClientMode (Chế độ gửi khách)

**Chức năng**: ẩn toàn bộ panel điều khiển, chỉ còn bản đồ + thẻ tóm tắt để
chụp màn hình gửi khách.

**File liên quan**: `js/features/clientmode.js`

**Dependency**: Core, Database, Map (`invalidateSize`, bay tới dự án),
AI (hiện điểm số + bar từng tiêu chí), Amenities (6 tiện ích nổi bật).

**API chính**: `khoiTaoGuiKhach(node), bat(), tat(), batTat(), veLaiGuiKhach`

**JSON sử dụng**: không trực tiếp — đọc `state.duAn`/`state.chon`.

**Những module ảnh hưởng**: không module nào phụ thuộc ngược — module lá,
nhưng LIÊN QUAN CHẶT tới `css/client.css` và bố cục toàn trang.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO — bug bố cục ở đây làm HỎNG HẲN tính
năng chính của app (chụp gửi khách).** Bố cục PHẢI dùng vị trí tuyệt đối,
TUYỆT ĐỐI không CSS Grid shorthand — xem BUG-08. Panel/UI mới thêm vào app
phải nhớ thêm vào danh sách ẩn `!important` trong `client.css`, nếu không
panel đó sẽ LỘ RA trong ảnh chụp gửi khách (rò rỉ thông tin nội bộ như giá
gốc/ghi chú nội bộ ra khách hàng).

---

## 19 · QA (Kiểm tra dữ liệu + Developer Mode)

**Chức năng**: 2 công cụ chẩn đoán nội bộ — dò lỗi dữ liệu (trùng/sai toạ
độ/giá bất thường, chỉ đọc) và bắt lỗi JavaScript runtime (chạy nền, xuất
báo cáo).

**File liên quan**: `js/features/data-checker.js`, `js/features/dev-mode.js`

**Dependency**: Core, Database (đọc `state.duAn`, `phuongXa`), Layer/Map
(kiểm tra lớp bản đồ lỗi), AI (`chamDiem` — kiểm tra thiếu score).

**API chính**:
```
data-checker.js: khoiTaoKiemTra(node), dong(), chayKiemTra() [async]
dev-mode.js:     khoiTaoDevMode(node), batTat(bat)
```

**JSON sử dụng**: chỉ ĐỌC (`data-checker.js` đọc `chiTietDuAn` để kiểm
thiếu ảnh/logo/score cho dự án đã kiểm) — KHÔNG BAO GIỜ ghi file, đây là
module an toàn tuyệt đối để chạy bất cứ lúc nào.

**Những module ảnh hưởng**: không ảnh hưởng module khác — module thuần
chẩn đoán, click kết quả chỉ điều hướng qua `chonDuAn()` của Project.

**Rủi ro khi chỉnh sửa**: 🟢 **THẤP** (không ghi dữ liệu) nhưng có 1 quy
tắc quan trọng: các kiểm tra §6-9 (thiếu thông tin/ảnh/logo/score) CHỈ được
chạy trên dự án `nguon:"thu-cong"` — mở rộng nhầm sang chạy cả trên 1.137
ứng viên OSM sẽ tạo hàng nghìn dòng cảnh báo nhiễu vô ích (chúng cố tình để
trống theo thiết kế, không phải lỗi). Developer Mode: không được "nâng cấp"
thành công cụ hứa hẹn dò rò rỉ bộ nhớ/responsive tự động — đã xác nhận
KHÔNG khả thi thuần JS, cần công cụ ngoài.

---

## 20 · UI (Design System)

**Chức năng**: không phải 1 file JS — là tầng CSS xuyên suốt: design token,
quy ước đặt tên, component pattern dùng lại nhiều nơi.

**File liên quan**: toàn bộ `css/*.css` (7 file: `tokens.css`, `base.css`,
`layout.css`, `map.css`, `panels.css`, `sidebar.css`, `client.css`).

**Dependency**: không phụ thuộc JS module nào — nhưng MỌI module JS có UI
đều phụ thuộc token/class của tầng này.

**API chính**: không phải API hàm — là "API thị giác": biến CSS (`--c-*`,
`--s*`, `--r*`, `--sh*`, `--fz*`, `--z-*`, `--t-*`) và class BEM. Danh sách
đầy đủ: [06_UI_UX_RULES.md](06_UI_UX_RULES.md).

**JSON sử dụng**: không có.

**Những module ảnh hưởng**: **TẤT CẢ** module có giao diện (17/22 module) —
tương đương bán kính ảnh hưởng của Core nhưng ở tầng trình bày thay vì logic.

**Rủi ro khi chỉnh sửa**: 🔴 **CAO.** Đổi giá trị token (đặc biệt màu/
spacing) ảnh hưởng đồng loạt toàn bộ giao diện, khó kiểm hết bằng mắt trong
1 lần test. Đổi cấu trúc bố cục `layout.css`/`client.css` là rủi ro cao
nhất toàn dự án về mặt UI — xem BUG-08, TUYỆT ĐỐI không CSS Grid shorthand
cho vùng chính.

---

## 21 · Animation

**Chức năng**: không phải module code riêng — là một MIỀN QUY TẮC áp dụng
xuyên suốt CSS + 1 điểm quyết định kỹ thuật quan trọng (SVG vs canvas cho
hiệu ứng chuyển động trên bản đồ).

**File liên quan**: `css/tokens.css` (biến `--ease`, `--t-fast/mid/slow`),
`css/layout.css`/`panels.css`/`sidebar.css`/`map.css` (nơi áp dụng
transition/animation cụ thể), `js/map/engine.js` + `js/features/vanhdai.js`
(quyết định SVG renderer riêng cho đoạn vành đai đang thi công).

**Dependency**: UI (dùng chung token), Map/RingRoad (phần animation trên
bản đồ cần renderer đúng loại).

**API chính**: không có — thuần CSS custom property + `@keyframes`
(`tam-nhap-nhay` cho ga tạm, `lyr-pulse` cho layer đang tải, hiệu ứng nét
chạy cho đoạn thi công).

**JSON sử dụng**: không có.

**Những module ảnh hưởng**: UI, Map, RingRoad (bất kỳ đâu có animation).

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH.**
- Thêm animation mới trên đối tượng vẽ bằng CANVAS sẽ KHÔNG chạy — animation
  CSS chỉ ăn trên SVG. Phải kiểm renderer trước khi thêm hiệu ứng.
- Bỏ sót `@media (prefers-reduced-motion: reduce)` cho animation mới → vi
  phạm accessibility đã có sẵn cho toàn bộ animation khác trong app.
- Animation trên dữ liệu CHƯA XÁC MINH (ga tạm nhấp nháy) có Ý NGHĨA NGHIỆP
  VỤ (báo hiệu "chưa chốt"), không phải trang trí — xoá nhầm làm mất tín
  hiệu phân biệt dữ liệu tạm/thật.

---

## 22 · Performance

**Chức năng**: không phải module code riêng — là tập hợp các CHIẾN LƯỢC tối
ưu áp dụng ở nhiều module khác nhau, gom lại đây để có cái nhìn tổng thể.

**File liên quan**: `js/map/layers.js` (lazy-render viewport, canvas vs
SVG), `js/features/projects.js` (gom cụm lưới pixel), `js/core/data.js` (3
tầng ưu tiên tải, cache `Map`), `js/core/loc.js` (cache slug tìm kiếm),
`js/features/search.js` (debounce + cache index).

**Dependency**: cross-cutting — không phải 1 chiều phụ thuộc, mà là RÀNG
BUỘC áp lên Layer, Project, Database, Search khi các module đó được sửa.

**API chính**: không có API riêng — các ngưỡng số quan trọng cần nhớ khi
sửa module liên quan:
```
TRAN_GHIM (layers.js) = 260      — trần marker/lần vẽ cho lớp mật độ dày
TRAN_GHIM (projects.js) = 300    — trần marker riêng lẻ trước khi bắt buộc gom cụm
ZOOM_TACH_CUM = 15               — dưới zoom này bắt đầu gom cụm nếu >24 dự án
O_CUM_PX = 64 (×1.6 mỗi vòng)    — cạnh ô lưới pixel gom cụm
CUM_TOI_DA = 90                  — số cụm tối đa trước khi tăng cạnh ô
debounce tìm kiếm = 160ms
```

**JSON sử dụng**: không trực tiếp.

**Những module ảnh hưởng**: Layer, Project, Database, Search — mọi thay đổi
ở các module này PHẢI cân nhắc lại các ngưỡng trên, không chỉ đổi logic
nghiệp vụ đơn thuần.

**Rủi ro khi chỉnh sửa**: 🟡 **TRUNG BÌNH — rủi ro âm thầm, chỉ lộ ra ở quy
mô dữ liệu lớn, không lộ khi test với vài chục bản ghi.** Đã đo thật ở
5.000 dự án: vẽ lại bản đồ 4-11ms, tra phường/xã 17ms (nhờ cache + bbox-
first), DOM ~1.200 nút. Sửa bất kỳ ngưỡng nào ở trên PHẢI đo lại ở quy mô
tương đương trước khi coi là "vẫn ổn" — test bằng mắt với dữ liệu nhỏ không
phát hiện được hồi quy hiệu năng.

---

## Bảng tra nhanh — sửa file này thì rủi ro tới module nào

| File sửa | Module chính | Rủi ro lan tới |
|---|---|---|
| `core/store.js` | Core | TẤT CẢ 21 module |
| `core/data.js` | Database | Project, Metro, RingRoad, Routing, Amenities, mọi UI feature |
| `core/geo.js` | Core | AI, RingRoad, QA (mọi phép đo hình học) |
| `map/engine.js` | Map | Layer, Project, Metro, RingRoad, Popup |
| `map/layers.js` | Layer | Metro, Panel, Performance |
| `features/projects.js` | Project | Popup, Sidebar, Compare, Search, ClientMode |
| `features/project-editor.js` | Project | LiveMode, Sidebar |
| `features/vanhdai.js` | RingRoad | AI, Sidebar, LiveMode |
| `features/score.js` | AI | Sidebar, Popup, Compare, ClientMode, Analytics |
| `features/sidebar.js` | Sidebar | (module lá — rủi ro chủ yếu là NHẬN lỗi từ 6 module nó phụ thuộc) |
| `core/luu-local.js`, `tools/serve.mjs` | LiveMode | Project, Metro (ga tạm), RingRoad (polyline) |
| `css/tokens.css` | UI | TẤT CẢ module có giao diện |
| `css/layout.css`, `css/client.css` | UI + ClientMode | Toàn bộ bố cục, đặc biệt Chế độ gửi khách |

# BÀN GIAO DỰ ÁN — Bản đồ tư vấn bất động sản TP.HCM

> Tài liệu này viết cho một phiên Claude hoàn toàn mới. Đọc xong file này là đủ
> để tiếp tục công việc — **không cần đọc lại lịch sử hội thoại**.
>
> **Cập nhật:** 02/08/2026 · **Trạng thái:** Chế độ biên tập GIS (Giai đoạn 7),
> lọc danh mục dự án (Giai đoạn 8), và **Project Edit Mode** (Giai đoạn 9) đã
> code và kiểm thử xong trên máy — **CHƯA PUSH lên GitHub**, đang chờ Hoàng
> duyệt (Project Edit Mode cho xoá được dự án nên cần xác nhận trước khi lên
> web thật). Hoàng đã yêu cầu một đợt refactor tổng thể lớn hơn nhiều (9 hạng
> mục) — đã thống nhất làm THEO ĐỢT, tự chọn việc tự tin nhất làm trước, báo
> cáo lại sau mỗi đợt. Mục 1 (lọc dữ liệu) và mục 2+3 (CRUD dự án + kéo marker)
> xong. Các mục còn lại **CHƯA LÀM**, xem mục 4 Pending Tasks.

---

## 1 · Project Overview

**Sản phẩm:** hệ thống bản đồ tư vấn bất động sản khu vực Thành phố Hồ Chí
Minh (sau sáp nhập 01/07/2025, gồm cả Bình Dương và Bà Rịa – Vũng Tàu cũ) —
một web app tĩnh, một file HTML gọi ra nhiều module JS, không backend.

**Người dùng:** Huy Hoàng — môi giới bất động sản. Dùng để tư vấn khách tại
chỗ hoặc chụp màn hình gửi Zalo. Đồng nghiệp cùng xem chung.

**Bài toán nghiệp vụ:** khách hỏi "dự án này cách metro bao xa, quanh đây có
gì, có đáng tiền không, đường vành đai tới đâu rồi". Bản đồ phải trả lời ngay
và **không được nói sai** — sai là đi thẳng tới khách hàng thật.

**Ba trụ cột dữ liệu, mỗi trụ một tầng lớp riêng:**
1. **Danh mục bất động sản** — 1.165 dự án (data/projects/)
2. **Mạng lưới metro** — 10 tuyến theo quy hoạch hiện hành (data/metro.json,
   data/metro/)
3. **Đường Vành đai 2/3/4** — mỗi đoạn một trạng thái thi công riêng
   (data/ring_roads.json)

**Link đang chạy:** https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/
**Repo:** https://github.com/nhhoang220204-beep/ban-do-metro-tphcm (nhánh `main`)
**Thư mục làm việc:** `D:\Claude Cowork\ABOUT ME\metro-web\` (đây là thư mục git)

**Ràng buộc kỹ thuật xuyên suốt:**
- Không framework. Thư viện ngoài duy nhất: Leaflet 1.9.4 (CDN unpkg)
- Miễn phí hoàn toàn — mọi nguồn dữ liệu và routing đều dùng dịch vụ công cộng
- Chạy tốt trên điện thoại, kiến trúc chịu được tới hàng nghìn dự án

---

## 2 · Current Status

| Hạng mục | Trạng thái |
|---|---|
| Ứng dụng | ✅ 22 module JS + 7 file CSS, không framework, ~5.750 dòng |
| Dữ liệu nền OpenStreetMap | ✅ 12 lớp (đường bộ, KCN, trường, y tế, mua sắm, công viên, sông hồ, địa giới…) |
| **Danh mục bất động sản** | ✅ **1.165 dự án** — 11 đã kiểm (Hoàng bán) + 1.154 ứng viên OSM (nhãn "Chưa kiểm") |
| **Toạ độ dự án Hoàng đang bán** | ⚠️ **2/11 đã ghim** (HT Pearl, TT AVIO qua OSM) · **9/11 còn thiếu — việc gấp nhất** |
| Hồ sơ dự án (giá, pháp lý, số căn) | ⚠️ Phần lớn trống; ứng viên OSM trống hoàn toàn theo thiết kế (không đoán) |
| **Nghiên cứu tự động cho ứng viên OSM (mới 02/08/2026)** | ⚠️ **Thí điểm 50/1.154** — xem Giai đoạn 6, mục 5, QĐ-16. Còn 1.104 ứng viên chưa chạy, chờ Hoàng duyệt chất lượng đợt thí điểm trước khi chạy tiếp |
| Kiến trúc chịu quy mô | ✅ Đo thật ở 5.000 dự án: vẽ lại bản đồ 4–11 ms, tra phường/xã 17 ms, DOM ~1.200 nút |
| Định tuyến đường thật (OSRM) | ✅ Tiền tính cho dự án đã kiểm; tự đo tại chỗ trong trình duyệt cho phần còn lại |
| **Hồ sơ mạng lưới metro có nguồn đối chiếu** | ✅ 10 tuyến, GeoJSON + JSON + CSV — `data/metro/` |
| Hướng tuyến metro theo tên đường | ✅ Suy bằng thuật toán đo đạc, 299,3 km / 146 phân đoạn, 2 phép tự kiểm chứng khớp dưới 1% |
| **Mâu thuẫn tuyến 6 đoạn Phú Hữu–Bình Thái** | ⚠️ **CHƯA GIẢI QUYẾT** — xem mục 9, mã MT-01 |
| **Lớp Đường Vành đai 2/3/4** | ✅ 53 đoạn, mỗi đoạn một trạng thái riêng, màu + nét theo trạng thái |
| Phân tích mức hưởng lợi vành đai cho dự án | ✅ Trong tab Phân tích của hồ sơ dự án |
| Kiểm thử trên trình duyệt (máy + link thật) | ✅ Không lỗi console |
| Đã đẩy lên GitHub Pages | ✅ Nhiều lần, lần gần nhất 01/08/2026 |
| Xuất ảnh PNG / in A4 (chế độ gửi khách) | ❌ Bản v1 cũ có, chưa dựng lại |
| Đọc Google Sheet (dữ liệu dùng chung nhiều máy) | ❌ Chưa dựng lại — **cần Hoàng quyết** có làm tiếp hay bỏ hẳn |
| Truy cập ArcGIS FeatureServer chính thức của TP.HCM | ❌ Cổng có thật, trả về 401 — cần xin quyền qua Sở Xây dựng |

---

## 3 · Completed Tasks

### Giai đoạn 1 — Bản đồ metro v1 (một file HTML, đã bị thay thế cấu trúc)
Dựng bản đầu bằng dữ liệu tự suy từ quy hoạch → sai nặng (ga lệch tới 974 m,
tuyến zigzag). Phát hiện lỗi, refactor toàn bộ theo nguyên tắc "chỉ dùng dữ
liệu xác minh". Kết quả: 10 tuyến, 49 ga xác minh từ OpenStreetMap, kiểm định
chất lượng (tuyến 1 = 19,6 km / 14 ga, khớp số chính thức 19,7 km).

### Giai đoạn 2 — Viết lại thành ứng dụng nâng cấp (V2)
Từ một file HTML 134 KB → 22 module JS + 7 CSS + dữ liệu tách file JSON.
- Map engine (zoom, fullscreen, reset, locate, search), 14+ lớp bật/tắt
- Marker riêng theo loại hình, popup card, sidebar 8 tab
- AI Score 8 tiêu chí kèm biểu đồ ra-đa, nhận định tự sinh có dẫn chứng
- So sánh tối đa 3 dự án, bộ lọc, chế độ gửi khách
- Khoảng cách đo bằng đường thật qua OSRM (không phải chim bay)

### Giai đoạn 3 — Nâng cấp thành cơ sở dữ liệu bất động sản toàn diện
- Tách kiến trúc dữ liệu 2 tầng: `data/projects/index.json` (chỉ mục gọn,
  nạp ngay) + `data/projects/chi-tiet/<id>.json` (hồ sơ đầy đủ, tải khi mở)
- Công cụ `build-projects.mjs`: lấy ứng viên dự án từ OpenStreetMap
  (building=apartments/residential, landuse=residential), lọc rác 4 lớp
  (mã ký hiệu, tên bộ phận toà nhà, công trình không phải nhà ở, địa chỉ lẫn
  vào tên) → từ 2.201 đối tượng thô còn 1.154 ứng viên sạch
- Danh mục từ 11 → **1.165 dự án**, chịu được quy mô lớn: gom cụm marker thích
  ứng theo pixel, lọc theo khung nhìn, phân trang danh sách, tra phường/xã có
  lọc nhanh bằng khung bao (413 ms → 17 ms ở 5.000 dự án)
- Module `dodac.js`: đo khoảng cách metro **tại chỗ trong trình duyệt** cho
  dự án chưa tiền tính (vì tiền tính hết cho hàng nghìn dự án là bất khả thi),
  kết quả nhớ trên máy qua localStorage

### Giai đoạn 4 — Hồ sơ mạng lưới metro có nguồn đối chiếu
- Tra cứu và đối chiếu 3 văn bản pháp lý: Nghị quyết 188/2025/QH15, Quyết định
  1125/QĐ-TTg (11/06/2025), Đề án ĐSĐT của Sở GTVT (05/2024)
- Phát hiện và ghi rõ xung đột: quy hoạch 2013 (QĐ 568/QĐ-TTg, có tuyến
  3A/3B/4B) **đã bị thay thế** bởi quy hoạch hiện hành đánh số liền mạch 1–10
- Dựng `data/metro/lines.json`: sổ đăng ký 10 tuyến + 4 tuyến ngoài bộ 10
  (Thủ Thiêm–Long Thành, Bến Thành–Cần Giờ, 2 tuyến Bình Dương cũ), mỗi số
  liệu kèm nguồn và mức tin cậy ★1–★5
- Thuật toán suy hướng tuyến theo tên đường: rải điểm mẫu 150 m dọc hình
  tuyến, tìm đường có tên gần nhất (có phạt theo cấp đường để không bám vào
  hẻm), gom thành đoạn kèm mốc km → 299,3 km / 146 phân đoạn cho 10 tuyến có
  hình học. Hai phép tự kiểm chứng khớp dưới 1% (tuyến 1: lệch 0,5%; tuyến 6
  GĐ1: lệch 0,2%) và một phép tự xác nhận đúng cấu trúc quy hoạch (tuyến 3 ra
  đúng hành lang 3A+3B cũ nối nhau)
- Xuất `alignment.geojson`, `ga.geojson` (EPSG:4326), CSV cho Excel
- Phát hiện cổng GIS chính thức của TP.HCM (`gisxaydung.tphcm.gov.vn`, backend
  ArcGIS FeatureServer tại `api-gisxaydung.tphcm.gov.vn`) — trả 401, cần xin
  quyền, xem mục 10

### Giai đoạn 5 — Lớp Đường Vành đai 2/3/4
- Công cụ `build-ring-roads.mjs`: trạng thái từng đoạn suy trực tiếp từ thẻ
  `highway` của OSM (`motorway/trunk/…`→đã xong, `construction`→đang thi công,
  `proposed`→quy hoạch) — **không gán một trạng thái cho cả tuyến**
- Mốc thời gian, tiến độ % lấy từ báo chí dẫn cơ quan chủ quản, gắn vào đúng
  đoạn kèm nguồn; đoạn không khớp hồ sơ nào thì để trống
- Bắt và sửa lỗi đường đôi (OSM vẽ 2 chiều thành 2 way, bị nối thành vòng
  đi–về nhân đôi chiều dài) — cùng họ lỗi đã gặp ở metro tuyến 1
- Kết quả: **53 đoạn** (30 hoàn thành, 17 đang thi công, 6 quy hoạch), đo được
  khớp hồ sơ trong khoảng 5% ở VĐ3 và VĐ4
- Giao diện: màu theo trạng thái (xanh lá/cam/vàng/đỏ) đọc từ dữ liệu, đoạn
  thi công có hiệu ứng nét chạy (vẽ trên SVG riêng), quy hoạch nét đứt, độ
  dày thống nhất; tab "Vành đai" trong bảng trái với thống kê + bộ lọc; phân
  tích mức hưởng lợi hạ tầng trong hồ sơ dự án

### Giai đoạn 6 — Nghiên cứu tự động khi mở hồ sơ dự án thiếu dữ liệu (02/08/2026)
Hoàng yêu cầu: mở hồ sơ một dự án thiếu dữ liệu thì không được chỉ hiện "Đang
cập nhật" — phải tự nghiên cứu qua 5 nguồn ưu tiên (website chính thức →
fanpage → Facebook Group → web BĐS uy tín → Google Maps), ghi rõ nguồn từng
trường. Đã chỉ ra xung đột với kiến trúc "không backend, miễn phí hoàn toàn":
nghiên cứu real-time ngay lúc khách mở hồ sơ trên điện thoại là bất khả thi
với một web app tĩnh không server. Hoàng chọn phương án: Claude nghiên cứu thủ
công theo yêu cầu, ghi thẳng vào file — không dựng tính năng tự động thật
trong app (xem QĐ-16).

- Mở rộng schema `data/projects/chi-tiet/<id>.json`: thêm `nguonTheoTruong`
  (nguồn riêng cho từng trường số liệu) và `nghienCuu` (ngày tra + danh sách 5
  khoá nguồn đã kiểm tra), cùng các trường mới `donViPhatTrien`, `soTang`,
  `tienDo`, `hotline`, `website`, `tienIchNoiKhu`
- Sửa `js/features/sidebar.js` (tab Thông tin): mỗi trường có dữ liệu hiện kèm
  dòng "Nguồn: …" nhỏ bên dưới; trường trống mà đã có `nghienCuu` thì hiện
  "Chưa tìm thấy dữ liệu đáng tin cậy từ các nguồn đã kiểm tra." thay vì "Đang
  cập nhật" chung chung; thêm khối "Các nguồn đã kiểm tra" (5 badge ✓) cuối tab
- Badge "Chưa kiểm" và `nguon: "osm"` giữ nguyên — nghiên cứu chỉ bổ sung số
  liệu có nguồn, không đổi trạng thái xác minh của dự án (đúng QĐ-10)
- Thí điểm: giao 5 agent chạy song song, mỗi agent tra 10/50 ứng viên OSM đầu
  tiên trong `index.json`. Kết quả: phần lớn dự án là chung cư cũ/tái định cư/
  toà văn phòng không có marketing — đúng như dự đoán, KHÔNG có gì bất thường.
  Vài phát hiện đáng chú ý:
  - **204 Bacu, Sơn Tịnh, An Khánh, An Phú, Chung cư DV Green Hills, Chung cư
    13 Lý Thường Kiệt, Shade 2 Stories 1**: hoàn toàn không tìm thấy nguồn nào
    — rất có thể không phải dự án BĐS thương mại (chung cư nhà nước, tên phường,
    hoặc lỗi OSM)
  - **Cư xá Đoàn Văn Bơ**: nghi ngờ OSM gắn sai vị trí/tên — toạ độ thực trỏ
    tới hẻm 130 Lê Quốc Hưng, không phải đường Đoàn Văn Bơ. Cần Hoàng kiểm
    thực địa
  - **Toà Nhà Cityview, Bitexco Building**: là toà văn phòng cho thuê, không
    phải căn hộ đang bán — nên cân nhắc loại khỏi danh mục tư vấn để ở
  - **Crescent Residence 1/2/3**: thực chất là văn phòng/căn hộ dịch vụ cho
    thuê của Phú Mỹ Hưng, không phải căn hộ đang mở bán
  - **Cao Ốc BMC Hưng Long**: dự án bỏ hoang, vướng nợ ngân hàng hơn 11 năm
  - **Chung cư 22 Tầng**: gán vào 165A Thùy Vân với độ tin cậy THẤP (Vũng Tàu
    có ít nhất 3 toà cùng tầm tầng dễ trùng tên) — đã ghi cảnh báo rõ trong
    `ghiChu`, Hoàng cần tự kiểm lại
  - Các dự án còn lại (Gateway, Copac Square, OSC Land, Hodeco 199 NKKN…) có
    dữ liệu khá đầy đủ, nguồn rõ ràng, có cả website/hotline chính thức
- **Không chạy phần "hình ảnh"/"mặt bằng" trong đợt này** — tải/gắn ảnh cần
  xác nhận quyền sử dụng, để ngoài phạm vi thí điểm

### Giai đoạn 7 — Chế độ biên tập GIS nội bộ (02/08/2026, CHƯA PUSH)
Hoàng yêu cầu một chế độ riêng để tự dựng dữ liệu ga metro/vành đai bằng cách
kéo-thả trên bản đồ, khác hẳn chế độ xem bình thường (xem QĐ-17). Đã dựng:

- **Nút "🛠 Chế độ biên tập GIS"** trên thanh trên → mở panel bên phải
  (`js/features/gis-editor.js`), có bộ lọc hiển thị 3 mức: Chỉ xác minh / Chỉ
  tạm / Hiện tất cả (mặc định "Hiện tất cả" — không chặn hiển thị dữ liệu tạm)
- **Ga metro tạm** (🟡, nhấp nháy): kéo-thả trực tiếp trên bản đồ hoặc sửa số
  lat/lng trong popup, bấm "Lưu toạ độ" ghi thẳng vào `data/stations.json`.
  Đã sinh sẵn **41 ga tạm** (22 cho Metro số 2 Thủ Dầu Một + 19 cho Metro Bình
  Dương — Suối Tiên) bằng cách nội suy đều theo hình học tuyến đã có từ OSM —
  KHÔNG phải vị trí ga thật, chỉ là điểm khởi đầu để Hoàng tự kéo vào đúng chỗ
  (xem `tools/estimate-stations-tam.mjs`, chạy lại được, idempotent)
- **Sửa polyline đoạn vành đai**: bấm một đoạn "Tạm số hoá" (màu vàng chấm
  chấm) trong chế độ biên tập → hiện tay cầm từng điểm (kéo = di chuyển, bấm =
  xoá điểm, bấm chấm trắng giữa hai điểm = thêm điểm) → bấm "Lưu" ghi vào
  `data/ring_roads.json`. Đã tự động nối **41 khúc hở ngắn** (≤6km, khả năng
  cao là chỗ giao lộ OSM vẽ rời) giữa các đoạn đã có của cả 3 vành đai bằng
  đoạn thẳng tạm — trạng thái mới `tam-so-hoa` (xem `tools/estimate-ring-gaps-tam.mjs`)
- **1 khúc hở KHÔNG được nối** (Vành đai 4, 41 km, xuyên nhiều tỉnh) — nối
  thẳng sẽ là bịa cả chục km đường, không phải "số hoá sơ bộ". Hoàng cần tự
  vẽ tay trong chế độ biên tập hoặc tra quy hoạch chính thức
- **`tools/serve.mjs` giờ có thể GHI file**: thêm `POST /__luu-du-lieu`, chỉ
  nhận đúng hai tên file (`stations`, `ring_roads`), chỉ chạy khi mở bằng
  `node tools/serve.mjs` trên máy Hoàng. ⚠️ **Đổi hành vi:** máy chủ giờ chỉ
  lắng nghe trên `127.0.0.1` (trước đây không khai báo host nên nghe cả mạng
  LAN) — vì đã có khả năng ghi file, không để lộ ra mạng. Nếu Hoàng có thói
  quen mở app từ điện thoại qua địa chỉ IP của máy tính trong cùng wifi, cách
  đó **sẽ không còn chạy được nữa**. Trên GitHub Pages (site tĩnh), nút "Lưu"
  luôn báo lỗi rõ ràng, không bao giờ mất dữ liệu âm thầm
- Đã kiểm thử đầy đủ trên máy: kéo ga tạm + lưu (xác nhận ghi đúng xuống
  `data/stations.json`), thêm/xoá/kéo điểm polyline + lưu (xác nhận ghi đúng
  xuống `data/ring_roads.json`), bộ lọc hiển thị, ga/đoạn đã xác minh không
  đổi hành vi khi bật/tắt chế độ biên tập — không lỗi console
- ✅ **Đã push lên GitHub** (cùng đợt với Giai đoạn 8 bên dưới)

### Giai đoạn 8 — Lọc lại danh mục dự án theo loại hình (02/08/2026)
Hoàng phản ánh danh mục lẫn nhiều đối tượng không phải nhà ở (công ty, văn
phòng, showroom, trụ sở, khu đất, doanh nghiệp) — chỉ muốn giữ Chung cư/Căn
hộ/Nhà phố/Shophouse/Biệt thự/Khu đô thị/Dự án nhà ở, loại còn lại thì "Không
xác định được loại hình → Không hiển thị". Đây là mục 1 trong yêu cầu refactor
lớn hơn (xem mục 4 Pending Tasks) — đã làm riêng mục này trước, các mục còn
lại (2–9) CHƯA làm, chờ Hoàng xác nhận thứ tự ưu tiên tiếp theo.

- Quét tên 1.154 ứng viên OSM theo 2 vòng từ khoá (công ty/văn phòng/showroom/
  trụ sở/xí nghiệp/kho/KCN/trường/bệnh viện/UBND/công an/ngân hàng/chợ/nhà
  thờ/chùa/bãi xe/trạm/nghĩa trang/khách sạn…) — chỉ ra 13 nghi vấn, xác nhận
  tay từng cái để tránh xoá nhầm (vd: "Miếu Nổi", "Chợ Lớn", "Chợ Quán" là ĐỊA
  DANH trong tên chung cư thật, không phải văn phòng/chợ thật — GIỮ LẠI)
- Đối chiếu thêm với 50 hồ sơ đã tự nghiên cứu ở Giai đoạn 6 (có ghi rõ trong
  `ghiChu` nếu là văn phòng/căn hộ dịch vụ cho thuê thay vì dự án bán) — tìm
  thêm 10 trường hợp xác nhận rõ không phải BĐS để bán
- **Đã xoá 17/1.165 dự án** khỏi `data/projects/index.json` (còn 1.148):
  Bitexco Building, Toà Nhà Cityview, Crescent Residence 1/2/3 (văn phòng/căn
  hộ dịch vụ cho thuê), Sherwood Residence, Indochine Park Tower (serviced
  apartment cho thuê, không bán), Saigon Mansion (văn phòng+bán lẻ+ở hỗn hợp,
  không có căn hộ để bán xác nhận), An Khánh, An Phú (không xác định được là
  một dự án cụ thể — nhiều khả năng chỉ là điểm OSM đánh dấu tên phường), Trạm
  khí tượng Thủ Dầu Một, Kho Bạc NN quận Phú Nhuận, Chợ Hoa Tươi Đầm Sen, Công
  ty CP Nhựa Bảo Vân, Công Ty TNHH Vision International, Cty Liên Hưng, Cơ sở
  sản xuất Sơn Hà — xoá luôn 10 file `chi-tiet/<id>.json` mồ côi tương ứng
- **Giữ lại** các trường hợp nghi vấn nhưng có bằng chứng vẫn là BĐS ở thật:
  Copac Square và Cao Ốc An Thịnh (toà hỗn hợp văn phòng+căn hộ nhưng CÓ xác
  nhận giao dịch mua bán căn hộ thật); các chung cư cũ tên trùng địa danh
  (Miếu Nổi, Chợ Lớn, Chợ Quán, Phan Xích Long, 145 Phan Chu Trinh…); khu tái
  định cư (vẫn là nhà ở, chỉ khác chủ đầu tư là nhà nước); resort có "Residences"
  trong tên (Hyatt Regency Hồ Tràm…) — chưa đủ căn cứ để xoá, resort bán biệt
  thự/condotel là sản phẩm thật ở khu vực này
- ⚠️ **GIỚI HẠN QUAN TRỌNG:** chỉ rà được kỹ 61/1.165 dự án (11 đã kiểm + 50 đã
  nghiên cứu Giai đoạn 6). Với **~1.087 dự án còn lại chưa từng nghiên cứu**,
  chỉ lọc được bằng từ khoá trong TÊN — dự án nào tên không có từ khoá lộ liễu
  (như "Bitexco Building", "Crescent Residence" từng lọt qua vòng từ khoá vì
  tên không "kêu" là văn phòng) vẫn có thể còn sai loại hình mà chưa phát hiện
  được. Muốn rà hết cần nghiên cứu từng dự án như Giai đoạn 6, tốn nhiều đợt
  agent tương tự
- Không lỗi console sau khi xoá; kiểm tra không còn dữ liệu mồ côi trong
  `data/routes.json` / `data/amenities.json`

### Giai đoạn 9 — Project Edit Mode: CRUD dự án + kéo marker (02/08/2026, CHƯA PUSH)
Mục 2+3 trong yêu cầu "refactor tổng thể" của Hoàng (mục 4 dưới đây liệt kê cả
9 mục). Mở rộng đúng khuôn Chế độ biên tập GIS đã có (Giai đoạn 7) sang dự án
BĐS, dùng chung hạ tầng lưu file cục bộ.

- **`js/core/luu-local.js`** (mới): tách hàm `luuFile`/`xoaFile` dùng chung
  giữa gis-editor.js và project-editor.js, gọi `POST /__luu-du-lieu`
- **`tools/serve.mjs`**: mở rộng endpoint ghi file — thêm `projects-index`
  (ghi `data/projects/index.json`) và `projects-chi-tiet` (ghi/xoá
  `data/projects/chi-tiet/<id>.json`, id kiểm bằng regex để chặn path traversal)
- **`js/features/project-editor.js`** (mới): sửa/lưu/huỷ/xoá/thêm dự án.
  Trong hồ sơ dự án, khi bật 🛠, có nút "✏ Sửa dự án" → mở form sửa TẤT CẢ
  trường (tên, CĐT, đơn vị phát triển, loại hình, trạng thái, địa chỉ, quy mô,
  block, số tầng, tổng số căn, diện tích, tiến độ, bàn giao, pháp lý, giá,
  hotline, website, tiện ích nội khu, ghi chú, toạ độ) + Lưu/Huỷ/Xoá. "Xoá dự
  án" phải bấm 2 lần trong 4 giây để xác nhận (không dùng `confirm()` của
  trình duyệt). "Thêm dự án mới": nút trong panel biên tập → bấm lên bản đồ để
  đặt vị trí → mở thẳng form sửa với dữ liệu mặc định
- **AI Score KHÔNG cho sửa trực tiếp** — vẫn hiện trong form (tính lại theo dữ
  liệu đang gõ, xem trước được) nhưng có ghi chú rõ đây là số tự tính, sửa các
  trường khác rồi lưu thì điểm mới tự đổi theo, không có ô nhập điểm tay
- **Kéo marker dự án đang sửa trên bản đồ** (`js/features/projects.js`):
  chỉ marker của dự án đang mở form sửa mới kéo được; kéo chỉ cập nhật bản
  nháp, chưa ghi file cho tới khi bấm "Lưu" trong sidebar
- **Loại hình chỉ chọn được từ `manifest.json`** — đã bỏ "Đất nền" khỏi bảng
  (xem QĐ-18) nên không tạo mới được dự án loại này nữa, không cần lọc lại sau
- **Cập nhật gốc rễ `tools/build-projects.mjs`**: bảng loại trừ
  `KHONG_PHAI_NHA_O` (dùng khi quét ứng viên mới từ OSM) được bổ sung các từ
  khoá phát hiện ở Giai đoạn 8 (công ty, văn phòng, showroom, cơ sở sản xuất,
  trạm khí tượng, kho bạc, khu công nghiệp…) và bỏ hẳn nhánh phân loại "đất
  nền" — CỐ TÌNH không thêm "chợ"/"đền"/"lăng" đứng riêng vì trùng tên khu vực
  phổ biến trong tên chung cư thật ("Chợ Lớn", "Chợ Quán") — nghĩa là lần chạy
  `build-projects.mjs` tiếp theo sẽ không sinh lại đúng loại rác vừa dọn ở
  Giai đoạn 8
- **Sửa 2 lỗi tìm ra khi kiểm thử** (xem QĐ-19):
  1. `sidebar.js`'s `dong()` đệ quy vô hạn khi bị gọi lúc đã đóng sẵn (RangeError
     "Maximum call stack size exceeded") — lỗi CÓ SẴN TỪ TRƯỚC, không phải do
     Project Edit Mode gây ra, nhưng tình cờ phát hiện trong lúc test. Rất có
     thể chính là lỗi "sidebar bị treo" Hoàng từng phản ánh ở yêu cầu refactor
     (mục 6). Đã thêm chốt idempotent.
  2. Sau khi Lưu, hồ sơ vẫn hiện dữ liệu CŨ vì `dayDu` (biến giữ hồ sơ đầy đủ
     trong sidebar.js) không tự tải lại — đã thêm sự kiện `du-an-luu-xong` để
     ép tải lại đúng lúc
- Đã kiểm thử trên máy: sửa từng trường + lưu (xác nhận ghi đúng cả
  `index.json` lẫn `chi-tiet/<id>.json`), Huỷ (không ghi gì), kéo marker (bản
  nháp cập nhật, marker không bật về vị trí cũ khi bản đồ vẽ lại), Xoá (2 lần
  bấm, xác nhận file bị xoá thật), Thêm dự án mới (đặt marker → điền → lưu →
  hiện đúng trong danh mục), mở/đóng sidebar liên tục 5 lần để dò lại lỗi #1 ở
  trên — không còn lỗi console. Đã dọn sạch dữ liệu test khỏi HT Pearl trước
  khi xong việc
- **CHƯA PUSH lên GitHub** — tính năng có khả năng xoá dữ liệu thật, cần Hoàng
  duyệt trước khi đưa lên bản online

---

## 4 · Pending Tasks

### Hoàng làm — Claude không làm thay được

1. **Ghim 9 dự án còn thiếu toạ độ** (mọi dự án trừ HT Pearl, TT AVIO). Mỗi
   dự án ~1 phút bằng cách dán toạ độ Google Maps. Xem `HUONG-DAN-NHAP-DU-AN.md`.
2. **Điền hồ sơ dự án** — ít nhất `phapLy`, `giaTu`, `tongSoCan` để chấm được
   tiêu chí Thanh khoản trong AI Score.
3. **Quyết định về Google Sheet** (QĐ-4 cũ): có dựng lại phần đọc dữ liệu dùng
   chung qua Sheet hay bỏ hẳn, dùng thẳng `index.json` trong repo.
4. **Mở app bằng mắt một lượt trên điện thoại thật** — môi trường Claude chạy
   không dựng khung hình nên không chụp được ảnh màn hình để tự kiểm.
5. Xác nhận điều kiện dùng ảnh nền vệ tinh Esri World Imagery cho mục đích
   thương mại (đang dùng làm một trong ba lựa chọn nền bản đồ).
6. Nếu có quan hệ hoặc quen biết ở Sở Xây dựng / Trung tâm Chuyển đổi số
   TP.HCM: hỏi giúp quyền truy cập ArcGIS FeatureServer (xem mục 10, việc số 0).
7. Nếu biết thêm chi tiết về hướng tuyến metro số 6 đoạn Phú Hữu–Bình Thái
   (tên ga, giao lộ cụ thể): báo lại để ghim toạ độ có căn cứ, giải quyết MT-01.
8. **Duyệt chất lượng 50 hồ sơ vừa nghiên cứu tự động** (xem Giai đoạn 6) trước
   khi dùng để tư vấn khách — đặc biệt "Chung cư 22 Tầng" (độ tin cậy thấp) và
   "Cư xá Đoàn Văn Bơ" (nghi sai vị trí/tên). Sau khi duyệt, báo lại có chạy
   tiếp cho 1.104 ứng viên OSM còn lại hay không (tốn nhiều lượt tra cứu web).
9. **Chọn thứ tự ưu tiên cho đợt "refactor tổng thể"** Hoàng yêu cầu 02/08/2026
   (9 hạng mục lớn, xem nguyên văn trong lịch sử hội thoại phiên này nếu cần):
   mục 1 (lọc dữ liệu theo loại hình) đã làm xong (Giai đoạn 8). CÒN LẠI CHƯA
   LÀM: (2) Project Edit Mode — CRUD đầy đủ cho dự án (tên, CĐT, địa chỉ, giá,
   quy mô…), (3) sửa marker dự án kéo-thả giống chế độ biên tập GIS đã có,
   (4) nút "Kiểm tra dữ liệu" tự dò trùng tên/sai toạ độ/thiếu thông tin/giá
   bất thường, (5) "Developer Mode" tự dò lỗi JS/Promise/Fetch/layer/popup/
   sidebar/memory-leak (lưu ý: dò memory-leak và responsive tự động không khả
   thi đầy đủ với kiến trúc thuần JS hiện tại, cần nói rõ giới hạn), (6) tìm
   và sửa các nút/popup bị treo (Hoàng đã gặp nhưng chưa mô tả cụ thể nút nào —
   cần hỏi lại cụ thể triệu chứng trước khi sửa mù), (7) trang Admin quản lý
   Metro/Ga/Vành đai/tiện ích + Import/Export/Backup/Restore, (8) Undo/Redo
   cho mọi thao tác chỉnh sửa. Đây là khối lượng nhiều phiên làm việc, KHÔNG
   nên làm dồn một lượt rồi tự động đẩy lên — mỗi hạng mục cần Hoàng xem qua
   trước khi làm tiếp, tránh làm hỏng công cụ đang dùng thật.

### Kỹ thuật

8. Sau khi Hoàng ghim xong dự án: chạy `node tools/build-around.mjs` để đo
   tiện ích + khoảng cách metro tiền tính cho các dự án đó.
9. Dựng lại nút xuất ảnh PNG / in A4 cho chế độ gửi khách (có ở v1, chưa có ở
   kiến trúc mới).
10. Bảng tính tài chính trong hồ sơ dự án (vốn ban đầu, vay, trả hằng tháng,
    dư nợ sau 2 năm, tổng chi phí thực) — Hoàng hiện tính tay cho từng khách.
11. Vẽ tuyến đường thật từ dự án tới ga metro / vành đai gần nhất thay vì chỉ
    hiện con số (dùng hình học OSRM trả về).
12. Bổ sung ga metro (Metro số 2 Thủ Dầu Một thiếu 22/24 ga, Metro Bình Dương –
    Suối Tiên thiếu 19/19 ga…) khi có nguồn — bản đồ hướng tuyến MAUR niêm yết
    tại phường Bến Thành, hoặc chờ hồ sơ metro số 6 GĐ1 (MAUR dự kiến phê
    duyệt 6/2026).
13. Vành đai 2 đo được 50,96/64 km hồ sơ (thiếu 20%) — đoạn dùng chung với
    Quốc lộ 1 chưa gộp vào danh sách `osmTen` trong `build-ring-roads.mjs`.
14. Thêm Vành đai 5 khi có quy hoạch: chỉ cần thêm một mục vào mảng `TUYEN`
    trong `tools/build-ring-roads.mjs` rồi chạy lại — kiến trúc đã tính sẵn
    việc mở rộng này (yêu cầu gốc của tính năng vành đai).

---

## 5 · Technical Decisions

Đã thống nhất với Hoàng qua nhiều phiên. **Không tự ý đảo ngược.**

**QĐ-1 · Chỉ vẽ dữ liệu xác minh được — quan trọng nhất toàn dự án.**
Không nội suy, không ước lượng, không tự đặt vị trí ga/tuyến/dự án. Thiếu thì
ghi "Đang cập nhật" / "Chưa xác minh" và KHÔNG ghim lên bản đồ. Lý do: bản
dựng đầu tiên tự suy dữ liệu, sai ga tới 974 m ngay trên tuyến đang chạy tàu.

**QĐ-2 · Nguồn dữ liệu là OpenStreetMap qua Overpass API.** Không dùng trí
nhớ mô hình, không suy từ tên đường, không nội suy giữa các mốc.

**QĐ-3 · Bốn mức trạng thái tuyến metro:** `operating` → `construction` →
`preparing` → `planned`. Mức `preparing` tách riêng vì với nghề môi giới,
"sắp đào thật trong năm nay" khác hẳn "còn nằm trên giấy" về mặt giá.

**QĐ-4 · Dự án BĐS tách hai nguồn (dùng chung qua Sheet / riêng trên máy).**
⚠️ Chưa dựng lại ở kiến trúc mới — đang chờ Hoàng chốt có làm tiếp hay bỏ.

**QĐ-5 · Không publish thành Artifact trên claude.ai.** Artifact chặn mọi
request ra ngoài; app cần Leaflet CDN và ảnh nền tile → ra trang trắng.

**QĐ-6 · Không mở file trực tiếp từ ổ đĩa.** Giao thức `file://` chặn `fetch`
và module JavaScript. App tự phát hiện và báo tiếng Việt kèm câu lệnh cần chạy.

**QĐ-7 · Email commit dùng địa chỉ ẩn danh**
`311277811+nhhoang220204-beep@users.noreply.github.com` vì repo public.

**QĐ-8 · Hai cấp hành chính.** TP.HCM sau 01/07/2025 chỉ còn thành phố và 168
phường/xã (relation OSM `1973756`). Không còn quận/huyện. Bộ lọc địa bàn dùng
phường/xã, tra bằng point-in-polygon có lọc nhanh bằng khung bao trước.

**QĐ-9 · Bố cục dùng vị trí tuyệt đối, không dùng lưới (CSS Grid).** Bản đồ
chiếm trọn khung, mọi bảng nổi lên trên. Nhờ vậy bản đồ không bao giờ đổi
kích thước khi đóng/mở bảng — chính là lỗi từng làm hỏng chế độ gửi khách ở
bản cũ (xem mục 9, bẫy `grid-template`).

**QĐ-10 · Hai mức tin cậy dữ liệu dự án, hiện công khai.** `nguon: "thu-cong"`
là hồ sơ Hoàng đã kiểm, dùng được để tư vấn. `nguon: "osm"` là ứng viên lấy từ
OpenStreetMap — tên và toạ độ có thật nhưng **chưa biết có đang bán hay
không**, mang nhãn đỏ "Chưa kiểm" ở mọi nơi xuất hiện (danh sách, bong bóng,
đầu hồ sơ). Ứng viên luôn có `trangThai: "chua-ro"` và mọi ô số liệu là "Đang
cập nhật" — công cụ tuyệt đối không đoán giá, chủ đầu tư, pháp lý.

**QĐ-11 · Danh mục dự án tách chỉ mục và hồ sơ chi tiết.** `index.json` nạp
ngay khi mở trang (~280 byte/dự án), `chi-tiet/<id>.json` chỉ tải khi mở đúng
dự án đó. Thêm dự án = thêm một object vào `index.json`, web tự cập nhật,
không cần chạy công cụ nào. Vượt ~10.000 dự án thì chia `index.json` thành
nhiều file khai trong `manifest.chiMuc` — vẫn không cần sửa mã.

**QĐ-12 · Số hiệu tuyến metro theo quy hoạch HIỆN HÀNH (1–10), không theo quy
hoạch 2013.** Quy hoạch 2013 (QĐ 568/QĐ-TTg) có 8 tuyến gồm 3A/3B/4B — **đã bị
thay thế**. Quy hoạch hiện hành (NQ 188/2025/QH15 + QĐ 1125/QĐ-TTg + Đề án Sở
GTVT) đánh số liền mạch 1–10, không còn 3A/3B/4B (đã gộp vào tuyến 3 và 4).
Dữ liệu lập theo số hiệu hiện hành, kèm trường `soHieuCu` để đối chiếu tài
liệu cũ. Ba con số tổng chiều dài khác nhau (582 km / 527 km / 355 km) đều
đúng vì đếm ba phạm vi khác nhau — xem `data/metro/DANH-GIA-DU-LIEU.md` mục 1.

**QĐ-13 · Hướng tuyến metro theo tên đường suy bằng thuật toán đo đạc, không
viết theo trí nhớ.** Rải điểm mẫu dọc hình tuyến, tìm đường có tên gần nhất
(có phạt theo cấp đường để không bám hẻm), gom thành đoạn kèm mốc km. Độ tin
cậy kết quả không thể cao hơn độ tin cậy hình học đầu vào.

**QĐ-14 · Mâu thuẫn dữ liệu phải ghi lại tường minh, không tự chọn một bên
khi chưa có nguồn giải quyết.** Xem cấu trúc `mau_thuan_dang_mo` trong
`data/metro/lines.json` và mã MT-01 ở mục 9.

**QĐ-15 · Lớp Vành đai: mỗi đoạn một trạng thái riêng, suy từ thẻ OSM, không
gán chung cho cả tuyến.** Màu cố định theo trạng thái (xanh lá=hoàn thành,
cam=thi công, vàng=chuẩn bị, đỏ=quy hoạch), đọc từ dữ liệu chứ không viết
cứng trong mã. Thêm tuyến vành đai mới chỉ cần sửa mảng cấu hình trong
`build-ring-roads.mjs`.

**QĐ-16 · Nghiên cứu dữ liệu dự án là việc THỦ CÔNG do Claude làm theo yêu cầu
từng đợt, không phải tính năng tự động chạy trong app.** App tĩnh không
backend không thể tự gọi web search/AI ngay lúc người dùng mở hồ sơ trên điện
thoại — làm vậy cần dựng backend + trả phí AI, phá kiến trúc "không backend,
miễn phí hoàn toàn". Quy trình đúng: Claude tra 5 nguồn theo thứ tự ưu tiên
(website chính thức → fanpage → Facebook Group → web BĐS uy tín → Google
Maps), ghi vào `nguonTheoTruong` (nguồn từng trường) và `nghienCuu` (ngày +
danh sách nguồn đã kiểm) trong `chi-tiet/<id>.json`, rồi giao diện tự hiện
đúng những gì đã ghi — không suy đoán, không giữ nguyên chuỗi "Đang cập nhật"
mơ hồ khi đã thực sự tra mà không thấy gì (đổi thành câu rõ ràng "Chưa tìm
thấy dữ liệu đáng tin cậy từ các nguồn đã kiểm tra."). Không được ghi đè các
khoá do `index.json` quản lý (`nguon`, `trangThai`, `xacMinh`, `ten`, `toaDo`,
`ma`) khi nghiên cứu ứng viên OSM — nghiên cứu chỉ bổ sung số liệu, không tự ý
"thăng hạng" một ứng viên chưa kiểm thành dự án đã xác minh (vi phạm QĐ-10 nếu
làm vậy).

**QĐ-17 · Chế độ biên tập GIS (`js/features/gis-editor.js`) là NGOẠI LỆ có chủ
đích của QĐ-1, chỉ áp dụng khi Hoàng bật nút 🛠, không áp dụng cho chế độ xem
thường.** Hoàng xác nhận rõ: "Website này là công cụ nội bộ để tôi xây dựng cơ
sở dữ liệu, KHÔNG phải website công bố dữ liệu chính thức." Trong chế độ này:
- Được phép đặt marker/polyline ước lượng cho dữ liệu chưa xác minh (ga metro,
  đoạn vành đai), miễn là mang trạng thái riêng (`tamThoi: true` /
  `trangThai: "tam-so-hoa"`), màu riêng (🟡 vàng), và không bao giờ gộp chung
  với dữ liệu đã xác minh
- `tools/serve.mjs` có endpoint ghi file `POST /__luu-du-lieu`, chỉ chạy cục
  bộ (127.0.0.1), chỉ ghi đúng hai file được liệt kê sẵn (`stations.json`,
  `ring_roads.json`) — KHÔNG bao giờ có ở bản GitHub Pages
- Khi Hoàng đã kéo một ga/đoạn vào đúng vị trí thực địa, cần TỰ đổi
  `tamThoi`/`trangThai` sang trạng thái đã xác minh (sửa tay trong file JSON —
  công cụ biên tập không tự "thăng hạng" xác minh) rồi mới dùng để tư vấn khách
- Khúc hở quá lớn để nối bằng đoạn thẳng (>6km, xem Giai đoạn 7) KHÔNG được tự
  động số hoá — phải tự vẽ tay hoặc tra quy hoạch chính thức

**QĐ-18 · Không còn loại hình "Đất nền" trong danh mục dự án.** Bỏ khỏi
`data/projects/manifest.json` (không còn dự án nào dùng), khỏi phân loại tự
động trong `tools/build-projects.mjs` (ứng viên OSM có tên khớp "đất nền"/
"phân lô" giờ bị LOẠI THẲNG thay vì gán nhầm loại), và khỏi `<select>` loại
hình trong Chế độ biên tập GIS — không ai tạo lại được loại này qua giao diện
nữa. Muốn thêm lại thì sửa cả ba chỗ.

**QĐ-19 · Chế độ biên tập GIS (`js/features/project-editor.js`, Giai đoạn 9)
mở rộng sang CRUD dự án BĐS, dùng chung nguyên tắc QĐ-17.** Sửa/xoá/thêm dự án
ghi thẳng vào `data/projects/index.json` + `data/projects/chi-tiet/<id>.json`
qua cùng endpoint cục bộ `POST /__luu-du-lieu` (đã tổng quát hoá, nhận thêm
loại `projects-index` và `projects-chi-tiet` với id kiểm bằng regex). AI Score
KHÔNG có ô sửa tay — luôn tính lại từ dữ liệu đã lưu, sửa trực tiếp điểm sẽ
làm sai lệch ý nghĩa của thang điểm với mọi dự án khác. "Xoá dự án" bắt buộc
xác nhận 2 lần trong 4 giây, không dùng hộp thoại `confirm()` mặc định của
trình duyệt (không khớp phong cách giao diện tự dựng của app).

---

## 6 · Files & Folder Structure

```
D:\Claude Cowork\ABOUT ME\metro-web\        ← THƯ MỤC GIT, đây là bản đẩy lên GitHub Pages
├── index.html                  vỏ trang, không chứa dữ liệu và không chứa logic nghiệp vụ
│
├── css/  (7 file)
│   tokens.css · base.css · layout.css · map.css · panels.css · sidebar.css · client.css
│
├── js/  (22 module, ~5.750 dòng)
│   ├── app.js                  khởi động, nối module, chủ đề sáng/tối
│   ├── core/  (6)               dom · format · geo · store · data · loc — không phụ thuộc Leaflet
│   ├── map/   (3)               engine (bản đồ, ảnh nền, nút điều khiển) · icons · layers (14 lớp)
│   └── features/ (12)           projects · popup · sidebar · score · analysis · amenities ·
│                                 compare · search · panel · clientmode · dodac · vanhdai
│
├── data/                        TOÀN BỘ DỮ LIỆU, sinh bằng tools/, KHÔNG sửa tay (trừ projects/)
│   ├── projects/
│   │   ├── manifest.json        khai báo loại hình, trạng thái, mức tin cậy nguồn
│   │   ├── index.json           chỉ mục 1.165 dự án — SỬA TAY ĐƯỢC, xem HUONG-DAN-NHAP-DU-AN.md
│   │   └── chi-tiet/<id>.json   hồ sơ đầy đủ, 61 file (11 dự án đã kiểm + 50
│   │                             ứng viên OSM đã nghiên cứu thí điểm, xem GĐ6)
│   ├── metro/
│   │   ├── lines.json           sổ đăng ký 10 tuyến + 4 ngoài bộ 10, nguồn + mức tin cậy từng số liệu
│   │   ├── alignment.geojson    hình học tuyến, EPSG:4326, LineString
│   │   ├── ga.geojson / .csv    40 ga xác minh toạ độ
│   │   ├── huong-tuyen.json/.csv  146 phân đoạn "tuyến đi dọc đường nào", kèm mốc km
│   │   └── DANH-GIA-DU-LIEU.md  đánh giá đầy đủ + lộ trình đạt gần 100% chính xác
│   ├── ring_roads.json          3 tuyến vành đai, 53 đoạn, mỗi đoạn 1 trạng thái
│   ├── metro.json, stations.json, routes.json, amenities.json   lớp metro + tiện ích tiền tính
│   └── roads.json, industrial.json, schools.json, hospitals.json, shopping.json,
│       parks.json, water.json, boundaries.json                  12 lớp nền OpenStreetMap
│
├── tools/  (13 file, ~2.610 dòng)
│   ├── lib/osm.mjs              gọi Overpass (có ngưỡng chống trả rỗng), hình học dùng chung
│   │                             (chain, motChieu, boKhucGap, simplify…), ghi/đọc file data/
│   ├── lib/route.mjs            ma trận khoảng cách đường thật qua OSRM
│   ├── build-data.mjs           9 lớp nền từ OpenStreetMap
│   ├── build-projects.mjs       bổ sung ứng viên dự án từ OSM, lọc rác 4 lớp
│   ├── build-around.mjs         tiện ích + khoảng cách metro tiền tính cho từng dự án đã kiểm
│   ├── build-geo.mjs            dựng lại hình tuyến metro gốc (ít khi cần)
│   ├── build-metro-doc.mjs      hồ sơ hướng tuyến metro theo tên đường + GeoJSON
│   ├── build-ring-roads.mjs     lớp đường vành đai, trạng thái từng đoạn
│   ├── export-metro-csv.mjs     xuất CSV cho Excel (dấu ; · UTF-8 BOM)
│   ├── probe-du-an.mjs, probe-huong-tuyen.mjs, probe-vanh-dai.mjs   công cụ dò trước khi dựng
│   ├── serve.mjs                máy chủ tĩnh chạy trên máy (node tools/serve.mjs)
│   └── cache/                   ảnh chụp Overpass thô, ~16 MB, .gitignore bỏ qua
│       └── geo-verified.json    ← NGOẠI LỆ, PHẢI theo repo — nguồn sự thật hình tuyến metro
│
├── README.md                    tổng quan, cách chạy, cách dựng lại dữ liệu
├── HUONG-DAN-NHAP-DU-AN.md       hướng dẫn Hoàng nhập dự án, ghim vị trí, hiểu điểm đánh giá
├── HUONG-DAN-CHIA-SE.md          (di sản v1/Google Sheet — đã dán cảnh báo đầu file, QĐ-4 chưa chốt)
├── BAO-CAO-V2.md                 báo cáo đầy đủ đợt viết lại V2 + mở rộng cơ sở dữ liệu
├── mau-du-an-bds.csv             (di sản v1 — mẫu Google Sheet, chỉ dùng nếu QĐ-4 làm tiếp)
└── BAN-GIAO-DU-AN-METRO.md       file này
```

**`tools/cache/geo-verified.json`** là nguồn sự thật của hình tuyến metro.
Kiểm định: tuyến 1 = 19,6 km / 14 ga (khớp số chính thức 19,7 km, lệch 0,5%).
Muốn cập nhật thì chạy `build-geo.mjs` rồi **đối chiếu lại mốc này trước khi
ghi đè**.

---

## 7 · Coding Standards

**Ngôn ngữ:** toàn bộ comment, tên biến nghiệp vụ, chuỗi giao diện bằng
**tiếng Việt**. Comment giải thích *tại sao*, không mô tả lại code.

**JavaScript:** ES2022 thuần, không transpile, không framework, không thư
viện tiện ích ngoài Leaflet. Hàm ngắn, một việc. `$()` / `$$()` thay cho
`getElementById`. Một trình xử lý sự kiện chung dùng `data-act` thay vì gắn
listener rải rác từng phần tử.

**CSS:** biến ở `:root` cho mọi màu, khoảng cách, bo góc, đổ bóng — không
hardcode giá trị. Thang khoảng cách 4px `--s1`…`--s8`. Đặt tên BEM rút gọn
(`.card`, `.card__body`). Trạng thái dùng thuộc tính `data-*` (`[data-open]`)
thay vì thêm/bớt class.

**Dữ liệu:** không có dữ liệu nào nằm trong mã nguồn JavaScript. Mọi thứ đọc
từ `data/*.json` lúc chạy. Công cụ dựng dữ liệu nằm trong `tools/`, có comment
giải thích rõ nguồn và phương pháp suy luận (nếu có).

**Nguyên tắc chung:**
- Lỗi mạng hay dữ liệu hỏng không được làm chết ứng dụng — luôn có nhánh xử
  lý và thông báo tiếng Việt dễ hiểu.
- Không giữ code chỉ để "chạy được". Không dùng `requestAnimationFrame` cho
  logic khởi động (treo khi tab ẩn).
- Vẽ lại một phần giao diện thì CHỈ cập nhật đúng phần tử đổi — không dựng
  lại cả khối cha (xem mục 9, bẫy "nút mồ côi", xảy ra lặp lại 4 lần trong
  dự án này ở bốn nơi khác nhau).
- Kiến trúc phải tính trước cho việc mở rộng dữ liệu (thêm dự án, thêm tuyến
  vành đai, thêm loại hình) chỉ bằng cách sửa file JSON hoặc mảng cấu hình
  trong `tools/`, không cần sửa logic hiển thị.

---

## 8 · Business Rules

**BR-1 · Ba mức tin cậy dữ liệu tuyến metro, hiển thị công khai.** Huy hiệu
ngay trong danh sách: `14/14 ga` (xanh, đủ), `2/24 ga` (cam, một phần), `0/19
ga` (xám, chưa có).

**BR-2 · Toạ độ ngoài phạm vi bị chặn.** Chỉ chấp nhận vĩ độ 8–12,5 và kinh
độ 105–108,5. Ngoài khoảng báo "Toạ độ không hợp lệ", không ghim. Dán nhầm
đảo cột thì gợi ý đảo lại thay vì chỉ báo lỗi chung chung.

**BR-3 · Khoảng cách hiển thị cho người dùng luôn là đường thực tế (OSRM),
không phải đường chim bay.** Ngoại lệ duy nhất: phần "Mức hưởng lợi từ đường
vành đai" dùng khoảng cách đường thẳng tới tim tuyến vì mục đích là đo mức độ
gần hạ tầng, không phải chỉ đường — phải ghi rõ ngay trên giao diện để không
nhầm với số liệu trong tab Metro.

**BR-4 · Ga trung chuyển.** Ga nằm trong 80 m của nhiều tuyến được coi là ga
trung chuyển, hiện vòng to hơn. Hiện có 8 ga.

**BR-5 · Câu nói khi tư vấn khách.** Luôn dẫn kèm "theo hồ sơ đang niêm yết".
Hướng tuyến vẫn có thể điều chỉnh — tuyến 6 vừa bỏ bớt 1 ga trong tháng
7/2026. Chiều dài, số ga, tốc độ thiết kế đang vênh nhau giữa các nguồn báo chí.

**BR-6 · AI Score chấm 8 tiêu chí độc lập** (Metro, Hạ tầng, Tiện ích, Khả
năng cho thuê, Khả năng tăng giá, An cư, Đầu tư, Thanh khoản). Tiêu chí nào
thiếu đầu vào thì để trống, không hạ xuống 5/10 cho đủ hình. Điểm tổng chỉ
tính trên phần chấm được, luôn hiện "chấm được mấy/8 tiêu chí".

**BR-7 · Ngưỡng đi bộ 2.500 m.** Quá ngưỡng này thì chấm điểm Metro theo
quãng đường đi xe — nói "đi bộ 5 km" với khách là nói một con số không ai dùng.

**BR-8 · Ứng viên dự án từ OpenStreetMap luôn mang nhãn "Chưa kiểm" ở mọi nơi
xuất hiện** (thẻ danh sách, bong bóng bản đồ, đầu hồ sơ chi tiết) và không
bao giờ có số liệu giá/pháp lý/chủ đầu tư tự suy.

**BR-9 · Trạng thái đoạn đường Vành đai theo màu cố định:** xanh lá = đã
hoàn thành, cam = đang thi công (có hiệu ứng nét chạy), vàng = chuẩn bị thi
công, đỏ = quy hoạch (nét đứt). Không đảo trạng thái theo tuyến, luôn theo
từng đoạn.

**BR-10 · Mâu thuẫn dữ liệu giữa nguồn đo được và thông tin thực địa phải ghi
lại đầy đủ hai phía kèm bằng chứng, không tự chọn bên nào khi chưa có nguồn
chính thức giải quyết.** Xem mã MT-01, mục 9.

---

## 9 · Known Issues

### Bẫy dữ liệu OpenStreetMap

**Overpass trả HTTP 200 kèm mảng rỗng** khi truy vấn quá nặng, chỉ báo trong
trường `remark` (không phải mã lỗi HTTP). Đã ghi đè dữ liệu tốt bằng file
rỗng mà không ai biết trong lần đầu gặp. Lớp gọi Overpass (`tools/lib/osm.mjs`)
giờ có ngưỡng số phần tử tối thiểu bắt buộc — **đừng bỏ**.

**`out geom tags` trên relation làm Overpass bỏ hẳn mảng `members`.** Dùng
`out geom` (đã kèm tags sẵn), không thêm `tags` khi truy vấn relation.

**Bộ lọc `area` phải khai báo thành biến** (`area[...]->.hcm;`) rồi mới dùng
trong truy vấn con. Viết lồng trong ngoặc thì Overpass trả rỗng mà không báo lỗi.

**Đường đôi (dual carriageway) bị nối thành vòng đi–về, nhân đôi chiều dài.**
OSM vẽ hai chiều đường lớn thành hai way riêng. Hàm nối chuỗi (`chain()`) ghép
chúng ở điểm giao thành một vòng khép kín. Gặp **hai lần trong dự án này**:
metro tuyến 1 (ra 33,8 km thay vì 19,7) và cả ba tuyến Vành đai khi mới dựng
(VĐ4 ra 393 km thay vì ~207, VĐ3 ra 137 thay vì 76,3, VĐ2 ra 156 thay vì ~64).
Luôn xử lý bằng cặp hàm `motChieu()` + `boKhucGap()` trong `tools/lib/osm.mjs`
ngay sau `chain()`.

**Suy hướng tuyến bằng "đường gần nhất tuyệt đối" bị bám vào hẻm** ở khu dân
cư dày (metro không bao giờ chạy dọc hẻm/ngõ). Phải cộng phạt theo cấp đường
trước khi so sánh khoảng cách — trục chính phạt 0, đường nhỏ phạt tăng dần,
hẻm/ngõ phạt rất nặng (+250 m). Xem `PHAT_CAP_DUONG` trong `build-metro-doc.mjs`.

**Truy vấn gộp nhiều tên đường trên khung bao (bbox) lớn có thể treo 45+ phút
không phản hồi**, đặc biệt với tên phố phổ biến (Phạm Văn Đồng, Nguyễn Văn
Linh…) trên bbox toàn vùng. Luôn tách truy vấn theo từng tuyến/nhóm, mỗi
truy vấn dùng bbox thu hẹp riêng cho đúng phạm vi của nó.

### Bẫy lập trình giao diện

**`mảng.length && el(...)` in ra chữ "0"** khi mảng rỗng, vì `append()` chỉ
bỏ qua `null`/`false`, không bỏ qua số `0`. Luôn viết `mảng.length > 0 && …`.

**Vẽ lại cả khối cha sau mỗi lần bấm làm nút cũ thành "nút mồ côi"** ngoài
cây DOM — bấm liên tiếp nhiều lần thì chỉ lần đầu ăn. Xảy ra lặp lại ở **bốn
nơi khác nhau** trong dự án này: bảng bật/tắt lớp bản đồ, chip bảng so sánh,
dải tab hồ sơ dự án, chip lọc đường vành đai. Quy tắc chung: chỉ cập nhật
đúng phần tử vừa đổi (`setAttribute`, đổi text), không `fill()`/vẽ lại cả khối.

**`grid-template` rút gọn xoá luôn `grid-template-areas`** → bản đồ co về 0
chiều cao, hỏng chế độ gửi khách. Vì vậy bố cục chính không dùng CSS Grid
(QĐ-9), dùng vị trí tuyệt đối.

**`requestAnimationFrame` bị treo khi tab ẩn** → màn hình chờ không bao giờ
tắt, che toàn bộ giao diện. Không dùng rAF cho logic khởi động.

**Ô nhập toạ độ để `type="number"`** → dán chuỗi "10.98, 106.65" từ Google
Maps bị trình duyệt xoá trắng vì không phải một số hợp lệ. Phải `type="text"`
kèm `inputmode="decimal"`.

**Đo khoảng cách tới polyline phải đo tới CẠNH, không phải tới ĐỈNH.** Đo sai
cho kết quả lệch hàng km ở nơi thực tế chỉ vài chục mét (hình tuyến có đoạn
thẳng dài không có đỉnh ở giữa).

**Leaflet nạp từ CDN thiếu thuộc tính `crossorigin`** → mọi lỗi ném ra từ bên
trong Leaflet bị trình duyệt che thành `"Script error."` không dòng, không
tệp, không gỡ được. Luôn thêm `crossorigin=""` vào thẻ `<script>` tải từ CDN
khác domain.

### Vấn đề dữ liệu đang mở, chưa giải quyết

**MT-01 · Mâu thuẫn hướng tuyến metro số 6 đoạn Phú Hữu – Bình Thái.** Xem
`data/metro/lines.json` → `mau_thuan_dang_mo`. Hình học OSM bám hành lang
Vành đai 2 (cách 12 m), cắt vuông góc đường Đỗ Xuân Hợp một lần rồi tách xa
tới 3.744 m. Thông tin thực địa (từ Hoàng, người hoạt động tại khu vực) nói
tuyến đi trên Đỗ Xuân Hợp, ngang khu đô thị The Global City. Phần đã thống
nhất: cả hai đều xác nhận tuyến 6 giao tuyến 1 tại ga Bình Thái (ga này cách
hình tuyến 6 chỉ 61 m, đã đánh dấu trung chuyển). Phần lệch nhau chưa giải
quyết được vì không tra được nguồn công khai mô tả hướng tuyến đoạn này ở
cấp tên đường — Sở Xây dựng đang được giao rà soát chính đoạn này. Chờ hồ sơ
MAUR (dự kiến phê duyệt 6/2026). **Không dùng đoạn này để tư vấn khách cho
tới khi có hồ sơ chính thức.**

**Vành đai 3 — mốc thông xe 30/06/2026 đã qua nhưng không có nguồn xác nhận
đã hoàn thành.** Trạng thái từng đoạn hiện lấy theo thẻ OSM (dữ liệu có thể
trễ so với thực địa). Đã gắn cảnh báo trong `ring_roads.json` và hiện trong
popup — phải kiểm lại trước khi nói với khách.

**Cổng dữ liệu GIS quy hoạch chính thức của TP.HCM có tồn tại nhưng chưa truy
cập được.** `gisxaydung.tphcm.gov.vn/tracuuttqh` (giao diện ArcGIS JS API
4.34) có backend `api-gisxaydung.tphcm.gov.vn` với ArcGIS FeatureServer chứa
lớp quy hoạch đường sắt đô thị. Gọi thẳng vào endpoint trả **HTTP 401 — cần
xác thực**. Đây là con đường đưa toàn bộ hình học metro + vành đai từ mức tin
cậy ★★☆☆☆ lên ★★★★★ nếu xin được quyền — xem việc số 0 ở mục 10. **Không tìm
cách vượt qua lớp xác thực** — phải xin qua đường chính thức.

---

## 10 · Next Priority

Theo thứ tự ưu tiên:

0. **Xin quyền truy cập ArcGIS FeatureServer** của cổng GIS quy hoạch TP.HCM
   (Sở Xây dựng / Trung tâm Chuyển đổi số TP.HCM). Nếu được cấp, gần như toàn
   bộ việc số hoá thủ công hướng tuyến metro/vành đai trở nên không cần thiết.
1. **Hoàng ghim 9 dự án còn thiếu toạ độ** — quyết định công cụ có dùng được
   hay không cho chính công việc hằng ngày của Hoàng.
2. **Chạy `build-around.mjs`** sau khi ghim xong, để tiền tính tiện ích và
   khoảng cách metro cho các dự án đó.
3. **Xin hồ sơ hướng tuyến metro số 6 giai đoạn 1** khi MAUR phê duyệt
   (dự kiến 6/2026) — giải quyết dứt điểm MT-01 và bổ sung 2 ga ngầm sân bay.
4. **Chốt quyết định Google Sheet** (QĐ-4) — làm tiếp hay bỏ hẳn.
5. Chỉ khi các việc trên xong mới tính tới: xuất PNG/in A4, bảng tính tài
   chính, vẽ tuyến đường thật tới ga/vành đai, mở rộng ga metro Bình Dương.

---

## 11 · Important Context

**Về Hoàng:** xưng hô "fen/tui". Thích câu trả lời thẳng, không vòng vo,
không tâng bốc. **Kiểm tra kỹ và bắt lỗi rất nhanh** — từng phát hiện lỗi
tuyến vẽ zigzag chỉ bằng cách nhìn bản đồ, và từng chỉ ra đúng mâu thuẫn
hướng tuyến metro số 6 (xem MT-01) dựa trên hiểu biết thực địa. Khi bị chỉ ra
sai thì phải thừa nhận thẳng, đo bằng số liệu cụ thể, sửa tận gốc chứ không vá.

**Về giọng văn:** xem `anti-ai-writing-style.md` cùng thư mục cha (`ABOUT ME/`).
Tránh câu tường thuật kiểu bản tin, tránh cụm mở dẫn sáo rỗng.

**Về xác thực và bảo mật:** Claude **không được** nhập mật khẩu, token, hay
tạo tài khoản thay Hoàng. Không tìm cách vượt qua lớp xác thực của hệ thống
bên thứ ba (ví dụ cổng ArcGIS 401 ở mục 9) — phải xin quyền qua đường chính
thức. Xác thực Git dùng Git Credential Manager đã lưu; `gh` CLI **chưa** đăng
nhập, không cần thiết vì push vẫn chạy bình thường.

**Bài học lớn nhất xuyên suốt dự án:** mọi lần Claude tự suy dữ liệu từ trí
nhớ (vị trí ga, hướng tuyến, chiều dài) đều dẫn tới sai số nghiêm trọng và bị
phát hiện. Với công cụ đưa thông tin tới khách hàng thật: **tra nguồn trước,
đo đạc bằng thuật toán, dựng sau.** Nếu không tra được thì nói thẳng "chưa
xác minh", đừng đoán — kể cả khi kết quả trông đẹp và hợp lý.

---

## 12 · Reusable Prompts

**Cập nhật dữ liệu tuyến metro từ OpenStreetMap:**
```
Chạy node tools/build-geo.mjs trong metro-web để tải lại dữ liệu OSM và ghi
vào tools/cache/geo-verified.json. Kiểm báo cáo chất lượng: tuyến 1 phải ra
~19,6 km / 14 ga, toàn mạng ~4 khúc gấp >60°, 0 ga lệch khỏi tuyến. Nếu lệch
nhiều so với mốc này thì dừng lại, đừng ghi đè, báo tôi trước.
```

**Dựng lại toàn bộ dữ liệu nền + dự án + metro + vành đai:**
```
Chạy lần lượt trong metro-web:
  node tools/build-data.mjs
  node tools/build-projects.mjs --cache
  node tools/build-metro-doc.mjs --cache
  node tools/build-ring-roads.mjs --cache
Dùng --cache để không gọi lại Overpass nếu ảnh chụp cũ còn dùng được. Báo lại
số liệu tổng: số dự án, số đoạn vành đai, số km hướng tuyến metro đo được.
```

**Đẩy bản cập nhật lên web:**
```
git add -A, commit với message rõ nội dung thay đổi, push lên origin main.
Không cần đăng nhập lại, Git Credential Manager đã lưu. Sau khi push, chờ
GitHub Pages dựng xong (kiểm bằng cách curl lặp lại index.html tới khi thấy
nội dung mới), rồi mở link thật kiểm tra không lỗi console.
```

**Thêm dự án mới vào danh mục:**
```
Thêm một object vào data/projects/index.json theo đúng schema (xem
HUONG-DAN-NHAP-DU-AN.md). Nếu chưa có toạ độ xác minh thì để null, không đoán.
Muốn có hồ sơ đầy đủ thì tạo thêm data/projects/chi-tiet/<id>.json.
```

**Thêm tuyến Vành đai mới (VĐ5…):**
```
Thêm một mục vào mảng TUYEN trong tools/build-ring-roads.mjs: id, tên, màu,
tổng chiều dài kèm nguồn, danh sách tên way OSM (osmTen), rồi chạy lại công
cụ. Nếu biết mốc thời gian/tiến độ chính thức cho từng đoạn thì thêm vào
HO_SO[id] kèm nguồn — không thêm nếu không có nguồn.
```

**Kiểm tra chất lượng hình học tuyến (metro hoặc vành đai):**
```
Đo cho từng tuyến: số khúc bẻ trên 60° giữa các đoạn liên tiếp, khúc gấp lớn
nhất, khoảng cách từ mỗi ga/mốc tới CẠNH gần nhất của hình tuyến (không phải
đỉnh), và đối chiếu tổng chiều dài đo được với chiều dài hồ sơ chính thức —
lệch quá 5-10% là dấu hiệu dữ liệu hỏng (thường là bẫy đường đôi), dừng lại
kiểm tra trước khi ghi đè.
```

**Giải quyết mâu thuẫn dữ liệu (như MT-01):**
```
Tôi có [nguồn/thông tin mới]. Đối chiếu với dữ liệu hiện tại trong
data/metro/lines.json > mau_thuan_dang_mo. Nếu nguồn mới đủ mạnh để kết luận,
cập nhật hình học CÓ CĂN CỨ (không tự vẽ lại theo mô tả suông — cần toạ độ
hoặc tên way OSM cụ thể) và đánh dấu trạng thái đã giải quyết. Nếu chưa đủ
căn cứ, ghi thêm vào phần "hai phía" và giữ nguyên trạng thái CHƯA GIẢI QUYẾT.
```

---

## 13 · TODO Checklist

### Hoàng
- [ ] Ghim toạ độ 9 dự án còn thiếu (xem `HUONG-DAN-NHAP-DU-AN.md`)
- [ ] Điền `phapLy`, `giaTu`, `tongSoCan` cho các dự án đã kiểm
- [ ] Quyết định: làm tiếp phần đọc Google Sheet hay bỏ hẳn (QĐ-4)
- [ ] Mở app trên điện thoại thật, xem bằng mắt một lượt
- [ ] Xác nhận điều kiện dùng ảnh vệ tinh Esri cho mục đích thương mại
- [ ] Hỏi giúp quyền truy cập ArcGIS FeatureServer nếu có quan hệ ở Sở Xây dựng
- [ ] Cung cấp thêm chi tiết hướng tuyến metro 6 đoạn Phú Hữu–Bình Thái nếu biết

### Kỹ thuật
- [ ] Chạy `build-around.mjs` sau khi Hoàng ghim xong dự án
- [ ] Dựng lại xuất ảnh PNG / in A4 cho chế độ gửi khách
- [ ] Bảng tính tài chính trong hồ sơ dự án
- [ ] Vẽ tuyến đường thật (OSRM geometry) từ dự án tới ga/vành đai gần nhất
- [ ] Bổ sung ga Metro số 2 Thủ Dầu Một (22/24), Metro Bình Dương – Suối Tiên (19/19)
- [ ] Bổ sung đoạn Vành đai 2 dùng chung Quốc lộ 1 (thiếu ~13 km so với hồ sơ)
- [ ] Giải quyết MT-01 khi có hồ sơ MAUR tuyến 6 GĐ1
- [ ] Xin quyền ArcGIS FeatureServer — nếu được, số hoá lại toàn bộ hình học
      metro/vành đai theo nguồn chính thức thay vì OpenStreetMap

### Không làm (đã quyết định, đừng lặp lại)
- [x] ~~Publish thành Artifact claude.ai~~ — CSP chặn, ra trang trắng (QĐ-5)
- [x] ~~Tự nội suy vị trí ga hoặc hướng tuyến~~ — vi phạm QĐ-1
- [x] ~~Dùng danh sách tuyến metro 3A/3B/4B~~ — quy hoạch 2013 đã bị thay thế (QĐ-12)
- [x] ~~Gán một trạng thái cho cả tuyến vành đai~~ — vi phạm QĐ-15
- [x] ~~Tự chọn một bên khi có mâu thuẫn dữ liệu chưa rõ~~ — vi phạm QĐ-14
- [x] ~~Tìm cách vượt qua xác thực 401 của ArcGIS~~ — phải xin quyền chính thức

---

## 14 · Starter Prompt cho phiên mới

Sao chép nguyên khối dưới đây vào phiên Claude mới:

```
Tôi đang tiếp tục dự án "Bản đồ tư vấn bất động sản TP.HCM" — web app tĩnh
dùng để tư vấn khách theo dự án, metro và đường vành đai.

Đọc file bàn giao trước khi làm bất cứ việc gì:
D:\Claude Cowork\ABOUT ME\metro-web\BAN-GIAO-DU-AN-METRO.md

Tóm tắt để anh nắm nhanh:
- App đang chạy tại https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/
- Mã nguồn ở D:\Claude Cowork\ABOUT ME\metro-web\ (repo git, remote sẵn sàng)
- 1.165 dự án bất động sản (11 đã kiểm + 1.154 ứng viên OSM "Chưa kiểm")
- 10 tuyến metro theo quy hoạch hiện hành + 3 tuyến Vành đai (2/3/4), mỗi
  đoạn vành đai một trạng thái riêng

QUY TẮC SỐ MỘT, tuyệt đối không vi phạm:
Chỉ vẽ dữ liệu xác minh được. Không nội suy, không ước lượng, không tự đoán
vị trí, hướng tuyến hay số liệu. Thiếu thì hiển thị "Đang cập nhật" / "Chưa
xác minh" và không ghim lên bản đồ. Đây là công cụ đưa thông tin tới khách
hàng thật — sai là đi thẳng tới khách.

Cách làm việc tôi muốn:
- Nói thẳng, không vòng vo, không khen xã giao
- Sai thì thừa nhận, đo bằng số liệu cụ thể, sửa tận gốc chứ đừng vá
- Kiểm tra thật trên trình duyệt trước khi báo xong, đừng nói suông
- Có mâu thuẫn dữ liệu thì ghi lại cả hai phía kèm bằng chứng, đừng tự chọn
  một bên khi chưa có nguồn giải quyết

Việc cần làm tiếp: [điền việc cụ thể — xem mục 10 "Next Priority" trong file
bàn giao nếu chưa có việc cụ thể]
```

---

## 15 · Tham chiếu nhanh

| Thứ | Giá trị |
|---|---|
| Link web | https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/ |
| Repo | https://github.com/nhhoang220204-beep/ban-do-metro-tphcm |
| Nhánh | `main` |
| Thư mục git | `D:\Claude Cowork\ABOUT ME\metro-web\` |
| Chạy trên máy | `node tools/serve.mjs` → http://localhost:5173 |
| Xác thực | Git Credential Manager (đã lưu) · `gh` CLI **chưa** đăng nhập |
| Email commit | `311277811+nhhoang220204-beep@users.noreply.github.com` |
| Dựng lại dữ liệu nền | `node tools/build-data.mjs` |
| Dựng ứng viên dự án | `node tools/build-projects.mjs --cache` |
| Dựng tiện ích + metro cho dự án | `node tools/build-around.mjs [id-du-an]` |
| Dựng hồ sơ hướng tuyến metro | `node tools/build-metro-doc.mjs --cache` |
| Dựng lớp Vành đai | `node tools/build-ring-roads.mjs --cache` |
| Mốc kiểm tra hình học metro | tuyến 1 = 19,6 km / 14 ga · 4 khúc gấp · 0 ga lệch |
| Địa giới TP.HCM | relation OSM `1973756` · 168 phường/xã |
| Định tuyến đi xe | router.project-osrm.org |
| Định tuyến đi bộ | routing.openstreetmap.de/routed-foot |
| Số dự án hiện tại | 1.165 (11 đã kiểm · 1.154 ứng viên OSM) |
| Số đoạn Vành đai | 53 (30 hoàn thành · 17 thi công · 6 quy hoạch) |
| Cổng GIS quy hoạch TP.HCM (cần xin quyền) | api-gisxaydung.tphcm.gov.vn (ArcGIS FeatureServer, hiện 401) |

# 09 · DATA SOURCE RULES

> Dữ liệu đến từ đâu, tin cậy tới đâu, và những bẫy kỹ thuật đã gặp thật khi
> lấy dữ liệu từ nguồn ngoài. Đọc trước khi chạy bất kỳ tool nào trong
> `tools/` hoặc thêm nguồn dữ liệu mới.

## Nguyên tắc tối cao

> *"Chỉ ghi ra dữ liệu OpenStreetMap thực sự có. Không nội suy, không ước
> lượng, không tự đặt toạ độ. Thiếu thì để trống."* — dòng đầu file
> `tools/lib/osm.mjs`, áp dụng cho toàn bộ pipeline dựng dữ liệu.

Đây chính là QĐ-1/QĐ-2 trong lịch sử dự án — không có công cụ nào trong
`tools/` được viết để "đoán cho đẹp" khi thiếu dữ liệu nguồn.

## Nguồn dữ liệu bên ngoài — toàn bộ 3 nguồn, tất cả miễn phí

| Nguồn | Dùng cho | Giấy phép |
|---|---|---|
| **OpenStreetMap qua Overpass API** | Metro, ga, đường bộ, vành đai, KCN, trường, y tế, mua sắm, công viên, sông hồ, địa giới, ứng viên dự án BĐS | ODbL 1.0 |
| **OSRM** (`router.project-osrm.org` đi xe, `routing.openstreetmap.de/routed-foot` đi bộ) | Khoảng cách/thời gian đường thật dự án ↔ ga metro | Dịch vụ công cộng FOSSGIS |
| **Firebase Firestore** (đang thêm, xem [07_LIVE_MODE.md](07_LIVE_MODE.md)) | Lưu trực tiếp trên bản Live — KHÔNG phải nguồn dữ liệu gốc, chỉ là nơi lưu bản sao có thể ghi | Gói Spark miễn phí |

**Không dùng trí nhớ mô hình AI để điền số liệu bản đồ** — mọi con số vị trí/
hướng tuyến/chiều dài phải tra được từ 1 trong các nguồn trên hoặc từ input
trực tiếp của Hoàng (toạ độ dán tay, thông tin nghiên cứu thủ công).

## Hai mức tin cậy dữ liệu dự án — quy tắc hiển thị bắt buộc

`nguon: "thu-cong"` — hồ sơ Hoàng đã kiểm, dùng được để tư vấn khách.
`nguon: "osm"` — ứng viên lấy từ OpenStreetMap: tên và toạ độ có thật nhưng
**chưa biết có đang bán hay không**, mang nhãn đỏ "Chưa kiểm" ở MỌI nơi xuất
hiện (danh sách, bong bóng, đầu hồ sơ). Ứng viên luôn `trangThai: "chua-ro"`
và mọi ô số liệu "Đang cập nhật" — tuyệt đối không đoán giá/chủ đầu tư/pháp
lý cho nhóm này. Xem đầy đủ ở [08_MAP_RULES.md](08_MAP_RULES.md) BR-8.

## Nghiên cứu dữ liệu dự án — quy trình thủ công, KHÔNG phải tính năng tự động

App tĩnh không backend không thể tự gọi web search/AI ngay lúc người dùng mở
hồ sơ trên điện thoại — làm vậy cần backend + trả phí AI, phá kiến trúc
"không backend, miễn phí hoàn toàn" (trước khi có Firebase). Quy trình đúng
khi Hoàng yêu cầu nghiên cứu 1 dự án cụ thể:

1. Tra theo **5 nguồn ưu tiên đúng thứ tự**: website chính thức → fanpage →
   Facebook Group → web BĐS uy tín → Google Maps.
2. Ghi vào `nguonTheoTruong` (nguồn riêng cho từng field) và `nghienCuu`
   (ngày + danh sách nguồn đã kiểm) trong `chi-tiet/<id>.json`.
3. Giao diện tự hiện đúng những gì đã ghi — không suy đoán.
4. Không giữ nguyên chuỗi "Đang cập nhật" mơ hồ khi đã thực sự tra mà không
   thấy gì — đổi thành câu rõ ràng: *"Chưa tìm thấy dữ liệu đáng tin cậy từ
   các nguồn đã kiểm tra."*
5. **Không được ghi đè** các khoá do `index.json` quản lý (`nguon`,
   `trangThai`, `xacMinh`, `ten`, `toaDo`, `ma`) khi nghiên cứu ứng viên OSM
   — nghiên cứu chỉ bổ sung số liệu, không tự ý "thăng hạng" ứng viên chưa
   kiểm thành dự án đã xác minh.

## Pipeline dựng dữ liệu — thứ tự chạy

```
BƯỚC 0 — Thăm dò (không ghi file, chỉ để đánh giá trước khi build thật)
  probe-du-an.mjs        → quy mô ứng viên dự án OSM
  probe-vanh-dai.mjs     → OSM có hình học vành đai không (chạy TRƯỚC build-ring-roads)
  probe-huong-tuyen.mjs  → thử thuật toán suy hướng tuyến (chạy TRƯỚC build-metro-doc)

BƯỚC 1 — Hình học metro gốc (chỉ chạy khi cần CẬP NHẬT hình tuyến)
  build-geo.mjs → gọi Overpass, kiểm định (audit), ghi vào index.html (const GEO = ...)
  ⚠ Output phải COPY THỦ CÔNG vào tools/cache/geo-verified.json sau khi đối
    chiếu mốc kiểm định — geo-verified.json là "ảnh chụp OSM đã qua kiểm
    định chất lượng", build-data.mjs throw lỗi nếu file này không tồn tại.

BƯỚC 2 — Lớp dữ liệu nền (phụ thuộc geo-verified.json + boundaries.json)
  build-data.mjs
    ├─ buildMetro()      → data/metro.json, data/stations.json
    ├─ buildRoads()      → data/roads.json  (cần data/boundaries.json để cắt theo địa giới thật —
    │                       chạy lần đầu khi boundaries.json chưa có sẽ cảnh báo và bỏ qua bước cắt,
    │                       nên chạy lại `build-data.mjs roads` sau khi có boundaries.json)
    ├─ buildBoundaries() → data/boundaries.json
    ├─ buildPoi() ×5     → industrial/schools/hospitals/shopping/parks.json
    └─ buildWater()      → data/water.json

BƯỚC 3 — Bổ sung metro (phụ thuộc bước 2)
  build-metro-doc.mjs  → data/metro/alignment.geojson, huong-tuyen.json, ga.geojson
  export-metro-csv.mjs → data/metro/*.csv  (CHẠY SAU build-metro-doc.mjs)

BƯỚC 4 — Vành đai (độc lập, chỉ cần Overpass)
  build-ring-roads.mjs        → data/ring_roads.json
  estimate-ring-gaps-tam.mjs  → sửa data/ring_roads.json tại chỗ (CHẠY SAU, chỉ cho GIS editor)

BƯỚC 4b — Ga tạm Bình Dương (độc lập, chỉ cho GIS editor)
  estimate-stations-tam.mjs   → sửa data/stations.json tại chỗ (cần data/metro.json đã có bd1/bd2)

BƯỚC 5 — Danh mục dự án BĐS (độc lập, chỉ cần Overpass + index.json hiện có)
  build-projects.mjs → thêm ứng viên OSM vào data/projects/index.json (không đè bản ghi cũ)

BƯỚC 6 — Dữ liệu "quanh dự án" (PHỤ THUỘC index.json đã có toạ độ + stations.json)
  build-around.mjs → data/amenities.json, data/routes.json
                      (CHỈ dự án nguon:"thu-cong" trừ khi chỉ định id qua đối số —
                       PHẢI CHẠY LẠI SAU MỖI LẦN GHIM DỰ ÁN MỚI)
```

`serve.mjs` KHÔNG thuộc pipeline dựng dữ liệu — là máy chủ dev + API ghi
trực tiếp cho Chế độ biên tập GIS.

## Bẫy dữ liệu OpenStreetMap — đọc trước khi viết Overpass query mới

1. **Overpass trả HTTP 200 kèm mảng rỗng** khi truy vấn quá nặng, chỉ báo
   trong trường `remark` (không phải mã lỗi HTTP). `tools/lib/osm.mjs` có
   ngưỡng số phần tử tối thiểu bắt buộc trước khi chấp nhận kết quả — **đừng
   bỏ ngưỡng này**.
2. **`out geom tags` trên relation làm Overpass bỏ hẳn mảng `members`.** Dùng
   `out geom` (đã kèm tags sẵn), không thêm `tags` khi truy vấn relation.
3. **Bộ lọc `area` phải khai báo thành biến** (`area[...]->.hcm;`) rồi mới
   dùng trong truy vấn con — viết lồng trong ngoặc thì Overpass trả rỗng mà
   không báo lỗi.
4. **Đường đôi (dual carriageway) bị nối thành vòng đi–về, nhân đôi chiều
   dài.** OSM vẽ 2 chiều đường lớn thành 2 way riêng, hàm nối chuỗi
   (`chain()`) ghép chúng thành vòng khép kín. Đã gặp ở: metro tuyến 1 (ra
   33,8km thay vì 19,7km), cả 3 tuyến Vành đai (VĐ4 ra 393km thay vì ~207,
   VĐ3 ra 137 thay vì 76,3, VĐ2 ra 156 thay vì ~64). Luôn xử lý bằng
   `motChieu()` + `boKhucGap()` ngay sau `chain()`.
5. **Suy hướng tuyến bằng "đường gần nhất tuyệt đối" bị bám vào hẻm** ở khu
   dân cư dày. Phải cộng "phạt" theo cấp đường trước khi so khoảng cách —
   hẻm/ngõ phạt +250m, đường residential +60m, motorway/trunk/primary +0m
   (`PHAT_CAP_DUONG` trong `build-metro-doc.mjs`).
6. **Truy vấn gộp nhiều tên đường trên bbox lớn có thể treo 45+ phút không
   phản hồi**, đặc biệt tên phố phổ biến (Phạm Văn Đồng, Nguyễn Văn Linh...).
   Luôn tách truy vấn theo từng tuyến/nhóm, bbox thu hẹp riêng.

## Ngưỡng/quy tắc kỹ thuật khác cần nhớ

- **Khung địa lý**: `BBOX = '10.20,106.20,11.60,107.70'` dùng cho lớp cần
  liền mạch qua ranh tỉnh (đường/vành đai). `AREA_HCM` (relation OSM
  `1973756`) dùng cho lớp điểm/vùng còn lại — KHÔNG dùng bbox vuông cho
  chúng, sẽ kéo theo Long An/Đồng Nai/Lâm Đồng.
- **Toạ độ làm tròn 5 chữ số thập phân** (≈1m) để giảm kích thước file.
- **Mốc kiểm định chất lượng hình học metro** (audit trong `build-geo.mjs`):
  tuyến 1 phải ra ~19,6km/14 ga; toàn mạng ~4 khúc gấp >60°; **0 ga lệch khỏi
  tuyến quá 200m** — nếu có ga lệch, script TỰ ĐỘNG từ chối ghi file.
- **`build-projects.mjs` không bao giờ ghi đè bản ghi đã có**, kể cả khi
  `--reset-osm` — chỉ xoá bản ghi `nguon:"osm"`, không đụng `nguon:"thu-cong"`.
- **`build-around.mjs` chỉ tính cho `nguon:"thu-cong"`** trừ khi chỉ định id
  — tiền tính hết hàng nghìn ứng viên OSM là bất khả thi, app tự đo tại chỗ
  khi mở 1 ứng viên (xem `dodac.js`, [08_MAP_RULES.md](08_MAP_RULES.md)).
- **Ngưỡng nối khúc hở vành đai**: chỉ tự động nối thẳng khúc hở ≤6.000m
  (`estimate-ring-gaps-tam.mjs`); lớn hơn TUYỆT ĐỐI không vẽ (coi là "bịa
  đường"), phải báo Hoàng tự xử lý.
- **Script sửa file tại chỗ phải idempotent**: xoá bản ghi cũ do chính script
  sinh ra (`trangThai:"tam-so-hoa"` hoặc `tamThoi:true`) trước khi sinh lại,
  không đụng dữ liệu đã xác minh.
- **Không còn cấp quận/huyện** trong `boundaries.json` sau sáp nhập
  01/07/2025 — chỉ còn thành phố (`level:4`) và phường/xã (`level:6`).
- **`serve.mjs` chỉ bind `127.0.0.1`**, whitelist cứng file được phép ghi
  qua `POST /__luu-du-lieu` — không nhận đường dẫn tuỳ ý, chỉ dùng máy
  Hoàng, không chạy trên GitHub Pages.

## Cổng dữ liệu GIS chính thức TP.HCM — chưa dùng được

`gisxaydung.tphcm.gov.vn/tracuuttqh` có backend ArcGIS FeatureServer tại
`api-gisxaydung.tphcm.gov.vn` chứa lớp quy hoạch đường sắt đô thị chính
thức. Gọi thẳng endpoint trả **HTTP 401 — cần xác thực**. Đây là con đường
đưa hình học metro/vành đai từ ★★☆☆☆ lên ★★★★★ nếu xin được quyền — xem
[10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md) ưu tiên 0. **KHÔNG tìm cách
vượt qua lớp xác thực** — phải xin qua đường chính thức (Sở Xây dựng/Trung
tâm Chuyển đổi số TP.HCM).

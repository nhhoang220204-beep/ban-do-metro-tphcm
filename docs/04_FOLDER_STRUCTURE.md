# 04 · FOLDER STRUCTURE

> Bản đồ thư mục đầy đủ, cập nhật 07/08/2026. Dùng để tra "file này nằm ở
> đâu" nhanh mà không cần `find`/`ls` lại toàn bộ repo mỗi lần.

```
D:\Claude Cowork\ABOUT ME\metro-web\        ← THƯ MỤC GIT, bản đẩy lên GitHub Pages
│
├── index.html                  vỏ trang — không chứa dữ liệu, không chứa logic nghiệp vụ
│
├── docs/                        ← BỘ NHỚ DÀI HẠN DỰ ÁN (file này thuộc đây)
│   01_PROJECT_OVERVIEW.md · 02_ARCHITECTURE.md · 03_CODING_RULES.md
│   04_FOLDER_STRUCTURE.md · 05_DATABASE_STRUCTURE.md · 06_UI_UX_RULES.md
│   07_LIVE_MODE.md · 08_MAP_RULES.md · 09_DATA_SOURCE_RULES.md
│   10_PROJECT_ROADMAP.md · 11_TODO.md · 12_CHANGELOG.md
│   13_BUG_TRACKER.md · 14_SESSION_SUMMARY.md · 15_ABOUT_PROJECT.md
│
├── css/  (7 file, xem chi tiết đầy đủ ở 06_UI_UX_RULES.md)
│   tokens.css   toàn bộ design token (màu, spacing, radius, shadow, z-index, font, transition)
│   base.css     reset + style thẻ HTML gốc (body, scrollbar, focus...)
│   layout.css   bố cục tuyệt đối của topbar/panel/sidebar/editor/mapctl/legend/boot
│   map.css      style riêng cho Leaflet override (marker, popup, tile filter theme)
│   panels.css   style bảng trái (danh sách/lớp/lọc), bảng so sánh, search, toast
│   sidebar.css  style hồ sơ dự án bên phải (8 tab, form sửa, criteria bar)
│   client.css   style Chế độ gửi khách + @media print
│
├── js/  (22 module, ~5.750 dòng — xem trách nhiệm từng file ở 02_ARCHITECTURE.md)
│   app.js                      điểm khởi động, nối mọi module, đổi theme, xử lý phím tắt toàn cục
│   core/  (6 file)              dom · format · geo · store · data · loc · luu-local
│   │                            KHÔNG phụ thuộc Leaflet, KHÔNG phụ thuộc map/ hay features/
│   map/   (3 file)              engine (bản đồ, tile nền, nút điều khiển) · icons · layers (14 lớp)
│   └── features/ (16 file)      projects · popup · sidebar · project-editor · score · analysis ·
│                                 amenities · compare · search · panel · clientmode · vanhdai ·
│                                 gis-editor · dodac · data-checker · dev-mode
│
├── data/                        TOÀN BỘ DỮ LIỆU, sinh bằng tools/, KHÔNG sửa tay (trừ projects/)
│   │                            Xem schema đầy đủ từng file ở 05_DATABASE_STRUCTURE.md
│   ├── projects/
│   │   ├── manifest.json        khai báo loại hình (7), trạng thái (4), mức tin cậy nguồn (2)
│   │   ├── index.json           chỉ mục 1.148 dự án — SỬA TAY ĐƯỢC, xem HUONG-DAN-NHAP-DU-AN.md
│   │   └── chi-tiet/<id>.json   hồ sơ đầy đủ, 145 file (dự án đã kiểm + một số ứng viên OSM
│   │                             đã nghiên cứu thí điểm)
│   ├── metro/
│   │   ├── lines.json           sổ đăng ký 10 tuyến chính thức + 4 tuyến ngoài bộ 10, nguồn + mức tin cậy
│   │   ├── alignment.geojson    hình học tuyến metro, EPSG:4326, LineString
│   │   ├── ga.geojson / ga.csv  81 ga, toạ độ xác minh
│   │   ├── huong-tuyen.json/.csv  hồ sơ "tuyến đi dọc đường nào", kèm mốc km
│   │   ├── tuyen.csv            xuất Excel của lines.json
│   │   └── DANH-GIA-DU-LIEU.md  đánh giá chất lượng dữ liệu metro + lộ trình cải thiện
│   ├── ring_roads.json          3 tuyến vành đai (VĐ2/3/4), mỗi ĐOẠN 1 trạng thái riêng
│   ├── metro.json                dữ liệu vận hành cho bản đồ (10 tuyến có hình học, khác lines.json)
│   ├── stations.json             81 ga, kèm cờ tamThoi cho ga chưa xác minh (GIS editor)
│   ├── routes.json               khoảng cách dự án → ga metro theo đường thật (tiền tính OSRM)
│   ├── amenities.json            tiện ích quanh từng dự án cụ thể (tiền tính)
│   └── roads.json, industrial.json, schools.json, hospitals.json, shopping.json,
│       parks.json, water.json, boundaries.json     8 lớp nền OpenStreetMap (ODbL 1.0)
│
├── tools/  (15 file .mjs, ~2.610 dòng — xem chi tiết pipeline ở 05_DATABASE_STRUCTURE.md)
│   ├── lib/osm.mjs              gọi Overpass (chống trả rỗng), hình học dùng chung, ghi/đọc file data/
│   ├── lib/route.mjs            ma trận khoảng cách đường thật qua OSRM
│   ├── build-data.mjs           9 lớp nền OpenStreetMap (metro/stations/roads/POI×5/boundaries/water)
│   ├── build-projects.mjs       bổ sung ứng viên dự án từ OSM vào index.json, lọc rác 4 lớp
│   ├── build-around.mjs         tiện ích + khoảng cách metro tiền tính (chỉ dự án nguon:"thu-cong")
│   ├── build-geo.mjs            tái tạo GEO gốc hình học metro, ghi vào index.html
│   ├── build-metro-doc.mjs      hồ sơ hướng tuyến metro theo tên đường + GeoJSON
│   ├── build-ring-roads.mjs     dựng data/ring_roads.json từ Overpass
│   ├── export-metro-csv.mjs     xuất CSV cho Excel (dấu `;` · UTF-8 BOM)
│   ├── estimate-ring-gaps-tam.mjs   nối tạm khúc hở ngắn ≤6km giữa các đoạn vành đai
│   ├── estimate-stations-tam.mjs    sinh ga tạm cho tuyến Bình Dương (nội suy đều theo hình học)
│   ├── probe-du-an.mjs, probe-huong-tuyen.mjs, probe-vanh-dai.mjs   công cụ thăm dò trước khi dựng
│   ├── serve.mjs                máy chủ tĩnh cục bộ (node tools/serve.mjs) + API ghi file GIS editor
│   └── cache/                   ảnh chụp Overpass thô, ~16 MB, .gitignore bỏ qua
│       └── geo-verified.json    ← NGOẠI LỆ, PHẢI theo repo — nguồn sự thật hình tuyến metro
│
├── README.md                    tổng quan, cách chạy, cách dựng lại dữ liệu
├── HUONG-DAN-NHAP-DU-AN.md       hướng dẫn Hoàng nhập dự án, ghim vị trí, hiểu điểm đánh giá
├── HUONG-DAN-CHIA-SE.md          (di sản v1/Google Sheet — QĐ-4 chưa chốt, xem 10_PROJECT_ROADMAP.md)
├── HUONG-DAN-FIREBASE.md         hướng dẫn 6 bước tạo Firebase — đang thực hiện dở, xem 07_LIVE_MODE.md
├── BAO-CAO-V2.md                 báo cáo đầy đủ đợt viết lại V2 + mở rộng cơ sở dữ liệu (lịch sử)
├── BAN-GIAO-DU-AN-METRO.md       tài liệu bàn giao gốc — vẫn giữ, chi tiết hơn 15 file docs/ này,
│                                  đặc biệt phần lịch sử QĐ-1 đến QĐ-20 kèm bối cảnh đầy đủ
└── mau-du-an-bds.csv             (di sản v1 — mẫu Google Sheet, chỉ dùng nếu làm tiếp QĐ-4)
```

## Quy ước quan trọng về thư mục `data/`

- **KHÔNG sửa tay** bất kỳ file nào trong `data/` TRỪ `data/projects/index.json`
  và `data/projects/chi-tiet/*.json` (2 file này được thiết kế để sửa tay
  hoặc qua GIS editor). Mọi file khác sinh ra từ `tools/`, sửa tay sẽ bị ghi
  đè ở lần chạy tool tiếp theo và không ai biết vì sao dữ liệu "tự đổi".
- `tools/cache/geo-verified.json` là **ngoại lệ đặc biệt** — dù nằm trong
  `tools/cache/` (thư mục thường bị `.gitignore`), file này BẮT BUỘC phải
  theo repo vì nó là nguồn sự thật đã kiểm định cho hình học metro. Đừng xoá
  nhầm khi dọn cache.
- `tools/cache/*.json` còn lại là ảnh chụp Overpass thô, có thể xoá và tải
  lại bất cứ lúc nào bằng `--cache` flag của các script tương ứng (không
  dùng `--cache` thì gọi Overpass mới).

## Quy ước thư mục `docs/`

15 file đánh số `01`–`15` để giữ thứ tự đọc gợi ý, nhưng không bắt buộc đọc
tuần tự — mỗi file độc lập, có thể tra thẳng theo nhu cầu (xem bảng điều
hướng ở [01_PROJECT_OVERVIEW.md](01_PROJECT_OVERVIEW.md)). Liên kết chéo
giữa các file dùng markdown link tương đối (`[tên](0X_FILE.md)`) để mở được
cả trên GitHub lẫn trình soạn thảo local.

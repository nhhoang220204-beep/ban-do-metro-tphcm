# 05 · DATABASE STRUCTURE

> "Cơ sở dữ liệu" ở đây là các file JSON tĩnh trong `data/`, không phải SQL/
> NoSQL server (ngoại lệ đang thêm: Firestore, xem
> [07_LIVE_MODE.md](07_LIVE_MODE.md)). File này là schema tham chiếu chính
> thức — đọc trước khi sửa cấu trúc bất kỳ file dữ liệu nào.

## 1 · `data/projects/manifest.json`

Sổ khai báo — app đọc file này trước, dùng để biết loại hình/trạng thái/mức
tin cậy nào hợp lệ, và tải các file trong `chiMuc`.

```
phienBan: 2
chiMuc: ["index.json"]        ← khi vượt ~10.000 dự án, chia nhỏ thành nhiều
                                 file và liệt kê hết ở đây, app tự tải song song và gộp
chiTiet: "chi-tiet/{id}.json" ← pattern đường dẫn hồ sơ chi tiết
```

**`loaiHinh`** — 7 loại khai báo, mỗi loại `{nhan, glyph, mau}`:

| mã | nhãn | glyph | màu |
|---|---|---|---|
| `can-ho` | Căn hộ | 🏢 | `#1d4ed8` |
| `chung-cu` | Chung cư | 🏬 | `#4f46e5` |
| `nha-pho` | Nhà phố | 🏘 | `#0f766e` |
| `nha-pho-thuong-mai` | Nhà phố thương mại | 🏪 | `#0891b2` |
| `shophouse` | Shophouse | 🏬 | `#0284c7` |
| `biet-thu` | Biệt thự | 🏡 | `#15803d` |
| `khu-do-thi` | Khu đô thị | 🏙 | `#7c3aed` |

`dat-nen` (đất nền) **đã bị loại bỏ hẳn** khỏi danh sách (Giai đoạn 8, xem
[12_CHANGELOG.md](12_CHANGELOG.md)) — không tạo lại được qua giao diện; muốn
thêm lại phải sửa cả 3 chỗ: `manifest.json`, `tools/build-projects.mjs`
(bảng loại trừ), `<select>` trong `project-editor.js`.

**`trangThai`** — 4 trạng thái, mỗi trạng thái `{nhan, mau, lop}`:

| mã | nhãn | màu | class CSS |
|---|---|---|---|
| `dang-ban` | Đang bán | `#1d4ed8` | `badge--info` |
| `sap-mo-ban` | Sắp mở bán | `#b45309` | `badge--warn` |
| `da-ban-giao` | Đã bàn giao | `#15803d` | `badge--ok` |
| `chua-ro` | Chưa rõ | `#64748b` | *(không có)* |

**`nguon`** — 2 mức tin cậy:

| mã | nhãn | tin cậy | dùng được để tư vấn? |
|---|---|---|---|
| `thu-cong` | Hồ sơ đã kiểm | cao | có |
| `osm` | Ứng viên từ OpenStreetMap | chưa-kiem | KHÔNG — phải tự kiểm trước |

## 2 · `data/projects/index.json`

Mảng JSON, **1.148 object** (11 `thu-cong` + 1.137 `osm`). Mỗi object là bản
ghi tóm tắt đủ để vẽ marker.

| field | kiểu | null? | ý nghĩa |
|---|---|---|---|
| `id` | string | không | slug định danh duy nhất, khớp tên file `chi-tiet/{id}.json` |
| `ma` | string | có thể rỗng | mã viết tắt hiển thị trên marker |
| `ten` | string | không | tên dự án |
| `loaiHinh` | string | không | 1 trong các mã ở mục 1 |
| `toaDo` | `[lat,lng]`\|null | **có** — `xacMinh:"chua-ghim"` thì null | toạ độ ghim |
| `xacMinh` | string | không | `osm` \| `thu-cong` \| `chua-ghim` |
| `trangThai` | string | không | 1 trong 4 mã ở mục 1 |
| `chuDauTu` | string | có thể rỗng | tên chủ đầu tư |
| `giaTu` | number\|null | **có** | giá khởi điểm, đơn vị theo `donViGia` |
| `donViGia` | string | không | `trđ/m²` \| `trđ/căn` \| `trđ/m² đất` |
| `nguon` | string | không | `thu-cong` \| `osm` |
| `coChiTiet` | boolean | không | có file `chi-tiet/{id}.json` tương ứng không |
| `nguonToaDo` | string | field optional | mô tả nguồn gốc toạ độ (VD: `"Google Maps · ghim tự động ... chưa kiểm thực địa"`) |

## 3 · `data/projects/chi-tiet/<id>.json`

145 file. Hồ sơ đầy đủ — mở rộng thêm so với `index.json`:

| field | kiểu | null? | ý nghĩa |
|---|---|---|---|
| `diaChi` | string | có thể rỗng | địa chỉ đầy đủ |
| `quyMo` | string | có thể rỗng | quy mô (text tự do: diện tích đất, số block, tổng vốn...) |
| `block` | string | có thể rỗng | số lượng/tên block |
| `tongSoCan` | string | có thể rỗng | tổng số căn (dạng text, VD "1.538 căn hộ") |
| `soTang` | string | có thể rỗng | số tầng |
| `banGiao` | string | có thể rỗng | thời điểm/tình trạng bàn giao (text tự do) |
| `phapLy` | string | có thể rỗng | tình trạng pháp lý |
| `giaTrungBinh` | number\|null | **có** | giá trung bình |
| `dienTich` | string | có thể rỗng | diện tích căn (VD "49-138 m²") |
| `logo` | string | có thể rỗng | URL/đường dẫn logo |
| `anh` | array | mặc định `[]` | ảnh dự án (chưa có dữ liệu thực nào tới nay) |
| `matBang` | array | mặc định `[]` | mặt bằng (chưa có dữ liệu thực nào tới nay) |
| `lichThanhToan` | array\<`{dot,moc,soTien,tyLe}`\> | mặc định `[]` | lịch thanh toán |
| `hotline` | string | có thể rỗng | SĐT liên hệ |
| `website` | string | có thể rỗng | URL website chính thức |
| `donViPhatTrien` | string | có thể rỗng | đơn vị phát triển (khác chủ đầu tư) |
| `tienDo` | string | có thể rỗng | tiến độ xây dựng/kinh doanh |
| `tienIchNoiKhu` | array\<string\> | mặc định `[]` | tiện ích nội khu |
| `ghiChu` | string | có thể rỗng | ghi chú tổng hợp — thường chứa disclaimer nguồn giá |
| `nguonTheoTruong` | object | optional | map `field → mô tả nguồn`, cho từng trường cụ thể (VD `giaTu`, `phapLy`, `toaDo`...) |
| `nghienCuu` | `{ngay, nguonDaKiem[]}` | optional | ngày nghiên cứu + mảng mã nguồn đã kiểm (`website-chinh-thuc`, `fanpage`, `facebook-group`, `web-bds`, `google-maps`, `bang-gia-moi-gioi`, `openstreetmap`) |

Ghi chú giá phổ biến trong `ghiChu`: *"Giá THAM KHẢO, CHƯA VAT, lấy từ bảng
lưu hành trong giới môi giới — chưa đối chiếu bảng giá chính thức của chủ
đầu tư. Phải kiểm lại trước khi báo giá cho khách."* — đây là quy ước dữ
liệu, không phải quy tắc code, nhưng quan trọng khi tư vấn.

## 4 · `data/metro.json` — dữ liệu vận hành cho bản đồ

```
{ meta, trangThai: {operating, construction, preparing, planned} (mỗi mục có nhan+mau),
  lines: [ {id, name, route, color, status, docStations, docKm, alias, km, shape, soGa, statusLabel} ] }
```
- `shape`: mảng nhiều đoạn `[[lat,lng],...]` (polyline, đã giản lược
  Douglas-Peucker).
- `docStations`/`docKm`: số liệu "chính thức" khai tay, có thể null.
- `km`/`soGa`: đo được thật từ hình học OSM (`geo-verified.json`).
- 10 tuyến trong `lines`: `m1, m2, m2tt, bd2, bd1, m6, m3, m7, tt, cg` — đây
  là tập tuyến **có hình học** để vẽ, khác với ID trong `metro/lines.json`
  (dùng số hiệu chính thức M1–M10).

## 5 · `data/metro/lines.json` — sổ đăng ký tuyến chính thức (tài liệu tham chiếu)

⚠️ Cảnh báo trong `meta.canh_bao_quan_trong`: quy hoạch 2013 (QĐ 568/QĐ-TTg,
8 tuyến gồm 3A/3B/4B) **ĐÃ BỊ THAY THẾ**. Quy hoạch hiện hành đánh số liền
mạch **1–10** theo Nghị quyết 188/2025/QH15 + Đề án phát triển hệ thống
đường sắt đô thị TP.HCM.

- `meta.van_ban_goc`: 4 văn bản pháp lý gốc, mỗi văn bản có `tinCay` (thang 1-5).
- `mau_thuan_dang_mo`: mâu thuẫn dữ liệu CHƯA GIẢI QUYẾT (ví dụ MT-01, xem
  [13_BUG_TRACKER.md](13_BUG_TRACKER.md)).
- `tuyen`: **10 tuyến chính thức M1–M10**, mỗi tuyến:
  `{ma, so, soHieuCu, ten, loai(xuyen-tam|vanh-dai), mau, huongTuyen{giaTri,nguon,tinCay},
    chieuDai{den2035Km,toanTuyenKm,nguon,tinCay}, trangThai, idTrongApp,
    hinhHocOSM{co,kmDoDuoc,gaCoToaDo,tinCay}, thieu[]}`.
- `tuyen_ngoai_bo_10`: 4 tuyến KHÔNG thuộc bộ 10 chính thức: `TT-LT` (Thủ
  Thiêm–Long Thành), `BT-CG` (Bến Thành–Cần Giờ), `BD-2` (Metro Thủ Dầu Một),
  `BD-1` (Metro Bình Dương–Suối Tiên).

## 6 · `data/stations.json`

```
{ meta, stations: [ {id, name, slug, c:[lat,lng], lines:[...], interchange:boolean, tamThoi?} ] }
```
81 ga. `lines` tham chiếu 9 giá trị id tuyến. 8 ga `interchange:true` (ga
trung chuyển, gộp theo ngưỡng 80m, không theo tên trùng). `tamThoi:true`
đánh dấu ga do Chế độ biên tập GIS sinh, chưa xác minh — xem
[07_LIVE_MODE.md](07_LIVE_MODE.md).

## 7 · `data/ring_roads.json`

```
{ meta, trangThai: {hoan-thanh, dang-thi-cong, chuan-bi, quy-hoach,
    chua-xac-minh, tam-so-hoa} (mỗi mục: nhan, mau, net, thuTu, hieuUng?),
  tuyen: [ {id, name/ten, mau, tongDaiKm{...}, tongDoDuocKm, theoTrangThai{},
    tyLeHoanThanh, ghiChuTuyen, tienDo, canhBao, nguon, source, tinCay,
    ngayCapNhat, soDoan, doan:[...]} ] }
```

3 tuyến: `vd2` (64km, tỷ lệ hoàn thành 41.4%), `vd3` (76.3km, 40.3%), `vd4`
(207km quy hoạch qua 5 tỉnh thành, 0%).

Mỗi `doan[]` (đoạn):
```
{id, tuyenId, tenTuyen, name, segment, tenDoan, diemDau, diemCuoi,
 aliasDiemDau, aliasDiemCuoi, duongThucTe, trangThai, status, trangThaiHoSo,
 mau, daiKm, daiHoSoKm, tienDo, tienDoPhanTram, ngayKhoiCong, duKienHoanThanh,
 ghiChu, canXacMinh, nhanTam, source, nguonHoSo, tinCayHoSo, nguonHinhHoc,
 ngayChupOSM, ngayCapNhat, soDiem, polyline, coordinates}
```
Trạng thái đặc biệt `tam-so-hoa` (nét chấm) — do
`tools/estimate-ring-gaps-tam.mjs` sinh, KHÔNG phải dữ liệu đã kiểm.

## 8 · Các lớp nền OSM còn lại trong `data/`

| file | ~kích thước | mảng chính | field mẫu |
|---|---|---|---|
| `amenities.json` | 122 KB | `{meta, banKinh:[500,1000,2000,5000], nhom:{13 nhóm}, duLieu:{[projectId]:{capNhat, diem:[{id,name,nhom,c,chimBay,diBo?,diXe?}]}}}` | tiện ích quanh TỪNG dự án cụ thể (tiền tính) |
| `boundaries.json` | 244 KB | `units:[{id,name,slug,level,rings}]` | 169 đơn vị hành chính, `level` 4 (thành phố) hoặc 6 (phường/xã) |
| `hospitals.json` | 29 KB | `items:[{id,name,slug,c,kind,diaChi?}]` | 178 điểm |
| `industrial.json` | 95 KB | `items:[{id,name,slug,c,kind,poly}]` | 278 khu công nghiệp |
| `parks.json` | 66 KB | `items:[{id,name,slug,c,kind,poly}]` | 281 công viên |
| `roads.json` | 71 KB | `loai:{ring,expressway,highway}, roads:[{id,name,ref,kind,km,shape}]` | 23 trục đường lớn |
| `routes.json` | 3 KB | `duLieu:{[projectId]:{gaGanNhat:{...}, cacGa:[{id,name,lines,c,diBo{m,giay},diXe{m,giay}}]}}` | dự án → ga metro, đường thật (OSRM) |
| `schools.json` | 341 KB | `items:[{id,name,slug,c,kind}]` | 1.839 trường học |
| `shopping.json` | 105 KB | `items:[{id,name,slug,c,kind,diaChi?}]` | 834 điểm mua sắm |
| `water.json` | 356 KB | `song:[{id,name,slug,kind,km,shape}], ho:[{id,name,slug,c,poly}]` | 237 sông/kênh + 394 hồ |

Tất cả dùng chung khối `meta: {nguon: "OpenStreetMap · Overpass API",
giay_phep: "ODbL 1.0", ngay_chup}`.

## Quy ước dữ liệu chung

- Hệ toạ độ EPSG:4326 (WGS84), format `[lat, lng]` (GeoJSON output đảo thành
  `[lng, lat]` theo chuẩn GeoJSON — chú ý khi đọc file `.geojson`).
- Toạ độ làm tròn 5 chữ số thập phân (≈ sai số 1m) để giảm kích thước file.
- Field không có dữ liệu: string rỗng `""` hoặc `null` tuỳ field — tuân theo
  bảng schema ở trên, không tự đổi quy ước.

Xem pipeline dựng dữ liệu (`tools/*.mjs`, thứ tự chạy, phụ thuộc lẫn nhau)
và quy tắc nguồn dữ liệu ở [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md).

# 08 · MAP RULES

> Quy tắc nghiệp vụ + kỹ thuật bản đồ: business rules (BR-1 đến BR-10), công
> thức AI Score đầy đủ, cách vẽ/gom cụm marker, cách tính khoảng cách. Đọc
> trước khi sửa logic bản đồ hoặc điểm đánh giá.

## Business Rules — quy tắc nghiệp vụ bắt buộc

**BR-1 · Ba mức tin cậy dữ liệu tuyến metro, hiển thị công khai.** Huy hiệu
ngay trong danh sách: `14/14 ga` (xanh, đủ), `2/24 ga` (cam, một phần), `0/19
ga` (xám, chưa có).

**BR-2 · Toạ độ ngoài phạm vi bị chặn.** Chỉ chấp nhận vĩ độ 8–12,5 và kinh
độ 105–108,5 (`GIOI_HAN` trong `core/geo.js`). Ngoài khoảng báo "Toạ độ
không hợp lệ", không ghim. Dán nhầm đảo cột thì gợi ý đảo lại thay vì chỉ
báo lỗi chung chung.

**BR-3 · Khoảng cách hiển thị cho người dùng luôn là đường thực tế (OSRM),
không phải đường chim bay.** Ngoại lệ duy nhất: "Mức hưởng lợi từ đường vành
đai" dùng khoảng cách đường thẳng tới tim tuyến vì mục đích là đo mức độ gần
hạ tầng, không phải chỉ đường — phải ghi rõ ngay trên giao diện để không
nhầm với số liệu trong tab Metro.

**BR-4 · Ga trung chuyển.** Ga nằm trong 80m của nhiều tuyến được coi là ga
trung chuyển, hiện vòng to hơn. Hiện có 8 ga.

**BR-5 · Câu nói khi tư vấn khách.** Luôn dẫn kèm "theo hồ sơ đang niêm
yết". Hướng tuyến vẫn có thể điều chỉnh. Chiều dài/số ga/tốc độ thiết kế
đang vênh nhau giữa các nguồn báo chí.

**BR-6 · AI Score chấm 8 tiêu chí độc lập.** Tiêu chí nào thiếu đầu vào thì
để trống, không hạ xuống 5/10 cho đủ hình. Điểm tổng chỉ tính trên phần chấm
được, luôn hiện "chấm được mấy/8 tiêu chí". Công thức đầy đủ ở mục dưới.

**BR-7 · Ngưỡng đi bộ 2.500m.** Quá ngưỡng này thì chấm điểm Metro theo
quãng đường đi xe — "đi bộ 5km" với khách là nói một con số không ai dùng.

**BR-8 · Ứng viên dự án từ OpenStreetMap luôn mang nhãn "Chưa kiểm"** ở mọi
nơi xuất hiện (thẻ danh sách, bong bóng bản đồ, đầu hồ sơ chi tiết) và không
bao giờ có số liệu giá/pháp lý/chủ đầu tư tự suy.

**BR-9 · Trạng thái đoạn Vành đai theo màu cố định:** xanh lá = hoàn thành,
cam = đang thi công (hiệu ứng nét chạy), vàng = chuẩn bị thi công, đỏ = quy
hoạch (nét đứt). Không đảo trạng thái theo tuyến, luôn theo từng đoạn.

**BR-10 · Mâu thuẫn dữ liệu giữa nguồn đo được và thông tin thực địa phải
ghi lại đầy đủ hai phía kèm bằng chứng, không tự chọn bên nào khi chưa có
nguồn chính thức giải quyết.** Xem mã MT-01 ở
[13_BUG_TRACKER.md](13_BUG_TRACKER.md).

## AI Score — công thức đầy đủ (`js/features/score.js`)

**Nguyên tắc:** mỗi điểm thành phần phải truy ngược được về dữ liệu đo đạc
thật. Tiêu chí thiếu đầu vào → `null`, giao diện hiện "Đang cập nhật" — KHÔNG
hạ xuống 5/10, KHÔNG lấy điểm tiêu chí khác lấp vào. *"Đây là thang tham
khảo do công cụ tính, không phải thẩm định giá."*

**8 tiêu chí và trọng số** (`TIEU_CHI`):

| id | Nhãn | Trọng số |
|---|---|---|
| `metro` | Metro | 1.15 |
| `haTang` | Hạ tầng | 1.10 |
| `tienIch` | Tiện ích | 1.00 |
| `choThue` | Khả năng cho thuê | 1.05 |
| `tangGia` | Khả năng tăng giá | 1.15 |
| `anCu` | An cư | 1.00 |
| `dauTu` | Đầu tư | 1.10 |
| `thanhKhoan` | Thanh khoản | 0.95 |

**Công thức tổng**: `tong = Σ(diem_i × trong_i) / Σ(trong_i)` chỉ tính trên
tiêu chí có `diem != null`, làm tròn 1 chữ số thập phân. Không tiêu chí nào
chấm được → `tong = null`. Luôn trả kèm `soTieuChi / tongTieuChi (=8)`.

Hàm dùng chung: `theoMoc(x, moc)` — nội suy tuyến tính trên bảng mốc
`[ngưỡng, điểm]` tăng dần, kẹp theo biên nếu ngoài mốc. `kep(n)` = clamp
0-10.

### 1. Metro
`gaCua(duAn).gaGanNhat`. Ngưỡng đi bộ "đi bộ được": ≤2500m (`DI_BO_TOI_DA`,
khớp BR-7). Trong ngưỡng → mốc đi bộ `[[400,10],[800,9],[1200,8],[2000,6.5],
[3000,5],[5000,3.5],[8000,1.5]]`; ngoài ngưỡng → mốc đi xe
`[[800,9],[1500,8],[2500,6.5],[4000,5],[7000,3.5],[12000,1.5]]`. Nhân hệ số
trạng thái tuyến `{operating:1, construction:0.85, preparing:0.7,
planned:0.55}` (lấy max các tuyến qua ga, tối thiểu 0.55). Cộng thêm 0.4 nếu
ga trung chuyển. `diem = kep(base × heSo + thuong)`.

### 2. Hạ tầng
Khoảng cách tới CẠNH hình tuyến đường bộ (`distToShape`, KHÔNG phải đỉnh —
xem `core/geo.js`) trong bán kính 5km. Không có trục nào → `1.5` cố định.
Mốc: `[[600,10],[1200,8.7],[2000,7.4],[3000,6],[5000,4.2]]`. Cộng
`(soLoaiTrục-1) × 0.45` cho mỗi loại trục khác nhau (ring/expressway/highway)
trong bán kính.

### 3. Tiện ích
Đếm số NHÓM tiện ích (không phải tổng điểm) trong ngưỡng `2000m`. Không có
nhóm nào → `1.5` cố định. `phu = (soNhomCoMat/tongNhom) × 8.2` (tổng nhóm
mặc định 13). `day = theoMoc(soDiem, [[3,0],[10,0.8],[25,1.4],[50,1.8]])`.
`diem = kep(phu + day)`.

### 4. Khả năng cho thuê
`dKcn = theoMoc(soKcn,[[0,1.5],[1,5],[2,6.8],[4,8.3],[8,9.5]])`;
`dDaoTao = theoMoc(soDaoTao,[[0,0],[2,0.6],[6,1.1],[12,1.5]])`;
`dSong = theoMoc(soAnUong,[[0,0],[5,0.4],[15,0.8],[30,1.1]])`;
`dMetro = diemMetro × 0.12`. `diem = kep(dKcn×0.72 + dDaoTao + dSong + dMetro)`.

### 5. Khả năng tăng giá
`dSapCo = theoMoc(soTuyenSapCo(construction/preparing trong 3km),[[0,0],[1,3.4],[2,4.6],[3,5.2]])`;
`dDangChay = diemMetro × 0.28`;
`dVanhDai = theoMoc(khoangCach,[[1000,2.2],[3000,1.5],[6000,0.6]])` nếu
vành đai/cao tốc ≤6km;
`duDia = theoMoc(diemTienIch,[[3,1.2],[6,0.7],[9,0.2]])` (nghịch — tiện ích
càng mỏng, dư địa càng lớn). `diem = kep(dSapCo + dDangChay + dVanhDai + duDia)`.

### 6. An cư
`d = theoMoc(truong,...) + theoMoc(yTe,...) + theoMoc(cho,...) + theoMoc(congVien,...)`
(trong 2km) `− tru` (trừ nếu KCN trong 1km, `theoMoc(kcnTrong1km,[[0,0],[1,1.2],[3,2.1]])`).

### 7. Đầu tư
Tổng hợp — chỉ tính khi CẢ 4 trục (`choThue, tangGia, metro, haTang`) đều có
điểm, không thì `null`. `diem = kep(choThue×0.3 + tangGia×0.35 + metro×0.2 + haTang×0.15)`.

### 8. Thanh khoản
Phụ thuộc pháp lý/giá/quy mô nguồn hàng — **không đoán nếu thiếu**. Thiếu
bất kỳ trường nào trong (`phapLy`, `giaTu`/`giaTrungBinh`, `tongSoCan`) →
`null`. `dQuyMo = theoMoc(soCan,[[100,8],[400,8.6],[900,7.6],[2000,6.4],[4000,5.2]])`
(mặc định 6.5 nếu không parse được). `dViTri = (diemMetro_hoặc_5 + diemTienIch_hoặc_5)/2`.
`phapLyTot` = regex `/sổ hồng|sổ đỏ|đã có sổ|cấp sổ/i` khớp `phapLy`.
`diem = kep(dQuyMo×0.35 + dViTri×0.45 + (phapLyTot ? 2 : 0.9))`.

### Nhãn tổng điểm (`nhanDiem`)
`null`→"Chưa đủ dữ liệu"; ≥8.5→"Rất tốt" (xanh); ≥7→"Tốt" (xanh); ≥5.5→"Khá"
(vàng); ≥4→"Trung bình" (vàng); <4→"Thấp" (đỏ).

`sao()`: thang 10 → 5 sao (làm tròn nửa sao). `radar()`: vẽ SVG tay (không
dùng thư viện chart) — tiêu chí `null` vẽ ở tâm nhưng đánh dấu riêng (chấm
nhỏ hơn, xám) để không "nói dối là điểm 0".

## Phân tích mức hưởng lợi Vành đai (`js/features/vanhdai.js` → `danhGiaHuongLoi`)

Đo khoảng cách **đường thẳng tới cạnh gần nhất của đoạn** (không phải đỉnh),
phạm vi 8km. `HE_SO_TRANG_THAI`: `hoan-thanh:1, dang-thi-cong:0.8,
chuan-bi:0.65, quy-hoach:0.45, chua-xac-minh:0.3`. Điểm gốc theo khoảng cách:
`≤1000m→10, ≤2000m→8.5, ≤3500m→7, ≤5000m→5.5, ≤8000m→3.5, else→1.5`.
`diem = kep(goc × heSo)`. Mỗi tuyến chỉ giữ đoạn gần nhất. Nếu đoạn chưa
`hoan-thanh` → `canhBao`: *"Lợi ích hạ tầng là kỳ vọng, chưa hiện hữu — nói
rõ với khách."*

## Cách vẽ/gom cụm marker dự án (`js/features/projects.js`)

**Quy tắc vị trí — không được tự đổi:** ứng dụng KHÔNG BAO GIỜ tự sinh toạ độ
cho dự án. Toạ độ chỉ đến từ 2 nguồn: đối tượng cùng tên trong OSM, hoặc
người dùng tự bấm lên bản đồ/dán từ Google Maps. Lý do: bản dựng đầu tiên
từng tự suy vị trí từ trí nhớ mô hình, đặt sai gần 1km.

**Thuật toán gom cụm**: lọc theo khung nhìn (`bounds.pad(0.3)`), gom cụm
dưới `ZOOM_TACH_CUM = 15` khi >24 dự án trong khung, trần `TRAN_GHIM = 300`
marker riêng lẻ. Gom theo **lưới pixel** (không phải lưới toạ độ — ô toạ độ
cố định to bằng cả quận ở zoom nhỏ, vụn vô nghĩa ở zoom lớn). Cạnh ô bắt đầu
`O_CUM_PX = 64`, tăng ×1.6 tới khi số cụm ≤`CUM_TOI_DA = 90` hoặc cạnh >600.
Dự án đang chọn/trong bảng so sánh luôn vẽ ưu tiên, kể cả vượt trần. Tâm cụm
= trung bình toạ độ (không phải tâm ô hình học).

**Bẫy khi kéo marker đang sửa**: vẽ theo toạ độ BẢN NHÁP (`banNhap()?.toaDo`),
không phải dữ liệu đã lưu — nếu vẽ theo gốc, mỗi lần bản đồ vẽ lại sẽ kéo
marker bật ngược về vị trí cũ.

## Đo khoảng cách metro tại chỗ (`js/features/dodac.js`)

Sàng sơ bộ 6 ga gần nhất bằng chim bay, rồi gọi OSRM table API 2 lần song
song (xe: `router.project-osrm.org`, bộ: `routing.openstreetmap.de/routed-foot`),
timeout 12s. Chỉ đo GA METRO tại chỗ — KHÔNG đo tiện ích tại chỗ (tiện ích
cần 13 truy vấn Overpass/dự án, quá chậm cho trải nghiệm mở hồ sơ). Kết quả
nhớ localStorage (`docDoDac`/`ghiDoDac`), tự vô hiệu nếu toạ độ dự án đổi.

## Quản lý lớp bản đồ

Xem chi tiết kỹ thuật (14 lớp, lazy-render, canvas vs SVG) ở
[02_ARCHITECTURE.md](02_ARCHITECTURE.md) mục "Quản lý lớp bản đồ". Nguyên
tắc nghiệp vụ liên quan: **Vành đai vẽ theo trạng thái từng ĐOẠN, không theo
tuyến** (BR-9) — chú thích (`veChuThich`) cũng phải theo trạng thái, không
theo tuyến, nếu không sẽ "nói dối" ý nghĩa màu trên bản đồ.

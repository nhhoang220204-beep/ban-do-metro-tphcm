# Đánh giá dữ liệu mạng Metro TP.HCM

**Ngày:** 01/08/2026 · **Phạm vi:** toàn mạng đường sắt đô thị TP.HCM

Tài liệu này không phải bản tổng hợp đẹp. Nó nói thẳng dữ liệu nào có thật,
dữ liệu nào không có, và làm gì để lấp chỗ trống.

---

## 1 · Xung đột lớn nhất — phải xử lý trước mọi việc khác

### Danh sách tuyến được yêu cầu trộn hai thế hệ quy hoạch

Yêu cầu nêu: **1, 2, 3A, 3B, 4, 4B, 5, 6, 7, 8, 9, 10**.

Đây là hai bộ số hiệu khác nhau ghép lại:

| Nhóm | Nguồn | Tình trạng |
|---|---|---|
| 1, 2, **3A, 3B**, 4, **4B**, 5, 6 | **Quyết định 568/QĐ-TTg** ngày 08/04/2013 — 8 tuyến, ~220 km | **Đã bị thay thế** về phần đường sắt đô thị |
| 1 → 10 liền mạch | Quy hoạch hiện hành: **QĐ 1125/QĐ-TTg** (11/06/2025) + **NQ 188/2025/QH15** (19/02/2025) + Đề án ĐSĐT của Sở GTVT (05/2024) | Đang hiệu lực |

**Trong quy hoạch hiện hành KHÔNG CÒN tuyến 3A, 3B, 4B.** Tuyến 3A và 3B cũ được
gộp/vẽ lại thành **tuyến 3** (Hiệp Bình Phước – An Hạ). Tuyến 4B cũ nhập vào
**tuyến 4**. Bù lại xuất hiện các tuyến **7, 8, 9, 10** chưa từng có năm 2013.

**Vì vậy bộ dữ liệu lập theo số hiệu hiện hành 1–10**, kèm trường `soHieuCu` để
đối chiếu tài liệu trước 2024. Dựng theo danh sách 12 tuyến trong yêu cầu sẽ tạo
ra một mạng lưới không tồn tại trong bất kỳ văn bản nào.

### Ba văn bản gốc, ba con số khác nhau — và đều đúng

| Văn bản | Số tuyến | Tổng chiều dài | Vì sao khác |
|---|---|---|---|
| QĐ 1125/QĐ-TTg (11/06/2025) | **12 tuyến đường sắt đô thị** | ~582 km | Đếm cả 1 nhánh đường sắt ngoại ô và 1 tuyến tramway/LRT. Cơ cấu: 8 metro xuyên tâm + 2 metro vành đai + 1 nhánh ngoại ô + 1 LRT |
| Đề án ĐSĐT — Sở GTVT (05/2024) | **10 tuyến metro** | ~510–527 km | Chỉ đếm metro, bỏ LRT và nhánh ngoại ô |
| NQ 188/2025/QH15 (19/02/2025) | **7 tuyến** | 355 km đến 2035 | Chỉ là nhóm ưu tiên giai đoạn 2026–2035, không phải toàn mạng |

Ba con số 582 / 510 / 355 **không mâu thuẫn** — chúng đếm ba thứ khác nhau. Bất
kỳ tài liệu nào nói "TP.HCM có X tuyến metro" mà không nêu văn bản gốc đều là
thông tin không dùng được.

### Điểm vênh chưa giải quyết được

1. **Tuyến 7 xếp giai đoạn nào.** NQ 188 xếp tuyến 7 vào nhóm 7 tuyến triển khai
   2026–2035. Đề án Sở GTVT lại xếp tuyến 7 vào giai đoạn 2 (2035–2045). Chưa tra
   được văn bản nào giải thích.
2. **Chiều dài tuyến 10.** Đề án ghi 87,84 km; nguồn khác ghi ~84 km. Chênh 3,84 km.
3. **QĐ 1125 phê duyệt TRƯỚC ngày sáp nhập.** Quyết định ký 11/06/2025, sáp nhập
   Bình Dương và Bà Rịa – Vũng Tàu vào TP.HCM có hiệu lực 01/07/2025. Nên phạm vi
   của QĐ 1125 là TP.HCM cũ 2.095 km², **chưa gồm** hai tuyến metro Bình Dương.
   Chưa tìm được văn bản quy hoạch hợp nhất sau sáp nhập.

---

## 2 · Dữ liệu đang có thật

### 2.1 · Hình học tuyến — nguồn OpenStreetMap

| Có hình học | Không có hình học |
|---|---|
| Tuyến 1, 2, 2-nhánh Thủ Thiêm, 3, 6, 7 | **Tuyến 4, 5, 8, 9, 10** |
| Thủ Thiêm – Long Thành, Bến Thành – Cần Giờ | |
| Metro số 2 Thủ Dầu Một, Metro Bình Dương – Suối Tiên | |

**Kiểm định đã làm — hai phép đối chứng độc lập:**

| Tuyến | Đo từ hình học OSM | Số liệu văn bản | Lệch |
|---|---|---|---|
| Tuyến 1 (Bến Thành – Suối Tiên) | 19,6 km | 19,7 km (MAUR) | **0,5%** |
| Tuyến 6 giai đoạn 1 (Tân Sơn Nhất – Phú Hữu) | 22,8 km | 22,85 km (Đề án / UBND TP) | **0,2%** |

Hai tuyến khác hẳn nhau về tình trạng — một đang chạy tàu, một mới chuẩn bị khởi
công — mà cùng khớp dưới 1%. Đây là bằng chứng hình học OSM bám khá sát hồ sơ,
ít nhất ở mức tổng chiều dài.

Toàn mạng còn 4 khúc bẻ trên 60° và đều là góc rẽ thật. 0 ga lệch khỏi hình tuyến.

**Lưu ý:** khớp tổng chiều dài KHÔNG có nghĩa là khớp từng mét hướng tuyến. Hai
đường khác nhau vẫn có thể cùng độ dài.

**Mức tin cậy phải phân biệt rõ:**

- **★★★★★ tuyến 1** — đang chạy tàu, OSM khớp thực địa.
- **★★★☆☆ tuyến 2** — đang thi công, hướng tuyến đã cố định.
- **★★☆☆☆ các tuyến quy hoạch** — OSM là do người dùng vẽ lại từ bản đồ công bố.
  Sai số hàng chục mét, và hướng tuyến còn thay đổi: tuyến 6 vừa bỏ bớt một ga
  trong tháng 7/2026.

### 2.2 · Toạ độ ga

**40 ga vật lý có toạ độ xác minh** (49 lượt gán tuyến, chênh 9 là do 8 ga trung
chuyển được đếm ở nhiều tuyến).

| Tuyến | Ga có toạ độ | Ga theo hồ sơ | Thiếu |
|---|---|---|---|
| Tuyến 1 | **14** | 14 | 0 ✅ |
| Tuyến 2 (Bến Thành–Tham Lương) | 2 | 10 | 8 |
| Thủ Thiêm – Long Thành | 18 | 19 | 1 |
| Metro số 2 Thủ Dầu Một | 2 | 24 | 22 |
| Metro Bình Dương – Suối Tiên | 0 | 19 | 19 |
| Bến Thành – Cần Giờ | 0 | 6 | 6 |
| Tuyến 3, 6, 7 | 0 | chưa rõ | toàn bộ |
| Tuyến 4, 5, 8, 9, 10 | 0 | chưa rõ | toàn bộ |

**Chỉ tuyến 1 có đủ ga.** Mọi tuyến khác thiếu từ một phần tới toàn bộ.

### 2.3 · Hướng tuyến theo đường phố — suy ra được từ dữ liệu

Đây là phần yêu cầu nhấn mạnh nhất, và là phần **không được phép viết theo trí
nhớ**. Cách làm đã dựng thành công cụ `tools/build-metro-doc.mjs`:

> Rải điểm mẫu cách nhau 150 m dọc hình tuyến → tìm con đường **có tên** gần nhất
> mỗi điểm trong bán kính 70 m → gom các điểm liên tiếp cùng tên thành một đoạn
> kèm mốc km → bỏ đoạn ngắn hơn 300 m vì đó là cắt ngang chứ không phải chạy dọc.

#### Kết quả toàn mạng

Đã chạy cho **10 tuyến có hình học · 299,3 km · 146 phân đoạn**:

| Tuyến | Km | Phân đoạn | Không xác định | Tỷ lệ |
|---|---|---|---|---|
| Tuyến 1 | 19,3 | 11 | 0,0 | **0%** |
| Tuyến 2 | 10,4 | 5 | 0,0 | **0%** |
| Tuyến 2 nhánh Thủ Thiêm | 5,4 | 3 | 0,0 | **0%** |
| Metro số 2 Thủ Dầu Một | 21,8 | 10 | 0,0 | **0%** |
| Metro Bình Dương – Suối Tiên | 28,9 | 11 | 0,0 | **0%** |
| Tuyến 6 | 22,8 | 12 | 1,7 | 7% |
| Tuyến 7 | 48,3 | 30 | 7,5 | 16% |
| Tuyến 3 | 43,4 | 26 | 8,8 | 20% |
| Thủ Thiêm – Long Thành | 46,0 | 18 | 15,1 | 33% |
| Bến Thành – Cần Giờ | 53,0 | 20 | 28,1 | 53% |
| **Tổng** | **299,3** | **146** | **61,2** | **20%** |

Tỷ lệ "không xác định" cao ở hai tuyến cuối là **đúng, không phải lỗi**: Cần Giờ
băng qua rừng ngập mặn và sông, Thủ Thiêm – Long Thành cắt qua đồng ruộng — những
nơi đó không có đường có tên nào để bám.

#### Ba phép tự kiểm chứng

Kết quả suy ra **khớp với hành lang thật đã biết**, đây là bằng chứng phương pháp
đúng chứ không phải trùng hợp:

- **Tuyến 2** ra `Trường Chinh → Cách Mạng Tháng Tám`, lệch trung bình **2–12 m**.
  Đúng chính xác hành lang tuyến 2 Bến Thành – Tham Lương.
- **Tuyến 3** ra `Quốc lộ 13 → Xô Viết Nghệ Tĩnh → Nguyễn Thị Minh Khai → Hùng
  Vương → Hồng Bàng → Kinh Dương Vương → Vành đai 3`. Đây đúng là hành lang tuyến
  3B cũ nối vào hành lang 3A cũ — **tự xác nhận việc gộp 3A + 3B thành tuyến 3**.
- **Tuyến 1** ra `Xa lộ Hà Nội → Song Hành → Nguyễn Văn Bá → Võ Nguyên Giáp →
  Cầu Sài Gòn`, 0 km không xác định.

#### Hai giới hạn phải biết

1. **Chỗ không có trục đường lớn, thuật toán bám vào con hẻm gần nhất.** Ví dụ
   tuyến 6 km 5,22–5,64 ra "Hẻm 83 Đường Số 22" — metro không chạy dọc hẻm, đó
   chỉ là way có tên gần nhất. Đọc kết quả phải nhìn cột `lechTrungBinhM`: lệch
   trên 30 m thì nên nghi ngờ.
2. **Độ tin cậy kết quả không thể cao hơn độ tin cậy hình học đầu vào.** Tuyến 1
   và 2 thì ★★★★★ / ★★★☆☆. Tuyến quy hoạch vẫn chỉ ★★☆☆☆ dù kết quả trông đẹp.

---

## 3 · Dữ liệu KHÔNG có, và vì sao

### 3.1 · Dữ liệu GIS chính thức CÓ TỒN TẠI — nhưng cần xác thực

Đây là phát hiện quan trọng nhất của đợt rà soát này, và nó thay đổi hẳn hướng đi.

TP.HCM **đã vận hành cổng dữ liệu GIS quy hoạch**, trong đó có lớp **quy hoạch
mạng lưới đường sắt đô thị** và cả dữ liệu hạ tầng khu vực Bình Dương cũ:

| Địa chỉ | Là gì |
|---|---|
| `https://gisxaydung.tphcm.gov.vn/tracuuttqh` | Cổng tra cứu thông tin quy hoạch, giao diện ArcGIS JS API 4.34 |
| `https://api-gisxaydung.tphcm.gov.vn/arcgis/rest/services/` | **ArcGIS FeatureServer** — dữ liệu vector, đúng thứ cần |
| `https://api-gisxaydung.tphcm.gov.vn/arcm/rest/services/` | ArcGIS MapServer và ImageServer |
| `https://gisapi.tphcm.gov.vn/` | Hệ thống dữ liệu GIS dùng chung của Thành phố |
| `https://thongtinquyhoach.hochiminhcity.gov.vn/` | Cổng thông tin quy hoạch |

**Đã kiểm ngày 01/08/2026:** các endpoint này đang chạy. Gọi thẳng vào
FeatureServer trả về **HTTP 401 — cần xác thực**. Danh mục dịch vụ cũng bị tắt
với người gọi ẩn danh.

Nghĩa là: **dữ liệu vector chính thức tồn tại và đang được phục vụ**, chỉ là không
mở công khai. Đây là kênh phải đi, chứ không phải số hoá lại từ ảnh.

> **Không tìm cách vượt qua lớp xác thực.** Phải xin quyền truy cập qua đường
> chính thức: Sở Xây dựng TP.HCM hoặc Trung tâm Chuyển đổi số TP.HCM (đơn vị vận
> hành hệ thống GIS dùng chung).
>
> Nếu ArcGIS FeatureServer cho truy cập, dữ liệu ra thẳng **GeoJSON** bằng cách
> thêm `?f=geojson` vào truy vấn `/query` — không phải số hoá thủ công dòng nào.

Cho tới khi có quyền truy cập, mọi hình học trong bộ dữ liệu này là
**OpenStreetMap**, tức là do cộng đồng vẽ lại từ bản đồ công bố — **không phải hồ
sơ thiết kế**. Không được dùng thay bản vẽ kỹ thuật, không được dùng để xác định
ranh giải phóng mặt bằng.

### 3.2 · Không có dữ liệu cấp ga cho tuyến chưa xây

Yêu cầu nêu mỗi ga cần: quận, phường, địa chỉ, loại ga, cửa ga, tuyến bus kết nối.

**Những thứ này chỉ tồn tại với tuyến 1** (đã vận hành), và ngay cả với tuyến 1
cũng không có ở dạng máy đọc được — phải nhập tay từ trang MAUR và HouseLink.

Với tuyến chưa xây, **cửa ga và tuyến bus kết nối chưa được thiết kế**, nên không
có gì để thu thập. Bịa ra là bịa dữ liệu.

### 3.3 · Không có mốc lý trình (km) chính thức

Yêu cầu nêu "bắt đầu tại km nào, kết thúc tại km nào". Mốc lý trình chính thức nằm
trong hồ sơ thiết kế kỹ thuật, không công bố.

Mốc km trong `huong-tuyen.json` là **lý trình tính từ đầu hình học OSM**, không
phải lý trình thiết kế. Đã ghi rõ trong phần `meta` của file. Hai thứ này có thể
lệch nhau vài trăm mét.

### 3.4 · Không có dữ liệu TOD và depot

Chưa tra được nguồn công khai nào nêu ranh giới vùng TOD hay toạ độ depot ở dạng
dùng được. Biết tên một số depot (Long Bình, Tham Lương, Đa Phước) nhưng **không
có toạ độ xác minh**.

---

## 4 · Bảng tổng hợp mức tin cậy

| Hạng mục | Mức | Ghi chú |
|---|---|---|
| Danh sách 10 tuyến và số hiệu | ★★★★★ | NQ 188 + QĐ 1125 |
| Điểm đầu/cuối tuyến 1–7 | ★★★★★ | NQ 188 nêu trực tiếp |
| Điểm đầu/cuối tuyến 8 | ★☆☆☆☆ | **Không tìm được nguồn nào** |
| Điểm đầu/cuối tuyến 9, 10 | ★★☆☆☆ | Báo chuyên ngành, chưa đối chiếu văn bản gốc |
| Chiều dài từng tuyến | ★★★★☆ | Đề án Sở GTVT 05/2024, đọc qua bài tường thuật |
| Hình học tuyến 1 | ★★★★★ | Đo được, khớp số chính thức 0,5% |
| Hình học tuyến 2 | ★★★☆☆ | Đang thi công |
| Hình học tuyến quy hoạch | ★★☆☆☆ | OSM vẽ lại, hướng tuyến còn thay đổi |
| Hình học tuyến 4, 5, 8, 9, 10 | — | **Không có** |
| Toạ độ 14 ga tuyến 1 | ★★★★★ | Đang vận hành |
| Toạ độ ga tuyến khác | ★★☆☆☆ đến — | Thiếu phần lớn |
| Hướng tuyến theo đường phố | Bằng mức tin cậy hình học đầu vào | Suy ra bằng thuật toán, không viết tay |
| Cửa ga, bus kết nối, TOD, depot | — | **Không có** |

---

## 5 · Làm gì để đạt gần 100%

Xếp theo tỷ lệ giá trị trên công sức.

### Nhóm 0 — việc phải làm đầu tiên, thay đổi toàn cục

0. **Xin quyền truy cập ArcGIS FeatureServer của cổng GIS quy hoạch TP.HCM.**
   Xem mục 3.1. Đây là con đường duy nhất đưa hình học tuyến từ ★★☆☆☆ lên
   ★★★★★, và nó bỏ qua toàn bộ công đoạn số hoá thủ công ở mục 5.
   - Đầu mối: **Sở Xây dựng TP.HCM** (chủ quản `gisxaydung.tphcm.gov.vn`) và
     **Trung tâm Chuyển đổi số TP.HCM** (vận hành `gisapi.tphcm.gov.vn`).
   - Xin cụ thể: quyền đọc lớp **quy hoạch mạng lưới đường sắt đô thị**, dạng
     FeatureServer hoặc bản trích xuất GeoJSON/shapefile, hệ EPSG:4326.
   - Nêu rõ mục đích sử dụng. Đây là dữ liệu quy hoạch công khai với người dân,
     nên khả năng được cấp là có thật.
   - **Ước lượng:** nếu được cấp, gần như toàn bộ mục 5 bên dưới trở nên không
     cần thiết, và độ chính xác nhảy thẳng lên gần 100%.

### Nhóm 1 — xin văn bản, giá trị lớn nhất

1. **Hồ sơ hướng tuyến metro số 6 giai đoạn 1.** MAUR được giao phê duyệt trong
   **tháng 6/2026** — tức là đã có hoặc sắp có. Đây là hồ sơ hướng tuyến mới nhất
   của cả mạng. Xin bản vẽ có toạ độ, không xin ảnh chụp.
2. **Bản gốc Đề án phát triển hệ thống đường sắt đô thị TP.HCM** (Sở GTVT, 2024).
   Hiện mọi số liệu chiều dài đang lấy qua bài báo tường thuật. Bản gốc sẽ nâng
   toàn bộ nhóm chiều dài từ ★★★★☆ lên ★★★★★, và nhiều khả năng có luôn điểm
   đầu/cuối tuyến 8 đang thiếu.
3. **Phụ lục bản vẽ QĐ 1125/QĐ-TTg.** Bản chính có sơ đồ mạng lưới. Sở Quy hoạch –
   Kiến trúc TP.HCM (`qhkt.hochiminhcity.gov.vn`) có mục công bố bản vẽ đồ án.
4. **Văn bản quy hoạch hợp nhất sau sáp nhập 01/07/2025** — để biết hai tuyến metro
   Bình Dương được đánh số thế nào trong mạng TP.HCM mới.

### Nhóm 2 — số hoá, làm được ngay không cần xin ai

5. **Số hoá thủ công tuyến 4, 5, 8, 9, 10** từ sơ đồ quy hoạch công bố:
   - Nạp ảnh sơ đồ vào **QGIS**, dùng *Georeferencer* gắn ít nhất 6 điểm khống chế
     là các nút giao nhận dạng được (cầu, vòng xoay, giao lộ lớn).
   - Vẽ tay tuyến bằng lớp LineString, hệ **EPSG:4326**.
   - Xuất GeoJSON, gắn thuộc tính `nguon: "số hoá thủ công"`, `tinCay: 2`.
   - **Bắt buộc giữ mức ★★☆☆☆** cho tới khi đối chiếu được hồ sơ gốc. Số hoá từ
     ảnh có sai số 50–200 m tuỳ tỷ lệ ảnh.
6. **Bổ sung ga qua OpenStreetMap.** Thay vì tự giữ dữ liệu riêng, đóng góp toạ độ
   ga đã xác minh ngược lên OSM. Vừa có ích cho cộng đồng, vừa để công cụ
   `build-geo.mjs` tự lấy về ở lần chạy sau.
7. **Nhập tay dữ liệu cấp ga cho tuyến 1** (14 ga): cửa ga, tuyến bus kết nối,
   phường/xã. Đây là tuyến đang chạy nên thông tin có thật và kiểm chứng được
   bằng cách ra tận nơi.

### Nhóm 3 — kiểm định, để không lặp lại sai lầm cũ

8. **Chạy lại bộ kiểm định hình học sau mỗi lần cập nhật:** số khúc bẻ trên 60°,
   khúc gấp lớn nhất, khoảng cách từ mỗi ga tới **cạnh** hình tuyến (không phải
   tới đỉnh). Mốc đối chiếu: tuyến 1 = 19,6 km / 14 ga / 0 ga lệch.
9. **Đối chiếu chéo chiều dài đo được với chiều dài văn bản** cho mọi tuyến. Lệch
   quá 5% là dấu hiệu hình học sai, phải dừng lại kiểm tra chứ không ghi đè.

### Việc KHÔNG nên làm

- **Đừng nội suy vị trí ga giữa hai mốc đã biết.** Bản dựng đầu tiên của dự án này
  làm đúng vậy và đặt sai tới 974 m, ngay trên tuyến đang chạy tàu.
- **Đừng lấy số liệu từ trang bất động sản làm nguồn gốc.** Dùng được để tìm manh
  mối, nhưng phải truy về văn bản.
- **Đừng gộp ba con số 582 / 510 / 355 km thành một.** Chúng đếm ba phạm vi khác nhau.

---

## 6 · Tệp dữ liệu đã xuất

| Tệp | Nội dung | Định dạng |
|---|---|---|
| `lines.json` | Sổ đăng ký 10 tuyến + 4 tuyến ngoài bộ 10, mỗi số liệu kèm nguồn và mức tin cậy | JSON |
| `alignment.geojson` | Hình học tuyến, EPSG:4326 | GeoJSON FeatureCollection / LineString |
| `ga.geojson` | 40 ga có toạ độ xác minh, EPSG:4326 | GeoJSON FeatureCollection / Point |
| `huong-tuyen.json` | Tuyến đi dọc đường nào, chia đoạn kèm mốc km | JSON |
| `tuyen.csv` · `ga.csv` · `huong-tuyen.csv` | Bản CSV để mở bằng Excel | CSV, phân cách dấu chấm phẩy, UTF-8 có BOM |

Công cụ tái tạo: `tools/build-metro-doc.mjs` và `tools/export-metro-csv.mjs`.

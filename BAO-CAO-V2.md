# Báo cáo bàn giao — Real Estate Investment Map V2

**Ngày:** 31/07/2026 · **Phạm vi:** viết lại toàn bộ từ một file HTML thành ứng dụng có module

---

# PHẦN B · Nâng cấp thành cơ sở dữ liệu toàn diện

> Bổ sung sau phần A. Từ 11 dự án Hoàng đang bán → **1.165 dự án** toàn TP.HCM mới,
> kiến trúc chịu được hàng nghìn.

## B0 · Dữ liệu ở đâu ra — và giới hạn của nó

Không có nguồn công khai nào cho "mọi dự án bất động sản đang bán tại TP.HCM".
Không có API, không có tệp mở. Thứ duy nhất tra được bằng máy là
**OpenStreetMap**: các toà nhà và khu dân cư **có tên, có toạ độ, có thật**.

Nên hệ thống chia dữ liệu làm hai mức tin cậy, hiện rõ ở mọi nơi:

| Mức | Số lượng | Nghĩa |
|---|---|---|
| **Hồ sơ đã kiểm** (`thu-cong`) | 11 | Hoàng nhập, đã kiểm. Dùng để tư vấn khách. |
| **Ứng viên OpenStreetMap** (`osm`) | 1.154 | Tên và toạ độ có thật. **Chưa biết có đang bán hay không.** Nhãn đỏ "Chưa kiểm" ở danh sách, bong bóng, và một dải cảnh báo ngay đầu hồ sơ. |

**Cái tui KHÔNG làm:** không đoán giá, không đoán chủ đầu tư, không đoán pháp lý,
không đoán quy mô, không đoán tình trạng bán. Ứng viên OSM có `trangThai:
"chua-ro"` và mọi ô số liệu đều là "Đang cập nhật". Một toà nhà tên "Chung cư
Vista Verde" trong OSM là toà nhà có thật — nhưng đang bán hay đã bàn giao mười
năm trước thì OSM không biết, và công cụ không được phép đoán thay.

Lấy từ OSM: `building=apartments` (1.346) · `building=residential` (55) ·
`landuse=residential` (800). **Cố tình không lấy** `place=neighbourhood` (4.137)
— đó là tên khu phố, xóm, không phải dự án; đưa vào là nhồi danh mục bằng thứ
không phải dự án.

Sau bốn vòng siết bộ lọc, loại được: mã ký hiệu (`S3.02`, `Lô E2-2`), tên bộ
phận toà nhà (`Tháp A`, `Block D-E`, `Liền Kề 2`), công trình không phải nhà ở
(trụ sở công an, trường, khách sạn), mã căn hộ (`A40.05 Aspen Tower`), và địa
chỉ bị nhét vào ô tên. Từ 2.201 đối tượng thô còn **1.154 ứng viên**.

## B1 · Kiến trúc chịu quy mô

Danh mục tách hai tầng:

```
data/projects/
├── manifest.json     khai báo loại hình, tình trạng, mức tin cậy
├── index.json        CHỈ MỤC — mọi dự án, 279 byte/dự án, nạp ngay khi mở
└── chi-tiet/<id>.json  HỒ SƠ ĐẦY ĐỦ — chỉ tải khi bấm vào đúng dự án đó
```

**Thêm dự án = thêm một object vào `index.json`.** Tải lại trang là thấy. Không
chạy công cụ, không sửa mã. Thêm loại hình mới = thêm một dòng vào
`manifest.json`, bản đồ và bộ lọc tự cập nhật theo.

Vượt khoảng 10.000 dự án thì chia `index.json` thành nhiều file và liệt kê vào
`manifest.chiMuc` — ứng dụng tải song song rồi gộp, cũng không phải sửa mã.

**Bốn kỹ thuật giữ cho nó mượt:**

1. **Gom cụm thích ứng** — ô gom tính theo pixel màn hình, tự nới rộng cho tới
   khi số cụm về dưới 90. Ô cố định 64px thì màn hình 1280×720 chia ra hơn 200 ô,
   dự án rải đều là thành một bức tường chấm tròn.
2. **Lọc theo khung nhìn** — chỉ xét dự án đang nằm trong màn hình.
3. **Danh sách phân trang** — 60 thẻ mỗi lần, có nút xem thêm.
4. **Lọc trước bằng khung bao khi tra phường/xã** — so bốn số trước khi chạy
   phép điểm-trong-đa-giác trên 168 phường.

**Đo thật ở 5.000 dự án** (dữ liệu tổng hợp, đã xoá sau khi đo):

| Phép đo | Kết quả |
|---|---|
| Chỉ mục | 1.444 KB thô (~200 KB sau nén) |
| Vẽ lại bản đồ | 4–11 ms (mức phóng 10 → 16) |
| Số cụm hiện | 42–72 |
| Tra phường/xã cho 5.000 dự án | 413 ms → **17 ms** sau khi thêm khung bao |
| Mở bảng lọc | 11 ms |
| Lọc theo loại hình | dưới 1 ms |
| DOM | ~1.200 nút |

Ở 1.165 dự án thật: khởi động 909 ms, chỉ mục 402 KB, DOM 1.260 nút.

## B2 · Đo khoảng cách cho hàng nghìn dự án

Tiền tính bằng `build-around.mjs` mất vài phút mỗi dự án — nhân với 1.165 thì
không chạy nổi. Nên thêm `js/features/dodac.js`:

- Dự án đã tiền tính → dùng luôn, không gọi mạng.
- Dự án chưa có → **trình duyệt tự đo khi người dùng mở hồ sơ**, hai lệnh gọi
  OSRM (đi bộ + đi xe), rồi nhớ trên máy. Ghim lại chỗ khác thì số đo cũ tự hết
  hiệu lực.

Vẫn là đường thật, không phải chim bay. Đo không được thì "Đang cập nhật".

Tiện ích thì **không** đo tại chỗ: cần 13 truy vấn Overpass mỗi dự án, mỗi truy
vấn hàng chục giây — không thể bắt người dùng ngồi chờ. Phần đó vẫn để công cụ
chạy sẵn cho danh mục đã kiểm.

## B3 · Lỗi phát hiện và sửa trong phần B

| # | Lỗi | Hậu quả | Cách sửa |
|---|---|---|---|
| 14 | Lọc theo khung nhìn chạy trước khi ô bản đồ được bố trí xong | `getBounds()` trả khung rỗng → **không ghim nào hiện lúc mở trang**, phải kéo bản đồ mới thấy | Vẽ trong `map.whenReady()` thay vì gọi thẳng, và nghe thêm sự kiện `resize` |
| 15 | Ô lọc tên nằm trong vùng được vẽ lại | Gõ một ký tự là mất con trỏ, không gõ tiếp được | Đưa ô nhập ra ngoài `.panel__body`, dựng một lần trong HTML |
| 16 | Chip bộ lọc dựng lại cả bảng sau mỗi lần bấm | Bấm liên tiếp hai chip chỉ ăn chip đầu (cùng họ lỗi nút mồ côi đã sửa ở lớp bản đồ, tab hồ sơ, bảng so sánh) | Chỉ đổi thuộc tính của chip vừa bấm; riêng "Xoá bộ lọc" đổi nhiều chip cùng lúc thì mới vẽ lại |
| 17 | "Xoá bộ lọc" không cập nhật trạng thái chip | Bộ lọc đã xoá nhưng chip vẫn hiện đang bật | Vẽ lại bảng lọc sau khi xoá hàng loạt |
| 18 | Bộ lọc chỉ áp cho danh sách, **không áp cho bản đồ** | Ở quy mô nghìn dự án thì lọc gần như vô dụng — vẫn phải nhìn cả rừng ghim | Tách phép lọc ra `js/core/loc.js`, cả danh sách lẫn bản đồ dùng chung |
| 19 | Ô gom cụm cố định 64 px | 250 cụm phủ kín màn hình, không đọc ra chỗ nào dày | Ô tự nới rộng cho tới khi số cụm dưới 90 |
| 20 | Tìm kiếm dựng lại toàn bộ nguồn sau mỗi lần gõ phím | Hàng chục nghìn phép nối chuỗi cho một ký tự | Nhớ lại nguồn, chỉ dựng lại khi danh mục đổi |
| 21 | Rác trong ứng viên OSM: `S3.02`, `Tháp A`, `#3b-7`, trụ sở công an, địa chỉ | Danh mục tư vấn lẫn thứ không phải dự án | Bốn lớp lọc, xem B0. Kiểm lại: 0 tên rác còn sót |

## B4 · Còn hạn chế gì

- **Ứng viên OSM chỉ có tên, toạ độ, loại hình.** Không có giá, chủ đầu tư,
  pháp lý, quy mô — vì OSM không có. Muốn dùng để tư vấn thì Hoàng phải kiểm và
  điền, rồi đổi `nguon` thành `"thu-cong"`.
- **Phân loại loại hình suy từ tên gọi**, không suy từ gì khác. "Chung cư Vista
  Verde" → chung cư. Tên không nói gì thì lấy loại mặc định của nguồn OSM. Có
  thể sai, và sửa được bằng cách đổi một chữ trong `index.json`.
- **Vẫn sót vài tên giống địa chỉ** ("204 Bacu", "246/4a Nguyễn thị Đặng"). Siết
  thêm thì rủi ro loại nhầm tên thật kiểu "Khu dân cư 584 Huỳnh Bá Chánh". Đã
  dừng ở mức này vì tất cả đều mang nhãn "Chưa kiểm".
- **"Căn hộ" và "Chung cư" trong tiếng Việt gần như trùng nghĩa.** Tui quy ước:
  `chung-cu` là toà nhà / khu chung cư, `can-ho` là dự án bán căn hộ lẻ. Ứng viên
  OSM mặc định vào `chung-cu`. Nếu Hoàng muốn gộp làm một thì xoá một dòng trong
  `manifest.json`.
- **Chỉ có TP.HCM mới.** Mở rộng sang tỉnh khác chỉ cần đổi biến `AREA_HCM` trong
  `tools/lib/osm.mjs` rồi chạy lại `build-projects.mjs`.

---

## 0 · Xung đột cần Hoàng quyết

Ba chỗ yêu cầu mới va vào quyết định cũ. Tui xử lý theo hướng an toàn nhất và
nêu ra đây để fen chốt lại.

### XĐ-1 · Ghim vị trí cho dự án chưa xác minh (mục 3) vs QĐ-1

Yêu cầu mới: *"Nếu chưa xác minh ⇒ hiển thị ở vị trí được ghim và tôi có thể
chỉnh lại thủ công."* QĐ-1 cũ: *"Thiếu toạ độ thì không ghim lên bản đồ."*

**Cách tui làm:** ứng dụng **không bao giờ tự sinh toạ độ**. Dự án chưa có vị
trí nằm trong nhóm riêng "Chưa có vị trí", có nút ghim. Hoàng bấm lên bản đồ
hoặc dán toạ độ Google Maps thì mới có ghim, và ghim đó mang viền nét đứt kèm
nhãn "Vị trí tự ghim" ở mọi nơi nó xuất hiện.

Như vậy có luồng ghim thủ công đúng như yêu cầu, mà vẫn không có điểm nào do
máy đoán. Nếu fen muốn máy tự đặt tạm một điểm gần đúng rồi chỉnh sau thì nói,
nhưng tui khuyên không — đó đúng là cách bản v1 sai 1 km.

### XĐ-2 · Dữ liệu tách file JSON (mục 14) vs QĐ-4 đọc Google Sheet

Mục 14 liệt kê `projects.json` là nguồn dự án và không nhắc tới Google Sheet.
QĐ-4 thì đã chốt tách hai nguồn dùng chung / riêng qua bảng tính.

**Cách tui làm:** dựng `data/projects.json` đúng mục 14. **Chưa dựng lại phần
đọc Google Sheet.** Lý do: Sheet đó chưa từng tồn tại nên không test được
end-to-end, mà mục 15 cấm code không chạy thật. Ngoài ra schema dự án v2 có
hơn 20 trường, file CSV mẫu cũ chỉ có 8 cột nên phải thiết kế lại.

**Cần fen quyết:** bỏ hẳn hướng Google Sheet, hay để tui dựng lại trên schema
mới? Nếu dựng lại thì tui cần fen tạo Sheet trước để test thật.

### XĐ-3 · Lọc theo "Quận, Tỉnh" (mục 12)

Sau sáp nhập 01/07/2025, TP.HCM **không còn cấp quận/huyện** và Bình Dương với
Bà Rịa – Vũng Tàu đã nhập vào TP.HCM, nên không còn "tỉnh" nào khác để lọc.
Kiểm chứng trên OpenStreetMap: relation ranh giới TP.HCM chứa đúng **168 đơn vị
cấp phường/xã**, không có cấp trung gian.

**Cách tui làm:** thay bằng bộ lọc **Phường · xã**, tra tự động từ toạ độ dự án.
Đây là đơn vị hành chính có thật hiện nay.

---

## 1 · Các lỗi đã phát hiện và sửa

Đây là lỗi tìm được trong lúc dựng và kiểm thử bản v2, không phải lỗi cũ của v1.

| # | Lỗi | Hậu quả | Cách sửa |
|---|---|---|---|
| 1 | Overpass trả **HTTP 200 kèm mảng rỗng** khi truy vấn quá nặng, chỉ báo trong trường `remark` | Ghi đè dữ liệu tốt bằng file rỗng mà không ai biết. Đã xảy ra thật: `amenities.json` ra 1 KB, 0 tiện ích, quy trình vẫn báo "thành công" | Thêm ngưỡng số phần tử tối thiểu vào lớp gọi Overpass; dưới ngưỡng thì coi là lỗi, đổi máy chủ, thử lại. Cache rỗng cũng bị bỏ và tải lại |
| 2 | Gộp 13 bộ lọc tiện ích vào một truy vấn `around:5000` | Overpass chạy quá 180 giây rồi trả rỗng (chính là lỗi #1) | Tách thành 13 truy vấn riêng, mỗi truy vấn vài giây. Nhóm nào hỏng cũng không kéo cả mẻ |
| 3 | `out geom tags` trên relation làm Overpass **bỏ hẳn mảng `members`** | `boundaries.json` ra 0 KB, mất toàn bộ 168 phường/xã. Chạy hai lần đều "thành công" | Dùng `out geom` (đã kèm tags sẵn) |
| 4 | Bộ lọc `area` viết lồng trong ngoặc | Truy vấn địa giới trả rỗng, không báo lỗi | Khai báo `area[...]->.hcm` thành biến trước rồi mới dùng |
| 5 | `mảng.length && el(...)` in ra chữ **"0"** giữa giao diện khi mảng rỗng | Tab Phân tích hiện số 0 lạc lõng giữa hai mục | Đổi thành `mảng.length > 0 &&`. Ghi chú cảnh báo ngay trong `dom.js` vì đây là bẫy dễ lặp lại |
| 6 | Bật một lớp bản đồ làm **vẽ lại cả bảng lớp** | Bấm liên tiếp nhiều lớp thì chỉ lần bấm đầu ăn, các lần sau rơi vào nút đã bị thay. Mất cả vị trí cuộn | Chỉ cập nhật đúng hàng vừa bấm |
| 7 | Bấm "So sánh" vẽ lại danh sách **hai lần** | Cùng dạng lỗi nút mồ côi như #6 | Bỏ lần vẽ thừa, để sự kiện lo |
| 8 | Điểm Metro lấy quãng **đi bộ 4,9 km / 66 phút** làm cơ sở chấm | Không ai đi bộ 5 km tới ga. Điểm sai và câu tư vấn vô nghĩa | Chỉ coi là "đi bộ được" khi dưới 2,5 km; quá thì chấm theo quãng đi xe |
| 9 | Lớp khu công nghiệp vẽ **278 ghim ở mọi mức phóng** | Bản đồ nhiễu và nặng khi nhìn toàn thành phố | Ranh vùng giữ nguyên (vẽ canvas, rẻ), ghim lọc theo khung nhìn từ mức phóng 12 |
| 10 | Trục đường bộ **trùng giữa hai lớp** — Vành đai 4 nằm cả ở lớp vành đai lẫn lớp cao tốc do OSM gắn thẻ `motorway` | Tắt lớp vành đai vẫn thấy vành đai. Vẽ đè hai lần | Phân loại theo tên, không theo truy vấn nào bắt được nó |
| 11 | Lớp đường bộ lẫn **rác**: cầu, nhánh rẽ, biển chỉ đường "Đi …", và cao tốc Bảo Lộc / Phan Thiết ngoài phạm vi | 90 "trục cao tốc" trong đó phần lớn là mẩu vụn | Lọc theo tên, gộp biến thể "giai đoạn 2 / mở rộng", cắt theo ranh giới hành chính thật, loại trục nằm đè lên trục dài hơn. Còn **9 cao tốc · 4 vành đai · 10 quốc lộ** |
| 12 | Toàn bộ 1,47 MB dữ liệu tải chặn lúc mở trang | Mở chậm trên mạng điện thoại, đúng lúc đang ngồi với khách | Chia hai đợt: **461 KB** chặn lúc mở, **1008 KB** tải nền sau khi giao diện đã hiện |
| 13 | Lỗi nhập toạ độ không phân biệt "gõ sai" với "ngoài phạm vi" | Người dán nhầm thứ tự vĩ độ/kinh độ chỉ nhận được "không đọc được", không biết sai ở đâu | Tách hai thông báo; trường hợp đảo nhầm thì gợi ý thẳng chuỗi đúng |

### Bẫy cũ đã kiểm lại, không tái diễn

- **Bản đồ co về 0 chiều cao trong chế độ gửi khách.** Bố cục v2 dùng vị trí
  tuyệt đối, bản đồ không bao giờ đổi kích thước khi đóng/mở bảng. Đo thật:
  bật chế độ gửi khách, `#map` vẫn cao 720 px. Đã ghi cảnh báo trong `client.css`.
- **Màn hình chờ không tắt do `requestAnimationFrame`.** Logic khởi động dùng
  `await` và `setTimeout`, không dùng rAF.
- **Ô toạ độ `type="number"` nuốt chuỗi dán.** Ô dán toạ độ dùng
  `type="text"` + `inputmode="decimal"`, đã test dán chuỗi có dấu phẩy.
- **Đo khoảng cách tới đỉnh thay vì tới cạnh polyline.** `distToShape` đo tới
  cạnh, dùng cho tiêu chí Hạ tầng.

---

## 2 · Các cải tiến so với bản cũ

**Kiến trúc**
- Một file HTML 134 KB / 1.897 dòng → **19 module JS + 7 file CSS + 13 file dữ liệu**
- Dữ liệu tách hẳn khỏi mã. Không còn dòng dữ liệu nào nằm trong JavaScript
- Ba công cụ dựng dữ liệu dùng chung một thư viện (`tools/lib/`)

**Đo đường thật thay cho ước lượng**
- Bản cũ: đường chim bay × 1,3, đi bộ 4,8 km/h, đi xe 22 km/h
- Bản mới: gọi OSRM lấy **quãng đường và thời gian thật**, riêng cho đi bộ và đi
  xe. Ma trận một-tới-nhiều nên một lần gọi ra cả trăm điểm
- Không đo được thì ghi "Đang cập nhật", **không quay về đường chim bay**

**Dữ liệu mới hoàn toàn**
| Lớp | Số lượng |
|---|---|
| Tuyến metro | 10 tuyến · 40 ga vật lý (49 lượt gán tuyến) · 8 ga trung chuyển |
| Đường bộ | 4 vành đai · 9 cao tốc · 10 quốc lộ |
| Khu công nghiệp | 278, đều có ranh vùng |
| Trường học | 1.839 |
| Bệnh viện | 178 |
| Mua sắm | 834 |
| Công viên | 281 (258 có ranh vùng) |
| Sông · kênh | 237 |
| Hồ | 394 |
| Địa giới | 1 cấp thành phố + 168 phường/xã |
| Tiện ích quanh dự án | 860 điểm, 248 điểm đã đo đường thật |

**Tính năng mới**
- 14 lớp bật/tắt độc lập, nhớ lựa chọn giữa các phiên
- Điểm đánh giá 8 tiêu chí kèm biểu đồ ra-đa, **mỗi tiêu chí hiện rõ đã dùng số liệu nào**
- Nhận định tự sinh: điểm mạnh, điểm yếu, đối tượng phù hợp, rủi ro — mỗi câu kèm dẫn chứng
- So sánh tối đa 3 dự án, tô đậm ô tốt hơn nhưng **chỉ khi mọi dự án đều có số**
- Tìm kiếm không dấu trên 8 loại đối tượng cùng lúc
- Ghim thủ công bằng bấm bản đồ hoặc dán toạ độ Google Maps
- Nền sáng / tối, theo cài đặt máy lúc mở lần đầu
- Ba ảnh nền: đường phố, nền sáng, vệ tinh

**Hiệu năng**
- Vẽ vector bằng canvas thay vì SVG
- Lớp mật độ dày chỉ vẽ điểm trong khung nhìn, từ một mức phóng nhất định
- Đo thật khi bật cả 14 lớp: cao nhất **556 ghim / 1.363 nút DOM** ở mức phóng 12,
  ở mức 11 chỉ còn 42 ghim / 335 nút

---

## 3 · Dữ liệu còn thiếu

### Thiếu nhiều nhất: thông tin dự án

**9 trên 11 dự án chưa có toạ độ.** Chỉ HT Pearl và TT AVIO có đối tượng cùng
tên trong OpenStreetMap. 9 dự án còn lại không có, mà tui **không đoán vị trí**.

Chưa có toạ độ thì: không hiện trên bản đồ, không chấm điểm, không có tiện ích,
không có khoảng cách metro. Tức là mất gần hết giá trị của công cụ.

> **Việc cần Hoàng làm đầu tiên:** ghim 9 dự án còn lại. Mỗi dự án khoảng 1 phút
> bằng cách dán toạ độ Google Maps. Xem `HUONG-DAN-NHAP-DU-AN.md`.
> Ghim xong chạy `node tools/build-around.mjs`.

**Các trường hồ sơ còn trống** (hiện đang là "Đang cập nhật"):

| Trường | Có ở mấy dự án |
|---|---|
| Chủ đầu tư | 1/11 (chỉ Tecco) |
| Tổng số căn, Block | 0/11 |
| Pháp lý | 0/11 |
| Bàn giao | 3/11 |
| Giá | 2/11 |
| Logo, ảnh, mặt bằng | 0/11 |
| Lịch thanh toán | 2/11 |

Vì thiếu `phapLy` + `giaTu` + `tongSoCan` nên tiêu chí **Thanh khoản không chấm
được cho dự án nào**. Đây là chỗ thiếu có ảnh hưởng lớn nhất tới điểm số.

Số liệu hiện có đều lấy từ hồ sơ nội bộ ngày 22/07/2026 và **đã gắn nguồn kèm
ngày trong file**, hiện luôn trong hồ sơ dự án để nhớ đối chiếu bảng giá mới.

### Thiếu về ga metro (giữ nguyên từ v1)

| Tuyến | Thiếu |
|---|---|
| Metro số 2 Thủ Dầu Một | 22/24 ga |
| Metro Bình Dương – Suối Tiên | toàn bộ 19 ga |
| Bến Thành – Cần Giờ | toàn bộ 6 ga |
| Metro số 2 Bến Thành – Tham Lương | 8/10 ga |
| Metro số 6 | 2 ga ngầm sân bay |
| Tuyến 3, tuyến 7 | toàn bộ ga |

Nguồn có thể bổ sung: bản đồ hướng tuyến MAUR niêm yết tại phường Bến Thành.
Chưa có file.

### Hạn chế khác

- Tiện ích chỉ đo đường thật cho **12 điểm gần nhất mỗi nhóm**. Điểm xa hơn vẫn
  đếm trong danh sách nhưng không có khoảng cách, và được đánh dấu rõ.
- Lớp toàn thành phố chỉ lấy cấp lớn: trường phổ thông trở lên (không lấy mầm
  non), bệnh viện (không lấy phòng khám). Cấp nhỏ vẫn có đủ trong lớp tiện ích
  quanh dự án.
- Trường `km` của đường bộ **lớn hơn chiều dài thật** vì OSM vẽ đường đôi thành
  hai chiều riêng. Đã ghi cảnh báo trong `meta` của `roads.json`, và không hiển
  thị con số này ra giao diện.
- Ảnh nền vệ tinh dùng Esri World Imagery. Cần Hoàng xác nhận điều kiện dùng cho
  mục đích thương mại, hoặc tui bỏ lớp đó đi.

---

## 4 · Kiến trúc hệ thống

```
Trình duyệt
├── index.html                vỏ trang, không dữ liệu, không logic
├── css/  (7 file)            tokens → base → layout → map → panels → sidebar → client
└── js/   (19 module)
    ├── core/                 không biết gì về Leaflet
    │   ├── dom.js            $, el, fill, delegate, toast, debounce
    │   ├── format.js         mọi cách hiển thị số; hằng CHUA_CO nằm ở đây
    │   ├── geo.js            haversine, đo tới cạnh, chặn toạ độ ngoài vùng
    │   ├── store.js          trạng thái + đăng ký nghe + lưu trên máy
    │   └── data.js           nạp JSON, trộn dự án, nạp theo yêu cầu
    ├── map/                  lớp bọc Leaflet
    │   ├── engine.js         khởi tạo, ảnh nền, zoom/toàn màn hình/về gốc/định vị
    │   ├── icons.js          mọi ghim, đều là divIcon dựng bằng HTML
    │   └── layers.js         sổ đăng ký 14 lớp + lọc theo khung nhìn
    ├── features/
    │   ├── projects.js       ghim dự án, chọn, ghim thủ công, bảng so sánh
    │   ├── popup.js          thẻ hiện khi bấm ghim
    │   ├── sidebar.js        hồ sơ 8 tab
    │   ├── score.js          chấm 8 tiêu chí + biểu đồ ra-đa
    │   ├── analysis.js       nhận định tự sinh
    │   ├── amenities.js      vòng bán kính + ghim tiện ích
    │   ├── compare.js        bảng so sánh 3 dự án
    │   ├── search.js         tìm kiếm không dấu
    │   ├── panel.js          danh sách, bảng lớp, bộ lọc
    │   └── clientmode.js     chế độ gửi khách
    └── app.js                khởi động, nối sự kiện, chủ đề sáng/tối

Dữ liệu (data/, 1,47 MB)
├── Nạp ngay 461 KB    projects · metro · stations · routes · roads · boundaries · amenities
└── Nạp nền 1008 KB    industrial · schools · hospitals · shopping · parks · water

Công cụ (tools/, chạy bằng Node, không phải phần của trang web)
├── lib/osm.mjs        gọi Overpass có đổi máy chủ, chặn phản hồi rỗng
├── lib/route.mjs      ma trận đường thật qua OSRM
├── build-data.mjs     9 lớp nền từ OpenStreetMap
├── build-around.mjs   tiện ích + ga metro quanh từng dự án
├── build-geo.mjs      dựng lại hình tuyến metro (ít khi cần)
└── serve.mjs          máy chủ tĩnh
```

**Luồng dữ liệu một chiều:** OpenStreetMap + OSRM → `tools/` → `data/*.json` →
`js/core/data.js` → trạng thái → giao diện. Không có chiều ngược lại, trừ toạ độ
ghim tay lưu trong trình duyệt.

**Quy ước mã:** comment và tên biến nghiệp vụ bằng tiếng Việt, comment giải thích
*tại sao* chứ không mô tả lại code. Biến CSS cho mọi màu và khoảng cách. Trạng
thái dùng thuộc tính `data-*`. ES2022 thuần, không transpile, không framework.

---

## 5 · Đề xuất nâng cấp tiếp theo

Xếp theo giá trị trên công sức bỏ ra.

**Nhóm 1 — làm ngay, giá trị lớn nhất**

1. **Ghim 9 dự án còn lại và điền hồ sơ.** Không phải việc lập trình nhưng là
   thứ quyết định công cụ có dùng được hay không. Khoảng 1 giờ.
2. **Chốt XĐ-2** — có dựng lại phần Google Sheet hay bỏ.
3. **Nút xuất ảnh PNG / in A4 từ chế độ gửi khách.** Hiện đang phải tự chụp màn
   hình. Bản v1 có tính năng này, v2 chưa dựng lại.

**Nhóm 2 — tăng chất lượng tư vấn**

4. **Bảng tính tài chính ngay trong hồ sơ:** vốn ban đầu, vay bao nhiêu, trả
   hằng tháng, dư nợ sau 2 năm, tổng chi thực — gồm cả giai đoạn sau ưu đãi lãi
   suất. Đây là thứ Hoàng vẫn tính tay cho từng khách.
5. **Vẽ tuyến đường thật từ dự án tới ga** thay vì chỉ hiện con số, dùng hình
   học tuyến đường mà OSRM trả về.
6. **Mốc lịch sử giá theo thời gian** cho mỗi dự án, để nói chuyện tăng giá bằng
   số thật thay vì nhận định.

**Nhóm 3 — mở rộng phạm vi**

7. **Vùng TOD dọc trục Bình Dương** (1.120 ha) — đã nêu trong kế hoạch v1.
8. **Bán kính đi lại thật** (isochrone): vẽ vùng "15 phút xe máy từ dự án" thay
   cho vòng tròn bán kính. Cần dịch vụ isochrone, OSRM công cộng không có sẵn.
9. **So sánh giá với mặt bằng khu vực** — cần nguồn dữ liệu giao dịch, hiện chưa có.

**Nhóm 4 — kỹ thuật**

10. Nén dữ liệu bằng gzip trên GitHub Pages (đã có sẵn), và cân nhắc giản lược
    mạnh hơn `water.json` (356 KB) và `schools.json` (345 KB).
11. Thêm kiểm thử tự động cho `score.js` — công thức chấm điểm là chỗ dễ sửa
    nhầm mà không ai phát hiện.

---

## 6 · Đã kiểm thử những gì

Chạy thật trên `http://localhost:5173`, không phải đọc code suy ra.

| Hạng mục | Kết quả |
|---|---|
| Nạp dữ liệu, khởi động | Không lỗi console. 11 dự án, 2 đã ghim |
| 14 lớp bật/tắt | Bật hết 14/14 không lỗi, kể cả đường đi tải theo yêu cầu |
| Hiệu năng khi bật hết lớp | 556 ghim / 1.363 nút DOM ở mức phóng cao nhất |
| Hồ sơ dự án 8 tab | Hiện đủ; tab thiếu dữ liệu báo rõ lý do và câu lệnh cần chạy |
| Chấm điểm | 7/8 tiêu chí có số, Thanh khoản báo thiếu `pháp lý, giá, tổng số căn` |
| Tiện ích theo bán kính | 500 m → 5 km lọc đúng, ghim trên bản đồ đồng bộ với danh sách |
| Khoảng cách đường thật | Cả đi bộ và đi xe, ví dụ Trường Tiểu học Bình An: xe 423 m/1 phút, bộ 423 m/6 phút |
| Ghim thủ công bằng bấm bản đồ | Lưu đúng toạ độ, ghim hiện viền nét đứt, có thông báo bước tiếp theo |
| Dán toạ độ | 4 tình huống: chuỗi rác, đảo nhầm thứ tự, ngoài vùng, hợp lệ — đều đúng |
| Tìm kiếm | Không dấu, ra đúng trên 8 loại đối tượng |
| Bộ lọc | Loại hình, chủ đầu tư, tình trạng, phường/xã, khoảng giá; xoá lọc trả về đủ |
| Bảng so sánh | Hiện đủ hàng, ô thiếu ghi "Đang cập nhật" |
| Chế độ gửi khách | Ẩn hết menu, bản đồ vẫn cao đủ 720 px |
| Điện thoại 375×812 | Không tràn ngang, bảng thành khay dưới, hồ sơ thành khay 88% chiều cao |
| Nền tối | Theo cài đặt máy lúc mở lần đầu, ảnh nền đảo màu, nút đổi hoạt động |

**Chưa kiểm được:** ảnh chụp màn hình trực quan — môi trường chạy không dựng
khung hình nên không chụp được. Bố cục đã kiểm bằng cách đo toạ độ và kích thước
từng khối, nhưng **fen nên mở bằng mắt một lượt trước khi gửi khách.**

Một điểm cần biết khi tự kiểm: nút zoom trên bản đồ dùng hiệu ứng chuyển động
của Leaflet, mà hiệu ứng đó chạy qua `requestAnimationFrame`. Trong môi trường
không dựng khung hình thì rAF bị treo nên nút trông như không ăn. Trên trình
duyệt thật thì bình thường.

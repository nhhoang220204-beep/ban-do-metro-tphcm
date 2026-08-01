# Hướng dẫn nhập dự án

Dữ liệu dự án nằm ở `data/projects/`, chia hai tầng:

```
data/projects/
├── manifest.json          khai báo loại hình, tình trạng, nguồn — sửa khi cần thêm loại mới
├── index.json             CHỈ MỤC: mọi dự án, mỗi dự án vài dòng. Bắt buộc.
└── chi-tiet/
    ├── ht-pearl.json      HỒ SƠ ĐẦY ĐỦ: giá, pháp lý, ảnh, lịch thanh toán. Tuỳ chọn.
    └── …
```

**Vì sao chia hai tầng:** chỉ mục nạp ngay khi mở trang, khoảng 220 byte mỗi dự
án — 5.000 dự án vẫn nhẹ. Hồ sơ đầy đủ chỉ tải khi bấm vào đúng dự án đó. Nhờ
vậy danh mục lớn tới đâu thì lần mở trang vẫn nhanh như nhau.

**Thêm dự án = thêm một object vào `index.json`.** Tải lại trang là thấy, không
phải chạy công cụ nào, không phải sửa dòng mã nào.

Mở bằng Notepad hay VS Code đều được.

---

## Hai mức tin cậy

| `nguon` | Nghĩa | Hiển thị |
|---|---|---|
| `"thu-cong"` | Hoàng nhập và đã kiểm chứng. Dùng được để tư vấn khách. | Bình thường |
| `"osm"` | Ứng viên do `tools/build-projects.mjs` lấy từ OpenStreetMap. Tên và toạ độ có thật, nhưng **chưa biết có phải dự án đang bán hay không**. | Nhãn đỏ **"Chưa kiểm"** ở mọi nơi |

Ứng viên OSM để Hoàng có sẵn một danh mục rộng khi khách hỏi về khu vực lạ.
**Kiểm chứng trước khi nói với khách.** Kiểm xong thì sửa `"nguon"` thành
`"thu-cong"`, điền tiếp các trường, và tạo file hồ sơ đầy đủ nếu cần.

---

## Quy tắc quan trọng nhất

**Trường nào chưa có thông tin thì để chuỗi rỗng `""`.** Ứng dụng sẽ hiện
"Đang cập nhật" ở đúng chỗ đó.

Đừng điền số phỏng đoán cho đủ ô. Con số trên màn hình này sẽ được đọc lại cho
khách nghe — sai một lần là mất uy tín, và khách có thể quyết định sai vì nó.

---

## 1 · Một dòng trong `index.json`

Đây là mức tối thiểu. Chỉ cần chừng này là dự án đã hiện trên bản đồ, vào danh
sách, lọc được, tìm được, và chấm điểm được.

```json
{
  "id": "sun-casa-square",
  "ma": "SCS",
  "ten": "Sun Casa Square",
  "loaiHinh": "nha-pho-thuong-mai",
  "toaDo": [11.0815, 106.6819],
  "xacMinh": "thu-cong",
  "trangThai": "dang-ban",
  "chuDauTu": "",
  "giaTu": 3600,
  "donViGia": "trđ/căn",
  "nguon": "thu-cong",
  "nguonToaDo": "Tự ghim theo Google Maps 31/07/2026",
  "coChiTiet": true
}
```

`"coChiTiet": true` nghĩa là có file `chi-tiet/sun-casa-square.json`. Để `false`
hoặc bỏ trường này thì ứng dụng chỉ dùng những gì có trong chỉ mục.

**Mã loại hình** phải khớp một khoá trong `manifest.json`:
`can-ho` · `chung-cu` · `nha-pho` · `nha-pho-thuong-mai` · `shophouse` ·
`biet-thu` · `dat-nen` · `khu-do-thi`.

Muốn thêm loại mới thì thêm một dòng vào `manifest.json` — kèm nhãn tiếng Việt,
biểu tượng, màu. Bản đồ, bộ lọc, chú thích tự cập nhật theo.

---

## 2 · File hồ sơ đầy đủ `chi-tiet/<id>.json`

```json
{
  "id": "sun-casa-square",
  "ten": "Sun Casa Square",
  "diaChi": "Khu đô thị VSIP II, TP.HCM (Bình Dương cũ)",
  "quyMo": "Đất khoảng 100 m², 1 trệt 2 lầu",
  "block": "",
  "tongSoCan": "",
  "banGiao": "Bàn giao nhà thô",
  "phapLy": "",
  "giaTrungBinh": null,
  "dienTich": "100 m² đất · khoảng 120 m² sàn",
  "logo": "",
  "anh": [],
  "matBang": [],
  "lichThanhToan": [
    { "dot": "Vốn ban đầu", "tyLe": "khoảng 30%", "soTien": "khoảng 1,2 tỷ", "moc": "" }
  ],
  "nguon": "Bảng giá chủ đầu tư ngày 15/07/2026",
  "ghiChu": "Nhà thô, chi phí hoàn thiện tham khảo khoảng 600 trđ."
}
```

Trường nào trùng với chỉ mục thì file hồ sơ thắng — trừ toạ độ tự ghim, cái đó
luôn thắng vì người đứng tại chỗ biết rõ hơn.

---

## Ý nghĩa từng trường

| Trường | Nghĩa |
|---|---|
| `id` | Mã không dấu, không khoảng trắng. Không đổi sau khi đã ghim vị trí, vì vị trí lưu theo `id`. |
| `ma` | Mã ngắn dùng khi đặt tên khách Zalo (HT, SCS, EGV…). |
| `ten` | Tên hiển thị. |
| `chuDauTu` | Tên chủ đầu tư. Cũng là một mục trong bộ lọc. |
| `loaiHinh` | Mã loại hình, phải khớp một khoá trong `manifest.json`. Quyết định biểu tượng và màu ghim. |
| `diaChi` | Địa chỉ chữ. Phường/xã thì ứng dụng tự tra từ toạ độ, không cần nhập. |
| `toaDo` | `[vĩ độ, kinh độ]` hoặc `null`. Xem mục Ghim vị trí bên dưới. |
| `xacMinh` | `osm` · `thu-cong` · `chua-ghim`. Ghim trong ứng dụng thì tự đổi thành `thu-cong`. |
| `nguonToaDo` | Toạ độ lấy từ đâu. Để người sau biết tin được đến mức nào. |
| `trangThai` | `dang-ban` · `sap-mo-ban` · `da-ban-giao` · `chua-ro`. Quyết định màu ghim. |
| `quyMo` | Diện tích đất, số tầng, kết cấu. Viết tự do. |
| `block` | Tên các block, ví dụ `"A, B, C"`. |
| `tongSoCan` | Số căn. Có nhập thì mới chấm được tiêu chí Thanh khoản. |
| `banGiao` | Mốc bàn giao và tiêu chuẩn bàn giao. |
| `phapLy` | Tình trạng pháp lý. Có nhập thì mới chấm được tiêu chí Thanh khoản. |
| `giaTu`, `giaTrungBinh` | **Số, không có dấu chấm phẩy, không có chữ.** |
| `donViGia` | `trđ/m²` hoặc `trđ/căn`. Phải khớp với con số ở trên. |
| `dienTich` | Bảng diện tích các loại căn. Viết tự do. |
| `logo` | Đường dẫn ảnh logo. Bỏ trống thì hiện chữ cái đầu trên nền màu. |
| `anh`, `matBang` | Danh sách đường dẫn ảnh, ví dụ `["anh/scs-1.jpg"]`. Đặt ảnh trong repo hoặc dùng link đầy đủ. |
| `lichThanhToan` | Danh sách các đợt, mỗi đợt có `dot`, `tyLe`, `soTien`, `moc`. |
| `nguon` | **Số liệu này lấy từ đâu, ngày nào.** Hiện ngay trong hồ sơ để nhớ mà đối chiếu lại. |
| `ghiChu` | Ghi chú tư vấn. Hiện trong tab Thông tin. |

### Về giá

Viết `3600` chứ không viết `"3.600"` hay `"3,6 tỷ"`.

- `donViGia: "trđ/căn"` → `3600` hiện thành **3,6 tỷ**
- `donViGia: "trđ/m²"` → `38` hiện thành **38 trđ/m²**

Bộ lọc khoảng giá so theo con số thô, nên hai dự án khác đơn vị giá không so
thẳng với nhau được. Dự án chưa có giá vẫn nằm trong danh sách, không bị lọc mất.

---

## Ghim vị trí

Dự án chưa có toạ độ vẫn hiện trong danh sách nhưng **không hiện trên bản đồ và
không được chấm điểm** — vì mọi tiêu chí đều đo từ vị trí.

Có hai cách ghim, đều làm ngay trong ứng dụng:

**Cách 1 — bấm lên bản đồ.** Mở hồ sơ dự án, bấm **📌 Ghim vị trí**, rồi bấm vào
đúng chỗ trên bản đồ. Nhanh, nhưng sai số vài chục mét.

**Cách 2 — dán toạ độ (chính xác hơn, nên dùng).**
1. Mở Google Maps, tìm đúng vị trí dự án.
2. Bấm chuột phải lên vị trí đó.
3. Bấm vào dòng toạ độ hiện ra ở đầu menu — nó tự chép vào bộ nhớ tạm.
4. Trong hồ sơ dự án, mở **"Dán toạ độ từ Google Maps"**, dán vào, bấm **Đặt**.

Vĩ độ trước, kinh độ sau. Ở TP.HCM vĩ độ khoảng `10.x`, kinh độ khoảng `106.x`.
Dán ngược thứ tự thì ứng dụng báo và gợi ý đảo lại, không ghim bừa.

### Sau khi ghim, chạy một lệnh

```bash
node tools/build-around.mjs
```

Lệnh này đo khoảng cách đường thật tới ga metro và nạp tiện ích quanh vị trí mới.
Chạy khoảng 5–10 phút mỗi dự án vì phải gọi máy chủ bản đồ công cộng.

Chưa chạy thì tab Tiện ích và tab Metro sẽ báo "Chưa có dữ liệu" kèm đúng câu
lệnh cần chạy.

### Vị trí ghim tay lưu ở đâu

Lưu trong trình duyệt của từng máy, **không tự động lên web**. Muốn mọi người
cùng thấy thì chép toạ độ vào `data/projects/index.json` rồi đẩy lên GitHub:

1. Trong hồ sơ dự án, bấm **⧉ Chép toạ độ**.
2. Dán vào `"toaDo": [10.9012, 106.7101]` trong `data/projects/index.json`.
3. Đổi `"xacMinh"` thành `"thu-cong"` và ghi `"nguonToaDo"` cho biết ai ghim, ngày nào.

---

## Điểm đánh giá được tính thế nào

Tám tiêu chí. Tiêu chí nào thiếu đầu vào thì để trống, **không hạ xuống 5/10 cho
đủ hình**. Điểm tổng chỉ tính trên phần chấm được, và luôn ghi rõ đã chấm được
mấy trên tám.

| Tiêu chí | Tính từ |
|---|---|
| Metro | Khoảng cách đường thật tới ga gần nhất + tình trạng tuyến chạy qua ga đó |
| Hạ tầng | Vành đai, cao tốc, quốc lộ trong bán kính 5 km |
| Tiện ích | Số nhóm tiện ích có mặt trong 2 km |
| Khả năng cho thuê | Khu công nghiệp và cơ sở đào tạo trong 5 km |
| Khả năng tăng giá | Tuyến metro đang thi công hoặc chuẩn bị khởi công trong 3 km, vành đai gần đó |
| An cư | Trường, y tế, siêu thị, công viên trong 2 km; trừ điểm nếu sát khu công nghiệp |
| Đầu tư | Tổng hợp từ bốn tiêu chí trên |
| Thanh khoản | **Cần `phapLy`, `giaTu` và `tongSoCan`.** Thiếu một trong ba thì không chấm. |

Mỗi tiêu chí đều hiện câu giải thích ngay bên dưới, nói rõ đã dùng con số nào.
Đây là thang tham khảo do công cụ tính, không phải thẩm định giá.

---

## Thêm một dự án mới

Chép nguyên một khối dự án trong `data/projects/index.json`. dán xuống dưới, đổi `id`
và `ten`, xoá hết giá trị cũ. Nhớ dấu phẩy giữa các khối và không có dấu phẩy sau
khối cuối cùng.

Sai dấu phẩy hay thiếu ngoặc thì trang sẽ báo lỗi không nạp được dữ liệu. Dán
nội dung file vào https://jsonlint.com để tìm chỗ sai.

# Bản đồ tư vấn bất động sản — Thành phố Hồ Chí Minh

Công cụ bản đồ dùng khi tư vấn khách mua bất động sản: mở lên là thấy dự án nằm
ở đâu, cách ga metro bao xa, quanh đó có gì, và vì sao chỗ đó đáng hay không
đáng tiền.

**Đang chạy:** https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/

---

## Nguyên tắc số một

> Chỉ hiển thị dữ liệu xác minh được. Không nội suy, không ước lượng, không đoán.
> Thiếu thì ghi **"Đang cập nhật"**.

Bản dựng đầu tiên của dự án này tự suy vị trí ga từ trí nhớ mô hình và đặt sai
tới gần 1 km, ngay trên tuyến đang chạy tàu. Đây là công cụ đưa thông tin tới
khách hàng thật, nên tra nguồn trước, dựng sau.

Cụ thể trong mã:

- Toạ độ dự án chỉ đến từ hai nguồn: đối tượng cùng tên trong OpenStreetMap,
  hoặc do người dùng tự ghim. Ứng dụng không bao giờ tự sinh toạ độ.
- Khoảng cách và thời gian đi lại đo bằng **đường thật** qua OSRM, không phải
  đường chim bay. Không đo được thì ghi "Đang cập nhật".
- Điểm đánh giá chỉ chấm tiêu chí có đủ đầu vào, và luôn hiện rõ đã chấm được
  bao nhiêu trên tổng số.

---

## Chạy trên máy

```bash
node tools/serve.mjs
```

Rồi mở http://localhost:5173

Không cài gì thêm, chỉ cần Node 18 trở lên.

> **Không mở thẳng `index.html` từ ổ đĩa.** Giao thức `file://` chặn cả `fetch`
> lẫn module JavaScript nên sẽ ra trang trắng. Ứng dụng tự phát hiện và báo
> tiếng Việt, nhưng vẫn phải chạy qua máy chủ.

---

## Cấu trúc

```
index.html          vỏ trang, không chứa dữ liệu và không chứa logic
css/                tokens → base → layout → map → panels → sidebar → client
js/
  core/             dom, format, geo, store, data  (không phụ thuộc Leaflet)
  map/              engine, icons, layers          (lớp bọc Leaflet)
  features/         projects, popup, sidebar, score, analysis,
                    amenities, compare, search, panel, clientmode
  app.js            khởi động và nối các module
data/
  projects/         danh mục dự án — sửa tay được, xem HUONG-DAN-NHAP-DU-AN.md
    manifest.json   khai báo loại hình, tình trạng, mức tin cậy nguồn
    index.json      chỉ mục gọn, nạp ngay khi mở trang
    chi-tiet/       hồ sơ đầy đủ từng dự án, chỉ tải khi mở dự án đó
  *.json            các lớp bản đồ, sinh bằng tools/, không sửa tay
tools/
  lib/osm.mjs        gọi Overpass, hình học, ghi file
  lib/route.mjs      ma trận khoảng cách đường thật qua OSRM
  build-data.mjs     dựng các lớp nền từ OpenStreetMap
  build-projects.mjs bổ sung ứng viên dự án từ OpenStreetMap
  build-ring-roads.mjs  lớp đường vành đai — trạng thái riêng cho từng đoạn
  build-around.mjs   dựng tiện ích và khoảng cách quanh từng dự án
  build-geo.mjs      dựng lại hình tuyến metro (ít khi cần)
  probe-du-an.mjs    đếm xem OSM có bao nhiêu ứng viên trước khi dựng
  serve.mjs          máy chủ tĩnh để chạy trên máy
```

**Quy mô:** chỉ mục khoảng 220–300 byte mỗi dự án. Bản đồ gom cụm và lọc theo
khung nhìn, danh sách phân trang, tra phường/xã lọc trước bằng khung bao. Đo
thật ở 5.000 dự án: vẽ lại bản đồ 4–11 ms, mở bảng lọc 11 ms, DOM khoảng 1.200
nút. Vượt 10.000 thì chia `index.json` thành nhiều file và khai vào `manifest.json`
— không phải sửa mã.

Không framework. Thư viện ngoài duy nhất là Leaflet 1.9.4.

---

## Dựng lại dữ liệu

```bash
node tools/build-data.mjs                  # tất cả các lớp nền
node tools/build-data.mjs roads parks      # chỉ lớp được nêu
node tools/build-around.mjs                # tiện ích + ga metro quanh mọi dự án đã ghim
node tools/build-around.mjs ht-pearl       # chỉ một dự án
node tools/build-projects.mjs --dry        # xem thử ứng viên dự án mới từ OSM
node tools/build-projects.mjs              # bổ sung ứng viên vào danh mục
node tools/build-ring-roads.mjs            # lớp đường vành đai, trạng thái từng đoạn
node tools/probe-vanh-dai.mjs              # dò trước xem OSM có gì cho từng tuyến vành đai
```

`build-projects.mjs` **chỉ thêm, không bao giờ ghi đè** bản ghi đã có. Ứng viên
lấy từ OpenStreetMap mang nhãn `nguon: "osm"` và hiện chữ **"Chưa kiểm"** ở mọi
nơi — vì OSM biết toà nhà đó có thật, nhưng không biết nó có đang bán hay không.

**Chạy `build-around.mjs` lại mỗi khi ghim thêm một dự án** — đó là bước đo
khoảng cách thật và nạp tiện ích quanh điểm mới.

Máy chủ Overpass công cộng hay trả 504, công cụ tự đổi máy chủ và thử lại. Một
lượt dựng đầy đủ mất khoảng 15–25 phút. Kết quả thô nhớ đệm trong `tools/cache/`,
thêm cờ `--cache` để dùng lại mà không gọi mạng.

---

## Thêm hoặc sửa dự án

Sửa `data/projects/index.json`. Xem `HUONG-DAN-NHAP-DU-AN.md` để biết ý nghĩa từng
trường và cách ghim vị trí.

Trường nào chưa có thì để chuỗi rỗng — ứng dụng sẽ hiện "Đang cập nhật". **Đừng
điền số phỏng đoán cho đủ ô.**

---

## Nguồn dữ liệu

| Thứ | Nguồn |
|---|---|
| Hình tuyến metro, ga | OpenStreetMap qua Overpass API |
| Đường bộ, khu công nghiệp, trường, bệnh viện, mua sắm, công viên, sông hồ | OpenStreetMap |
| Địa giới hành chính | OpenStreetMap — TP.HCM sau sáp nhập 01/07/2025, 168 phường/xã |
| Khoảng cách và thời gian đi lại | OSRM (đi xe: router.project-osrm.org · đi bộ: routing.openstreetmap.de) |
| Ảnh nền bản đồ | OpenStreetMap · CARTO · Esri World Imagery |
| Thông tin dự án | Người dùng tự nhập |

Dữ liệu OpenStreetMap theo giấy phép ODbL 1.0.

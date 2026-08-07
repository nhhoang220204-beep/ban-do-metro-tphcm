# 01 · PROJECT OVERVIEW

> Đọc file này ĐẦU TIÊN trong mọi phiên làm việc mới. Đây là điểm vào của toàn
> bộ hệ thống "Project Memory" — 15 file trong `docs/` thay thế việc phải đọc
> lại toàn bộ mã nguồn (~5.750 dòng JS/CSS + hàng chục file JSON dữ liệu) mỗi
> lần bắt đầu phiên. Đọc xong 15 file này là đủ hiểu dự án, không cần đọc lại
> source trừ khi thực sự cần sửa đúng dòng đó.

## Sản phẩm là gì

**Bản đồ tư vấn bất động sản khu vực Thành phố Hồ Chí Minh** (sau sáp nhập
01/07/2025, gồm cả Bình Dương và Bà Rịa – Vũng Tàu cũ) — một web app tĩnh,
một file `index.html` gọi ra nhiều module JavaScript, **không có backend**
(ngoại lệ đang triển khai dở: Firebase, xem [07_LIVE_MODE.md](07_LIVE_MODE.md)).

Không phải app "để chơi" hay demo — đây là công cụ làm việc hằng ngày của một
người thật, dùng để nói chuyện trực tiếp với khách hàng thật. Sai dữ liệu ở
đây không phải bug thẩm mỹ, mà là nói sai với khách mua nhà.

## Ai dùng, dùng để làm gì

**Người dùng:** Huy Hoàng ("Hoàng", "fen") — môi giới bất động sản. Dùng để
tư vấn khách tại chỗ (mở app trên điện thoại/laptop khi ngồi với khách) hoặc
chụp màn hình gửi Zalo. Đồng nghiệp cùng xem chung, không phải sản phẩm bán
cho khách hàng cuối như SaaS.

**Bài toán nghiệp vụ cụ thể:** khách hỏi "dự án này cách metro bao xa, quanh
đây có gì, có đáng tiền không, đường vành đai tới đâu rồi, so với dự án kia
thì sao". App phải trả lời NGAY tại chỗ, bằng số liệu có nguồn, **không được
đoán khi thiếu dữ liệu**.

Xem thêm về cách Hoàng làm việc, giọng văn, phong cách trao đổi ở
[15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md).

## Ba trụ cột dữ liệu

Ứng dụng xoay quanh 3 tầng dữ liệu độc lập, mỗi tầng có công cụ dựng và quy
tắc xác minh riêng (chi tiết ở [05_DATABASE_STRUCTURE.md](05_DATABASE_STRUCTURE.md)
và [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md)):

1. **Danh mục bất động sản** — 1.148 dự án (`data/projects/`), 2 mức tin cậy:
   11 dự án đã kiểm tay ("thu-cong", dùng được để tư vấn) và 1.137 ứng viên
   lấy từ OpenStreetMap ("osm", nhãn đỏ "Chưa kiểm", không suy đoán số liệu).
2. **Mạng lưới metro** — 10 tuyến theo quy hoạch hiện hành 2025 (không phải
   quy hoạch 2013 đã bị thay thế), `data/metro.json` + `data/metro/`.
3. **Đường Vành đai 2/3/4** — mỗi ĐOẠN (không phải cả tuyến) mang trạng thái
   thi công riêng, `data/ring_roads.json`.

## Trạng thái hiện tại (tóm tắt — chi tiết đầy đủ ở [10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md))

App đã lên GitHub Pages, chạy ổn định, đã qua nhiều đợt refactor lớn (Chế độ
biên tập GIS, Project Edit Mode CRUD, công cụ Kiểm tra dữ liệu, Developer
Mode). **Đang dở dang: chuyển sang Firebase để lưu trực tiếp trên bản web
thật** — xem [07_LIVE_MODE.md](07_LIVE_MODE.md), có việc chưa xong quan trọng
(chọn vùng máy chủ Firestore không đảo ngược được, mâu thuẫn email đăng nhập
chưa chốt).

## Ràng buộc kỹ thuật xuyên suốt — không tự ý phá vỡ

- **Không framework.** Vanilla JavaScript ES2022, không transpile, không
  build step. Thư viện ngoài duy nhất: Leaflet 1.9.4 (CDN unpkg).
- **Miễn phí hoàn toàn** — mọi nguồn dữ liệu (OpenStreetMap/Overpass API) và
  routing (OSRM) đều dùng dịch vụ công cộng miễn phí. Firebase (đang thêm) ở
  gói Spark miễn phí.
- **Chạy tốt trên điện thoại**, kiến trúc chịu được tới hàng nghìn dự án (đã
  đo thật ở 5.000 dự án — xem [02_ARCHITECTURE.md](02_ARCHITECTURE.md)).
- **Toàn bộ code, biến, comment bằng tiếng Việt.** Đây không phải lựa chọn
  ngẫu nhiên — người bảo trì duy nhất là Hoàng, đọc tiếng Việt nhanh hơn.

## Quy tắc số một — không bao giờ được vi phạm

> **Chỉ vẽ dữ liệu xác minh được.** Không nội suy, không ước lượng, không tự
> đặt vị trí ga/tuyến/dự án. Thiếu thì ghi "Đang cập nhật"/"Chưa xác minh" và
> KHÔNG ghim lên bản đồ.

Lý do: bản dựng đầu tiên của app từng tự suy dữ liệu từ trí nhớ mô hình, đặt
sai vị trí ga tới 974m ngay trên tuyến đang chạy tàu thật. Bài học này lặp
lại nhiều lần trong lịch sử dự án (xem [13_BUG_TRACKER.md](13_BUG_TRACKER.md))
— mọi lần Claude tự suy dữ liệu đều bị phát hiện sai. Xem đầy đủ các quyết
định kiến trúc liên quan ở [02_ARCHITECTURE.md](02_ARCHITECTURE.md) mục
"Quyết định không đảo ngược".

## Đường dẫn quan trọng

| Thứ | Giá trị |
|---|---|
| Link web đang chạy | https://nhhoang220204-beep.github.io/ban-do-metro-tphcm/ |
| Repo | https://github.com/nhhoang220204-beep/ban-do-metro-tphcm |
| Nhánh | `main` |
| Thư mục làm việc (= thư mục git) | `D:\Claude Cowork\ABOUT ME\metro-web\` |
| Chạy trên máy (bắt buộc để có tính năng ghi file) | `node tools/serve.mjs` → http://localhost:5173 |
| Tài liệu bàn giao gốc (lịch sử đầy đủ, chi tiết hơn 15 file này) | `BAN-GIAO-DU-AN-METRO.md` |

## Cách đọc bộ 15 file này

Không cần đọc tuần tự hết — tra theo nhu cầu:

| Muốn làm gì | Đọc file |
|---|---|
| Hiểu kiến trúc code, module nào làm gì, gọi nhau ra sao | [02_ARCHITECTURE.md](02_ARCHITECTURE.md) |
| Viết code mới, tuân đúng quy ước | [03_CODING_RULES.md](03_CODING_RULES.md) |
| Tìm file nằm ở đâu | [04_FOLDER_STRUCTURE.md](04_FOLDER_STRUCTURE.md) |
| Sửa/đọc dữ liệu JSON, chạy tool dựng dữ liệu | [05_DATABASE_STRUCTURE.md](05_DATABASE_STRUCTURE.md) |
| Sửa CSS, thêm component UI | [06_UI_UX_RULES.md](06_UI_UX_RULES.md) |
| Liên quan Firebase / chế độ gửi khách / môi trường live vs local | [07_LIVE_MODE.md](07_LIVE_MODE.md) |
| Sửa logic bản đồ, AI Score, business rule | [08_MAP_RULES.md](08_MAP_RULES.md) |
| Nguồn dữ liệu từ đâu, tin cậy tới đâu | [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md) |
| Việc gì làm tiếp theo, ưu tiên gì | [10_PROJECT_ROADMAP.md](10_PROJECT_ROADMAP.md) |
| Checklist việc cụ thể còn treo | [11_TODO.md](11_TODO.md) |
| Lịch sử đã làm gì, khi nào | [12_CHANGELOG.md](12_CHANGELOG.md) |
| Lỗi đã biết, đã sửa, chưa sửa | [13_BUG_TRACKER.md](13_BUG_TRACKER.md) |
| Phiên làm việc gần nhất đã làm gì | [14_SESSION_SUMMARY.md](14_SESSION_SUMMARY.md) |
| Hiểu Hoàng, cách giao tiếp, ngữ cảnh phi kỹ thuật | [15_ABOUT_PROJECT.md](15_ABOUT_PROJECT.md) |
| **Tiêu chuẩn bắt buộc cho MỌI lần sửa code** (style, naming, checklist review) | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Sửa file X có ảnh hưởng tính năng Y không, ranh giới module nằm ở đâu | [MODULES.md](MODULES.md) |

## Cách bảo trì bộ nhớ này

Đây là bộ nhớ SỐNG, không phải viết một lần rồi bỏ. Sau mỗi phiên làm việc
có thay đổi đáng kể:
1. Cập nhật `12_CHANGELOG.md` với việc vừa làm.
2. Nếu phát sinh quyết định kiến trúc mới → thêm vào `02_ARCHITECTURE.md`.
3. Nếu phát hiện bug mới hoặc sửa xong bug cũ → cập nhật `13_BUG_TRACKER.md`.
4. Luôn cập nhật `14_SESSION_SUMMARY.md` cuối phiên — đây là file phiên MỚI
   NHẤT sẽ đọc trước tiên để biết "vừa xảy ra chuyện gì".
5. Việc dở dang → cập nhật `11_TODO.md` và `10_PROJECT_ROADMAP.md`.

Không để các file lệch nhau — nếu một quyết định thay đổi (ví dụ đảo ngược
QĐ nào đó), sửa ở TẤT CẢ các file có nhắc tới nó, không chỉ sửa 1 chỗ.

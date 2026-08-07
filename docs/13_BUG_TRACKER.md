# 13 · BUG TRACKER

> Lỗi đã biết — đã sửa và chưa sửa, cả bug code lẫn vấn đề dữ liệu đang mở.
> Đọc trước khi "dọn dẹp" code trông lạ — phần lớn code lạ trong dự án này
> là fix có chủ đích cho lỗi thật ở đây, xoá đi sẽ bug lại y hệt.

## Đã sửa — nhưng PHẢI giữ nguyên fix, đừng đảo ngược

### BUG-01 · Đệ quy vô hạn khi đóng sidebar
**Triệu chứng**: `RangeError: Maximum call stack size exceeded` khi đóng hồ
sơ dự án. **Nguyên nhân**: `dong()` trong `sidebar.js` luôn `emit('chon-doi')`;
`app.js` nghe `chon-doi` và gọi lại `dong()` khi `state.chon` đã null → gọi
`dong()` lúc đã đóng sẵn tạo vòng lặp vô hạn. **Fix**: chốt idempotent đầu
hàm `if (state.chon == null && host.hidden) return;`. Phát hiện tình cờ khi
kiểm thử Project Edit Mode (Giai đoạn 9) — rất có thể chính là lỗi "sidebar
bị treo" Hoàng từng phản ánh trước đó.

### BUG-02 · Sidebar hiện dữ liệu cũ sau khi lưu
**Triệu chứng**: sửa xong dự án, bấm Lưu, hồ sơ vẫn hiện số liệu CŨ dù file
đã ghi đúng. **Nguyên nhân**: `dayDu` (biến module-scope giữ hồ sơ đầy đủ
trong `sidebar.js`) không tự tải lại — `quenChiTiet()` chỉ xoá cache fetch,
không đụng `dayDu` đã có sẵn trong bộ nhớ. **Fix**: `project-editor.js` sau
khi lưu thành công `emit('du-an-luu-xong', idDaLuu)`; `sidebar.js` nghe
topic này, nếu đang mở đúng dự án vừa lưu thì gọi lại `moHoSo()` từ đầu.

### BUG-03 · Marker "bật ngược" sau khi kéo
**Triệu chứng**: kéo marker dự án đang sửa sang vị trí mới, marker tự nhảy
về vị trí cũ ngay sau khi thả. **Nguyên nhân**: `veLai()` trong `projects.js`
vẽ marker theo `state.duAn` (dữ liệu đã lưu), trong khi kéo chỉ cập nhật bản
nháp — mỗi lần bản đồ vẽ lại (do sự kiện `moveend`/`sua-du-an-doi` khác
trigger), marker đọc lại dữ liệu gốc chưa đổi. **Fix**: `veMotGhim()` ưu
tiên đọc `banNhap()?.toaDo` khi đang vẽ marker của đúng dự án đang mở form
sửa.

### BUG-04 · Regex false positive khi lọc rác dữ liệu
**Triệu chứng**: bộ lọc `KHONG_PHAI_NHA_O` trong `build-projects.mjs` ban
đầu có từ khoá "chợ " đứng riêng, xoá nhầm chung cư có tên chứa địa danh
thật ("Chợ Lớn", "Chợ Quán" là tên khu vực, không phải chợ thật). **Fix**:
bỏ từ khoá đứng riêng "chợ"/"đền"/"lăng", dùng cụm ghép cụ thể hơn ("chợ
hoa", "chợ đầu mối").

### BUG-05 · Đường đôi OSM nhân đôi chiều dài
**Triệu chứng**: tuyến metro 1 đo ra 33,8km thay vì 19,7km thật; Vành đai 4
ra 393km thay vì ~207km. **Nguyên nhân**: OSM vẽ đường 2 chiều thành 2 way
riêng, hàm nối chuỗi `chain()` ghép chúng ở điểm giao thành vòng khép kín
nhân đôi chiều dài. **Fix**: luôn chạy `motChieu()` + `boKhucGap()` (hoặc
`singleTrack()`/`unfold()` trong `build-geo.mjs`) ngay sau `chain()`. Xem
đầy đủ ở [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md).

### BUG-06 · Overpass trả rỗng âm thầm
**Triệu chứng**: dữ liệu tốt bị ghi đè bằng file rỗng mà không ai biết.
**Nguyên nhân**: Overpass trả HTTP 200 kèm mảng rỗng khi truy vấn quá nặng,
chỉ báo trong trường `remark`. **Fix**: `tools/lib/osm.mjs` thêm ngưỡng số
phần tử tối thiểu bắt buộc trước khi chấp nhận kết quả — không được bỏ
ngưỡng này khi sửa lib.

### BUG-07 · Nút mồ côi khi vẽ lại cả khối cha
**Triệu chứng**: bấm liên tiếp một nút chỉ lần đầu ăn (bảng bật/tắt lớp bản
đồ, chip bảng so sánh, dải tab hồ sơ dự án, chip lọc vành đai — 4 nơi khác
nhau). **Nguyên nhân**: vẽ lại toàn bộ khối cha sau mỗi lần bấm làm nút cũ
văng khỏi cây DOM, listener cũ mất tác dụng dù người dùng vẫn thấy nút trên
màn hình. **Fix**: chỉ cập nhật đúng phần tử vừa đổi (`setAttribute`, đổi
text), không `fill()`/vẽ lại cả khối. Xem quy tắc bắt buộc ở
[03_CODING_RULES.md](03_CODING_RULES.md).

### BUG-08 · `grid-template` xoá mất `grid-template-areas`
**Triệu chứng**: bản đồ co về 0 chiều cao, hỏng Chế độ gửi khách. **Nguyên
nhân**: cú pháp CSS Grid rút gọn `grid-template` xoá luôn khai báo
`grid-template-areas` trước đó. **Fix**: bố cục chính đổi hẳn sang
`position: absolute` (QĐ-9), không dùng Grid cho layout chính. Xem
[06_UI_UX_RULES.md](06_UI_UX_RULES.md) mục 8.

### BUG-09 · `mảng.length && el(...)` in ra "0"
**Nguyên nhân**: `append()` trong `core/dom.js` chỉ bỏ qua `null`/`false`,
không bỏ qua số `0` — mảng rỗng làm biểu thức trả về `0`, bị `append` chèn
thẳng vào DOM thành chữ "0" nhìn thấy được. **Fix**: luôn viết
`mảng.length > 0 && el(...)`.

### BUG-10 · Đo khoảng cách tới đỉnh thay vì cạnh
**Triệu chứng**: sai lệch tới 4,4km ở nơi thực tế chỉ vài chục mét. **Nguyên
nhân**: các đoạn thẳng dài của hình tuyến (metro, vành đai) không có đỉnh ở
giữa — đo khoảng cách điểm tới các ĐỈNH bỏ sót toàn bộ phần giữa đoạn thẳng.
**Fix**: `distToShape`/`distToSegment` trong `core/geo.js` đo tới CẠNH, dùng
phép chiếu vector. Luôn dùng 2 hàm này, không tự viết lại phép đo.

### BUG-11 · `requestAnimationFrame` treo khi tab ẩn
**Triệu chứng**: màn hình chờ (boot screen) không bao giờ tắt, che toàn bộ
giao diện. **Nguyên nhân**: trình duyệt tạm dừng rAF khi tab không active.
**Fix**: không dùng rAF cho logic khởi động, dùng `setTimeout` hoặc `await`
thẳng (xem `app.js`).

### BUG-12 · Ô toạ độ `type="number"` xoá trắng khi dán
**Triệu chứng**: dán "10.98, 106.65" từ Google Maps vào ô toạ độ, ô bị xoá
trắng. **Nguyên nhân**: `type="number"` không chấp nhận chuỗi có dấu phẩy/
khoảng trắng, trình duyệt tự validate và xoá. **Fix**: `type="text"` kèm
`inputmode="decimal"`.

## Chưa sửa — vấn đề dữ liệu đang mở

### MT-01 · Mâu thuẫn hướng tuyến metro số 6 đoạn Phú Hữu – Bình Thái
Xem `data/metro/lines.json` → `mau_thuan_dang_mo`. Hình học OSM bám hành
lang Vành đai 2 (cách 12m), cắt vuông góc đường Đỗ Xuân Hợp rồi tách xa tới
3.744m. Thông tin thực địa từ Hoàng nói tuyến đi trên Đỗ Xuân Hợp, ngang khu
đô thị The Global City. Cả 2 nguồn đều xác nhận tuyến 6 giao tuyến 1 tại ga
Bình Thái (cách hình tuyến 6 chỉ 61m). Phần lệch nhau CHƯA giải quyết được —
Sở Xây dựng đang rà soát, chờ hồ sơ MAUR (dự kiến phê duyệt 6/2026).
**KHÔNG dùng đoạn này để tư vấn khách cho tới khi có hồ sơ chính thức.**

### DATA-01 · Vành đai 3 — mốc thông xe 30/06/2026 đã qua, chưa có xác nhận
Trạng thái từng đoạn hiện lấy theo thẻ OSM (có thể trễ so với thực địa). Đã
gắn cảnh báo trong `ring_roads.json` và popup — phải kiểm lại trước khi nói
với khách.

### DATA-02 · Cổng GIS quy hoạch chính thức TP.HCM chưa truy cập được
`api-gisxaydung.tphcm.gov.vn` trả HTTP 401. Xem
[09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md) — cần xin quyền qua
đường chính thức, không tìm cách vượt qua xác thực.

### DATA-03 · Vài hồ sơ nghiên cứu tự động cần Hoàng kiểm lại
Từ đợt thí điểm 50 hồ sơ (Giai đoạn 6): **"Chung cư 22 Tầng"** gán vào
165A Thuỳ Vân với độ tin cậy THẤP (Vũng Tàu có ít nhất 3 toà cùng tầm tầng
dễ trùng tên). **"Cư xá Đoàn Văn Bơ"** nghi OSM gắn sai vị trí/tên — toạ độ
thực trỏ tới hẻm 130 Lê Quốc Hưng, không phải đường Đoàn Văn Bơ. Cả hai đã
ghi cảnh báo trong `ghiChu`, chưa được Hoàng xác nhận lại.

## 🔴 Đang mở — chưa xác định là bug hay chưa thao tác đúng cách

### UI-01 · `<mat-select>` của Firebase Console không nhận click từ Claude in Chrome
Không phải bug trong codebase dự án — là vấn đề tương tác với UI của bên
thứ ba (Firebase Console, component Angular Material). Click theo toạ độ và
`.click()` qua JavaScript trên `<mat-option>` đều không cập nhật giá trị
hiển thị. Xem chi tiết và cách xử lý ở [07_LIVE_MODE.md](07_LIVE_MODE.md).
Không phải việc cần "sửa" trong code — chỉ cần biết để không lặp lại thao
tác vô ích, chuyển sang nhờ Hoàng tự bấm.

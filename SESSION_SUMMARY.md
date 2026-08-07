# SESSION SUMMARY — 07/08/2026

> **File này là bản tóm tắt phiên làm việc hôm nay, viết để mang sang một
> phiên Claude MỚI mà không cần chuyển lại lịch sử hội thoại.** Đọc file
> này trước, sau đó tuỳ việc cần làm mà mở thêm `docs/` (15 file bộ nhớ dài
> hạn + `DEVELOPER_GUIDE.md` + `MODULES.md`) hoặc `BAN-GIAO-DU-AN-METRO.md`
> (bản chi tiết lịch sử đầy đủ nhất). File này KHÔNG thay thế 2 nguồn đó —
> nó là nhật ký của riêng NGÀY HÔM NAY, các nguồn kia là bộ nhớ sống lâu
> dài của cả dự án.
>
> **⚠️ Trạng thái git tại thời điểm viết file này**: nhánh `main` local
> đang **đi trước `origin/main` đúng 1 commit** (`ecc68f4` — xoá Live Mode,
> đã commit nhưng CHƯA PUSH). Ngoài ra `docs/` (17 file mới) và
> `BAN-GIAO-DU-AN-METRO.md` (đã sửa) vẫn **CHƯA COMMIT**. Xem mục "Lưu ý
> cho phiên sau" — đây là việc đầu tiên cần xử lý.

---

## 🔴 Việc phát hiện ngoài kế hoạch — ĐÃ XỬ LÝ XONG, vẫn nên đọc để hiểu vì sao

Trong lúc rà `git log` để chuẩn bị viết file tóm tắt này, phát hiện một
commit đã có sẵn trên `origin/main` (đã lên GitHub Pages thật) mà phiên này
hoàn toàn không biết tới:

```
951cb7b · 07/08/2026 10:31 · "Thiết kế lại LIVE MODE theo chuẩn trung tâm
phân tích dữ liệu" · Co-Authored-By: Claude Opus 5
af76c54 · 06/08/2026 15:04 · "Thêm LIVE MODE — chế độ trình bày cho
livestream" · Co-Authored-By: Claude Opus 5
```

Đây là **một phiên Claude KHÁC (model Opus 5), làm việc trên cùng repo,
KHÔNG nằm trong lịch sử hội thoại của phiên đang viết file này** — bằng
chứng cho thấy đã có ≥13 commit khác (Vành đai 2 vẽ lại, ghim 66 dự án, cập
nhật bảng giá, xoá dự án Green Tower...) xảy ra trên repo mà phiên này
không nắm được cho tới khi chủ động `git log` kiểm tra lại.

**Tính năng "Live Mode" đó là gì**: một chế độ trình bày TOÀN MÀN HÌNH cho
livestream TikTok — chuẩn hình "trung tâm phân tích dữ liệu" kiểu
Bloomberg/CNBC, có header cố định, sidebar 6 icon lớp dữ liệu, bộ công cụ
thuyết trình (laser, spotlight, kính lúp, thước đo, vẽ chú thích, story
mode tự dẫn tuyến), khung camera 4:3 để phủ webcam TikTok LIVE Studio, lower
third, ticker chạy dưới cùng. **Tên trùng 100%** với khái niệm "Live Mode"
tôi đã dùng trong `docs/07_LIVE_MODE.md` để nói về việc chuyển sang Firebase
(QĐ-20) — một khái niệm hoàn toàn khác.

**Hoàng xác nhận không muốn tính năng livestream này và yêu cầu xoá, khôi
phục nguyên trạng.** Đã xử lý xong trong phiên này — xem mục 4 "File nào đã
xoá" và mục 10 "Các quyết định Live Mode" bên dưới để biết chi tiết đầy đủ
việc đã làm (commit `ecc68f4`).

**Việc còn lại từ phát hiện này** (đã hạ mức độ ưu tiên vì tính năng gây
xung đột đã bị xoá, nhưng vẫn nên làm — xem TODO):
- Hỏi Hoàng xác nhận: có phải chính Hoàng/một phiên khác của Hoàng đã yêu
  cầu tính năng đó, hay đây là nhánh phát triển ngoài luồng cần cảnh giác
  hơn (ví dụ ai đó khác có quyền truy cập repo).
- Cân nhắc đổi tên khái niệm Firebase trong `docs/07_LIVE_MODE.md` từ "Live
  Mode" sang cụm khác — dù xung đột trực tiếp đã hết (tính năng kia không
  còn tồn tại), tên gọi "Live Mode" cho việc ghi dữ liệu Firebase vẫn hơi
  dễ nhầm với "trực tiếp"/"livestream" theo nghĩa thông thường của từ này.
  Không khẩn cấp, để tuỳ phiên sau.

---

## 1 · Hôm nay đã làm gì (tóm tắt theo trình tự)

1. **Tiếp tục dở dang từ phiên trước**: thao tác Firebase Console qua
   Claude in Chrome (trình duyệt thật của Hoàng) để tạo hạ tầng Firebase
   cho việc ghi dữ liệu trực tiếp trên GitHub Pages (QĐ-20). Bị kẹt ở bước
   chọn vùng máy chủ Firestore (`<mat-select>` không phản hồi click từ
   công cụ tự động).
2. Theo yêu cầu của Hoàng ("cập nhật Project Handover hoàn chỉnh"): cập
   nhật `BAN-GIAO-DU-AN-METRO.md` để phản ánh đúng tình trạng Firebase dở
   dang + sửa số liệu lỗi thời trong tài liệu.
3. Theo yêu cầu của Hoàng ("xây dựng Project Memory"): tạo `docs/` với 15
   file `01`–`15`, đọc toàn bộ mã nguồn qua 4 agent song song rồi tự viết
   lại thành tài liệu tham chiếu có cấu trúc.
4. Theo yêu cầu của Hoàng ("tạo DEVELOPER_GUIDE.md"): tổng hợp 23 mục quy
   tắc bắt buộc + checklist từ nội dung đã có trong `docs/`.
5. Theo yêu cầu của Hoàng ("chia project thành module, tạo MODULES.md"):
   phân tích lại toàn bộ source code theo ranh giới module (22 module, 5
   tầng phụ thuộc), ghi rõ 7 thuộc tính mỗi module.
6. Theo yêu cầu của Hoàng ("tạo SESSION_SUMMARY.md"): trong lúc chuẩn bị
   viết, kiểm tra lại `git log` để đối chiếu và phát hiện 2 commit "Live
   Mode" song song nói ở mục trên — vá tạm 2 file `docs/07_LIVE_MODE.md` và
   `docs/MODULES.md` để không gây hiểu nhầm ngay lập tức, sửa luôn 1 sai
   sót ngày tháng (04/08 → 07/08/2026) phát hiện được trong lúc rà lại.
7. **Theo yêu cầu của Hoàng ("tôi muốn xóa cái live mode đó, hãy khôi phục
   về ban đầu đi")**: xác định chính xác phạm vi 5 file bị ảnh hưởng bởi 2
   commit Live Mode, xoá `css/live.css` + `js/features/livemode.js`, khôi
   phục `index.html`/`js/app.js`/`js/features/projects.js` về đúng trạng
   thái trước commit đầu tiên (`af76c54`), kiểm tra lại trên trình duyệt
   (không lỗi console, không request tới `live.css`, không còn nút Live),
   commit local (`ecc68f4`). Sau đó cập nhật lại `docs/07_LIVE_MODE.md`,
   `docs/MODULES.md`, `docs/12_CHANGELOG.md`, và chính file này để phản ánh
   việc đã xoá xong.

## 2 · File nào đã thêm (mới hoàn toàn)

| File | Số dòng | Nội dung |
|---|---|---|
| `docs/01_PROJECT_OVERVIEW.md` | ~130 | Tổng quan dự án, điểm vào bộ nhớ |
| `docs/02_ARCHITECTURE.md` | ~240 | Kiến trúc kỹ thuật, luồng khởi động, event bus |
| `docs/03_CODING_RULES.md` | ~125 | Quy tắc JS/CSS/dữ liệu bắt buộc |
| `docs/04_FOLDER_STRUCTURE.md` | ~105 | Cây thư mục đầy đủ |
| `docs/05_DATABASE_STRUCTURE.md` | ~200 | Schema toàn bộ file JSON |
| `docs/06_UI_UX_RULES.md` | ~250 | Design token, BEM, responsive, component |
| `docs/07_LIVE_MODE.md` | ~150 | Local vs GitHub Pages, Firebase dở dang, Chế độ gửi khách |
| `docs/08_MAP_RULES.md` | ~180 | Business Rules, công thức AI Score đầy đủ |
| `docs/09_DATA_SOURCE_RULES.md` | ~165 | Nguồn dữ liệu, pipeline, bẫy Overpass |
| `docs/10_PROJECT_ROADMAP.md` | ~90 | Thứ tự ưu tiên |
| `docs/11_TODO.md` | ~78 | Checklist việc cụ thể |
| `docs/12_CHANGELOG.md` | ~120 | Lịch sử 13 giai đoạn (đã thêm Giai đoạn 13 — Live Mode) |
| `docs/13_BUG_TRACKER.md` | ~135 | 12 bug đã sửa + 4 vấn đề mở |
| `docs/14_SESSION_SUMMARY.md` | ~82 | Bản tóm tắt phiên gần nhất (trong hệ `docs/`, khác file gốc này) |
| `docs/15_ABOUT_PROJECT.md` | ~110 | Về Hoàng, giao tiếp, mâu thuẫn email |
| `docs/DEVELOPER_GUIDE.md` | 556 | Tiêu chuẩn bắt buộc: 14 mục quy tắc + 9 checklist chuyên đề |
| `docs/MODULES.md` | 833+ | 22 module, 7 thuộc tính/module, bảng tra rủi ro |
| `SESSION_SUMMARY.md` | (file này) | Nhật ký phiên hôm nay |

**Tổng cộng: 18 file mới**, ~3.500+ dòng tài liệu (tất cả đang ở trạng thái
CHƯA COMMIT — xem cảnh báo git ở đầu file).

## 3 · File nào đã sửa

| File | Sửa gì | Lý do |
|---|---|---|
| `BAN-GIAO-DU-AN-METRO.md` | Thêm header cảnh báo Giai đoạn 12 dở dang; thêm dòng "Firebase" vào bảng Current Status; thêm nguyên section "Giai đoạn 12" mô tả đầy đủ tiến trình + điểm kẹt Firebase; viết lại mục Pending Tasks #10 thành checklist 8 bước theo đúng thứ tự; thêm cảnh báo mâu thuẫn email + ranh giới không gõ mật khẩu vào "Important Context"; thêm việc vào TODO Checklist và Next Priority; cập nhật Starter Prompt nhắc việc dở; thêm 3 dòng vào bảng tham chiếu nhanh (Firebase project ID, console link, tài khoản); thêm `HUONG-DAN-FIREBASE.md` vào cây thư mục; sửa số liệu "1.165 dự án" → "1.148 dự án" ở 5 chỗ; sửa ngày "04/08/2026" → "07/08/2026" ở 2 chỗ | Tài liệu bàn giao gốc phải phản ánh đúng thực tế trước khi dùng làm nguồn cho `docs/`; số liệu sai sẽ lan truyền sang mọi tài liệu phái sinh nếu không sửa gốc trước |
| `docs/01_PROJECT_OVERVIEW.md` | Thêm 2 dòng vào bảng điều hướng, trỏ tới `DEVELOPER_GUIDE.md` và `MODULES.md` | 2 file này ra đời SAU khi `01` đã viết xong — phải nối lại để không bị lạc trong bộ tài liệu |
| `docs/04_FOLDER_STRUCTURE.md` | Sửa ngày 04/08 → 07/08/2026 | Đồng bộ ngày tháng với thời điểm thật |
| `docs/07_LIVE_MODE.md` | Sửa ngày; thêm rồi RÚT GỌN banner cảnh báo trùng tên "Live Mode" (ban đầu cảnh báo mạnh vì tính năng còn tồn tại, sau khi xoá xong đã rút thành ghi chú lịch sử ngắn) | Phát hiện xung đột tên → cảnh báo ngay → xoá xong tính năng gây xung đột → hạ mức cảnh báo cho khớp thực tế mới |
| `docs/12_CHANGELOG.md` | Sửa ngày; **thêm Giai đoạn 13** thuật lại đầy đủ việc thêm rồi xoá Live Mode trong cùng ngày | Ghi lại đúng lịch sử — kể cả việc không phải do chính phiên này làm (tính năng thêm bởi Opus 5) cũng cần có trong changelog vì nó thật sự đã xảy ra trên repo |
| `docs/14_SESSION_SUMMARY.md` | Sửa ngày 04/08 → 07/08/2026 | Đồng bộ ngày tháng |
| `docs/MODULES.md` | Thêm rồi RÚT GỌN ghi chú ở đầu mục "9 · LiveMode" | Cùng lý do xung đột tên — nay chỉ còn ghi chú lịch sử ngắn vì tính năng gây xung đột đã bị xoá |
| `index.html` | Gỡ `<link>` tới `css/live.css`, gỡ nút 🎬 Live trên topbar, gỡ `<section class="lv">` | Xoá Live Mode theo yêu cầu Hoàng |
| `js/app.js` | Gỡ import `khoiTaoLive`/`batTatLive`, gỡ lệnh gọi `khoiTaoLive()`, gỡ handler `'live-mode'` | Xoá Live Mode theo yêu cầu Hoàng |
| `js/features/projects.js` | Gỡ export `markerCua()` (xác nhận trước khi xoá: không nơi nào khác trong code gọi hàm này ngoài `livemode.js`) | Hàm này được thêm CHỈ để phục vụ Live Mode — xoá tính năng thì hàm mồ côi này cũng nên xoá theo, giữ lại là code chết |

## 4 · File nào đã xoá

| File | Lý do |
|---|---|
| `css/live.css` | Toàn bộ CSS của tính năng Live Mode (livestream TikTok) — Hoàng yêu cầu xoá tính năng này |
| `js/features/livemode.js` | Toàn bộ logic JS của tính năng Live Mode — cùng lý do |

**`BAN-GIAO-DU-AN-METRO.md` KHÔNG bị xoá** — vẫn giữ nguyên làm tài liệu chi
tiết lịch sử, không bị thay thế bởi `docs/`.

## 5 · Lý do sửa (tổng hợp, không lặp lại chi tiết ở bảng trên)

- Toàn bộ việc tạo `docs/`, `DEVELOPER_GUIDE.md`, `MODULES.md` xuất phát từ
  yêu cầu tường minh của Hoàng ("tái cấu trúc để tối ưu chi phí token và dễ
  bảo trì lâu dài") — không phải Claude tự quyết định làm.
- Việc sửa số liệu (1.165→1.148) và ngày tháng KHÔNG được Hoàng yêu cầu
  trực tiếp — Claude tự phát hiện trong lúc đọc lại tài liệu và chủ động
  sửa vì đây là lỗi factual, để nguyên sẽ lan truyền sai lệch sang các tài
  liệu phái sinh viết dựa trên đó.
- Việc vá banner cảnh báo (rồi rút gọn lại) trong `docs/07_LIVE_MODE.md` và
  `docs/MODULES.md` cũng KHÔNG được yêu cầu trực tiếp — chủ động làm ngay
  sau khi phát hiện xung đột tên, và cập nhật lại ngay sau khi tính năng
  gây xung đột đã bị xoá, để tài liệu luôn khớp với thực tế hiện tại chứ
  không phải thực tế tại thời điểm viết.
- **Việc xoá `css/live.css`, `js/features/livemode.js` và sửa 3 file wiring
  ĐƯỢC Hoàng yêu cầu trực tiếp, rõ ràng** ("tôi muốn xóa cái live mode đó,
  hãy khôi phục về ban đầu đi") — không phải Claude tự quyết định xoá một
  tính năng đã push lên production.

---

## 6 · Các quyết định thiết kế (tổng quát)

- **Cấu trúc bộ nhớ dự án chia làm 2 lớp**: `docs/` (tra cứu nhanh theo chủ
  đề, mỗi file một mối quan tâm) và `BAN-GIAO-DU-AN-METRO.md` (tường thuật
  đầy đủ theo trình tự lịch sử, giữ nguyên không xoá). Không gộp 2 lớp này
  làm 1 — mỗi lớp phục vụ một cách đọc khác nhau (tra nhanh vs hiểu bối
  cảnh).
- **`DEVELOPER_GUIDE.md` là bản RÚT GỌN THÀNH QUY TẮC THI HÀNH**, không lặp
  lại giải thích dài dòng đã có trong `docs/0X` — mỗi mục chỉ nêu "phải làm
  gì/không được làm gì" kèm link tới nơi giải thích sâu.
- **`MODULES.md` chia 22 module theo 5 TẦNG PHỤ THUỘC** (không phải chia
  ngẫu nhiên theo cảm tính) — để trả lời được câu hỏi "sửa cái này có ảnh
  hưởng ngược lên cái tôi không muốn đụng không" bằng cách nhìn tầng.
- **File này (`SESSION_SUMMARY.md`) đặt Ở GỐC repo, KHÔNG đặt trong `docs/`**
  — vì mục đích khác hẳn `docs/14_SESSION_SUMMARY.md` (file đó bị GHI ĐÈ
  mỗi phiên, chỉ giữ bản mới nhất, là một phần của hệ bộ nhớ sống; file
  này là ảnh chụp CỤ THỂ của ngày 07/08/2026, mang đi được độc lập).
- **Khi xoá tính năng có nguồn gốc từ commit khác**: quyết định dùng
  `git checkout <commit-trước-đó> -- <file>` cho các file dùng chung
  (`index.html`, `app.js`, `projects.js`) thay vì tự tay sửa từng dòng —
  đảm bảo khôi phục ĐÚNG BYTE với trạng thái gốc, không sót/thừa khoảng
  trắng hay comment. Chỉ làm được vì đã xác minh trước không có commit nào
  khác chạm vào 3 file đó xen giữa — nếu có, cách này sẽ không an toàn (sẽ
  phải merge tay thay vì checkout thẳng).

## 7 · Các quyết định UI

Không có thay đổi UI thật nào ngoài việc xoá Live Mode (mục 4). Các quyết
định UI khác trong phiên chỉ là quyết định VỀ CÁCH GHI TÀI LIỆU UI đã có:
- Xác nhận lại và ghi rõ vào `docs/06_UI_UX_RULES.md`: quy tắc "trạng thái
  luôn qua `data-*`/`aria-*`, không qua class" áp dụng nhất quán 100% trong
  toàn bộ CSS còn lại sau khi xoá Live Mode.
- Ghi nhận 1 điểm KHÔNG nhất quán lịch sử (`.vd-doan__ten` dùng gạch nối
  đơn thay vì `__` chuẩn BEM) — quyết định: GHI NHẬN nhưng không sửa lại,
  chỉ cảnh báo code MỚI không lặp lại.

## 8 · Các quyết định Database

- Chốt bảng schema đầy đủ cho `index.json` và `chi-tiet/<id>.json` vào
  `docs/05_DATABASE_STRUCTURE.md`.
- Xác nhận lại pipeline dựng dữ liệu 6 bước và ghi rõ quan hệ phụ thuộc vào
  `docs/09_DATA_SOURCE_RULES.md`.
- Sửa số liệu tổng dự án hiện tại thành **1.148** xuyên suốt mọi tài liệu.
  ⚠️ Lưu ý: con số này có thể ĐÃ LỖI THỜI THÊM LẦN NỮA — `git log` cho thấy
  có commit "Ghim vị trí 66 dự án bằng Google Maps", "Đưa bảng giá Bình
  Dương 7/2026 lên danh mục (48 dự án)", "Hoàng xoá dự án Green Tower khỏi
  danh mục" xảy ra SAU những gì phiên này biết tới — **chưa kiểm tra lại số
  liệu thật trong `data/projects/index.json` sau các commit đó**. Phiên sau
  nên chạy lại phép đếm thật trước khi tin số 1.148.

## 9 · Các quyết định về Map

Không có thay đổi kỹ thuật bản đồ trong phiên này (ngoài việc xoá Live Mode
không đụng tới lõi bản đồ). Quyết định liên quan là việc GHI LẠI vào tài
liệu (đã có sẵn trong code):
- Chốt bảng ngưỡng hiệu năng quan trọng (TRAN_GHIM, ZOOM_TACH_CUM,
  O_CUM_PX, CUM_TOI_DA...) vào `docs/MODULES.md` mục 22 và
  `docs/02_ARCHITECTURE.md`.
- Xác nhận nguyên tắc canvas-mặc-định/SVG-chỉ-khi-cần-animation là quyết
  định hiệu năng có chủ đích, ghi rõ lý do để không bị "tối ưu ngược".

## 10 · Các quyết định Live Mode

**Đây là phần có hoạt động THẬT trong phiên này (khác các mục Map/Metro/
Vành đai ở trên chỉ là ghi tài liệu) — xem đầy đủ ở mục 1 (việc 7) và mục 4.**

Về (A) Firebase/ghi dữ liệu trực tiếp — không đổi gì, chỉ ghi lại đúng
quyết định QĐ-20 đã có từ trước vào `docs/07_LIVE_MODE.md`.

Về (C) tính năng Live Mode thật (livestream TikTok, đã bị xoá):
- **Quyết định: XOÁ HOÀN TOÀN, khôi phục về đúng trạng thái trước khi tính
  năng này được thêm vào** — theo yêu cầu trực tiếp, rõ ràng của Hoàng.
- **Cách làm**: xác định 2 commit gốc (`af76c54` thêm mới, `951cb7b` thiết
  kế lại), xác minh không có commit nào khác xen giữa chạm vào 3 file dùng
  chung (`index.html`, `js/app.js`, `js/features/projects.js`), sau đó
  `git checkout af76c54~1 -- <3 file đó>` (khôi phục đúng byte) +
  `git rm css/live.css js/features/livemode.js` (xoá hẳn 2 file riêng của
  tính năng).
- **Đã kiểm tra trước khi commit**: chạy app thật trên `localhost:5173`
  (qua `node tools/serve.mjs`), xác nhận không lỗi console, không request
  mạng nào tới `live.css`, danh sách nút trên topbar không còn nút Live.
- **Đã commit local** (`ecc68f4`) nhưng **CHƯA PUSH** — xem "Lưu ý cho
  phiên sau".
- **Không đụng bất kỳ thay đổi hợp lệ nào khác** đã xảy ra xen giữa 2 commit
  Live Mode và hiện tại (Vành đai 2 vẽ lại theo Dijkstra, Hoàng ghim/xoá dự
  án, cập nhật bảng giá...) — những thay đổi đó không liên quan Live Mode
  và không bị ảnh hưởng bởi việc revert này.

## 11 · Các quyết định về Metro

Không có thay đổi trong phiên này. Đã xác nhận và ghi vào tài liệu mốc kiểm
định chất lượng bắt buộc trước khi ghi đè hình học tuyến (tuyến 1 phải ra
~19,6km/14 ga, 0 ga lệch >200m).

## 12 · Các quyết định về Vành đai

Không có thay đổi trong phiên này ngoài việc GHI NHẬN (chưa xác minh lại)
rằng `git log` cho thấy Vành đai 2 đã được "dựng lại... 8 đoạn khép kín, 5
trạng thái, hình học bằng Dijkstra" và "Hoàng vẽ tay thêm điểm cho các đoạn
Vành đai 2 còn tạm" — 2 commit này xảy ra SAU những gì phiên trước của
`BAN-GIAO-DU-AN-METRO.md`/`docs/` biết tới. **`docs/05_DATABASE_STRUCTURE.md`
và `docs/08_MAP_RULES.md` có thể đang mô tả Vành đai 2 LỖI THỜI** (viết dựa
trên trạng thái trước các commit này) — cần đọc lại `data/ring_roads.json`
thật ở phiên sau để xác nhận/cập nhật.

---

## 13 · Bug còn tồn tại

- **MT-01** — mâu thuẫn hướng tuyến metro số 6 đoạn Phú Hữu–Bình Thái, chờ
  hồ sơ MAUR (dự kiến 6/2026).
- **DATA-01** — Vành đai 3 quá mốc thông xe 30/06/2026 nhưng chưa có nguồn
  xác nhận hoàn thành.
- **DATA-02** — cổng GIS quy hoạch chính thức TP.HCM trả 401.
- **DATA-03** — 2 hồ sơ nghiên cứu tự động cần Hoàng xác nhận lại.
- **UI-01** — `<mat-select>` của Firebase Console không phản hồi
  click/`.click()` từ Claude in Chrome.
- ✅ **~~Xung đột tên "Live Mode"~~ — ĐÃ GIẢI QUYẾT** trong chính phiên này
  bằng cách xoá tính năng gây xung đột (mục 10). Không còn là bug mở.
- **🆕 Số liệu `docs/` có thể đã lỗi thời** (xem mục 8, 12) — `docs/` được
  xây dựa trên snapshot code TẠI THỜI ĐIỂM PHÂN TÍCH, nhưng repo đã có
  thêm nhiều commit dữ liệu (ghim dự án, xoá dự án, sửa Vành đai 2, cập
  nhật giá) mà chưa được đối chiếu lại. Đây không phải bug code, là rủi ro
  TÀI LIỆU — cần một lượt đối chiếu `docs/05_DATABASE_STRUCTURE.md` +
  `docs/08_MAP_RULES.md` với dữ liệu JSON thật ở phiên sau.

## 14 · TODO tiếp theo

**Ưu tiên 1 — git housekeeping (làm ngay đầu phiên sau):**
- [ ] `git status` để xác nhận lại đúng những gì mục "Trạng thái git" ở đầu
  file này mô tả còn đúng không.
- [ ] Quyết định (hỏi Hoàng nếu cần): push commit `ecc68f4` (xoá Live Mode)
  lên `origin/main` ngay, hay chờ gộp cùng đợt commit `docs/` +
  `BAN-GIAO-DU-AN-METRO.md`.
- [ ] `git add` + commit `docs/` (18 file mới) và `BAN-GIAO-DU-AN-METRO.md`
  (đã sửa) — hiện đang ở trạng thái CHƯA COMMIT, tách biệt khỏi commit xoá
  Live Mode.
- [ ] Push cả 2 commit lên `origin/main`.

**Ưu tiên 2 — đối chiếu lại dữ liệu đã lỗi thời tiềm ẩn:**
- [ ] `git fetch` + rà lại toàn bộ `git log origin/main` một lượt từ đầu
  (không chỉ tin những gì `docs/`/`BAN-GIAO-DU-AN-METRO.md` mô tả) để nắm
  đủ các commit đã xảy ra: ghim/xoá dự án, Vành đai 2 vẽ lại, bảng giá mới.
- [ ] Đếm lại số dự án thật trong `data/projects/index.json` (đừng tin số
  "1.148" trong tài liệu — có thể đã đổi).
- [ ] Đọc lại `data/ring_roads.json` mục Vành đai 2 — cấu trúc "8 đoạn khép
  kín, 5 trạng thái, hình học Dijkstra" có thể khác mô tả hiện có trong
  `docs/`.
- [ ] Hỏi Hoàng xác nhận về nguồn gốc tính năng Live Mode đã xoá — có phải
  chủ động yêu cầu ở phiên khác hay ngoài ý muốn.

**Ưu tiên 3 — tiếp tục việc Firebase còn dở** (xem `docs/07_LIVE_MODE.md`
mục A, `docs/11_TODO.md`):
- [ ] Hoàn tất chọn vùng Firestore = Singapore (không đảo ngược được).
- [ ] Hỏi Hoàng chốt email đăng nhập (`hn2211609@gmail.com` hay
  `n.h.hoang220204@gmail.com`).
- [ ] Bật Authentication, đặt Security Rules, lấy `firebaseConfig`.
- [ ] Viết code tích hợp Firestore vào `js/core/luu-local.js`.

**Ưu tiên 4 — việc cũ chưa xong** (xem `docs/10_PROJECT_ROADMAP.md`):
- [ ] Hoàng ghim các dự án còn thiếu toạ độ (số lượng cần đếm lại, có thể
  không còn đúng 9 như tài liệu cũ ghi — xem Ưu tiên 2).
- [ ] Xin quyền ArcGIS FeatureServer.
- [ ] Quyết định Google Sheet (QĐ-4) — làm tiếp hay bỏ.

## 15 · Các lưu ý cho phiên sau

1. **`docs/` và `BAN-GIAO-DU-AN-METRO.md` đang ở trạng thái local, chưa
   commit. Commit xoá Live Mode (`ecc68f4`) đã commit local nhưng chưa
   push.** Kiểm tra `git status` + `git log -3` ngay đầu phiên trước khi
   làm gì khác.
2. **Repo này có khả năng cao đang/đã được nhiều phiên Claude khác nhau
   làm việc song song** (bằng chứng: 2 commit Opus 5, cộng ít nhất 11 commit
   khác về dữ liệu dự án/vành đai mà phiên viết `docs/` không biết tới cho
   tới khi chủ động kiểm tra). **Luôn `git fetch` + `git log origin/main`
   ĐẦU MỖI PHIÊN**, đừng giả định lịch sử hội thoại của mình là nguồn duy
   nhất phản ánh đúng trạng thái repo — bài học rút ra trực tiếp từ phiên
   hôm nay.
3. **`docs/05_DATABASE_STRUCTURE.md`, `docs/08_MAP_RULES.md`, và số liệu
   "1.148 dự án" trong nhiều file `docs/` có thể đã lỗi thời** do các commit
   dữ liệu xảy ra ngoài tầm quan sát của phiên xây `docs/`. Đừng tin số liệu
   trong `docs/` một cách tuyệt đối cho tới khi đối chiếu lại — xem TODO Ưu
   tiên 2.
4. **`docs/14_SESSION_SUMMARY.md` (trong hệ thống 15 file) và
   `SESSION_SUMMARY.md` (file gốc, file này) là HAI FILE KHÁC NHAU với mục
   đích khác nhau** — đừng nhầm lẫn khi cập nhật. File `docs/14` bị ghi đè
   mỗi phiên. File gốc này là ảnh chụp riêng của ngày hôm nay — phiên sau
   nên tạo file mới cho ngày của họ (hoặc hỏi Hoàng có muốn ghi đè không).
5. **Nếu thấy cụm "Live Mode" ở đâu đó trong code/tài liệu cũ chưa được cập
   nhật**: tính năng livestream đã bị xoá hoàn toàn khỏi code (commit
   `ecc68f4`), chỉ còn đúng 1 nghĩa hợp lệ — việc ghi dữ liệu trực tiếp qua
   Firebase (`docs/07_LIVE_MODE.md` mục A). Nếu gặp file nào khác vẫn nhắc
   tới tính năng livestream như đang tồn tại, đó là tài liệu chưa cập nhật,
   không phải code thật.

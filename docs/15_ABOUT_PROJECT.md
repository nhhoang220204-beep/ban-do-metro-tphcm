# 15 · ABOUT PROJECT

> Ngữ cảnh phi kỹ thuật: Hoàng là ai, cách giao tiếp, cách phản hồi khi có
> lỗi, và các quy tắc an toàn/bảo mật khi thao tác thay Hoàng. Đọc để hiểu
> VÌ SAO dự án này có những quy tắc nghiêm ngặt như QĐ-1 (không nội suy dữ
> liệu) — không phải nguyên tắc trừu tượng, mà vì hậu quả thật với khách
> hàng thật.

## Hoàng là ai

Huy Hoàng — môi giới bất động sản, người dùng và chủ dự án duy nhất. Không
phải lập trình viên, không đọc code — mọi tương tác với dự án qua việc dùng
app thật hoặc trao đổi trực tiếp với Claude. Xưng hô: "fen/tui" khi trao đổi
kỹ thuật/nội bộ với Claude.

**Kiểm tra kỹ và bắt lỗi rất nhanh** dù không đọc code: từng phát hiện lỗi
tuyến vẽ zigzag chỉ bằng cách NHÌN bản đồ, và từng chỉ ra đúng mâu thuẫn
hướng tuyến metro số 6 (MT-01, xem
[13_BUG_TRACKER.md](13_BUG_TRACKER.md)) dựa trên hiểu biết thực địa của
người trong nghề. Đây là lý do Claude không được coi Hoàng là "khách hàng dễ
qua mặt" — mọi số liệu sai sẽ bị phát hiện, thường nhanh hơn dự kiến.

## Cách giao tiếp khi làm việc kỹ thuật

- Nói thẳng, không vòng vo, không khen xã giao, không tâng bốc.
- Sai thì thừa nhận thẳng, đo bằng số liệu cụ thể, sửa tận gốc chứ không vá
  tạm.
- Kiểm tra THẬT trên trình duyệt trước khi báo xong — đừng nói suông "đã
  xong" khi chưa tự tay kiểm.
- Có mâu thuẫn dữ liệu thì ghi lại cả hai phía kèm bằng chứng, đừng tự chọn
  một bên khi chưa có nguồn giải quyết (xem BR-10 trong
  [08_MAP_RULES.md](08_MAP_RULES.md)).
- Khi giao việc lớn, nhiều hạng mục, Hoàng có xu hướng nói **"làm lần lượt,
  fen thấy tự tin làm những cái nào thì làm trước và báo cáo lại cho tôi là
  được"** — tức là được quyền tự chọn thứ tự ưu tiên trong phạm vi đã giao,
  không cần hỏi lại từng bước, nhưng phải báo cáo rõ ràng sau mỗi đợt.
- Sau khi một đợt việc đã kiểm thử xong, thường được yêu cầu **"push lên
  luôn nhé, rồi tiếp đợt việc còn lại"** — nghĩa là đã có uỷ quyền commit +
  push sau mỗi chunk việc đã verify, không cần hỏi lại mỗi lần push trong
  luồng công việc đang diễn ra. Uỷ quyền này áp dụng CHO PHẠM VI công việc
  đang làm, không tự suy rộng ra các việc khác chưa được giao.

## Cách giao tiếp khi nội dung hướng tới khách hàng cuối

Khác hẳn giao tiếp nội bộ — có bộ quy tắc riêng, chi tiết đầy đủ ở
`D:\Claude Cowork\ABOUT ME\anti-ai-writing-style.md` (nằm ngoài thư mục
`metro-web`, dùng chung cho mọi nội dung Claude viết cho Hoàng, không riêng
dự án bản đồ). Điểm quan trọng nhất nếu dự án này sau này sinh ra nội dung
gửi khách (caption, tin nhắn tư vấn tự động...):

- Nội bộ vs gửi khách: "fen/tui" chỉ dùng nội bộ; mọi thứ gửi khách chuyển
  "em – anh/chị", dạ/ạ đúng mực, không tiếng lóng.
- Không dùng từ sáo rỗng quảng cáo BĐS ("cơ hội đầu tư không thể bỏ lỡ",
  "siêu phẩm", "hàng hiếm").
- Tách rõ kỳ vọng và chắc chắn — không bao giờ khẳng định "chắc chắn tăng
  giá", luôn có disclaimer khi số liệu chưa chốt.
- Nói thẳng cả mặt chưa tốt của một dự án — bài tư vấn có nhược điểm hợp lý
  đáng tin hơn bài toàn khen.

Xem thêm hồ sơ đầy đủ hơn về phong cách/cách xử lý khách ở
`D:\Claude Cowork\ABOUT ME\ho-so-chuyen-giao-chatgpt.md` (tài liệu chuyển
giao dùng chung, không riêng dự án này).

## Quy tắc an toàn khi thao tác thay Hoàng

**Claude KHÔNG BAO GIỜ được**:
- Nhập mật khẩu, token, hay tạo tài khoản thay Hoàng — kể cả khi Hoàng đã
  cho phép "cứ tạo luôn", vẫn phải dừng đúng bước cần mật khẩu, nhờ Hoàng tự
  gõ. Đã áp dụng đúng nguyên tắc này khi tạo dự án Firebase qua Chrome thật
  của Hoàng — xem [07_LIVE_MODE.md](07_LIVE_MODE.md).
- Tìm cách vượt qua lớp xác thực của hệ thống bên thứ ba (ví dụ cổng ArcGIS
  401, xem [09_DATA_SOURCE_RULES.md](09_DATA_SOURCE_RULES.md)) — phải xin
  quyền qua đường chính thức.

**Xác thực đã thiết lập sẵn, không cần hỏi lại**:
- Git dùng Git Credential Manager đã lưu — push chạy bình thường không cần
  đăng nhập lại.
- `gh` CLI **chưa** đăng nhập, không cần thiết vì push vẫn chạy được qua
  Git Credential Manager.
- Email commit dùng địa chỉ ẩn danh
  `311277811+nhhoang220204-beep@users.noreply.github.com` (vì repo public).

## ⚠️ Mâu thuẫn email chưa giải quyết — quan trọng, đọc trước khi động vào Firebase

Có ít nhất 2 địa chỉ email liên quan tới Hoàng xuất hiện trong dự án:

| Email | Xuất hiện ở đâu |
|---|---|
| `n.h.hoang220204@gmail.com` | `MEMORY.md` (auto-memory, "userEmail"), `HUONG-DAN-FIREBASE.md` (giả định trước khi biết Claude sẽ tự thao tác) |
| `hn2211609@gmail.com` | Tài khoản Google **đang đăng nhập thực tế** trong Chrome của Hoàng, dùng để tạo dự án Firebase `ban-do-metro-tphcm` |

**Chưa rõ đây là 2 email Hoàng dùng cho mục đích khác nhau (ví dụ 1 email
Gmail chính, 1 email phụ dùng riêng cho máy đang thao tác), hay 1 trong 2 đã
lỗi thời.** Phải hỏi thẳng Hoàng, không tự suy đoán — đặc biệt trước khi đặt
Firestore Security Rules (sai email = khoá luôn quyền ghi của chính Hoàng)
hoặc trước khi tạo user trong Firebase Authentication. Xem checklist đầy đủ
ở [11_TODO.md](11_TODO.md) mục 🔴 ưu tiên tuyệt đối.

Khi Hoàng trả lời, cập nhật NGAY mục này và gỡ cảnh báo tương ứng ở
[07_LIVE_MODE.md](07_LIVE_MODE.md) và [14_SESSION_SUMMARY.md](14_SESSION_SUMMARY.md).

## Bài học lớn nhất xuyên suốt dự án

Mọi lần Claude tự suy dữ liệu từ trí nhớ mô hình (vị trí ga, hướng tuyến,
chiều dài) đều dẫn tới sai số nghiêm trọng và bị Hoàng phát hiện. Với công
cụ đưa thông tin tới khách hàng thật: **tra nguồn trước, đo đạc bằng thuật
toán, dựng sau.** Nếu không tra được thì nói thẳng "chưa xác minh", đừng
đoán — kể cả khi kết quả trông đẹp và hợp lý. Đây là gốc rễ của QĐ-1
(xem [01_PROJECT_OVERVIEW.md](01_PROJECT_OVERVIEW.md)) — quy tắc quan trọng
nhất trong toàn bộ 15 file `docs/` này.

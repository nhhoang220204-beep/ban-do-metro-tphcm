# Hướng dẫn tạo tài khoản Firebase (một lần duy nhất)

Làm theo đúng thứ tự. Xong bước 5 thì gửi lại cho Claude thông tin ở bước 5 và
bước 6 để nối vào web.

## 1 · Tạo dự án Firebase

1. Vào https://console.firebase.google.com
2. Đăng nhập bằng Gmail của fen (`n.h.hoang220204@gmail.com`)
3. Bấm **"Add project" / "Thêm dự án"**
4. Đặt tên, ví dụ `ban-do-metro-tphcm`
5. Tắt Google Analytics (không cần cho việc này) → **Create project**

## 2 · Bật Firestore Database (nơi lưu dữ liệu)

1. Trong dự án vừa tạo, vào menu trái **Build → Firestore Database**
2. Bấm **Create database**
3. Chọn **Start in production mode** (không chọn test mode)
4. Chọn vị trí máy chủ gần nhất, ví dụ `asia-southeast1 (Singapore)`
5. Bấm **Enable**

## 3 · Bật đăng nhập bằng Email/Password

1. Vào menu trái **Build → Authentication**
2. Bấm **Get started**
3. Chọn **Email/Password** trong danh sách nhà cung cấp → bật lên → **Save**
4. Vào tab **Users** → bấm **Add user**
5. Nhập đúng email `n.h.hoang220204@gmail.com` và **tự đặt một mật khẩu riêng
   cho web này** (khác mật khẩu Gmail cho an toàn) → **Add user**

   ⚠️ Mật khẩu này fen tự đặt và tự nhớ — không gửi mật khẩu cho Claude qua
   chat. Chỉ cần gửi lại **email** đã dùng để tui biết nối đúng.

## 4 · Đặt luật bảo mật (chặn người khác sửa)

1. Quay lại **Firestore Database → tab Rules**
2. Xoá hết, dán đúng đoạn sau:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'n.h.hoang220204@gmail.com';
    }
  }
}
```

3. Bấm **Publish**

## 5 · Lấy cấu hình để nối vào web

1. Bấm bánh răng ⚙ cạnh "Project Overview" → **Project settings**
2. Cuộn xuống mục **Your apps** → bấm biểu tượng **</>** (Web)
3. Đặt tên bất kỳ, ví dụ `ban-do-web` → **Register app**
4. Firebase hiện ra một đoạn code có dạng:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ban-do-metro-tphcm.firebaseapp.com",
  projectId: "ban-do-metro-tphcm",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**Chép nguyên khối `firebaseConfig` này gửi lại cho Claude.** Mấy giá trị này
KHÔNG phải bí mật — Firebase thiết kế để lộ ra ngoài trình duyệt cũng an toàn,
vì bảo mật thật nằm ở luật Rules đã đặt ở bước 4, không nằm ở các giá trị này.

## 6 · Xác nhận lại

Gửi cho Claude:
- Khối `firebaseConfig` ở bước 5
- Email đã tạo ở bước 3 (để xác nhận đúng, không cần gửi mật khẩu)

Sau đó Claude sẽ:
- Thêm màn hình đăng nhập (chỉ hiện khi bật Chế độ biên tập GIS)
- Chuyển toàn bộ chỗ ghi file cục bộ hiện tại (`/__luu-du-lieu`) sang ghi vào
  Firestore, có tác dụng ngay trên bản GitHub Pages, không cần chạy lệnh nào
- Vẫn giữ được bản sao dữ liệu trong file JSON (đồng bộ định kỳ) để không mất
  khả năng xem lịch sử qua git

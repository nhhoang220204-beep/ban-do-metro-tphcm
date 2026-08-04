/**
 * store.js — trạng thái dùng chung và kho lưu trên máy.
 *
 * Một nơi giữ trạng thái, các phần giao diện đăng ký nghe thay đổi. Không dùng
 * framework: ứng dụng chỉ có chừng mười mẩu trạng thái, một sổ đăng ký nhỏ là đủ
 * và không phải nạp thêm thư viện nào.
 */

const KEY = 'bds-map-v2';

/* ─── Trạng thái ────────────────────────────────────────────────────────── */

export const state = {
  duAn: [],              // danh mục dự án đã trộn: tệp gốc + chỉnh sửa trên máy
  chon: null,            // id dự án đang mở hồ sơ
  soSanh: [],            // tối đa 3 id dự án đưa vào bảng so sánh
  tab: 'thong-tin',      // tab đang mở trong hồ sơ dự án
  banKinh: 1000,         // bán kính lọc tiện ích, đơn vị mét
  nhomTienIch: null,     // null = tất cả các nhóm
  timKiem: '',
  loc: {                 // bộ lọc danh mục dự án — áp cho CẢ danh sách lẫn bản đồ
    giaMin: null, giaMax: null,
    loaiHinh: [], khuVuc: [], chuDauTu: [], trangThai: [], nguon: []
  },
  lop: {},               // bật/tắt từng lớp bản đồ
  guiKhach: false,       // chế độ gửi khách
  ghim: null,            // id dự án đang chờ ghim thủ công

  /* Bộ lọc riêng cho lớp đường vành đai. Không chọn gì = hiện tất cả. */
  locVD: { tuyen: [], trangThai: [] },
  doanVD: null,          // id đoạn vành đai đang chọn

  /* Chế độ biên tập GIS nội bộ — xem features/gis-editor.js. Công cụ dựng dữ
     liệu, KHÔNG phải chế độ xem của khách. Mặc định tắt. */
  bienTap: false,
  locHienThi: 'tat-ca',  // 'xac-minh' | 'tam' | 'tat-ca'
  doanDangSua: null,     // id đoạn vành đai đang mở sửa polyline (chế độ biên tập)
  suaDuAn: false,        // đang mở form sửa dự án trong hồ sơ hiện tại? (chế độ biên tập)

  /* Developer Mode — xem features/dev-mode.js. Mặc định tắt; việc BẮT lỗi vẫn
     chạy nền dù tắt (không bỏ sót lỗi xảy ra trước khi bật panel lên xem). */
  devMode: false
};

/* ─── Đăng ký nghe ──────────────────────────────────────────────────────── */

const listeners = new Map();

/** Nghe một chủ đề. Trả về hàm huỷ đăng ký. */
export function on(topic, fn) {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic).add(fn);
  return () => listeners.get(topic).delete(fn);
}

export function emit(topic, payload) {
  for (const fn of listeners.get(topic) ?? []) {
    /* Một phần giao diện lỗi không được kéo sập những phần còn lại. */
    try { fn(payload); }
    catch (err) { console.error(`[${topic}]`, err); }
  }
}

/** Gán trạng thái rồi phát tin — dùng thay cho gán trực tiếp. */
export function set(patch, topic = 'change') {
  Object.assign(state, patch);
  emit(topic, state);
}

/* ─── Lưu trên máy ──────────────────────────────────────────────────────────
   Chỉ lưu thứ thuộc về từng máy: dự án tự ghim, dự án tự thêm, lựa chọn lớp,
   chủ đề sáng/tối. Danh mục gốc luôn đọc lại từ data/projects/index.json. */

const MAC_DINH = { ghimTay: {}, duAnRieng: [], lop: {}, theme: null, xemGanDay: [] };

export function taiCaiDat() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...MAC_DINH, ...JSON.parse(raw) } : { ...MAC_DINH };
  } catch {
    return { ...MAC_DINH };
  }
}

export function luuCaiDat(patch) {
  const next = { ...taiCaiDat(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (err) {
    /* Trình duyệt ở chế độ riêng tư chặn localStorage. Ứng dụng vẫn chạy,
       chỉ là đóng tab thì mất phần tự ghim — báo cho người dùng biết. */
    console.warn('Không lưu được cài đặt:', err.message);
    emit('luu-that-bai', err);
  }
  return next;
}

/** Ghi nhớ toạ độ do người dùng tự ghim cho một dự án. */
export function luuGhim(id, toaDo) {
  const ghimTay = { ...taiCaiDat().ghimTay };
  if (toaDo) ghimTay[id] = { c: toaDo, luc: new Date().toISOString() };
  else delete ghimTay[id];
  luuCaiDat({ ghimTay });
}

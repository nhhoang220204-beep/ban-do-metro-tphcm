/**
 * format.js — mọi cách hiển thị số và chữ trong ứng dụng.
 *
 * Một quy tắc bao trùm: thiếu dữ liệu thì hiện "Đang cập nhật", không bao giờ
 * hiện 0, "N/A", dấu gạch hay một con số ước lượng. Người tư vấn đọc màn hình
 * này rồi nói lại với khách — một con số bịa là một lời nói sai với khách.
 */

export const CHUA_CO = 'Đang cập nhật';

/** Giá trị có thật hay không. Chuỗi rỗng, null, undefined, NaN đều là không. */
export const co = v =>
  v != null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v)) &&
  !(Array.isArray(v) && v.length === 0);

/** Trả về giá trị, hoặc "Đang cập nhật" nếu trống. */
export const hoac = (v, fallback = CHUA_CO) => (co(v) ? v : fallback);

const nf = new Intl.NumberFormat('vi-VN');
export const so = n => (co(n) ? nf.format(n) : CHUA_CO);

/* ─── Tiền ──────────────────────────────────────────────────────────────── */

/**
 * Giá hiển thị theo đơn vị gốc của dự án — không tự quy đổi giữa trđ/m² và
 * trđ/căn vì hai đơn vị đó không thay nhau được nếu chưa biết diện tích.
 */
export function gia(value, donVi = 'trđ/m²') {
  if (!co(value)) return CHUA_CO;
  if (donVi === 'trđ/căn') {
    return value >= 1000
      ? `${(value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`
      : `${so(value)} trđ`;
  }
  return `${so(value)} ${donVi}`;
}

/* ─── Khoảng cách và thời gian ──────────────────────────────────────────────
   Nhận vào đối tượng {m, giay} do OSRM trả về theo đường thật. Nhận null thì
   trả "Đang cập nhật" — không được thay bằng đường chim bay.               */

export function km(m) {
  if (!co(m)) return CHUA_CO;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

export function phut(giay) {
  if (!co(giay)) return CHUA_CO;
  const p = Math.round(giay / 60);
  if (p < 1) return 'dưới 1 phút';
  if (p < 60) return `${p} phút`;
  const h = Math.floor(p / 60), r = p % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
}

/** "1,2 km · 4 phút" — dạng gọn dùng trong danh sách. */
export function chuyenDi(leg) {
  if (!leg || !co(leg.m)) return CHUA_CO;
  return `${km(leg.m)} · ${phut(leg.giay)}`;
}

/* ─── Ngày ──────────────────────────────────────────────────────────────── */

export function ngay(iso) {
  if (!co(iso)) return CHUA_CO;
  const d = new Date(iso);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString('vi-VN');
}

/* ─── Chữ ───────────────────────────────────────────────────────────────── */

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu, khớp với slug lúc dựng. */
export const slug = s => (s ?? '').normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D')
  .toLowerCase().trim();

/** Chữ cái đầu của tên, dùng làm logo tạm khi dự án chưa có ảnh logo. */
export function chuDau(ten) {
  const parts = String(ten ?? '?').trim().split(/\s+/).filter(w => /\p{L}/u.test(w));
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

/**
 * geo.js — phép đo hình học trên bản đồ.
 *
 * Lưu ý quan trọng: những hàm ở đây tính ĐƯỜNG CHIM BAY. Chúng chỉ được dùng
 * để LỌC và SẮP XẾP sơ bộ (chọn ra vài điểm đáng đo, lọc theo bán kính).
 * Mọi con số khoảng cách và thời gian HIỂN THỊ cho người dùng đều phải lấy từ
 * dữ liệu định tuyến đường thật trong routes.json / amenities.json.
 */

const RAD = Math.PI / 180;
const R_EARTH = 6371000;

/** Khoảng cách chim bay giữa hai điểm [lat, lng], đơn vị mét. */
export function hav(a, b) {
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
}

/**
 * Khoảng cách từ một điểm tới hình tuyến, đo tới CẠNH chứ không tới ĐỈNH.
 *
 * Đo tới đỉnh từng gây sai lệch 4,4 km ở chỗ thực tế chỉ vài chục mét, vì hình
 * tuyến metro có những đoạn thẳng dài không có đỉnh ở giữa.
 */
export function distToShape(point, segments) {
  let best = Infinity;
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const d = distToSegment(point, seg[i], seg[i + 1]);
      if (d < best) best = d;
    }
  }
  return best;
}

export function distToSegment(p, a, b) {
  const dx = b[1] - a[1], dy = b[0] - a[0];
  let t = 0;
  if (dx || dy) t = Math.max(0, Math.min(1, ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / (dx * dx + dy * dy)));
  return hav(p, [a[0] + dy * t, a[1] + dx * t]);
}

/**
 * BR-2 · Toạ độ ngoài phạm vi bị chặn.
 * Chống gõ nhầm và chống đảo hai cột vĩ độ / kinh độ khi nhập tay.
 */
export const GIOI_HAN = { latMin: 8, latMax: 12.5, lngMin: 105, lngMax: 108.5 };

export function hopLe(c) {
  return Array.isArray(c) && c.length === 2 &&
    Number.isFinite(c[0]) && Number.isFinite(c[1]) &&
    c[0] >= GIOI_HAN.latMin && c[0] <= GIOI_HAN.latMax &&
    c[1] >= GIOI_HAN.lngMin && c[1] <= GIOI_HAN.lngMax;
}

/**
 * Đọc toạ độ người dùng dán vào, chấp nhận các dạng hay gặp khi copy từ
 * Google Maps: "10.98, 106.65" · "10.98 106.65" · "10.98;106.65".
 *
 * CHỈ tách số, KHÔNG kiểm tra phạm vi. Người gọi tự kiểm bằng hopLe() để phân
 * biệt được hai lỗi khác hẳn nhau: gõ sai định dạng, và toạ độ nằm ngoài vùng
 * (thường là do đảo nhầm vĩ độ với kinh độ). Gộp hai lỗi làm một thì người dán
 * nhầm thứ tự chỉ nhận được thông báo "không đọc được" và không biết sai ở đâu.
 */
export function docToaDo(text) {
  const nums = String(text ?? '').match(/-?\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 2) return null;
  return [parseFloat(nums[0].replace(',', '.')), parseFloat(nums[1].replace(',', '.'))];
}

/** Khung bao của một tập điểm, dùng để zoom vừa khít. */
export function bounds(points) {
  if (!points.length) return null;
  let s = 90, w = 180, n = -90, e = -180;
  for (const [lat, lng] of points) {
    if (lat < s) s = lat; if (lat > n) n = lat;
    if (lng < w) w = lng; if (lng > e) e = lng;
  }
  return [[s, w], [n, e]];
}

/** Điểm có nằm trong đa giác không — dùng để tra phường/xã của một dự án. */
export function trongDaGiac(point, ring) {
  const [y, x] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

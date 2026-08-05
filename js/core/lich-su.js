/**
 * lich-su.js — ngăn xếp Hoàn tác / Làm lại cho Chế độ biên tập GIS.
 *
 * Dùng cho việc sửa polyline đoạn vành đai: mỗi lần kéo/thêm/xoá một điểm thì
 * chụp lại toàn bộ mảng toạ độ của đoạn đang sửa. Mảng polyline chỉ vài chục
 * đến vài trăm điểm nên chụp nguyên mảng rẻ hơn nhiều so với ghi lại từng thao
 * tác, và không bao giờ lệch trạng thái.
 *
 * Lịch sử gắn theo TỪNG ĐOẠN (khoá = id đoạn). Đóng đoạn rồi mở lại vẫn còn
 * lịch sử, nhưng tải lại trang thì mất — đây là bộ đệm thao tác, không phải
 * bản sao lưu. Bản lưu thật vẫn là nút "Lưu" ghi xuống ring_roads.json.
 */

const TOI_DA = 60;          // đủ cho một phiên chỉnh tay, không phình bộ nhớ
const kho = new Map();      // id đoạn → { qua: [], sau: [], hienTai }

const nhanBan = pts => pts.map(p => [p[0], p[1]]);

/** Mở lịch sử cho một đoạn. Gọi lại nhiều lần không làm mất lịch sử đã có. */
export function moLichSu(id, polyline) {
  if (!kho.has(id)) kho.set(id, { qua: [], sau: [], hienTai: nhanBan(polyline) });
  return kho.get(id);
}

/**
 * Ghi nhận một trạng thái MỚI sau khi người dùng vừa thao tác xong.
 * Gọi SAU khi polyline đã đổi. Mọi bước "làm lại" đang chờ sẽ bị bỏ, đúng như
 * cách undo/redo ở mọi trình soạn thảo.
 */
export function ghiNhan(id, polyline) {
  const h = moLichSu(id, polyline);
  const moi = nhanBan(polyline);
  if (JSON.stringify(moi) === JSON.stringify(h.hienTai)) return;   // không đổi thì không ghi
  h.qua.push(h.hienTai);
  if (h.qua.length > TOI_DA) h.qua.shift();
  h.hienTai = moi;
  h.sau.length = 0;
}

/** @returns {Array|null} mảng toạ độ cần khôi phục, hoặc null nếu hết bước lùi. */
export function hoanTac(id) {
  const h = kho.get(id);
  if (!h?.qua.length) return null;
  h.sau.push(h.hienTai);
  h.hienTai = h.qua.pop();
  return nhanBan(h.hienTai);
}

/** @returns {Array|null} mảng toạ độ cần khôi phục, hoặc null nếu hết bước tiến. */
export function lamLai(id) {
  const h = kho.get(id);
  if (!h?.sau.length) return null;
  h.qua.push(h.hienTai);
  h.hienTai = h.sau.pop();
  return nhanBan(h.hienTai);
}

/** Số bước lùi / tiến còn lại — dùng để bật tắt nút trên giao diện. */
export function demBuoc(id) {
  const h = kho.get(id);
  return { lui: h?.qua.length ?? 0, tien: h?.sau.length ?? 0 };
}

/** Xoá lịch sử của một đoạn (gọi sau khi Lưu — mốc mới coi như sạch). */
export function dongLichSu(id) { kho.delete(id); }

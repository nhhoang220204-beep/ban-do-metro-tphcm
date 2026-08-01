/**
 * loc.js — bộ lọc danh mục dự án.
 *
 * Tách riêng khỏi giao diện vì có hai nơi cần dùng cùng một phép lọc: danh sách
 * bên trái và ghim trên bản đồ. Ở quy mô hàng nghìn dự án, lọc mà bản đồ không
 * đổi theo thì bộ lọc gần như vô dụng — người dùng vẫn phải nhìn cả rừng ghim.
 *
 * Đặt ở core/ thay vì features/ để tránh vòng phụ thuộc: panel.js và projects.js
 * đều nhập từ đây, không nhập lẫn nhau.
 */

import { state } from './store.js';
import { slug, co } from './format.js';
import { phuongXa } from './data.js';

/* ─── Tra phường/xã, có nhớ kết quả ─────────────────────────────────────────
   Mỗi lần tra phải quét tối đa 168 đa giác. Với hàng nghìn dự án mà tra lại sau
   mỗi lần gõ phím thì treo máy — nên nhớ theo id kèm toạ độ, đổi toạ độ mới tra lại. */

const nho = new Map();

export function khuVucCua(p) {
  if (!p?.toaDo) return null;
  const khoa = `${p.id}|${p.toaDo}`;
  if (!nho.has(khoa)) nho.set(khoa, phuongXa(p.toaDo));
  return nho.get(khoa);
}

export function quenKhuVuc() { nho.clear(); }

/* ─── Khoá tìm kiếm, có nhớ kết quả ─────────────────────────────────────── */

const nhoKhoa = new Map();

function khoaTim(p) {
  if (!nhoKhoa.has(p.id)) {
    nhoKhoa.set(p.id, slug([p.ten, p.ma, p.chuDauTu, p.diaChi].filter(Boolean).join(' ')));
  }
  return nhoKhoa.get(p.id);
}

/* ─── Phép lọc ──────────────────────────────────────────────────────────── */

/** Bộ lọc có đang bật gì không — dùng để quyết định có phải quét hay không. */
export function coLoc() {
  const f = state.loc;
  return !!(f.loaiHinh.length || f.chuDauTu.length || f.trangThai.length ||
            f.khuVuc.length || f.nguon?.length || f.giaMin != null || f.giaMax != null ||
            state.timKiem.trim());
}

/** Một dự án có lọt bộ lọc hiện tại không. */
export function lot(p) {
  const f = state.loc;

  if (f.loaiHinh.length  && !f.loaiHinh.includes(p.loaiHinh))   return false;
  if (f.chuDauTu.length  && !f.chuDauTu.includes(p.chuDauTu))   return false;
  if (f.trangThai.length && !f.trangThai.includes(p.trangThai)) return false;
  if (f.nguon?.length    && !f.nguon.includes(p.nguon))         return false;

  /* Lọc địa bàn tra theo đa giác nên đắt nhất — để cuối cùng trong nhóm này. */
  if (f.khuVuc.length && !f.khuVuc.includes(khuVucCua(p))) return false;

  /* Dự án chưa có giá KHÔNG bị loại: thiếu dữ liệu không đồng nghĩa với không
     hợp yêu cầu, và loại nó đi thì người dùng tưởng dự án đó không tồn tại. */
  if (co(p.giaTu)) {
    if (f.giaMin != null && p.giaTu < f.giaMin) return false;
    if (f.giaMax != null && p.giaTu > f.giaMax) return false;
  }

  const k = slug(state.timKiem);
  if (k && !khoaTim(p).includes(k)) return false;

  return true;
}

/** Danh sách dự án lọt bộ lọc. */
export function locDuAn(nguon = state.duAn) {
  return coLoc() ? nguon.filter(lot) : nguon;
}

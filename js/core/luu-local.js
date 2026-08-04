/**
 * luu-local.js — gọi máy chủ cục bộ để ghi thẳng xuống file JSON trong data/.
 *
 * Dùng chung cho mọi tính năng của Chế độ biên tập GIS (ga metro, vành đai,
 * dự án BĐS…). Chỉ hoạt động khi mở app bằng `node tools/serve.mjs` trên máy
 * — xem endpoint POST /__luu-du-lieu trong tools/serve.mjs. Trên GitHub Pages
 * (site tĩnh) request này luôn thất bại, và hàm báo lỗi rõ ràng thay vì âm
 * thầm mất dữ liệu.
 */

import { toast } from './dom.js';

/**
 * @param {string} loai 'stations' | 'ring_roads' | 'projects-index' | 'projects-chi-tiet'
 * @param {object} noiDung Nội dung JSON đầy đủ cần ghi.
 * @param {{id?: string, imMang?: boolean}} [tuyChon] `id` bắt buộc với 'projects-chi-tiet'.
 *   `imMang` = true thì không tự hiện toast (gọi nơi khác tự xử lý thông báo).
 */
export async function luuFile(loai, noiDung, { id, imMang = false } = {}) {
  return goi({ file: loai, id, noiDung: JSON.stringify(noiDung) }, loai, id, imMang);
}

/** Xoá hẳn một file (dùng cho chi-tiet dự án khi xoá dự án). */
export async function xoaFile(loai, id) {
  return goi({ file: loai, id, xoa: true }, loai, id, true);
}

async function goi(body, loai, id, imMang) {
  try {
    const res = await fetch('/__luu-du-lieu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.loi) throw new Error(j.loi || `HTTP ${res.status}`);
    if (!imMang) toast(`Đã lưu (${loai}${id ? ' · ' + id : ''})`, 'ok');
    return true;
  } catch (err) {
    toast('Không lưu được xuống file — chỉ hoạt động khi chạy "node tools/serve.mjs" trên máy. ' +
          'Trên bản GitHub Pages, chỉnh sửa chỉ tồn tại trong phiên xem hiện tại.', 'warn', 7000);
    console.warn('Lưu thất bại:', err.message);
    return false;
  }
}

/**
 * popup.js — thẻ thông tin hiện khi bấm vào ghim dự án.
 *
 * Đây là thứ khách hàng nhìn thấy đầu tiên, nên chỉ đưa những gì quyết định
 * được ngay: dự án là gì, ở đâu, giá bao nhiêu, cách ga metro bao xa, điểm
 * tổng bao nhiêu. Chi tiết dài để trong hồ sơ bên phải.
 */

import { esc } from '../core/dom.js';
import { gia, hoac, chuyenDi, co, CHUA_CO } from '../core/format.js';
import { gaCua, cacTrangThai, cacNguon, tenLoaiHinh } from '../core/data.js';
import { logoDuAn } from '../map/icons.js';
import { chamDiem, sao, nhanDiem } from './score.js';

export function popupDuAn(duAn) {
  const diem = chamDiem(duAn);
  const nd = nhanDiem(diem.tong);
  const ts = cacTrangThai()[duAn.trangThai];
  const ga = gaCua(duAn)?.gaGanNhat;

  const dong = (k, v, chuaCo = !co(v)) =>
    `<div class="field"><span class="field__k">${k}</span>` +
    `<span class="field__v${chuaCo ? ' pending' : ''}">${esc(chuaCo ? CHUA_CO : v)}</span></div>`;

  const anh = duAn.anh?.[0]
    ? `<div class="pop__photo"><img src="${esc(duAn.anh[0])}" alt="" loading="lazy"></div>`
    : '';

  return `<div class="pop">
    ${anh}
    <div class="pop__head">
      <div class="pop__logo">${logoDuAn(duAn, 42)}</div>
      <div class="grow">
        <div class="pop__title">${esc(duAn.ten)}</div>
        <div class="pop__sub">${esc(hoac(duAn.chuDauTu, 'Chủ đầu tư đang cập nhật'))}</div>
      </div>
    </div>

    <div class="pop__score">
      <div class="pop__stars" style="color:${nd.mau}">${sao(diem.tong)}</div>
      <div class="pop__num">
        ${diem.tong == null ? '<span class="pending">Chưa đủ dữ liệu</span>'
          : `<b style="color:${nd.mau}">${diem.tong}</b><span class="muted">/10</span>`}
      </div>
      <div class="pop__scorelbl">${esc(nd.nhan)} · ${diem.soTieuChi}/${diem.tongTieuChi} tiêu chí</div>
    </div>

    <div class="pop__body">
      ${dong('Loại hình', tenLoaiHinh(duAn.loaiHinh))}
      ${dong('Địa chỉ', duAn.diaChi)}
      ${dong('Giá từ', co(duAn.giaTu) ? gia(duAn.giaTu, duAn.donViGia) : null)}
      ${dong('Bàn giao', duAn.banGiao)}
      ${dong('Ga gần nhất', ga ? `${ga.name} · ${chuyenDi(ga.diXe)} đi xe` : null)}
    </div>

    <div class="pop__foot">
      <span class="badge ${ts?.lop ?? ''}">${esc(ts?.nhan ?? 'Đang cập nhật')}</span>
      ${duAn.xacMinh === 'thu-cong' ? '<span class="badge badge--warn">Vị trí tự ghim</span>' : ''}
      ${duAn.nguon === 'osm' ? `<span class="badge badge--warn" title="${esc(cacNguon()['osm']?.moTa ?? '')}">Chưa kiểm</span>` : ''}
      <button class="btn btn--sm btn--primary" data-act="mo-ho-so" data-id="${esc(duAn.id)}">Xem hồ sơ</button>
    </div>
  </div>`;
}

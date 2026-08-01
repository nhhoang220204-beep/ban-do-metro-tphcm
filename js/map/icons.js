/**
 * icons.js — mọi ghim trên bản đồ.
 *
 * Không dùng ghim mặc định của Leaflet ở bất cứ đâu: ghim mặc định là ảnh PNG
 * xanh dương giống hệt nhau, người xem không phân biệt nổi dự án với trường học.
 * Tất cả đều là divIcon dựng bằng HTML nên đổi màu, đổi chữ, gắn nhãn được và
 * ăn theo hệ token màu, kể cả khi đổi sang chế độ tối.
 */

import { esc } from '../core/dom.js';
import { chuDau } from '../core/format.js';
import { cacLoaiHinh, cacTrangThai } from '../core/data.js';

/* Biểu tượng và màu đều tra từ data/projects/manifest.json. Thêm một loại hình
   mới chỉ là thêm một dòng vào manifest, không phải sửa mã. */
const MAC_DINH = { glyph: '🏢', mau: '#475569' };

export function ghimDuAn(duAn, { active = false, thuTuSoSanh = 0 } = {}) {
  const loai = cacLoaiHinh()[duAn.loaiHinh] ?? MAC_DINH;
  const ts = cacTrangThai()[duAn.trangThai];
  /* Màu ghim theo tình trạng bán để nhìn là biết cái nào chào được; loại hình
     nào chưa rõ tình trạng thì lấy màu của loại hình. */
  const mau = ts?.mau ?? loai.mau ?? MAC_DINH.mau;
  const glyph = loai.glyph ?? MAC_DINH.glyph;
  const thuCong = duAn.xacMinh === 'thu-cong';

  const html =
    `<div class="pin-wrap"${active ? ' data-active' : ''}` +
    ` data-verify="${esc(duAn.xacMinh ?? '')}"` +
    (thuTuSoSanh ? ` data-compare="${thuTuSoSanh}"` : '') + '>' +
      `<div class="pin${thuCong ? ' pin--thucong' : ''}" style="--pin-bg:${mau}">` +
        `<span class="pin__glyph">${glyph}</span>` +
      '</div>' +
      `<div class="pin__label">${esc(duAn.ten)}</div>` +
    '</div>';

  return L.divIcon({
    html, className: '',
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -32]
  });
}

/** Ghim ga metro. Ga trung chuyển to hơn và viền đậm hơn. */
export function ghimGa(ga, mauTuyen) {
  const doi = ga.interchange;
  const size = doi ? 19 : 13;
  return L.divIcon({
    html: `<div class="station${doi ? ' station--doi' : ''}" style="--st-color:${mauTuyen}"></div>`,
    className: '',
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2]
  });
}

/** Ghim tiện ích và điểm hạ tầng. `nho` dùng cho lớp mật độ dày. */
export function ghimPoi(icon, mau, nho = false) {
  const size = nho ? 21 : 26;
  return L.divIcon({
    html: `<div class="poi${nho ? ' poi--sm' : ''}" style="--poi-color:${mau}">${icon}</div>`,
    className: '',
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2]
  });
}

/** Nhãn mốc bán kính đặt trên vòng tròn. */
export function nhanBanKinh(text) {
  return L.divIcon({ html: `<div class="radius-label">${esc(text)}</div>`, className: '', iconSize: [0, 0] });
}

/**
 * Logo dự án: dùng ảnh nếu có, không thì chữ cái đầu trên nền màu suy từ tên.
 * Nhờ vậy danh sách dự án không bao giờ có ô trống trông như lỗi.
 */
export function logoDuAn(duAn, size = 40) {
  if (duAn.logo) {
    return `<img class="logo" src="${esc(duAn.logo)}" alt="" width="${size}" height="${size}" loading="lazy">`;
  }
  const mau = cacTrangThai()[duAn.trangThai]?.mau
           ?? cacLoaiHinh()[duAn.loaiHinh]?.mau
           ?? MAC_DINH.mau;
  return `<div class="logo logo--chu" style="--logo-bg:${mau};width:${size}px;height:${size}px">` +
         `${esc(chuDau(duAn.ten))}</div>`;
}

/**
 * Ghim cụm — thay cho hàng trăm ghim chồng lên nhau khi nhìn cả thành phố.
 * Kích thước và độ đậm tăng theo số dự án trong cụm.
 */
export function ghimCum(soLuong) {
  const cap = soLuong < 10 ? 0 : soLuong < 50 ? 1 : soLuong < 200 ? 2 : 3;
  const size = [34, 40, 46, 54][cap];
  return L.divIcon({
    html: `<div class="cum" data-cap="${cap}" style="width:${size}px;height:${size}px">` +
          `<span>${soLuong}</span></div>`,
    className: '',
    iconSize: [size, size], iconAnchor: [size / 2, size / 2]
  });
}

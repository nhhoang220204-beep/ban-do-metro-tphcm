/**
 * clientmode.js — chế độ gửi khách.
 *
 * Bật lên thì ẩn toàn bộ bảng điều khiển, chỉ còn bản đồ và một thẻ tóm tắt
 * gọn gàng: tên dự án, điểm, khoảng cách tới ga, tiện ích nổi bật. Mục đích là
 * chụp màn hình gửi Zalo cho khách mà không lộ nút bấm, ghi chú nội bộ hay
 * bảng giá nội bộ.
 *
 * Bố cục dùng vị trí tuyệt đối đè lên bản đồ, KHÔNG chia lưới. Bản dựng trước
 * dùng lưới và cú pháp `grid-template` rút gọn đã xoá mất `grid-template-areas`,
 * làm ô bản đồ co về 0 chiều cao — hỏng đúng tính năng này. Đừng quay lại cách đó.
 */

import { el, fill, toast } from '../core/dom.js';
import { state, set } from '../core/store.js';
import { gaCua, tienIchCua, nhomTienIch, tenLoaiHinh } from '../core/data.js';
import { gia, chuyenDi, hoac, co, CHUA_CO } from '../core/format.js';
import { map } from '../map/engine.js';
import { logoDuAn } from '../map/icons.js';
import { chamDiem, sao, nhanDiem, TIEU_CHI } from './score.js';

let host, appEl;

export function khoiTaoGuiKhach(node) {
  host = node;
  appEl = document.querySelector('.app');
  node.addEventListener('click', ev => {
    if (ev.target.closest('[data-act="tat-gui-khach"]')) tat();
  });
}

export function bat() {
  if (!state.chon) {
    return toast('Chọn một dự án trước khi bật chế độ gửi khách', 'warn');
  }
  set({ guiKhach: true }, 'gui-khach-doi');
  appEl.dataset.client = '';
  ve();
  host.hidden = false;
  /* Bản đồ vừa đổi khung hiển thị, phải báo Leaflet đo lại rồi mới căn giữa. */
  setTimeout(() => {
    map.invalidateSize();
    const p = duAnHienTai();
    if (p?.toaDo) map.setView(p.toaDo, Math.max(map.getZoom(), 15), { animate: true });
  }, 220);
}

export function tat() {
  set({ guiKhach: false }, 'gui-khach-doi');
  delete appEl.dataset.client;
  host.hidden = true;
  setTimeout(() => map.invalidateSize(), 220);
}

export function batTat() { state.guiKhach ? tat() : bat(); }

const duAnHienTai = () => state.duAn.find(p => p.id === state.chon) ?? null;

function ve() {
  const p = duAnHienTai();
  if (!p) return;

  const diem = chamDiem(p);
  const nd = nhanDiem(diem.tong);
  const ga = gaCua(p)?.gaGanNhat;
  const nhom = nhomTienIch();

  /* Mỗi nhóm lấy đúng điểm gần nhất trong 2 km — đủ để khách hình dung, không
     biến tấm ảnh chụp màn hình thành một danh sách dài đọc không nổi. */
  const noiBat = [];
  const daCo = new Set();
  for (const d of tienIchCua(p.id).sort((a, b) => (a.diXe?.m ?? Infinity) - (b.diXe?.m ?? Infinity))) {
    const m = d.diXe?.m ?? d.diBo?.m;
    if (m == null || m > 2000 || daCo.has(d.nhom)) continue;
    daCo.add(d.nhom);
    noiBat.push(d);
    if (noiBat.length >= 6) break;
  }

  fill(host, [
    el('div.ck__card', {}, [
      el('div.ck__head', {}, [
        el('div', { html: logoDuAn(p, 52) }),
        el('div.grow', {}, [
          el('div.ck__ten', {}, p.ten),
          el('div.ck__phu', {}, hoac(p.chuDauTu, '')),
          el('div.ck__diachi', {}, hoac(p.diaChi, ''))
        ])
      ]),

      el('div.ck__score', {}, [
        el('div.ck__stars', { style: { color: nd.mau } }, sao(diem.tong)),
        el('div.ck__num', {}, diem.tong == null
          ? [el('span.pending', {}, 'Chưa đủ dữ liệu')]
          : [el('b', { style: { color: nd.mau } }, String(diem.tong)), el('span', {}, '/10')]),
        el('div.ck__lbl', {}, diem.tong == null ? '' : nd.nhan)
      ]),

      diem.tong != null && el('div.ck__bars', {}, TIEU_CHI.map(tc => {
        const d = diem.phan[tc.id]?.diem;
        return el('div.ck__bar', {}, [
          el('span.ck__barlbl', {}, tc.nhan),
          el('span.ck__bartrack', {}, [
            d == null ? null : el('span', { style: { width: `${d * 10}%`, background: nhanDiem(d).mau } })
          ]),
          el('span.ck__barval', d == null ? { class: 'ck__barval pending' } : {}, d == null ? '—' : d.toFixed(1))
        ]);
      })),

      el('div.ck__grid', {}, [
        o('Loại hình', tenLoaiHinh(p.loaiHinh)),
        o('Giá từ', co(p.giaTu) ? gia(p.giaTu, p.donViGia) : null),
        o('Quy mô', p.quyMo),
        o('Bàn giao', p.banGiao),
        o('Pháp lý', p.phapLy),
        o('Ga gần nhất', ga ? `${ga.name} · ${chuyenDi(ga.diXe)}` : null)
      ]),

      noiBat.length ? el('div.ck__ti', {}, [
        el('div.ck__titl', {}, 'Tiện ích trong 2 km'),
        el('div.row.wrap', {}, noiBat.map(d => el('span.ck__tichip', {}, [
          el('span', {}, nhom[d.nhom]?.icon ?? '📍'),
          el('span.grow', {}, d.name),
          el('span.muted', {}, chuyenDi(d.diXe))
        ])))
      ]) : null,

      el('div.ck__foot', {}, 'Khoảng cách đo theo đường thật. Số liệu theo hồ sơ đang niêm yết, ' +
        'có thể thay đổi — vui lòng xác nhận lại trước khi quyết định.')
    ]),

    el('button.ck__exit', { type: 'button', dataset: { act: 'tat-gui-khach' }, title: 'Thoát chế độ gửi khách' }, '✕ Thoát')
  ]);
}

function o(k, v) {
  return el('div.ck__o', {}, [
    el('span.ck__ok', {}, k),
    co(v) ? el('span.ck__ov', {}, String(v)) : el('span.ck__ov.pending', {}, CHUA_CO)
  ]);
}

export { ve as veLaiGuiKhach };

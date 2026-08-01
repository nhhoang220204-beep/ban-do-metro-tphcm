/**
 * amenities.js — vòng bán kính và ghim tiện ích quanh dự án đang xem.
 *
 * Vòng tròn vẽ theo bán kính đường chim bay vì đó là cách duy nhất vẽ được một
 * vòng trên bản đồ. Nhưng việc một tiện ích có LỌT vào bán kính hay không thì
 * xét theo khoảng cách ĐƯỜNG THẬT — nên đôi khi có điểm nằm trong vòng tròn mà
 * không hiện, do đường đi vòng qua sông hoặc qua cầu. Đó là hành vi đúng: thứ
 * người tư vấn cần nói với khách là quãng đường phải đi, không phải khoảng cách
 * trên giấy.
 */

import { state } from '../core/store.js';
import { tienIchCua, nhomTienIch, cacBanKinh } from '../core/data.js';
import { map, canvasRenderer } from '../map/engine.js';
import { ghimPoi, nhanBanKinh } from '../map/icons.js';
import { chuyenDi } from '../core/format.js';
import { esc } from '../core/dom.js';

let lopVong = null;
let lopTienIch = null;

/* ─── §1 · VÒNG BÁN KÍNH ────────────────────────────────────────────────── */

export function veVongBanKinh(duAn) {
  xoaVongBanKinh();
  if (!duAn?.toaDo) return;

  lopVong = L.layerGroup().addTo(map);

  for (const m of cacBanKinh()) {
    const dangChon = m === state.banKinh;
    L.circle(duAn.toaDo, {
      renderer: canvasRenderer,
      radius: m,
      color: dangChon ? 'var(--c-brand)' : '#94a3b8',
      weight: dangChon ? 2 : 1,
      opacity: dangChon ? 0.9 : 0.4,
      fillColor: '#1d4ed8',
      fillOpacity: dangChon ? 0.05 : 0,
      dashArray: dangChon ? null : '4 5',
      interactive: false
    }).addTo(lopVong);

    /* Nhãn đặt ở rìa phía bắc của vòng. Quy đổi mét sang độ vĩ: 1 độ ≈ 111 km. */
    L.marker([duAn.toaDo[0] + m / 111000, duAn.toaDo[1]], {
      icon: nhanBanKinh(m < 1000 ? `${m} m` : `${m / 1000} km`),
      interactive: false,
      opacity: dangChon ? 1 : 0.55
    }).addTo(lopVong);
  }

  lopVong.eachLayer(l => l.bringToBack?.());
}

export function xoaVongBanKinh() {
  if (lopVong) { map.removeLayer(lopVong); lopVong = null; }
}

/* ─── §2 · GHIM TIỆN ÍCH ────────────────────────────────────────────────── */

export function hienTienIch(duAn) {
  xoaTienIch();
  if (!duAn?.toaDo) return;

  const nhom = nhomTienIch();
  const diem = tienIchCua(duAn.id).filter(d => {
    const m = d.diXe?.m ?? d.diBo?.m;
    if (m == null || m > state.banKinh) return false;
    return !state.nhomTienIch || d.nhom === state.nhomTienIch;
  });
  if (!diem.length) return;

  lopTienIch = L.layerGroup().addTo(map);
  for (const d of diem) {
    const n = nhom[d.nhom] ?? {};
    L.marker(d.c, { icon: ghimPoi(n.icon ?? '📍', n.mau ?? '#475569'), zIndexOffset: 300 })
      .bindTooltip(d.name, { direction: 'top' })
      .bindPopup(`<div class="pop"><div class="pop__body">
        <div class="pop__title">${esc(d.name)}</div>
        <div class="pop__sub">${esc(n.nhan ?? '')}</div>
        <div class="field"><span class="field__k">Đi xe</span><span class="field__v">${esc(chuyenDi(d.diXe))}</span></div>
        <div class="field"><span class="field__k">Đi bộ</span><span class="field__v">${esc(chuyenDi(d.diBo))}</span></div>
      </div></div>`)
      .addTo(lopTienIch);
  }
}

export function xoaTienIch() {
  if (lopTienIch) { map.removeLayer(lopTienIch); lopTienIch = null; }
}

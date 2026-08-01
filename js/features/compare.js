/**
 * compare.js — bảng so sánh tối đa ba dự án.
 *
 * Ô nào một dự án không có dữ liệu thì để "Đang cập nhật" chứ không bỏ trống,
 * để người xem phân biệt được "không có thông tin" với "không có tiện ích đó".
 * Ô tốt nhất từng hàng được đánh dấu, nhưng chỉ khi cả ba dự án đều có số —
 * so sánh hai số với một ô trống là so sánh không công bằng.
 */

import { el, fill } from '../core/dom.js';
import { state } from '../core/store.js';
import { gia, chuyenDi, co, CHUA_CO } from '../core/format.js';
import { gaCua, tienIchCua, nhomTienIch } from '../core/data.js';
import { chamDiem, nhanDiem } from './score.js';
import { boSoSanh, xoaSoSanh, TOI_DA_SO_SANH } from './projects.js';
import { chonDuAn } from './projects.js';
import { logoDuAn } from '../map/icons.js';

let host;

export function khoiTaoSoSanh(node) {
  host = node;
  node.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    ({
      'bo-so-sanh': () => boSoSanh(b.dataset.id),
      'xoa-tat-ca': () => { xoaSoSanh(); dong(); },
      'dong-so-sanh': () => dong(),
      'mo-du-an': () => chonDuAn(b.dataset.id)
    })[b.dataset.act]?.();
  });
}

export function mo() {
  if (!state.soSanh.length) return;
  host.hidden = false;
  ve();
}

export function dong() { host.hidden = true; }

export function veLaiSoSanh() {
  if (!host || host.hidden) return;
  if (!state.soSanh.length) return dong();
  ve();
}

/* ─── Các hàng của bảng ─────────────────────────────────────────────────────
   `lay` trả về { text, num } — `num` dùng để tìm ô tốt nhất, `cao` cho biết
   số lớn hơn là tốt hơn hay ngược lại.                                     */

const HANG = [
  { nhan: 'Giá từ', cao: false,
    lay: p => ({ text: co(p.giaTu) ? gia(p.giaTu, p.donViGia) : null, num: p.giaTu ?? null }) },
  { nhan: 'Giá trung bình', cao: false,
    lay: p => ({ text: co(p.giaTrungBinh) ? gia(p.giaTrungBinh, p.donViGia) : null, num: p.giaTrungBinh ?? null }) },
  { nhan: 'Diện tích', lay: p => ({ text: p.dienTich || null }) },
  { nhan: 'Khoảng cách ga metro', cao: false,
    lay: p => { const g = gaCua(p)?.gaGanNhat;
                return { text: g ? `${g.name} · ${chuyenDi(g.diXe)}` : null, num: g?.diXe?.m ?? null }; } },
  { nhan: 'Đi bộ tới ga', cao: false,
    lay: p => { const g = gaCua(p)?.gaGanNhat;
                return { text: g?.diBo ? chuyenDi(g.diBo) : null, num: g?.diBo?.m ?? null }; } },
  { nhan: 'Nhóm tiện ích trong 2 km', cao: true,
    lay: p => { const t = tienIchCua(p.id);
                if (!t.length) return { text: null };
                const s = new Set(t.filter(d => (d.diXe?.m ?? Infinity) <= 2000).map(d => d.nhom));
                const tong = Object.keys(nhomTienIch()).length || 13;
                return { text: `${s.size}/${tong} nhóm`, num: s.size }; } },
  { nhan: 'AI Score', cao: true,
    lay: p => { const d = chamDiem(p);
                return { text: d.tong == null ? null : `${d.tong}/10 · ${d.soTieuChi}/${d.tongTieuChi} tiêu chí`,
                         num: d.tong, mau: nhanDiem(d.tong).mau }; } },
  { nhan: 'Khả năng cho thuê', cao: true,
    lay: p => { const d = chamDiem(p).phan.choThue;
                return { text: d?.diem == null ? null : `${d.diem.toFixed(1)}/10`, num: d?.diem ?? null }; } },
  { nhan: 'Khả năng tăng giá', cao: true,
    lay: p => { const d = chamDiem(p).phan.tangGia;
                return { text: d?.diem == null ? null : `${d.diem.toFixed(1)}/10`, num: d?.diem ?? null }; } },
  { nhan: 'Pháp lý', lay: p => ({ text: p.phapLy || null }) },
  { nhan: 'Bàn giao', lay: p => ({ text: p.banGiao || null }) },
  { nhan: 'Tổng số căn', lay: p => ({ text: p.tongSoCan || null }) }
];

function ve() {
  const ds = state.soSanh.map(id => state.duAn.find(p => p.id === id)).filter(Boolean);

  fill(host, [
    el('div.cmp__head', {}, [
      el('div.card__title', {}, `So sánh ${ds.length}/${TOI_DA_SO_SANH} dự án`),
      el('div.row', {}, [
        el('button.btn.btn--sm', { type: 'button', dataset: { act: 'xoa-tat-ca' } }, 'Xoá hết'),
        el('button.btn.btn--icon.btn--sm.btn--ghost', { type: 'button', dataset: { act: 'dong-so-sanh' }, title: 'Đóng' }, '✕')
      ])
    ]),

    el('div.tablewrap.cmp__wrap', {}, [
      el('table.tbl.tbl--cmp', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th.tbl__rowhead', {}, ''),
          ...ds.map(p => el('th', {}, [
            el('div.cmp__proj', {}, [
              el('div', { html: logoDuAn(p, 34) }),
              el('button.cmp__name', { type: 'button', dataset: { act: 'mo-du-an', id: p.id } }, p.ten),
              el('button.cmp__rm', { type: 'button', dataset: { act: 'bo-so-sanh', id: p.id }, title: 'Bỏ khỏi bảng' }, '✕')
            ])
          ]))
        ])]),

        el('tbody', {}, HANG.map(h => {
          const o = ds.map(p => h.lay(p));
          /* Chỉ đánh dấu ô tốt nhất khi mọi dự án đều có số để so. */
          const duSo = h.cao != null && o.length > 1 && o.every(x => x.num != null);
          const tot = duSo
            ? o.reduce((best, x, i) => (h.cao ? x.num > o[best].num : x.num < o[best].num) ? i : best, 0)
            : -1;

          return el('tr', {}, [
            el('th.tbl__rowhead', {}, h.nhan),
            ...o.map((x, i) => el('td', { dataset: i === tot ? { tot: '' } : {} },
              x.text == null
                ? [el('span.pending', {}, CHUA_CO)]
                : [el('span', { style: x.mau ? { color: x.mau, fontWeight: '700' } : {} }, x.text)]))
          ]);
        }))
      ])
    ]),

    el('div.cmp__note', {}, 'Ô được tô đậm là số tốt hơn trong hàng đó, chỉ tính khi mọi dự án ' +
      'trong bảng đều có dữ liệu. Khoảng cách đo theo đường thật.')
  ]);
}

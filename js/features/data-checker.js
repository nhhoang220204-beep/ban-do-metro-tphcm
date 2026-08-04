/**
 * data-checker.js — "Kiểm tra dữ liệu": dò lỗi trong danh mục dự án.
 *
 * Chỉ ĐỌC, không sửa gì — an toàn chạy bất cứ lúc nào, không cần Chế độ biên
 * tập GIS đang bật. Một số kiểm tra (thiếu ảnh/logo/thông tin/AI Score) CHỈ
 * áp cho dự án đã kiểm (`nguon: "thu-cong"`) — 1.137 ứng viên OSM "Chưa kiểm"
 * cố tình để trống hầu hết trường theo đúng QĐ-10, báo lỗi cho chúng ở đây
 * sẽ chỉ tạo ra hàng nghìn dòng nhiễu vô ích, không giúp Hoàng tìm việc thật
 * cần làm.
 */

import { el, fill, toast } from '../core/dom.js';
import { state } from '../core/store.js';
import { chiTietDuAn, phuongXa } from '../core/data.js';
import { hopLe } from '../core/geo.js';
import { chamDiem } from './score.js';
import { chonDuAn } from './projects.js';

let host;

export function khoiTaoKiemTra(node) {
  host = node;
  node.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'dong-kt') dong();
    if (b.dataset.act === 'toi-du-an-kt') { dong(); chonDuAn(b.dataset.id); }
  });
}

export function dong() {
  host.hidden = true;
}

const NGUONG_GIA = {
  'trđ/m²':  { min: 5, max: 500 },
  'trđ/căn': { min: 200, max: 200000 }
};

const NGUONG_TRUNG_MARKER_M = 15; // dưới ngưỡng này coi là trùng vị trí

export async function chayKiemTra() {
  toast('Đang kiểm tra dữ liệu…', 'info', 2000);
  const ds = state.duAn;
  const loi = { trungTen: [], saiToaDo: [], ngoaiPhuongXa: [], trungMarker: [], giaBatThuong: [],
                thieuThongTin: [], thieuAnh: [], thieuLogo: [], thieuScore: [] };

  /* §1 · Trùng tên — so khớp nguyên văn sau khi chuẩn hoá khoảng trắng/hoa thường. */
  const theoTen = new Map();
  for (const p of ds) {
    const key = (p.ten ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) continue;
    if (!theoTen.has(key)) theoTen.set(key, []);
    theoTen.get(key).push(p);
  }
  for (const nhom of theoTen.values()) {
    if (nhom.length > 1) loi.trungTen.push({ ten: nhom[0].ten, ds: nhom });
  }

  /* §2 · Sai toạ độ (BR-2) và §3 · nằm ngoài mọi phường/xã dù trong khung bao. */
  for (const p of ds) {
    if (!p.toaDo) continue;
    if (!hopLe(p.toaDo)) loi.saiToaDo.push(p);
    else if (!phuongXa(p.toaDo)) loi.ngoaiPhuongXa.push(p);
  }

  /* §4 · Trùng marker — nhiều dự án khác id cùng một vị trí (trong bán kính nhỏ). */
  const coToaDo = ds.filter(p => p.toaDo && hopLe(p.toaDo));
  const daGhep = new Set();
  for (let i = 0; i < coToaDo.length; i++) {
    if (daGhep.has(coToaDo[i].id)) continue;
    const nhom = [coToaDo[i]];
    for (let j = i + 1; j < coToaDo.length; j++) {
      if (daGhep.has(coToaDo[j].id)) continue;
      if (haversine(coToaDo[i].toaDo, coToaDo[j].toaDo) <= NGUONG_TRUNG_MARKER_M) {
        nhom.push(coToaDo[j]);
        daGhep.add(coToaDo[j].id);
      }
    }
    if (nhom.length > 1) { daGhep.add(coToaDo[i].id); loi.trungMarker.push(nhom); }
  }

  /* §5 · Giá bất thường — ngoài khoảng hợp lý, hoặc giá trung bình thấp hơn giá từ. */
  for (const p of ds) {
    const nguong = NGUONG_GIA[p.donViGia] ?? NGUONG_GIA['trđ/m²'];
    const canhBao = [];
    if (p.giaTu != null && (p.giaTu < nguong.min || p.giaTu > nguong.max)) {
      canhBao.push(`Giá từ ${p.giaTu} ${p.donViGia} ngoài khoảng thường gặp (${nguong.min}–${nguong.max})`);
    }
    if (p.giaTrungBinh != null && p.giaTu != null && p.giaTrungBinh < p.giaTu) {
      canhBao.push(`Giá trung bình (${p.giaTrungBinh}) thấp hơn giá từ (${p.giaTu})`);
    }
    if (canhBao.length) loi.giaBatThuong.push({ p, canhBao });
  }

  /* §6-9 · Chỉ kiểm dự án ĐÃ KIỂM (thu-cong) — OSM "chưa kiểm" cố tình để trống. */
  const daKiem = ds.filter(p => p.nguon === 'thu-cong');
  for (const p of daKiem) {
    const thieu = [];
    if (!p.chuDauTu) thieu.push('chủ đầu tư');
    if (p.giaTu == null) thieu.push('giá từ');
    if (!p.toaDo) thieu.push('toạ độ');
    if (thieu.length) loi.thieuThongTin.push({ p, thieu });

    const diem = chamDiem(p);
    if (diem.tong == null) loi.thieuScore.push(p);

    const ct = await chiTietDuAn(p.id).catch(() => null);
    if (!ct?.anh?.length) loi.thieuAnh.push(p);
    if (!ct?.logo) loi.thieuLogo.push(p);
  }

  veKetQua(loi, ds.length, daKiem.length);
  return loi;
}

function haversine(a, b) {
  const RAD = Math.PI / 180, R = 6371000;
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/* ─── Giao diện kết quả ─────────────────────────────────────────────────── */

const NHOM = [
  ['trungTen', '🔁 Trùng tên', 'Nhiều dự án khác id nhưng cùng tên — có thể là dữ liệu trùng lặp.'],
  ['trungMarker', '📍 Trùng marker', `Nhiều dự án khác id nhưng vị trí cách nhau dưới ${NGUONG_TRUNG_MARKER_M}m.`],
  ['saiToaDo', '⚠ Sai toạ độ', 'Toạ độ nằm ngoài phạm vi TP.HCM và vùng lân cận (BR-2).'],
  ['ngoaiPhuongXa', '🗺 Ngoài phường/xã', 'Toạ độ hợp lệ nhưng không rơi vào phường/xã nào — có thể lệch vị trí.'],
  ['giaBatThuong', '💰 Giá bất thường', 'Giá ngoài khoảng thường gặp, hoặc giá trung bình thấp hơn giá từ.'],
  ['thieuThongTin', '📋 Thiếu thông tin (dự án đã kiểm)', 'Dự án đã kiểm nhưng còn thiếu trường cơ bản.'],
  ['thieuAnh', '🖼 Thiếu ảnh (dự án đã kiểm)', 'Dự án đã kiểm nhưng chưa có ảnh trong hồ sơ.'],
  ['thieuLogo', '🏷 Thiếu logo (dự án đã kiểm)', 'Dự án đã kiểm nhưng chưa có logo.'],
  ['thieuScore', '📊 Thiếu AI Score (dự án đã kiểm)', 'Dự án đã kiểm nhưng chưa chấm được điểm nào (thường do thiếu toạ độ).']
];

function veKetQua(loi, tongDuAn, tongDaKiem) {
  const tongLoi = Object.values(loi).reduce((a, arr) => a + arr.length, 0);

  fill(host, [
    el('div.cmp__head', {}, [
      el('div', {}, [
        el('h3', {}, '🔍 Kiểm tra dữ liệu'),
        el('div.muted', {}, `${tongDuAn} dự án · ${tongDaKiem} đã kiểm · ${tongLoi} mục cần chú ý`)
      ]),
      el('button.btn.btn--icon.btn--ghost', { type: 'button', dataset: { act: 'dong-kt' } }, '✕')
    ]),
    el('div.cmp__wrap', {}, [
      tongLoi === 0
        ? el('div.empty', {}, [el('div.empty__icon', {}, '✅'), el('div', {}, 'Không phát hiện lỗi nào trong các mục đã kiểm tra.')])
        : el('div', { style: { padding: 'var(--s3) var(--s4)' } }, NHOM.flatMap(([key, nhan, giaiThich]) => {
            const items = loi[key];
            if (!items.length) return [];
            return [
              el('div.sect__title', {}, `${nhan} · ${items.length}`),
              el('div.panel__hint', { style: { marginBottom: 'var(--s2)' } }, giaiThich),
              el('div.card', {}, [el('div.card__body', {}, items.slice(0, 100).map(x => veDong(key, x)))]),
              items.length > 100 ? el('div.panel__hint', {}, `… và ${items.length - 100} mục khác.`) : null
            ];
          }))
    ]),
    el('div.cmp__note', {}, 'Chỉ đọc dữ liệu, không tự sửa gì. Bấm tên dự án để mở hồ sơ và tự sửa trong Chế độ biên tập GIS.')
  ]);
  host.hidden = false;
}

function veDong(key, x) {
  if (key === 'trungTen') return el('div.field', {}, [
    el('span.field__k', {}, x.ten),
    el('div', {}, x.ds.map(p => nutDuAn(p)))
  ]);
  if (key === 'trungMarker') return el('div.field', {}, [
    el('span.field__k', {}, x[0].toaDo.map(n => n.toFixed(5)).join(', ')),
    el('div', {}, x.map(p => nutDuAn(p)))
  ]);
  if (key === 'giaBatThuong') return el('div.field', {}, [
    nutDuAn(x.p),
    el('div.panel__hint', {}, x.canhBao.join(' · '))
  ]);
  if (key === 'thieuThongTin') return el('div.field', {}, [
    nutDuAn(x.p),
    el('span.muted', {}, 'Thiếu: ' + x.thieu.join(', '))
  ]);
  return el('div.field', {}, [nutDuAn(x)]);
}

function nutDuAn(p) {
  return el('button.link-btn', { type: 'button', dataset: { act: 'toi-du-an-kt', id: p.id } }, p.ten || p.id);
}

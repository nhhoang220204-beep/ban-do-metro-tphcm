/**
 * search.js — ô tìm kiếm trên thanh trên cùng.
 *
 * Tìm cùng lúc trong: tên dự án, địa chỉ, chủ đầu tư, ga và tuyến metro, tiện
 * ích quanh các dự án, đường bộ, khu công nghiệp và phường/xã.
 *
 * Không phân biệt dấu: cả từ khoá lẫn dữ liệu đều bỏ dấu trước khi so, nên gõ
 * "binh duong" vẫn ra "Bình Dương". Người đang tư vấn qua điện thoại không có
 * thời gian gõ đủ dấu.
 */

import { el, fill, debounce } from '../core/dom.js';
import { state } from '../core/store.js';
import { duLieu, tienIchCua, nhomTienIch } from '../core/data.js';
import { slug } from '../core/format.js';
import { tenLoaiHinh } from '../core/data.js';
import { map, bayToi } from '../map/engine.js';
import { chonDuAn } from './projects.js';

const TOI_DA = 12;
let elInput, elKetQua;

export function khoiTaoTimKiem(input, ketQua) {
  elInput = input;
  elKetQua = ketQua;

  const chay = debounce(() => ve(input.value.trim()), 160);
  input.addEventListener('input', chay);
  input.addEventListener('focus', () => input.value.trim() && ve(input.value.trim()));

  input.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { input.value = ''; dong(); input.blur(); }
    if (ev.key === 'Enter') elKetQua.querySelector('.res')?.click();
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      elKetQua.querySelector('.res')?.focus();
    }
  });

  /* Bấm ra ngoài thì đóng danh sách kết quả. */
  document.addEventListener('click', ev => {
    if (!ketQua.contains(ev.target) && ev.target !== input) dong();
  });
}

export function dong() { elKetQua.hidden = true; }

/* ─── Thu thập mọi thứ có thể tìm ───────────────────────────────────────── */

/**
 * Nhớ lại danh sách nguồn thay vì dựng lại sau mỗi lần gõ phím.
 *
 * Với hàng nghìn dự án cộng hàng nghìn điểm hạ tầng, dựng lại mỗi lần gõ là
 * hàng chục nghìn phép nối chuỗi và bỏ dấu cho đúng một ký tự vừa nhập.
 * Gọi quenNguonTim() khi danh mục đổi.
 */
let boNho = null;
export function quenNguonTim() { boNho = null; }

function nguon() {
  if (boNho) return boNho;
  const out = [];

  for (const p of state.duAn) {
    out.push({
      loai: 'Dự án', icon: '🏢', ten: p.ten,
      phu: [p.chuDauTu, p.diaChi].filter(Boolean).join(' · ') ||
           (p.nguon === 'osm' ? 'Ứng viên OpenStreetMap · chưa kiểm' : 'Chưa có địa chỉ'),
      khoa: slug([p.ten, p.ma, p.chuDauTu, p.diaChi, tenLoaiHinh(p.loaiHinh)].filter(Boolean).join(' ')),
      di: () => chonDuAn(p.id)
    });
  }

  for (const ga of duLieu.stations?.stations ?? []) {
    const ten = ga.lines.map(id => duLieu.metro.lines.find(l => l.id === id)?.name).filter(Boolean);
    out.push({
      loai: 'Ga metro', icon: '🚉', ten: `Ga ${ga.name}`,
      phu: ten.join(' · '),
      khoa: slug(`ga ${ga.name} ${ten.join(' ')}`),
      di: () => bayToi(ga.c, 16)
    });
  }

  for (const l of duLieu.metro?.lines ?? []) {
    out.push({
      loai: 'Tuyến metro', icon: '🚇', ten: l.name, phu: l.route,
      khoa: slug(`${l.name} ${l.route} ${l.alias ?? ''}`),
      di: () => { const pts = l.shape.flat(); if (pts.length) map.flyToBounds(L.latLngBounds(pts), { padding: [50, 50] }); }
    });
  }

  for (const r of duLieu.roads?.roads ?? []) {
    out.push({
      loai: duLieu.roads.loai[r.kind].nhan, icon: '🛣', ten: r.name, phu: r.ref ?? '',
      khoa: slug(`${r.name} ${r.ref ?? ''}`),
      di: () => { const pts = r.shape.flat(); if (pts.length) map.flyToBounds(L.latLngBounds(pts), { padding: [50, 50] }); }
    });
  }

  for (const k of duLieu.industrial?.items ?? []) {
    out.push({ loai: 'Khu công nghiệp', icon: '🏭', ten: k.name, phu: '',
               khoa: k.slug ?? slug(k.name), di: () => bayToi(k.c, 15) });
  }

  for (const u of duLieu.boundaries?.units ?? []) {
    if (u.level !== 6) continue;
    out.push({ loai: 'Phường · xã', icon: '🗺', ten: u.name, phu: '',
               khoa: u.slug ?? slug(u.name),
               di: () => map.flyToBounds(L.latLngBounds(u.rings.flat()), { padding: [40, 40] }) });
  }

  /* Tiện ích chỉ có dữ liệu quanh các dự án đã ghim — nói rõ nó thuộc dự án nào. */
  const nhom = nhomTienIch();
  for (const p of state.duAn) {
    for (const d of tienIchCua(p.id)) {
      out.push({
        loai: nhom[d.nhom]?.nhan ?? 'Tiện ích', icon: nhom[d.nhom]?.icon ?? '📍',
        ten: d.name, phu: `Gần ${p.ten}`,
        khoa: slug(`${d.name} ${p.ten}`),
        di: () => bayToi(d.c, 17)
      });
    }
  }

  boNho = out;
  return out;
}

/* ─── Vẽ kết quả ────────────────────────────────────────────────────────── */

function ve(tuKhoa) {
  if (tuKhoa.length < 2) return dong();
  const k = slug(tuKhoa);

  /* Khớp từ đầu chuỗi xếp trên khớp giữa chuỗi — gõ "sun" thì Sun Casa phải
     lên trước "Trạm xăng Sun". */
  const hit = [];
  const seen = new Set();
  for (const m of nguon()) {
    const i = m.khoa.indexOf(k);
    if (i < 0) continue;
    const id = `${m.loai}|${m.ten}`;
    if (seen.has(id)) continue;
    seen.add(id);
    hit.push({ ...m, uuTien: i === 0 ? 0 : 1, viTri: i });
  }
  hit.sort((a, b) => a.uuTien - b.uuTien || a.viTri - b.viTri || a.ten.localeCompare(b.ten, 'vi'));

  if (!hit.length) {
    fill(elKetQua, [el('div.res__empty', {}, `Không tìm thấy "${tuKhoa}"`)]);
    elKetQua.hidden = false;
    return;
  }

  fill(elKetQua, [
    ...hit.slice(0, TOI_DA).map(m =>
      el('button.res', { type: 'button', onclick: () => { m.di(); dong(); elInput.blur(); } }, [
        el('span.res__icon', {}, m.icon),
        el('span.grow', {}, [
          el('span.res__ten', {}, m.ten),
          m.phu && el('span.res__phu.ellipsis', {}, m.phu)
        ]),
        el('span.res__loai', {}, m.loai)
      ])),
    hit.length > TOI_DA && el('div.res__more', {}, `và ${hit.length - TOI_DA} kết quả khác`)
  ]);
  elKetQua.hidden = false;
}

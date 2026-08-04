/**
 * gis-editor.js — Chế độ biên tập GIS nội bộ.
 *
 * Công cụ để HOÀNG tự dựng dữ liệu (ga metro, đường vành đai), KHÔNG phải chế
 * độ xem của khách. Khi bật, ga/đoạn còn "tạm" (chưa xác minh) hiện lên có thể
 * kéo-thả, sửa toạ độ tay, thêm/bớt điểm trên polyline — rồi bấm "Lưu" để ghi
 * thẳng xuống data/stations.json hoặc data/ring_roads.json.
 *
 * "Lưu" chỉ hoạt động khi chạy `node tools/serve.mjs` trên máy (máy chủ cục bộ
 * mới có endpoint ghi file — xem tools/serve.mjs). Trên GitHub Pages (site
 * tĩnh) nút Lưu sẽ báo lỗi rõ ràng thay vì im lặng mất dữ liệu.
 *
 * Ga/đoạn "tạm" không bao giờ bị coi là đã xác minh — badge, màu, và câu chữ
 * trong toàn bộ ứng dụng đều phải nói rõ đây là dữ liệu do người dùng tự ước
 * lượng để dựng bản đồ, chưa đối chiếu thực địa.
 */

import { el, fill, toast, delegate } from '../core/dom.js';
import { state, set, on } from '../core/store.js';
import { duLieu, danhMuc } from '../core/data.js';
import { luuFile } from '../core/luu-local.js';
import { map, canvasRenderer } from '../map/engine.js';
import { veLai as veLaiVanhDai, cacTuyenVD } from './vanhdai.js';
import { themDuAnMoi } from './project-editor.js';

let host;
let lopGaTam = null;    // L.layerGroup — ga chưa xác minh
let lopSuaDoan = null;  // L.layerGroup — tay cầm sửa polyline đoạn vành đai
let highlightLine = null;

/* ─── §1 · KHỞI TẠO ─────────────────────────────────────────────────────── */

export function khoiTaoBienTap(node) {
  host = node;

  delegate(node, 'click', {
    'dong-bien-tap':  () => batTat(false),
    'loc-hien-thi':   btn => datLocHienThi(btn.dataset.gia),
    'dong-sua-doan':  () => set({ doanDangSua: null }, 'doan-sua-doi'),
    'luu-doan':       () => luuDoanDangSua(),
    'xoa-doan-tam':   () => xoaDoanDangSua(),
    'them-du-an':     () => themDuAnMoi()
  });

  on('doan-sua-doi', () => { veTrangThaiSuaDoan(); veNoiDungPanel(); });
  on('du-an-doi', () => { if (state.bienTap) veNoiDungPanel(); });
  on('sua-du-an-doi', () => { if (state.bienTap) veNoiDungPanel(); });
}

export function batTat(bat = !state.bienTap) {
  set({ bienTap: bat }, 'bien-tap-doi');
  host.hidden = !bat;
  document.querySelector('[data-act="bien-tap"]')?.setAttribute('aria-pressed', String(bat));

  if (!bat) {
    set({ doanDangSua: null }, 'doan-sua-doi');
    veTrangThaiSuaDoan();
  } else {
    toast('Chế độ biên tập GIS: dữ liệu tạm không phải dữ liệu công bố.', 'info', 4000);
  }

  veLaiGaTam();
  veLaiVanhDai();
  veNoiDungPanel();
}

function datLocHienThi(gia) {
  set({ locHienThi: gia }, 'loc-hien-thi-doi');
  veLaiGaTam();
  veLaiVanhDai();
  veNoiDungPanel();
}

/* ─── §2 · GA METRO TẠM ─────────────────────────────────────────────────── */

function taoIconGaTam() {
  return L.divIcon({ html: '<div class="station-tam">🟡</div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
}

export function khoiTaoLopGaTam() {
  lopGaTam = L.layerGroup();
  veLaiGaTam();
  return lopGaTam;
}

export function veLaiGaTam() {
  if (!lopGaTam) return;
  lopGaTam.clearLayers();

  const hienGaTam = state.locHienThi !== 'xac-minh';
  if (hienGaTam && map.hasLayer(lopGaTam) === false) lopGaTam.addTo(map);
  if (!hienGaTam && map.hasLayer(lopGaTam)) map.removeLayer(lopGaTam);
  if (!hienGaTam) return;

  for (const ga of duLieu.stations?.stations?.filter(g => g.tamThoi) ?? []) {
    const marker = L.marker(ga.c, { icon: taoIconGaTam(), draggable: state.bienTap, zIndexOffset: 350 });
    marker.bindTooltip(`🟡 ${ga.name} · Tọa độ tạm`, { direction: 'top', offset: [0, -10] });
    marker.bindPopup(() => noiDungPopupGa(ga, marker), { minWidth: 230 });

    marker.on('dragend', () => {
      const c = marker.getLatLng();
      ga.c = [+c.lat.toFixed(6), +c.lng.toFixed(6)];
      marker.openPopup();
    });

    marker.addTo(lopGaTam);
  }
}

function noiDungPopupGa(ga, marker) {
  const inpLat = el('input.inp', { type: 'text', inputmode: 'decimal', value: ga.c[0] });
  const inpLng = el('input.inp', { type: 'text', inputmode: 'decimal', value: ga.c[1] });

  const luu = async () => {
    const lat = parseFloat(inpLat.value), lng = parseFloat(inpLng.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return toast('Toạ độ không hợp lệ', 'warn');
    ga.c = [lat, lng];
    marker.setLatLng([lat, lng]);
    if (await luuFile('stations', duLieu.stations)) marker.closePopup();
  };
  const xoa = async () => {
    duLieu.stations.stations = duLieu.stations.stations.filter(g => g.id !== ga.id);
    if (await luuFile('stations', duLieu.stations)) { marker.closePopup(); veLaiGaTam(); }
  };

  return el('div.editor-pop', {}, [
    el('div.editor-pop__title', {}, ga.name),
    el('div.field', {}, [el('span.field__k', {}, 'Vĩ độ'), inpLat]),
    el('div.field', {}, [el('span.field__k', {}, 'Kinh độ'), inpLng]),
    el('div.row.wrap', { style: { marginTop: 'var(--s2)' } }, [
      el('button.btn.btn--sm.btn--primary', { type: 'button', onclick: luu }, 'Lưu toạ độ'),
      el('button.btn.btn--sm.btn--ghost', { type: 'button', onclick: xoa }, 'Xoá ga tạm')
    ]),
    el('div.panel__hint', {}, state.bienTap
      ? 'Kéo marker trên bản đồ hoặc sửa số trực tiếp rồi bấm "Lưu toạ độ".'
      : 'Bật chế độ biên tập (nút 🛠 trên thanh trên) để kéo được marker.')
  ]);
}

/* ─── §3 · SỬA POLYLINE ĐOẠN VÀNH ĐAI ───────────────────────────────────── */

function timDoan(id) {
  for (const t of cacTuyenVD()) {
    const d = t.doan.find(x => x.id === id);
    if (d) return { doan: d, tuyen: t };
  }
  return null;
}

function taoIconTayCam(chinh) {
  return L.divIcon({
    html: `<div class="tay-cam${chinh ? '' : ' tay-cam--mid'}"></div>`,
    className: '', iconSize: chinh ? [14, 14] : [9, 9], iconAnchor: chinh ? [7, 7] : [4, 4]
  });
}

function veTrangThaiSuaDoan() {
  lopSuaDoan?.clearLayers();
  if (lopSuaDoan && map.hasLayer(lopSuaDoan)) map.removeLayer(lopSuaDoan);

  if (!state.doanDangSua) return;
  const kq = timDoan(state.doanDangSua);
  if (!kq) return;

  lopSuaDoan ??= L.layerGroup();
  lopSuaDoan.addTo(map);
  veLaiTayCam(kq.doan);

  map.flyToBounds(L.polyline(kq.doan.polyline).getBounds(), { padding: [90, 90], maxZoom: 16 });
}

function veLaiTayCam(doan) {
  lopSuaDoan.clearLayers();

  highlightLine = L.polyline(doan.polyline, {
    renderer: canvasRenderer, color: '#ec4899', weight: 6, opacity: 0.5, dashArray: '3 9'
  }).addTo(lopSuaDoan);

  /* Điểm giữa — bấm để chèn thêm một điểm vào đúng chỗ đó. */
  for (let i = 0; i < doan.polyline.length - 1; i++) {
    const a = doan.polyline[i], b = doan.polyline[i + 1];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    L.marker(mid, { icon: taoIconTayCam(false), zIndexOffset: 480 })
      .bindTooltip('Bấm để thêm điểm', { direction: 'top' })
      .on('click', () => {
        doan.polyline.splice(i + 1, 0, mid);
        veLaiTayCam(doan);
        veLaiVanhDai();
      })
      .addTo(lopSuaDoan);
  }

  /* Điểm chính — kéo để di chuyển, bấm để xoá. */
  doan.polyline.forEach((pt, i) => {
    const m = L.marker(pt, { icon: taoIconTayCam(true), draggable: true, zIndexOffset: 500 });
    m.bindTooltip('Kéo để di chuyển · bấm để xoá', { direction: 'top' });
    m.on('drag', () => {
      const c = m.getLatLng();
      doan.polyline[i] = [+c.lat.toFixed(6), +c.lng.toFixed(6)];
      highlightLine.setLatLngs(doan.polyline);
    });
    m.on('dragend', () => veLaiVanhDai());
    m.on('click', () => {
      if (doan.polyline.length <= 2) return toast('Đoạn cần giữ ít nhất 2 điểm', 'warn');
      doan.polyline.splice(i, 1);
      veLaiTayCam(doan);
      veLaiVanhDai();
    });
    m.addTo(lopSuaDoan);
  });
}

async function luuDoanDangSua() {
  const kq = timDoan(state.doanDangSua);
  if (!kq) return;
  kq.doan.daiKm = +tinhDaiKm(kq.doan.polyline).toFixed(2);
  if (await luuFile('ring_roads', duLieu.ring_roads)) toast('Đã lưu đoạn ' + kq.doan.tenDoan, 'ok');
}

async function xoaDoanDangSua() {
  const kq = timDoan(state.doanDangSua);
  if (!kq) return;
  if (kq.doan.trangThai !== 'tam-so-hoa') {
    return toast('Chỉ xoá được đoạn "Tạm số hoá" — đoạn có nguồn OSM không xoá qua đây.', 'warn', 5000);
  }
  kq.tuyen.doan = kq.tuyen.doan.filter(d => d.id !== kq.doan.id);
  set({ doanDangSua: null }, 'doan-sua-doi');
  if (await luuFile('ring_roads', duLieu.ring_roads)) { veLaiVanhDai(); toast('Đã xoá đoạn tạm', 'ok'); }
}

function tinhDaiKm(polyline) {
  const RAD = Math.PI / 180, R = 6371000;
  let m = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i], b = polyline[i + 1];
    const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
    m += 2 * R * Math.asin(Math.sqrt(s));
  }
  return m / 1000;
}

/* ─── §5 · PANEL ĐIỀU KHIỂN ─────────────────────────────────────────────── */

const NHAN_LOC = { 'xac-minh': 'Chỉ dữ liệu xác minh', 'tam': 'Chỉ dữ liệu tạm', 'tat-ca': 'Hiện tất cả' };

export function veNoiDungPanel() {
  if (!host) return;

  const soGaTam = duLieu.stations?.stations?.filter(g => g.tamThoi).length ?? 0;
  const soDoanTam = cacTuyenVD().flatMap(t => t.doan).filter(d => d.trangThai === 'tam-so-hoa').length;
  const dangSua = state.doanDangSua ? timDoan(state.doanDangSua) : null;

  fill(host, [
    el('div.editor__head', {}, [
      el('div', {}, [
        el('div.editor__title', {}, '🛠 Chế độ biên tập GIS'),
        el('div.editor__sub', {}, 'Công cụ nội bộ để tự dựng dữ liệu — KHÔNG phải trang công bố.')
      ]),
      el('button.btn.btn--icon.btn--ghost', { type: 'button', dataset: { act: 'dong-bien-tap' }, title: 'Tắt chế độ biên tập' }, '✕')
    ]),

    el('div.editor__body', {}, [
      el('div.sect__title', {}, 'Chế độ hiển thị'),
      el('div.row.wrap', {}, Object.entries(NHAN_LOC).map(([gia, nhan]) =>
        el('button.chip', {
          type: 'button', dataset: { act: 'loc-hien-thi', gia },
          'aria-pressed': String(state.locHienThi === gia)
        }, nhan))),

      el('div.field', {}, [el('span.field__k', {}, 'Ga tạm'), el('span.field__v', {}, `${soGaTam} ga · 🟡`)]),
      el('div.field', {}, [el('span.field__k', {}, 'Đoạn vành đai tạm'), el('span.field__v', {}, `${soDoanTam} đoạn`)]),

      dangSua ? el('div.sect__title', {}, 'Đang sửa đoạn') : null,
      dangSua ? el('div.card', {}, [el('div.card__body', {}, [
        el('div.field', {}, [el('span.field__k', {}, 'Tuyến'), el('span.field__v', {}, dangSua.tuyen.ten)]),
        el('div.field', {}, [el('span.field__k', {}, 'Đoạn'), el('span.field__v', {}, dangSua.doan.tenDoan)]),
        el('div.field', {}, [el('span.field__k', {}, 'Chiều dài'), el('span.field__v', {}, `${tinhDaiKm(dangSua.doan.polyline).toFixed(2)} km`)]),
        el('div.row.wrap', { style: { marginTop: 'var(--s2)' } }, [
          el('button.btn.btn--sm.btn--primary', { type: 'button', dataset: { act: 'luu-doan' } }, 'Lưu'),
          dangSua.doan.trangThai === 'tam-so-hoa'
            ? el('button.btn.btn--sm.btn--ghost', { type: 'button', dataset: { act: 'xoa-doan-tam' } }, 'Xoá đoạn tạm')
            : null,
          el('button.btn.btn--sm', { type: 'button', dataset: { act: 'dong-sua-doan' } }, 'Đóng')
        ])
      ])]) : null,

      el('div.sect__title', {}, 'Dự án BĐS'),
      el('div.field', {}, [el('span.field__k', {}, 'Tổng số'), el('span.field__v', {}, `${danhMuc.duAn.length} dự án`)]),
      el('button.btn.btn--sm.btn--primary', { type: 'button', dataset: { act: 'them-du-an' } }, '＋ Thêm dự án mới'),

      el('div.panel__hint', {}, [
        el('b', {}, 'Ga metro: '), 'bật lọc "Chỉ dữ liệu tạm" rồi kéo marker 🟡. ',
        el('b', {}, 'Vành đai: '), 'bấm vào một đoạn màu vàng chấm chấm ("Tạm số hoá") trên bản đồ để mở sửa điểm — ',
        'kéo điểm hồng để di chuyển, bấm điểm để xoá, bấm chấm trắng giữa hai điểm để thêm. ',
        el('b', {}, 'Dự án: '), 'mở hồ sơ một dự án rồi bấm "✏ Sửa dự án" trong hồ sơ để sửa/xoá, ' +
        'kéo marker trên bản đồ để đổi vị trí.'
      ])
    ])
  ]);
}

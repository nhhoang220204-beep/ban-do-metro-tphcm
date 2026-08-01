/**
 * engine.js — khởi tạo Leaflet, ảnh nền, và cụm nút điều khiển bản đồ.
 *
 * Vẽ vector bằng canvas thay vì SVG: bản đồ có hơn 120 tuyến đường bộ, 278
 * ranh khu công nghiệp và hàng trăm đoạn sông. Với SVG thì mỗi đoạn là một
 * nút DOM, kéo bản đồ bắt đầu giật ngay khi bật vài lớp cùng lúc.
 */

import { $, el, toast } from '../core/dom.js';
import { state, emit, taiCaiDat, luuCaiDat } from '../core/store.js';

/** Khung nhìn mặc định: bao trọn TP.HCM mới, trọng tâm ở trục Bình Dương. */
export const VIEW_MAC_DINH = { center: [10.94, 106.72], zoom: 11 };

const NEN = {
  duong: {
    nhan: 'Đường phố',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }
  },
  sang: {
    nhan: 'Nền sáng',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    opts: { maxZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; <a href="https://carto.com/attributions">CARTO</a>' }
  },
  vetinh: {
    nhan: 'Vệ tinh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19, attribution: 'Ảnh vệ tinh: Esri, Maxar, Earthstar Geographics' }
  }
};

export let map = null;
export let canvasRenderer = null;
let lopNen = null;

export function khoiTaoBanDo() {
  map = L.map('map', {
    center: VIEW_MAC_DINH.center,
    zoom: VIEW_MAC_DINH.zoom,
    zoomControl: false,                 // dùng cụm nút riêng cho khớp thiết kế
    attributionControl: true,
    preferCanvas: true,
    zoomSnap: 0.5,                      // zoom mượt hơn, khớp khung nhìn khít hơn
    wheelPxPerZoomLevel: 110,
    minZoom: 8,
    maxZoom: 19,
    worldCopyJump: false
  });

  canvasRenderer = L.canvas({ padding: 0.4 });

  const nen = taiCaiDat().nen ?? 'sang';
  datNen(NEN[nen] ? nen : 'sang');

  map.on('zoomend moveend', () => emit('map-view', map.getZoom()));
  return map;
}

export function datNen(key) {
  const cfg = NEN[key] ?? NEN.sang;
  if (lopNen) map.removeLayer(lopNen);
  lopNen = L.tileLayer(cfg.url, { ...cfg.opts, crossOrigin: true }).addTo(map);
  lopNen.setZIndex(0);
  luuCaiDat({ nen: key });
  emit('map-nen', key);
}

export const danhSachNen = () => Object.entries(NEN).map(([k, v]) => ({ key: k, nhan: v.nhan }));

/* ─── Cụm nút điều khiển ────────────────────────────────────────────────── */

export function dungNutDieuKhien(host) {
  const nut = (act, title, glyph, extra = {}) =>
    el('button.mapctl__btn', { type: 'button', title, 'aria-label': title, dataset: { act }, ...extra }, glyph);

  host.append(
    el('div.mapctl__group', {}, [
      nut('zoom-in', 'Phóng to', '＋'),
      nut('zoom-out', 'Thu nhỏ', '－')
    ]),
    el('div.mapctl__group', {}, [
      nut('locate', 'Vị trí của tôi', '◎'),
      nut('reset', 'Về khung nhìn ban đầu', '⌂'),
      nut('fullscreen', 'Toàn màn hình', '⛶')
    ])
  );

  host.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    ({
      'zoom-in':    () => map.zoomIn(1),
      'zoom-out':   () => map.zoomOut(1),
      'reset':      () => veKhungMacDinh(),
      'locate':     () => dinhVi(btn),
      'fullscreen': () => toanManHinh(btn)
    })[btn.dataset.act]?.();
  });
}

export function veKhungMacDinh() {
  map.flyTo(VIEW_MAC_DINH.center, VIEW_MAC_DINH.zoom, { duration: 0.8 });
}

/** Bay tới một điểm, chừa chỗ cho bảng hồ sơ đang mở bên phải. */
export function bayToi(c, zoom = 15) {
  if (!c) return;
  const chuaBang = state.chon && !state.guiKhach && window.innerWidth > 900;
  const offsetX = chuaBang ? -(parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--w-sidebar')) || 420) / 2 : 0;
  map.flyTo(c, zoom, { duration: 0.9 });
  if (offsetX) map.once('moveend', () => map.panBy([offsetX, 0], { animate: true, duration: 0.35 }));
}

export function veKhungBao(bounds, padding = 60) {
  if (!bounds) return;
  map.flyToBounds(bounds, { padding: [padding, padding], duration: 0.9, maxZoom: 16 });
}

/* ─── Vị trí của tôi ────────────────────────────────────────────────────── */

let markerToi = null;

function dinhVi(btn) {
  if (!navigator.geolocation) return toast('Trình duyệt không hỗ trợ định vị', 'warn');
  btn.dataset.busy = '';
  navigator.geolocation.getCurrentPosition(
    pos => {
      delete btn.dataset.busy;
      const c = [pos.coords.latitude, pos.coords.longitude];
      markerToi?.remove();
      markerToi = L.circleMarker(c, {
        renderer: canvasRenderer, radius: 8, weight: 3,
        color: '#fff', fillColor: '#1d4ed8', fillOpacity: 1
      }).addTo(map).bindTooltip('Vị trí của bạn', { direction: 'top' });
      map.flyTo(c, 15, { duration: 0.9 });
    },
    err => {
      delete btn.dataset.busy;
      toast(err.code === err.PERMISSION_DENIED
        ? 'Bạn đã từ chối quyền truy cập vị trí'
        : 'Không lấy được vị trí hiện tại', 'warn');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

/* ─── Toàn màn hình ─────────────────────────────────────────────────────── */

function toanManHinh(btn) {
  const target = document.documentElement;
  if (!document.fullscreenElement) {
    target.requestFullscreen?.().catch(() => toast('Trình duyệt không cho bật toàn màn hình', 'warn'));
  } else {
    document.exitFullscreen?.();
  }
  /* Đợi trình duyệt đổi kích thước xong rồi mới báo Leaflet đo lại. */
  document.addEventListener('fullscreenchange', () => {
    btn.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    setTimeout(() => map.invalidateSize(), 120);
  }, { once: true });
}

/**
 * layers.js — sổ đăng ký lớp bản đồ và cách vẽ từng lớp.
 *
 * Mỗi lớp bật/tắt độc lập, giống bảng lớp của Google Maps.
 *
 * Hai kỹ thuật giữ cho bản đồ không giật:
 *   1. Lớp điểm dày (1.839 trường học, 834 điểm mua sắm) chỉ vẽ những điểm nằm
 *      trong khung nhìn hiện tại, và chỉ vẽ từ một mức phóng nhất định trở lên.
 *      Kéo bản đồ ở mức 11 mà vẽ cả nghìn ghim thì trình duyệt nào cũng đuối.
 *   2. Đường và vùng vẽ trên canvas (xem engine.js).
 */

import { el, esc, toast } from '../core/dom.js';
import { state, emit, taiCaiDat, luuCaiDat } from '../core/store.js';
import { duLieu, thieu, chuaNap, napLop } from '../core/data.js';
import { map, canvasRenderer } from './engine.js';
import { ghimGa, ghimPoi } from './icons.js';

/* ─── §1 · KHAI BÁO LỚP ─────────────────────────────────────────────────────
   `nhom` chỉ dùng để gom nhóm trong bảng điều khiển.
   `zoomToiThieu` là mức phóng bắt đầu vẽ ghim của lớp đó.                  */

export const LOP = [
  { id: 'metro',      nhan: 'Tuyến Metro',        icon: '🚇', nhom: 'Giao thông', bat: true,  can: 'metro' },
  { id: 'ga',         nhan: 'Ga Metro',           icon: '🚉', nhom: 'Giao thông', bat: true,  can: 'stations' },
  { id: 'duan',       nhan: 'Dự án bất động sản', icon: '🏢', nhom: 'Bất động sản', bat: true, can: 'projects' },
  /* Lớp vành đai đọc từ ring_roads.json — mỗi đoạn một trạng thái, màu và kiểu
     nét theo trạng thái đó. Khác hẳn ba lớp đường bộ bên dưới vốn chỉ vẽ một
     màu cho cả trục. */
  { id: 'vanhdai',    nhan: 'Đường Vành đai',     icon: '🛣', nhom: 'Giao thông', bat: true,  can: 'ring_roads' },
  { id: 'caotoc',     nhan: 'Cao tốc',            icon: '🛤', nhom: 'Giao thông', bat: false, can: 'roads' },
  { id: 'quocLo',     nhan: 'Quốc lộ',            icon: '🚏', nhom: 'Giao thông', bat: false, can: 'roads' },
  { id: 'kcn',        nhan: 'Khu công nghiệp',    icon: '🏭', nhom: 'Tiện ích',   bat: false, can: 'industrial', zoomToiThieu: 12 },
  { id: 'truong',     nhan: 'Trường học',         icon: '🏫', nhom: 'Tiện ích',   bat: false, can: 'schools',    zoomToiThieu: 14 },
  { id: 'benhvien',   nhan: 'Bệnh viện',          icon: '🏥', nhom: 'Tiện ích',   bat: false, can: 'hospitals',  zoomToiThieu: 12 },
  { id: 'ttmua',      nhan: 'Trung tâm thương mại', icon: '🛍', nhom: 'Tiện ích', bat: false, can: 'shopping',   zoomToiThieu: 13 },
  { id: 'congvien',   nhan: 'Công viên',          icon: '🌳', nhom: 'Tiện ích',   bat: false, can: 'parks',      zoomToiThieu: 12 },
  { id: 'song',       nhan: 'Sông · kênh',        icon: '🌊', nhom: 'Tự nhiên',   bat: false, can: 'water' },
  { id: 'ho',         nhan: 'Hồ',                 icon: '💧', nhom: 'Tự nhiên',   bat: false, can: 'water' },
  { id: 'diagioi',    nhan: 'Địa giới hành chính', icon: '🗺', nhom: 'Hành chính', bat: false, can: 'boundaries' }
];

/** Lớp Leaflet của từng lớp dữ liệu, tạo một lần rồi thêm/bớt khỏi bản đồ. */
const groups = new Map();
/** Lớp cần vẽ lại khi khung nhìn đổi. */
const theoKhungNhin = new Map();

/* ─── §2 · KHỞI TẠO ─────────────────────────────────────────────────────── */

export function khoiTaoLop() {
  const luu = taiCaiDat().lop ?? {};

  for (const lop of LOP) {
    /* Lớp thiếu dữ liệu thì tắt hẳn, không để người dùng bật rồi thấy trống. */
    lop.hong = thieu.has(lop.can);
    state.lop[lop.id] = lop.hong ? false : (luu[lop.id] ?? lop.bat);
  }

  for (const lop of LOP) {
    if (!state.lop[lop.id]) continue;
    /* Lớp nặng được nhớ là "đang bật" từ phiên trước thì tải ngầm rồi vẽ, chứ
       không chặn màn hình khởi động chờ nó. */
    if (chuaNap.has(lop.can)) datLop(lop.id, true);
    else bat(lop.id);
  }

  /* Vẽ lại các lớp mật độ dày mỗi khi người dùng kéo hoặc phóng bản đồ. */
  map.on('moveend zoomend', veLaiTheoKhungNhin);
  emit('lop-doi', state.lop);
}

export async function datLop(id, bantat) {
  const lop = LOP.find(l => l.id === id);
  if (!lop || lop.hong) return;

  /* Lớp nặng chỉ tải khi thật sự được bật. Trong lúc tải thì trạng thái đã là
     "bật" để nút không nhấp nháy, nhưng chưa có gì để vẽ. */
  if (bantat && chuaNap.has(lop.can)) {
    state.lop[id] = true;
    emit('lop-dang-tai', { id, dangTai: true });
    const xong = await napLop(lop.can);
    emit('lop-dang-tai', { id, dangTai: false });
    if (!xong) {
      lop.hong = true;
      state.lop[id] = false;
      toast(`Không tải được dữ liệu lớp "${lop.nhan}"`, 'warn');
      emit('lop-doi', state.lop);
      return;
    }
  }

  state.lop[id] = bantat;
  bantat ? bat(id) : tat(id);
  luuCaiDat({ lop: { ...taiCaiDat().lop, [id]: bantat } });
  emit('lop-doi', state.lop);
}

function bat(id) {
  const g = groups.get(id) ?? dungLop(id);
  if (!g) return;
  groups.set(id, g);
  if (!map.hasLayer(g)) g.addTo(map);
  if (theoKhungNhin.has(id)) theoKhungNhin.get(id)();
  /* Nền và địa giới phải nằm dưới; ghim phải nằm trên. */
  if (id === 'diagioi' || id === 'ho' || id === 'kcn' || id === 'congvien') g.bringToBack?.();
}

function tat(id) {
  const g = groups.get(id);
  if (g && map.hasLayer(g)) map.removeLayer(g);
}

function veLaiTheoKhungNhin() {
  for (const [id, fn] of theoKhungNhin) if (state.lop[id]) fn();
}

/* ─── §3 · DỰNG TỪNG LỚP ────────────────────────────────────────────────── */

function dungLop(id) {
  return ({
    metro:    lopMetro,
    ga:       lopGa,
    duan:     () => null,              // do features/projects.js quản lý
    vanhdai:  () => null,              // do features/vanhdai.js quản lý
    caotoc:   () => lopDuong('expressway'),
    quocLo:   () => lopDuong('highway'),
    kcn:      lopKcn,
    truong:   () => lopPoiDay('truong', duLieu.schools, '🏫', '#2563eb'),
    benhvien: () => lopPoiDay('benhvien', duLieu.hospitals, '🏥', '#dc2626'),
    ttmua:    () => lopPoiDay('ttmua', duLieu.shopping, '🛍', '#db2777'),
    congvien: lopCongVien,
    song:     lopSong,
    ho:       lopHo,
    diagioi:  lopDiaGioi
  })[id]?.() ?? null;
}

/* ─── Metro ─────────────────────────────────────────────────────────────── */

function lopMetro() {
  const g = L.layerGroup();
  for (const line of duLieu.metro.lines) {
    /* Tuyến quy hoạch vẽ nét đứt — nhìn là biết chưa có gì ngoài thực địa. */
    const netDut = line.status === 'planned' || line.status === 'preparing';
    for (const shape of line.shape) {
      L.polyline(shape, {
        renderer: canvasRenderer,
        color: line.color,
        weight: line.status === 'operating' ? 5 : 4,
        opacity: line.status === 'operating' ? 0.95 : 0.75,
        dashArray: netDut ? '9 7' : null,
        lineCap: 'round', lineJoin: 'round'
      })
        .bindTooltip(`${line.name} · ${line.route}`, { sticky: true })
        .bindPopup(popupTuyen(line))
        .addTo(g);
    }
  }
  return g;
}

function popupTuyen(line) {
  const st = duLieu.metro.trangThai[line.status];
  const gaThucTe = line.soGa, gaHoSo = line.docStations;
  const phu = gaHoSo ? `${gaThucTe}/${gaHoSo} ga có toạ độ` : `${gaThucTe} ga có toạ độ`;
  return `<div class="pop">
    <div class="pop__head" style="--pop-accent:${line.color}">
      <div class="pop__title">${esc(line.name)}</div>
      <div class="pop__sub">${esc(line.route)}</div>
    </div>
    <div class="pop__body">
      <div class="field"><span class="field__k">Trạng thái</span>
        <span class="field__v"><span class="badge badge--dot" style="color:${st.mau}">${esc(st.nhan)}</span></span></div>
      <div class="field"><span class="field__k">Chiều dài</span>
        <span class="field__v">${line.km ? `${line.km} km theo hình tuyến OSM` : '<span class="pending">Đang cập nhật</span>'}</span></div>
      <div class="field"><span class="field__k">Số ga</span><span class="field__v">${esc(phu)}</span></div>
    </div>
    <div class="pop__foot">Số liệu hồ sơ có thể thay đổi — dẫn kèm "theo hồ sơ đang niêm yết" khi tư vấn.</div>
  </div>`;
}

/* ─── Ga metro ──────────────────────────────────────────────────────────── */

function lopGa() {
  const g = L.layerGroup();
  const mauTuyen = Object.fromEntries(duLieu.metro.lines.map(l => [l.id, l.color]));

  for (const ga of duLieu.stations.stations) {
    /* Ga tạm (chưa xác minh) do gis-editor.js tự quản lý — kéo-thả được, màu
       riêng, ẩn/hiện theo bộ lọc chế độ biên tập. Lớp "Ga Metro" thường chỉ vẽ
       ga đã xác minh, không đổi hành vi khi chế độ biên tập tắt. */
    if (ga.tamThoi) continue;
    const ten = ga.lines.map(id => duLieu.metro.lines.find(l => l.id === id)?.name ?? id);
    L.marker(ga.c, { icon: ghimGa(ga, mauTuyen[ga.lines[0]] ?? '#475569'), zIndexOffset: 200 })
      .bindTooltip(ga.name, { direction: 'top', offset: [0, -8] })
      .bindPopup(`<div class="pop"><div class="pop__head"><div class="pop__title">Ga ${esc(ga.name)}</div>
        <div class="pop__sub">${ga.interchange ? 'Ga trung chuyển · ' : ''}${esc(ten.join(' · '))}</div></div></div>`)
      .addTo(g);
  }
  return g;
}

/* ─── Đường bộ ──────────────────────────────────────────────────────────── */

function lopDuong(kind) {
  const cfg = duLieu.roads.loai[kind];
  const g = L.layerGroup();

  for (const r of duLieu.roads.roads.filter(x => x.kind === kind)) {
    for (const shape of r.shape) {
      L.polyline(shape, {
        renderer: canvasRenderer, color: cfg.mau, weight: cfg.rong,
        opacity: 0.8, lineCap: 'round', lineJoin: 'round'
      })
        .bindTooltip(`${cfg.nhan} · ${r.name}`, { sticky: true })
        .addTo(g);
    }
  }
  return g;
}

/* ─── Khu công nghiệp ───────────────────────────────────────────────────── */

function lopKcn() {
  const g = L.layerGroup();
  /* Ranh vùng vẽ trên canvas nên rẻ, để hiện ở mọi mức phóng. Ghim thì là nút
     DOM thật, phải lọc theo khung nhìn — 278 ghim cùng lúc là quá nhiều. */
  for (const kcn of duLieu.industrial.items) {
    if (!kcn.poly) continue;
    L.polygon(kcn.poly, {
      renderer: canvasRenderer, color: '#7c3aed', weight: 1.5,
      fillColor: '#7c3aed', fillOpacity: 0.16
    }).bindTooltip(kcn.name, { sticky: true }).addTo(g);
  }
  dangKyTheoKhungNhin('kcn', g, duLieu.industrial.items, zoomCua('kcn'), kcn =>
    L.marker(kcn.c, { icon: ghimPoi('🏭', '#7c3aed', true) }).bindTooltip(kcn.name, { direction: 'top' }));
  return g;
}

/* ─── Công viên ─────────────────────────────────────────────────────────── */

function lopCongVien() {
  const g = L.layerGroup();
  for (const p of duLieu.parks.items) {
    if (p.poly) {
      L.polygon(p.poly, {
        renderer: canvasRenderer, color: '#22c55e', weight: 1,
        fillColor: '#22c55e', fillOpacity: 0.22
      }).bindTooltip(p.name, { sticky: true }).addTo(g);
    }
  }
  /* Ghim công viên chỉ hiện khi phóng đủ gần, nếu không sẽ che hết bản đồ. */
  dangKyTheoKhungNhin('congvien', g, duLieu.parks.items, zoomCua('congvien'), p =>
    L.marker(p.c, { icon: ghimPoi('🌳', '#22c55e', true) }).bindTooltip(p.name, { direction: 'top' }));
  return g;
}

/* ─── Sông và hồ ────────────────────────────────────────────────────────── */

function lopSong() {
  const g = L.layerGroup();
  for (const s of duLieu.water.song) {
    for (const shape of s.shape) {
      L.polyline(shape, {
        renderer: canvasRenderer, color: '#0ea5e9',
        weight: s.kind === 'Kênh' ? 2 : 3.5, opacity: 0.7
      }).bindTooltip(`${s.kind} ${s.name}`, { sticky: true }).addTo(g);
    }
  }
  return g;
}

function lopHo() {
  const g = L.layerGroup();
  for (const h of duLieu.water.ho) {
    L.polygon(h.poly, {
      renderer: canvasRenderer, color: '#0284c7', weight: 1,
      fillColor: '#38bdf8', fillOpacity: 0.4
    }).bindTooltip(h.name, { sticky: true }).addTo(g);
  }
  return g;
}

/* ─── Địa giới hành chính ───────────────────────────────────────────────── */

function lopDiaGioi() {
  const g = L.layerGroup();
  for (const u of duLieu.boundaries.units) {
    const capThanhPho = u.level === 4;
    for (const ring of u.rings) {
      L.polyline(ring, {
        renderer: canvasRenderer,
        color: capThanhPho ? '#0f172a' : '#64748b',
        weight: capThanhPho ? 2.5 : 1,
        opacity: capThanhPho ? 0.8 : 0.55,
        dashArray: capThanhPho ? null : '4 4'
      }).bindTooltip(u.name, { sticky: true }).addTo(g);
    }
  }
  return g;
}

/* ─── §4 · LỚP ĐIỂM MẬT ĐỘ DÀY ──────────────────────────────────────────────
   Chỉ vẽ điểm trong khung nhìn, và chỉ từ mức phóng đủ gần. Có trần số ghim
   để một lần kéo bản đồ không bao giờ dựng quá nhiều nút DOM cùng lúc.    */

const TRAN_GHIM = 260;

/** Mức phóng tối thiểu của một lớp — khai báo một chỗ duy nhất, trong LOP. */
const zoomCua = id => LOP.find(l => l.id === id)?.zoomToiThieu ?? 13;

function lopPoiDay(id, nguon, icon, mau) {
  const g = L.layerGroup();
  dangKyTheoKhungNhin(id, g, nguon.items, zoomCua(id), item =>
    L.marker(item.c, { icon: ghimPoi(icon, mau, true) })
      .bindTooltip(`${item.name}${item.kind ? ` · ${item.kind}` : ''}`, { direction: 'top' }));
  return g;
}

function dangKyTheoKhungNhin(id, group, items, zoomToiThieu, taoMarker) {
  const marker = L.layerGroup().addTo(group);
  let dauVetTruoc = '';

  theoKhungNhin.set(id, () => {
    if (map.getZoom() < zoomToiThieu) {
      if (dauVetTruoc !== 'trong') { marker.clearLayers(); dauVetTruoc = 'trong'; }
      emit('lop-qua-xa', { id, zoomToiThieu });
      return;
    }
    const b = map.getBounds().pad(0.25);
    const hien = items.filter(i => b.contains(i.c)).slice(0, TRAN_GHIM);
    /* Khung nhìn đổi chút ít mà tập điểm không đổi thì đừng dựng lại DOM. */
    const dauVet = `${hien.length}|${hien[0]?.id ?? ''}|${hien.at(-1)?.id ?? ''}`;
    if (dauVet === dauVetTruoc) return;
    dauVetTruoc = dauVet;
    marker.clearLayers();
    for (const i of hien) taoMarker(i).addTo(marker);
  });
}

/* ─── §5 · CHÚ THÍCH ────────────────────────────────────────────────────── */

export function veChuThich(host) {
  const hang = [];

  if (state.lop.metro) {
    hang.push(el('div.legend__title', {}, 'Tuyến metro'));
    for (const l of duLieu.metro.lines) {
      hang.push(el('div.legend__row', {}, [
        el('span.legend__swatch', { style: { background: l.color, opacity: l.status === 'operating' ? '1' : '.6' } }),
        el('span.grow.ellipsis', {}, l.name),
        el('span.muted', {}, duLieu.metro.trangThai[l.status].nhan)
      ]));
    }
  }

  /* Vành đai chú thích theo TRẠNG THÁI, không theo tuyến — vì màu trên bản đồ
     là màu trạng thái. Chú thích theo tuyến sẽ nói dối về ý nghĩa màu. */
  if (state.lop.vanhdai && duLieu.ring_roads) {
    hang.push(el('div.legend__title', {}, 'Đường Vành đai'));
    const dung = new Set(duLieu.ring_roads.tuyen.flatMap(t => Object.keys(t.theoTrangThai)));
    for (const [ma, k] of Object.entries(duLieu.ring_roads.trangThai)
                                .sort((a, b) => a[1].thuTu - b[1].thuTu)) {
      if (!dung.has(ma)) continue;
      hang.push(el('div.legend__row', {}, [
        el('span.legend__swatch', {
          style: {
            background: k.net === 'dut'
              ? `repeating-linear-gradient(90deg, ${k.mau} 0 5px, transparent 5px 9px)`
              : k.net === 'cham'
              ? `repeating-linear-gradient(90deg, ${k.mau} 0 2px, transparent 2px 6px)`
              : k.mau
          }
        }),
        el('span.grow', {}, k.nhan),
        k.hieuUng ? el('span.muted', {}, 'nét chạy') : null
      ]));
    }
  }

  const duong = [['caotoc', 'expressway'], ['quocLo', 'highway']].filter(([id]) => state.lop[id]);

  if (duong.length && duLieu.roads) {
    hang.push(el('div.legend__title', {}, 'Đường bộ khác'));
    for (const [, kind] of duong) {
      const c = duLieu.roads.loai[kind];
      hang.push(el('div.legend__row', {}, [
        el('span.legend__swatch', { style: { background: c.mau } }), c.nhan
      ]));
    }
  }

  host.replaceChildren(...hang);
  host.classList.toggle('hidden', hang.length === 0);
}

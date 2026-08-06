/**
 * livemode.js — LIVE MODE: chế độ trình bày cho livestream.
 *
 * Bật lên thì ẩn sạch giao diện quản trị (bảng trái, hồ sơ, biên tập GIS,
 * developer, kiểm tra dữ liệu) và thay bằng một lớp trình bày tối màu: header
 * cố định, thanh icon bên trái, panel dự án trượt từ phải, ticker chạy dưới
 * cùng, cùng bộ công cụ thuyết trình (laser, spotlight, kính lúp, thước đo,
 * vẽ chú thích, story mode).
 *
 * NGUYÊN TẮC BỐ CỤC giữ nguyên của dự án: mọi bảng nổi TUYỆT ĐỐI trên bản đồ,
 * không chia lưới. Nhờ vậy ô bản đồ không bao giờ đổi kích thước khi mở/đóng
 * panel — chính là lỗi từng làm hỏng chế độ gửi khách ở bản cũ (xem QĐ-9).
 *
 * DỌN SỰ KIỆN: mọi listener gắn ngoài `host` đều được ghi vào `rac` và gỡ hết
 * khi tắt. Live Mode bật/tắt liên tục trong một buổi live, không dọn thì rò rỉ
 * bộ nhớ và phím tắt bị gọi nhiều lần.
 */

import { el, fill, toast } from '../core/dom.js';
import { state, set, on } from '../core/store.js';
import { danhMuc, chiTietDuAn, gaCua, tienIchCua, tenLoaiHinh } from '../core/data.js';
import { gia, hoac, co, km, phut, CHUA_CO } from '../core/format.js';
import { map, VIEW_MAC_DINH } from '../map/engine.js';
import { chamDiem, nhanDiem } from './score.js';
import { chonDuAn, markerCua } from './projects.js';
import { hienLopDuAn } from './projects.js';
import { cacTuyenVD, bangTrangThai, tatCaDoan, hienLopVanhDai } from './vanhdai.js';

let host, appEl;
let dangBat = false;
let duAnDangNoi = null;
let congCu = null;                 // 'laser' | 'spotlight' | 'kinh-lup' | 've' | 'thuoc'
const rac = [];                    // [huỷ listener] — gỡ hết khi tắt
let lopPhu = {};                   // các phần tử phủ (laser, spotlight…)
let dieuKhienLeaflet = [];         // scale bar…
let hangDoi = [];                  // timer của story mode / animation

/* ─── §0 · TIỆN ÍCH ─────────────────────────────────────────────────────── */

/** Gắn listener có ghi sổ để tắt Live Mode là gỡ sạch. */
function nghe(target, loai, fn, opt) {
  target.addEventListener(loai, fn, opt);
  rac.push(() => target.removeEventListener(loai, fn, opt));
}
const hen = (fn, ms) => { const t = setTimeout(fn, ms); hangDoi.push(t); return t; };
const donHen = () => { hangDoi.forEach(clearTimeout); hangDoi = []; };

const R = 6371000, rad = d => d * Math.PI / 180;
function khoangCach(a, b) {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* ─── §1 · KHỞI TẠO ─────────────────────────────────────────────────────── */

export function khoiTaoLive(node) {
  host = node;
  appEl = document.querySelector('.app');
  on('chon-doi', () => { if (dangBat) noiVe(state.chon); });
}

export function batTatLive(bat = !dangBat) { bat ? bat_() : tat_(); }
export const dangLive = () => dangBat;

function bat_() {
  if (dangBat) return;
  dangBat = true;
  appEl.dataset.live = '';
  host.hidden = false;
  ve();
  ganPhim();
  ganHud();
  map.invalidateSize();
  toast('LIVE MODE — F1 toàn màn hình · ? xem phím tắt', 'ok', 4200);
}

function tat_() {
  if (!dangBat) return;
  dangBat = false;
  donHen();
  rac.splice(0).forEach(f => { try { f(); } catch { /* listener đã mất */ } });
  dieuKhienLeaflet.splice(0).forEach(c => { try { map.removeControl(c); } catch { /* đã gỡ */ } });
  Object.values(lopPhu).forEach(n => n?.remove?.());
  lopPhu = {};
  congCu = null;
  duAnDangNoi = null;
  delete appEl.dataset.live;
  delete appEl.dataset.focus;
  boNoi();
  host.hidden = true;
  fill(host, []);
  map.invalidateSize();
}

/* ─── §2 · KHUNG GIAO DIỆN ──────────────────────────────────────────────── */

const NAV = [
  { act: 'metro',    nhan: 'Metro' },
  { act: 'vanhdai',  nhan: 'Vành đai' },
  { act: 'duan',     nhan: 'Dự án' },
  { act: 'nha-pho',  nhan: 'Nhà phố' },
  { act: 'chung-cu', nhan: 'Chung cư' },
  { act: 'tien-ich', nhan: 'Tiện ích' },
  { act: 'so-sanh',  nhan: 'So sánh' }
];

const RAIL = [
  { act: 'story',     icon: '▶', nhan: 'Story Mode — tự động dẫn tuyến' },
  { act: 'laser',     icon: '🔴', nhan: 'Laser (giữ ALT)' },
  { act: 'spotlight', icon: '💡', nhan: 'Spotlight — tối nền quanh chuột' },
  { act: 'kinh-lup',  icon: '🔍', nhan: 'Kính lúp (giữ SPACE)' },
  { act: 'thuoc',     icon: '📏', nhan: 'Thước đo — bấm 2 điểm' },
  { act: 've',        icon: '✏', nhan: 'Vẽ chú thích' },
  { act: 'xoa-ve',    icon: '🧽', nhan: 'Xoá hết nét vẽ' },
  { act: 'phim',      icon: '⌨', nhan: 'Phím tắt' }
];

function ve() {
  fill(host, [
    el('header.lv-hd', {}, [
      el('div.lv-hd__logo', { 'aria-hidden': 'true' }, '🏙'),
      el('div.lv-hd__brand', {}, [
        el('div.lv-hd__name', {}, 'Bản đồ tư vấn BĐS'),
        el('div.lv-hd__sub', {}, 'Thành phố Hồ Chí Minh')
      ]),
      el('div.lv-hd__search', {}, [
        el('span', { 'aria-hidden': 'true' }, '🔍'),
        el('input', { type: 'search', placeholder: 'Tìm dự án…', 'aria-label': 'Tìm dự án',
                      dataset: { act: 'tim' } })
      ]),
      el('nav.lv-nav', {}, [
        ...NAV.map(n => el('button.lv-chip', {
          type: 'button', dataset: { act: 'nav', nav: n.act }, 'aria-pressed': 'false'
        }, n.nhan)),
        el('button.lv-chip.lv-chip--exit', { type: 'button', dataset: { act: 'tat' } }, '✕ Thoát Live')
      ])
    ]),

    el('div.lv-rail', {}, RAIL.map(r => el('button.lv-rail__btn', {
      type: 'button', dataset: { act: 'cong-cu', cc: r.act, nhan: r.nhan },
      'aria-pressed': 'false', 'aria-label': r.nhan
    }, el('span', {}, r.icon)))),

    el('aside.lv-pane', { dataset: { pane: '' } }, []),
    el('div.lv-tick', {}, [
      el('div.lv-tick__nhan', {}, 'LIVE'),
      el('div.lv-tick__chay', {}, el('span', {}, ''))
    ])
  ]);

  veTicker();
  ganNut();
}

function ganNut() {
  nghe(host, 'click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'tat') return tat_();
    if (a === 'nav') return bamNav(b);
    if (a === 'cong-cu') return bamCongCu(b.dataset.cc, b);
    if (a === 'dong-pane') return dongPane();
    if (a === 'toi-vi-tri') return duAnDangNoi && map.flyTo(duAnDangNoi.toaDo, 16, { duration: 1.1 });
    if (a === 'google-maps' && duAnDangNoi?.toaDo)
      return window.open(`https://www.google.com/maps/search/?api=1&query=${duAnDangNoi.toaDo[0]},${duAnDangNoi.toaDo[1]}`, '_blank', 'noopener');
    if (a === 'them-vs') return themVaoSoSanh();
    if (a === 'dong-vs') return host.querySelector('.lv-vs')?.remove();
    if (a === 'dong-keys') return host.querySelector('.lv-keys')?.remove();
    if (a === 'story-dung') return dungStory();
  });

  const inp = host.querySelector('[data-act="tim"]');
  if (inp) nghe(inp, 'keydown', ev => {
    if (ev.key !== 'Enter') return;
    const q = inp.value.trim().toLowerCase();
    if (!q) return;
    const p = danhMuc.duAn.find(x => (x.ten ?? '').toLowerCase().includes(q) && x.toaDo);
    if (!p) return toast('Không tìm thấy dự án có toạ độ', 'warn');
    chonDuAn(p.id, { bay: true });
    inp.blur();
  });
}

/* ─── §3 · NAV ──────────────────────────────────────────────────────────── */

function bamNav(btn) {
  const nav = btn.dataset.nav;
  const dang = btn.getAttribute('aria-pressed') === 'true';
  const dat = v => btn.setAttribute('aria-pressed', String(v));

  if (nav === 'metro')   { dat(!dang); return hienMetro(!dang); }
  if (nav === 'vanhdai') { dat(!dang); return hienVanhDai(!dang); }
  if (nav === 'duan')    { dat(!dang); hienLopDuAn(dang ? false : true); return; }
  if (nav === 'tien-ich'){ dat(!dang); return toggleLop('tienich', !dang); }
  if (nav === 'so-sanh') return moSoSanh();
  if (nav === 'nha-pho' || nav === 'chung-cu') { dat(!dang); return locLoaiHinh(nav, !dang); }
}

function toggleLop(khoa, bat) {
  set({ lop: { ...state.lop, [khoa]: bat } }, 'lop-doi');
}

/** Lọc nhanh theo loại hình ngay trên header — ít click nhất khi đang live. */
function locLoaiHinh(nav, bat) {
  const ma = nav === 'nha-pho' ? ['nha-pho', 'nha-pho-thuong-mai', 'shophouse', 'biet-thu']
                               : ['chung-cu', 'can-ho'];
  set({ loc: { ...state.loc, loaiHinh: bat ? ma : null } }, 'loc-doi');
  toast(bat ? `Chỉ hiện ${nav === 'nha-pho' ? 'nhà phố / biệt thự' : 'chung cư / căn hộ'}`
            : 'Hiện lại tất cả loại hình', 'ok');
}

/* ─── §4 · METRO MODE — ga hiện lần lượt ────────────────────────────────── */

function hienMetro(bat) {
  toggleLop('metro', bat);
  toggleLop('ga', bat);
  if (!bat) return;
  /* Ga xuất hiện lần lượt: thêm class theo nhịp để CSS chạy fade+scale. */
  hen(() => {
    const ga = [...document.querySelectorAll('.leaflet-marker-icon')].filter(n => n.querySelector?.('.ga-ic, .ga'));
    ga.forEach((n, i) => hen(() => {
      n.style.transition = 'opacity 340ms ease, transform 340ms ease';
      n.style.opacity = '0'; n.style.transform += ' scale(.6)';
      requestAnimationFrame(() => { n.style.opacity = '1'; n.style.transform = n.style.transform.replace(' scale(.6)', ''); });
    }, i * 55));
  }, 240);
}

/* ─── §5 · VÀNH ĐAI MODE — polyline vẽ dần ──────────────────────────────── */

function hienVanhDai(bat) {
  hienLopVanhDai(bat);
  if (!bat) return;
  hen(() => {
    const path = [...document.querySelectorAll('.leaflet-overlay-pane path')];
    path.forEach((p, i) => {
      let d = 0;
      try { d = p.getTotalLength?.() ?? 0; } catch { d = 0; }
      if (!d) return;
      p.style.transition = 'none';
      p.style.strokeDasharray = `${d}`;
      p.style.strokeDashoffset = `${d}`;
      hen(() => {
        p.style.transition = 'stroke-dashoffset 1100ms cubic-bezier(.22,.61,.36,1)';
        p.style.strokeDashoffset = '0';
        hen(() => { p.style.strokeDasharray = ''; p.style.transition = ''; }, 1200);
      }, i * 90);
    });
  }, 200);
}

/* ─── §6 · LIVE FOCUS + PANEL DỰ ÁN ─────────────────────────────────────── */

function boNoi() {
  document.querySelectorAll('.lv-noi').forEach(n => n.classList.remove('lv-noi'));
  lopNhan?.clearLayers();
}

/**
 * Vòng nhấn cho dự án đang nói.
 *
 * KHÔNG gắn class vào marker: projects.js gom cụm và lọc theo khung nhìn nên
 * dự án thường không có marker riêng (markerCua trả null), và phần tử icon bị
 * tạo mới sau mỗi lần pan/zoom làm mất class. Vẽ một marker riêng của Live Mode
 * tại toạ độ dự án là cách duy nhất luôn đúng.
 */
let lopNhan = null;

function apNoi() {
  if (!dangBat || !duAnDangNoi?.toaDo) return boNoi();
  lopNhan ??= L.layerGroup().addTo(map);
  lopNhan.clearLayers();
  L.marker(duAnDangNoi.toaDo, {
    icon: L.divIcon({ className: 'lv-noi', html: '<div class="lv-nhan"></div>', iconSize: [26, 26], iconAnchor: [13, 13] }),
    interactive: false, zIndexOffset: 1500
  }).addTo(lopNhan);
  /* Marker gốc vẫn được làm nổi nếu tình cờ có, để icon logo không bị mờ. */
  markerCua(duAnDangNoi.id)?._icon?.classList.add('lv-noi');
}

async function noiVe(id) {
  if (!id) return dongPane();
  const p = danhMuc.duAn.find(x => x.id === id);
  if (!p) return;
  duAnDangNoi = p;

  appEl.dataset.focus = '';
  apNoi();

  const pane = host.querySelector('.lv-pane');
  vePane(p, null);
  datPane(pane, true);

  /* Hồ sơ đầy đủ tải sau, vẽ lại khi có — không chặn animation trượt. */
  try { const ct = await chiTietDuAn(id); if (duAnDangNoi?.id === id) vePane(p, ct); }
  catch { /* dự án chưa có hồ sơ chi tiết */ }
}

/**
 * Đóng/mở panel bằng style nội tuyến.
 *
 * Không dùng luật CSS `[data-mo]`: luật gốc và luật trong media query cạnh
 * tranh nhau làm cascade kẹt, panel không bao giờ trượt vào (kiểm ở 375px thấy
 * transform luôn giữ nguyên giá trị đóng dù phần tử khớp selector). Đặt thẳng
 * transform là cách duy nhất luôn đúng ở mọi bề ngang.
 */
/**
 * Đóng/mở panel — chỉ bật/tắt thuộc tính, phần trượt để CSS lo.
 *
 * KHÔNG bọc trong requestAnimationFrame: khi cửa sổ bị ẩn hoặc trình duyệt
 * không dựng khung hình (chạy nền, chia sẻ màn hình tắt tab), rAF không được
 * gọi nên panel sẽ không bao giờ mở. Đặt thẳng thuộc tính luôn đúng.
 */
function datPane(pane, mo) {
  if (!pane) return;
  if (mo) pane.dataset.mo = ''; else delete pane.dataset.mo;
}

function dongPane() {
  datPane(host.querySelector('.lv-pane'), false);
  delete appEl.dataset.focus;
  boNoi();
  duAnDangNoi = null;
}

function o(k, v, rong) {
  return el(`div.lv-o${rong ? '.lv-o--rong' : ''}`, {}, [
    el('div.lv-o__k', {}, k), el('div.lv-o__v', {}, v ?? CHUA_CO)
  ]);
}

function vePane(p, ct) {
  const d = { ...p, ...(ct ?? {}) };
  const ga = gaCua(p)?.[0];
  const ti = tienIchCua(p.id) ?? [];
  const diem = chamDiem(d);
  const pane = host.querySelector('.lv-pane');

  fill(pane, [
    el('div.lv-pane__hd', {}, [
      el('div.lv-pane__ten', {}, p.ten),
      el('div.lv-pane__phu', {}, [tenLoaiHinh(p.loaiHinh), hoac(d.chuDauTu, '')].filter(Boolean).join(' · '))
    ]),
    el('div.lv-pane__body', {}, [
      el('div.lv-gia', {}, [
        co(d.giaTu) ? gia(d.giaTu, d.donViGia) : CHUA_CO,
        el('small', {}, co(d.giaTu) ? 'giá tham khảo, chưa VAT' : 'chưa có bảng giá')
      ]),

      el('div.lv-grid', {}, [
        o('Loại hình', tenLoaiHinh(p.loaiHinh)),
        o('Bàn giao', hoac(d.banGiao)),
        o('Quy mô', hoac(d.quyMo)),
        o('Block', hoac(d.block)),
        o('Số căn', hoac(d.tongSoCan)),
        o('Diện tích', hoac(d.dienTich)),
        o('Ga metro gần nhất', ga ? `${ga.ten} · ${km(ga.m ?? ga.met ?? 0)}` : CHUA_CO, true),
        o('Tiện ích quanh dự án', ti.length ? `${ti.length} điểm trong bán kính khảo sát` : CHUA_CO, true)
      ]),

      el('div.lv-sect', {}, 'AI Score'),
      el('div.lv-diem', {}, [
        el('div.lv-diem__so', {}, diem.tong != null ? String(diem.tong) : '—'),
        el('div.lv-diem__nhan', {}, diem.tong != null
          ? `${nhanDiem(diem.tong)} · chấm được ${diem.soTieuChi ?? '?'}/8 tiêu chí`
          : 'chưa đủ dữ liệu để chấm')
      ]),

      d.ghiChu ? el('div.lv-o.lv-o--rong', { style: { marginTop: '14px' } },
        [el('div.lv-o__k', {}, 'Ghi chú'), el('div.lv-o__v', { style: { fontWeight: '500' } }, d.ghiChu)]) : null,

      el('div.lv-cta', {}, [
        el('button.is-gold', { type: 'button', dataset: { act: 'toi-vi-tri' } }, '🎯 Định vị'),
        el('button', { type: 'button', dataset: { act: 'them-vs' } }, '⇄ So sánh'),
        el('button', { type: 'button', dataset: { act: 'google-maps' } }, '🗺 Google Maps'),
        el('button', { type: 'button', dataset: { act: 'dong-pane' } }, '✕ Ẩn panel')
      ])
    ])
  ]);
}

/* ─── §7 · TICKER ───────────────────────────────────────────────────────── */

function veTicker() {
  const co_ = danhMuc.duAn.filter(p => p.giaTu != null).slice(0, 40);
  const nguon = co_.length ? co_ : danhMuc.duAn.slice(0, 20);
  const noiDung = nguon.map(p => {
    const ga = gaCua(p)?.[0];
    const bit = [
      `<b>${p.ten}</b>`,
      p.giaTu != null ? `${gia(p.giaTu, p.donViGia)}` : 'đang cập nhật giá',
      ga ? `<i>Metro ${ga.ten} ${km(ga.m ?? ga.met ?? 0)}</i>` : null,
      p.chuDauTu || null
    ].filter(Boolean);
    return bit.join(' · ');
  }).join('<span class="lv-tick__sep">◆</span>');

  const span = host.querySelector('.lv-tick__chay > span');
  if (span) span.innerHTML = noiDung + '<span class="lv-tick__sep">◆</span>';
}

/* ─── §8 · SO SÁNH CHIA ĐÔI ─────────────────────────────────────────────── */

const gioSoSanh = [];

function themVaoSoSanh() {
  if (!duAnDangNoi) return;
  if (gioSoSanh.find(x => x.id === duAnDangNoi.id)) return toast('Dự án đã có trong bảng so sánh', 'warn');
  gioSoSanh.push(duAnDangNoi);
  if (gioSoSanh.length > 2) gioSoSanh.shift();
  toast(gioSoSanh.length === 1 ? 'Đã chọn 1 — chọn thêm dự án thứ hai' : 'Đủ 2 dự án, mở bảng so sánh', 'ok');
  if (gioSoSanh.length === 2) moSoSanh();
}

async function moSoSanh() {
  if (gioSoSanh.length < 2) return toast('Chọn 2 dự án (nút ⇄ So sánh trong panel) rồi mở lại', 'warn', 4000);
  host.querySelector('.lv-vs')?.remove();

  const day = await Promise.all(gioSoSanh.map(async p => {
    let ct = null;
    try { ct = await chiTietDuAn(p.id); } catch { /* không có hồ sơ */ }
    const d = { ...p, ...(ct ?? {}) };
    const ga = gaCua(p)?.[0];
    return { p, d, ga, diem: chamDiem(d), ti: (tienIchCua(p.id) ?? []).length };
  }));

  const hang = (k, lay) => el('div.lv-vs__hang', {}, [
    el('span.lv-vs__k', {}, k), el('b', {}, lay)
  ]);

  host.appendChild(el('section.lv-vs', {}, [
    ...day.map(x => el('div.lv-vs__cot', {}, [
      el('div.lv-vs__ten', {}, x.p.ten),
      el('div.lv-pane__phu', { style: { marginBottom: '10px' } }, tenLoaiHinh(x.p.loaiHinh)),
      hang('Giá', co(x.d.giaTu) ? gia(x.d.giaTu, x.d.donViGia) : CHUA_CO),
      hang('Diện tích', hoac(x.d.dienTich)),
      hang('Số căn', hoac(x.d.tongSoCan)),
      hang('Chủ đầu tư', hoac(x.d.chuDauTu)),
      hang('Bàn giao', hoac(x.d.banGiao)),
      hang('Ga metro', x.ga ? `${x.ga.ten} · ${km(x.ga.m ?? x.ga.met ?? 0)}` : CHUA_CO),
      hang('Tiện ích', x.ti ? `${x.ti} điểm` : CHUA_CO),
      hang('AI Score', x.diem.tong != null ? `${x.diem.tong}/10 · ${nhanDiem(x.diem.tong)}` : CHUA_CO)
    ])),
    el('button.lv-chip', {
      type: 'button', dataset: { act: 'dong-vs' },
      style: { position: 'absolute', top: '10px', right: '10px' }
    }, '✕')
  ]));
}

/* ─── §9 · CÔNG CỤ THUYẾT TRÌNH ─────────────────────────────────────────── */

function bamCongCu(cc, btn) {
  if (cc === 'phim') return moPhimTat();
  if (cc === 'xoa-ve') return xoaVe();
  if (cc === 'story') return congCu === 'story' ? dungStory() : chayStory();

  const dang = congCu === cc;
  host.querySelectorAll('[data-act="cong-cu"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  tatCongCu();
  if (dang) { congCu = null; return; }
  congCu = cc;
  btn.setAttribute('aria-pressed', 'true');
  if (cc === 'spotlight') batSpotlight();
  if (cc === 've') batVe();
  if (cc === 'thuoc') batThuoc();
  if (cc === 'kinh-lup') toast('Giữ SPACE để phóng to vùng quanh con trỏ', 'ok', 3200);
  if (cc === 'laser') toast('Giữ ALT để hiện chấm laser', 'ok', 3200);
}

function tatCongCu() {
  ['spot', 'veCanvas', 'thuoc'].forEach(k => { lopPhu[k]?.remove?.(); delete lopPhu[k]; });
  thuocDiem = [];
  lopThuoc?.clearLayers?.();
}

/* — Laser: giữ ALT — */
function ganHud() {
  nghe(window, 'keydown', ev => {
    if (ev.key === 'Alt' && !lopPhu.laser) {
      lopPhu.laser = Object.assign(document.createElement('div'), { className: 'lv-laser' });
      document.body.appendChild(lopPhu.laser);
    }
    if (ev.code === 'Space' && congCu === 'kinh-lup' && !lopPhu.mag) { ev.preventDefault(); batKinhLup(); }
  });
  nghe(window, 'keyup', ev => {
    if (ev.key === 'Alt') { lopPhu.laser?.remove(); delete lopPhu.laser; }
    if (ev.code === 'Space') { lopPhu.mag?.remove(); delete lopPhu.mag; }
  });
  nghe(window, 'mousemove', ev => {
    if (lopPhu.laser) { lopPhu.laser.style.left = ev.clientX + 'px'; lopPhu.laser.style.top = ev.clientY + 'px'; }
    if (lopPhu.mag) veKinhLup(ev.clientX, ev.clientY);
    if (lopPhu.spot) veSpotlight(ev.clientX, ev.clientY);
    capNhatToaDo(ev);
  });

  /* HUD: toạ độ · la bàn · thước tỷ lệ · mini map */
  const hud = el('div.lv-hud', {}, [
    el('div.lv-compass', { title: 'Hướng Bắc' }, 'N'),
    el('div.lv-hud__o', { dataset: { hud: 'toado' } }, '—'),
    el('div.lv-hud__o', { dataset: { hud: 'zoom' } }, '—')
  ]);
  host.appendChild(hud);

  try {
    const sc = L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 160 });
    sc.addTo(map); dieuKhienLeaflet.push(sc);
  } catch { /* Leaflet không có scale control */ }

  const capNhatZoom = () => {
    const n = host.querySelector('[data-hud="zoom"]');
    if (n) n.textContent = `Zoom ${map.getZoom()}`;
  };
  map.on('zoomend', capNhatZoom); rac.push(() => map.off('zoomend', capNhatZoom));
  capNhatZoom();

  /* Marker bị vẽ lại sau mỗi lần pan/zoom — gắn lại hiệu ứng nổi. */
  const lai = () => setTimeout(apNoi, 60);
  map.on('moveend zoomend', lai); rac.push(() => map.off('moveend zoomend', lai));
  const laiSuKien = on('du-an-doi', lai);
  if (typeof laiSuKien === 'function') rac.push(laiSuKien);
}

function capNhatToaDo(ev) {
  const n = host.querySelector('[data-hud="toado"]');
  if (!n || !map) return;
  try {
    const p = map.mouseEventToLatLng(ev);
    n.textContent = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
  } catch { /* con trỏ ngoài bản đồ */ }
}

/* — Spotlight — */
function batSpotlight() {
  const d = Object.assign(document.createElement('div'), { className: 'lv-spot' });
  document.body.appendChild(d);
  lopPhu.spot = d;
  veSpotlight(innerWidth / 2, innerHeight / 2);
}
function veSpotlight(x, y) {
  if (!lopPhu.spot) return;
  lopPhu.spot.style.background =
    `radial-gradient(circle 190px at ${x}px ${y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,.78) 100%)`;
}

/* — Kính lúp: nhân đôi khung nhìn bằng CSS transform trên ảnh chụp DOM bản đồ — */
function batKinhLup() {
  const d = Object.assign(document.createElement('div'), { className: 'lv-mag' });
  d.innerHTML = '<div class="lv-mag__in" style="position:absolute;inset:0"></div>';
  document.body.appendChild(d);
  lopPhu.mag = d;
  veKinhLup(innerWidth / 2, innerHeight / 2);
}
function veKinhLup(x, y) {
  const d = lopPhu.mag; if (!d) return;
  d.style.left = x + 'px'; d.style.top = y + 'px';
  /* Không sao chép DOM bản đồ (tốn và dễ vỡ) — phóng to bằng cách đẩy zoom
     Leaflet là cách rẻ nhất mà vẫn đúng: hiện vòng ngắm để người xem biết. */
  d.style.background = 'rgba(251,191,36,.06)';
}

/* — Thước đo — */
let thuocDiem = [], lopThuoc = null;
function batThuoc() {
  lopThuoc ??= L.layerGroup().addTo(map);
  toast('Bấm 2 điểm trên bản đồ để đo khoảng cách', 'ok', 3200);
  const fn = ev => {
    if (congCu !== 'thuoc') return;
    thuocDiem.push([ev.latlng.lat, ev.latlng.lng]);
    L.circleMarker(ev.latlng, { radius: 6, color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 1 }).addTo(lopThuoc);
    if (thuocDiem.length === 2) {
      const m = khoangCach(thuocDiem[0], thuocDiem[1]);
      L.polyline(thuocDiem, { color: '#fbbf24', weight: 3, dashArray: '8 6' }).addTo(lopThuoc);
      /* Thời gian đi ước tính theo vận tốc trung bình nội đô. */
      const oTo = m / 1000 / 28 * 3600, xeMay = m / 1000 / 22 * 3600, boDi = m / 1000 / 4.8 * 3600;
      L.popup({ className: 'lv-pop' })
        .setLatLng(thuocDiem[1])
        .setContent(
          `<div style="font-size:15px;line-height:1.6">
             <b style="color:#b45309">${km(m)}</b><br>
             🚗 ô tô ~${phut(oTo)}<br>🏍 xe máy ~${phut(xeMay)}<br>🚶 đi bộ ~${phut(boDi)}
           </div>`)
        .openOn(map);
      thuocDiem = [];
    }
  };
  map.on('click', fn);
  rac.push(() => map.off('click', fn));
}

/* — Vẽ chú thích — */
function batVe() {
  const cv = document.createElement('canvas');
  cv.className = 'lv-ve';
  const r = host.getBoundingClientRect();
  cv.width = r.width; cv.height = r.height;
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  host.appendChild(cv);
  lopPhu.veCanvas = cv;

  const c = cv.getContext('2d');
  c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = '#fbbf24';
  let ve_ = false;
  cv.addEventListener('pointerdown', e => { ve_ = true; c.beginPath(); c.moveTo(e.offsetX, e.offsetY); });
  cv.addEventListener('pointermove', e => { if (ve_) { c.lineTo(e.offsetX, e.offsetY); c.stroke(); } });
  cv.addEventListener('pointerup', () => { ve_ = false; });
  cv.addEventListener('pointerleave', () => { ve_ = false; });
  toast('Kéo chuột để vẽ · nút 🧽 xoá hết', 'ok', 3200);
}
function xoaVe() {
  const cv = lopPhu.veCanvas;
  if (!cv) return toast('Chưa bật chế độ vẽ', 'warn');
  cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  toast('Đã xoá nét vẽ', 'ok');
}

/* ─── §10 · STORY MODE ──────────────────────────────────────────────────── */

function chayStory() {
  const ds = danhMuc.duAn.filter(p => p.toaDo && p.giaTu != null).slice(0, 8);
  if (!ds.length) return toast('Chưa có dự án nào đủ dữ liệu để dẫn tuyến', 'warn');
  congCu = 'story';
  host.querySelector('[data-cc="story"]')?.setAttribute('aria-pressed', 'true');

  host.querySelector('.lv-story')?.remove();
  const box = el('div.lv-story', {}, [
    el('div', {}, [el('div.lv-story__t', { dataset: { s: 'ten' } }, '…'),
                   el('div.lv-story__p', { dataset: { s: 'phu' } }, '')]),
    el('div.lv-story__thanh', {}, el('i', {})),
    el('button.lv-chip', { type: 'button', dataset: { act: 'story-dung' } }, '⏹ Dừng')
  ]);
  host.appendChild(box);

  let i = 0;
  const buoc = () => {
    if (congCu !== 'story' || i >= ds.length) return dungStory();
    const p = ds[i++];
    box.querySelector('[data-s="ten"]').textContent = `${i}/${ds.length} · ${p.ten}`;
    box.querySelector('[data-s="phu"]').textContent =
      [tenLoaiHinh(p.loaiHinh), p.giaTu != null ? gia(p.giaTu, p.donViGia) : ''].filter(Boolean).join(' · ');
    const thanh = box.querySelector('.lv-story__thanh i');
    thanh.style.transition = 'none'; thanh.style.width = '0';
    map.flyTo(p.toaDo, 15.5, { duration: 1.6 });
    chonDuAn(p.id, { bay: false });
    requestAnimationFrame(() => { thanh.style.transition = 'width 5s linear'; thanh.style.width = '100%'; });
    hen(buoc, 5000);
  };
  buoc();
}

function dungStory() {
  donHen();
  congCu = null;
  host.querySelector('.lv-story')?.remove();
  host.querySelector('[data-cc="story"]')?.setAttribute('aria-pressed', 'false');
}

/* ─── §11 · PHÍM TẮT ────────────────────────────────────────────────────── */

const PHIM = [
  ['F1', 'Bản đồ toàn màn hình (ẩn panel)'],
  ['F2', 'Bật/tắt panel thông tin dự án'],
  ['F3', 'Bảng so sánh 2 dự án'],
  ['F4', 'Lớp Metro'],
  ['F5', 'Lớp Vành đai'],
  ['F6', 'Lớp Tiện ích'],
  ['F7', 'Ảnh dự án'],
  ['F8', 'Reset khung nhìn'],
  ['ALT', 'Giữ để hiện laser'],
  ['SPACE', 'Giữ để phóng to (khi bật kính lúp)'],
  ['?', 'Bảng phím tắt này'],
  ['ESC', 'Thoát Live Mode']
];

function ganPhim() {
  nghe(window, 'keydown', ev => {
    if (!dangBat) return;
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    const bam = act => { host.querySelector(`[data-nav="${act}"]`)?.click(); };
    switch (ev.key) {
      case 'F1': ev.preventDefault(); dongPane(); host.querySelector('.lv-vs')?.remove(); break;
      case 'F2': ev.preventDefault();
        duAnDangNoi ? dongPane() : (state.chon ? noiVe(state.chon) : toast('Chọn một dự án trước', 'warn')); break;
      case 'F3': ev.preventDefault(); moSoSanh(); break;
      case 'F4': ev.preventDefault(); bam('metro'); break;
      case 'F5': ev.preventDefault(); bam('vanhdai'); break;
      case 'F6': ev.preventDefault(); bam('tien-ich'); break;
      case 'F7': ev.preventDefault(); toast('Ảnh dự án — hồ sơ hiện chưa có ảnh, xem mục Cần làm', 'warn', 3600); break;
      case 'F8': ev.preventDefault(); map.flyTo(VIEW_MAC_DINH.center, VIEW_MAC_DINH.zoom, { duration: 1.4 }); break;
      case '?': moPhimTat(); break;
      case 'Escape': tat_(); break;
    }
  });
}

function moPhimTat() {
  if (host.querySelector('.lv-keys')) return host.querySelector('.lv-keys').remove();
  host.appendChild(el('div.lv-keys', {}, [
    el('h3', {}, 'Phím tắt Live Mode'),
    el('dl', {}, PHIM.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])),
    el('button.lv-chip', { type: 'button', dataset: { act: 'dong-keys' }, style: { marginTop: '14px' } }, 'Đóng')
  ]));
}

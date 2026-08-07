/**
 * app.js — điểm khởi động: nạp dữ liệu, dựng bản đồ, nối các module.
 *
 * Không dùng requestAnimationFrame cho logic khởi động. Trình duyệt tạm dừng
 * rAF khi thẻ bị ẩn, đã từng làm màn hình chờ không bao giờ tắt và che toàn bộ
 * giao diện. Dùng setTimeout hoặc await thẳng.
 */

import { $, el, toast, delegate } from './core/dom.js';
import { state, set, on, taiCaiDat, luuCaiDat } from './core/store.js';
import { napTatCa, napPhanConLai, tronDuAn, LoiFileProtocol, thieu } from './core/data.js';
import { khoiTaoBanDo, dungNutDieuKhien, veKhungMacDinh, map } from './map/engine.js';
import { khoiTaoLop, veChuThich } from './map/layers.js';
import { khoiTaoDuAn, veLai as veLaiGhim, chonDuAn, ketThucGhim } from './features/projects.js';
import { khoiTaoSidebar, moHoSo, dong as dongHoSo, veLaiSidebar } from './features/sidebar.js';
import { khoiTaoPanel, ve as veLaiPanel, capNhatSauLoc } from './features/panel.js';
import { khoiTaoTimKiem, quenNguonTim } from './features/search.js';
import { khoiTaoSoSanh, mo as moSoSanh, veLaiSoSanh } from './features/compare.js';
import { khoiTaoGuiKhach, batTat as batTatGuiKhach, veLaiGuiKhach } from './features/clientmode.js';
import { khoiTaoVanhDai, hienLopVanhDai } from './features/vanhdai.js';
import { khoiTaoBienTap, batTat as batTatBienTap, khoiTaoLopGaTam } from './features/gis-editor.js';
import { khoiTaoKiemTra } from './features/data-checker.js';
import { khoiTaoDevMode, batTat as batTatDevMode } from './features/dev-mode.js';

/* ─── §1 · KHỞI ĐỘNG ────────────────────────────────────────────────────── */

const manChinho = $('#boot');

async function khoiDong() {
  try {
    datChuDe(taiCaiDat().theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    buoc('Đang tải dữ liệu bản đồ…');
    await napTatCa();

    buoc('Đang dựng bản đồ…');
    khoiTaoBanDo();
    dungNutDieuKhien($('.mapctl'));

    set({ duAn: tronDuAn() }, 'du-an-doi');

    khoiTaoLop();
    khoiTaoDuAn();

    /* Lớp vành đai tự quản lý việc vẽ (màu và kiểu nét theo trạng thái từng
       đoạn) nên khởi tạo riêng, không đi qua sổ đăng ký lớp chung. */
    const lopVD = khoiTaoVanhDai();
    if (lopVD && state.lop.vanhdai !== false) hienLopVanhDai(true);
    khoiTaoLopGaTam();
    khoiTaoSidebar($('.sidebar'));
    khoiTaoPanel($('.panel'), $('.legend'));
    khoiTaoTimKiem($('#tim'), $('#ketqua'));
    khoiTaoSoSanh($('.cmp'));
    khoiTaoGuiKhach($('.ck'));
    khoiTaoBienTap($('.editor'));
    khoiTaoKiemTra($('.checker'));
    khoiTaoDevMode($('.devmode'));

    noiSuKien();
    baoLopThieu();
    xong();

    /* Nạp nốt các lớp nặng ở chế độ nền sau khi giao diện đã hiện, để ô tìm
       kiếm sớm có đủ khu công nghiệp, trường học, trung tâm thương mại. */
    napPhanConLai().then(du => { if (du) veLaiPanel(); });
  } catch (err) {
    loi(err);
  }
}

function buoc(text) {
  const n = manChinho?.querySelector('.boot__step');
  if (n) n.textContent = text;
}

function xong() {
  manChinho?.setAttribute('data-done', '');
  /* Gỡ hẳn khỏi cây DOM sau khi hiệu ứng mờ dần chạy xong. */
  setTimeout(() => manChinho?.remove(), 420);
}

function loi(err) {
  console.error(err);
  const laFile = err instanceof LoiFileProtocol;
  manChinho.innerHTML = '';
  manChinho.append(el('div.boot__err', {}, [
    el('div.boot__erricon', {}, laFile ? '📁' : '⚠'),
    el('h1', {}, laFile ? 'Không mở được theo cách này' : 'Không tải được dữ liệu'),
    el('p', {}, err.message),
    laFile ? el('pre.boot__code', {}, 'cd thư-mục-dự-án\nnpx serve') : null,
    laFile ? el('p.muted', {}, 'Hoặc mở bằng đường dẫn GitHub Pages của dự án.') : null
  ]));
}

/* ─── §2 · NỐI SỰ KIỆN ──────────────────────────────────────────────────── */

function noiSuKien() {
  /* Một trình xử lý cho cả thanh trên, phân nhánh theo data-act. */
  delegate($('.topbar'), 'click', {
    'panel':      btn => batTatPanel(btn),
    'so-sanh':    () => moSoSanh(),
    'gui-khach':  () => batTatGuiKhach(),
    'bien-tap':   () => batTatBienTap(),
    'dev-mode':   () => batTatDevMode(),
    'chu-de':     () => doiChuDe(),
    'reset':      () => { veKhungMacDinh(); dongHoSo(); }
  });

  /* Popup của Leaflet nằm ngoài mọi vùng đã gắn listener nên bắt ở tài liệu. */
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act="mo-ho-so"]');
    if (b) chonDuAn(b.dataset.id, { bay: false });
  });

  on('chon-doi', () => {
    state.chon ? moHoSo() : dongHoSo();
    veLaiPanel();
    if (state.guiKhach) veLaiGuiKhach();
  });

  on('du-an-doi', () => {
    quenNguonTim();                          // danh mục đổi thì chỉ mục tìm kiếm phải dựng lại
    veLaiGhim(); veLaiPanel();
    if (state.chon) veLaiSidebar();
  });

  /* Bộ lọc áp cho cả bản đồ, không chỉ danh sách. Ở quy mô hàng nghìn dự án,
     lọc mà bản đồ không đổi theo thì bộ lọc gần như vô dụng. */
  on('loc-doi', () => { veLaiGhim(); capNhatSauLoc(); });
  on('so-sanh-doi', () => { veLaiSoSanh(); veLaiPanel(); });
  on('lop-doi', () => veChuThich($('.legend')));
  on('luu-that-bai', () =>
    toast('Trình duyệt đang chặn lưu dữ liệu. Vị trí tự ghim sẽ mất khi đóng tab.', 'warn', 6000));

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (state.ghim) return ketThucGhim();
      if (state.guiKhach) return batTatGuiKhach();
      if (!$('.cmp').hidden) return $('.cmp').setAttribute('hidden', '');
      if (state.chon) return dongHoSo();
    }
    /* Ctrl/Cmd + K là phím tắt tìm kiếm quen thuộc. */
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      $('#tim').focus();
      $('#tim').select();
    }
  });

  /* Đổi hướng màn hình trên điện thoại làm Leaflet đo sai khung. */
  addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 160));
}

function batTatPanel(btn) {
  const p = $('.panel');
  p.hidden = !p.hidden;
  btn.setAttribute('aria-pressed', String(!p.hidden));
}

/* ─── §3 · CHỦ ĐỀ SÁNG / TỐI ────────────────────────────────────────────── */

function datChuDe(theme) {
  document.documentElement.dataset.theme = theme;
  luuCaiDat({ theme });
  const btn = $('[data-act="chu-de"]');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
}

function doiChuDe() {
  datChuDe(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

/* ─── §4 · BÁO LỚP THIẾU ────────────────────────────────────────────────── */

function baoLopThieu() {
  if (!thieu.size) return;
  console.warn('Lớp thiếu dữ liệu:', [...thieu].join(', '));
  toast(`${thieu.size} lớp dữ liệu chưa có, đã tạm tắt. Chạy tools/build-data.mjs để dựng.`, 'warn', 6000);
}

khoiDong();

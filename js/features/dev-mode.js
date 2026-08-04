/**
 * dev-mode.js — Developer Mode: tự bắt lỗi JavaScript/Promise/dữ liệu chạy
 * NỀN suốt phiên (đăng ký ngay khi module này được nạp, không đợi bật panel
 * lên mới bắt), và hiện báo cáo khi Hoàng bật panel lên xem.
 *
 * GIỚI HẠN THẬT — nói rõ để không hứa suông:
 *   - "Rò rỉ bộ nhớ" và "Responsive" không dò được đáng tin cậy từ TRONG
 *     trang bằng JavaScript thuần. Cần công cụ ngoài: DevTools > Memory (chụp
 *     heap snapshot, so sánh trước/sau) và DevTools > device toolbar (hoặc tự
 *     đổi cỡ cửa sổ) cho responsive. Panel này chỉ nhắc, không tự chạy được.
 *   - "Lỗi Layer/Popup/Sidebar" ở đây nghĩa là: lớp bản đồ đang bật trong
 *     state.lop nhưng KHÔNG có mặt thật trên bản đồ (sự cố khi vẽ), không
 *     phải một trình kiểm định hình ảnh popup/sidebar đầy đủ.
 */

import { el, fill, toast } from '../core/dom.js';
import { state, set } from '../core/store.js';
import { thieu as lopHong, danhMuc } from '../core/data.js';
import { map } from '../map/engine.js';

const TRAN_LOG = 300;
const nhatKy = []; // {luc, loai, thongDiep, chiTiet}

function ghiLoi(loai, thongDiep, chiTiet) {
  nhatKy.push({ luc: new Date(), loai, thongDiep, chiTiet });
  if (nhatKy.length > TRAN_LOG) nhatKy.shift();
  if (state.devMode) veNoiDung();
}

/* ─── Bắt lỗi NỀN — đăng ký một lần, ngay khi module này được import ─────── */

window.addEventListener('error', ev => {
  /* Bỏ lỗi tải ảnh/tài nguyên vặt (ảnh nền bản đồ lỗi network thoáng qua) —
     chỉ giữ lỗi JS thật, có dòng/file để còn sửa được. */
  if (ev.error) ghiLoi('js', ev.message, `${ev.filename}:${ev.lineno}:${ev.colno}\n${ev.error?.stack ?? ''}`);
});

window.addEventListener('unhandledrejection', ev => {
  const ly = ev.reason;
  ghiLoi('promise', ly?.message ?? String(ly), ly?.stack ?? '');
});

/* ─── §1 · KHỞI TẠO PANEL ───────────────────────────────────────────────── */

let host;

export function khoiTaoDevMode(node) {
  host = node;
  node.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'dong-dev') batTat(false);
    if (b.dataset.act === 'xoa-nhat-ky') { nhatKy.length = 0; veNoiDung(); }
    if (b.dataset.act === 'xuat-bao-cao') xuatBaoCao();
    if (b.dataset.act === 'kiem-lai') veNoiDung();
  });
}

export function batTat(bat = !state.devMode) {
  set({ devMode: bat }, 'dev-mode-doi');
  host.hidden = !bat;
  document.querySelector('[data-act="dev-mode"]')?.setAttribute('aria-pressed', String(bat));
  if (bat) veNoiDung();
}

/* ─── §2 · KIỂM TRA TĨNH (chạy mỗi lần mở panel hoặc bấm "Kiểm lại") ─────── */

function kiemLopBanDo() {
  const ketQua = [];
  for (const [id, bat] of Object.entries(state.lop)) {
    if (!bat) continue;
    /* Không có API chung để hỏi "lớp id có đang trên bản đồ" — layers.js và
       vanhdai.js/projects.js tự quản lý lớp riêng, nên chỉ kiểm được lớp nào
       bị đánh dấu hỏng hẳn (thieu) dù người dùng đang bật trong cài đặt. */
    if (lopHong.has(id)) ketQua.push(`Lớp "${id}" đang bật trong cài đặt nhưng dữ liệu tải lỗi.`);
  }
  return ketQua;
}

function kiemDom() {
  const CAN_CO = ['#map', '.topbar', '.panel', '.sidebar', '.editor', '.cmp', '.mapctl'];
  return CAN_CO.filter(sel => !document.querySelector(sel)).map(sel => `Thiếu phần tử bắt buộc: ${sel}`);
}

function kiemDuLieu() {
  const ketQua = [];
  if (lopHong.size) ketQua.push(`${lopHong.size} lớp dữ liệu nạp lỗi: ${[...lopHong].join(', ')}`);
  if (!danhMuc.duAn.length) ketQua.push('Danh mục dự án rỗng — index.json có thể chưa tải được.');
  return ketQua;
}

/* ─── §3 · GIAO DIỆN ────────────────────────────────────────────────────── */

const NHAN_LOAI = { js: '🔴 Lỗi JavaScript', promise: '🟠 Promise bị từ chối (chưa bắt)' };

function veNoiDung() {
  if (!host) return;
  const soJs = nhatKy.filter(n => n.loai === 'js').length;
  const soPromise = nhatKy.filter(n => n.loai === 'promise').length;
  const loiTinh = [...kiemLopBanDo(), ...kiemDom(), ...kiemDuLieu()];

  fill(host, [
    el('div.editor__head', {}, [
      el('div', {}, [
        el('div.editor__title', {}, '🐞 Developer Mode'),
        el('div.editor__sub', {}, 'Bắt lỗi chạy nền suốt phiên — không phải trình đo hiệu năng đầy đủ.')
      ]),
      el('button.btn.btn--icon.btn--ghost', { type: 'button', dataset: { act: 'dong-dev' } }, '✕')
    ]),
    el('div.editor__body', {}, [
      el('div.row.wrap', {}, [
        el('span.badge', { class: soJs ? 'badge badge--bad' : 'badge badge--ok' }, `${soJs} lỗi JS`),
        el('span.badge', { class: soPromise ? 'badge badge--warn' : 'badge badge--ok' }, `${soPromise} promise lỗi`),
        el('span.badge', { class: loiTinh.length ? 'badge badge--warn' : 'badge badge--ok' }, `${loiTinh.length} cảnh báo tĩnh`)
      ]),

      loiTinh.length > 0 ? el('div.sect__title', {}, 'Kiểm tra tĩnh (Layer / DOM / dữ liệu)') : null,
      loiTinh.length > 0 ? el('div.card', {}, [el('div.card__body', {}, loiTinh.map(t => el('div.crit__why', {}, '⚠ ' + t)))]) : null,

      nhatKy.length > 0 ? el('div.sect__title', {}, 'Nhật ký lỗi (mới nhất trước)') : null,
      nhatKy.length > 0 ? el('div.card', {}, [el('div.card__body', {},
        [...nhatKy].reverse().slice(0, 50).map(n => el('details', { style: { marginBottom: '6px' } }, [
          el('summary', {}, `${NHAN_LOAI[n.loai] ?? n.loai} · ${n.luc.toLocaleTimeString('vi-VN')} · ${n.thongDiep}`),
          el('pre', { style: { fontSize: 'var(--fz0)', whiteSpace: 'pre-wrap', color: 'var(--c-text-3)' } }, n.chiTiet)
        ])))]) : null,

      nhatKy.length === 0 && loiTinh.length === 0
        ? el('div.empty', {}, [el('div.empty__icon', {}, '✅'), el('div', {}, 'Chưa bắt được lỗi nào trong phiên này.')])
        : null,

      el('div.row.wrap', {}, [
        el('button.btn.btn--sm', { type: 'button', dataset: { act: 'kiem-lai' } }, '🔄 Kiểm lại'),
        el('button.btn.btn--sm', { type: 'button', dataset: { act: 'xuat-bao-cao' } }, '📄 Xuất báo cáo'),
        el('button.btn.btn--sm.btn--ghost', { type: 'button', dataset: { act: 'xoa-nhat-ky' } }, 'Xoá nhật ký')
      ]),

      el('div.panel__hint', {}, [
        el('b', {}, 'Không tự dò được: '), 'rò rỉ bộ nhớ (cần DevTools → tab Memory, chụp heap ' +
        'snapshot trước/sau rồi so sánh) và responsive đầy đủ (cần tự đổi cỡ cửa sổ hoặc DevTools → ' +
        'device toolbar và xem bằng mắt — công cụ này chỉ kiểm được phần tử DOM bắt buộc có tồn tại, ' +
        'không kiểm được bố cục có vỡ hay không).'
      ])
    ])
  ]);
}

/* ─── §4 · XUẤT BÁO CÁO ─────────────────────────────────────────────────── */

function xuatBaoCao() {
  const dong = [
    `BÁO CÁO DEVELOPER MODE — ${new Date().toLocaleString('vi-VN')}`,
    `Lỗi JS: ${nhatKy.filter(n => n.loai === 'js').length} · Promise lỗi: ${nhatKy.filter(n => n.loai === 'promise').length}`,
    '',
    '--- Kiểm tra tĩnh ---',
    ...[...kiemLopBanDo(), ...kiemDom(), ...kiemDuLieu()].map(t => '⚠ ' + t),
    '',
    '--- Nhật ký lỗi ---',
    ...nhatKy.map(n => `[${n.luc.toLocaleString('vi-VN')}] ${n.loai.toUpperCase()}: ${n.thongDiep}\n${n.chiTiet}`)
  ];
  const text = dong.join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bao-cao-dev-mode-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Đã tải báo cáo về máy', 'ok');
}

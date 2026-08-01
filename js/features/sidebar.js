/**
 * sidebar.js — hồ sơ dự án bên phải, tám tab.
 *
 * Mọi tab đều theo một quy tắc: có dữ liệu thì bày ra, không có thì nói
 * "Đang cập nhật" kèm gợi ý bổ sung ở đâu. Không tab nào được để trống trơn
 * mà không giải thích vì sao trống.
 */

import { el, fill, toast } from '../core/dom.js';
import { state, set } from '../core/store.js';
import { duLieu, tienIchCua, gaCua, cacBanKinh, nhomTienIch,
         chiTietDuAn, tenLoaiHinh, cacTrangThai, cacNguon } from '../core/data.js';
import { khuVucCua } from '../core/loc.js';
import { gia, hoac, chuyenDi, co, CHUA_CO } from '../core/format.js';
import { logoDuAn } from '../map/icons.js';
import { bayToi, map } from '../map/engine.js';
import { chamDiem, sao, nhanDiem, radar, TIEU_CHI } from './score.js';
import { phanTich } from './analysis.js';
import { veVongBanKinh, xoaVongBanKinh, hienTienIch, xoaTienIch } from './amenities.js';
import { batDauGhim, xoaGhim, themSoSanh, ghimTheoToaDo } from './projects.js';
import { doGaMetro, dangDoDuAn } from './dodac.js';
import { danhGiaHuongLoi, toiDoan as toiDoanVD } from './vanhdai.js';

const TABS = [
  { id: 'thong-tin', nhan: 'Thông tin',  icon: 'ℹ' },
  { id: 'tien-ich',  nhan: 'Tiện ích',   icon: '📍' },
  { id: 'metro',     nhan: 'Metro',      icon: '🚇' },
  { id: 'phan-tich', nhan: 'Phân tích',  icon: '📊' },
  { id: 'hinh-anh',  nhan: 'Hình ảnh',   icon: '🖼' },
  { id: 'mat-bang',  nhan: 'Mặt bằng',   icon: '📐' },
  { id: 'gia',       nhan: 'Giá',        icon: '💰' },
  { id: 'thanh-toan',nhan: 'Thanh toán', icon: '🧾' }
];

let host, elTabs, elBody;

export function khoiTaoSidebar(node) {
  host = node;
  elTabs = node.querySelector('.sb__tabs');
  elBody = node.querySelector('.sb__body');

  elTabs.addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]');
    if (b) doiTab(b.dataset.tab);
  });

  node.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const duAn = hienTai();
    ({
      'dong':        () => dong(),
      'ghim':        () => duAn && batDauGhim(duAn.id),
      'bo-ghim':     () => duAn && xoaGhim(duAn.id),
      'so-sanh':     () => duAn && themSoSanh(duAn.id),
      'bay-toi':     () => duAn?.toaDo && bayToi(duAn.toaDo, 16),
      'chep-toa-do': () => chepToaDo(duAn),
      'ban-kinh':    () => datBanKinh(+b.dataset.m),
      'nhom':        () => datNhom(b.dataset.nhom || null),
      'toi-diem':    () => { const c = b.dataset.c.split(',').map(Number); map.flyTo(c, 17, { duration: .7 }); },
      'toi-doan-vd': () => toiDoanVD(b.dataset.id)
    })[b.dataset.act]?.();
  });
}

/**
 * Hồ sơ đang mở.
 *
 * Bản ghi chỉ mục luôn có sẵn (đã nạp từ đầu), còn hồ sơ đầy đủ thì tải riêng
 * khi mở dự án — nhờ vậy danh mục hàng nghìn dự án không kéo theo hàng nghìn
 * hồ sơ. `dayDu` được ghép đè lên chỉ mục ngay khi tải xong.
 */
let dayDu = null;

const chiMucHienTai = () => state.duAn.find(p => p.id === state.chon) ?? null;
const hienTai = () => (dayDu?.id === state.chon ? dayDu : chiMucHienTai());

export async function moHoSo() {
  const p = chiMucHienTai();
  if (!p) return dong();

  host.hidden = false;
  document.querySelector('.app').dataset.sidebar = 'open';
  if (!elTabs.children.length) dungTabs();
  danhDauTab();

  /* Vẽ ngay bằng dữ liệu chỉ mục để hồ sơ mở tức thì, rồi vẽ lại khi hồ sơ đầy
     đủ về. Chờ mạng xong mới vẽ thì mỗi lần bấm là một khoảng trắng. */
  dayDu = null;
  veNoiDung();

  const id = p.id;
  const chiTiet = await chiTietDuAn(id);
  /* Người dùng có thể đã bấm sang dự án khác trong lúc chờ. */
  if (state.chon !== id) return;
  if (chiTiet) {
    /* Toạ độ ghim tay trong chỉ mục phải thắng toạ độ trong file hồ sơ. */
    dayDu = { ...chiTiet, ...(p.xacMinh === 'thu-cong' ? { toaDo: p.toaDo, xacMinh: p.xacMinh, nguonToaDo: p.nguonToaDo } : {}) };
    veNoiDung();
  }

  /* Dự án chưa được tiền tính thì đo khoảng cách tới ga ngay tại chỗ. Với danh
     mục hàng nghìn dự án, tiền tính hết là không khả thi — xem dodac.js. */
  const duAn = hienTai();
  if (duAn?.toaDo && !gaCua(duAn)) {
    veNoiDung();                       // hiện trạng thái "đang đo"
    await doGaMetro(duAn);
    if (state.chon === id) veNoiDung(); // vẽ lại kèm số liệu và điểm mới
  }

  /* Vòng bán kính chỉ có nghĩa khi đang xem một dự án cụ thể. */
  if (p.toaDo && state.tab === 'tien-ich') veVongBanKinh(p);
  setTimeout(() => map.invalidateSize(), 260);
}

export function dong() {
  dayDu = null;
  host.hidden = true;
  delete document.querySelector('.app').dataset.sidebar;
  xoaVongBanKinh();
  xoaTienIch();
  set({ chon: null }, 'chon-doi');
  setTimeout(() => map.invalidateSize(), 260);
}

function doiTab(id) {
  set({ tab: id }, 'tab-doi');
  danhDauTab();
  veNoiDung();
  const p = hienTai();
  if (id === 'tien-ich' && p?.toaDo) { veVongBanKinh(p); hienTienIch(p); }
  else { xoaVongBanKinh(); xoaTienIch(); }
}

/**
 * Dựng dải tab một lần duy nhất.
 *
 * Trước đây hàm này dựng lại toàn bộ dải tab sau mỗi lần đổi tab, làm mọi nút
 * cũ thành nút mồ côi ngoài cây DOM. Bấm liên tiếp thì chỉ lần đầu ăn. Ngoài ra
 * còn mất tiêu điểm bàn phím và mất vị trí cuộn ngang trên điện thoại.
 */
function dungTabs() {
  fill(elTabs, TABS.map(t =>
    el('button.sb__tab', {
      type: 'button', dataset: { tab: t.id },
      'aria-selected': String(state.tab === t.id)
    }, [el('span.sb__tabicon', {}, t.icon), el('span', {}, t.nhan)])));
}

/** Chỉ đổi tab nào đang được chọn, không dựng lại phần tử nào. */
function danhDauTab() {
  for (const nut of elTabs.children) {
    nut.setAttribute('aria-selected', String(nut.dataset.tab === state.tab));
  }
}

function veNoiDung() {
  const p = hienTai();
  if (!p) return;
  const diem = chamDiem(p);

  fill(elBody, [
    veDauTrang(p, diem),
    ({
      'thong-tin':  () => tabThongTin(p, diem),
      'tien-ich':   () => tabTienIch(p),
      'metro':      () => tabMetro(p),
      'phan-tich':  () => tabPhanTich(p, diem),
      'hinh-anh':   () => tabAnh(p, 'anh', 'Hình ảnh dự án',
                       'Thêm đường dẫn ảnh vào mảng "anh" trong data/projects/chi-tiet/<id>.json'),
      'mat-bang':   () => tabAnh(p, 'matBang', 'Mặt bằng',
                       'Thêm đường dẫn ảnh mặt bằng vào mảng "matBang" trong data/projects/chi-tiet/<id>.json'),
      'gia':        () => tabGia(p),
      'thanh-toan': () => tabThanhToan(p)
    })[state.tab]?.() ?? null
  ]);
  elBody.scrollTop = 0;
}

/* ─── §1 · ĐẦU TRANG ────────────────────────────────────────────────────── */

function veDauTrang(p, diem) {
  const nd = nhanDiem(diem.tong);
  const px = khuVucCua(p);
  const daSoSanh = state.soSanh.includes(p.id);

  return el('div.sb__hero', {}, [
    el('div.row', {}, [
      el('div', { html: logoDuAn(p, 48) }),
      el('div.grow', {}, [
        el('h2.sb__name', {}, p.ten),
        el('div.sb__dev.ellipsis', {}, hoac(p.chuDauTu, 'Chủ đầu tư đang cập nhật'))
      ]),
      el('button.btn.btn--icon.btn--ghost', { type: 'button', dataset: { act: 'dong' }, title: 'Đóng hồ sơ' }, '✕')
    ]),

    el('div.sb__scorebar', {}, [
      el('div.sb__stars', { style: { color: nd.mau } }, sao(diem.tong)),
      el('div.sb__score', {}, diem.tong == null
        ? [el('span.pending', {}, 'Chưa đủ dữ liệu')]
        : [el('b', { style: { color: nd.mau } }, String(diem.tong)), el('span.muted', {}, '/10')]),
      el('div.sb__scoremeta', {}, `${nd.nhan} · chấm được ${diem.soTieuChi}/${diem.tongTieuChi} tiêu chí`)
    ]),

    el('div.row.wrap.sb__chips', {}, [
      p.loaiHinh && el('span.badge', {}, tenLoaiHinh(p.loaiHinh)),
      p.trangThai && el('span.badge', { class: `badge ${cacTrangThai()[p.trangThai]?.lop ?? ''}` },
        cacTrangThai()[p.trangThai]?.nhan ?? p.trangThai),
      px && el('span.badge', {}, px),
      p.xacMinh === 'osm' && el('span.badge.badge--ok.badge--dot', {}, 'Toạ độ xác minh'),
      p.xacMinh === 'thu-cong' && el('span.badge.badge--warn.badge--dot', {}, 'Vị trí tự ghim'),
      p.xacMinh === 'chua-ghim' && el('span.badge.badge--bad.badge--dot', {}, 'Chưa có vị trí')
    ]),

    /* Ứng viên chưa kiểm phải cảnh báo ngay đầu hồ sơ, trước khi người tư vấn
       kịp đọc số liệu bên dưới và tưởng đó là dự án đang bán. */
    p.nguon === 'osm' ? el('div.src', {}, [
      el('span', {}, '⚠'),
      el('div', {}, cacNguon()['osm']?.moTa ?? 'Dữ liệu chưa kiểm chứng.')
    ]) : null,

    el('div.row.wrap.sb__acts', {}, [
      p.toaDo
        ? el('button.btn.btn--sm', { type: 'button', dataset: { act: 'bay-toi' } }, ['🎯 Tới vị trí'])
        : el('button.btn.btn--sm.btn--primary', { type: 'button', dataset: { act: 'ghim' } }, ['📌 Ghim vị trí']),
      p.xacMinh === 'thu-cong' &&
        el('button.btn.btn--sm', { type: 'button', dataset: { act: 'ghim' } }, ['✎ Ghim lại']),
      p.xacMinh === 'thu-cong' &&
        el('button.btn.btn--sm', { type: 'button', dataset: { act: 'bo-ghim' } }, ['↺ Bỏ ghim']),
      p.toaDo && el('button.btn.btn--sm', { type: 'button', dataset: { act: 'chep-toa-do' } }, ['⧉ Chép toạ độ']),
      el('button.btn.btn--sm', {
        type: 'button', dataset: { act: 'so-sanh' }, 'aria-pressed': String(daSoSanh)
      }, [daSoSanh ? '✓ Trong bảng so sánh' : '⇄ So sánh'])
    ]),

    veODanToaDo(p)
  ]);
}

/**
 * Ô dán toạ độ từ Google Maps — chính xác hơn bấm tay lên bản đồ.
 * Bấm chuột phải lên vị trí trong Google Maps rồi bấm vào dòng toạ độ để chép.
 */
function veODanToaDo(p) {
  const o = el('input.inp', {
    /* Bắt buộc type="text": để type="number" thì trình duyệt xoá trắng chuỗi
       "10.98, 106.65" dán từ Google Maps vì nó không phải một con số. */
    type: 'text', inputmode: 'decimal',
    placeholder: p.toaDo ? p.toaDo.join(', ') : '10.9705, 106.6845',
    'aria-label': 'Dán toạ độ từ Google Maps'
  });

  const ghim = () => { if (ghimTheoToaDo(p.id, o.value)) o.value = ''; };
  o.addEventListener('keydown', ev => { if (ev.key === 'Enter') ghim(); });

  return el('details.dandc', {}, [
    el('summary', {}, p.toaDo ? 'Chỉnh toạ độ chính xác' : 'Hoặc dán toạ độ từ Google Maps'),
    el('div.row.dandc__row', {}, [
      o,
      el('button.btn.btn--sm.btn--primary', { type: 'button', onclick: ghim }, 'Đặt')
    ]),
    el('div.panel__hint', {}, 'Trong Google Maps: bấm chuột phải lên vị trí, bấm vào dòng toạ độ ' +
      'hiện ra để chép, rồi dán vào đây. Vĩ độ trước, kinh độ sau.')
  ]);
}

/* ─── §2 · TAB THÔNG TIN ────────────────────────────────────────────────── */

function tabThongTin(p, diem) {
  const truong = [
    ['Chủ đầu tư', p.chuDauTu],
    ['Loại hình', tenLoaiHinh(p.loaiHinh)],
    ['Địa chỉ', p.diaChi],
    ['Quy mô', p.quyMo],
    ['Block', p.block],
    ['Tổng số căn', p.tongSoCan],
    ['Diện tích', p.dienTich],
    ['Bàn giao', p.banGiao],
    ['Pháp lý', p.phapLy],
    ['Giá từ', co(p.giaTu) ? gia(p.giaTu, p.donViGia) : null],
    ['Giá trung bình', co(p.giaTrungBinh) ? gia(p.giaTrungBinh, p.donViGia) : null]
  ];

  return el('div.sb__pane', {}, [
    el('div.card', {}, [
      el('div.card__body', {}, truong.map(([k, v]) =>
        el('div.field', {}, [
          el('span.field__k', {}, k),
          co(v) ? el('span.field__v', {}, String(v)) : el('span.field__v.pending', {}, CHUA_CO)
        ])))
    ]),

    p.ghiChu && el('div.sect__title', {}, 'Ghi chú tư vấn'),
    p.ghiChu && el('div.card', {}, [el('div.card__body.sb__note', {}, p.ghiChu)]),

    veNguon(p),

    el('div.sect__title', {}, 'Điểm đánh giá'),
    el('div.card', {}, [el('div.card__body', {}, [
      el('div', { html: radar(diem) }),
      el('div.sb__scorenote', {}, diem.tong == null
        ? 'Chưa chấm được tiêu chí nào — dự án cần có toạ độ và dữ liệu tiện ích.'
        : `Điểm tổng ${diem.tong}/10, tính trên ${diem.soTieuChi} tiêu chí có đủ dữ liệu. ` +
          'Đây là thang tham khảo do công cụ tính từ dữ liệu bản đồ, không phải thẩm định giá.')
    ])]),

    el('div.sb__criteria', {}, TIEU_CHI.map(tc => {
      const ph = diem.phan[tc.id];
      const d = ph?.diem;
      return el('div.crit', {}, [
        el('div.row.row--between', {}, [
          el('span.crit__name', {}, tc.nhan),
          d == null ? el('span.pending', {}, CHUA_CO)
                    : el('span.crit__val', {}, `${d.toFixed(1)}/10`)
        ]),
        d != null && el('div.crit__bar', {}, [
          el('span', { style: { width: `${d * 10}%`, background: nhanDiem(d).mau } })
        ]),
        ph?.vi && el('div.crit__why', {}, ph.vi)
      ]);
    }))
  ]);
}

function veNguon(p) {
  if (!co(p.nguon) && !co(p.nguonToaDo)) return null;
  return el('div.src', {}, [
    el('span', {}, '⚠'),
    el('div', {}, [
      p.nguon && el('div', {}, `Số liệu: ${p.nguon}`),
      p.nguonToaDo && el('div', {}, `Toạ độ: ${p.nguonToaDo}`)
    ])
  ]);
}

/* ─── §3 · TAB TIỆN ÍCH ─────────────────────────────────────────────────── */

function tabTienIch(p) {
  if (!p.toaDo) return trongVi('Dự án chưa có vị trí trên bản đồ nên không đo được tiện ích quanh đó.',
                               'Bấm "Ghim vị trí" ở trên để đánh dấu.');

  const diem = tienIchCua(p.id);
  if (!diem.length) {
    return trongVi('Chưa có dữ liệu tiện ích quanh dự án này.',
      'Chạy: node tools/build-around.mjs ' + p.id);
  }

  const nhom = nhomTienIch();
  const trongBanKinh = d => {
    const m = d.diXe?.m ?? d.diBo?.m;
    return m != null && m <= state.banKinh;
  };
  const hien = diem.filter(trongBanKinh)
    .filter(d => !state.nhomTienIch || d.nhom === state.nhomTienIch)
    .sort((a, b) => (a.diXe?.m ?? a.diBo?.m ?? Infinity) - (b.diXe?.m ?? b.diBo?.m ?? Infinity));

  const demTheoNhom = {};
  for (const d of diem.filter(trongBanKinh)) demTheoNhom[d.nhom] = (demTheoNhom[d.nhom] ?? 0) + 1;

  const chuaDo = diem.filter(d => d.chuaDo).length;

  return el('div.sb__pane', {}, [
    el('div.seg', {}, cacBanKinh().map(m =>
      el('button.seg__btn', {
        type: 'button', dataset: { act: 'ban-kinh', m },
        'aria-pressed': String(state.banKinh === m)
      }, m < 1000 ? `${m} m` : `${m / 1000} km`))),

    el('div.row.wrap.sb__nhom', {}, [
      el('button.chip', {
        type: 'button', dataset: { act: 'nhom', nhom: '' },
        'aria-pressed': String(!state.nhomTienIch)
      }, `Tất cả · ${Object.values(demTheoNhom).reduce((a, b) => a + b, 0)}`),
      ...Object.entries(nhom).map(([k, n]) =>
        el('button.chip', {
          type: 'button', dataset: { act: 'nhom', nhom: k },
          'aria-pressed': String(state.nhomTienIch === k),
          disabled: !demTheoNhom[k]
        }, `${n.icon} ${n.nhan} · ${demTheoNhom[k] ?? 0}`))
    ]),

    hien.length
      ? el('div.amlist', {}, hien.map(d => {
          const n = nhom[d.nhom] ?? {};
          return el('button.am', { type: 'button', dataset: { act: 'toi-diem', c: d.c.join(',') } }, [
            el('span.am__icon', { style: { '--poi-color': n.mau ?? 'var(--c-text-2)' } }, n.icon ?? '📍'),
            el('div.grow', {}, [
              el('div.am__name', {}, d.name),
              el('div.am__meta', {}, [
                el('span', {}, `🚗 ${chuyenDi(d.diXe)}`),
                el('span', {}, `🚶 ${chuyenDi(d.diBo)}`)
              ])
            ])
          ]);
        }))
      : trongVi(`Không có tiện ích nào trong bán kính ${state.banKinh < 1000 ? state.banKinh + ' m' : state.banKinh / 1000 + ' km'}` +
                (state.nhomTienIch ? ` thuộc nhóm đã chọn` : ''), 'Thử nới bán kính hoặc bỏ lọc nhóm.'),

    el('div.sb__foot-note', {}, [
      'Khoảng cách và thời gian đo theo đường thật (OSRM), không phải đường chim bay. ',
      chuaDo ? `Còn ${chuaDo} điểm ở xa chưa được đo — công cụ chỉ đo 12 điểm gần nhất mỗi nhóm.` : ''
    ])
  ]);
}

/* ─── §4 · TAB METRO ────────────────────────────────────────────────────── */

function tabMetro(p) {
  if (!p.toaDo) return trongVi('Dự án chưa có vị trí nên không đo được đường tới ga metro.',
                               'Bấm "Ghim vị trí" ở trên.');

  const r = gaCua(p);

  if (!r?.cacGa?.length) {
    return dangDoDuAn(p.id)
      ? el('div.empty', {}, [
          el('div.empty__icon', {}, '⏳'),
          el('div', {}, 'Đang đo đường tới các ga metro gần nhất…'),
          el('div.empty__hint', {}, 'Đo theo đường thật qua máy chủ định tuyến công cộng, ' +
            'thường mất vài giây.')
        ])
      : trongVi('Chưa đo được đường tới ga metro nào.',
          'Máy chủ định tuyến không trả lời. Mở lại hồ sơ để thử đo lần nữa, ' +
          'hoặc chạy sẵn bằng: node tools/build-around.mjs ' + p.id);
  }

  return el('div.sb__pane', {}, [
    el('div.sect__title', {}, 'Ga gần nhất theo đường đi xe'),
    ...r.cacGa.map((ga, i) => {
      const tuyen = (ga.lines ?? []).map(id => duLieu.metro.lines.find(l => l.id === id)).filter(Boolean);
      return el('div.card.gacard', { dataset: i === 0 ? { gan: '' } : {} }, [
        el('div.card__body', {}, [
          el('div.row.row--between', {}, [
            el('div', {}, [
              el('div.gacard__name', {}, `Ga ${ga.name}`),
              el('div.row.wrap.gacard__lines', {}, tuyen.map(l =>
                el('span.badge.badge--dot', { style: { color: l.color } },
                  `${l.name} · ${duLieu.metro.trangThai[l.status].nhan}`)))
            ]),
            i === 0 && el('span.badge.badge--ok', {}, 'Gần nhất')
          ]),
          el('div.gacard__legs', {}, [
            el('div.leg', {}, [el('span.leg__ico', {}, '🚗'), el('span.leg__k', {}, 'Đi xe'),
                               el('span.leg__v', {}, chuyenDi(ga.diXe))]),
            el('div.leg', {}, [el('span.leg__ico', {}, '🚶'), el('span.leg__k', {}, 'Đi bộ'),
                               ga.diBo ? el('span.leg__v', {}, chuyenDi(ga.diBo))
                                       : el('span.leg__v.pending', {}, 'Không có lối đi bộ')])
          ]),
          el('button.btn.btn--sm', { type: 'button', dataset: { act: 'toi-diem', c: ga.c.join(',') } }, 'Xem trên bản đồ')
        ])
      ]);
    }),
    el('div.sb__foot-note', {}, 'Đo theo đường thật: đi xe dùng hồ sơ ô tô, đi bộ dùng hồ sơ người đi bộ. ' +
      (r.nguonSo === 'do-tai-cho'
        ? 'Số liệu do trình duyệt tự đo khi mở hồ sơ này, đã lưu lại trên máy. '
        : 'Số liệu tiền tính sẵn bằng công cụ, đo tới nhiều ga hơn. ') +
      'Hướng tuyến và số ga theo hồ sơ đang niêm yết, vẫn có thể điều chỉnh.')
  ]);
}

/* ─── §5 · TAB PHÂN TÍCH ────────────────────────────────────────────────── */

function tabPhanTich(p, diem) {
  const pt = phanTich(p, diem);
  const khoi = (tieuDe, items, lop) =>
    items.length ? [el('div.sect__title', {}, tieuDe),
      el('div.card', {}, [el('ul.pt', { class: `pt ${lop}` }, items.map(i =>
        el('li.pt__item', {}, [
          el('div.pt__y', {}, i.y),
          i.vi && el('div.pt__vi', {}, i.vi)
        ])))])] : [];

  return el('div.sb__pane', {}, [
    ...khoi('Điểm mạnh', pt.manh, 'pt--manh'),
    ...khoi('Điểm yếu', pt.yeu, 'pt--yeu'),

    pt.hopVoi.length > 0 && el('div.sect__title', {}, 'Đối tượng phù hợp'),
    pt.hopVoi.length > 0 && el('div.card', {}, [el('div.card__body', {}, [
      el('div.row.wrap', {}, pt.hopVoi.map(t => el('span.badge.badge--info', {}, t)))
    ])]),

    veHuongLoiVanhDai(p),

    ...khoi('Rủi ro cần nói trước với khách', pt.ruiRo, 'pt--rui'),

    pt.thieuDuLieu.length > 0 && el('div.sect__title', {}, 'Dữ liệu còn thiếu'),
    pt.thieuDuLieu.length > 0 && el('div.card', {}, [el('div.card__body', {}, [
      el('ul.pt.pt--thieu', {}, pt.thieuDuLieu.map(t => el('li.pt__item', {}, [el('div.pt__y', {}, t)]))),
      el('div.sb__foot-note', {}, 'Bổ sung trong data/projects/chi-tiet/<id>.json để phần nhận định đầy đủ hơn.')
    ])]),

    el('div.src', {}, ['⚠', el('div', {}, 'Nhận định do công cụ sinh từ dữ liệu bản đồ và số liệu đã nhập. ' +
      'Không phải khuyến nghị đầu tư. Khả năng tăng giá và cho thuê phụ thuộc nhiều yếu tố ngoài phạm vi công cụ này.')])
  ]);
}

/* ─── §5b · MỨC HƯỞNG LỢI TỪ ĐƯỜNG VÀNH ĐAI ─────────────────────────────────
   Khoảng cách ở đây là ĐƯỜNG THẲNG tới tim tuyến, không phải quãng đường lái
   xe — nói rõ ngay trên giao diện để không ai nhầm với số trong tab Metro. */

function veHuongLoiVanhDai(p) {
  if (!p.toaDo) return null;
  const hl = danhGiaHuongLoi(p);
  if (!hl) {
    return el('div.sb__pane', {}, [
      el('div.sect__title', {}, 'Đường vành đai'),
      el('div.panel__hint', {}, 'Không có đoạn vành đai nào trong bán kính 8 km.')
    ]);
  }

  const nd = nhanDiem(hl.diem);
  return el('div.sb__pane', {}, [
    el('div.sect__title', {}, 'Mức hưởng lợi từ đường vành đai'),
    el('div.card', {}, [el('div.card__body', {}, [
      el('div.row.row--between', {}, [
        el('span.crit__name', {}, hl.muc),
        el('span.crit__val', { style: { color: nd.mau } }, `${hl.diem}/10`)
      ]),
      el('div.crit__bar', {}, [el('span', { style: { width: `${hl.diem * 10}%`, background: nd.mau } })]),
      el('div.crit__why', {}, hl.giaiThich),

      hl.theoTuyen.length > 1 ? el('div.vd-list', { style: { marginTop: '10px' } },
        hl.theoTuyen.map(g => el('button.vd-doan', {
          type: 'button', dataset: { act: 'toi-doan-vd', id: g.doan.id },
          style: { '--vd-mau': g.doan.mau }
        }, [
          el('span.vd-doan__ten.ellipsis', {}, g.doan.tenTuyen),
          el('span.vd-doan__meta', {}, [
            el('span.muted', {}, g.m < 1000 ? `${g.m} m` : `${(g.m / 1000).toFixed(1)} km`),
            el('span.badge', { style: { color: g.doan.mau } }, g.doan.tenDoan)
          ])
        ]))) : null,

      el('div.sb__foot-note', {}, 'Khoảng cách đo theo đường thẳng tới tim tuyến, ' +
        'không phải quãng đường lái xe.')
    ])]),
    hl.canhBao ? el('div.src', {}, ['⚠', el('div', {}, hl.canhBao)]) : null
  ]);
}

/* ─── §6 · TAB HÌNH ẢNH VÀ MẶT BẰNG ─────────────────────────────────────── */

function tabAnh(p, truong, tieuDe, goiY) {
  const ds = p[truong] ?? [];
  if (!ds.length) return trongVi(`Chưa có ${tieuDe.toLowerCase()}.`, goiY);
  return el('div.sb__pane', {}, [
    el('div.gallery', {}, ds.map(src =>
      el('a.gallery__item', { href: src, target: '_blank', rel: 'noopener' }, [
        el('img', { src, alt: `${tieuDe} ${p.ten}`, loading: 'lazy' })
      ])))
  ]);
}

/* ─── §7 · TAB GIÁ ──────────────────────────────────────────────────────── */

function tabGia(p) {
  const coGia = co(p.giaTu) || co(p.giaTrungBinh);
  if (!coGia) {
    return trongVi('Chưa có bảng giá.',
      'Điền "giaTu", "giaTrungBinh" và "donViGia" trong data/projects/index.json. ' +
      'Giá đổi liên tục — luôn đối chiếu bảng giá mới nhất của chủ đầu tư.');
  }

  return el('div.sb__pane', {}, [
    el('div.card', {}, [el('div.card__body', {}, [
      el('div.field', {}, [el('span.field__k', {}, 'Giá từ'),
        co(p.giaTu) ? el('span.field__v.big', {}, gia(p.giaTu, p.donViGia)) : el('span.field__v.pending', {}, CHUA_CO)]),
      el('div.field', {}, [el('span.field__k', {}, 'Giá trung bình'),
        co(p.giaTrungBinh) ? el('span.field__v.big', {}, gia(p.giaTrungBinh, p.donViGia)) : el('span.field__v.pending', {}, CHUA_CO)]),
      el('div.field', {}, [el('span.field__k', {}, 'Diện tích'),
        co(p.dienTich) ? el('span.field__v', {}, p.dienTich) : el('span.field__v.pending', {}, CHUA_CO)])
    ])]),
    veNguon(p),
    el('div.src', {}, ['⚠', el('div', {}, 'Chiết khấu trừ vào giá và quyền lợi tặng kèm phải tách bạch khi tư vấn — ' +
      'không cộng dồn thành một con số "giá sau ưu đãi".')])
  ]);
}

/* ─── §8 · TAB LỊCH THANH TOÁN ──────────────────────────────────────────── */

function tabThanhToan(p) {
  const ds = p.lichThanhToan ?? [];
  if (!ds.length) {
    return trongVi('Chưa có lịch thanh toán.',
      'Điền mảng "lichThanhToan" trong data/projects/chi-tiet/<id>.json, mỗi đợt gồm: dot, tyLe, soTien, moc.');
  }

  return el('div.sb__pane', {}, [
    el('div.tablewrap', {}, [
      el('table.tbl', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', {}, 'Đợt'), el('th', {}, 'Tỷ lệ'), el('th', {}, 'Số tiền'), el('th', {}, 'Mốc')
        ])]),
        el('tbody', {}, ds.map(d => el('tr', {}, [
          el('td', {}, hoac(d.dot)),
          el('td', {}, hoac(d.tyLe)),
          el('td', {}, hoac(d.soTien)),
          el('td', {}, hoac(d.moc))
        ])))
      ])
    ]),
    veNguon(p),
    el('div.src', {}, ['⚠', el('div', {}, 'Lịch thanh toán và chính sách vay thay đổi theo từng đợt mở bán. ' +
      'Khi tính dòng tiền cho khách, tính cả giai đoạn sau ưu đãi lãi suất.')])
  ]);
}

/* ─── §9 · TIỆN ÍCH DÙNG CHUNG ──────────────────────────────────────────── */

function trongVi(chinh, phu) {
  return el('div.empty', {}, [
    el('div.empty__icon', {}, '📭'),
    el('div', {}, chinh),
    phu && el('div.empty__hint', {}, phu)
  ]);
}

function datBanKinh(m) {
  set({ banKinh: m }, 'ban-kinh-doi');
  veNoiDung();
  const p = hienTai();
  if (p?.toaDo) { veVongBanKinh(p); hienTienIch(p); }
}

function datNhom(nhom) {
  set({ nhomTienIch: nhom }, 'nhom-doi');
  veNoiDung();
  const p = hienTai();
  if (p?.toaDo) hienTienIch(p);
}

async function chepToaDo(p) {
  if (!p?.toaDo) return;
  const text = p.toaDo.join(', ');
  try {
    await navigator.clipboard.writeText(text);
    toast(`Đã chép: ${text}`, 'ok');
  } catch {
    /* Trình duyệt chặn clipboard khi không phải HTTPS — hiện ra để chép tay. */
    toast(`Toạ độ: ${text}`, 'info', 6000);
  }
}

export { veNoiDung as veLaiSidebar };

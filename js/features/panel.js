/**
 * panel.js — bảng trái: danh sách dự án, bảng lớp bản đồ, bộ lọc.
 */

import { el, fill, debounce } from '../core/dom.js';
import { state, set, taiCaiDat } from '../core/store.js';
import { thieu, cacTrangThai, cacNguon, tenLoaiHinh } from '../core/data.js';
import { locDuAn, khuVucCua } from '../core/loc.js';
import { gia, hoac, co, CHUA_CO } from '../core/format.js';
import { LOP, datLop, veChuThich } from '../map/layers.js';
import { logoDuAn } from '../map/icons.js';
import { danhSachNen, datNen } from '../map/engine.js';
import { chamDiem, nhanDiem } from './score.js';
import { chonDuAn, themSoSanh, batDauGhim, hienLopDuAn } from './projects.js';
import { veBangVanhDai, batTatLocVD, datLocVD, toiDoan, hienLopVanhDai,
         coDuLieu as coVanhDai, cacTuyenVD, tatCaDoan } from './vanhdai.js';

const TABS = [
  { id: 'ds',  nhan: 'Dự án' },
  { id: 'vd',  nhan: 'Vành đai' },
  { id: 'lop', nhan: 'Lớp' },
  { id: 'loc', nhan: 'Bộ lọc' }
];

let host, elTabs, elBody, elFoot, elTim, tab = 'ds';

export function khoiTaoPanel(node, chuThich) {
  host = node;
  elTabs = node.querySelector('.panel__tabs');
  elBody = node.querySelector('.panel__body');
  elFoot = node.querySelector('.panel__foot');
  elTim  = node.querySelector('#loc-ten');

  elTim.addEventListener('input', debounce(() => {
    soHien = MOI_TRANG;
    set({ timKiem: elTim.value }, 'loc-doi');
  }, 200));

  fill(elTabs, TABS.map(t =>
    el('button.panel__tab', { type: 'button', dataset: { tab: t.id }, 'aria-selected': String(tab === t.id) }, t.nhan)));

  elTabs.addEventListener('click', ev => {
    const b = ev.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    for (const x of elTabs.children) x.setAttribute('aria-selected', String(x.dataset.tab === tab));
    ve();
  });

  elBody.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    ({
      'mo':        () => chonDuAn(b.dataset.id),
      /* themSoSanh phát tin 'so-sanh-doi', app.js đã nghe tin đó và vẽ lại
         bảng. Gọi ve() ở đây nữa là vẽ hai lần, và lần vẽ thứ hai thay mất
         chính nút vừa bấm. */
      'so-sanh':   () => themSoSanh(b.dataset.id),
      'ghim':      () => batDauGhim(b.dataset.id),
      'lop':       () => doiLop(b, b.dataset.id, b.getAttribute('aria-pressed') !== 'true'),
      'nen':       () => { datNen(b.dataset.nen); ve(); },
      /* Xoá hàng loạt đổi trạng thái của nhiều chip cùng lúc nên phải vẽ lại cả
         bảng — khác với bấm từng chip, chỉ đổi đúng chip đó. */
      'xoa-loc':   () => {
        datLoc({ giaMin: null, giaMax: null, loaiHinh: [], khuVuc: [], chuDauTu: [], trangThai: [], nguon: [] });
        veLoc();
      },
      'loc-nhieu': () => doiLocNhieu(b, b.dataset.truong, b.dataset.gia),

      /* Vành đai: đổi bộ lọc thì phải vẽ lại cả bảng vì con số thống kê và
         danh sách đoạn đều đổi theo — khác với chip lọc dự án chỉ đổi trạng thái. */
      'vd-loc-tuyen': () => { batTatLocVD('tuyen', b.dataset.gia); ve(); },
      'vd-loc-tt':    () => { batTatLocVD('trangThai', b.dataset.gia); ve(); },
      'vd-xoa-loc':   () => { datLocVD({ tuyen: [], trangThai: [] }); ve(); },
      'vd-toi-doan':  () => toiDoan(b.dataset.gia)
    })[b.dataset.act]?.();
  });

  chuThichHost = chuThich;
  ve();
}

let chuThichHost;

export function ve() {
  /* Ô lọc tên chỉ có nghĩa ở tab danh sách. */
  if (elTim) elTim.parentElement.hidden = tab !== 'ds';
  ({ ds: veDanhSach, vd: () => veBangVanhDai(elBody), lop: veLop, loc: veLoc })[tab]?.();
  if (tab === 'vd') capNhatChanVanhDai();
  if (chuThichHost) veChuThich(chuThichHost);
}

/**
 * Cập nhật sau khi bộ lọc đổi.
 *
 * Ở tab bộ lọc thì chỉ đổi con số dưới chân bảng — các chip đã tự cập nhật
 * trạng thái, dựng lại chúng chỉ tổ làm hỏng lần bấm tiếp theo.
 */
export function capNhatSauLoc() {
  if (tab === 'loc') elFoot.textContent = `${locDuAn().length}/${state.duAn.length} dự án khớp bộ lọc`;
  else ve();
}

/* ─── §1 · DANH SÁCH DỰ ÁN ──────────────────────────────────────────────── */

/**
 * Số thẻ dựng cùng lúc trong danh sách.
 *
 * Với hàng nghìn dự án, dựng hết thành thẻ DOM là treo trình duyệt ngay. Dựng
 * một trang rồi có nút "xem thêm" — người tư vấn không bao giờ cuộn qua 3.000
 * dòng, họ lọc hoặc tìm.
 */
const MOI_TRANG = 60;
let soHien = MOI_TRANG;

function veDanhSach() {
  const ds = locDuAn();
  const daGhim = ds.filter(p => p.toaDo);
  const chuaGhim = ds.filter(p => !p.toaDo);
  const conLai = Math.max(0, daGhim.length - soHien);

  /* Nhóm "chưa có vị trí" hiện đầy đủ, KHÔNG ăn vào hạn mức phân trang của nhóm
     đã ghim. Lý do: nhóm này nhỏ theo bản chất, mà lại là việc cần làm — chính
     là những dự án đang chờ người dùng ghim. Nếu chia chung hạn mức thì với danh
     mục hơn nghìn dự án, chúng bị đẩy ra sau trang 20 và không ai thấy. */
  const hienGhim = daGhim.slice(0, soHien);
  const hienChua = chuaGhim.slice(0, MOI_TRANG);

  fill(elBody, [
    hienGhim.length > 0 ? el('div.sect__title', {}, `Đã có vị trí · ${daGhim.length}`) : null,
    ...hienGhim.map(theDuAn),

    hienChua.length > 0 ? el('div.sect__title', {}, `Chưa có vị trí · ${chuaGhim.length}`) : null,
    hienChua.length > 0 ? el('div.panel__hint', {}, 'Những dự án dưới đây chưa có toạ độ nên không hiện trên ' +
      'bản đồ và chưa chấm điểm được. Bấm "Ghim vị trí" để đánh dấu.') : null,
    ...hienChua.map(theDuAn),

    conLai > 0 ? el('button.btn.panel__them', {
      type: 'button',
      onclick: () => { soHien += MOI_TRANG * 4; veDanhSach(); }
    }, `Xem thêm ${Math.min(conLai, MOI_TRANG * 4)} dự án · còn ${conLai}`) : null,

    !ds.length ? el('div.empty', {}, [el('div.empty__icon', {}, '🔍'), 'Không có dự án nào khớp bộ lọc']) : null
  ]);

  elFoot.textContent = `${ds.length}/${state.duAn.length} dự án · ${daGhim.length} đã ghim vị trí`;
}

function theDuAn(p) {
  const diem = chamDiem(p);
  const nd = nhanDiem(diem.tong);
  const trongBang = state.soSanh.includes(p.id);

  return el('div.pcard', { dataset: { active: state.chon === p.id ? '' : null } }, [
    el('button.pcard__main', { type: 'button', dataset: { act: 'mo', id: p.id } }, [
      el('span', { html: logoDuAn(p, 38) }),
      el('span.grow', {}, [
        el('span.pcard__ten.ellipsis', {}, p.ten),
        el('span.pcard__phu.ellipsis', {}, hoac(p.chuDauTu, 'Chủ đầu tư đang cập nhật')),
        el('span.pcard__meta', {}, [
          p.loaiHinh && el('span.badge', {}, tenLoaiHinh(p.loaiHinh)),
          /* Ứng viên OSM chưa kiểm phải nhìn là biết, đừng để lẫn với hồ sơ đã kiểm. */
          p.nguon === 'osm' && el('span.badge.badge--warn', { title: cacNguon()['osm']?.moTa }, 'Chưa kiểm'),
          co(p.giaTu) ? el('span.pcard__gia', {}, `từ ${gia(p.giaTu, p.donViGia)}`)
                      : el('span.pending', {}, CHUA_CO)
        ])
      ]),
      diem.tong != null
        ? el('span.pcard__diem', { style: { color: nd.mau } }, String(diem.tong))
        : el('span.pcard__diem.pcard__diem--trong', {}, '–')
    ]),
    el('div.pcard__acts', {}, [
      p.toaDo
        ? el('button.btn.btn--sm.btn--ghost', {
            type: 'button', dataset: { act: 'so-sanh', id: p.id }, 'aria-pressed': String(trongBang)
          }, trongBang ? '✓ So sánh' : '⇄ So sánh')
        : el('button.btn.btn--sm.btn--primary', { type: 'button', dataset: { act: 'ghim', id: p.id } }, '📌 Ghim vị trí')
    ])
  ]);
}

/* ─── §2 · BẢNG LỚP ─────────────────────────────────────────────────────── */

/**
 * Bật/tắt một lớp.
 *
 * Chỉ cập nhật đúng hàng vừa bấm, KHÔNG vẽ lại cả bảng. Vẽ lại cả bảng làm mọi
 * nút cũ thành nút mồ côi ngoài cây DOM — bấm liên tiếp nhiều lớp thì chỉ lần
 * bấm đầu ăn, các lần sau rơi vào phần tử đã bị thay. Ngoài ra vẽ lại còn mất
 * vị trí cuộn và mất tiêu điểm bàn phím.
 */
async function doiLop(nut, id, bat) {
  /* Hai lớp này do module riêng quản lý vì cách vẽ khác hẳn: dự án cần gom cụm,
     vành đai cần màu và kiểu nét theo trạng thái từng đoạn. */
  if (id === 'duan') {
    state.lop.duan = bat;
    hienLopDuAn(bat);
  } else if (id === 'vanhdai') {
    state.lop.vanhdai = bat;
    hienLopVanhDai(bat);
    veChuThich(chuThichHost);
  } else {
    /* Lớp nặng có thể phải tải trước khi vẽ. Khoá nút trong lúc chờ để người
       dùng không bấm liên tục tạo ra nhiều lượt tải chồng nhau. */
    nut.disabled = true;
    nut.dataset.dangTai = '';
    await datLop(id, bat);
    nut.disabled = !!LOP.find(l => l.id === id)?.hong;
    delete nut.dataset.dangTai;
  }
  nut.setAttribute('aria-pressed', String(!!state.lop[id]));
  capNhatChanBang();
}

function capNhatChanVanhDai() {
  if (!coVanhDai()) { elFoot.textContent = 'Chưa có dữ liệu đường vành đai'; return; }
  const f = state.locVD;
  const hien = tatCaDoan().filter(d =>
    (!f.tuyen.length || f.tuyen.includes(d.tuyenId)) &&
    (!f.trangThai.length || f.trangThai.includes(d.trangThai)));
  const km = hien.reduce((a, d) => a + d.daiKm, 0).toFixed(1);
  elFoot.textContent = `${cacTuyenVD().length} tuyến · ${hien.length}/${tatCaDoan().length} đoạn đang hiện · ${km} km`;
}

function capNhatChanBang() {
  elFoot.textContent = `${Object.values(state.lop).filter(Boolean).length}/${LOP.length} lớp đang bật` +
    (thieu.size ? ` · ${thieu.size} lớp thiếu dữ liệu` : '');
}

function veLop() {
  const nhomHoa = {};
  for (const l of LOP) (nhomHoa[l.nhom] ??= []).push(l);

  fill(elBody, [
    el('div.sect__title', {}, 'Ảnh nền'),
    el('div.seg.seg--nen', {}, danhSachNen().map(n =>
      el('button.seg__btn', {
        type: 'button', dataset: { act: 'nen', nen: n.key },
        'aria-pressed': String((taiCaiDat().nen ?? 'sang') === n.key)
      }, n.nhan))),

    ...Object.entries(nhomHoa).flatMap(([ten, ds]) => [
      el('div.sect__title', {}, ten),
      ...ds.map(l => el('button.lyr', {
        type: 'button', dataset: { act: 'lop', id: l.id },
        'aria-pressed': String(!!state.lop[l.id]),
        disabled: l.hong,
        title: l.hong ? 'Lớp này thiếu dữ liệu' : ''
      }, [
        el('span.lyr__icon', {}, l.icon),
        el('span.grow', {}, [
          el('span.lyr__ten', {}, l.nhan),
          l.hong ? el('span.lyr__phu.pending', {}, 'Thiếu dữ liệu')
                 : l.zoomToiThieu ? el('span.lyr__phu', {}, `Hiện từ mức phóng ${l.zoomToiThieu}`) : null
        ]),
        el('span.lyr__sw', {})
      ]))
    ]),

    el('div.panel__hint', {}, 'Lớp mật độ dày chỉ vẽ điểm trong khung nhìn hiện tại để bản đồ không bị chậm. ' +
      'Phóng to để thấy đầy đủ.')
  ]);

  capNhatChanBang();
}

/* ─── §3 · BỘ LỌC ───────────────────────────────────────────────────────── */

function datLoc(patch) {
  soHien = MOI_TRANG;                       // đổi bộ lọc thì xem lại từ đầu danh sách
  set({ loc: { ...state.loc, ...patch } }, 'loc-doi');
}

/**
 * Bật/tắt một giá trị lọc.
 *
 * Chỉ đổi thuộc tính của chip vừa bấm, KHÔNG dựng lại cả bảng lọc. Con số trên
 * chip là số lượng trong toàn danh mục nên không đổi theo bộ lọc — không có gì
 * để vẽ lại. Dựng lại thì mọi chip cũ thành nút mồ côi ngoài cây DOM, bấm liên
 * tiếp hai chip chỉ ăn chip đầu.
 */
function doiLocNhieu(nut, truong, giaTri) {
  const hienTai = state.loc[truong] ?? [];
  const bat = !hienTai.includes(giaTri);
  datLoc({ [truong]: bat ? [...hienTai, giaTri] : hienTai.filter(x => x !== giaTri) });
  nut.setAttribute('aria-pressed', String(bat));
}

/** Số lựa chọn tối đa hiện trong một nhóm lọc — chủ đầu tư có thể lên hàng trăm. */
const TOI_DA_CHIP = 40;

function veLoc() {
  /* Đếm số dự án theo từng giá trị để hiện ngay trên chip, và để xếp nhóm nào
     nhiều dự án lên trước. Quét một lượt cho mọi trường, không quét lại từng nhóm. */
  const dem = { loaiHinh: new Map(), chuDauTu: new Map(), trangThai: new Map(), khuVuc: new Map(), nguon: new Map() };
  for (const p of state.duAn) {
    for (const truong of Object.keys(dem)) {
      const v = truong === 'khuVuc' ? khuVucCua(p) : p[truong];
      if (v) dem[truong].set(v, (dem[truong].get(v) ?? 0) + 1);
    }
  }

  const theoSoLuong = m => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'));

  const nhomChon = (tieuDe, truong, danhSach) => {
    const cat = danhSach.slice(0, TOI_DA_CHIP);
    return [
      el('div.sect__title', {}, tieuDe),
      danhSach.length
        ? el('div.row.wrap', {}, [
            ...cat.map(([v, nhan, n]) =>
              el('button.chip', {
                type: 'button', dataset: { act: 'loc-nhieu', truong, gia: v },
                'aria-pressed': String((state.loc[truong] ?? []).includes(v))
              }, n == null ? nhan : `${nhan} · ${n}`)),
            danhSach.length > TOI_DA_CHIP
              ? el('span.muted.chip__more', {}, `và ${danhSach.length - TOI_DA_CHIP} lựa chọn khác — dùng ô tìm kiếm`)
              : null
          ])
        : el('div.panel__hint', {}, 'Chưa có dữ liệu để lọc')
    ];
  };

  fill(elBody, [
    el('div.sect__title', {}, 'Khoảng giá'),
    el('div.row.filter__gia', {}, [
      el('input.inp', {
        type: 'text', inputmode: 'numeric', placeholder: 'Từ', value: state.loc.giaMin ?? '',
        'aria-label': 'Giá từ',
        oninput: debounce(ev => datLocGia('giaMin', ev.target.value), 320)
      }),
      el('span.muted', {}, '—'),
      el('input.inp', {
        type: 'text', inputmode: 'numeric', placeholder: 'Đến', value: state.loc.giaMax ?? '',
        'aria-label': 'Giá đến',
        oninput: debounce(ev => datLocGia('giaMax', ev.target.value), 320)
      })
    ]),
    el('div.panel__hint', {}, 'Nhập theo đơn vị giá của dự án (trđ/m² hoặc trđ/căn). ' +
      'Dự án chưa có giá vẫn giữ trong danh sách.'),

    ...nhomChon('Loại hình', 'loaiHinh',
      theoSoLuong(dem.loaiHinh).map(([v, n]) => [v, tenLoaiHinh(v) || v, n])),

    ...nhomChon('Tình trạng bán', 'trangThai',
      theoSoLuong(dem.trangThai).map(([v, n]) => [v, cacTrangThai()[v]?.nhan ?? v, n])),

    ...nhomChon('Mức tin cậy dữ liệu', 'nguon',
      theoSoLuong(dem.nguon).map(([v, n]) => [v, cacNguon()[v]?.nhan ?? v, n])),
    el('div.panel__hint', {}, 'Ứng viên từ OpenStreetMap có toạ độ và tên thật, nhưng chưa kiểm chứng ' +
      'có phải dự án đang bán hay không. Kiểm trước khi nói với khách.'),

    ...nhomChon('Chủ đầu tư', 'chuDauTu',
      theoSoLuong(dem.chuDauTu).map(([v, n]) => [v, v, n])),

    ...nhomChon('Phường · xã', 'khuVuc',
      theoSoLuong(dem.khuVuc).map(([v, n]) => [v, v, n])),
    el('div.panel__hint', {}, 'TP.HCM sau sáp nhập 01/07/2025 chỉ còn hai cấp hành chính, không còn ' +
      'quận/huyện. Chỉ dự án đã ghim vị trí mới tra được phường/xã.'),

    el('div.row.filter__acts', {}, [
      el('button.btn.btn--sm.grow', { type: 'button', dataset: { act: 'xoa-loc' } }, 'Xoá bộ lọc')
    ])
  ]);

  const n = locDuAn().length;
  elFoot.textContent = `${n}/${state.duAn.length} dự án khớp bộ lọc`;
}

function datLocGia(truong, text) {
  const n = parseFloat(String(text).replace(/[^\d.]/g, ''));
  datLoc({ [truong]: Number.isFinite(n) ? n : null });
}

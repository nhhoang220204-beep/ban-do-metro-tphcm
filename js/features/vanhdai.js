/**
 * vanhdai.js — lớp đường vành đai: vẽ theo trạng thái từng đoạn, bảng thống kê,
 * bộ lọc, và phân tích mức hưởng lợi hạ tầng cho dự án.
 *
 * NGUYÊN TẮC HIỂN THỊ: mỗi ĐOẠN mang trạng thái riêng, không gán một trạng
 * thái cho cả tuyến. Màu và kiểu nét đọc từ data/ring_roads.json chứ không
 * viết cứng trong mã — thêm trạng thái mới chỉ cần sửa dữ liệu.
 *
 * Đoạn đang thi công vẽ bằng SVG để chạy được hiệu ứng nét chuyển động; phần
 * còn lại vẽ trên canvas cho nhẹ. Số đoạn đang thi công ít nên không ảnh hưởng.
 */

import { el, fill, esc } from '../core/dom.js';
import { state, set } from '../core/store.js';
import { duLieu } from '../core/data.js';
import { distToSegment } from '../core/geo.js';
import { map, canvasRenderer } from '../map/engine.js';

/* Vẽ SVG riêng cho đoạn cần hiệu ứng. */
let svgRenderer = null;

let lop = null;
/** Đường Leaflet của từng đoạn, để tô đậm khi chọn trong bảng. */
const duongCuaDoan = new Map();

/* ─── §1 · TRUY CẬP DỮ LIỆU ─────────────────────────────────────────────── */

export const coDuLieu = () => !!duLieu.ring_roads?.tuyen?.length;
export const cacTuyenVD = () => duLieu.ring_roads?.tuyen ?? [];
export const bangTrangThai = () => duLieu.ring_roads?.trangThai ?? {};

/** Mọi đoạn của mọi tuyến, đã phẳng hoá. */
export function tatCaDoan() {
  return cacTuyenVD().flatMap(t => t.doan);
}

/* ─── §2 · BỘ LỌC ───────────────────────────────────────────────────────────
   Không chọn gì = hiện tất cả. Đây là hành vi người dùng mong đợi ở bộ lọc,
   khác với "không chọn gì thì ẩn hết".                                      */

function lotLoc(d) {
  const f = state.locVD;
  if (f.tuyen.length && !f.tuyen.includes(d.tuyenId)) return false;
  if (f.trangThai.length && !f.trangThai.includes(d.trangThai)) return false;
  return true;
}

export function datLocVD(patch) {
  set({ locVD: { ...state.locVD, ...patch } }, 'loc-vd-doi');
  veLai();
}

export function batTatLocVD(truong, giaTri) {
  const cu = state.locVD[truong] ?? [];
  datLocVD({ [truong]: cu.includes(giaTri) ? cu.filter(x => x !== giaTri) : [...cu, giaTri] });
}

/* ─── §3 · VẼ LÊN BẢN ĐỒ ────────────────────────────────────────────────── */

export function khoiTaoVanhDai() {
  if (!coDuLieu()) return null;
  svgRenderer ??= L.svg({ padding: 0.4 });
  lop = L.layerGroup();
  veLai();
  return lop;
}

export function veLai() {
  if (!lop) return;
  lop.clearLayers();
  duongCuaDoan.clear();

  const tt = bangTrangThai();

  for (const doan of tatCaDoan()) {
    if (!lotLoc(doan)) continue;
    const kieu = tt[doan.trangThai] ?? {};

    /* Đoạn cần hiệu ứng phải nằm trên SVG; canvas không nhận CSS. */
    const line = L.polyline(doan.polyline, {
      renderer: kieu.hieuUng ? svgRenderer : canvasRenderer,
      color: doan.mau,
      weight: 5,                       // độ dày thống nhất cho mọi trạng thái
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: kieu.net === 'dut' ? '14 10' : kieu.net === 'cham' ? '2 8' : null,
      className: kieu.hieuUng ? 'vd-thicong' : ''
    });

    line.bindTooltip(`${doan.tenTuyen} · ${kieu.nhan ?? doan.trangThai}`, { sticky: true });
    line.bindPopup(() => popupDoan(doan), { maxWidth: 340 });
    line.on('click', () => set({ doanVD: doan.id }, 'doan-vd-doi'));
    line.addTo(lop);
    duongCuaDoan.set(doan.id, line);
  }
}

export function hienLopVanhDai(bat) {
  if (!lop) return;
  bat ? lop.addTo(map) : map.removeLayer(lop);
}

/** Bay tới một đoạn và mở bong bóng của nó. */
export function toiDoan(id) {
  const line = duongCuaDoan.get(id);
  if (!line) return;
  map.flyToBounds(line.getBounds(), { padding: [70, 70], maxZoom: 14 });
  map.once('moveend', () => line.openPopup());
}

/* ─── §4 · BONG BÓNG THÔNG TIN ──────────────────────────────────────────── */

const CHUA_CO = '<span class="pending">Đang cập nhật</span>';
const o = (k, v) =>
  `<div class="field"><span class="field__k">${k}</span>` +
  `<span class="field__v">${v == null || v === '' ? CHUA_CO : esc(String(v))}</span></div>`;

function popupDoan(d) {
  const kieu = bangTrangThai()[d.trangThai] ?? {};
  const tuyen = cacTuyenVD().find(t => t.id === d.tuyenId);

  return `<div class="pop">
    <div class="pop__head" style="--pop-accent:${d.mau}">
      <div class="grow">
        <div class="pop__title">${esc(d.tenTuyen)}</div>
        <div class="pop__sub">${esc(d.tenDoan)}</div>
      </div>
    </div>
    <div class="pop__body">
      <div class="row" style="margin-bottom:8px">
        <span class="badge badge--dot" style="color:${d.mau}">${esc(kieu.nhan ?? d.trangThai)}</span>
      </div>
      ${o('Điểm đầu', d.diemDau)}
      ${o('Điểm cuối', d.diemCuoi)}
      ${o('Chiều dài', `${d.daiKm} km` + (d.daiHoSoKm ? ` (hồ sơ: ${d.daiHoSoKm} km)` : ''))}
      ${o('Tiến độ', d.tienDoPhanTram != null ? `${d.tienDoPhanTram}%` : null)}
      ${o('Khởi công', d.ngayKhoiCong)}
      ${o('Dự kiến hoàn thành', d.duKienHoanThanh)}
      ${d.ghiChu ? o('Ghi chú', d.ghiChu) : ''}
    </div>
    <div class="pop__foot" style="display:block">
      ${d.nguonHoSo ? `Hồ sơ: ${esc(d.nguonHoSo)}<br>` : ''}
      Hình học và trạng thái: ${esc(d.nguonHinhHoc)}, ảnh chụp ${esc(d.ngayChupOSM)}.
      ${tuyen?.canhBao ? `<br><b>${esc(tuyen.canhBao)}</b>` : ''}
    </div>
  </div>`;
}

/* ─── §5 · BẢNG THỐNG KÊ VÀ DANH SÁCH ĐOẠN ──────────────────────────────── */

export function veBangVanhDai(host) {
  if (!coDuLieu()) {
    fill(host, [el('div.empty', {}, [
      el('div.empty__icon', {}, '🛣'),
      el('div', {}, 'Chưa có dữ liệu đường vành đai.'),
      el('div.empty__hint', {}, 'Chạy: node tools/build-ring-roads.mjs')
    ])]);
    return;
  }

  const tt = bangTrangThai();
  const f = state.locVD;

  fill(host, [
    el('div.sect__title', {}, 'Lọc theo tuyến'),
    el('div.row.wrap', {}, cacTuyenVD().map(t =>
      el('button.chip', {
        type: 'button', dataset: { act: 'vd-loc-tuyen', gia: t.id },
        'aria-pressed': String(f.tuyen.includes(t.id))
      }, [
        el('span.vd-cham', { style: { background: t.mau } }),
        `${t.ten} · ${t.soDoan} đoạn`
      ]))),

    el('div.sect__title', {}, 'Lọc theo trạng thái'),
    el('div.row.wrap', {}, Object.entries(tt)
      .sort((a, b) => a[1].thuTu - b[1].thuTu)
      .map(([ma, k]) => {
        const dem = tatCaDoan().filter(d => d.trangThai === ma).length;
        return el('button.chip', {
          type: 'button', dataset: { act: 'vd-loc-tt', gia: ma },
          'aria-pressed': String(f.trangThai.includes(ma)),
          disabled: dem === 0
        }, [el('span.vd-cham', { style: { background: k.mau } }), `${k.nhan} · ${dem}`]);
      })),

    (f.tuyen.length || f.trangThai.length)
      ? el('button.btn.btn--sm.panel__them', { type: 'button', dataset: { act: 'vd-xoa-loc' } }, 'Bỏ lọc')
      : null,

    ...cacTuyenVD().flatMap(t => theTuyen(t, tt))
  ]);
}

function theTuyen(t, tt) {
  const hienDoan = t.doan.filter(lotLoc);
  if (state.locVD.tuyen.length && !state.locVD.tuyen.includes(t.id)) return [];

  const thanh = Object.entries(t.theoTrangThai)
    .sort((a, b) => (tt[a[0]]?.thuTu ?? 9) - (tt[b[0]]?.thuTu ?? 9));

  return [
    el('div.sect__title', {}, [el('span.vd-cham', { style: { background: t.mau } }), t.ten]),

    el('div.card.vd-card', {}, [
      el('div.card__body', {}, [
        el('div.field', {}, [
          el('span.field__k', {}, 'Tổng chiều dài'),
          el('span.field__v', {}, t.tongDaiKm?.giaTri ? `${t.tongDaiKm.giaTri} km theo hồ sơ` : 'Đang cập nhật')
        ]),
        el('div.field', {}, [
          el('span.field__k', {}, 'Đo được'),
          el('span.field__v', {}, `${t.tongDoDuocKm} km từ hình học OSM`)
        ]),

        /* Thanh tỷ lệ theo trạng thái — nhìn là biết tuyến xong tới đâu. */
        el('div.vd-bar', {}, thanh.map(([ma, km]) =>
          el('span', {
            style: { width: `${(km / t.tongDoDuocKm) * 100}%`, background: tt[ma]?.mau ?? '#94a3b8' },
            title: `${tt[ma]?.nhan ?? ma}: ${km} km`
          }))),

        ...thanh.map(([ma, km]) => el('div.field', {}, [
          el('span.field__k', {}, [el('span.vd-cham', { style: { background: tt[ma]?.mau } }), tt[ma]?.nhan ?? ma]),
          el('span.field__v', {}, `${km} km`)
        ])),

        el('div.field', {}, [
          el('span.field__k', {}, 'Tỷ lệ hoàn thành'),
          t.tyLeHoanThanh != null
            ? el('span.field__v.big', {}, `${t.tyLeHoanThanh}%`)
            : el('span.field__v.pending', {}, 'Đang cập nhật')
        ])
      ])
    ]),

    t.canhBao ? el('div.src', {}, ['⚠', el('div', {}, t.canhBao)]) : null,
    t.tienDo ? el('div.panel__hint', {}, t.tienDo) : null,

    el('div.vd-list', {}, hienDoan.map(d =>
      el('button.vd-doan', {
        type: 'button', dataset: { act: 'vd-toi-doan', gia: d.id },
        style: { '--vd-mau': d.mau }
      }, [
        el('span.vd-doan__ten.ellipsis', {}, d.tenDoan),
        el('span.vd-doan__meta', {}, [
          el('span.badge', { style: { color: d.mau } }, tt[d.trangThai]?.nhan ?? d.trangThai),
          el('span.muted', {}, `${d.daiKm} km`)
        ])
      ])))
  ];
}

/* ─── §6 · PHÂN TÍCH CHO DỰ ÁN ──────────────────────────────────────────────
   Đo tới CẠNH của đoạn, không phải tới đỉnh — đo tới đỉnh từng cho sai vài km
   ở chỗ thực tế chỉ vài trăm mét.

   Con số trả về là khoảng cách theo đường thẳng tới tim tuyến, KHÔNG phải
   quãng đường lái xe. Nơi hiển thị phải nói rõ điều đó.                     */

export function vanhDaiGanNhat(duAn, banKinhM = 8000) {
  if (!duAn?.toaDo || !coDuLieu()) return null;

  const gan = [];
  for (const d of tatCaDoan()) {
    let min = Infinity;
    for (let i = 0; i < d.polyline.length - 1; i++) {
      const x = distToSegment(duAn.toaDo, d.polyline[i], d.polyline[i + 1]);
      if (x < min) min = x;
      if (min < 5) break;
    }
    if (min <= banKinhM) gan.push({ doan: d, m: Math.round(min) });
  }
  if (!gan.length) return null;

  gan.sort((a, b) => a.m - b.m);

  /* Mỗi tuyến chỉ giữ đoạn gần nhất — người tư vấn cần biết "gần Vành đai 3
     bao nhiêu", không cần biết cả tám đoạn của nó. */
  const theoTuyen = new Map();
  for (const g of gan) if (!theoTuyen.has(g.doan.tuyenId)) theoTuyen.set(g.doan.tuyenId, g);

  return { ganNhat: gan[0], theoTuyen: [...theoTuyen.values()] };
}

/**
 * Đánh giá mức hưởng lợi hạ tầng từ vành đai.
 *
 * Chấm theo hai thứ đo được: khoảng cách tới tim tuyến, và trạng thái đoạn đó.
 * Đoạn đã thông xe có giá trị ngay; đoạn còn trên giấy chỉ là kỳ vọng — nên
 * hệ số khác nhau. Không có dữ liệu thì trả null, không đoán.
 */
const HE_SO_TRANG_THAI = {
  'hoan-thanh': 1, 'dang-thi-cong': 0.8, 'chuan-bi': 0.65, 'quy-hoach': 0.45, 'chua-xac-minh': 0.3
};

export function danhGiaHuongLoi(duAn) {
  const kq = vanhDaiGanNhat(duAn);
  if (!kq) return null;

  const { doan, m } = kq.ganNhat;
  const heSo = HE_SO_TRANG_THAI[doan.trangThai] ?? 0.3;

  /* Dưới 1 km là bám trục; quá 8 km thì gần như không còn tác động. */
  const goc = m <= 1000 ? 10 : m <= 2000 ? 8.5 : m <= 3500 ? 7 : m <= 5000 ? 5.5 : m <= 8000 ? 3.5 : 1.5;
  const diem = Math.max(0, Math.min(10, goc * heSo));

  const tt = bangTrangThai()[doan.trangThai]?.nhan ?? doan.trangThai;
  const muc = diem >= 8 ? 'Rất cao' : diem >= 6.5 ? 'Cao' : diem >= 4.5 ? 'Trung bình' : diem >= 2.5 ? 'Thấp' : 'Không đáng kể';

  return {
    diem: +diem.toFixed(1),
    muc,
    doan,
    khoangCachM: m,
    giaiThich: `Cách ${doan.tenTuyen} khoảng ${m < 1000 ? m + ' m' : (m / 1000).toFixed(1) + ' km'} ` +
               `theo đường thẳng tới tim tuyến — đoạn "${doan.tenDoan}", ${tt.toLowerCase()}.`,
    canhBao: doan.trangThai !== 'hoan-thanh'
      ? 'Đoạn này chưa thông xe. Lợi ích hạ tầng là kỳ vọng, chưa hiện hữu — nói rõ với khách.'
      : null,
    theoTuyen: kq.theoTuyen
  };
}

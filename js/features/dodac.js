/**
 * dodac.js — đo khoảng cách tới ga metro ngay trong trình duyệt, theo yêu cầu.
 *
 * VÌ SAO CẦN: `tools/build-around.mjs` tiền tính khoảng cách cho từng dự án,
 * mỗi dự án mất vài phút vì phải gọi máy chủ công cộng. Với danh mục hàng nghìn
 * dự án thì cách đó không chạy nổi. Nên chia hai đường:
 *
 *   - Dự án đã tiền tính (data/routes.json) → dùng luôn, không gọi mạng.
 *   - Dự án chưa có → đo tại chỗ khi người dùng mở nó ra, rồi nhớ trên máy.
 *
 * Vẫn là ĐƯỜNG THẬT qua OSRM, không phải đường chim bay. Đo không được thì
 * hiển thị "Đang cập nhật" — tuyệt đối không thay bằng ước lượng.
 *
 * Chỉ đo ga metro, KHÔNG đo tiện ích. Tiện ích cần 13 truy vấn Overpass mỗi dự
 * án, mỗi truy vấn hàng chục giây — không thể bắt người dùng ngồi chờ. Phần đó
 * vẫn để công cụ chạy sẵn.
 *
 * Nơi ĐỌC số liệu là data.gaCua(). Module này chỉ lo phần ĐO và ghi.
 */

import { duLieu, gaCua, ghiDoDac } from '../core/data.js';
import { hav } from '../core/geo.js';
import { emit } from '../core/store.js';

/* Số ga đưa vào đo. Sàng sơ bộ bằng đường chim bay chỉ để CHỌN ga đáng đo;
   con số hiển thị luôn là đường thật. */
const SO_GA_DO = 6;

/** Bỏ cuộc sau ngần này để người dùng không nhìn vòng xoay mãi. */
const HET_GIO_MS = 12000;

const OSRM = {
  xe: 'https://router.project-osrm.org/table/v1/driving',
  bo: 'https://routing.openstreetmap.de/routed-foot/table/v1/foot'
};

/** Dự án nào đang đo dở — để gọi hai lần không thành hai lượt gọi mạng. */
const dangDo = new Map();

export const dangDoDuAn = id => dangDo.has(id);

/**
 * Đo khoảng cách tới ga metro cho một dự án, nếu chưa có số liệu.
 * @returns {Promise<object|null>} cùng dạng với một mục trong routes.json
 */
export async function doGaMetro(duAn) {
  if (!duAn?.toaDo) return null;

  const san = gaCua(duAn);
  if (san) return san;
  if (dangDo.has(duAn.id)) return dangDo.get(duAn.id);

  const viec = doThat(duAn).finally(() => dangDo.delete(duAn.id));
  dangDo.set(duAn.id, viec);

  const kq = await viec;
  emit('do-dac-xong', { id: duAn.id, kq });
  return kq;
}

async function doThat(duAn) {
  const stations = duLieu.stations?.stations ?? [];
  if (!stations.length) return null;

  const gan = stations
    .map(s => ({ s, d: hav(duAn.toaDo, s.c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, SO_GA_DO);

  const [xe, bo] = await Promise.all([
    bang('xe', duAn.toaDo, gan.map(g => g.s.c)),
    bang('bo', duAn.toaDo, gan.map(g => g.s.c))
  ]);

  /* Cả hai hồ sơ đều hỏng thì coi như chưa đo được — không ghi một nửa số liệu. */
  if (!xe && !bo) return null;

  const cacGa = gan
    .map((g, i) => ({
      id: g.s.id, name: g.s.name, lines: g.s.lines, c: g.s.c,
      diXe: xe?.[i] ?? null,
      diBo: bo?.[i] ?? null
    }))
    .filter(g => g.diXe || g.diBo)
    /* Xếp theo đường đi xe thật, không theo chim bay — sông và đường một chiều
       làm ga "gần nhất trên bản đồ" nhiều khi không phải ga dễ tới nhất. */
    .sort((a, b) => (a.diXe?.m ?? Infinity) - (b.diXe?.m ?? Infinity));

  if (!cacGa.length) return null;

  /* Lưu kèm toạ độ đã dùng, để ghim lại chỗ khác thì số đo cũ tự hết hiệu lực. */
  const banGhi = { c: duAn.toaDo, gaGanNhat: cacGa[0], cacGa, doLuc: new Date().toISOString() };
  ghiDoDac(duAn.id, banGhi);
  return { ...banGhi, nguonSo: 'do-tai-cho' };
}

/** Ma trận một-tới-nhiều qua OSRM. Trả null nếu máy chủ không trả lời. */
async function bang(mode, from, to) {
  if (!to.length) return null;
  const toaDo = [from, ...to].map(p => `${p[1]},${p[0]}`).join(';');
  const url = `${OSRM[mode]}/${toaDo}?sources=0&annotations=distance,duration`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(HET_GIO_MS) });
    if (!res.ok) return null;
    const j = await res.json();
    if (j.code !== 'Ok' || !j.distances?.[0] || !j.durations?.[0]) return null;

    const d = j.distances[0].slice(1), t = j.durations[0].slice(1);
    return d.map((m, i) =>
      m == null || t[i] == null ? null : { m: Math.round(m), giay: Math.round(t[i]) });
  } catch {
    return null;   // hết giờ hoặc mất mạng — nơi gọi sẽ hiện "Đang cập nhật"
  }
}

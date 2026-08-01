/**
 * route.mjs — khoảng cách và thời gian theo ĐƯỜNG THẬT, không phải đường chim bay.
 *
 * Dùng dịch vụ `table` của OSRM: một lần gọi trả về ma trận khoảng cách + thời
 * gian từ một điểm nguồn tới hàng chục điểm đích. Rẻ hơn gọi `route` từng cặp
 * hàng trăm lần và không đụng giới hạn tần suất của máy chủ công cộng.
 *
 * Hai máy chủ khác nhau vì mỗi máy chủ chỉ dựng sẵn một hồ sơ di chuyển:
 *   - đi xe  → router.project-osrm.org        (profile driving)
 *   - đi bộ  → routing.openstreetmap.de       (profile foot, máy chủ FOSSGIS)
 *
 * Cả hai đều là máy chủ công cộng miễn phí, không cần khoá. Đổi lại phải chờ
 * giữa các lần gọi và chấp nhận thỉnh thoảng lỗi tạm thời → có cơ chế thử lại.
 */

import { sleep, log } from './osm.mjs';

const PROFILES = {
  xe: { base: 'https://router.project-osrm.org', profile: 'driving' },
  bo: { base: 'https://routing.openstreetmap.de/routed-foot', profile: 'foot' }
};

/* Máy chủ demo giới hạn 100 toạ độ mỗi lần gọi (gồm cả điểm nguồn). */
const MAX_DEST = 95;

/** Chờ giữa các lần gọi để không bị chặn vì gọi quá dày. */
const GAP_MS = 1200;

/**
 * Ma trận từ một điểm nguồn tới nhiều điểm đích, theo đường thật.
 *
 * @param {'xe'|'bo'} mode
 * @param {[number,number]} from   [lat, lng]
 * @param {[number,number][]} to   danh sách [lat, lng]
 * @returns {Promise<({m:number, giay:number}|null)[]>} cùng thứ tự với `to`;
 *          phần tử null nghĩa là OSRM không tìm được đường — hiển thị
 *          "Đang cập nhật", tuyệt đối không thay bằng đường chim bay.
 */
export async function table(mode, from, to) {
  if (!to.length) return [];
  const out = new Array(to.length).fill(null);

  for (let start = 0; start < to.length; start += MAX_DEST) {
    const slice = to.slice(start, start + MAX_DEST);
    const rows = await tableChunk(mode, from, slice);
    for (let i = 0; i < slice.length; i++) out[start + i] = rows[i];
    await sleep(GAP_MS);
  }
  return out;
}

async function tableChunk(mode, from, to, tries = 5) {
  const { base, profile } = PROFILES[mode];
  const coords = [from, ...to].map(p => `${p[1]},${p[0]}`).join(';');
  const url = `${base}/table/v1/${profile}/${coords}?sources=0&annotations=distance,duration`;

  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ban-do-bds-hcm/2.0' } });
      if (res.ok) {
        const j = await res.json();
        if (j.code === 'Ok' && j.distances?.[0] && j.durations?.[0]) {
          /* Cột 0 là chính điểm nguồn — bỏ đi, phần còn lại khớp thứ tự `to`. */
          const dist = j.distances[0].slice(1), dur = j.durations[0].slice(1);
          return dist.map((m, k) =>
            m == null || dur[k] == null ? null : { m: Math.round(m), giay: Math.round(dur[k]) });
        }
        log(`    ! OSRM ${mode} trả code=${j.code}`);
      } else {
        log(`    ! OSRM ${mode} HTTP ${res.status}`);
      }
    } catch (err) {
      log(`    ! OSRM ${mode} ${err.message}`);
    }
    await sleep(4000 * (i + 1));
  }
  log(`    ✗ OSRM ${mode} bỏ cuộc sau ${tries} lần — ${to.length} điểm để trống`);
  return new Array(to.length).fill(null);
}

/** Cả hai hồ sơ trong một lượt, trả về mảng {diBo, diXe} khớp thứ tự `to`. */
export async function bothModes(from, to) {
  const bo = await table('bo', from, to);
  const xe = await table('xe', from, to);
  return to.map((_, i) => ({ diBo: bo[i], diXe: xe[i] }));
}

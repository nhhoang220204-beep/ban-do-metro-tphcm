#!/usr/bin/env node
/**
 * probe-du-an.mjs — đếm xem OpenStreetMap có bao nhiêu đối tượng có thể là
 * dự án bất động sản trong TP.HCM mới.
 *
 * Chạy trước khi dựng danh mục, để biết quy mô thật thay vì đoán.
 */

import { overpass, AREA_HCM } from './lib/osm.mjs';

const TRUY_VAN = {
  'building=apartments có tên':        'nwr["building"="apartments"]["name"](area.hcm);',
  'building=residential có tên':       'nwr["building"="residential"]["name"](area.hcm);',
  'landuse=residential có tên':        'nwr["landuse"="residential"]["name"](area.hcm);',
  'place=neighbourhood/quarter':       'nwr["place"~"^(neighbourhood|quarter)$"]["name"](area.hcm);',
  'building=house/terrace có tên':     'nwr["building"~"^(house|detached|terrace|semidetached_house)$"]["name"](area.hcm);',
  'building:levels ≥ 5 có tên':        'nwr["building"]["name"]["building:levels"~"^(([5-9])|([1-9][0-9]+))$"](area.hcm);'
};

for (const [nhan, loc] of Object.entries(TRUY_VAN)) {
  try {
    const j = await overpass(`[out:json][timeout:180];${AREA_HCM}${loc}out count;`, { label: nhan, toiThieu: 0 });
    const c = j.elements?.[0]?.tags?.total ?? '?';
    console.log(`${String(c).padStart(7)}  ${nhan}`);
  } catch (err) {
    console.log(`    ERR  ${nhan}: ${err.message}`);
  }
}

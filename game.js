/* 人在江湖殺 — 第 2 階段(職業、關卡、修練、音效) */
(() => {
'use strict';
const BUILD = '1012-K';
const W = 540, H = 960, HERO_Y = 800;
const SCROLL = 150;          // 世界往下捲動速度
const MAXU = 200;            // 分身上限
const MAXSHOOT = 16;         // 實際發射的人數上限(其餘人數換成傷害倍率)

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const wrap = document.getElementById('wrap') || document.body;
const view = { s: 1, d: 1 };
const PERF_MOB = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const DEBUG_MODE = /[?&]dev=1/.test(location.search) || !!window.JH_TEST;   // 測試工具總開關：正式環境一律隱藏
const PERF = (() => { let m = null; try { m = JSON.parse(localStorage.getItem('jh_perf2') || 'null'); } catch (e) {}   // 記住這支手機適合的畫質，下次開遊戲直接用
  return { dtop: PERF_MOB ? 2 : 2, dmax: m && m.dmax ? m.dmax : PERF_MOB ? 1.8 : 2, good: 0, acc: 0, n: 0, slowT: 0, autoLow: !!(m && m.low), warm: 0 }; })();
function perfSave() { try { localStorage.setItem('jh_perf2', JSON.stringify({ dmax: PERF.dmax, low: PERF.autoLow })); } catch (e) {} }
function perfTick(ms) {   // 連續卡頓就自動降解析度、降特效；順了就不動
  if (!(S.mode === 'play') || S.paused) { PERF.acc = PERF.n = 0; PERF.warm = 0; return; }
  if (PERF.warm < 20) { PERF.warm++; return; }   // 開局前 20 格不算(載入、切換畫面的頓一下)
  PERF.acc += Math.min(ms, 100); PERF.n++;
  if (PERF.n < 40) return;   // 約 1～2 秒就判斷一次，比原本快一倍
  const avg = PERF.acc / PERF.n; PERF.acc = PERF.n = 0;
  if (avg > 21) {   // 先降特效(看不太出來)，還是卡才降解析度，最低 1.25 倍，字才不會糊
    if (!PERF.autoLow) { PERF.autoLow = true; perfSave(); }
    else if (PERF.dmax > 1.3) { PERF.dmax = Math.max(1.25, Math.round((PERF.dmax - 0.2) * 100) / 100); resize(); perfSave(); }
    PERF.good = 0;
  } else if (avg < 14 && PERF.dmax < PERF.dtop && ++PERF.good >= 8) { PERF.good = 0; PERF.dmax = Math.min(PERF.dtop, Math.round((PERF.dmax + 0.2) * 100) / 100); resize(); perfSave(); }   // 連續順暢約 10 秒，解析度升回一階
}
function wantDmax() { try { return S.mode === 'play' ? PERF.dmax : PERF.dtop; } catch (e) { return PERF.dtop; } }   // 選單、介面畫面用滿解析度(沒有效能壓力)，只有戰鬥中才會因卡頓降低
function resize() {
  const ww = wrap.clientWidth || window.innerWidth, wh = wrap.clientHeight || window.innerHeight;
  const s = Math.min(ww / W, wh / H), d = Math.min(window.devicePixelRatio || 1, wantDmax());
  view.s = s; view.d = d;
  cv.style.width = Math.round(W * s) + 'px'; cv.style.height = Math.round(H * s) + 'px';
  cv.width = Math.round(W * s * d); cv.height = Math.round(H * s * d);
  try { ctx.imageSmoothingQuality = 'high'; } catch (e) {}
  try { for (const k in SPRC) delete SPRC[k]; DMGC.clear(); } catch (e) {}
}
window.addEventListener('resize', resize); resize();

// ---------- 工具 ----------
let seed = 1;
function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rr = (a, b) => a + rnd() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const IS_TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
const FONT = '"JHNum","PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif';
const TFONT = '"JHNum","JHBrush","JHBrush2","Songti TC","STSong","Noto Serif TC","Noto Serif CJK TC","Source Han Serif TC","PMingLiU","MingLiU",serif';   // 標題用的書法感襯線字
const NFONT = `"Arial Black","Segoe UI Black",Impact,Roboto,Arial,${TFONT}`;   // 門上的數字用粗體字，毛筆數字太潦草不好認

// 書法字體(font.js 內嵌，載入完成後畫面自動換成毛筆字)
if (window.JH_NUM_DATA && window.FontFace) {   // 數字字體：只負責英數符號，中文仍用原本字型
  try { const nf = new FontFace('JHNum', `url(${window.JH_NUM_DATA})`, { unicodeRange: 'U+0020-007E, U+00B7, U+00D7', weight: '100 900' }); nf.load().then(f => { document.fonts.add(f); try { DMGC.clear(); } catch (e) {} }).catch(() => {}); } catch (e) {}
}
if (window.JH_FONT2_DATA && window.FontFace) {   // 書法字體缺字的補字(宋體粗)
  try { const f2 = new FontFace('JHBrush2', `url(${window.JH_FONT2_DATA})`, { unicodeRange: 'U+2E80-FFFF' }); f2.load().then(f => { document.fonts.add(f); }).catch(() => {}); } catch (e) {}
}
if (window.JH_FONT_DATA && window.FontFace) {
  try { const ff = new FontFace('JHBrush', `url(${window.JH_FONT_DATA})`, { unicodeRange: 'U+2E80-FFFF' }); ff.load().then(f => { document.fonts.add(f); }).catch(() => {}); } catch (e) {}
}

// ---------- 存檔 ----------
function defSave() { return { st120: 1, coins: 0, cleared: 0, stars: [0, 0, 0, 0, 0], up: { atk: 0, hp: 0, rate: 0 }, cls: 'sword', mute: false, tut: false, gems: 0, gear: {}, eq: { wpn: null, arm: null, art: null }, pity: 0, pass: null, stats: {}, achv: {}, ttl: '', ess: [0, 0, 0, 0, 0], endless: { best: 0, bestKills: 0 }, guide: {}, frag: {}, star: {}, skins: { own: {}, eq: {} }, hard: { cleared: 0, stars: [] }, mail: { got: {} }, opt: { shake: true, fx: 'high', bgm: true }, idle: { t: 0, quick: { d: '', n: 0 } }, daily: null, login: { n: 0, last: '' }, t: 0, shop: { first: {}, packs: {}, monthEnd: '', monthLast: '', ad: { d: '', n: 0 }, fails: [], offer: 0 } }; }
function mig120(o) {   // 舊存檔(每章 5 關)→ 新版(每章 10 關)：舊第 k 關對應新的 2k+1 關，前一關一併算通過
  const nI = k => Math.floor(k / 5) * 10 + (k % 5) * 2 + 1, map = a => { const b = []; (a || []).forEach((v, k) => { if (k < 30) { b[nI(k)] = v; b[nI(k) - 1] = v; } }); return b; };
  o.cleared = Math.min(120, (o.cleared || 0) * 2); o.stars = map(o.stars); o.chal = map(o.chal);
  if (o.hard) { o.hard.cleared = Math.min(120, (o.hard.cleared || 0) * 2); o.hard.stars = map(o.hard.stars); }
  if (o.weekly && o.weekly.ref) o.weekly.ref = nI(o.weekly.ref);
  o.st120 = 1; return o;
}
function normalize(o) {
  if (o && !o.st120) mig120(o);
  const s = Object.assign(defSave(), o || {});
  s.up = Object.assign({ atk: 0, hp: 0, rate: 0 }, s.up || {});
  s.gear = s.gear || {}; s.eq = Object.assign({ wpn: null, arm: null, art: null }, s.eq || {});
  s.login = Object.assign({ n: 0, last: '' }, s.login || {});
  s.stats = s.stats || {}; s.achv = s.achv || {}; s.guide = s.guide || {};
  s.frag = s.frag || {}; s.star = s.star || {}; s.skins = Object.assign({ own: {}, eq: {} }, s.skins || {}); s.opt = Object.assign({ shake: true, fx: 'high', bgm: true }, s.opt || {});
  s.idle = Object.assign({ t: 0, quick: { d: '', n: 0 } }, s.idle || {});
  s.endless = Object.assign({ best: 0, bestKills: 0 }, s.endless || {});
  s.tower = Object.assign({ best: 0 }, s.tower || {});
  s.tk = Object.assign({ pet: 0, gear: 0 }, s.tk || {});   // 召喚券
  s.gbr = s.gbr || {}; s.xt = s.xt || 0; s.mpity = s.mpity || 0; s.mstar = s.mstar || {}; s.mess = s.mess || 0; s.relic = s.relic || {}; s.temper = s.temper || {};   // 神話保底、神話星級、神話精魄、古物秘技(每部位一個)
  s.pawn = Object.assign({ shelf: [], t: 0, hand: null, bag: [], streak: 0, st: { n: 0, spent: 0, got: 0, best: 0 } }, s.pawn || {});                     // 裝備突破次數、玄鐵
  s.plv = s.plv || {}; s.pbr = s.pbr || {};                  // 靈寵等級、突破次數
  s.shop.xtw = s.shop.xtw || {};                               // 玄鐵禮包本週購買紀錄
  s.pets = s.pets || {}; s.petSeen = s.petSeen || {}; if (s.pet === undefined) s.pet = null; s.ppity = s.ppity || 0; if (!Array.isArray(s.fy)) s.fy = [0, 0, 0, 0];
  if (!Array.isArray(s.chal)) s.chal = [];
  while (s.chal.length < 120) s.chal.push(0);
  s.weekly = Object.assign({ wk: -1, ref: 0, best: 0, got: 0, day: '', tries: 0, adUsed: false }, s.weekly || {});
  if (!Array.isArray(s.ess)) s.ess = [0, 0, 0, 0, 0];
  s.shop = Object.assign(defSave().shop, s.shop || {}); s.shop.first = s.shop.first || {}; s.shop.packs = s.shop.packs || {}; s.shop.fails = s.shop.fails || []; s.shop.ad = s.shop.ad || { d: '', n: 0 };
  if (!Array.isArray(s.stars)) s.stars = [];
  while (s.stars.length < 120) s.stars.push(0);
  s.hard = Object.assign({ cleared: 0, stars: [] }, s.hard || {}); if (!Array.isArray(s.hard.stars)) s.hard.stars = [];
  while (s.hard.stars.length < 120) s.hard.stars.push(0);
  s.sub = s.sub || 0; s.hard.sub = s.hard.sub || 0;   // 目前這一關已通過幾個小關(0～9)
  s.mail = Object.assign({ got: {} }, s.mail || {});
  s.owned = s.owned || {};
  return s;
}
let save = (() => { const raw = store.get('jh_save', null) || store.get('jh_save_bak', null), s = normalize(raw); if (!raw) s.coins = store.get('jh_coins', 0) || 0; return s; })();   // 主存檔壞掉時自動用上一份備份
function persist() {
  save.t = Date.now();
  try { const prev = localStorage.getItem('jh_save'); if (prev) localStorage.setItem('jh_save_bak', prev); } catch (e) {}   // 上一份好的存檔輪為備份，防寫入途中損毀
  store.set('jh_save', save); cloudDirty();
}

// ---------- 定義 ----------
// ---------- 章節總表：接新章節的素材時只改這張表 ----------
// 每章一筆：name 章名、roster 四種小怪、file 素材檔(沒有就 null)、fb 素材未到時借用哪一章(0 起算，null=不借)
// 另外要配合的：STAGES 加 10 關、BOSSD 加兩隻首領、ART_FB 的首領借圖、sw.js 的 FILES 清單
const CHAP = [
  { name: '第一章　山腳村落', roster: { basic: 'bandit',   shooter: 'poison',  tank: 'bronze', zig: 'assassin' }, file: null,            fb: null },
  { name: '第二章　竹林',     roster: { basic: 'gang',     shooter: 'blow',    tank: 'shield', zig: 'bee' },      file: 'assets_ch2.js', fb: null },
  { name: '第三章　魔教總壇', roster: { basic: 'cultist',  shooter: 'mage',    tank: 'golem',  zig: 'ghost' },    file: 'assets_ch3.js', fb: null },
  { name: '第四章　天山雪域', roster: { basic: 'wolf',     shooter: 'icebow',  tank: 'yeti',   zig: 'shard' },    file: 'assets_ch4.js', fb: null },
  { name: '第五章　南疆苗寨', roster: { basic: 'miao',     shooter: 'gushi',   tank: 'python', zig: 'spider' },   file: 'assets_ch5.js', fb: null },
  { name: '第六章　紫禁皇城', roster: { basic: 'guard',    shooter: 'gunner',  tank: 'iron',   zig: 'spy' },      file: 'assets_ch6.js', fb: null },
  { name: '第七章　東海蓬萊', roster: { basic: 'pirate',   shooter: 'harpoon', tank: 'crab',   zig: 'flyfish' },  file: 'assets_ch7.js', fb: 1 },
  { name: '第八章　大漠孤煙', roster: { basic: 'rider',    shooter: 'xbow',    tank: 'scorp',  zig: 'dust' },     file: null,            fb: 0 },
  { name: '第九章　古墓幽谷', roster: { basic: 'jiangshi', shooter: 'beemaid', tank: 'statue', zig: 'jadebee' },  file: null,            fb: 2 },
  { name: '第十章　崑崙仙境', roster: { basic: 'kldisc',   shooter: 'taoist',  tank: 'ape',    zig: 'crane' },    file: null,            fb: 3 },
  { name: '第十一章　幽冥地府', roster: { basic: 'gui',    shooter: 'scribe',  tank: 'oxhead', zig: 'wisp' },     file: null,            fb: 2 },
  { name: '第十二章　華山論劍', roster: { basic: 'hsdisc', shooter: 'hidden',  tank: 'elder',  zig: 'shadow' },   file: null,            fb: 5 },
];
const CHAPTERS = CHAP.map(c => c.name);
const STAGES = [
  { ch: 0, name: '林間小徑', len: 36, hm: 0.68, boss: 'elite' },
  { ch: 0, name: '村口', len: 40, hm: 0.85, boss: 'elite' },
  { ch: 0, name: '渡口', len: 46, hm: 1.05, boss: 'elite' },
  { ch: 0, name: '稻田', len: 52, hm: 1.3, boss: 'elite' },
  { ch: 0, name: '破廟', len: 55, hm: 1.46, boss: 'elite' },
  { ch: 0, name: '山道', len: 58, hm: 1.65, boss: 'elite' },
  { ch: 0, name: '斷橋', len: 61, hm: 1.84, boss: 'elite' },
  { ch: 0, name: '寨門', len: 64, hm: 2.05, boss: 'elite' },
  { ch: 0, name: '箭樓', len: 68, hm: 2.26, boss: 'elite' },
  { ch: 0, name: '黑風寨', len: 72, hm: 2.5, boss: 'chief' },
  { ch: 1, name: '竹林外圍', len: 46, hm: 2.92, boss: 'elite2' },
  { ch: 1, name: '竹林入口', len: 50, hm: 3.4, boss: 'elite2' },
  { ch: 1, name: '竹影小徑', len: 53, hm: 3.73, boss: 'elite2' },
  { ch: 1, name: '竹海', len: 56, hm: 4.1, boss: 'elite2' },
  { ch: 1, name: '瀑布潭', len: 58, hm: 4.48, boss: 'elite2' },
  { ch: 1, name: '溪橋', len: 60, hm: 4.9, boss: 'elite2' },
  { ch: 1, name: '竹樓哨站', len: 62, hm: 5.28, boss: 'elite2' },
  { ch: 1, name: '青竹幫寨', len: 64, hm: 5.7, boss: 'elite2' },
  { ch: 1, name: '劍痕崖', len: 68, hm: 6.13, boss: 'elite2' },
  { ch: 1, name: '竹林深處', len: 72, hm: 6.6, boss: 'chief2' },
  { ch: 2, name: '黑松林', len: 48, hm: 6.7, boss: 'elite3' },
  { ch: 2, name: '山門', len: 52, hm: 6.8, boss: 'elite3' },
  { ch: 2, name: '白骨道', len: 54, hm: 7.09, boss: 'elite3' },
  { ch: 2, name: '血池', len: 56, hm: 7.4, boss: 'elite3' },
  { ch: 2, name: '刑堂', len: 58, hm: 7.79, boss: 'elite3' },
  { ch: 2, name: '煉獄長廊', len: 60, hm: 8.2, boss: 'elite3' },
  { ch: 2, name: '萬魂塔', len: 62, hm: 8.69, boss: 'elite3' },
  { ch: 2, name: '鬼火殿', len: 64, hm: 9.2, boss: 'elite3' },
  { ch: 2, name: '天魔台', len: 69, hm: 9.78, boss: 'elite3' },
  { ch: 2, name: '魔教總壇', len: 74, hm: 10.4, boss: 'chief3' },
  { ch: 3, name: '雪原', len: 50, hm: 10.4, boss: 'elite4' },
  { ch: 3, name: '雪嶺', len: 54, hm: 10.0, boss: 'elite4' },
  { ch: 3, name: '冰瀑', len: 56, hm: 10.3, boss: 'elite4' },
  { ch: 3, name: '冰河', len: 58, hm: 10.6, boss: 'elite4' },
  { ch: 3, name: '雪狼谷', len: 60, hm: 11.09, boss: 'elite4' },
  { ch: 3, name: '風雪棧道', len: 62, hm: 11.6, boss: 'elite4' },
  { ch: 3, name: '寒潭', len: 64, hm: 12.19, boss: 'elite4' },
  { ch: 3, name: '天山劍閣', len: 66, hm: 12.8, boss: 'elite4' },
  { ch: 3, name: '冰晶迴廊', len: 71, hm: 13.58, boss: 'elite4' },
  { ch: 3, name: '冰魄宮', len: 76, hm: 14.4, boss: 'chief4' },
  { ch: 4, name: '密林古道', len: 52, hm: 15.87, boss: 'elite5' },
  { ch: 4, name: '瘴氣林', len: 56, hm: 17.5, boss: 'elite5' },
  { ch: 4, name: '蛇沼', len: 58, hm: 18.71, boss: 'elite5' },
  { ch: 4, name: '蠱蟲谷', len: 60, hm: 20.0, boss: 'elite5' },
  { ch: 4, name: '苗寨', len: 62, hm: 21.45, boss: 'elite5' },
  { ch: 4, name: '苗寨吊橋', len: 64, hm: 23.0, boss: 'elite5' },
  { ch: 4, name: '祭壇', len: 66, hm: 24.45, boss: 'elite5' },
  { ch: 4, name: '五毒潭', len: 68, hm: 26.0, boss: 'elite5' },
  { ch: 4, name: '毒霧峽', len: 73, hm: 27.69, boss: 'elite5' },
  { ch: 4, name: '萬蠱窟', len: 78, hm: 29.5, boss: 'chief5' },
  { ch: 5, name: '京城大街', len: 54, hm: 29.75, boss: 'elite6' },
  { ch: 5, name: '午門', len: 58, hm: 30.0, boss: 'elite6' },
  { ch: 5, name: '御道', len: 60, hm: 31.22, boss: 'elite6' },
  { ch: 5, name: '金水橋', len: 62, hm: 32.5, boss: 'elite6' },
  { ch: 5, name: '御花園', len: 64, hm: 33.73, boss: 'elite6' },
  { ch: 5, name: '東廠詔獄', len: 66, hm: 35.0, boss: 'elite6' },
  { ch: 5, name: '乾清宮', len: 68, hm: 36.23, boss: 'elite6' },
  { ch: 5, name: '太和殿前', len: 70, hm: 37.5, boss: 'elite6' },
  { ch: 5, name: '角樓', len: 76, hm: 39.21, boss: 'elite6' },
  { ch: 5, name: '紫禁之巔', len: 82, hm: 41.0, boss: 'chief6' },
  { ch: 6, name: '漁村', len: 60, hm: 44.3, boss: 'elite7' },
  { ch: 6, name: '海港', len: 62, hm: 46.3, boss: 'elite7' },
  { ch: 6, name: '礁石灘', len: 65, hm: 48.3, boss: 'elite7' },
  { ch: 6, name: '海寇船', len: 67, hm: 50.5, boss: 'elite7' },
  { ch: 6, name: '珊瑚洞', len: 70, hm: 52.7, boss: 'elite7' },
  { ch: 6, name: '漩渦海峽', len: 72, hm: 55.1, boss: 'elite7' },
  { ch: 6, name: '蓬萊碼頭', len: 74, hm: 57.5, boss: 'elite7' },
  { ch: 6, name: '仙島密林', len: 77, hm: 60.1, boss: 'elite7' },
  { ch: 6, name: '龍宮遺跡', len: 79, hm: 62.8, boss: 'elite7' },
  { ch: 6, name: '東海龍宮', len: 82, hm: 65.6, boss: 'chief7' },
  { ch: 7, name: '玉門關', len: 62, hm: 70.8, boss: 'elite8' },
  { ch: 7, name: '黃沙古道', len: 64, hm: 74.0, boss: 'elite8' },
  { ch: 7, name: '綠洲', len: 67, hm: 77.3, boss: 'elite8' },
  { ch: 7, name: '沙丘', len: 69, hm: 80.8, boss: 'elite8' },
  { ch: 7, name: '駝隊殘營', len: 72, hm: 84.4, boss: 'elite8' },
  { ch: 7, name: '枯木林', len: 74, hm: 88.1, boss: 'elite8' },
  { ch: 7, name: '樓蘭古城', len: 76, hm: 92.1, boss: 'elite8' },
  { ch: 7, name: '沙暴谷', len: 79, hm: 96.2, boss: 'elite8' },
  { ch: 7, name: '黑沙城', len: 81, hm: 100.5, boss: 'elite8' },
  { ch: 7, name: '大漠狼城', len: 84, hm: 105.0, boss: 'chief8' },
  { ch: 8, name: '荒山', len: 64, hm: 113.4, boss: 'elite9' },
  { ch: 8, name: '幽谷', len: 66, hm: 118.4, boss: 'elite9' },
  { ch: 8, name: '墓道入口', len: 69, hm: 123.7, boss: 'elite9' },
  { ch: 8, name: '石像長廊', len: 71, hm: 129.2, boss: 'elite9' },
  { ch: 8, name: '玉蜂林', len: 74, hm: 135.0, boss: 'elite9' },
  { ch: 8, name: '機關密室', len: 76, hm: 141.0, boss: 'elite9' },
  { ch: 8, name: '冰棺室', len: 78, hm: 147.3, boss: 'elite9' },
  { ch: 8, name: '寒玉床', len: 81, hm: 153.9, boss: 'elite9' },
  { ch: 8, name: '斷龍石', len: 83, hm: 160.8, boss: 'elite9' },
  { ch: 8, name: '古墓主殿', len: 86, hm: 167.9, boss: 'chief9' },
  { ch: 9, name: '崑崙山腳', len: 66, hm: 181.4, boss: 'elite10' },
  { ch: 9, name: '雲梯', len: 68, hm: 189.5, boss: 'elite10' },
  { ch: 9, name: '雲海', len: 71, hm: 197.9, boss: 'elite10' },
  { ch: 9, name: '仙鶴台', len: 73, hm: 206.8, boss: 'elite10' },
  { ch: 9, name: '瑤池', len: 76, hm: 216.0, boss: 'elite10' },
  { ch: 9, name: '玉虛峰', len: 78, hm: 225.6, boss: 'elite10' },
  { ch: 9, name: '天柱', len: 80, hm: 235.7, boss: 'elite10' },
  { ch: 9, name: '雷池', len: 83, hm: 246.2, boss: 'elite10' },
  { ch: 9, name: '南天門外', len: 85, hm: 257.2, boss: 'elite10' },
  { ch: 9, name: '崑崙之巔', len: 88, hm: 268.7, boss: 'chief10' },
  { ch: 10, name: '鬼門關', len: 68, hm: 290.2, boss: 'elite11' },
  { ch: 10, name: '黃泉路', len: 70, hm: 303.1, boss: 'elite11' },
  { ch: 10, name: '忘川河', len: 73, hm: 316.7, boss: 'elite11' },
  { ch: 10, name: '奈何橋', len: 75, hm: 330.8, boss: 'elite11' },
  { ch: 10, name: '望鄉台', len: 78, hm: 345.6, boss: 'elite11' },
  { ch: 10, name: '枉死城', len: 80, hm: 361.0, boss: 'elite11' },
  { ch: 10, name: '刀山', len: 82, hm: 377.1, boss: 'elite11' },
  { ch: 10, name: '火海', len: 85, hm: 394.0, boss: 'elite11' },
  { ch: 10, name: '閻羅殿前', len: 87, hm: 411.5, boss: 'elite11' },
  { ch: 10, name: '森羅寶殿', len: 90, hm: 429.9, boss: 'chief11' },
  { ch: 11, name: '華山腳下', len: 70, hm: 464.3, boss: 'elite12' },
  { ch: 11, name: '千尺幢', len: 72, hm: 485.0, boss: 'elite12' },
  { ch: 11, name: '百尺峽', len: 75, hm: 506.7, boss: 'elite12' },
  { ch: 11, name: '老君犁溝', len: 77, hm: 529.3, boss: 'elite12' },
  { ch: 11, name: '蒼龍嶺', len: 80, hm: 552.9, boss: 'elite12' },
  { ch: 11, name: '金鎖關', len: 82, hm: 577.6, boss: 'elite12' },
  { ch: 11, name: '長空棧道', len: 84, hm: 603.4, boss: 'elite12' },
  { ch: 11, name: '落雁峰', len: 87, hm: 630.3, boss: 'elite12' },
  { ch: 11, name: '思過崖', len: 89, hm: 658.5, boss: 'elite12' },
  { ch: 11, name: '華山之巔', len: 90, hm: 687.9, boss: 'chief12' },
];
const stageLabel = i => `${STAGES[i].ch + 1}-${i % 10 + 1}`;
const NST = STAGES.length, CHN = CHAPTERS.length;
const stEq = i => i / 2;
const SUBN = 10;   // 每關 10 個小關，第 10 個是首領
const subLabel = (i, k) => `${stageLabel(i)}・${k === SUBN - 1 ? '首領' : '第 ' + (k + 1) + ' 小關'}`;
function subStage(i, k) {   // 小關設定：越後面越長、越強；第 10 小關＝原本這一關的強度
  const st = STAGES[i], f = (k + 1) / SUBN, boss = k === SUBN - 1, len = boss ? 44 : 34 + k;   // 首領小關：路程 44 秒＋首領戰(實測約 50 秒)
  return { st: Object.assign({}, st, { len, hm: st.hm * (0.8 + 0.2 * f) * (boss ? 1.5 : 1), noBoss: !boss }), tOff: 0 };   // 首領小關強度 ×1.5、不加時間位移：實測門檻與原本整關一致(ladder_v3)
}
function subCur(hard) { return (hard ? save.hard.sub : save.sub) || 0; }
function subOpen(i, k, hard) {   // 這個小關能不能打：之前的關卡全開，目前這一關只開到下一個小關
  if (hard) return hardOpen(i) && (i < save.hard.cleared || k <= subCur(true));
  return i < save.cleared || (i === save.cleared && k <= subCur(false));
}   // 換算成舊版(每章 5 關)的進度，用來算難度相關數字
const CH_FB = CHAP.map((c, i) => c.fb == null ? i : c.fb);   // 素材未到時借用哪一章(由章節總表派生)
// ---------- 關卡挑戰：每關一個固定目標，第一次完成送元寶 ----------
const CHAL_T = ['units', 'nominus', 'kills', 'combo', 'boss', 'barrel'];
function chalOf(i) {
  const st = STAGES[i], ch = st.ch, j = i % 10, t = CHAL_T[(j + ch) % CHAL_T.length], g = j === 9 ? 30 : 20;
  if (t === 'units')   { const n = CHAL_N.units(i);  return { t, n, g, txt: `通關時分身 ≥ ${n}` }; }
  if (t === 'nominus') return { t, n: 0, g, txt: '全程不碰紅色減益門' };
  if (t === 'kills')   { const n = CHAL_N.kills(i);  return { t, n, g, txt: `擊敗 ${n} 個敵人` }; }
  if (t === 'combo')   { const n = CHAL_N.combo(i);  return { t, n, g, txt: `打出 ${n} 連擊` }; }
  if (t === 'boss')    { const n = CHAL_N.boss(i);   return { t, n, g, txt: `首領出現後 ${n} 秒內擊敗` }; }
  const n = CHAL_N.barrel(i); return { t, n, g, txt: `打破 ${n} 個酒罈` };
}
const CHAL_N = {   // 數字由模擬校正：認真打大約一半機會做到
  units: i => Math.min(180, 70 + STAGES[i].ch * 22),
  kills: i => Math.round((160 + 36 * stEq(i)) / 20) * 10,   // 首領小關約原本一半長度
  combo: i => Math.round((120 + 28 * stEq(i)) / 20) * 10,
  boss: i => 7,
  barrel: i => Math.max(1, Math.floor(STAGES[i].len / 20)),
};
function chalProg(c) {   // 目前進度：{ cur, ok, live }(live＝還在進行、未定)
  switch (c.t) {
    case 'units': return { cur: S.units, ok: S.units >= c.n };
    case 'nominus': return { cur: S.badG ? 1 : 0, ok: !S.badG };
    case 'kills': return { cur: S.kills, ok: S.kills >= c.n };
    case 'combo': return { cur: S.maxCombo, ok: S.maxCombo >= c.n };
    case 'boss': return { cur: S.bossKillT !== null ? Math.ceil(S.bossKillT) : S.boss ? Math.ceil(S.t - S.bossT0) : 0, ok: S.bossKillT !== null && S.bossKillT <= c.n };
    default: return { cur: S.brk, ok: S.brk >= c.n };
  }
}
const chalOn = () => S.mode === 'play' && !S.hard && !S.ov && !S.endless && S.sub === SUBN - 1 && !save.chal[S.stage];
const chalCount = () => save.chal.filter(Boolean).length;
// 新手引導：通關幾關後才開放的功能(數字＝需要通關的關卡數)
const FEAT = { pawn: 20, upgrade: 1, bag: 3, daily: 3, idle: 3, achv: 3, gacha: 5, shop: 5, mail: 5, starup: 7, skins: 7, pass: 9, event: 9, endless: 10 };
const FNAME = { upgrade: '修練', bag: '行囊', daily: '每日', idle: '掛機收益', achv: '成就', gacha: '召喚閣', shop: '商城', mail: '信箱', starup: '升星', skins: '時裝', pass: '俠客令', event: '每日活動', endless: '無盡試煉', pawn: '聚寶當鋪' };
const featOpen = k => FEAT[k] === undefined || save.cleared >= FEAT[k];
const featNeed = k => stageLabel(FEAT[k] - 1);
const HARD_MS = [1.72, 1.55, 1.46, 1.39, 1.35, 1.31, 1.31, 1.34, 1.37, 1.4, 1.45, 1.5], HARD_FT = 15;   // 困難模式：各章敵人與首領血量倍率(後面章節本身就很強，倍率較低)、敵人組成提前
const hardM = () => HARD_MS[STAGES[S.stage].ch];
const hardOpen = i => save.cleared >= (STAGES[i].ch + 1) * 10 && save.hard.cleared >= i;   // 普通通關整章後，困難依序開放
const BOSSES = {
  elite: { name: '山賊頭目',   ch: '頭', r: 54, hp: 13000,  col: '#8a4a1f', charge: false, fanN: 5, fanT: 2.4, sum: 3, sumT: 6, sumType: 'bandit', coin: 40, spr: 'boss_elite', sh: 150, bx: 0.6 },
  chief: { name: '黑風寨寨主', ch: '寨', r: 70, hp: 30000, col: '#7a1f1f', charge: true,  fanN: 7, fanT: 2.2, sum: 4, sumT: 5, sumType: 'bandit', coin: 80, spr: 'boss_chief', sh: 190, bx: 0.64 },
  elite2: { name: '青竹幫堂主', ch: '堂', r: 54, hp: 13000, col: '#2f6a3a', charge: false, fanN: 3, fanT: 1.5, sum: 4, sumT: 5.5, sumType: 'gang', coin: 60, spr: 'boss_elite2', sh: 150, bx: 0.62 },
  chief2: { name: '竹林劍魔',   ch: '魔', r: 70, hp: 30000, col: '#1f3a2a', charge: true, wall: 6.5, fanN: 5, fanT: 2.4, sum: 5, sumT: 6, sumType: 'bee', coin: 120, spr: 'boss_chief2', sh: 190, bx: 0.38 },
  elite3: { name: '血手護法',   ch: '護', r: 56, hp: 13000, col: '#6a1a2a', charge: false, rain: 4.5, fanN: 7, fanT: 2.0, sum: 3, sumT: 6, sumType: 'cultist', coin: 90, spr: 'boss_elite3', sh: 160, bx: 0.5 },
  elite4: { name: '天山劍姬',   ch: '姬', r: 54, hp: 13000, col: '#4a8ab8', charge: false, icewall: 5.5, fanN: 5, fanT: 1.8, sum: 4, sumT: 6, sumType: 'wolf', coin: 110, spr: 'boss_elite4', sh: 160, bx: 0.5 },
  chief4: { name: '冰魄老祖',   ch: '祖', r: 74, hp: 30000, col: '#2a5a8a', charge: true, icewall: 6, rain: 5.5, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'shard', coin: 220, spr: 'boss_chief4', sh: 200, bx: 0.5 },
  elite5: { name: '五毒聖女',   ch: '毒', r: 54, hp: 13000, col: '#5a8a2a', charge: false, pool: 5.2, fanN: 5, fanT: 1.9, sum: 4, sumT: 6, sumType: 'spider', coin: 130, spr: 'boss_elite5', sh: 160, bx: 0.5 },
  chief5: { name: '萬蠱王',     ch: '蠱', r: 74, hp: 30000, col: '#2a4a1a', charge: true, wall: 7, pool: 6, fanN: 7, fanT: 2.2, sum: 4, sumT: 6, sumType: 'miao', coin: 260, spr: 'boss_chief5', sh: 200, bx: 0.5 },
  elite6: { name: '東廠督主',   ch: '督', r: 54, hp: 13000, col: '#6a1a3a', charge: true, aim: 4.6, aimN: 3, fanN: 5, fanT: 1.7, sum: 3, sumT: 6, sumType: 'spy', coin: 150, spr: 'boss_elite6', sh: 160, bx: 0.5 },
  chief6: { name: '天機國師',   ch: '國', r: 76, hp: 30000, col: '#3a2a6a', charge: true, wall: 7.5, rain: 6, aim: 5.5, aimN: 5, fanN: 7, fanT: 2.2, sum: 4, sumT: 6.5, sumType: 'guard', coin: 320, spr: 'boss_chief6', sh: 210, bx: 0.5 },
  elite7: { name: '海寇頭領',   ch: '寇', r: 56, hp: 13000, col: '#2a5a7a', charge: true, aim: 4.8, aimN: 3, fanN: 5, fanT: 1.8, sum: 4, sumT: 6, sumType: 'pirate', coin: 170, spr: 'boss_elite7', sh: 160, bx: 0.5 },
  chief7: { name: '東海蛟王',   ch: '蛟', r: 76, hp: 30000, col: '#1a4a6a', charge: true, wall: 7, rain: 5.5, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'flyfish', coin: 360, spr: 'boss_chief7', sh: 210, bx: 0.5 },
  elite8: { name: '大漠刀客',   ch: '刀', r: 56, hp: 13000, col: '#a8742a', charge: true, fanN: 7, fanT: 1.7, sum: 4, sumT: 6, sumType: 'rider', coin: 190, spr: 'boss_elite8', sh: 160, bx: 0.5 },
  chief8: { name: '沙海狼王',   ch: '狼', r: 76, hp: 30000, col: '#7a5a2a', charge: true, wall: 6.5, aim: 5, aimN: 4, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'dust', coin: 400, spr: 'boss_chief8', sh: 210, bx: 0.5 },
  elite9: { name: '守陵人',     ch: '陵', r: 56, hp: 13000, col: '#4a5a4a', charge: false, rain: 4.5, pool: 5, fanN: 5, fanT: 1.8, sum: 4, sumT: 6, sumType: 'jiangshi', coin: 210, spr: 'boss_elite9', sh: 160, bx: 0.5 },
  chief9: { name: '古墓屍王',   ch: '屍', r: 76, hp: 30000, col: '#2a3a2a', charge: true, wall: 7, rain: 5, pool: 6, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'jiangshi', coin: 440, spr: 'boss_chief9', sh: 210, bx: 0.5 },
  elite10: { name: '崑崙劍仙',  ch: '仙', r: 56, hp: 13000, col: '#7ab8e8', charge: false, icewall: 5.5, aim: 4.5, aimN: 3, fanN: 5, fanT: 1.8, sum: 4, sumT: 6, sumType: 'kldisc', coin: 230, spr: 'boss_elite10', sh: 160, bx: 0.5 },
  chief10: { name: '雷霆真君',  ch: '雷', r: 76, hp: 30000, col: '#4a6aa8', charge: true, icewall: 6, rain: 5, aim: 5.5, aimN: 5, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'crane', coin: 480, spr: 'boss_chief10', sh: 210, bx: 0.5 },
  elite11: { name: '白無常',    ch: '常', r: 56, hp: 13000, col: '#3a3a3a', charge: false, rain: 4.5, wall: 7, fanN: 5, fanT: 1.8, sum: 4, sumT: 6, sumType: 'gui', coin: 250, spr: 'boss_elite11', sh: 160, bx: 0.5 },
  chief11: { name: '閻羅王',    ch: '閻', r: 78, hp: 30000, col: '#5a0a1a', charge: true, wall: 7, rain: 5.5, pool: 6, aim: 6, aimN: 5, fanN: 7, fanT: 2.2, sum: 5, sumT: 6, sumType: 'wisp', coin: 520, spr: 'boss_chief11', sh: 215, bx: 0.5 },
  elite12: { name: '劍宗長老',  ch: '宗', r: 56, hp: 13000, col: '#5a6a8a', charge: true, aim: 4, aimN: 4, icewall: 6, fanN: 5, fanT: 1.7, sum: 4, sumT: 6, sumType: 'hsdisc', coin: 270, spr: 'boss_elite12', sh: 160, bx: 0.5 },
  chief12: { name: '獨孤劍聖',  ch: '聖', r: 78, hp: 30000, col: '#e8e0c8', charge: true, wall: 7, rain: 5.5, aim: 5, aimN: 5, icewall: 6.5, fanN: 7, fanT: 2.2, sum: 5, sumT: 6.5, sumType: 'shadow', coin: 560, spr: 'boss_chief12', sh: 220, bx: 0.5 },
  chief3: { name: '魔教教主',   ch: '教', r: 72, hp: 30000, col: '#3a0a2a', charge: true, wall: 7, rain: 5, fanN: 7, fanT: 2.4, sum: 5, sumT: 6, sumType: 'ghost', coin: 180, spr: 'boss_chief3', sh: 200, bx: 0.5 },
};
const ED = {
  bandit:   { name: '山賊',     ch: '賊', r: 17, hp: 16,  spd: 60, dmg: 1, col: '#b5652b', coin: 1, sh: 62 },
  poison:   { name: '毒教弟子', ch: '毒', r: 17, hp: 36,  spd: 25, dmg: 1, col: '#8b4fc4', coin: 2, shoot: 2.6, sh: 62 },
  bronze:   { name: '銅人',     ch: '銅', r: 30, hp: 240, spd: 12, dmg: 6, col: '#c8962e', coin: 6, sh: 101 },
  assassin: { name: '飛天刺客', ch: '刺', r: 15, hp: 24,  spd: 95, dmg: 2, col: '#33334a', coin: 2, zig: 150, sh: 57 },
  gang:     { name: '青竹幫眾', ch: '幫', r: 17, hp: 18,  spd: 70, dmg: 1, col: '#3f7a3a', coin: 1, sh: 65, bx: 0.56 },
  blow:     { name: '吹箭手',   ch: '吹', r: 16, hp: 30,  spd: 30, dmg: 1, col: '#6b8f2a', coin: 2, shoot: 1.8, straight: true, sh: 65, bx: 0.6 },
  shield:   { name: '盾兵',     ch: '盾', r: 28, hp: 200, spd: 14, dmg: 5, col: '#7a6a50', coin: 6, armor: 0.5, sh: 99, bx: 0.4 },
  bee:      { name: '毒蜂',     ch: '蜂', r: 12, hp: 10,  spd: 105, dmg: 1, col: '#d8b02a', coin: 1, wave: true, sh: 52 },
  cultist:  { name: '魔教教徒', ch: '教', r: 17, hp: 20,  spd: 80, dmg: 1, col: '#7a2a3a', coin: 1, sh: 68, bx: 0.58 },
  mage:     { name: '血咒術士', ch: '咒', r: 17, hp: 34,  spd: 28, dmg: 1, col: '#9a2a5a', coin: 2, shoot: 2.4, tri: true, sh: 70 },
  golem:    { name: '屍傀',     ch: '屍', r: 29, hp: 230, spd: 13, dmg: 6, col: '#5a6a5a', coin: 6, armor: 0.3, split: 'imp', sh: 107, bx: 0.42 },
  imp:      { name: '小屍傀',   ch: '小', r: 13, hp: 30,  spd: 75, dmg: 1, col: '#6a7a6a', coin: 1, sh: 49 },
  wolf:     { name: '雪狼',     ch: '狼', r: 16, hp: 18,  spd: 115, dmg: 1, col: '#c8d4e0', coin: 1, sh: 60, bx: 0.54 },
  icebow:   { name: '冰弓手',   ch: '冰', r: 17, hp: 34,  spd: 26, dmg: 1, col: '#5aa8d8', coin: 2, shoot: 2.2, freeze: true, sh: 70, bx: 0.44 },
  yeti:     { name: '雪人巨漢', ch: '雪', r: 31, hp: 260, spd: 12, dmg: 6, col: '#e8f0f8', coin: 6, armor: 0.35, sh: 109 },
  shard:    { name: '冰魄',     ch: '晶', r: 14, hp: 18,  spd: 90, dmg: 1, col: '#9fe8ff', coin: 1, wave: true, burst: true, sh: 52 },
  miao:     { name: '苗疆刀手', ch: '苗', r: 17, hp: 20,  spd: 85, dmg: 1, col: '#4a7a2a', coin: 1, sh: 68, bx: 0.44 },
  gushi:    { name: '蠱師',     ch: '蠱', r: 17, hp: 36,  spd: 26, dmg: 1, col: '#7aba3a', coin: 2, shoot: 2.6, pool: true, sh: 70, bx: 0.44 },
  python:   { name: '碧鱗巨蟒', ch: '蟒', r: 31, hp: 270, spd: 12, dmg: 6, col: '#2f6a3a', coin: 6, armor: 0.25, regen: 0.05, sh: 109 },
  spider:   { name: '五毒蛛',   ch: '蛛', r: 14, hp: 18,  spd: 70, dmg: 1, col: '#3a2a4a', coin: 1, dash: true, sh: 52 },
  guard:    { name: '錦衣衛',   ch: '衛', r: 17, hp: 22,  spd: 90, dmg: 1, col: '#a83a2a', coin: 1, sh: 70, bx: 0.56 },
  gunner:   { name: '神機火銃手', ch: '銃', r: 17, hp: 38, spd: 24, dmg: 2, col: '#5a4a3a', coin: 2, shoot: 2.8, aim: true, sh: 70, bx: 0.38 },
  iron:     { name: '鐵甲禁軍', ch: '甲', r: 32, hp: 300, spd: 11, dmg: 7, col: '#6a6a7a', coin: 7, armor: 0.45, sh: 112, bx: 0.55 },
  spy:      { name: '東廠番子', ch: '番', r: 15, hp: 22,  spd: 85, dmg: 1, col: '#3a3a5a', coin: 1, blink: true, sh: 60, bx: 0.6 },
  pirate:   { name: '海寇',     ch: '寇', r: 17, hp: 24,  spd: 88, dmg: 1, col: '#2a5a7a', coin: 1, sh: 68, bx: 0.5 },
  harpoon:  { name: '魚叉手',   ch: '叉', r: 17, hp: 40,  spd: 26, dmg: 2, col: '#3a6a8a', coin: 2, shoot: 2.6, aim: true, sh: 70, bx: 0.45 },
  crab:     { name: '鐵甲巨蟹', ch: '蟹', r: 32, hp: 320, spd: 11, dmg: 7, col: '#c84a2a', coin: 7, armor: 0.45, sh: 100, bx: 0.5 },
  flyfish:  { name: '飛魚',     ch: '魚', r: 13, hp: 20,  spd: 110, dmg: 1, col: '#7ac8e8', coin: 1, wave: true, sh: 50 },
  rider:    { name: '馬賊',     ch: '賊', r: 17, hp: 26,  spd: 100, dmg: 1, col: '#a8742a', coin: 1, sh: 70, bx: 0.5 },
  xbow:     { name: '連弩手',   ch: '弩', r: 17, hp: 42,  spd: 24, dmg: 2, col: '#8a6a3a', coin: 2, shoot: 2.6, tri: true, sh: 70, bx: 0.45 },
  scorp:    { name: '巨沙蠍',   ch: '蠍', r: 31, hp: 300, spd: 12, dmg: 7, col: '#b8862a', coin: 7, armor: 0.3, split: 'scorpling', sh: 100, bx: 0.5 },
  scorpling:{ name: '小沙蠍',   ch: '小', r: 13, hp: 34,  spd: 80, dmg: 1, col: '#c89a3a', coin: 1, mini: true, sh: 46 },
  dust:     { name: '沙暴',     ch: '沙', r: 14, hp: 22,  spd: 95, dmg: 1, col: '#d8b87a', coin: 1, wave: true, burst: true, sh: 54 },
  jiangshi: { name: '殭屍',     ch: '殭', r: 17, hp: 30,  spd: 62, dmg: 1, col: '#5a7a6a', coin: 1, sh: 70, bx: 0.5 },
  beemaid:  { name: '玉蜂女',   ch: '玉', r: 17, hp: 42,  spd: 26, dmg: 2, col: '#e8d87a', coin: 2, shoot: 2.6, pool: true, sh: 70, bx: 0.45 },
  statue:   { name: '石像武士', ch: '石', r: 32, hp: 340, spd: 10, dmg: 7, col: '#8a8a7a', coin: 7, armor: 0.5, sh: 108, bx: 0.5 },
  jadebee:  { name: '玉蜂',     ch: '蜂', r: 12, hp: 18,  spd: 108, dmg: 1, col: '#f0e8a0', coin: 1, wave: true, dash: true, sh: 50 },
  kldisc:   { name: '崑崙弟子', ch: '崑', r: 17, hp: 28,  spd: 96, dmg: 1, col: '#7ab8e8', coin: 1, sh: 70, bx: 0.5 },
  taoist:   { name: '雷符道士', ch: '符', r: 17, hp: 44,  spd: 24, dmg: 2, col: '#e8d84a', coin: 2, shoot: 2.4, aim: true, sh: 72, bx: 0.45 },
  ape:      { name: '白猿',     ch: '猿', r: 32, hp: 340, spd: 13, dmg: 7, col: '#e8e8e0', coin: 7, armor: 0.35, regen: 0.05, sh: 108, bx: 0.5 },
  crane:    { name: '仙鶴',     ch: '鶴', r: 14, hp: 22,  spd: 105, dmg: 1, col: '#f8f8f8', coin: 1, wave: true, sh: 56 },
  gui:      { name: '小鬼',     ch: '鬼', r: 16, hp: 28,  spd: 100, dmg: 1, col: '#4a5a8a', coin: 1, sh: 64, bx: 0.5 },
  scribe:   { name: '判官筆吏', ch: '判', r: 17, hp: 46,  spd: 24, dmg: 2, col: '#5a2a3a', coin: 2, shoot: 2.6, tri: true, sh: 72, bx: 0.45 },
  oxhead:   { name: '牛頭',     ch: '牛', r: 33, hp: 360, spd: 11, dmg: 8, col: '#6a3a2a', coin: 8, armor: 0.45, sh: 112, bx: 0.5 },
  wisp:     { name: '冥火',     ch: '冥', r: 14, hp: 20,  spd: 102, dmg: 1, col: '#7a8aff', coin: 1, wave: true, phase: true, sh: 56 },
  hsdisc:   { name: '華山弟子', ch: '華', r: 17, hp: 30,  spd: 102, dmg: 1, col: '#5a6a8a', coin: 1, sh: 70, bx: 0.5 },
  hidden:   { name: '暗器高手', ch: '暗', r: 17, hp: 46,  spd: 26, dmg: 2, col: '#3a3a4a', coin: 2, shoot: 2.4, aim: true, sh: 70, bx: 0.45 },
  elder:    { name: '鐵掌長老', ch: '掌', r: 33, hp: 380, spd: 11, dmg: 8, col: '#8a6a4a', coin: 8, armor: 0.5, sh: 112, bx: 0.5 },
  shadow:   { name: '影刺客',   ch: '影', r: 15, hp: 26,  spd: 92, dmg: 1, col: '#2a2a3a', coin: 1, blink: true, sh: 62, bx: 0.55 },
  ghost:    { name: '鬼火',     ch: '鬼', r: 14, hp: 16,  spd: 100, dmg: 1, col: '#3fd8a0', coin: 1, wave: true, phase: true, sh: 57 },
};
// 每章的敵人組成：一般、遠程、坦克、特殊
const ROSTER = CHAP.map(c => c.roster);   // 各章小怪(由章節總表派生)
// 新章節美術還沒到時先借用舊圖(有正式圖就自動換上)
const ART_FB = { pirate: 'bandit', harpoon: 'gunner', crab: 'shield', flyfish: 'bee', rider: 'guard', xbow: 'blow', scorp: 'python', scorpling: 'spider', dust: 'shard',
  jiangshi: 'cultist', beemaid: 'gushi', statue: 'golem', jadebee: 'bee', kldisc: 'gang', taoist: 'icebow', ape: 'yeti', crane: 'shard', gui: 'cultist', scribe: 'mage', oxhead: 'iron', wisp: 'ghost',
  hsdisc: 'guard', hidden: 'gunner', elder: 'iron', shadow: 'spy',
  boss_elite7: 'boss_elite', boss_chief7: 'boss_chief2', boss_elite8: 'boss_elite6', boss_chief8: 'boss_chief', boss_elite9: 'boss_elite3', boss_chief9: 'boss_chief3',
  boss_elite10: 'boss_elite4', boss_chief10: 'boss_chief4', boss_elite11: 'boss_elite3', boss_chief11: 'boss_chief3', boss_elite12: 'boss_elite4', boss_chief12: 'boss_chief6',
  bg_ch7: 'bg_ch2', bg_ch8: 'bg_ch1', bg_ch9: 'bg_ch3', bg_ch10: 'bg_ch4', bg_ch11: 'bg_ch3', bg_ch12: 'bg_ch6' };
const artKey = k => { if (!k || ART[k] || !ART_FB) return k; if (ART_FB[k]) return ART_FB[k]; const m = /^ba_(\w+?)_(\d)$/.exec(k); return m && ART_FB['boss_' + m[1]] ? 'ba_' + ART_FB['boss_' + m[1]].slice(5) + '_' + m[2] : k; };
const CLASSES = [
  { id: 'sword',  name: '劍客',     desc: '直線劍氣，攻守平衡',   pv: [3, 4, 4], fbx: 0.4, spr: 'hero_sword', atk: 10, rate: 3.0, unlock: 0, col: '#2f6fcf', shot: '#3fb8ff' },
  { id: 'blade',  name: '刀客',     desc: '月牙刀氣，一刀砍穿整排', pv: [5, 3, 2], fbx: 0.62, spr: 'hero_blade', atk: 15, rate: 2.2, unlock: 6, col: '#c0602a', shot: '#ff9a2e' },
  { id: 'bow',    name: '弓手',     desc: '長箭穿透敵人，距離越遠傷害越高',   pv: [4, 2, 5], fbx: 0.5, spr: 'hero_bow', atk: 26, rate: 1.7, unlock: 10, col: '#3f8f3a', shot: '#f4f0d0' },
  { id: 'dart',   name: '暗器師',   desc: '追蹤飛鏢，自動鎖定敵人', pv: [2, 5, 4], fbx: 0.43, bbx: 0.6, spr: 'hero_dart', atk: 3.6, rate: 4.5, unlock: 16, col: '#4a4a5a', shot: '#c8d4e8' },
  { id: 'healer', name: '醫仙',     desc: '銀針攻擊，分身會恢復、受傷減少', pv: [2, 3, 3], fbx: 0.5, spr: 'hero_healer', atk: 8, rate: 3.2, unlock: 20, col: '#2f9a7a', shot: '#8fffd0' },
  { id: 'demon',  name: '魔教傳人', desc: '黑炎爆裂，範圍傷害最高', pv: [5, 2, 3], fbx: 0.42, bbx: 0.45, spr: 'hero_demon', atk: 40, rate: 1.85, paid: true, col: '#5a1a4a', shot: '#c04aff' },
];
const clsById = id => CLASSES.find(c => c.id === id) || CLASSES[0];
// 職業升星：用該職業的碎片＋銅錢
const STAR_MAX = 5, STAR_FRAG = [10, 20, 40, 80, 150], STAR_COIN = [1000, 3000, 8000, 20000, 50000];
const starOf = id => (save.star && save.star[id]) || 0;
const fragOf = id => (save.frag && save.frag[id]) || 0;
function addFrag(id, n) { save.frag[id] = fragOf(id) + n; }
const starReady = id => starOf(id) < STAR_MAX && fragOf(id) >= STAR_FRAG[starOf(id)] && save.coins >= STAR_COIN[starOf(id)];
// 時裝：只改外觀與攻擊顏色，不影響強度
const SKINS = [
  { id: 'sword_white', cls: 'sword', name: '白衣劍俠', spr: 'skin_sword_white', bbx: 0.4, fbx: 0.64, shot: '#e8f4ff', price: 680, desc: '白衣如雪，劍氣化為銀白色' },
  { id: 'blade_gold',  cls: 'blade', name: '金甲刀皇', spr: 'skin_blade_gold', bbx: 0.4, fbx: 0.38, shot: '#ffd23a', price: 680, desc: '黑金戰袍配紅披風，刀氣化為金色' },
  { id: 'bow_sakura',  cls: 'bow',   name: '櫻花弓姬', spr: 'skin_bow_sakura', bbx: 0.53, fbx: 0.44, shot: '#ffb6d8', price: 680, desc: '白粉衣裳與玉弓，長箭帶著櫻花色' },
  { id: 'dart_crimson', cls: 'dart', name: '赤面鬼影', spr: 'skin_dart_crimson', bbx: 0.48, fbx: 0.53, shot: '#ff6a5a', price: 680, desc: '金色面具與赤紅夜行衣，飛鏢化為紅色' },
  { id: 'healer_lotus', cls: 'healer', name: '紫蓮仙子', spr: 'skin_healer_lotus', bbx: 0.5, fbx: 0.48, shot: '#d8a8ff', price: 680, desc: '紫白仙裙與蓮花髮飾，銀針帶紫光' },
  { id: 'demon_blood', cls: 'demon', name: '血月魔尊', spr: 'skin_demon_blood', bbx: 0.5, fbx: 0.48, shot: '#ff3a3a', price: 880, desc: '血月紅袍與魔角，黑炎化為血焰' },
];
const skinReady = k => !!(window.JH_ART && window.JH_ART[k.spr]) || !!spr(k.spr);   // 美術還沒到的時裝先顯示「準備中」
function clsView(id) {   // 套用時裝後的職業資料
  const c = clsById(id), sk = SKINS.find(k => k.id === (save.skins && save.skins.eq[c.id]));
  return sk ? Object.assign({}, c, { spr: sk.spr, bbx: sk.bbx, shot: sk.shot, skin: sk.id, fbx: sk.fbx || 0.5 }) : c;
}
const isUnlocked = c => c.atk !== undefined && (c.paid ? !!(save.owned && save.owned[c.id]) : save.cleared >= c.unlock);
const UPS = [
  { k: 'atk',  name: '內力', desc: '攻擊力 +12%',   max: 20 },
  { k: 'hp',   name: '體魄', desc: '開局分身 +1',   max: 10 },
  { k: 'rate', name: '身法', desc: '出招速度 +5%',  max: 20 },
];
const upCost = k => Math.round(100 * Math.pow(save.up[k] + 1, 2) / 10) * 10;   // 1009-I 平衡：後期修練更貴，避免幾天就練滿

// ---------- 裝備(兵器／護甲／心法) ----------
const RAR = ['凡品', '良品', '精品', '極品', '傳說', '神話'];
const RCOL = ['#c8c8c8', '#5fd35f', '#4aa8ff', '#c46bff', '#ffc23a', '#ff4d4d'];
const RATES = [45, 30, 17, 6.5, 1.5];         // 藏經閣機率(%)
const PITY = 50;                               // 保底次數
const GMAX = 100;                              // 裝備最高等級(每 10 級要突破一次)
const XT_DUP = [1, 1, 2, 5, 15, 0];               // 神話重複不換玄鐵，改成神話精魄               // 重複裝備換成的玄鐵(依品級)
const XT_BR = [18, 24, 36, 60, 90, 200];             // 突破所需玄鐵(× 第幾次突破)：玄鐵是後期主要瓶頸
const GSLOT = [
  { k: 'wpn', hi: 0.06, name: '兵器', ch: '劍', desc: '內力', unit: '%', names: ['生鐵劍', '精鋼劍', '青鋒劍', '赤霄劍', '玄天神劍', '軒轅劍'], base: [5, 10, 18, 30, 50, 75] },
  { k: 'arm', hi: 0.02, name: '護甲', ch: '甲', desc: '開局分身', unit: '', names: ['粗布衣', '牛皮甲', '鎖子甲', '金絲軟甲', '玄武寶甲', '天蠶寶衣'], base: [1, 2, 3, 5, 8, 12] },
  { k: 'art', hi: 0.03, name: '心法', ch: '經', desc: '身法', unit: '%', names: ['吐納訣', '輕身訣', '凌風心法', '九轉心經', '太虛真經', '易筋洗髓經'], base: [3, 6, 10, 16, 25, 38] },
  { k: 'hlm', hi: 0.02, name: '頭冠', ch: '冠', desc: '暴擊率', unit: '%', names: ['布頭巾', '皮護額', '銀絲冠', '紫金冠', '鳳翅金冠', '九天龍冠'], base: [1, 2, 3, 5, 8, 12] },
  { k: 'jad', hi: 0.06, name: '玉佩', ch: '玉', desc: '武學傷害', unit: '%', names: ['青玉佩', '白玉佩', '碧血玉', '龍紋玉璧', '和氏璧', '崑崙神玉'], base: [4, 8, 14, 22, 35, 53] },
  { k: 'bot', hi: 0.06, name: '靴子', ch: '靴', desc: '首領傷害', unit: '%', names: ['草鞋', '布靴', '踏雲靴', '追風靴', '凌霄戰靴', '踏天神履'], base: [5, 10, 18, 30, 50, 75] },
];
const gkey = (slot, r) => slot + r;
const gslot = key => GSLOT.find(g => key.startsWith(g.k));
const grar = key => +key.slice(3);
const gname = key => gslot(key).names[grar(key)];
const MYTH = { rate: 0.2, pity: 200, unlock: 120, starMax: 5, starB: 0.1, starCu: 300000 };   // 神話：每抽 0.2%、獨立保底 200 抽、主線全通後開放；升星每星 +10%
const mythOpen = () => save.cleared >= MYTH.unlock;
const mstarCost = k => MYTH.starCu * ((save.mstar[k] || 0) + 1);
const TEMPER = { max: 20, per: 0.03 };   // 神兵淬鍊：裝備 Lv100 後用玄鐵淬鍊，每階該部位 +3%(以部位計，換裝也保留)
const tmpLv = k => (save.temper && save.temper[k]) || 0;
const tmpXt = k => Math.round(200 * Math.pow(tmpLv(k) + 1, 1.5) / 10) * 10;          // 下一階要的玄鐵：200 → 約 17,900
const tmpCu = k => 50000 * (tmpLv(k) + 1);                                              // 下一階要的銅錢
function gearVal(key, lv) {
  const g = gslot(key), r = grar(key), L = lv || save.gear[key] || 1, v = g.base[r] * (1 + 0.15 * Math.min(L - 1, 9) + g.hi * Math.max(0, L - 10))
    * (r === 5 ? 1 + MYTH.starB * ((save.mstar && save.mstar[g.k]) || 0) : 1) * (save.relic && save.relic[g.k] ? 1.2 : 1) * (1 + TEMPER.per * tmpLv(g.k));   // 神話星級、古物秘技(+20%)、神兵淬鍊(每階 +3%)   // 1~10 級成長快，之後每級穩定成長
  return g.k === 'arm' ? Math.floor(v) : Math.round(v);
}
function gearText(key, lv) { const g = gslot(key); return `${g.desc} +${gearVal(key, lv)}${g.unit}`; }
function eqVal(k) { const key = save.eq[k]; return key && save.gear[key] ? gearVal(key) : 0; }
const OWN_B = [0.1, 0.2, 0.4, 0.7, 1.2, 1.8];   // 持有效果：每件裝備的內力加成(%)，等級越高越多
const ownVal = key => { const L = save.gear[key] || 1; return Math.round(OWN_B[grar(key)] * (1 + 0.1 * Math.min(L - 1, 9) + 0.03 * Math.max(0, L - 10)) * 100) / 100; };
const gbr = key => (save.gbr && save.gbr[key]) || 0;                 // 已突破次數(0~9)
const gcap = key => Math.min(GMAX, 10 * (gbr(key) + 1));             // 目前等級上限
const brCost = key => XT_BR[grar(key)] * (gbr(key) + 1);              // 下一次突破要的玄鐵
const canBrk = key => save.gear[key] >= gcap(key) && gcap(key) < GMAX;
function doBrk(key) { if (!canBrk(key) || save.xt < brCost(key)) return false; save.xt -= brCost(key); save.gbr[key] = gbr(key) + 1; return true; }
const ownTotal = () => Math.round(Object.keys(save.gear).filter(k => save.gear[k]).reduce((a, k) => a + ownVal(k), 0) * 10) / 10;
const gUpCost = key => { const L = save.gear[key] || 1, r = grar(key) + 1;   // 10 級後每級加得少，費用也降一段再慢慢漲(長線目標)
  return L < 10 ? Math.round(250 * Math.pow(L, 1.5) * r / 10) * 10 : Math.round(250 * Math.pow(10, 1.5) * r / 10 * 0.4 * (1 + 0.08 * (L - 10))) * 10; };
function grant(key) {
  const own = save.gear[key] || 0, g = gslot(key);
  if (grar(key) === 5) {   // 神話：第一次拿到時繼承這個部位目前裝備的等級與突破，直接裝上；重複的變成神話精魄(升星用)
    if (own) { save.mess = (save.mess || 0) + 1; return { key, lv: own, mess: 1 }; }
    const cur = save.eq[g.k]; save.gear[key] = cur && save.gear[cur] ? save.gear[cur] : 1; save.gbr[key] = cur ? gbr(cur) : 0; save.eq[g.k] = key; save.mstar[g.k] = save.mstar[g.k] || 0;
    stat('myth'); return { key, isNew: true, lv: save.gear[key] };
  }
  if (!own) {
    save.gear[key] = 1;
    if (!save.eq[g.k] || grar(save.eq[g.k]) < grar(key)) save.eq[g.k] = key;   // 新拿到更好的自動裝上
    return { key, isNew: true, lv: 1 };
  }
  const xt = XT_DUP[grar(key)]; save.xt += xt; return { key, lv: own, xt };   // 重複的裝備換成玄鐵(突破用)
}
function rollRar() {
  save.pity = (save.pity || 0) + 1;
  if (save.pity >= PITY) { save.pity = 0; return 4; }
  let x = Math.random() * 100;
  for (let r = 4; r >= 0; r--) { x -= RATES[r]; if (x < 0) { if (r === 4) save.pity = 0; return r; } }
  return 0;
}
// ---------- 靈寵(低品級可愛小動物 → 高品級神獸) ----------
const PETS = [
  { id: 'fox',       g: 0, name: '小靈狐',   ch: '狐', col: '#ff9a4a', atk: 2,  sk: 'shot',   cd: 3,   k: 2.5,   d: '每 3 秒吐狐火打最近的敵人' },
  { id: 'magpie',    g: 0, name: '胖喜鵲',   ch: '鵲', col: '#7ab8ff', atk: 2,  sk: 'coin',   v: 8,              d: '局內銅錢 +8%' },
  { id: 'panda',     g: 0, name: '滾滾',     ch: '熊', col: '#e8e8e8', atk: 2,  sk: 'shield', cd: 20,             d: '每 20 秒幫你擋一次傷害' },
  { id: 'jiao',      g: 1, name: '小蛟龍',   ch: '蛟', col: '#7fe8c8', atk: 3,  sk: 'multi',  cd: 3,   n: 2, k: 2.5, d: '每 3 秒吐出 2 顆水珠' },
  { id: 'rabbit',    g: 1, name: '玉兔',     ch: '兔', col: '#f0e8ff', atk: 3,  sk: 'clone',  cd: 12,  n: 1,      d: '每 12 秒變出 1 個分身' },
  { id: 'pixiu',     g: 1, name: '小貔貅',   ch: '貔', col: '#ffd23a', atk: 3,  sk: 'coin',   v: 18,             d: '招財進寶：局內銅錢 +18%' },
  { id: 'firefox',   g: 2, name: '火靈狐',   ch: '焰', col: '#ff6a2a', atk: 5, sk: 'multi',  cd: 2.6, n: 3, k: 3, d: '每 2.6 秒噴出 3 團狐火' },
  { id: 'eagle',     g: 2, name: '雷鷹',     ch: '鷹', col: '#b48aff', atk: 5, sk: 'bolt',   cd: 3.5, n: 3, k: 3.5, d: '每 3.5 秒召雷劈 3 個敵人' },
  { id: 'turtle',    g: 2, name: '玄龜',     ch: '龜', col: '#4ab88a', atk: 5, sk: 'shield', cd: 10,             d: '每 10 秒幫你擋一次傷害' },
  { id: 'ninetail',  g: 3, name: '九尾狐',   ch: '尾', col: '#ff8ad8', atk: 8, sk: 'multi',  cd: 2.2, n: 4, k: 3.5, d: '每 2.2 秒射出 4 道魅火' },
  { id: 'qilin',     g: 3, name: '麒麟',     ch: '麟', col: '#7fffa0', atk: 8, sk: 'clone',  cd: 7,   n: 2,      d: '每 7 秒變出 2 個分身' },
  { id: 'zhuque',    g: 3, name: '朱雀',     ch: '雀', col: '#ff4a3a', atk: 8, sk: 'bolt',   cd: 3,   n: 5, k: 4, d: '每 3 秒降下火羽燒 5 個敵人' },
  { id: 'qinglong',  g: 4, name: '青龍',     ch: '龍', col: '#4ad8ff', atk: 13, sk: 'bolt',   cd: 2.5, n: 8, k: 5, d: '每 2.5 秒龍雷劈 8 個敵人' },
  { id: 'baihu',     g: 4, name: '白虎',     ch: '虎', col: '#f0f0ff', atk: 13, sk: 'crit',   v: 15,             d: '暴擊率 +15%' },
  { id: 'fenghuang', g: 4, name: '鳳凰',     ch: '凰', col: '#ffb03a', atk: 13, sk: 'revive', n: 20,             d: '全軍覆沒時浴火重生一次(分身 20)' },
];
const PSETS = [   // 圖鑑：集齊一組就永久生效(拿去合成掉了也算)
  { name: '山野小友', ids: ['fox', 'magpie', 'panda'],               b: { atk: 2 } },
  { name: '靈氣滿堂', ids: ['jiao', 'rabbit', 'pixiu'],             b: { rate: 3 } },
  { name: '靈獸三傑', ids: ['firefox', 'eagle', 'turtle'],           b: { units: 1 } },
  { name: '狐仙一脈', ids: ['fox', 'firefox', 'ninetail'],           b: { crit: 3 } },
  { name: '祥瑞神獸', ids: ['ninetail', 'qilin', 'zhuque'],          b: { atk: 4 } },
  { name: '天之四靈', ids: ['qinglong', 'baihu', 'zhuque', 'turtle'], b: { atk: 5, rate: 2 } },
  { name: '萬獸之王', ids: ['qinglong', 'baihu', 'fenghuang'],       b: { atk: 6, units: 2 } },
];
const PRATES = [50, 30, 14.5, 4.8, 0.7], PPITY = 60;   // 靈寵閣機率(%)、保底
const PSYN = [100, 80, 60, 45], FY_ADD = 35;             // 合成成功率(凡→良、良→精、精→極、極→傳)、失敗加福緣
const petDef = id => PETS.find(p => p.id === id);
const petN = id => (save.pets && save.pets[id]) || 0;
const bonusText = b => [b.atk ? `內力 +${b.atk}%` : '', b.rate ? `身法 +${b.rate}%` : '', b.units ? `開局分身 +${b.units}` : '', b.crit ? `暴擊 +${b.crit}%` : ''].filter(Boolean).join('、');
function petGrant(id) {
  const isNew = !save.petSeen[id]; save.pets[id] = petN(id) + 1; save.petSeen[id] = 1;
  if (!save.pet || !petN(save.pet) || petDef(save.pet).g < petDef(id).g) save.pet = id;   // 更高品級的自動出戰
  return { id, isNew };
}
function rollPetG() {
  save.ppity = (save.ppity || 0) + 1;
  if (save.ppity >= PPITY) { save.ppity = 0; return 4; }
  let x = Math.random() * 100;
  for (let g = 4; g >= 0; g--) { x -= PRATES[g]; if (x < 0) { if (g === 4) save.ppity = 0; return g; } }
  return 0;
}
function randPet(g, favorNew) {   // 合成成功時，還沒有的靈寵機率加倍
  const L = PETS.filter(p => p.g === g), w = L.map(p => favorNew && !save.petSeen[p.id] ? 2 : 1), tot = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot, i = 0; while ((r -= w[i]) > 0) i++; return L[i].id;
}
const petFreeOk = () => save.petFree !== today();   // 靈寵閣每日免費單抽
const canPull = (kind, n) => (kind === 'pet' && n === 1 && petFreeOk()) || save.tk[kind] >= n || save.gems >= (n === 10 ? 900 : 100);
function payPull(kind, n) {   // 先用免費、再用召喚券、最後才用元寶
  if (kind === 'pet' && n === 1 && petFreeOk()) { save.petFree = today(); return 'free'; }
  if (save.tk[kind] >= n) { save.tk[kind] -= n; return 'tk'; }
  const c = n === 10 ? 900 : 100; if (save.gems < c) return null; save.gems -= c; return 'gem';
}
function pullGear(n) {
  const how = payPull('gear', n); if (!how) return; track('pull'); stat('pulls', n);
  const list = []; let best = 0;
  for (let i = 0; i < n; i++) { let r = -1;
    if (mythOpen()) { save.mpity = (save.mpity || 0) + 1; if (save.mpity >= MYTH.pity || Math.random() * 100 < MYTH.rate) { save.mpity = 0; r = 5; } }   // 神話先判定(獨立保底)
    if (r < 0) r = rollRar(); if (n === 10 && i === n - 1 && best < 2 && r < 2) r = 2; best = Math.max(best, r); list.push(grant(gkey(GSLOT[Math.floor(Math.random() * GSLOT.length)].k, r))); }
  logEv('gear_pull', { n, best, how }); persist();
  S.pres = { list, t: 0, best, src: 'gear', n }; sfx(best >= 3 ? 'win' : 'gate');
}
function pullPet(n) {
  const how = payPull('pet', n); if (!how) return; const free = how === 'free'; track('pull'); stat('pulls', n);
  const list = []; let best = 0;
  for (let i = 0; i < n; i++) { let g = rollPetG(); if (n === 10 && i === n - 1 && best < 2 && g < 2) g = 2; best = Math.max(best, g); list.push(petGrant(randPet(g))); }
  logEv('pet_pull', { n, best, how }); persist();
  S.pres = { list, t: 0, best, src: 'pull', n }; sfx(best >= 3 ? 'win' : 'gate');
}
const spare = id => Math.max(0, petN(id) - (save.pet === id ? 1 : 0));   // 出戰中的保留一隻
const synthAvail = g => PETS.filter(p => p.g === g).reduce((a, p) => a + spare(p.id), 0);
const synthReady = () => [0, 1, 2, 3].some(g => synthAvail(g) >= 4);
function synth(g) {
  if (g < 0 || g > 3 || synthAvail(g) < 4) return;
  for (let k = 0; k < 4; k++) { const p = PETS.filter(p => p.g === g && spare(p.id) > 0).sort((a, b) => spare(b.id) - spare(a.id))[0]; save.pets[p.id]--; }
  const sure = save.fy[g] >= 100, ok = sure || Math.random() * 100 < PSYN[g];
  let it;
  if (ok) { if (sure) save.fy[g] = 0; it = petGrant(randPet(g + 1, true)); }
  else { save.fy[g] = Math.min(100, save.fy[g] + FY_ADD); it = petGrant(randPet(g)); }
  stat('synths'); track('upgrade'); logEv('pet_synth', { g, ok: ok ? 1 : 0, sure: sure ? 1 : 0 }); persist();
  S.pres = { list: [it], t: 0, best: petDef(it.id).g, src: 'synth', ok, g, n: 1 }; sfx(ok ? 'win' : 'lose');
}
const PBR_N = [2, 2, 3, 3, 4, 4, 5, 5, 6];   // 靈寵突破要消耗的同品級靈寵數
const petLv = id => (save.plv && save.plv[id]) || 1;
const pbr = id => (save.pbr && save.pbr[id]) || 0;
const pcap = id => Math.min(100, 10 * (pbr(id) + 1));
const pUpCost = id => Math.round((30 + 20 * petDef(id).g) * Math.pow(petLv(id), 1.2) / 10) * 10;
const petAtk = (id, L = petLv(id)) => Math.round(petDef(id).atk * (1 + 0.1 * Math.min(L - 1, 9) + 0.05 * Math.max(0, L - 10)) * 10) / 10;
const petPow = id => 1 + 0.03 * (petLv(id) - 1);   // 靈寵技能傷害倍率
const pBrkPool = id => { const g = petDef(id).g; return PETS.filter(p => p.g === g).reduce((a, p) => a + Math.max(0, petN(p.id) - (p.id === id || p.id === save.pet ? 1 : 0)), 0); };
const canPBrk = id => petN(id) > 0 && petLv(id) >= pcap(id) && pcap(id) < 100;
function doPBrk(id) {
  const need = PBR_N[pbr(id)]; if (!canPBrk(id) || pBrkPool(id) < need) return false;
  const g = petDef(id).g;
  for (let k = 0; k < need; k++) { const q = PETS.filter(p => p.g === g && petN(p.id) - (p.id === id || p.id === save.pet ? 1 : 0) > 0).sort((a, b) => petN(b.id) - petN(a.id))[0]; save.pets[q.id]--; }
  save.pbr[id] = pbr(id) + 1; return true;
}
function petBonus() {   // 出戰靈寵＋圖鑑
  const b = { atk: 0, rate: 0, units: 0, crit: 0 };
  if (save.pet && petN(save.pet)) b.atk += petAtk(save.pet);
  for (const st of PSETS) if (st.ids.every(id => save.petSeen[id])) for (const k in st.b) b[k] += st.b[k];
  return b;
}
const petSeenN = () => PETS.filter(p => save.petSeen[p.id]).length;
function petStarter() { if (!petSeenN()) { petGrant('fox'); persist(); toast('小靈狐 跟上了你！到行囊「靈寵」看看'); } }
function bossDrop(stage, chief, minR = 0) {
  const x = Math.random(), k = Math.min(stEq(stage), 19) * 0.03;
  let r = x < 0.5 - k ? 0 : x < 0.82 - k ? 1 : x < 0.955 - k / 2 ? 2 : x < 0.995 ? 3 : 4;
  if (chief) r = Math.max(2, r);
  r = Math.max(r, minR);
  return grant(gkey(GSLOT[Math.floor(Math.random() * GSLOT.length)].k, r));
}

// ---------- 每日登入、每日任務 ----------
const LOGIN = [{ c: 300, pt: 2 }, { g: 20, et: 2 }, { c: 600, pt: 3 }, { g: 30, et: 3 }, { c: 1000, pt: 3, et: 2 }, { g: 50, pt: 5 }, { g: 100, pt: 5, et: 5 }];   // 7 天循環(數量之後再調整)
const TASKS = [
  { id: 'kill',    n: [150, 250, 400], name: n => `擊敗 ${n} 個敵人`,   rw: { c: 200, pt: 1 } },
  { id: 'win',     n: [2, 3],          name: n => `通關 ${n} 次`,       rw: { c: 300, et: 1 } },
  { id: 'barrel',  n: [5, 8],          name: n => `打破 ${n} 個酒罈`,   rw: { c: 150, pt: 1 } },
  { id: 'gate',    n: [15, 25],        name: n => `穿過 ${n} 道武功門`, rw: { c: 150, et: 1 } },
  { id: 'star3',   n: [1],             name: () => '拿到一次三星',       rw: { g: 10, pt: 1 } },
  { id: 'upgrade', n: [1, 2],          name: n => `修練或強化 ${n} 次`, rw: { c: 200, et: 1 } },
  { id: 'pull',    n: [1],             name: () => '在召喚閣抽一次',     rw: { g: 10, pt: 1 } },
];
const DAILY_CHEST = { g: 30, pt: 3, et: 3 };
const today = () => { const d = new Date(nowT()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const rwText = (rw, sh) => [rw.g ? '元寶 ' + rw.g : '', rw.c ? '銅錢 ' + rw.c : '', rw.pt ? (sh ? '靈寵券 ' : '靈寵召喚券 ') + rw.pt : '', rw.et ? (sh ? '裝備券 ' : '裝備召喚券 ') + rw.et : ''].filter(Boolean).join(sh ? '・' : '、');
function giveRw(rw) { if (rw.c) save.coins += rw.c; if (rw.g) save.gems += rw.g; if (rw.pt) save.tk.pet += rw.pt; if (rw.et) save.tk.gear += rw.et; }
const taskDef = id => TASKS.find(t => t.id === id);
function dailyCheck() {
  const d = today();
  if (save.daily && save.daily.date === d) return;
  const pool = TASKS.slice(), tasks = [];
  while (tasks.length < 3) { const T = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; tasks.push({ id: T.id, n: T.n[Math.floor(Math.random() * T.n.length)], p: 0, got: false }); }
  save.daily = { date: d, tasks, chest: false }; persist();
}
function track(id, k = 1) { if (!save.daily) return; for (const t of save.daily.tasks) if (t.id === id && !t.got) t.p = Math.min(t.n, t.p + k); }
const loginReady = () => save.login.last !== today();
function dailyHasClaim() { dailyCheck(); return loginReady() || save.daily.tasks.some(t => !t.got && t.p >= t.n) || (!save.daily.chest && save.daily.tasks.every(t => t.got)); }

// ---------- 每日活動(依星期輪替；之後可由伺服器設定覆蓋) ----------
const EVENTS = {
  coin2: { id: 'coin2', name: '週末豪俠', desc: '關卡銅錢 ×2', col: '#ffd23a' },
  drop:  { id: 'drop',  name: '神兵現世', desc: '首領必掉裝備・品質提升', col: '#ff8a3d' },
  frag:  { id: 'frag',  name: '英雄試煉', desc: '通關碎片 ×2', col: '#e8b4ff' },
};
const EV_WEEK = ['coin2', 'drop', 'frag', 'drop', 'frag', 'drop', 'coin2'];   // 週日～週六
let EV_OVERRIDE = null;   // 伺服器設定的特別活動 { id, from, to }
function evToday() {
  const d = today();
  if (EV_OVERRIDE && EVENTS[EV_OVERRIDE.id] && d >= EV_OVERRIDE.from && d <= EV_OVERRIDE.to) return EVENTS[EV_OVERRIDE.id];
  return EVENTS[EV_WEEK[new Date().getDay()]];
}
function evLeftText() { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n, h = Math.floor(m / 3600e3), mm = Math.floor(m / 60000) % 60; return `${h} 小時 ${mm} 分後更換`; }

// ---------- 信箱(遊戲內建信件＋伺服器信件：維修補償、活動獎勵) ----------
const MAILS = [
  { id: 'welcome', title: '歡迎來到江湖', body: '少俠初入江湖，送上見面禮。\n左右移動閃躲、穿過藍門變強，祝你一路殺上山！', rw: { g: 100, c: 2000 }, from: '2026-01-01', to: '2099-12-31' },
  { id: 'open56',  title: '第五、六章開放紀念', body: '南疆苗寨與紫禁皇城開放了！\n另外新增困難模式，通關普通章節後就能挑戰。', rw: { g: 200, f: 20 }, from: '2026-10-08', to: '2026-12-31' },
];
let SERVER_MAIL = [];
function mailList() {
  const d = today();
  return MAILS.concat(SERVER_MAIL).filter(m => m && m.id && d >= (m.from || '') && d <= (m.to || '9999')).sort((a, b) => (b.from || '').localeCompare(a.from || ''));
}
const mailHasClaim = () => mailList().some(m => !save.mail.got[m.id]);
function rwFull(rw) { const t = []; if (rw.g) t.push('元寶 ' + rw.g); if (rw.c) t.push('銅錢 ' + rw.c.toLocaleString()); if (rw.f) t.push('碎片 ' + rw.f); return t.join('、'); }
function claimMail(m) { if (!m || save.mail.got[m.id]) return false; save.mail.got[m.id] = 1; giveRw(m.rw || {}); if (m.rw && m.rw.f) addFrag(save.cls, m.rw.f); logEv('mail', { id: m.id }); return true; }
async function fetchServerData() {   // 伺服器信件與活動設定(雲端功能開啟後才會用到)
  if (!CLOUD.on) return;
  try { const rows = await api('/rest/v1/jh_mail?select=id,title,body,rw,from_date,to_date', { auth: false }); if (Array.isArray(rows)) SERVER_MAIL = rows.map(r => ({ id: 'sv_' + r.id, title: r.title, body: r.body || '', rw: r.rw || {}, from: r.from_date, to: r.to_date })); } catch (e) {}
  try { const rows = await api('/rest/v1/jh_config?select=key,value&key=eq.event', { auth: false }); if (Array.isArray(rows) && rows[0]) EV_OVERRIDE = rows[0].value; } catch (e) {}
}

// ---------- 數據紀錄(了解玩家卡在哪裡、在哪裡離開；雲端開啟後才上傳) ----------
const EVQ = store.get('jh_evq', []) || [];
let evFlushT = 20;
function logEv(ev, data = {}) {
  try { EVQ.push({ ev, data, at: new Date().toISOString() }); if (EVQ.length > 300) EVQ.splice(0, EVQ.length - 300); store.set('jh_evq', EVQ); } catch (e) {}
}
async function flushEv() {
  if (!CLOUD.on || !uid() || !EVQ.length) return;
  const batch = EVQ.splice(0, 50); store.set('jh_evq', EVQ);
  try { await api('/rest/v1/jh_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: batch.map(e => ({ user_id: uid(), ev: e.ev, data: e.data, at: e.at, build: BUILD })) }); }
  catch (e) { EVQ.unshift(...batch); store.set('jh_evq', EVQ); }
}
function evTick(dt) { if ((evFlushT -= dt) <= 0) { evFlushT = 60; flushEv(); } }

// ---------- 上架用的原生介面(Capacitor 打包後由 App 端提供 window.JH_NATIVE；網頁版沒有就走模擬) ----------
const NATIVE = () => window.JH_NATIVE || null;
const SKU = { g1: 'jh_gem_60', g2: 'jh_gem_300', g3: 'jh_gem_600', g4: 'jh_gem_1200', g5: 'jh_gem_3000', g6: 'jh_gem_6600',
  first: 'jh_pack_first', grow: 'jh_pack_grow', demon: 'jh_pack_demon', stuck: 'jh_pack_stuck', month: 'jh_month_card', pass: 'jh_pass_premium', x1: 'jh_xt_300', x2: 'jh_xt_1100', x3: 'jh_xt_4000' };

// ---------- 商城(付款目前是模擬，之後接 Apple / Google 內購) ----------
const GEM_TIERS = [
  { id: 'g1', p: 30,   g: 60 },
  { id: 'g2', p: 150,  g: 300,  b: 30 },
  { id: 'g3', p: 300,  g: 600,  b: 80 },
  { id: 'g4', p: 590,  g: 1200, b: 200 },
  { id: 'g5', p: 1490, g: 3000, b: 600 },
  { id: 'g6', p: 3290, g: 6600, b: 1600 },
];
const PACKS = {
  first: { name: '首儲禮包',     p: 30,  items: ['元寶 300', '精品兵器・青鋒劍', '銅錢 5,000'],      tag: '超值 10 倍' },
  grow:  { name: '成長禮包',     p: 300, items: ['元寶 1,000', '極品心法・九轉心經', '銅錢 30,000'], tag: '限購一次' },
  demon: { name: '魔教傳人',     p: 390, items: ['解鎖職業・魔教傳人', '元寶 500', '極品兵器・赤霄劍'],   tag: '限定職業' },
  stuck: { name: '限時突破禮包', p: 90,  items: ['元寶 500', '精品護甲・鎖子甲', '銅錢 10,000'],     tag: '限時 1 小時' },
};
const MONTH = { p: 150, now: 300, daily: 100, xt: 30, days: 30 };
const XT_PACKS = [   // 玄鐵禮包：每週各限購一次
  { id: 'x1', p: 90,  xt: 300,  g: 0,   name: '玄鐵小袋' },
  { id: 'x2', p: 300, xt: 1100, g: 100, c: 30000, name: '玄鐵寶箱' },
  { id: 'x3', p: 990, xt: 4000, g: 300, c: 150000, name: '玄鐵寶庫' },
];
const xtBought = id => save.shop.xtw[id] === weekNo();
const AD_MAX = 5, AD_GEMS = 10, REVIVE_GEMS = 50;
const CU_RATE = 150;   // 元寶換銅錢：1 元寶 = 150 銅錢
const dayStr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function addDays(str, n) { const [y, m, d] = str.split('-').map(Number); return dayStr(new Date(y, m - 1, d + n)); }
const monthActive = () => !!save.shop.monthEnd && today() <= save.shop.monthEnd;
const monthLeft = () => { if (!monthActive()) return 0; let n = 0, d = today(); while (d <= save.shop.monthEnd && n < 400) { n++; d = addDays(d, 1); } return n; };
const monthReady = () => monthActive() && save.shop.monthLast !== today();
const offerLeft = () => Math.max(0, (save.shop.offer || 0) - Date.now());
const adLeft = () => save.shop.ad.d === today() ? AD_MAX - save.shop.ad.n : AD_MAX;
function grantPack(id) {
  if (id === 'first') { save.gems += 300; save.coins += 5000; return grant('wpn2'); }
  if (id === 'grow')  { save.gems += 1000; save.coins += 30000; return grant('art3'); }
  if (id === 'demon') { save.owned.demon = true; save.gems += 500; return grant('wpn3'); }
  if (id === 'stuck') { save.gems += 500; save.coins += 10000; save.shop.offer = 0; return grant('arm2'); }
}
function buy(name, price, onPaid, sku = '') {   // 有原生介面就走 Apple / Google 內購，沒有就模擬
  const N = NATIVE();
  if (N && N.buy) {
    showForm({ title: '購買確認', ok: `付款 NT$${price}`, desc: `${name}\n價格：NT$${price}`,
      async onOk() { const r = await N.buy(sku); if (!r || !r.ok) throw new Error(r && r.msg || '購買已取消'); const msg = onPaid(); persist(); sfx('win'); logEv('purchase', { sku, price }); return msg; } });
    return;
  }
  showForm({ title: '購買確認', ok: `付款 NT$${price}`,
    desc: `${name}\n價格：NT$${price}\n\n(測試版：不會真的扣款，正式版會使用 Apple / Google 付款)`,
    async onOk() { const msg = onPaid(); persist(); sfx('win'); logEv('purchase', { sku, price, sim: 1 }); return msg; } });
}
function showAd(done, place = '') {   // 有原生介面就播 AdMob 激勵廣告，沒有就模擬
  logEv('ad', { place });
  const N = NATIVE();
  if (N && N.showAd) { S.ad = { t: 99, done: () => {}, native: true }; N.showAd(place).then(ok => { S.ad = null; if (ok) done(); else toast('廣告沒有看完，沒有獎勵'); }).catch(() => { S.ad = null; toast('目前沒有廣告，請稍後再試'); }); return; }
  S.ad = { t: 3, done };
}
function drawAd() {
  if (!S.ad) return;
  ui = [];
  ctx.fillStyle = 'rgba(0,0,0,.92)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.font = `900 30px ${FONT}`; ctx.fillText('廣告播放中…', W / 2, H / 2 - 40);
  ctx.fillStyle = '#aaa'; ctx.font = `16px ${FONT}`; ctx.fillText('(測試版模擬，正式版會播放真正的廣告)', W / 2, H / 2);
  ctx.fillStyle = '#ffd700'; ctx.font = `900 46px ${FONT}`; ctx.fillText(String(Math.ceil(S.ad.t)), W / 2, H / 2 + 60);
}
function adTick(dt) {
  if (!S.ad || S.ad.native) return;
  if ((S.ad.t -= dt) <= 0) { const f = S.ad.done; S.ad = null; f(); }
}
// ---------- 掛機收益(離線也會累積，最多 12 小時) ----------
const IDLE_MAX_H = 12;
function idleRate() { return { c: Math.round(100 + 35 * stEq(save.cleared)), f: 2, xp: 20 }; }   // 掛機約占每日銅錢三成，主要收入還是要靠打   // 每小時
function nowT() { const o = window.JH_SRV_OFF; return Date.now() + (typeof o === 'number' && Math.abs(o) > 5 * 60e3 ? o : 0); }   // 有伺服器時間就校正手機時間
function clockGuard() {   // 防調時間：手機時間往回撥 → 掛機重新計時；有伺服器時間就以伺服器為準
  const n = nowT(); save.idle.seen = save.idle.seen || 0;
  if (save.idle.t && n < save.idle.seen - 10 * 60e3) { save.idle.t = n; save.idle.flag = (save.idle.flag || 0) + 1; logEv('clock_back', { d: Math.round((save.idle.seen - n) / 60e3) }); }
  if (save.idle.t > n) save.idle.t = n;   // 開始時間不能在未來
  save.idle.seen = Math.max(save.idle.seen, n);
}
setTimeout(() => { try { clockGuard(); persist(); } catch (e) {} }, 0);
function idleHours() { if (!save.idle.t) return 0; return clamp((nowT() - save.idle.t) / 3600e3, 0, IDLE_MAX_H); }
function idleAmt(h = idleHours()) { const r = idleRate(); return { c: Math.floor(r.c * h), f: Math.floor(r.f * h), xp: Math.floor(r.xp * h) }; }
function idleGive(a, mult = 1) { save.coins += a.c * mult; addFrag(save.cls, a.f * mult); passXp(a.xp * mult); }
const idleQuickLeft = () => save.idle.quick.d === today() ? 3 - save.idle.quick.n : 3;
function shopHasClaim() { return monthReady() || (offerLeft() > 0 && !save.shop.packs.stuckSeen); }

// ---------- 俠客令(戰令，每季 30 天) ----------
const PASS = { start: '2026-10-01', days: 30, max: 30, per: 500, price: 300 };
const PASS_FREE = lv => lv % 10 === 0 ? { gear: lv === 10 ? 'wpn1' : lv === 20 ? 'art2' : 'arm3' } : lv % 5 === 0 ? { g: 30 } : { c: 400 + lv * 40 };
const PASS_PREM = lv => lv % 10 === 0 ? { gear: lv === 10 ? 'wpn2' : lv === 20 ? 'art3' : 'wpn4' } : lv % 2 ? { g: 60 } : { c: 3000 };
function seasonNo() { const [y, m, d] = PASS.start.split('-').map(Number), t0 = new Date(y, m - 1, d).getTime(); return Math.max(0, Math.floor((Date.now() - t0) / (PASS.days * 86400e3))); }
function seasonLeft() { const [y, m, d] = PASS.start.split('-').map(Number), t0 = new Date(y, m - 1, d).getTime(), end = t0 + (seasonNo() + 1) * PASS.days * 86400e3; return Math.max(1, Math.ceil((end - Date.now()) / 86400e3)); }
function passCheck() { const n = seasonNo(); if (!save.pass || save.pass.season !== n) { save.pass = { season: n, xp: 0, free: {}, prem: {}, premium: false }; } return save.pass; }
const passLv = () => Math.min(PASS.max, Math.floor(passCheck().xp / PASS.per));
function passXp(n) { const P = passCheck(), before = passLv(); P.xp = Math.min(P.xp + n, PASS.max * PASS.per); return passLv() > before; }
function passRwText(rw) { return rw.gear ? `${RAR[grar(rw.gear)]}・${gname(rw.gear)}` : rwText(rw); }
function passGive(rw) { if (rw.gear) grant(rw.gear); else giveRw(rw); }
function passClaimable() { const P = passCheck(), L = passLv(); let n = 0; for (let lv = 1; lv <= L; lv++) { if (!P.free[lv]) n++; if (P.premium && !P.prem[lv]) n++; } return n; }
function passClaimAll() {
  const P = passCheck(), L = passLv(); let n = 0;
  for (let lv = 1; lv <= L; lv++) {
    if (!P.free[lv]) { P.free[lv] = true; passGive(PASS_FREE(lv)); n++; }
    if (P.premium && !P.prem[lv]) { P.prem[lv] = true; passGive(PASS_PREM(lv)); n++; }
  }
  return n;
}

// ---------- 成就與稱號 ----------
const ACHV = [
  { id: 'kills',   name: '千人斬',     d: n => `累積擊敗 ${n} 個敵人`,     goals: [500, 3000, 15000], rw: [20, 50, 100], ttl: '千人斬',   v: () => save.stats.kills || 0 },
  { id: 'wins',    name: '身經百戰',   d: n => `累積通關 ${n} 次`,         goals: [5, 30, 100],       rw: [20, 50, 100], ttl: '百戰俠客', v: () => save.stats.wins || 0 },
  { id: 'bosses',  name: '屠魔者',     d: n => `擊敗首領 ${n} 次`,         goals: [3, 15, 50],        rw: [20, 50, 100], ttl: '屠魔者',   v: () => save.stats.bosses || 0 },
  { id: 'units',   name: '萬人敵',     d: n => `單局分身達到 ${n} 個`,     goals: [30, 80, 200],      rw: [20, 50, 100], ttl: '萬人敵',   v: () => save.stats.maxUnits || 0 },
  { id: 'gates',   name: '穿門如風',   d: n => `累積穿過 ${n} 道武功門`,   goals: [50, 300, 1500],    rw: [20, 50, 100], ttl: '疾風身法', v: () => save.stats.gates || 0 },
  { id: 'barrels', name: '酒中仙',     d: n => `累積打破 ${n} 個酒罈`,     goals: [20, 150, 600],     rw: [20, 50, 100], ttl: '酒中仙',   v: () => save.stats.barrels || 0 },
  { id: 'stars',   name: '摘星',       d: n => `累積獲得 ${n} 顆星`,       goals: [15, 45, 90],       rw: [20, 50, 100], ttl: '摘星手',   v: () => save.stars.reduce((a, b) => a + (b || 0), 0) },
  { id: 'collect', name: '收藏家',     d: n => `收集 ${n} 件不同裝備`,     goals: [5, 10, 15],        rw: [20, 50, 100], ttl: '藏寶閣主', v: () => Object.keys(save.gear).length },
  { id: 'pulls',   name: '召喚閣常客', d: n => `在召喚閣抽 ${n} 次`,       goals: [10, 50, 200],      rw: [20, 50, 100], ttl: '書痴',     v: () => save.stats.pulls || 0 },
  { id: 'combo',   name: '連斬狂人',   d: n => `單局連斬達到 ${n}`,         goals: [50, 200, 500],     rw: [20, 50, 100], ttl: '連斬狂人', v: () => save.stats.maxCombo || 0 },
  { id: 'petsn',   name: '靈寵收藏家', d: n => `收集 ${n} 種靈寵`,         goals: [5, 10, 15],       rw: [50, 100, 300], ttl: '萬獸之主', v: () => petSeenN() },
  { id: 'chal',    name: '挑戰達人',   d: n => `完成 ${n} 個關卡挑戰`,     goals: [20, 60, 120],     rw: [50, 100, 200], ttl: '挑戰達人', v: () => chalCount() },
  { id: 'tower',   name: '登峰造極',   d: n => `試煉塔登上第 ${n} 層`,     goals: [10, 20, 40],      rw: [50, 100, 200], ttl: '登峰造極', v: () => save.tower.best || 0 },
  { id: 'endless', name: '試煉之王',   d: n => `無盡試煉突破 ${n} 波`,     goals: [4, 7, 10],        rw: [30, 60, 120], ttl: '試煉之王', v: () => save.endless.best || 0 },
  { id: 'hard',    name: '傲視群雄',   d: n => `困難模式通關 ${n} 關`,     goals: [10, 40, 120],      rw: [50, 150, 300], ttl: '傲視群雄', v: () => save.hard.cleared || 0 },
  { id: 'chapter', name: '踏平江湖',   d: n => `通關第 ${n} 章`,           goals: [2, 4, 6, 8, 10, 12], rw: [100, 200, 300, 400, 500, 800], ttl: '江湖霸主', v: () => Math.floor(save.cleared / 10) },
];
function stat(k, n = 1) { save.stats[k] = (save.stats[k] || 0) + n; }
const achvTier = a => save.achv[a.id] || 0;
const achvReady = a => achvTier(a) < a.goals.length && a.v() >= a.goals[achvTier(a)];
const achvHasClaim = () => ACHV.some(achvReady);
const ttlText = () => { const a = ACHV.find(a => a.id === save.ttl); return a && achvTier(a) >= a.goals.length ? a.ttl : ''; };

// ---------- 帳號與雲端存檔(Supabase，直接呼叫官方 API，不需額外套件) ----------
const CFG = window.JH_CFG || {};
const CLOUD = { on: !!(CFG.supabaseUrl && CFG.supabaseKey), sess: store.get('jh_auth', null), status: 'off', msg: '', pushT: 0, dirty: false, busy: false, last: 0 };
if (CLOUD.on) CLOUD.status = 'init';
function errZh(m) {   // 伺服器英文錯誤訊息轉中文
  const M = [[/invalid login credentials/i, 'Email 或密碼錯誤'], [/already (been )?registered|already exists/i, '這個 Email 已經被註冊過'],
    [/email not confirmed/i, 'Email 尚未驗證，請到信箱點確認連結'], [/anonymous sign-?ins? (are )?disabled/i, '伺服器尚未開啟訪客登入(請到 Supabase 開啟 Anonymous)'],
    [/rate limit|too many/i, '操作太頻繁，請稍後再試'], [/failed to fetch|networkerror|load failed/i, '連不上伺服器，請檢查網路'],
    [/password.*(6|short|weak)/i, '密碼太短或太簡單'], [/invalid.*email|email.*invalid/i, 'Email 格式不正確']];
  for (const [r, t] of M) if (r.test(m)) return t;
  return m;
}
async function api(path, opt = {}) {
  const h = Object.assign({ apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, opt.headers || {});
  if (opt.auth !== false && CLOUD.sess) h.Authorization = 'Bearer ' + CLOUD.sess.access_token;
  let res;
  try { res = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined }); }
  catch (e) { throw new Error(errZh(e.message || 'Failed to fetch')); }
  try { const dh = res.headers.get('date'); if (dh) { const st = Date.parse(dh); if (st) { window.JH_SRV_OFF = st - Date.now(); clockGuard(); } } } catch (e) {}
  const txt = await res.text(); let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
  if (!res.ok) throw new Error(errZh((data && (data.msg || data.message || data.error_description || data.error)) || ('HTTP ' + res.status)));
  return data;
}
function setSess(d) {
  if (!d || !d.access_token) { CLOUD.sess = null; store.set('jh_auth', null); return; }
  CLOUD.sess = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: d.user };
  store.set('jh_auth', CLOUD.sess);
}
async function ensureSession() {
  if (CLOUD.sess && CLOUD.sess.expires_at - 60 > Date.now() / 1000) return;
  if (CLOUD.sess && CLOUD.sess.refresh_token) {
    try { setSess(await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: CLOUD.sess.refresh_token } })); return; } catch (e) {}
  }
  setSess(await api('/auth/v1/signup', { method: 'POST', auth: false, body: { data: {} } }));   // 建立訪客帳號
}
const uid = () => CLOUD.sess && CLOUD.sess.user && CLOUD.sess.user.id;
const isAnon = () => !CLOUD.sess || !CLOUD.sess.user || CLOUD.sess.user.is_anonymous || !(CLOUD.sess.user.email || CLOUD.sess.user.new_email);
const acctEmail = () => CLOUD.sess && CLOUD.sess.user && (CLOUD.sess.user.email || CLOUD.sess.user.new_email) || '';
async function cloudPull() { const rows = await api(`/rest/v1/jh_saves?select=data,updated_at&user_id=eq.${uid()}`); return rows && rows[0]; }
async function cloudPush() {
  await api('/rest/v1/jh_saves?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { user_id: uid(), data: save, updated_at: new Date(save.t || Date.now()).toISOString() } });
  CLOUD.last = Date.now();
}
function adopt(data) { save = normalize(data); store.set('jh_save', save); S.cls = clsView(save.cls); }
async function cloudSync() {   // 新的進度蓋掉舊的
  if (!CLOUD.on || CLOUD.busy) return;
  CLOUD.busy = true; CLOUD.status = 'sync';
  try {
    await ensureSession();
    const r = await cloudPull();
    if (r && r.data && (r.data.t || 0) > (save.t || 0)) { adopt(r.data); CLOUD.last = Date.now(); }
    else await cloudPush();
    CLOUD.status = 'ok'; CLOUD.dirty = false; CLOUD.msg = '';
  } catch (e) { CLOUD.status = 'err'; CLOUD.msg = e.message; }
  CLOUD.busy = false;
  fetchServerData();
}
function cloudDirty() { if (!CLOUD.on) return; CLOUD.dirty = true; CLOUD.pushT = 4; }
async function cloudPushSafe() {
  CLOUD.busy = true; CLOUD.dirty = false;
  try { await ensureSession(); await cloudPush(); CLOUD.status = 'ok'; CLOUD.msg = ''; }
  catch (e) { CLOUD.status = 'err'; CLOUD.msg = e.message; CLOUD.dirty = true; CLOUD.pushT = 15; }
  CLOUD.busy = false;
}
function cloudTick(dt) {
  if (!CLOUD.on || !CLOUD.dirty || CLOUD.busy || CLOUD.status === 'init') return;
  if ((CLOUD.pushT -= dt) <= 0) cloudPushSafe();
}
function cloudStatusText() {
  if (!CLOUD.on) return '離線版(進度只存在這台裝置)';
  return { init: '連線中…', sync: '同步中…', ok: '已同步', err: '同步失敗：' + CLOUD.msg }[CLOUD.status] || '';
}

// ---------- 提示訊息、輸入視窗 ----------
let toastObj = null;
function toast(t, dur = 2.2) { toastObj = { t, life: dur }; }
function drawToast(dt) {
  if (!toastObj) return;
  const a = clamp(toastObj.life * 3, 0, 1);
  ctx.globalAlpha = a; ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.min(W - 40, ctx.measureText(toastObj.t).width + 40);
  ctx.fillStyle = 'rgba(0,0,0,.85)'; roundRect(W / 2 - w / 2, H / 2 - 25, w, 50, 14); ctx.fill();
  ctx.strokeStyle = '#f5d27a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffe9a8'; ctx.fillText(toastObj.t, W / 2, H / 2); ctx.globalAlpha = 1;
}
function closeForm() { const f = document.getElementById('jhform'); if (f) f.remove(); S.modal = false; }
function showForm(o) {
  closeForm(); S.modal = true; drag.on = false; keys.left = keys.right = false;
  if (!document.getElementById('jhform-css')) {
    const st = document.createElement('style'); st.id = 'jhform-css';
    st.textContent = '#jhform{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);font-family:"PingFang TC","Microsoft JhengHei",sans-serif}' +
      '#jhform .c{width:min(88vw,380px);background:#2a1d14;border:2px solid #f5d27a;border-radius:16px;padding:20px;color:#fff;box-sizing:border-box}' +
      '#jhform .t{font-size:22px;font-weight:900;color:#ffe9a8;text-align:center;margin-bottom:10px}' +
      '#jhform .d{font-size:15px;color:#ddd;line-height:1.5;margin-bottom:10px;white-space:pre-line}' +
      '#jhform input{width:100%;box-sizing:border-box;margin:6px 0;padding:12px;font-size:17px;border-radius:10px;border:1px solid #8a7a5a;background:#1a120b;color:#fff}' +
      '#jhform .m{min-height:20px;font-size:14px;color:#ff9a8a;margin:6px 0;white-space:pre-line}' +
      '#jhform .b{display:flex;gap:10px;margin-top:8px}#jhform button{flex:1;padding:12px;font-size:18px;font-weight:bold;border-radius:10px;border:2px solid #f5d27a;color:#fff;cursor:pointer}' +
      '#jhform .no{background:#4a3b2a}#jhform .ok{background:#c0392b}#jhform button:disabled{opacity:.5}';
    document.head.appendChild(st);
  }
  const box = document.createElement('div'); box.id = 'jhform';
  const card = document.createElement('div'); card.className = 'c'; box.appendChild(card);
  const t = document.createElement('div'); t.className = 't'; t.textContent = o.title; card.appendChild(t);
  if (o.desc) { const d = document.createElement('div'); d.className = 'd'; d.textContent = o.desc; card.appendChild(d); }
  const inputs = {};
  for (const f of o.fields || []) { const i = document.createElement('input'); i.type = f.type || 'text'; i.placeholder = f.ph || ''; i.autocomplete = f.ac || 'off'; card.appendChild(i); inputs[f.k] = i; }
  const m = document.createElement('div'); m.className = 'm'; card.appendChild(m);
  const b = document.createElement('div'); b.className = 'b'; card.appendChild(b);
  const no = document.createElement('button'); no.className = 'no'; no.textContent = '取消'; b.appendChild(no);
  const ok = document.createElement('button'); ok.className = 'ok'; ok.textContent = o.ok || '確定'; b.appendChild(ok);
  no.onclick = closeForm;
  ok.onclick = async () => {
    const v = {}; for (const k in inputs) v[k] = inputs[k].value.trim();
    ok.disabled = no.disabled = true; m.style.color = '#ccc'; m.textContent = '處理中…';
    try { const msg = await o.onOk(v); closeForm(); if (msg) toast(msg); }
    catch (e) { m.style.color = '#ff9a8a'; m.textContent = e.message || String(e); ok.disabled = no.disabled = false; }
  };
  document.body.appendChild(box);
  const first = Object.values(inputs)[0]; if (first) setTimeout(() => first.focus(), 50);
}
function checkCred(v) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email || '')) throw new Error('Email 格式不正確');
  if ((v.password || '').length < 6) throw new Error('密碼至少 6 個字元');
}
function resetLocal() { adopt(normalize(null)); save.t = Date.now(); store.set('jh_save', save); }
const ACCT = {
  bind() {
    showForm({ title: '綁定 Email', desc: '綁定後換手機也能用 Email 登入找回進度。', ok: '綁定',
      fields: [{ k: 'email', type: 'email', ph: 'Email', ac: 'email' }, { k: 'password', type: 'password', ph: '設定密碼(至少 6 個字元)', ac: 'new-password' }],
      async onOk(v) {
        checkCred(v); await ensureSession();
        const u = await api('/auth/v1/user', { method: 'PUT', body: { email: v.email, password: v.password } });
        CLOUD.sess.user = u; store.set('jh_auth', CLOUD.sess); await cloudPush();
        return u.email ? '綁定完成！' : '已送出，請到信箱點確認連結';
      } });
  },
  login() {
    showForm({ title: '登入其他帳號', desc: '登入後，這台裝置的進度會換成該帳號的雲端進度。', ok: '登入',
      fields: [{ k: 'email', type: 'email', ph: 'Email', ac: 'email' }, { k: 'password', type: 'password', ph: '密碼', ac: 'current-password' }],
      async onOk(v) {
        checkCred(v);
        setSess(await api('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: v.email, password: v.password } }));
        const r = await cloudPull();
        if (r && r.data) { adopt(r.data); CLOUD.status = 'ok'; return '已載入雲端進度'; }
        await cloudPush(); CLOUD.status = 'ok'; return '登入成功，目前進度已上傳';
      } });
  },
  logout() {
    showForm({ title: '登出', desc: '登出後會回到全新的訪客進度。\n之後可以用 Email 再登入找回。', ok: '登出',
      async onOk() { try { await api('/auth/v1/logout', { method: 'POST' }); } catch (e) {} setSess(null); resetLocal(); CLOUD.busy = false; cloudSync(); return '已登出'; } });
  },
  del() {
    showForm({ title: '刪除帳號', desc: '帳號和雲端進度會永久刪除，無法復原。\n確定要刪除請輸入「刪除」。', ok: '永久刪除',
      fields: [{ k: 'confirm', ph: '輸入：刪除' }],
      async onOk(v) {
        if (v.confirm !== '刪除') throw new Error('請輸入「刪除」兩個字');
        await ensureSession(); await api('/rest/v1/rpc/jh_delete_me', { method: 'POST', body: {} });
        setSess(null); resetLocal(); cloudSync(); return '帳號已刪除';
      } });
  },
};

// ---------- 美術 ----------
const ART = {};
const WARM = [];   // 圖片預先解碼：背景慢慢做，避免第一場戰鬥第一次畫到圖時卡頓
function addImg(k, d) { const img = new Image(); img.src = d.src; if (img.decode) img.decode().catch(() => {}); ART[k] = { img, w: d.w, h: d.h, bx: d.bx }; WARM.push(k); }
const WARM_CV = document.createElement('canvas'); WARM_CV.width = WARM_CV.height = 4; const WARM_X = WARM_CV.getContext('2d');
function warmTick(dl) {   // 閒置時把圖畫一次到小畫布，讓瀏覽器先準備好(戰鬥中不做)
  let n = 0; while (WARM.length && n < 4 && (!dl || dl.timeRemaining() > 3) && S.mode !== 'play') { const a = ART[WARM[0]]; if (a && a.img.complete && a.img.naturalWidth) { try { WARM_X.drawImage(a.img, 0, 0, 4, 4); } catch (e) {} WARM.shift(); n++; } else if (a && a.img.complete) WARM.shift(); else break; }
  (window.requestIdleCallback || (f => setTimeout(f, 120)))(warmTick);
}
(() => { const src = window.JH_ART || {}; for (const k in src) addImg(k, src[k]); })();
setTimeout(() => warmTick(), 600);
// 分章載入：主程式只帶第一章與共用素材，其他章節在背景下載
const CHUNKS = [{ ch: 96, file: 'assets_pawn.js', state: 'idle' },
  ...CHAP.flatMap((c, i) => c.file ? [{ ch: i, file: c.file, state: 'idle' }] : []),
  { ch: 99, file: 'assets_skin.js', state: 'idle' }, { ch: 98, file: 'assets_atk.js', state: 'idle' }, { ch: 97, file: 'assets_fx.js', state: 'idle' }, { ch: 96, file: 'assets_ui.js', state: 'idle' }];   // 章節素材由章節總表派生
window.JH_ADD_ART = d => { for (const k in d) addImg(k, d[k]); };
(window.JH_ART_PENDING || []).forEach(window.JH_ADD_ART); window.JH_ART_PENDING = [];
function loadChunk(c) {
  if (!c || c.state !== 'idle') return;
  if (window.JH_CHUNK_LOADED && window.JH_CHUNK_LOADED[c.file]) { c.state = 'done'; return; }
  c.state = 'loading';
  const el = document.createElement('script'); el.src = c.file + (c.tries ? '?r=' + c.tries : '');
  el.onload = () => { c.state = 'done'; };
  el.onerror = () => {   // 網路抖一下載失敗：自動重試 2 次，之後才放棄
    c.tries = (c.tries || 0) + 1;
    if (c.tries <= 2) setTimeout(() => { c.state = 'idle'; loadChunk(c); }, 1500 * c.tries);
    else c.state = 'fail';
  };
  document.head.appendChild(el);
}
const chunkFor = ch => CHUNKS.find(c => c.ch === ch);
function chunkReady(ch) {   // 新章節自己的素材＋還沒畫好、借用的舊章節素材都要載好
  const cs = [chunkFor(ch), ch !== CH_FB[ch] ? chunkFor(CH_FB[ch]) : null].filter(Boolean); if (!cs.length) return true;
  cs.forEach(c => { if (c.state === 'idle') loadChunk(c); }); return cs.every(c => c.state === 'done' || c.state === 'fail');
}
setTimeout(() => CHUNKS.forEach(loadChunk), 1200);
function spr(k) { k = artKey(k); const a = k && ART[k]; return a && a.img.complete && a.img.naturalWidth ? a : null; }
function drawSpr(a, cx, top, h, bx = 0.5) { const w = h * a.w / a.h; ctx.drawImage(a.img, cx - w * bx, top, w, h); }   // bx：身體中心在圖片寬度的位置
function drawIcon(k, cx, cy, size) { const a = spr(k); if (!a) return false; const sc = size / Math.max(a.w, a.h); ctx.drawImage(a.img, cx - a.w * sc / 2, cy - a.h * sc / 2, a.w * sc, a.h * sc); return true; }
const fxLow = () => save.opt.fx === 'low' || PERF.autoLow;
const SPRC = {};
function sprCache(k, a, h, white) {   // 依顯示大小預先縮好的圖(white：受擊白光用的剪影)，每幀只要貼一次
  const sc = Math.min(view.s * view.d, 2.5), key = k + '@' + h + '@' + sc + (white ? 'w' : '');
  let c = SPRC[key]; if (c) return c;
  const w = h * a.w / a.h, cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * sc)); cv.height = Math.max(1, Math.ceil(h * sc));
  const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(a.img, 0, 0, cv.width, cv.height);
  if (white) { x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, cv.width, cv.height); }
  return (SPRC[key] = { cv, w, h });
}
function drawSprFlash(a, cx, top, h, f, bx = 0.5) { if (f <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; drawSpr(a, cx, top, h, bx); ctx.restore(); }

// 陣型位置(向日葵排列，往後壓扁)
const FPOS = [{ x: 0, y: 0 }];
for (let i = 1; i < 60; i++) { const r = 18 + 10 * Math.sqrt(i - 1), a = i * 2.39996; FPOS.push({ x: Math.cos(a) * r, y: Math.abs(Math.sin(a)) * r * 0.55 + 6 }); }
const FORDER = {};   // 依人數快取繪圖順序(上面的先畫，下面的蓋在前面)
function squadOrder(n) { if (!FORDER[n]) FORDER[n] = Array.from({ length: n - 1 }, (_, i) => i + 1).sort((a, b) => FPOS[a].y - FPOS[b].y); return FORDER[n]; }
function squadR() { const n = Math.min(S.units, 60); return n <= 1 ? 16 : 28 + 10 * Math.sqrt(Math.max(0, n - 2)); }

// ---------- 音效(即時合成，不需要載入檔案) ----------
const AU = { ctx: null, last: {}, noise: null };
function audioInit() {
  if (!AU.ctx) {
    try {
      AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const len = AU.ctx.sampleRate * 0.5, buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      AU.noise = buf;
      AU.out = AU.ctx.createDynamicsCompressor(); AU.out.threshold.value = -14; AU.out.knee.value = 10; AU.out.ratio.value = 6; AU.out.attack.value = 0.002; AU.out.release.value = 0.12;
      AU.out.connect(AU.ctx.destination); AU.voices = 0;
    } catch (e) { AU.ctx = null; }
  }
  if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => {});
}
function tone(f0, f1, dur, type, vol, delay = 0) {
  const a = AU.ctx, t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  AU.voices = (AU.voices || 0) + 1; o.onended = () => { AU.voices--; };
  o.connect(g).connect(AU.out || a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, filt, freq) {
  const a = AU.ctx, t = a.currentTime, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = AU.noise; f.type = filt; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  AU.voices = (AU.voices || 0) + 1; s.onended = () => { AU.voices--; };
  s.connect(f).connect(g).connect(AU.out || a.destination); s.start(t); s.stop(t + dur + 0.02);
}
const SFX_GAP = { shoot: 0.1, hit: 0.045, kill: 0.04, coin: 0.06, hurt: 0.12, thud: 0.07, bslash: 0.15, tick: 0.035, crit: 0.08 };
const jit = (f, p = 0.08) => f * (1 + (Math.random() * 2 - 1) * p);   // 每次音高微調，聽起來不會重複單調
const BGM = { mode: '', next: 0, step: 0, gain: null, phrase: [], seed: 1 };
const BGM_MODES = {
  calm:   { bpm: 84,  key: 293.66, scale: [0, 2, 4, 7, 9],  drums: 0, density: 0.45 },
  battle: { bpm: 118, key: 293.66, scale: [0, 2, 4, 7, 9],  drums: 1, density: 0.6 },
  boss:   { bpm: 136, key: 261.63, scale: [0, 3, 5, 7, 10], drums: 2, density: 0.7 },
};
function bgmWant() {
  if (S.mode === 'play' || S.mode === 'revive') return S.boss || S.bossT !== null && S.bossT !== undefined && !S.endless && S.t >= ST().len ? 'boss' : 'battle';
  return 'calm';
}
function bgmRand() { BGM.seed = (BGM.seed * 16807) % 2147483647; return BGM.seed / 2147483647; }
function bgmPhrase(M) {   // 產生一段 16 拍旋律(在音階上隨機漫步，聽起來比較順)
  const out = []; let idx = 5;
  for (let i = 0; i < 16; i++) {
    if (bgmRand() < M.density || i % 4 === 0) { idx = clamp(idx + Math.round((bgmRand() - 0.5) * 4), 0, 10); out.push(idx); } else out.push(-1);
  }
  out[15] = out[15] >= 0 ? 0 : -1; return out;
}
function pluck(f, t, vol, dur = 0.7) {   // 古箏般的撥弦音
  const a = AU.ctx, o = a.createOscillator(), o2 = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.001;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 6, t); fl.frequency.exponentialRampToValueAtTime(f * 1.2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); o2.connect(fl); fl.connect(g).connect(BGM.gain); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function drum(t, kind, vol) {
  const a = AU.ctx;
  if (kind === 'tom') { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.2); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g).connect(BGM.gain); o.start(t); o.stop(t + 0.3); }
  else { const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); n.buffer = AU.noise; f.type = 'highpass'; f.frequency.value = 3000; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); n.connect(f).connect(g).connect(BGM.gain); n.start(t); n.stop(t + 0.08); }
}
function bgmTick() {
  if (!AU.ctx || AU.ctx.state !== 'running') return;
  if (!BGM.gain) { BGM.gain = AU.ctx.createGain(); BGM.gain.connect(AU.ctx.destination); }
  const on = save.opt.bgm && !S.ad;
  BGM.gain.gain.value = on ? 0.5 : 0;
  if (!on) { BGM.next = 0; return; }
  const want = bgmWant(), M = BGM_MODES[want], now = AU.ctx.currentTime;
  if (want !== BGM.mode) { BGM.mode = want; BGM.step = 0; BGM.phrase = bgmPhrase(M); BGM.next = Math.max(BGM.next, now + 0.05); }
  if (BGM.next < now - 0.5) BGM.next = now + 0.05;
  const sixteenth = 60 / M.bpm / 2;
  const nf = i => { const o = Math.floor(i / 5), d = M.scale[i % 5]; return M.key * Math.pow(2, (d + o * 12 - 12) / 12); };
  while (BGM.next < now + 0.3) {
    const st = BGM.step % 16, t = BGM.next;
    if (st === 0 && BGM.step % 32 === 0 && BGM.step > 0) BGM.phrase = bgmPhrase(M);   // 每兩小節換新旋律
    const n = BGM.phrase[st]; if (n >= 0) pluck(nf(n + 5), t, 0.07, want === 'calm' ? 1.1 : 0.6);
    if (st === 0 || st === 8) pluck(nf(0) / 2, t, 0.06, 1.4);                              // 低音
    if (M.drums) {
      if (st === 0 || st === 6 || st === 8 || (M.drums > 1 && (st === 11 || st === 14))) drum(t, 'tom', 0.22);
      if (st === 4 || st === 12 || (M.drums > 1 && st % 2 === 1)) drum(t, 'hat', M.drums > 1 ? 0.04 : 0.06);
    }
    BGM.step++; BGM.next += sixteenth;
  }
}
function sfx(n) {
  if (save.mute || !AU.ctx || AU.ctx.state !== 'running') return;
  const now = AU.ctx.currentTime;
  if (SFX_GAP[n] && AU.last[n] && now - AU.last[n] < SFX_GAP[n]) return;
  if ((AU.voices || 0) > 22 && (n === 'hit' || n === 'shoot' || n === 'tick' || n === 'coin')) return;   // 太多聲音同時響就跳過小音效，手機比較順
  AU.last[n] = now;
  try {
    switch (n) {
      case 'shoot': {
        const c = S.cls && S.cls.id;
        if (c === 'bow') { tone(900, 320, 0.08, 'triangle', 0.035); noise(0.03, 0.03, 'highpass', 3000); }
        else if (c === 'blade') { noise(0.1, 0.07, 'bandpass', 900); tone(300, 160, 0.06, 'triangle', 0.025); }
        else if (c === 'demon') { tone(160, 90, 0.1, 'sawtooth', 0.04); noise(0.06, 0.04, 'lowpass', 900); }
        else noise(0.07, 0.05, 'bandpass', 2600 + Math.random() * 600);   // 揮劍的「咻」
        break;
      }
      case 'hit': noise(0.045, 0.07, 'bandpass', jit(2200, 0.15)); tone(jit(240), 90, 0.05, 'triangle', 0.05); break;   // 砍中的「咔」
      case 'crit': noise(0.08, 0.12, 'bandpass', jit(3200)); tone(jit(900), 300, 0.09, 'square', 0.05); tone(160, 50, 0.12, 'sine', 0.12); break;   // 暴擊：更亮更重
      case 'tick': tone(n === 'tick' ? jit(700 + Math.min(AU.tickN || 0, 20) * 45, 0.02) : 700, 1400, 0.05, 'sine', 0.06); break;   // 分身冒出的「啵」
      case 'kill': { const k = Math.min(S.combo || 0, 48), f = 440 * Math.pow(2, (k % 12) / 12 + Math.floor(k / 24) * 0.5); noise(0.07, 0.09, 'lowpass', jit(1400)); tone(f, f * 1.9, 0.07, 'triangle', 0.06); tone(jit(120), 45, 0.08, 'sine', 0.08); break; }   // 擊殺：噗＋上升音階＋低頻   // 連斬越高音越高，打出節奏感
      case 'thud': tone(jit(150), 45, 0.14, 'sine', 0.18); noise(0.08, 0.1, 'lowpass', 500); break;
      case 'bslash': noise(0.16, 0.09, 'bandpass', 1300); tone(220, 80, 0.16, 'sawtooth', 0.04); break;
      case 'coin': tone(1200, 1800, 0.06, 'sine', 0.05); break;
      case 'gate': [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.12, 'triangle', 0.09, i * 0.05)); noise(0.2, 0.06, 'highpass', 4000); break;
      case 'bad': tone(320, 120, 0.3, 'sawtooth', 0.06); break;
      case 'hurt': noise(0.14, 0.14, 'lowpass', 700); break;
      case 'barrel': noise(0.18, 0.12, 'lowpass', 500); tone(180, 90, 0.15, 'square', 0.04); break;
      case 'warn': tone(110, 100, 0.55, 'sawtooth', 0.09); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.09, i * 0.12)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.22, 'triangle', 0.08, i * 0.15)); break;
      case 'click': tone(700, 900, 0.05, 'sine', 0.05); break;
      case 'knock': [0, 0.13].forEach(d => { tone(230, 170, 0.07, 'square', 0.06, d); noise(0.05, 0.05, 'lowpass', 900); }); break;   // 掂量：敲兩下
      case 'peek': noise(0.25, 0.05, 'bandpass', 1600); tone(900, 1500, 0.3, 'sine', 0.04, 0.05); break;   // 掀一角
      case 'saw': tone(160, 1500, 1.3, 'sawtooth', 0.035); tone(240, 2200, 1.3, 'square', 0.015); noise(1.3, 0.035, 'bandpass', 2600); break;   // 開山輪：越轉越尖
      case 'crack': noise(0.3, 0.14, 'lowpass', 900); tone(160, 50, 0.25, 'square', 0.07); break;
      case 'junk': tone(320, 110, 0.45, 'triangle', 0.07); noise(0.5, 0.06, 'lowpass', 500); break;
      case 'gsmall': [880, 1175].forEach((f, i) => tone(f, f, 0.1, 'sine', 0.06, i * 0.08)); break;
      case 'gmid': [660, 880, 1175].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.07, i * 0.09)); break;
      case 'gbig': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.08, i * 0.09)); break;
      case 'jackpot': [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, f * 1.01, 0.25, 'triangle', 0.09, i * 0.08)); noise(0.8, 0.03, 'highpass', 5000); break;
      case 'restock': noise(0.18, 0.05, 'highpass', 2000); tone(500, 760, 0.12, 'sine', 0.05, 0.05); break;
      case 'forge': [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.08, i * 0.1)); break;
      case 'up': [660, 880].forEach((f, i) => tone(f, f, 0.09, 'sine', 0.07, i * 0.07)); break;
    }
  } catch (e) {}
}

// ---------- 狀態 ----------
const S = { mode: 'title', god: false, auto: false, paused: false, units: 1, t: 0, scroll: 0, fx: [], texts: [], stage: 0, cls: clsView(save.cls) };
let bannerObj = null;
const ST = () => S.ov || S.subSt || STAGES[S.stage];
const tOffNow = () => S.ov ? 0 : (S.tOff || 0);   // 小關比較短：用時間位移讓難度接近原本同一段   // 試煉塔／每週首領用 S.ov 覆寫關卡設定
const skHm = () => 1 + 0.05 * ST().ch;   // 有了局內武學後玩家更強，後面章節的敵人血量略為提高
function hm() { return S.endless ? 0.8 * Math.pow(1.02, S.t) * (1 + 0.1 * (S.wave - 1)) : ST().hm * (1 + (S.t + tOffNow()) / 50) * (S.hard ? hardM() : 1) * skHm(); }   // 無盡：時間＋波數雙重成長
function ft() { return S.endless ? S.t * 0.8 : S.t + tOffNow() + stEq(S.stage) * 6 + (S.hard ? HARD_FT : 0); }   // 敵人組成用的難度時間

function newRun(stage = S.stage) {
  seed = (Date.now() & 0xffff) + 1;
  // 單場制：每關就是一場完整戰鬥(原始長度與強度)，S.sub 固定為首領場以相容既有判斷
  const cls = clsView(save.cls), sm = 1 + 0.08 * starOf(cls.id), sr = 1 + 0.04 * starOf(cls.id);   // 升星：攻擊 +8%、射速 +4% / 星
  Object.assign(S, {
    mode: 'play', paused: false, stage, cls, endless: false, ov: null, tower: 0, weekly: null, wspd: 1, badG: false, maxCombo: 0, brk: 0, bossT0: 0, bossKillT: null, hard: !!S.wantHard, pools: [], poolT: 0,
    swing: 1, swingDir: 1, swingDur: 0.2, sparks: [], pops: [], sk: {}, xp: 0, lv: 0, pick: null, orbA: 0, exT: 1.2, fsw: [], exfx: [], thT: 1.5, fwT: 2, waves: [], bolts: [], shield: false, shieldT: 0, corpses: [], guide: null, t: 0, scroll: 0, hx: W / 2,
    units: 1 + save.up.hp + eqVal('arm'), atk: cls.atk * sm * (1 + 0.12 * save.up.atk) * (1 + eqVal('wpn') / 100), rate: cls.rate * sr * (1 + 0.05 * save.up.rate) * (1 + eqVal('art') / 100), spread: 0, pierce: false,
    bullets: [], enemies: [], gates: [], barrels: [], eshots: [], fx: [], texts: [], sub: SUBN - 1, subSt: null, tOff: 0, subDone: null,
    coinsRun: 0, kills: 0, boss: null, bossT: null, fireT: 0,
    tPack: 4, tGate: 1.2, tBarrel: 9, tBronze: Math.max(8, 24 - stEq(stage) * 4), shake: 0, result: null, firstGate: true, revived: false, inv: 0, peak: 0, marks: [], regT: 2.5, slow: 0, dmg: [], coinFx: [], combo: 0, comboT: 0, comboPop: 0, hs: 0, flash: 0, coinPulse: 0, tut: !save.tut && stage === 0 ? 5 : 0
  });
  const PB = petBonus(), pd = save.pet && petN(save.pet) ? petDef(save.pet) : null;
  S.atk *= (1 + PB.atk / 100) * (1 + ownTotal() / 100);   // 靈寵＋裝備持有效果 S.rate *= 1 + PB.rate / 100; S.units += PB.units; S.petCrit = (PB.crit + (pd && pd.sk === 'crit' ? pd.v : 0)) / 100;
  S.pet = pd ? { def: pd, t: pd.cd || 0, x: W / 2 + 64, y: HERO_Y - 78 } : null; S.petfx = []; S.petRev = false; S.coinM = pd && pd.sk === 'coin' ? 1 + pd.v / 100 : 1;
  S.relic = new Set(Object.values(save.relic || {})); S.rShT = 3; S.rBoltT = 6; S.rRegT = 0; S.rBurst = false; S.lastHurt = 0;   // 古物秘技
  if (S.relic.has('coin')) S.coinM = Math.min(2, S.coinM + 0.6);
  bannerObj = null;
  banner(`${S.hard ? '困難　' : ''}${stageLabel(stage)}　${ST().name}`, 1.6);
  logEv('stage_start', { st: stage, hard: S.hard ? 1 : 0, cls: cls.id });
  if (stage <= 1 && !S.hard) { S.tGate = 0.6; S.xp = 7; }   // 新手關：門更早出現、更快學到第一門武學
  dailyCheck();
}

function banner(txt, dur = 2) { bannerObj = { txt, life: dur, max: dur }; }
function text(x, y, txt, col = '#fff', size = 22) { if (S.texts.length < 80) S.texts.push({ x, y, txt, col, size, life: 0.9 }); }
function ring(x, y, col, r0 = 10, r1 = 50, life = 0.35) { if (fxLow() && r1 < 100) return; if (S.fx.length < 420) S.fx.push({ ring: true, x, y, vx: 0, vy: 0, r0, r1, col, life, max: life }); }
function burst(x, y, col, n = 8, sp = 160) {
  if (fxLow()) n = Math.ceil(n / 3);
  for (let i = 0; i < n && S.fx.length < 400; i++) {
    const a = Math.random() * 6.283, v = sp * (0.4 + Math.random());
    const life = 0.45 + Math.random() * 0.3; S.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, col, r: 2 + Math.random() * 3 });
  }
}

// ---------- 生成 ----------
function addEnemy(type, x, y) {
  if (S.enemies.length >= 110) return { dead: true };
  const R0 = ROSTER[ST().ch], horde = type === R0.basic || type === R0.zig || type === 'imp' || ED[type].mini;   // 雜兵：數量多、血量少
  const d = ED[type], hp = d.hp * hm() * (horde ? 0.5 : 1);
  const e = { horde, type, x, y, r: d.r, hp, max: hp, st: rr(0.5, d.shoot || 1), vx: d.zig ? (x < W / 2 ? d.zig : -d.zig) : 0, bx: x, ph: rnd() * 6.283 };
  S.enemies.push(e); return e;
}
function spawnPack() {
  const f = ft(), r = rnd(), R = ROSTER[ST().ch];
  if (S.t < 8) {   // 開場緩衝：只有少量一般敵人
    const cx = rr(90, W - 90);
    for (let i = 0; i < 6 + (S.stage > 1 ? 2 : 0); i++) addEnemy(R.basic, clamp(cx + rr(-90, 90), 44, W - 44), -30 - rr(0, 110));
    return;
  }
  if (f > 12 && r < 0.2) {
    for (let i = 0; i < 2 + (f > 45 ? 1 : 0); i++) addEnemy(R.shooter, rr(60, W - 60), -30 - i * 45);
  } else if (f > 25 && r < 0.38) {
    if (R.zig === 'shard') { const cx = rr(80, W - 80); for (let i = 0; i < 6; i++) addEnemy('shard', clamp(cx + rr(-60, 60), 44, W - 44), -30 - i * 34); }
    else if (R.zig === 'ghost') { const cx = rr(80, W - 80); for (let i = 0; i < 8; i++) addEnemy('ghost', clamp(cx + rr(-60, 60), 44, W - 44), -30 - i * 30); }
    else if (R.zig === 'spider') { const cx = rr(80, W - 80); for (let i = 0; i < 6; i++) addEnemy('spider', clamp(cx + rr(-70, 70), 44, W - 44), -30 - i * 40); }
    else if (R.zig === 'spy') { for (let i = 0; i < 5; i++) addEnemy('spy', rr(60, W - 60), -30 - i * 60); }
    else if (R.zig === 'bee') { const cx = rr(80, W - 80); for (let i = 0; i < 9; i++) addEnemy('bee', clamp(cx + rr(-50, 50), 44, W - 44), -30 - i * 24); }
    else for (let i = 0; i < 5; i++) addEnemy(R.zig, rnd() < 0.5 ? 50 : W - 50, -30 - i * 55);
  } else {
    const n = Math.min(24, Math.round(rr(6, 8 + f / 3.5))), cx = rr(100, W - 100);
    for (let i = 0; i < n; i++) addEnemy(R.basic, clamp(cx + rr(-110, 110), 44, W - 44), -30 - rr(0, 150));
  }
}
function genGate() {
  const f = ft();
  const good = () => {
    const r = rnd();
    if (r < 0.38) return { kind: 'add', val: Math.round(rr(2, 5 + f / 8)) };
    if (r < 0.48) return S.units < 60 ? { kind: 'mul', val: 2 } : { kind: 'add', val: Math.round(rr(6, 10 + f / 6)) };
    if (r < 0.70) return { kind: 'atk', val: Math.round(rr(20, 45) / 5) * 5 };
    if (r < 0.86) return { kind: 'rate', val: Math.round(rr(15, 30) / 5) * 5 };
    if (S.spread < 2 && rnd() < 0.6) return { kind: 'spread' };
    return S.pierce ? { kind: 'atk', val: 50 } : { kind: 'pierce' };
  };
  const bad = () => (S.stage > 2 && rnd() < 0.6) ? { kind: 'add', val: -Math.round(rr(3, 6 + f / 10)) } : { kind: 'atk', val: -Math.round(rr(20, 40) / 5) * 5 };   // 前三關的壞門只扣內力，不扣分身(新手保護)
  let a, b;
  if (S.firstGate) { a = { kind: 'add', val: 3 }; b = { kind: 'add', val: 5 }; S.firstGate = false; }
  else if (S.stage <= 1 && !S.endless && !S.hard && (S.easyGate = (S.easyGate || 0) + 1) <= 2) { a = { kind: 'mul', val: 2 }; b = { kind: 'atk', val: 30 }; if (rnd() < 0.5) [a, b] = [b, a]; }   // 新手關：前兩道門一定有好東西
  else { a = good(); b = rnd() < 0.45 ? bad() : good(); if (rnd() < 0.5) [a, b] = [b, a]; }
  S.gates.push({ y: -50, h: 64, L: { ...a, acc: 0 }, R: { ...b, acc: 0 } });
  if (!save.guide.gate) { save.guide.gate = true; banner('穿過藍門變強，避開紅門！', 2.6); }
}
function spawnBoss() {
  const d = BOSSES[S.endless ? (S.wave % 5 === 0 ? (ST().ch ? 'chief' + (ST().ch + 1) : 'chief') : (ST().ch ? 'elite' + (ST().ch + 1) : 'elite')) : ST().boss];
  const hp = Math.round(S.endless ? d.hp * 0.5 * hm() : d.hp * ST().hm * (S.hard ? hardM() : 1) * skHm());
  S.boss = { def: d, x: W / 2, y: -120, ty: 245, r: d.r, hp, max: hp, t: 0, atkT: 2.2, sumT: d.sumT - 1, chargeT: 7, state: 'enter', flash: 0, cx: W / 2, hitDone: false };
  if (S.weekly) { S.boss.hp = S.boss.max = S.weekly.cap; S.weekly.on = true; }
  S.bossT0 = S.t;
}
function spawner(dt) {
  if (S.weekly && S.weekly.on && S.boss) { if ((S.weekly.T -= dt) <= 0) { banner('時間到！', 1.5); endRun(true); return; } }
  if (S.endless) {   // 無盡試煉：每隔一段時間出現首領，打倒後繼續
    if (S.boss) return;
    if (S.t >= S.nextBoss) { banner(`第 ${S.wave} 波首領來襲！`, 2); sfx('warn'); spawnBoss(); return; }
  } else if (S.t >= ST().len && ST().noBoss) {   // 一般小關：走完這段路就過關
    if (S.subDone === null) { S.subDone = 1.6; banner('小關突破！', 1.4); sfx('gate'); }
    if ((S.subDone -= dt) <= 0) endRun(true);
    return;
  } else if (S.t >= ST().len) {
    if (S.bossT === null) { S.bossT = 3; banner(BOSSES[ST().boss].name + ' 來襲！', 2.5); sfx('warn'); }
    if (S.bossT > 0) { S.bossT -= dt; if (S.bossT <= 0) spawnBoss(); }
    return;
  }
  if ((S.tPack -= dt) <= 0) { S.tPack = Math.max(0.9, 2.4 - ft() / 45) * (wkMod('swarm') ? 0.55 : 1); spawnPack(); }
  if ((S.tGate -= dt) <= 0) { S.tGate = 6.5; genGate(); }
  if ((S.tBarrel -= dt) <= 0) { S.tBarrel = rr(7, 10); const hp = 50 * hm(); S.barrels.push({ x: rr(60, W - 60), y: -40, r: 22, hp, max: hp }); }
  if ((S.tBronze -= dt) <= 0) { S.tBronze = rr(10, 14); addEnemy(ROSTER[ST().ch].tank, rr(80, W - 80), -40); }
}

// ---------- 門 ----------
function gateLabel(g) {
  const s = v => (v > 0 ? '+' : '') + v;
  switch (g.kind) {
    case 'add': return '分身 ' + s(g.val);
    case 'mul': return '分身 ×' + g.val;
    case 'atk': return (g.val < 0 ? '走火入魔 ' : '內力 ') + s(g.val) + '%';
    case 'rate': return '身法 ' + s(g.val) + '%';
    case 'spread': return S.cls.id === 'blade' ? '刀氣分裂' : S.cls.id === 'bow' ? '多重箭' : '散射劍氣';
    case 'pierce': return S.cls.id === 'blade' ? '刀氣延長' : S.cls.id === 'bow' ? '破甲箭' : '穿透劍氣';
  }
  return '';
}
function gateGood(g) { return g.val === undefined || g.val > 0; }
function gateGrow(g) {
  if (g.kind !== 'add' && g.kind !== 'atk' && g.kind !== 'rate') return;
  if (g.base === undefined) g.base = g.val;
  g.acc += 1;
  const step = 6 + Math.min(S.units, MAXSHOOT) * (S.spread ? 2 : 1);
  if (g.acc < step) return;
  g.acc = 0;
  const inc = g.kind === 'add' ? 1 : 5, cap = g.kind === 'add' ? Math.max(g.base, 0) + 10 : g.kind === 'atk' ? 60 : 50;
  if (g.val < cap) { g.val = Math.min(cap, g.val + inc); if (g.val === 0) g.val = inc; }
}
function popClones(n) {   // 分身增加時：陣型裡一個個冒出來，伴隨「啵啵啵」音效
  if (n <= 0) return;
  S.pops2 = { n: Math.min(n, 24), t: 0, from: Math.max(1, Math.min(S.units - n, 59)) }; AU.tickN = 0;
}
function applyGate(g) {
  if (g.val < 0) S.badG = true;   // 關卡挑戰：碰過紅門
  stat('gates');
  track('gate');
  const c = S.cls;
  switch (g.kind) {
    case 'add': { const u0 = S.units; S.units = clamp(S.units + g.val, 1, MAXU); popClones(S.units - u0); break; }
    case 'mul': { const u0 = S.units; S.units = Math.min(MAXU, Math.round(S.units * g.val)); popClones(S.units - u0); S.hs = Math.max(S.hs || 0, 0.06); flash(0.12); break; }
    case 'atk': S.atk = Math.max(c.atk * 0.3, S.atk + c.atk * g.val / 100); break;
    case 'rate': S.rate = clamp(S.rate + c.rate * g.val / 100, 1, 12); break;
    case 'spread': S.spread = Math.min(2, S.spread + 1); break;
    case 'pierce': S.pierce = true; break;
  }
  const good = gateGood(g);
  text(S.hx, HERO_Y - squadR() - 30, gateLabel(g), good ? '#7ff0ff' : '#ff7b6b', 28);
  burst(S.hx, HERO_Y, good ? '#7fd8ff' : '#ff6655', 16, 220);
  ring(S.hx, HERO_Y, good ? '#9fe6ff' : '#ff7b6b', 20, 140, 0.5);
  sfx(good ? 'gate' : 'bad');
}

// ---------- 戰鬥 ----------
function hurt(n) {
  if (S.god || S.mode !== 'play' || S.inv > 0) return;
  if (S.shield) { if (S.sk.shield && S.sk.clone) { const u0 = S.units; S.units = Math.min(MAXU, S.units + 2); popClones(S.units - u0); }
    S.shield = false; S.shieldT = S.sk.ev_frost ? 4 : 14 - 2 * (S.sk.shield || 1); S.inv = 0.4; ring(S.hx, HERO_Y, '#ffd23a', 20, squadR() + 70, 0.45); burst(S.hx, HERO_Y - 10, '#ffe08a', 14, 240); text(S.hx, HERO_Y - 70, '金鐘罩', '#ffd23a', 24); sfx('up'); return; }
  if (S.cls.id === 'healer') n = Math.max(1, Math.round(n * 0.7));   // 醫仙受傷減少
  S.units -= n; S.shake = Math.min(14, S.shake + 4 + n); S.lastHurt = S.t;
  if (S.relic && S.relic.has('burst') && !S.rBurst && S.units <= Math.max(2, Math.floor((S.peak || 10) * 0.15))) relicBurst();   // 玉石俱焚：每場一次
  text(S.hx + rr(-20, 20), HERO_Y - 40, '-' + n, '#ff5a4a', 26);
  sfx('hurt');
  if (S.units <= 0 && S.pet && S.pet.def.sk === 'revive' && !S.petRev) {   // 鳳凰：浴火重生一次
    S.petRev = true; S.units = S.pet.def.n; S.inv = 1.5; flash(0.4); S.hs = 0.3; ring(S.hx, HERO_Y, '#ffb03a', 20, 260, 0.8); burst(S.hx, HERO_Y - 20, '#ffcf4a', 40, 380); banner('鳳凰涅槃・浴火重生！', 1.8); sfx('win'); popClones(S.units); return;
  }
  if (S.units <= 0) { S.units = 0; endRun(false); }
}
function killEnemy(e) {
  if (S.boss && S.units <= 3 && S.units >= 1 && Math.random() < 0.5 && S.units < 10) { S.units++; popClones(1); text(e.x, e.y - 20, '分身 +1', '#8fffd0', 20); }   // 死局保底：首領戰打倒小怪可以補兵，不會卡在打不動

  if (ED[e.type].burst && e.y < HERO_Y - 200) for (const a of [-0.55, 0.55]) S.eshots.push({ x: e.x, y: e.y, vx: Math.sin(a) * 170, vy: Math.cos(a) * 170, r: 6, dmg: 1, col: '#c8f4ff' });   // 冰魄碎裂成兩片，往兩側斜飛
  if (ED[e.type].split && S.enemies.length < 120) { for (const dx of [-16, 16]) addEnemy(ED[e.type].split, clamp(e.x + dx, 25, W - 25), e.y); }   // 屍傀死後分裂
  const d = ED[e.type]; if (!e.horde || Math.random() < 0.5) { S.coinsRun += d.coin; if (Math.random() < (S.coinM || 1) - 1) S.coinsRun += d.coin; } S.kills++; track('kill'); stat('kills');
  addCombo(); if (Math.random() < (d.coin > 1 ? 1 : 0.45)) coinFly(e.x, e.y);
  if (d.r >= 25) { S.hs = Math.max(S.hs || 0, 0.09); S.shake = Math.max(S.shake, 8); flash(0.06); sfx('thud'); }   // 大型敵人倒下：頓幀
  burst(e.x, e.y, d.col, d.r >= 25 ? 18 : 8);
  ring(e.x, e.y, '#fff2c0', 8, e.r * 2.6, 0.3);
  if (!fxLow() && S.pops.length < 18) S.pops.push({ x: e.x, y: e.y, t: 0.35, w: e.r * 3.6 });
  if (!fxLow() && S.corpses.length < 28 && spr(e.type)) S.corpses.push({ k: e.type, x: e.x, y: e.y, vx: (e.x - S.hx) * 0.6 + rr(-90, 90), vy: -rr(260, 380), r: 0, vr: rr(-9, 9), t: 0 });
  gainXp(d.r >= 25 ? 6 : d.shoot ? 2 : e.horde ? 0.7 : 1);
  if (S.sk.vamp && Math.random() < 0.03 * S.sk.vamp * (S.sk.ev_clone ? 3 : 1) * (S.sk.crit ? 1.6 : 1) && S.units < MAXU) { S.units++; if (Math.random() < 0.3) text(S.hx + rr(-30, 30), HERO_Y - 60, '吸星 +1', '#c8a0ff', 18); }
  sfx('kill');
}
function breakBarrel(b) {
  track('barrel'); stat('barrels'); S.brk++;
  burst(b.x, b.y, '#a8743a', 16, 220); burst(b.x, b.y, '#d8382b', 6, 140); ring(b.x, b.y, '#ffe0a0', 10, 60, 0.35); sfx('barrel');
  const r = Math.random(), c = S.cls;
  if (r < 0.35) { const n = 3 + Math.floor(Math.random() * 3); S.units = Math.min(MAXU, S.units + n); text(b.x, b.y, '分身 +' + n, '#7ff0ff'); }
  else if (r < 0.55) { S.atk += c.atk * 0.15; text(b.x, b.y, '內力 +15%', '#ffd36b'); }
  else if (r < 0.75) { S.rate = Math.min(12, S.rate + c.rate * 0.15); text(b.x, b.y, '身法 +15%', '#9bff8a'); }
  else { S.coinsRun += 15; text(b.x, b.y, '銅錢 +15', '#ffd700'); sfx('coin'); }
}
function fire(dt) {   // 手機一卡頓、一格時間變長時，把該出的招補出來(最多補 3 輪)，傷害不會因為掉幀而變少
  S.fireT -= dt; let k = 0;
  while (S.fireT <= 0 && k < 3) { S.fireT += 1 / S.rate; k++; volley(); }
  if (S.fireT < 0) S.fireT = 0;
}
function volley() {
  const id = S.cls.id, n = Math.min(S.units, MAXSHOOT), dmg = S.atk * S.units / n;
  let angs;
  if (id === 'blade') angs = S.spread === 0 ? [0] : S.spread === 1 ? [-0.35, 0, 0.35] : [-0.6, -0.3, 0, 0.3, 0.6];
  else angs = S.spread === 0 ? [0] : S.spread === 1 ? [-0.18, 0, 0.18] : [-0.34, -0.17, 0, 0.17, 0.34];
  for (let i = 0; i < n; i++) {
    const p = FPOS[i];
    for (const a of angs) {
      if (S.bullets.length >= 700) break;
      const d = a === 0 ? dmg : dmg * 0.6;
      const b = { k: 'line', x: S.hx + p.x, y: HERO_Y + p.y - 14, a, dmg: d, r: 5, life: 2, pierce: S.pierce ? 3 : 0, hits: null, dead: false };
      let sp = 900;
      if (id === 'blade') { b.k = 'arc'; sp = 650; b.r = 26; b.life = S.pierce ? 1.1 : 0.82; b.pierce = 999; }   // 刀客：約 530
      else if (id === 'bow') { b.k = 'arrow'; sp = 1150; b.pierce = 2 + (S.pierce ? 3 : 0); b.y0 = b.y; }   // 弓手：飛滿全畫面
      else if (id === 'dart') { b.k = 'dart'; sp = 720; b.life = 1.6; b.r = 6; b.pierce = S.pierce ? 1 : 0; }   // 暗器師：追蹤
      else if (id === 'demon') { b.k = 'orb'; sp = 520; b.life = 1.3; b.r = 10; b.pierce = 0; b.aoe = S.pierce ? 105 : 80; }   // 魔教傳人：爆炸
      else { b.life = S.pierce ? 0.85 : 0.7; }   // 劍客、醫仙：約 630
      if (S.sk.pierce && b.k !== 'arc' && b.k !== 'orb') b.pierce += S.sk.pierce;
      b.vx = Math.sin(a) * sp; b.vy = -Math.cos(a) * sp; b.max = b.life;
      S.bullets.push(b);
    }
  }
  sfx('shoot');
  S.swing = 0; S.swingDir = -(S.swingDir || 1); S.swingDur = Math.min(0.2, 0.85 / S.rate);   // 揮擊動畫：左右交替
}
let ORB = null;
function orbSprite() {   // 黑炎火球預先畫好，避免每顆都建立漸層
  if (ORB) return ORB;
  ORB = document.createElement('canvas'); ORB.width = ORB.height = 72;
  const x = ORB.getContext('2d'), g = x.createRadialGradient(36, 36, 4, 36, 36, 36);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#c04aff'); g.addColorStop(1, 'rgba(60,0,80,0)');
  x.fillStyle = g; x.beginPath(); x.arc(36, 36, 36, 0, 6.283); x.fill(); return ORB;
}
// ---------- 武學：打怪累積悟性，升級時三選一(只在本局有效) ----------
const SKILLS = [
  { id: 'atk',    name: '劍意凌雲', ch: '劍', col: '#ff6a4a', max: 5, d: () => '攻擊力 +20%' },
  { id: 'rate',   name: '疾風步',   ch: '風', col: '#7aff8a', max: 5, d: () => '出招速度 +15%' },
  { id: 'clone',  name: '分身術',   ch: '分', col: '#7ff0ff', max: 5, d: l => `立刻增加 ${4 + l * 2} 個分身` },
  { id: 'orbit',  name: '飛刀護體', ch: '刀', col: '#c8e8ff', max: 5, d: l => `${1 + l} 把飛刀繞身旋轉，砍敵人、擋暗器` },
  { id: 'thunder', name: '天雷引',  ch: '雷', col: '#b48aff', max: 5, d: l => `每 2.6 秒落雷劈 ${l + 1} 個敵人` },
  { id: 'fire',   name: '火龍出海', ch: '火', col: '#ff9a2e', max: 5, d: l => `每 ${(5 - l * 0.5).toFixed(1)} 秒放出火牆往前燒` },
  { id: 'frost',  name: '寒冰掌',   ch: '冰', col: '#9fe8ff', max: 3, d: l => `打中的敵人變慢 ${20 + l * 10}%` },
  { id: 'vamp',   name: '吸星大法', ch: '吸', col: '#c8a0ff', max: 5, d: l => `擊殺有 ${l * 3}% 機率多一個分身` },
  { id: 'crit',   name: '暴擊心法', ch: '爆', col: '#ffd23a', max: 5, d: l => `暴擊率提高到 ${10 + l * 8}%` },
  { id: 'shield', name: '金鐘罩',   ch: '罩', col: '#ffc23a', max: 4, d: l => `每 ${14 - l * 2} 秒擋下一次傷害` },
  { id: 'pierce', name: '穿雲勁',   ch: '穿', col: '#e8f4ff', max: 3, d: l => `劍氣多穿透 ${l} 個敵人`, no: ['blade', 'demon'] },
  // 職業專屬武學：只會出現在該職業的三選一，出現機率較高
  // 武學進化：主武學練到 Lv3、搭配武學學過，就會出現進化選項(只能選一次，效果大幅強化)
  { id: 'ev_orbit',   evo: ['orbit', 'rate'],    name: '萬刃風暴', ch: '刃', col: '#9fe8ff', max: 1, d: () => '飛刀加倍、轉得更快更遠，傷害翻倍' },
  { id: 'ev_thunder', evo: ['thunder', 'crit'],  name: '九天神雷', ch: '霆', col: '#c8a0ff', max: 1, d: () => '天雷 1.2 秒一次，劈 8 個敵人必暴擊' },
  { id: 'ev_fire',    evo: ['fire', 'atk'],      name: '焚天火龍', ch: '焚', col: '#ff7a2a', max: 1, d: () => '火牆 1.5 秒一道，兩倍寬、傷害翻倍' },
  { id: 'ev_frost',   evo: ['frost', 'shield'],  name: '玄冰金身', ch: '玄', col: '#bfefff', max: 1, d: () => '金鐘罩 4 秒恢復，全場敵人變慢 40%' },
  { id: 'ev_clone',   evo: ['vamp', 'clone'],    name: '化身萬千', ch: '化', col: '#7ff0ff', max: 1, d: () => '每 5 秒多 3 個分身，吸星機率 3 倍' },
  { id: 'ex_sword',  cls: 'sword',  name: '萬劍歸宗', ch: '萬', col: '#7fd8ff', max: 5, d: l => `每 ${(4.2 - 0.4 * l).toFixed(1)} 秒從天降下 ${6 + 2 * l} 把飛劍` },
  { id: 'ex_blade',  cls: 'blade',  name: '旋風斬',   ch: '旋', col: '#ffb03a', max: 5, d: l => `每 ${(5 - 0.5 * l).toFixed(1)} 秒迴旋一圈，砍飛身邊所有敵人` },
  { id: 'ex_bow',    cls: 'bow',    name: '穿雲連珠', ch: '連', col: '#fff0b0', max: 5, d: l => `每 ${(3.2 - 0.3 * l).toFixed(1)} 秒連射 ${2 + l} 支巨箭，射穿最前面的敵人` },
  { id: 'ex_dart',   cls: 'dart',   name: '暴雨梨花針', ch: '雨', col: '#dfe6f0', max: 5, d: l => `每 ${(4.5 - 0.4 * l).toFixed(1)} 秒向四面八方射出 ${12 + 4 * l} 枚追蹤暗器` },
  { id: 'ex_healer', cls: 'healer', name: '回春妙手', ch: '春', col: '#8fffd0', max: 5, d: l => `每 ${(6.5 - 0.5 * l).toFixed(1)} 秒補回 ${3 + 2 * l} 個分身，並震傷身邊敵人` },
  { id: 'ex_demon',  cls: 'demon',  name: '天魔解體', ch: '魔', col: '#c04aff', max: 5, d: l => `每 ${(6 - 0.5 * l).toFixed(1)} 秒在敵人最密集處引爆黑炎` },
];
const skDef = id => SKILLS.find(k => k.id === id);
const xpNeed = lv => 14 + lv * 10;
const frostAmt = () => S.sk && S.sk.frost ? 0.1 + 0.1 * S.sk.frost : 0;
const frostAll = () => !!(S.sk && S.sk.ev_frost);
const skPow = () => S.atk * Math.max(1, Math.sqrt(S.units) * 2.2) * (1 + eqVal('jad') / 100);   // 武學傷害：跟攻擊力、分身數一起成長
function gainXp(n) {
  if (S.endless === undefined || S.mode !== 'play') return;
  S.xp += n;
  if (!S.pick && S.xp >= xpNeed(S.lv)) { S.xp -= xpNeed(S.lv); S.lv++; offerSkills(); }
}
const SYN = [   // 武學共鳴：兩門武學都學過就自動觸發，不用另外選
  { id: 'icefan',  a: 'frost',   b: 'orbit', name: '冰刃', d: '飛刀附帶寒冰減速' },
  { id: 'thfire',  a: 'thunder', b: 'fire',  name: '雷火', d: '天雷傷害 +30%，落點炸出火花' },
  { id: 'blood',   a: 'vamp',    b: 'crit',  name: '嗜血', d: '吸星機率 +60%' },
  { id: 'rebound', a: 'shield',  b: 'clone', name: '金身化影', d: '金鐘罩擋下攻擊時，分身 +2' },
];
const synOn = id => { const x = SYN.find(q => q.id === id); return !!(x && S.sk && S.sk[x.a] && S.sk[x.b]); };
function synIcon(sy, x, y, size) {
  if (drawIcon('ico_syn_' + sy.id, x, y, size)) return;
  const r = size * 0.42, g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, '#2a4a5a'); g.addColorStop(1, '#0c1a22');
  ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.lineWidth = Math.max(1.5, size * 0.06); ctx.strokeStyle = '#9fe8ff'; ctx.stroke();
  ctx.fillStyle = '#dff8ff'; ctx.font = `900 ${Math.round(size * 0.42)}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sy.name[0], x, y + 1); ctx.restore();
}
function offerSkills() {
  const evoOk = k => !k.evo || ((S.sk[k.evo[0]] || 0) >= 3 && (S.sk[k.evo[1]] || 0) >= 1);
  const pool = SKILLS.filter(k => (S.sk[k.id] || 0) < k.max && !(k.no && k.no.includes(S.cls.id)) && (!k.cls || k.cls === S.cls.id) && evoOk(k));
  if (!pool.length) return;
  const opts = [];
  while (opts.length < 3 && pool.length) { const w = pool.map(k => (k.evo ? 12 : k.cls ? 2.6 : 1) * (S.sk[k.id] ? 1 : 1.6)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, i = 0; while ((r -= w[i]) > 0) i++; opts.push(pool.splice(i, 1)[0].id); }
  S.pick = { opts, at: AT }; drag.on = false; keys.left = keys.right = false; sfx('up');
  if (S.auto) pickSkill(opts[0]);
}
function pickSkill(id) {
  const k = skDef(id); if (!k || !S.pick) return;
  const l = (S.sk[id] || 0) + 1; S.sk[id] = l; S.pick = null;
  if (id === 'atk') S.atk *= 1.2;
  else if (id === 'rate') S.rate = Math.min(14, S.rate * 1.15);
  else if (id === 'clone') { const n = 4 + l * 2; S.units = Math.min(MAXU, S.units + n); text(S.hx, HERO_Y - 70, '分身 +' + n, '#7ff0ff', 26); }
  else if (id === 'shield') S.shieldT = 0.5;
  if (k.evo) { ring(S.hx, HERO_Y, '#ffd23a', 30, 320, 0.8); burst(S.hx, HERO_Y - 20, '#ffd23a', 40, 420); flash(0.3); S.shake = 14; sfx('win'); sfx('gate'); sfx('crit');
    S.evoFx = { id, t: 0 }; logEv('skill', { id, l, st: S.stage }); return; }   // 進化特寫：畫面停 1.4 秒，演完再接下一次選擇
  else { ring(S.hx, HERO_Y, k.col, 20, 140, 0.5); burst(S.hx, HERO_Y - 20, k.col, 16, 260); flash(0.12);
  banner(`${k.name}${l > 1 ? ' Lv' + l : ''}`, 1.0); sfx('win'); }
  logEv('skill', { id, l, st: S.stage });
  if (l === 1) { const ns = SYN.find(x => (x.a === id || x.b === id) && synOn(x.id)); if (ns) { setTimeout(() => { if (S.mode === 'play') { banner('武學共鳴・' + ns.name + '！', 1.6); S.synPop = { sy: ns, t: 0 }; sfx('gate'); ring(S.hx, HERO_Y, '#9fe8ff', 20, 200, 0.6); text(S.hx, HERO_Y - 96, ns.d, '#bff4ff', 20); } }, 1100); } }
  if (S.xp >= xpNeed(S.lv)) { S.xp -= xpNeed(S.lv); S.lv++; offerSkills(); }   // 一次升好幾級就連續選
}
let BLADE = null;
function bladeSprite() {   // 飛刀圖預先畫好
  if (BLADE) return BLADE;
  BLADE = document.createElement('canvas'); BLADE.width = 64; BLADE.height = 64;
  const x = BLADE.getContext('2d'); x.translate(32, 32);
  const g = x.createRadialGradient(0, 0, 2, 0, 0, 30); g.addColorStop(0, 'rgba(160,220,255,.7)'); g.addColorStop(1, 'rgba(160,220,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 30, 0, 6.283); x.fill();
  x.fillStyle = '#f4fbff'; x.strokeStyle = '#3a6a9a'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, -24); x.lineTo(6, 4); x.lineTo(0, 10); x.lineTo(-6, 4); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#c89a3a'; x.fillRect(-7, 10, 14, 4); x.fillStyle = '#7a3a1a'; x.fillRect(-2, 14, 4, 9);
  return BLADE;
}
function skillDmg(t, dm) {   // 武學打中小怪(無視護甲)
  if (t.dead) return;
  t.hp -= dm; t.fl = 0.07; t.kbT = 0.08; showDmg(t, dm, false);
  if (t.hp <= 0) { t.dead = true; killEnemy(t); }
}
function exFx(k, x, y, t, o = {}) { if (S.exfx.length < 40) S.exfx.push(Object.assign({ k, x, y, t, max: t }, o)); }
function exHit(t, dm) {   // 回傳 true 代表這局結束(打倒首領)
  if (t === S.boss) return hitBoss(dm);
  skillDmg(t, dm); return false;
}
function updateExclusive(dt) {   // 職業專屬武學
  const K = S.sk, id = S.cls.id, lv = K['ex_' + id];
  for (const f of S.exfx) f.t -= dt; S.exfx = S.exfx.filter(f => f.t > 0);
  const B = S.boss, bossOk = B && B.state !== 'enter';
  for (const w of S.fsw) {   // 萬劍歸宗的飛劍往下落
    w.y += 1250 * dt; if (w.y > H + 40) { w.dead = true; continue; }
    for (const e of S.enemies) if (!e.dead && Math.abs(e.x - w.x) < e.r + 14 && Math.abs(e.y - w.y) < e.r + 30 && w.hit.indexOf(e) < 0) { w.hit.push(e); skillDmg(e, skPow() * 2.2); addSpark(e.x, e.y, '#bfefff'); }
    if (bossOk && Math.abs(B.x - w.x) < B.r && Math.abs(B.y - w.y) < B.r && w.hit.indexOf(B) < 0) { w.hit.push(B); addSpark(w.x, w.y, '#bfefff'); if (hitBoss(skPow() * 2.2)) return true; }
  }
  S.fsw = S.fsw.filter(w => !w.dead);
  if (!lv || (S.exT -= dt) > 0) return false;
  const live = S.enemies.filter(e => !e.dead && e.y > 30 && e.y < HERO_Y && !(ED[e.type].phase && !e.vis));
  if (id === 'sword') {
    S.exT = 4.2 - 0.4 * lv; const n = 6 + 2 * lv;
    for (let i = 0; i < n; i++) S.fsw.push({ x: 40 + (W - 80) * (i + Math.random() * 0.8) / n, y: -40 - Math.random() * 160, hit: [] });
    sfx('bslash');
  } else if (id === 'blade') {
    S.exT = 5 - 0.5 * lv; const R = squadR() + 120 + lv * 14, dm = skPow() * (2.4 + 0.3 * lv);
    exFx('spin', S.hx, HERO_Y - 10, 0.45, { r: R });
    for (const e of live) if ((e.x - S.hx) ** 2 + (e.y - HERO_Y) ** 2 < (R + e.r) ** 2) { e.y -= 50; skillDmg(e, dm); }
    S.shake = Math.max(S.shake, 8); sfx('bslash');
    if (bossOk && (B.x - S.hx) ** 2 + (B.y - HERO_Y) ** 2 < (R + B.r) ** 2 && hitBoss(dm)) return true;
  } else if (id === 'bow') {
    S.exT = 3.2 - 0.3 * lv; const n = 2 + lv, tg = live.slice().sort((a, b) => b.y - a.y).slice(0, n);
    if (bossOk && tg.length < n) tg.push(B);
    if (!tg.length) { S.exT = 0.5; return false; }
    for (const t of tg) {
      const x0 = S.hx, y0 = HERO_Y - 40, a = Math.atan2(t.y - y0, t.x - x0);
      exFx('beam', x0, y0, 0.3, { a, L: 1200 });
      const dm = skPow() * (1.8 + 0.2 * lv);
      for (const e of live) { const dx = e.x - x0, dy = e.y - y0, along = dx * Math.cos(a) + dy * Math.sin(a), off = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); if (along > 0 && off < e.r + 12) skillDmg(e, dm); }
      if (t === B && hitBoss(dm)) return true;
    }
    sfx('shoot');
  } else if (id === 'dart') {
    S.exT = 4.5 - 0.4 * lv; const n = 12 + 4 * lv, dm = skPow() * 0.55;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n - 0.5) * Math.PI * 1.6; S.bullets.push({ k: 'dart', x: S.hx, y: HERO_Y - 30, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, a: 0, dmg: dm, r: 6, life: 1.5, max: 1.5, pierce: 0, hits: null, dead: false }); }
    ring(S.hx, HERO_Y - 30, '#dfe6f0', 10, 90, 0.35); sfx('shoot');
  } else if (id === 'healer') {
    S.exT = 6.5 - 0.5 * lv; const n = 3 + 2 * lv, R = 230;
    S.units = Math.min(MAXU, S.units + n); S.inv = Math.max(S.inv, 0.5);
    text(S.hx, HERO_Y - 80, '回春 +' + n, '#8fffd0', 26); exFx('jade', S.hx, HERO_Y - 10, 0.6, { r: R }); sfx('up');
    for (const e of live) if ((e.x - S.hx) ** 2 + (e.y - HERO_Y) ** 2 < R * R) skillDmg(e, skPow() * 1.4);
  } else if (id === 'demon') {
    S.exT = 6 - 0.5 * lv; let tx, ty, best = -1;
    if (bossOk) { tx = B.x; ty = B.y; }
    else { for (const e of live) { let c = 0; for (const o of live) if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 < 120 * 120) c++; if (c > best) { best = c; tx = e.x; ty = e.y; } } }
    if (tx === undefined) { S.exT = 0.5; return false; }
    const R = 120 + 15 * lv, dm = skPow() * (3.5 + 0.4 * lv);
    exFx('blast', tx, ty, 0.6, { r: R }); S.shake = Math.max(S.shake, 12); flash(0.12); sfx('barrel'); burst(tx, ty, '#c04aff', 20, 300);
    for (const e of live) if ((e.x - tx) ** 2 + (e.y - ty) ** 2 < (R + e.r) ** 2) skillDmg(e, dm);
    if (bossOk && (B.x - tx) ** 2 + (B.y - ty) ** 2 < (R + B.r) ** 2 && hitBoss(dm)) return true;
  }
  return false;
}
function drawExclusive() {
  for (const w of S.fsw || []) if (!fxDraw('fx_b_sword', w.x, w.y, 22, Math.PI)) { ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x, w.y - 50); ctx.stroke(); }
  for (const f of S.exfx || []) {
    const p = 1 - f.t / f.max, a = f.t / f.max;
    if (f.k === 'spin') { for (let i = 0; i < 3; i++) fxDraw('fx_slash_gold', f.x, f.y, f.r * 1.7, p * 6.283 * 1.5 + i * 2.094, a, 1, 0.6); }
    else if (f.k === 'beam') { const a2 = spr('fx_b_arrow'); ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.PI / 2); ctx.globalAlpha = a; if (a2) ctx.drawImage(a2.img, -14, -f.L, 28, f.L); else { ctx.fillStyle = '#fff0b0'; ctx.fillRect(-4, -f.L, 8, f.L); } ctx.restore(); ctx.globalAlpha = 1; }
    else if (f.k === 'jade' && spr('fx_jadering')) { fxDraw('fx_jadering', f.x, f.y, f.r * 2.2 * (0.3 + p * 0.7), 0, a); fxDraw('fx_star', f.x, f.y - 40, 60 + 60 * p, p * 2, a); }
    else if (f.k === 'jade') { ctx.globalAlpha = a; ctx.strokeStyle = '#8fffd0'; ctx.lineWidth = 8 * a + 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * p, f.r * p * 0.55, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; fxDraw('fx_star', f.x, f.y - 40, 60 + 60 * p, p * 2, a); }
    else if (f.k === 'blast') { fxDraw('fx_magic', f.x, f.y, f.r * 2.4, p * 3, a, 1, 0.6); fxDraw('fx_wave', f.x, f.y, f.r * 2 * (0.4 + p), 0, a); fxDraw('fx_b_orb', f.x, f.y - 20 - 60 * p, 70, 0, a); }
  }
  ctx.globalAlpha = 1;
}
function updatePet(dt) {   // 出戰靈寵：跟著主角飛、定時出招
  const P = S.pet; if (!P) return false; const d = P.def;
  const side = S.hx > W - 170 ? -1 : S.hx < 170 ? 1 : (P.side || 1); P.side = side; P.wt = (P.wt || 0) + dt;
  const off = clamp(squadR() * 0.8 + 50, 84, 136), tx = S.hx + side * (off + Math.sin(P.wt * 1.3) * 12), ty = HERO_Y - 62 + Math.sin(P.wt * 2.6) * 9;   // 在隊伍外側畫 8 字飄移，不擋分身數
  const ox = P.x; P.x += (tx - P.x) * Math.min(1, dt * 4); P.y += (ty - P.y) * Math.min(1, dt * 5);
  P.vx = (P.vx || 0) * 0.85 + (P.x - ox) / Math.max(dt, 1e-3) * 0.15;
  if (Math.abs(P.vx) > 25) P.face = P.vx > 0 ? 1 : -1;   // 往哪邊飛就轉向哪邊
  P.fs = (P.fs === undefined ? 1 : P.fs) + ((P.face || 1) - (P.fs === undefined ? 1 : P.fs)) * Math.min(1, dt * 10);
  if (P.lunge > 0) P.lunge = Math.max(0, P.lunge - dt * 3.2);
  P.tr = P.tr || []; P.trT = (P.trT || 0) - dt;
  if (P.trT <= 0 && !fxLow()) { P.trT = 0.07; P.tr.push({ x: P.x + rr(-10, 10), y: P.y + rr(-6, 14), t: 0.6, r: rr(2, 4) }); if (P.tr.length > 16) P.tr.shift(); }
  for (const q of P.tr) { q.t -= dt; q.y += 18 * dt; }
  for (const f of S.petfx) f.t -= dt; S.petfx = S.petfx.filter(f => f.t > 0);
  if (!d.cd || (P.t -= dt) > 0) return false;
  P.t = d.cd; P.cast = 0.25; P.lunge = 1;
  if (d.sk === 'clone') { const u0 = S.units; S.units = Math.min(MAXU, S.units + d.n); popClones(S.units - u0); text(P.x, P.y - 34, '分身 +' + d.n, d.col, 20); return false; }
  if (d.sk === 'shield') { if (!S.shield) { S.shield = true; ring(S.hx, HERO_Y, d.col, 20, squadR() + 40, 0.4); text(P.x, P.y - 34, '護體', d.col, 20); } return false; }
  const B = S.boss, bossOk = B && B.state !== 'enter', n = d.sk === 'shot' ? 1 : d.n, tg = [];
  if (bossOk) tg.push(B);
  const pool = S.enemies.filter(e => !e.dead && e.y > 30 && e.y < HERO_Y - 30 && !(ED[e.type].phase && !e.vis)).sort((a, b) => b.y - a.y);
  while (tg.length < n && pool.length) tg.push(pool.shift());   // 先打最靠近的
  if (!tg.length) { P.t = 0.3; P.lunge = 0; return false; }
  { const t0 = tg[0], dx = t0.x - P.x, dy = t0.y - P.y, dl = Math.hypot(dx, dy) || 1; P.lx = dx / dl; P.ly = dy / dl; if (Math.abs(dx) > 8) P.face = dx > 0 ? 1 : -1; }
  const dm = skPow() * d.k * petPow(d.id);
  for (const t of tg) {
    if (d.sk === 'bolt') { const pts = [[t.x + rr(-30, 30), -10]]; let y = -10; while (y < t.y - 20) { y += rr(40, 80); pts.push([t.x + rr(-26, 26), Math.min(y, t.y)]); } pts.push([t.x, t.y]); S.bolts.push({ pts, t: 0.28 }); }
    else S.petfx.push({ x1: P.x, y1: P.y, x2: t.x, y2: t.y, t: 0.22 });
    ring(t.x, t.y, d.col, 6, 46, 0.3); burst(t.x, t.y, d.col, 6, 180);
    if (t === B) { if (hitBoss(dm)) return true; } else skillDmg(t, dm);
  }
  sfx('hit'); return false;
}
function petFallback(d, x, y, r) {   // 靈寵美術還沒到：發光圓＋字
  const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, d.col); g.addColorStop(1, d.col + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2a1608'; ctx.font = `900 ${Math.round(r * 0.8)}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.ch, x, y + 1);
}
function drawPet() {
  const P = S.pet; if (!P) return; const d = P.def;
  ctx.save(); ctx.lineCap = 'round';
  for (const f of S.petfx) { ctx.globalAlpha = f.t / 0.22; ctx.strokeStyle = d.col; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.globalCompositeOperation = 'lighter';
  for (const q of P.tr || []) { if (q.t <= 0) continue; ctx.globalAlpha = q.t / 0.6 * 0.8; ctx.fillStyle = d.col; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.5 + q.t), 0, 6.283); ctx.fill(); }   // 元素拖尾光點
  ctx.restore(); ctx.globalAlpha = 1;
  const sz = 64 + d.g * 7, L = P.lunge > 0 ? Math.sin(P.lunge * Math.PI) : 0;   // 撲擊：0→1→0
  const x = P.x + (P.lx || 0) * L * 18, y = P.y + (P.ly || 0) * L * 18;
  const br = Math.sin((P.wt || 0) * 4.2), sx = (1 - br * 0.035 + L * 0.15), sy = (1 + br * 0.045 + L * 0.1);   // 呼吸＋出招放大
  const tilt = clamp((P.vx || 0) * 0.0016, -0.32, 0.32) + L * 0.25 * (P.face || 1);
  // 地面影子＋品級光暈
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(P.x, HERO_Y + 4, sz * 0.26, sz * 0.08, 0, 0, 6.283); ctx.fill();
  if (d.g >= 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(x, y, 2, x, y, sz * 0.62); gl.addColorStop(0, d.col + '55'); gl.addColorStop(1, d.col + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, sz * 0.62, 0, 6.283); ctx.fill(); ctx.restore(); }
  const back = spr('petb_' + d.id), a = back || spr('pet_' + d.id);   // 有戰鬥背面圖就用背面圖
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(sx * (P.fs === undefined ? 1 : P.fs), sy);
  if (a) { const k = sz / Math.max(a.w, a.h); ctx.drawImage(a.img, -a.w * k / 2, -a.h * k / 2, a.w * k, a.h * k); }
  else petFallback(d, 0, 0, sz * 0.4);
  if (P.cast > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = P.cast * 2; const fl = ctx.createRadialGradient(0, 0, 2, 0, 0, sz * 0.6); fl.addColorStop(0, '#ffffff'); fl.addColorStop(0.4, d.col); fl.addColorStop(1, d.col + '00'); ctx.fillStyle = fl; ctx.beginPath(); ctx.arc(0, 0, sz * 0.6, 0, 6.283); ctx.fill(); P.cast -= 1 / 60; }
  ctx.restore(); ctx.globalAlpha = 1;
}
function relicBurst() {   // 玉石俱焚：補回大量分身，震飛周圍敵人
  S.rBurst = true; const add = Math.max(8, Math.round((S.peak || 10) * 0.4)), u0 = Math.max(0, S.units); S.units = Math.min(MAXU, u0 + add); popClones(S.units - u0);
  for (const e of S.enemies) if (!e.dead && Math.hypot(e.x - S.hx, e.y - HERO_Y) < 340) { skillDmg(e, skPow() * 6); e.y -= 60; }
  ring(S.hx, HERO_Y, '#9fffc8', 30, 360, 0.6); burst(S.hx, HERO_Y, '#d8ffe8', 26, 420); flash(0.35); S.shake = 14; text(S.hx, HERO_Y - 90, '玉石俱焚！', '#9fffc8', 30); sfx('up');
}
function updateSkills(dt) {   // 回傳 true 代表這局結束
  if (updateExclusive(dt)) return true;
  const K = S.sk, B = S.boss, bossOk = B && B.state !== 'enter';
  if (K.orbit) {
    S.orbA += dt * 4.2;
    const EV = K.ev_orbit ? 2 : 1, n = (1 + K.orbit) * EV, R = squadR() + 46 + (EV - 1) * 34, dm = skPow() * 0.45 * EV;
    if (EV > 1) S.orbA += dt * 2.4;
    for (let i = 0; i < n; i++) {
      const a = S.orbA + i * 6.283 / n, bx = S.hx + Math.cos(a) * R, by = HERO_Y - 6 + Math.sin(a) * R * 0.62;
      for (const e of S.enemies) if (!e.dead && (e.x - bx) ** 2 + (e.y - by) ** 2 < (e.r + 20) ** 2 && !(e.ot > S.t)) { e.ot = S.t + 0.25; skillDmg(e, dm); if (K.frost) e.slowT = 1.6; if (Math.random() < 0.4) burst(bx, by, '#dff4ff', 3, 120); }
      for (const sh of S.eshots) if (!sh.dead && !(sh.wait > 0) && (sh.x - bx) ** 2 + (sh.y - by) ** 2 < 24 * 24) { sh.dead = true; ring(sh.x, sh.y, '#dff4ff', 4, 20, 0.2); }
      if (bossOk && (B.x - bx) ** 2 + (B.y - by) ** 2 < (B.r + 20) ** 2 && !(B.ot > S.t)) { B.ot = S.t + 0.25; if (hitBoss(dm)) return true; }
    }
  }
  if (K.thunder && (S.thT -= dt) <= 0) {
    S.thT = K.ev_thunder ? 1.2 : 2.6;
    const pool = S.enemies.filter(e => !e.dead && e.y > 40 && e.y < HERO_Y - 40 && !(ED[e.type].phase && !e.vis));
    const tg = []; if (bossOk) tg.push(B);
    while (tg.length < (K.ev_thunder ? 8 : K.thunder + 1) && pool.length) tg.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    for (const t of tg) {
      const pts = [[t.x + rr(-30, 30), -10]]; let y = -10; while (y < t.y - 20) { y += rr(40, 80); pts.push([t.x + rr(-26, 26), Math.min(y, t.y)]); } pts.push([t.x, t.y]);
      S.bolts.push({ pts, t: 0.28 }); ring(t.x, t.y, '#d8c0ff', 10, 70, 0.35); burst(t.x, t.y, '#e8d8ff', 8, 220);
      const tdm = skPow() * 3.2 * (K.ev_thunder ? CRIT_X : 1) * (K.fire ? 1.3 : 1);
      if (K.fire) { burst(t.x, t.y, '#ffb03a', 6, 200); ring(t.x, t.y, '#ff7a2a', 6, 50, 0.3); }
      if (t === B) { if (hitBoss(tdm)) return true; } else skillDmg(t, tdm);
    }
    if (tg.length) { flash(0.1); S.shake = Math.max(S.shake, 5); sfx('hit'); }
  }
  if (K.fire && (S.fwT -= dt) <= 0) { S.fwT = K.ev_fire ? 1.5 : 5 - K.fire * 0.5; S.waves.push({ y: HERO_Y - 40, hit: [], big: !!K.ev_fire }); sfx('barrel'); }
  for (const w of S.waves) {
    w.y -= 820 * dt; if (w.y < -60) { w.dead = true; continue; }
    const dm = skPow() * (1.8 + 0.3 * K.fire) * (w.big ? 2 : 1), wh = w.big ? 64 : 34;
    for (const e of S.enemies) if (!e.dead && Math.abs(e.y - w.y) < wh && w.hit.indexOf(e) < 0) { w.hit.push(e); skillDmg(e, dm); }
    if (bossOk && Math.abs(B.y - w.y) < B.r && w.hit.indexOf(B) < 0) { w.hit.push(B); if (hitBoss(dm * 1.5)) return true; }
  }
  S.waves = S.waves.filter(w => !w.dead);
  for (const b of S.bolts) b.t -= dt; S.bolts = S.bolts.filter(b => b.t > 0);
  if (K.ev_clone && (S.evcT = (S.evcT === undefined ? 5 : S.evcT) - dt) <= 0) { S.evcT = 5; const u0 = S.units; S.units = Math.min(MAXU, S.units + 3); popClones(S.units - u0); text(S.hx, HERO_Y - 80, '化身 +3', '#7ff0ff', 22); }
  if (K.shield && !S.shield && (S.shieldT -= dt) <= 0) { S.shield = true; ring(S.hx, HERO_Y, '#ffd23a', 20, squadR() + 40, 0.4); }
  if (S.relic && S.relic.size) {   // 古物秘技
    if (S.relic.has('shield') && !S.shield && (S.rShT -= dt) <= 0) { S.rShT = 12; S.shield = true; ring(S.hx, HERO_Y, '#ffd23a', 20, squadR() + 40, 0.4); text(S.hx, HERO_Y - 70, '金鐘罩', '#ffd23a', 20); }
    if (S.relic.has('regen') && S.t - S.lastHurt >= 3 && S.units < (S.peak || 0) && (S.rRegT -= dt) <= 0) { S.rRegT = 0.6; const u0 = S.units; S.units = Math.min(S.peak, MAXU, S.units + Math.max(1, Math.round(S.peak * 0.04))); popClones(S.units - u0); }
    if (S.relic.has('bolt') && (S.rBoltT -= dt) <= 0) { S.rBoltT = 6;
      const pool = S.enemies.filter(e => !e.dead && e.y > 40 && e.y < HERO_Y - 40), tg = []; if (bossOk) tg.push(B);
      while (tg.length < 3 && pool.length) tg.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      for (const t of tg) { const pts = [[t.x + rr(-30, 30), -10]]; let y = -10; while (y < t.y - 20) { y += rr(40, 80); pts.push([t.x + rr(-26, 26), Math.min(y, t.y)]); } pts.push([t.x, t.y]);
        S.bolts.push({ pts, t: 0.28 }); ring(t.x, t.y, '#bfe0ff', 10, 80, 0.35); if (exHit(t, skPow() * 4)) return true; }
      if (tg.length) { text(S.hx, HERO_Y - 90, '天雷引', '#cfe6ff', 20); flash(0.08); sfx('hit'); }
    }
  }
  return false;
}
let FIREBAND = null;
function fireBand() {
  if (FIREBAND) return FIREBAND;
  FIREBAND = document.createElement('canvas'); FIREBAND.width = 270; FIREBAND.height = 60;
  const x = FIREBAND.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 60);
  g.addColorStop(0, 'rgba(255,240,160,0)'); g.addColorStop(0.35, 'rgba(255,200,80,.9)'); g.addColorStop(0.6, 'rgba(255,90,20,.75)'); g.addColorStop(1, 'rgba(160,20,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 270, 60);
  x.fillStyle = 'rgba(255,250,220,.8)'; for (let i = 0; i < 18; i++) { x.beginPath(); x.ellipse(8 + i * 15, 22, 5, 12, 0, 0, 6.283); x.fill(); }
  return FIREBAND;
}
function drawSkills() {
  drawExclusive();
  const K = S.sk || {};
  for (const w of S.waves || []) { if (fxDraw('fx_firewall', W / 2, w.y - 22, W * 1.1, 0, 0.95, 1, w.big ? 1.9 : 1)) continue; const f = fireBand(); ctx.globalAlpha = 0.9; ctx.drawImage(f, 0, w.y - 30, W, 60); ctx.globalAlpha = 1; }
  if (S.bolts && S.bolts.length && spr('fx_bolt')) {
    for (const b of S.bolts) { const [tx, ty] = b.pts[b.pts.length - 1], a = spr('fx_bolt'), h = ty + 20, w = 70; ctx.globalAlpha = b.t / 0.28; ctx.drawImage(sprCache('fx_bolt', a, a.h).cv, tx - w / 2, -20, w, h); ctx.globalAlpha = 1; }
  } else if (S.bolts && S.bolts.length) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const b of S.bolts) {
      const a = b.t / 0.28;
      for (const [lw, col] of [[10, `rgba(160,110,255,${0.5 * a})`], [3.5, `rgba(255,255,255,${a})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); b.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      }
    }
  }
  if (K.orbit) {
    const EV = K.ev_orbit ? 2 : 1, n = (1 + K.orbit) * EV, R = squadR() + 46 + (EV - 1) * 34, bl = bladeSprite();
    for (let i = 0; i < n; i++) {
      const a = S.orbA + i * 6.283 / n, bx = S.hx + Math.cos(a) * R, by = HERO_Y - 6 + Math.sin(a) * R * 0.62;
      if (!fxDraw('fx_dagger', bx, by, 18, a + 1.57 + S.orbA * 2)) { ctx.save(); ctx.translate(bx, by); ctx.rotate(a + 1.57 + S.orbA * 2); ctx.drawImage(bl, -24, -24, 48, 48); ctx.restore(); }
    }
  }
  if (S.shield && spr('fx_dome')) { const R = squadR() + 22, p = 1 + Math.sin(AT * 5) * 0.04; fxDraw('fx_dome', S.hx, HERO_Y - R * 0.2, R * 1.9 * p, 0, 0.6); }
  else if (S.shield) {
    const R = squadR() + 22, p = 1 + Math.sin(AT * 5) * 0.04;
    ctx.strokeStyle = 'rgba(255,210,60,.85)'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(255,210,60,.12)';
    ctx.beginPath(); ctx.ellipse(S.hx, HERO_Y - 4, R * p, R * 0.75 * p, 0, 0, 6.283); ctx.fill(); ctx.stroke();
  }
}
function drawCorpses() {
  for (const c of S.corpses || []) {
    const a = spr(c.k); if (!a) continue;
    const d = ED[c.k], f = 1 - c.t / 0.5, wc = sprCache(c.k, a, d.sh, true), cc = sprCache(c.k, a, d.sh);
    ctx.save(); ctx.globalAlpha = Math.max(0, f); ctx.translate(c.x, c.y); ctx.rotate(c.r); const s2 = 0.6 + f * 0.4; ctx.scale(s2, s2);
    ctx.drawImage(cc.cv, -cc.w / 2, -d.sh / 2, cc.w, d.sh);
    ctx.globalAlpha = Math.max(0, f) * 0.7; ctx.drawImage(wc.cv, -cc.w / 2, -d.sh / 2, cc.w, d.sh);
    ctx.restore();
  }
}
function updateCorpses(dt) {
  for (const c of S.corpses) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 1100 * dt; c.r += c.vr * dt; }
  S.corpses = S.corpses.filter(c => c.t < 0.5);
}
function evoOf(id) {   // 這門武學能進化成什麼(還沒練成的)
  return SKILLS.find(e => e.evo && e.evo.includes(id) && !S.sk[e.id] && (!e.cls || e.cls === S.cls.id));
}
function drawEvoFx() {   // 武學進化大特寫
  const E = S.evoFx, k = skDef(E.id), t = E.t, cy = H * 0.42;
  const fi = clamp(t * 5, 0, 1) * clamp((1.4 - t) * 4, 0, 1);
  ctx.save(); ctx.globalAlpha = fi * 0.8; ctx.fillStyle = '#0a0603'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = fi;
  const EB = spr('fx_evoburst');   // 金色放射光(有美術圖就用圖，沒有就用程式畫)
  if (EB) { const z2 = 600 * (0.85 + t * 0.15); ctx.translate(W / 2, cy); ctx.rotate(t * 0.4); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(EB.img, -z2 / 2, -z2 / 2, z2, z2); ctx.setTransform(view.s * view.d, 0, 0, view.s * view.d, 0, 0); ctx.globalCompositeOperation = 'source-over'; }
  else {
    ctx.translate(W / 2, cy); ctx.rotate(t * 0.5); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { ctx.rotate(6.283 / 16); ctx.fillStyle = i % 2 ? 'rgba(255,200,80,.22)' : 'rgba(255,240,170,.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, -330); ctx.lineTo(26, -330); ctx.closePath(); ctx.fill(); }
    ctx.setTransform(view.s * view.d, 0, 0, view.s * view.d, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = fi;
  }
  const z = t < 0.25 ? t / 0.25 * 1.25 : t < 0.4 ? 1.25 - (t - 0.25) / 0.15 * 0.25 : 1;   // 衝出來再回彈
  if (!drawIcon('ico_sk_' + k.id, W / 2, cy, 200 * z)) { ctx.fillStyle = k.col; ctx.font = `900 ${Math.round(120 * z)}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k.ch, W / 2, cy); }
  if (t > 0.3) { const a2 = clamp((t - 0.3) * 4, 0, 1); ctx.globalAlpha = fi * a2;
    inkText('武學進化', W / 2, cy - 160 - (1 - a2) * 20, 44);
    inkText(k.name, W / 2, cy + 150 + (1 - a2) * 20, 58);
    ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(k.d(1), W / 2, cy + 205); }
  ctx.restore();
}
function drawPick() {   // 武學三選一
  const P = S.pick; if (!P) return;
  ui = [];
  const t = AT - P.at;
  ctx.fillStyle = 'rgba(10,6,3,.78)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const g = ctx.createRadialGradient(W / 2, 230, 10, W / 2, 230, 220); g.addColorStop(0, 'rgba(255,200,90,.35)'); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 60, W, 360);
  drawIcon('ico_sk_book', W / 2, 150, 84);
  inkText('領悟武學', W / 2, 220, 52);
  ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 17px ${FONT}`; ctx.fillText(`悟性 Lv ${S.lv}　選一門武學(本局有效)`, W / 2, 272);
  P.opts.forEach((id, i) => {
    const k = skDef(id), l = S.sk[id] || 0, y0 = 304 + i * 150, ent = clamp((t - i * 0.08) * 5, 0, 1), x0 = 34 + (1 - ent) * 300;
    ctx.globalAlpha = ent;
    ui.push({ x: 34, y: y0, w: W - 68, h: 132, act: 'pick:' + id });
    if (panel(x0, y0, W - 68, 132)) { ctx.lineWidth = 2; ctx.strokeStyle = k.col; roundRect(x0 + 10, y0 + 10, W - 88, 112, 10); ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(48,30,18,.97)'; roundRect(x0, y0, W - 68, 132, 16); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = k.col; ctx.stroke(); }
    const cx = x0 + 66, cy = y0 + 66;
    const rg = ctx.createRadialGradient(cx, cy, 6, cx, cy, 48); rg.addColorStop(0, k.col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, 48, 0, 6.283); ctx.fill();
    if (!drawIcon('ico_sk_' + k.id, cx, cy, 84)) {
      ctx.fillStyle = 'rgba(20,12,8,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, 6.283); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = k.col; ctx.stroke();
      ctx.fillStyle = k.col; ctx.font = `900 34px ${TFONT}`; ctx.fillText(k.ch, cx, cy + 2);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `900 26px ${TFONT}`; ctx.fillText(k.name, x0 + 124, y0 + 40);
    ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = l ? '#ffd23a' : '#7fffa0'; ctx.fillText(k.evo ? '終極' : l ? `Lv ${l} → ${l + 1}` : '新武學', x0 + 124 + ctx.measureText(k.name).width * 0 + 150, y0 + 42);
    if (k.evo) { ctx.fillStyle = '#c8901a'; roundRect(x0 + W - 68 - 96, y0 + 12, 80, 24, 6); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('武學進化', x0 + W - 68 - 56, y0 + 25); ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd98a'; ctx.font = `12px ${FONT}`; ctx.fillText(`由「${skDef(k.evo[0]).name}＋${skDef(k.evo[1]).name}」進化`, x0 + 124, y0 + 108); const gp = (Math.sin(AT * 6) + 1) / 2; ctx.strokeStyle = `rgba(255,210,80,${0.5 + gp * 0.5})`; ctx.lineWidth = 3 + gp * 2; roundRect(x0 + 4, y0 + 4, W - 76, 124, 14); ctx.stroke(); }
    if (k.cls) { ctx.fillStyle = '#b8241a'; roundRect(x0 + W - 68 - 96, y0 + 12, 80, 24, 6); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('職業專屬', x0 + W - 68 - 56, y0 + 25); ctx.textAlign = 'left'; }
    ctx.fillStyle = '#e8dcc8'; ctx.font = `17px ${FONT}`; ctx.fillText(k.d(l + 1), x0 + 124, y0 + 82);
    if (!k.evo) for (let s2 = 0; s2 < k.max; s2++) { ctx.fillStyle = s2 < l ? k.col : s2 === l ? '#ffffff' : '#4a3a2a'; ctx.fillRect(x0 + 124 + s2 * 22, y0 + 104, 18, 6); }
    const sy = !k.evo && !(S.sk[k.id]) && SYN.find(x => (x.a === k.id && S.sk[x.b]) || (x.b === k.id && S.sk[x.a]));
    if (sy) { const hx = x0 + 124 + k.max * 22 + 10; synIcon(sy, hx + 11, y0 + 107, 24); ctx.fillStyle = '#9fe8ff'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(`可共鳴→${sy.name}`, hx + 26, y0 + 108); }
    const ev = !k.evo && !sy && evoOf(k.id);
    if (ev) { const hx = x0 + 124 + k.max * 22 + 10; drawIcon('ico_sk_' + ev.id, hx + 11, y0 + 107, 24); ctx.fillStyle = '#ffd98a'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('可進化→' + ev.name, hx + 26, y0 + 108); }
    ctx.textAlign = 'center'; ctx.globalAlpha = 1;
  });
}
function drawSkillBar() {   // 抬頭顯示：悟性條＋已學武學
  const f = clamp(S.xp / xpNeed(S.lv), 0, 1);
  pbar(20, 70, 420, 9, f, '#7fe0ff');
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = '#dff6ff'; ctx.fillText(`悟性 Lv${S.lv}`, 26, 75);
  let x = 30;
  for (const k of SKILLS) {
    const l = S.sk[k.id]; if (!l) continue;
    if (!drawIcon('ico_sk_' + k.id, x, H - 78, 32)) {
      ctx.fillStyle = 'rgba(15,10,6,.8)'; ctx.beginPath(); ctx.arc(x, H - 78, 15, 0, 6.283); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = k.col; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = k.col; ctx.font = `900 15px ${TFONT}`; ctx.fillText(k.ch, x, H - 77);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = `bold 10px ${FONT}`; ctx.fillText(l, x + 11, H - 66);
    x += 36;
  }
  for (const sy of SYN) if (synOn(sy.id)) { synIcon(sy, x, H - 78, 30); x += 34; }   // 已觸發的武學共鳴
}
// ---------- 打擊感：傷害數字、暴擊、連斬、頓幀、金幣 ----------
const CRIT = 0.1, CRIT_X = 1.8;
const critX = () => CRIT_X + (S.relic && S.relic.has('crit') ? 0.6 : 0);   // 古物秘技「會心一擊」
const critC = () => CRIT + 0.08 * (S.sk ? S.sk.crit || 0 : 0) + (S.petCrit || 0) + eqVal('hlm') / 100;
const fmtDmg = v => v >= 10000 ? (v / 10000).toFixed(v >= 100000 ? 0 : 1) + '萬' : String(Math.round(v));
function showDmg(t, v, crit, y) {
  const lim = fxLow() ? 10 : 18;
  if (crit && (t.ct === undefined || S.t - t.ct > 0.3)) { t.ct = S.t; pushDmg(t.x + rr(-14, 14), (y || t.y) - 10, v + (t.acc || 0), true); t.acc = 0; return; }
  t.acc = (t.acc || 0) + v;
  if ((t.nt !== undefined && S.t - t.nt < 0.28) || S.dmg.length >= lim) return;   // 第一下一定顯示，之後每 0.28 秒合併一次；畫面上限 18 個
  pushDmg(t.x + rr(-16, 16), (y || t.y) - 6, t.acc, false); t.acc = 0; t.nt = S.t;
}
function pushDmg(x, y, v, crit) {
  if (S.dmg.length >= 26) S.dmg.shift();
  S.dmg.push({ x, y, v, crit, life: crit ? 0.9 : 0.75, max: crit ? 0.9 : 0.75 });
}
function flash(a) { S.flash = Math.max(S.flash || 0, a); }
function coinFly(x, y) {
  if (fxLow() || S.coinFx.length >= 45) return;
  const a = Math.random() * 6.283, v = rr(120, 260);
  S.coinFx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, t: 0 });
}
const COMBO_MS = { 50: '五十連斬！', 100: '百人斬！', 200: '兩百連斬！', 300: '三百連斬！', 500: '五百連斬！', 1000: '千人斬！' };
function addCombo() {
  S.combo++; S.comboT = 3.5; S.comboPop = 0.18; if (S.combo > S.maxCombo) S.maxCombo = S.combo;
  save.stats.maxCombo = Math.max(save.stats.maxCombo || 0, S.combo);
  if (COMBO_MS[S.combo]) { banner(COMBO_MS[S.combo], 1.3); sfx('win'); flash(0.18); }
}
function updateHitFx(dt) {
  if (S.comboT > 0 && (S.comboT -= dt) <= 0) S.combo = 0;
  if (S.comboPop > 0) S.comboPop -= dt;
  if (S.flash > 0) S.flash -= dt * 1.6;
  if (S.coinPulse > 0) S.coinPulse -= dt;
  for (const d of S.dmg) { d.life -= dt; d.y -= (d.crit ? 40 : 70) * dt; }
  S.dmg = S.dmg.filter(d => d.life > 0);
  for (const c of S.coinFx) {
    c.t += dt;
    if (c.t < 0.28) { c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.9; c.vy *= 0.9; c.vy += 300 * dt; }
    else { const tx = 322, ty = 42, k = Math.min(1, (c.t - 0.28) * 4.5); c.x += (tx - c.x) * k * 0.35; c.y += (ty - c.y) * k * 0.35; if (Math.abs(c.x - tx) + Math.abs(c.y - ty) < 14) { c.done = true; S.coinPulse = 0.15; if (Math.random() < 0.3) sfx('coin'); } }
  }
  S.coinFx = S.coinFx.filter(c => !c.done);
}
const DMGC = new Map();
function dmgSprite(t, crit, sz) {
  const sc = Math.min(view.s * view.d, 2), key = t + (crit ? 'c' : 'n') + sz + '@' + sc + (S.cls && S.cls.shot);
  let c = DMGC.get(key); if (c) return c;
  if (DMGC.size > 260) DMGC.clear();
  const cv = document.createElement('canvas'), x = cv.getContext('2d'); x.font = `900 italic ${sz}px ${FONT}`;
  const tw = x.measureText(t).width, w = Math.ceil(tw + sz * 0.6), top = crit ? sz * 1.3 : sz * 0.2, h = Math.ceil(top + sz * 1.2);
  cv.width = Math.ceil(w * sc); cv.height = Math.ceil(h * sc); x.scale(sc, sc);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.font = `900 italic ${sz}px ${FONT}`;
  const cy = top + sz * 0.5;
  x.lineWidth = sz / 5; x.strokeStyle = crit ? '#5a1200' : 'rgba(10,20,40,.85)'; x.strokeText(t, w / 2, cy);
  if (crit) { const g = x.createLinearGradient(0, cy - sz / 2, 0, cy + sz / 2); g.addColorStop(0, '#fff6a0'); g.addColorStop(0.5, '#ffb020'); g.addColorStop(1, '#ff5a10'); x.fillStyle = g; }
  else x.fillStyle = (S.cls && S.cls.shot) || '#fff';
  x.fillText(t, w / 2, cy);
  if (crit) { x.font = `900 13px ${TFONT}`; x.lineWidth = 3; x.strokeStyle = '#5a1200'; x.strokeText('暴擊', w / 2, cy - sz * 0.8); x.fillStyle = '#fff2a0'; x.fillText('暴擊', w / 2, cy - sz * 0.8); }
  c = { cv, w, h, cy }; DMGC.set(key, c); return c;
}
function drawHitFx() {
  for (const c of S.coinFx) drawIcon('ico_coin', c.x, c.y, 18);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const d of S.dmg) {
    const age = d.max - d.life, pop = age < 0.12 ? 1 + (0.12 - age) * (d.crit ? 7 : 3) : 1;
    ctx.globalAlpha = clamp(d.life * 3, 0, 1);
    const T = dmgSprite(fmtDmg(d.v), d.crit, d.crit ? 32 : d.v >= 1000 ? 24 : 20);   // 預先畫好的數字圖，每幀只貼圖(手機省很多)
    if (T) { ctx.drawImage(T.cv, d.x - T.w * pop / 2, d.y - T.cy * pop, T.w * pop, T.h * pop); continue; }
    const sz = (d.crit ? 32 : d.v >= 1000 ? 24 : 20) * pop;
    ctx.font = `900 italic ${sz}px ${FONT}`;
    const t = fmtDmg(d.v);
    ctx.lineWidth = sz / 5; ctx.strokeStyle = d.crit ? '#5a1200' : 'rgba(10,20,40,.85)'; ctx.strokeText(t, d.x, d.y);
    if (d.crit) { const g = ctx.createLinearGradient(0, d.y - sz / 2, 0, d.y + sz / 2); g.addColorStop(0, '#fff6a0'); g.addColorStop(0.5, '#ffb020'); g.addColorStop(1, '#ff5a10'); ctx.fillStyle = g; }
    else ctx.fillStyle = S.cls.shot || '#fff';
    ctx.fillText(t, d.x, d.y);
    if (d.crit) { ctx.font = `900 ${13 * pop}px ${TFONT}`; ctx.lineWidth = 3; ctx.strokeStyle = '#5a1200'; ctx.strokeText('暴擊', d.x, d.y - sz * 0.8); ctx.fillStyle = '#fff2a0'; ctx.fillText('暴擊', d.x, d.y - sz * 0.8); }
  }
  ctx.globalAlpha = 1;
  if (S.flash > 0) { ctx.fillStyle = `rgba(255,248,220,${clamp(S.flash, 0, 0.45)})`; ctx.fillRect(0, 0, W, H); }
}
function drawCombo() {
  if (S.combo < 5) return;
  const a = clamp(S.comboT * 1.2, 0, 1), pop = S.comboPop > 0 ? 1 + S.comboPop * 2 : 1;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W - 34, 250);
  inkText('連斬', 0, -30, 18, { align: 'right', cols: ['#ffffff', '#ffe0a0', '#ff9a40'] });
  ctx.scale(pop, pop); inkText('×' + S.combo, 0, 4, S.combo >= 100 ? 40 : 34, { align: 'right', cols: ['#fff6d0', '#ffb020', '#ff4a10'] });
  ctx.restore();
}
function homing(b, dt) {   // 暗器師飛鏢：轉向最近的敵人
  if ((b.tt = (b.tt || 0) - dt) <= 0) {
    b.tt = 0.12; let best = null, bd = 1e9;
    for (const e of S.enemies) { if (e.dead || e.y > b.y || (ED[e.type].phase && !e.vis)) continue; const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2; if (d < bd) { bd = d; best = e; } }
    if (!best && S.boss && S.boss.state !== 'enter') best = S.boss;
    b.tg = best;
  }
  const t = b.tg; if (!t || t.dead || (t === S.boss && !S.boss)) return;
  const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx), want = Math.atan2(t.y - b.y, t.x - b.x);
  let da = want - cur; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
  const na = cur + clamp(da, -7 * dt, 7 * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
}
function hitBoss(dmg) {   // 回傳 true 代表這局結束(一般關卡擊敗首領)
  const B = S.boss; if (!B) return false;
  dmg *= 1 + eqVal('bot') / 100; const cr = Math.random() < critC(); if (cr) dmg *= critX();
  if (S.weekly) S.weekly.dmg += Math.min(dmg, Math.max(0, B.hp));
  B.hp -= dmg; B.flash = 0.06; showDmg(B, dmg, cr, B.y - B.r * 0.4);
  if (B.hp > 0) return false;
  burst(B.x, B.y, '#ffcf4a', 60, 380); ring(B.x, B.y, '#fff2c0', 20, 260, 0.7); ring(B.x, B.y, '#ffb347', 10, 180, 0.9);
  S.hs = 0.6; S.shake = 18; flash(0.35); for (let i = 0; i < 18; i++) coinFly(B.x + rr(-40, 40), B.y + rr(-30, 30));
  S.coinsRun += B.def.coin; stat('bosses'); S.boss = null; gainXp(20); S.bossKillT = S.t - S.bossT0;
  if (S.endless) { endlessNext(); return false; }
  banner('大獲全勝！', 2); endRun(true); return true;
}
function explode(x, y, b) {   // 魔教傳人黑炎：範圍傷害
  const dmg = bdmg(b);
  ring(x, y, '#c04aff', 8, b.aoe, 0.35); burst(x, y, '#8a2aff', 8, 200);
  for (const e of S.enemies) {
    if (e.dead || (ED[e.type].phase && !e.vis)) continue;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 < (b.aoe + e.r) ** 2) { const ar = ED[e.type].armor; const dm = ar ? dmg * (1 - ar) : dmg; e.hp -= dm; e.fl = 0.07; showDmg(e, dm, false); if (e.hp <= 0) { e.dead = true; killEnemy(e); } }
  }
  const B = S.boss;
  if (B && B.state !== 'enter' && (B.x - x) ** 2 + (B.y - y) ** 2 < (b.aoe + B.r) ** 2) return hitBoss(dmg);
  return false;
}
function bdmg(b) {   // 弓手長箭：飛越遠傷害越高，最遠 +50%
  return b.k === 'arrow' ? b.dmg * (1 + Math.min(1, (b.y0 - b.y) / 700) * 0.5) : b.dmg;
}
function inSquad(x, y, r) {
  const R = squadR(), dx = (x - S.hx) / (R + r), dy = (y - (HERO_Y + 8)) / (R * 0.6 + 12 + r);
  return dx * dx + dy * dy < 1;
}
function bulletHit(b, target) {
  if (b.pierce > 0) {
    if (!b.hits) b.hits = [];
    if (b.hits.indexOf(target) >= 0) return false;
    b.hits.push(target); b.pierce--;
  } else b.dead = true;
  return true;
}

function addPool(x, t = 3.4) { if (S.pools.length < 8) S.pools.push({ x: clamp(x, 30, W - 30), r: 44, t, max: t }); burst(x, HERO_Y + 8, '#7aff3a', 6, 90); }
function aimShot(x, y, tx, dmg = 2, wait = 0.75) {   // 瞄準線：鎖定位置後延遲發射
  const a = Math.atan2(HERO_Y - y, tx - x);
  S.eshots.push({ x, y, vx: 0, vy: 0, tvx: Math.cos(a) * 640, tvy: Math.sin(a) * 640, wait, wmax: wait, ang: a, r: 6, dmg, col: '#ffb03a' });
}
function updateBoss(dt) {
  const B = S.boss; if (!B) return;
  const d = B.def;
  B.t += dt; B.flash = Math.max(0, B.flash - dt);
  B.strike = (B.strike === undefined ? 9 : B.strike) + dt; B.cast = (B.cast === undefined ? 9 : B.cast) + dt; if (B.jit > 0) B.jit -= dt;
  B.trail = B.trail === undefined ? B.hp : B.trail > B.hp ? Math.max(B.hp, B.trail - B.max * 0.35 * dt) : B.hp;
  if (B.state === 'enter') { B.y += 140 * dt; if (B.y >= B.ty) { B.y = B.ty; B.state = 'fight'; } return; }
  const angry = B.hp < B.max / 2;
  if (B.state === 'fight') {
    B.cx = W / 2 + Math.sin(B.t * 0.7) * 150; B.x += (B.cx - B.x) * Math.min(1, dt * 3);
    if ((B.atkT -= dt) <= 0) {
      B.atkT = d.fanT * (angry ? 0.72 : 1) * (wkMod('rage') ? 0.6 : 1); B.strike = 0; B.sdir = -(B.sdir || 1); S.shake = Math.max(S.shake, 5); sfx('bslash');
      const base = Math.atan2(HERO_Y - B.y, S.hx - B.x), h = (d.fanN - 1) / 2;
      for (let i = -h; i <= h; i++) { const a = base + i * 0.16; S.eshots.push({ x: B.x, y: B.y + 40, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, r: 9, dmg: 2, col: '#ff8a3d' }); }
    }
    if ((B.sumT -= dt) <= 0) { B.sumT = d.sumT; B.cast = 0; for (let i = 0; i < d.sum * (wkMod('swarm') ? 2 : 1); i++) addEnemy(d.sumType || 'bandit', clamp(B.x + rr(-110, 110), 30, W - 30), B.y + 30); }
    if (d.wall && (B.wallT = (B.wallT === undefined ? d.wall : B.wallT) - dt) <= 0) {
      B.wallT = d.wall * (angry ? 0.75 : 1); B.cast = 0;
      const gap = rr(90, W - 90);
      for (let x = 40; x < W - 20; x += 34) if (Math.abs(x - gap) > 70) S.eshots.push({ x, y: B.y + 60, vx: 0, vy: 230, r: 10, dmg: 2, col: '#7dffb0' });
      banner('劍氣牆！從缺口穿過去', 0.9); sfx('warn');
    }
    if (d.icewall && (B.iceT = (B.iceT === undefined ? d.icewall : B.iceT) - dt) <= 0) {
      B.iceT = d.icewall * (angry ? 0.75 : 1); B.cast = 0;
      const g1 = rr(80, W / 2 - 40), g2 = rr(W / 2 + 40, W - 80);
      for (let x = 40; x < W - 20; x += 30) if (Math.abs(x - g1) > 55 && Math.abs(x - g2) > 55) S.eshots.push({ x, y: B.y + 60, vx: 0, vy: 210, r: 9, dmg: 2, col: '#bfefff', freeze: true });
      banner('冰錐陣！從缺口穿過', 0.9); sfx('warn');
    }
    if (d.rain && (B.rainT = (B.rainT === undefined ? d.rain : B.rainT) - dt) <= 0) {   // 落雷：預警圈 1 秒後落下
      B.rainT = d.rain * (angry ? 0.75 : 1); B.cast = 0;
      S.marks.push({ x: S.hx, y: HERO_Y + 6, r: 62, t: 1.1, max: 1.1 });
      for (let i = 0; i < 2; i++) S.marks.push({ x: rr(70, W - 70), y: HERO_Y + 6, r: 62, t: 1.1, max: 1.1 });
      sfx('warn');
    }
    if (d.pool && (B.poolT = (B.poolT === undefined ? d.pool : B.poolT) - dt) <= 0) {   // 毒霧：落下後留下毒池
      B.poolT = d.pool * (angry ? 0.75 : 1); B.cast = 0;
      S.marks.push({ x: S.hx, y: HERO_Y + 6, r: 54, t: 1.2, max: 1.2, pool: true });
      for (let i = 0; i < (angry ? 3 : 2); i++) S.marks.push({ x: rr(70, W - 70), y: HERO_Y + 6, r: 54, t: 1.2, max: 1.2, pool: true });
      banner('毒霧落下！別站在毒池裡', 0.9); sfx('warn');
    }
    if (d.aim && (B.aimT = (B.aimT === undefined ? d.aim : B.aimT) - dt) <= 0) {   // 火銃齊射：先亮瞄準線
      B.aimT = d.aim * (angry ? 0.75 : 1); B.cast = 0;
      const n = d.aimN + (angry ? 1 : 0);
      for (let i = 0; i < n; i++) aimShot(B.x + (i - (n - 1) / 2) * 30, B.y + 50, i === 0 ? S.hx : rr(50, W - 50), 2, 0.9);
      banner('注意紅線！快閃開', 0.9); sfx('warn');
    }
    if (d.charge && (B.chargeT -= dt) <= 0) { B.state = 'windup'; B.wt = 0.9; B.tx = S.hx; banner(d.name + '要衝過來了！快閃開', 1.0); sfx('warn'); }
  } else if (B.state === 'windup') {
    B.x += (B.tx - B.x) * Math.min(1, dt * 6);
    if ((B.wt -= dt) <= 0) { B.state = 'charge'; B.hitDone = false; }
  } else if (B.state === 'charge') {
    B.y += 950 * dt;
    if (!B.hitDone && inSquad(B.x, B.y, B.r * 0.8)) { B.hitDone = true; hurt(Math.max(5, Math.ceil(S.units * 0.3))); S.shake = 18; }
    if (B.y > HERO_Y + 120) B.state = 'return';
  } else if (B.state === 'return') {
    B.y -= 420 * dt;
    if (B.y <= B.ty) { B.y = B.ty; B.state = 'fight'; B.chargeT = angry ? 5.5 : 7.5; }
  }
}

function endRun(win) {
  if (S.mode !== 'play') return;
  if (S.endless && !win && !S.revived && !S.auto) { S.mode = 'revive'; S.reviveT = 9; drag.on = false; sfx('lose'); return; }
  if (S.endless) {   // 無盡試煉結算
    const wave = S.wave - 1, best = save.endless.best, newBest = wave > best;
    save.endless.best = Math.max(best, wave); save.endless.bestKills = Math.max(save.endless.bestKills, S.kills);
    save.stats.maxUnits = Math.max(save.stats.maxUnits || 0, S.peak || 0);
    const coins = (S.coinsRun + wave * 30) * (evToday().id === 'coin2' ? 2 : 1), pxp = S.kills + wave * 25, lvUp = passXp(pxp), frag = Math.floor(wave / 2); addFrag(save.cls, frag);
    save.coins += coins; persist();
    S.result = { endless: true, wave, best: save.endless.best, newBest, kills: S.kills, coins, pxp, lvUp, frag, doubled: false, units: S.units };
    S.mode = 'result'; S.paused = false; drag.on = false; sfx(newBest ? 'win' : 'lose');
    return;
  }
  if (S.weekly) { weeklyEnd(); return; }   // 每週首領：倒下或時間到就結算傷害，不能復活
  if (!win && !S.revived && !S.auto) { S.mode = 'revive'; S.reviveT = 9; drag.on = false; sfx('lose'); return; }   // 先問要不要復活
  if (S.tower) { towerEnd(win); return; }
  if (!win) {
    save.shop.fails[S.stage] = (save.shop.fails[S.stage] || 0) + 1;
    if (save.shop.fails[S.stage] >= 3 && offerLeft() <= 0) { save.shop.offer = Date.now() + 3600e3; save.shop.packs.stuckSeen = false; save.shop.fails[S.stage] = 0; }
  } else save.shop.fails[S.stage] = 0;
  if (S.sub < SUBN - 1) { subEnd(win); return; }
  const i = S.stage, EV = evToday();
  let bonus = win ? Math.round(60 * (stEq(i) + 1) * (S.hard ? 2 : 1)) : 0;   // 單場制通關加成(S23：35→60)
  if (EV.id === 'coin2') { bonus = bonus * 2 + S.coinsRun; }   // 週末活動：關卡銅錢加倍
  const stars = win ? (S.units >= 30 ? 3 : S.units >= 10 ? 2 : 1) : 0;
  let unlock = null, gems = 0, drop = null;
  logEv('stage_end', { st: i, hard: S.hard ? 1 : 0, win: win ? 1 : 0, cls: S.cls.id, units: S.units, t: Math.round(S.t), kills: S.kills });
  if (win && S.hard) {   // 困難模式：獨立進度、獎勵更好
    const H2 = save.hard, first = H2.cleared < i + 1;
    gems += 15 * Math.max(0, stars - (H2.stars[i] || 0)) + (first ? (i % 10 === 9 ? 120 : 20) : 0);
    if (first || EV.id === 'drop' || Math.random() < 0.6) drop = bossDrop(i, STAGES[i].boss.startsWith('chief'), EV.id === 'drop' ? 2 : 1);
    save.gems += gems;
    var frag = (first ? 10 : 3) * (EV.id === 'frag' ? 2 : 1); addFrag(save.cls, frag);
    H2.stars[i] = Math.max(H2.stars[i] || 0, stars);
    if (first) { H2.cleared = i + 1; H2.sub = 0; }
    if (first && i % 10 === 9 && STAGES[i].ch >= 9) var mythGot = grant(gkey(GSLOT[Math.floor(Math.random() * GSLOT.length)].k, 5));   // 困難第 10～12 章首領首通：神話一件
    stat('hardWins');
  } else if (win) {
    gems += 10 * Math.max(0, stars - (save.stars[i] || 0));
    if (save.cleared < i + 1) { gems += 57; var tkw = i % 10 === 9 ? 3 : i % 2; save.tk.pet += tkw; save.tk.gear += tkw; }
    const first = save.cleared < i + 1;
    if (first || EV.id === 'drop' || Math.random() < 0.45) drop = bossDrop(i, STAGES[i].boss.startsWith('chief'), EV.id === 'drop' ? 1 : 0);
    if (first && Math.random() < 0.7) var drop2 = bossDrop(i, false, 0);   // 首通加碼掉落(補償原小關首通)
    save.gems += gems;
    var frag = (save.cleared < i + 1 ? 14 : 2) * (EV.id === 'frag' ? 2 : 1); addFrag(save.cls, frag);
    save.stars[i] = Math.max(save.stars[i] || 0, stars);
    if (save.cleared < i + 1) {
      const before = save.cleared; save.cleared = i + 1; save.sub = 0;
      var feats = Object.keys(FEAT).filter(k => FEAT[k] > before && FEAT[k] <= save.cleared).map(k => FNAME[k]);
      const c = CLASSES.find(c => c.unlock !== undefined && c.unlock > before && c.unlock <= save.cleared);
      if (c) unlock = c.name;
    }
  }
  if (win && featOpen('pawn') && save.pawn.bag.length < 10 && Math.random() < (S.hard ? 0.1 : 0.05)) { const ot = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4][STAGES[i].ch]; save.pawn.bag.push(oldMake(ot)); var oldGot = OLD[ot].name; }   // 首領掉舊物
  let chal = null;
  if (!S.hard && !save.chal[i] && S.sub === SUBN - 1) { const c = chalOf(i), ok = win && chalProg(c).ok; chal = { txt: c.txt, ok, g: c.g }; if (ok) { save.chal[i] = 1; save.gems += c.g; gems += c.g; } }
  if (win) { track('win'); if (stars === 3) track('star3'); }
  save.coins += S.coinsRun + bonus; persist();
  if (win) stat('wins');
  save.stats.maxUnits = Math.max(save.stats.maxUnits || 0, S.peak || 0, S.units);
  const pxp = S.kills + (win ? 60 + 20 * i : 0), lvUp = passXp(pxp);
  const bossPct = S.boss ? Math.ceil(S.boss.hp / S.boss.max * 100) : null, prog = Math.min(100, Math.round(S.t / ST().len * 100));
  S.result = { drop2: typeof drop2 !== 'undefined' ? drop2 : null, tk: typeof tkw !== 'undefined' ? tkw : 0, chal, bossPct, prog, feats: typeof feats !== 'undefined' ? feats : null, frag: win ? frag : 0, win, stars, coins: S.coinsRun + bonus, kills: S.kills, units: S.units, unlock, gems, drop, doubled: false, pxp, lvUp, hard: S.hard, ev: EV.id === 'coin2' && win ? EV.name : '', myth: typeof mythGot !== 'undefined' ? mythGot : null, old: typeof oldGot !== 'undefined' ? oldGot : null };
  S.mode = 'result'; S.paused = false; drag.on = false;
  sfx(win ? 'win' : 'lose');
}

function subEnd(win) {   // 第 1～9 小關結算：首通給少量元寶，15% 掉裝備；重打只拿銅錢
  const i = S.stage, k = S.sub, EV = evToday(), hard = S.hard, cur = hard ? save.hard : save;
  const first = win && i === cur.cleared && k === (cur.sub || 0);
  let bonus = win ? Math.round(35 * (stEq(i) + 1) * (hard ? 2 : 1) * 0.4) : 0;
  if (EV.id === 'coin2') bonus = bonus * 2 + S.coinsRun;
  let gems = 0, drop = null, frag = 0;
  if (first) { cur.sub = k + 1; gems = 3; frag = 1 * (EV.id === 'frag' ? 2 : 1); addFrag(save.cls, frag); if (Math.random() < 0.15) drop = bossDrop(i, false, hard ? 1 : 0); }
  save.gems += gems;
  if (win) { track('win'); stat('subWins'); }
  save.coins += S.coinsRun + bonus; persist();
  save.stats.maxUnits = Math.max(save.stats.maxUnits || 0, S.peak || 0, S.units);
  const pxp = S.kills + (win ? 10 + 4 * i : 0), lvUp = passXp(pxp);
  logEv('stage_end', { st: i, sub: k, hard: hard ? 1 : 0, win: win ? 1 : 0, cls: S.cls.id, units: S.units, t: Math.round(S.t), kills: S.kills });
  S.result = { sub: k, first, tk: 0, chal: null, bossPct: null, prog: Math.min(100, Math.round(S.t / ST().len * 100)), feats: null, frag, win, stars: 0, coins: S.coinsRun + bonus, kills: S.kills, units: S.units, unlock: null, gems, drop, doubled: false, pxp, lvUp, hard, ev: EV.id === 'coin2' && win ? EV.name : '' };
  S.mode = 'result'; S.paused = false; drag.on = false;
  sfx(win ? 'win' : 'lose');
}

// ---------- 自動遊玩(測試用) ----------
function gateScore(g) {
  switch (g.kind) {
    case 'add': return g.val * 3 / Math.max(1, S.units) * 10;
    case 'mul': return 10 * (g.val - 1);
    case 'atk': return g.val / 10;
    case 'rate': return g.val / 10;
    case 'spread': return 6;
    case 'pierce': return 4;
  }
  return 0;
}
function autoPlay() {
  let tx = S.hx;
  const B = S.boss;
  const gate = S.gates.find(g => g.y < HERO_Y && g.y > HERO_Y - 520);
  if (B && (B.state === 'windup' || B.state === 'charge')) tx = B.x < W / 2 ? W - 60 : 60;
  else if (gate) tx = gateScore(gate.L) >= gateScore(gate.R) ? W * 0.25 : W * 0.75;
  else {
    let best = null;
    for (const e of S.enemies) if (e.y < HERO_Y && (!best || e.y > best.y)) best = e;
    if (best) tx = best.x; else if (B) tx = B.x;
  }
  for (const s of S.eshots) if (Math.abs(s.x - S.hx) < 40 && s.y > HERO_Y - 160 && s.y < HERO_Y) tx = S.hx + (s.x < S.hx ? 90 : -90);
  for (const s of S.eshots) if (s.wait > 0) { const lx = s.x + Math.cos(s.ang) * (HERO_Y - s.y) / Math.max(0.2, Math.sin(s.ang)); if (Math.abs(lx - S.hx) < 55) tx = S.hx + (lx < S.hx ? 110 : -110); }
  for (const p of S.pools || []) if (Math.abs(p.x - tx) < p.r + 30) tx = p.x + (tx < p.x ? -(p.r + 40) : p.r + 40);
  S.hx += clamp(tx - S.hx, -9, 9);
}

// ---------- 主更新 ----------
const keys = { left: false, right: false };
const drag = { on: false, px0: 0, px: 0, hx0: 0 };

let AT = 0;   // 介面動畫用的時間
function update(dt) {
  AT += dt; cloudTick(dt); adTick(dt); bgmTick(); evTick(dt);
  if (S.mode === 'loading') { S.waitT += dt; if (chunkReady(STAGES[S.waitStage].ch) || S.waitT > 15) { const fn = S.waitFn; S.waitFn = null; if (fn) fn(); else newRun(S.waitStage); } }
  if (S.mode === 'revive' && !S.ad && !S.modal && (S.reviveT -= dt) <= 0) { S.revived = true; S.mode = 'play'; endRun(false); }
  if (toastObj && (toastObj.life -= dt) <= 0) toastObj = null;
  updateFx(dt);
  if (S.evoFx && S.mode === 'play') { S.evoFx.t += dt; if (S.evoFx.t > 1.4) { S.evoFx = null; S.hs = 0.2; if (!S.pick && S.xp >= xpNeed(S.lv)) { S.xp -= xpNeed(S.lv); S.lv++; offerSkills(); } } return; }
  if (S.mode !== 'play' || S.paused || S.guide || S.pick) { if (S.mode !== 'play') S.scroll += 40 * dt; if (S.gres) S.gres.t += dt; if (S.pres) S.pres.t += dt; return; }
  updateHitFx(dt);
  if (S.hs > 0) { S.hs -= dt; dt *= 0.18; }   // 頓幀：短暫慢動作
  S.t += dt; S.scroll += SCROLL * dt;
  if (S.inv > 0) S.inv -= dt;
  S.peak = Math.max(S.peak || 0, S.units);
  if (S.cls.id === 'healer' && (S.regT = (S.regT || 2.5) - dt) <= 0) {   // 醫仙：分身慢慢恢復(不超過本局最高)
    S.regT = 2.5;
    if (S.units < S.peak) { const n = Math.min(S.peak - S.units, 1 + Math.floor(S.units * 0.04)); S.units += n; text(S.hx, HERO_Y - 50, '+' + n, '#8fffd0', 20); }
  }
  if (bannerObj && (bannerObj.life -= dt) <= 0) bannerObj = null;
  S.shake = Math.max(0, S.shake - 30 * dt);

  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const hx0 = S.hx;
  if (dir) S.hx += dir * 560 * dt;
  if (drag.on) S.hx = drag.hx0 + (drag.px - drag.px0) * 1.15;
  if (S.slow > 0) { S.slow -= dt; S.hx = hx0 + clamp(S.hx - hx0, -230 * dt, 230 * dt); if (drag.on) drag.hx0 = S.hx - (drag.px - drag.px0) * 1.15; }   // 冰凍：移動變慢
  if (S.auto) autoPlay();
  const R = squadR();
  S.hx = clamp(S.hx, 34 + R * 0.6, W - 34 - R * 0.6);

  if (S.tut > 0) {
    if (Math.abs(S.hx - W / 2) > 70) S.tut = Math.min(S.tut, 0.5);
    if ((S.tut -= dt) <= 0) { S.tut = 0; save.tut = true; persist(); }
  }
  spawner(dt);
  fire(dt);
  updateBoss(dt);
  if (updateSkills(dt)) return;
  if (updatePet(dt)) return;
  updateCorpses(dt);
  S.swing += dt;
  for (const p of S.sparks) p.t -= dt; S.sparks = S.sparks.filter(p => p.t > 0);
  for (const p of S.pops) p.t -= dt; S.pops = S.pops.filter(p => p.t > 0);
  if (S.pops2) { const P = S.pops2, before = Math.floor(P.t / 0.03); P.t += dt; const now = Math.min(P.n, Math.floor(P.t / 0.03));
    for (let k = before; k < now; k++) { const i = Math.min(59, P.from + k), q = FPOS[i] || FPOS[0]; burst(S.hx + q.x, HERO_Y + q.y - 10, '#bff4ff', 3, 90); AU.tickN = k; if (k % 2 === 0) sfx('tick'); }
    if (now >= P.n) S.pops2 = null; }
  for (const m of S.marks) if ((m.t -= dt) <= 0 && !m.done) {
    m.done = true; ring(m.x, m.y, m.pool ? '#7aff3a' : '#ff4a5a', 10, m.r + 10, 0.4); burst(m.x, m.y, m.pool ? '#c8ff8a' : '#ffd0d0', 10, 220); if (m.pool) addPool(m.x, 4.5);
    if (Math.abs(S.hx - m.x) < m.r + squadR() * 0.4) hurt(3);
  }
  S.marks = S.marks.filter(m => !m.done);
  for (const p of S.pools) p.t -= dt;
  S.pools = S.pools.filter(p => p.t > 0);
  if ((S.poolT -= dt) <= 0 && S.pools.some(p => Math.abs(S.hx - p.x) < p.r + squadR() * 0.35)) { S.poolT = 0.6; if (!S.god && S.inv <= 0) text(S.hx, HERO_Y - 70, '中毒', '#7aff3a', 20); hurt(1); }

  // 敵人
  for (const e of S.enemies) {
    const d = ED[e.type];
    if (e.fl > 0) e.fl -= dt;
    if (e.kbT > 0) e.kbT -= dt; if (e.slowT > 0) e.slowT -= dt;
    e.y += (SCROLL + d.spd * (e.boost || 1) * S.wspd * (e.kbT > 0 ? 0.25 : 1) * (frostAll() ? 0.6 : e.slowT > 0 ? 1 - frostAmt() : 1)) * dt;   // 受擊硬直、寒冰減速
    if (e.vx) e.face = e.vx < 0 ? -1 : 1;
    if (d.regen) { if (e.php !== undefined && e.hp < e.php) e.hitT = S.t; e.php = e.hp; if (e.hp < e.max && S.t - (e.hitT || 0) > 1.2) { e.hp = Math.min(e.max, e.hp + e.max * d.regen * dt); e.php = e.hp; } }   // 巨蟒：一陣子沒被打就回血
    if (d.dash && !e.dashed && e.y > 300) { e.dashed = true; e.boost = 2.3; e.vx = clamp((S.hx - e.x) * 1.3, -240, 240); ring(e.x, e.y, '#c86aff', 6, 30, 0.25); }   // 毒蛛：靠近時突然撲過來
    if (d.blink && e.y > 40 && e.y < HERO_Y - 140 && (e.bt = (e.bt === undefined ? rr(0.5, 1.3) : e.bt) - dt) <= 0) {   // 番子：瞬間移位
      e.bt = 1.25; burst(e.x, e.y, '#8a8aff', 6, 120); e.x = clamp(e.x + (rnd() < 0.5 ? -1 : 1) * rr(70, 130), 44, W - 44); ring(e.x, e.y, '#b0b0ff', 6, 34, 0.25);
    }
    if (e.vx) { e.x += e.vx * dt; if (e.x < 40 || e.x > W - 40) { e.vx = -e.vx; e.x = clamp(e.x, 40, W - 40); } }
    if (d.phase) e.vis = Math.sin(S.t * 3 + e.ph * 2) > -0.35;   // 鬼火會忽隱忽現，隱形時打不到
    if (d.wave) { e.ph += dt * 4; e.x = clamp(e.bx + Math.sin(e.ph) * 45, 40, W - 40); }
    if (d.shoot && e.y > 20 && e.y < HERO_Y - 120 && (e.st -= dt) <= 0) {
      e.st = d.shoot;
      if (d.pool) { const a0 = Math.atan2(HERO_Y - e.y, S.hx - e.x); S.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a0) * 230, vy: Math.sin(a0) * 230, r: 8, dmg: 1, col: '#7aff3a', pool: true }); }
      else if (d.aim) aimShot(e.x, e.y + 10, S.hx, 2);
      else if (d.freeze) { const a0 = Math.atan2(HERO_Y - e.y, S.hx - e.x); S.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a0) * 300, vy: Math.sin(a0) * 300, r: 7, dmg: 1, col: '#9fe8ff', freeze: true }); }
      else if (d.tri) { const a0 = Math.atan2(HERO_Y - e.y, S.hx - e.x); for (const da of [-0.22, 0, 0.22]) S.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a0 + da) * 240, vy: Math.sin(a0 + da) * 240, r: 6, dmg: 1, col: '#ff4a7a' }); }
      else if (d.straight) S.eshots.push({ x: e.x, y: e.y + 10, vx: 0, vy: 400, r: 5, dmg: 1, col: '#c8ff5a' });
      else { const a = Math.atan2(HERO_Y - e.y, S.hx - e.x); S.eshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, r: 6, dmg: 1, col: '#7dff5a' }); }
    }
    if (!e.dead && inSquad(e.x, e.y, e.r)) { e.dead = true; burst(e.x, e.y, '#ff5a4a', 10); hurt(d.dmg); if (S.mode !== 'play') return; }
    if (e.y > H + 50) e.dead = true;
  }
  for (const s of S.eshots) {
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) { s.vx = s.tvx; s.vy = s.tvy; sfx('hit'); } continue; }   // 火銃：瞄準線亮完才開槍
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.pool && !s.dead && s.y >= HERO_Y - 4) { s.dead = true; addPool(s.x); continue; }
    if (!s.dead && inSquad(s.x, s.y, s.r)) { if (s.pool) addPool(s.x); s.dead = true; if (s.freeze && !S.god) { S.slow = 1.6; text(S.hx, HERO_Y - 70, '冰凍', '#9fe8ff', 22); } hurt(s.dmg); if (S.mode !== 'play') return; }
    if (s.y > H + 20 || s.y < -40 || s.x < -20 || s.x > W + 20) s.dead = true;
  }
  for (const b of S.barrels) { b.y += SCROLL * dt; if (b.y > H + 40) b.dead = true; }

  // 門
  for (const g of S.gates) {
    g.y += SCROLL * dt;
    if (!g.used && g.y >= HERO_Y) { g.used = true; applyGate(S.hx < W / 2 ? g.L : g.R); }
    if (g.y > H + 60) g.dead = true;
  }

  // 子彈
  const B = S.boss;
  let hitSound = false;
  for (const b of S.bullets) {
    if (b.k === 'dart') homing(b, dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.y < -30 || b.x < -30 || b.x > W + 30) { b.dead = true; continue; }
    for (const g of S.gates) {
      if (g.used || Math.abs(b.y - g.y) > g.h / 2 || b.x < 20 || b.x > W - 20) continue;
      gateGrow(b.x < W / 2 ? g.L : g.R); b.dead = true; break;
    }
    if (b.dead) continue;
    for (const e of S.enemies) {
      if (e.dead || (ED[e.type].phase && !e.vis)) continue;
      const dx = b.x - e.x, dy = b.y - e.y, rr2 = (e.r + b.r) * (e.r + b.r);
      if (dx * dx + dy * dy < rr2 && b.aoe) { b.dead = true; if (explode(b.x, b.y, b)) return; break; }
      if (dx * dx + dy * dy < rr2 && bulletHit(b, e)) {
        const ar = ED[e.type].armor;   // 盾兵減傷，弓手破甲箭無視
        let dm = ar && !(S.pierce && S.cls.id === 'bow') ? bdmg(b) * (1 - ar) : bdmg(b); const cr = Math.random() < critC(); if (cr) dm *= critX();
        if (!(e.spT > S.t)) { e.spT = S.t + 0.08; addSpark(b.x, b.y, cr ? '#ffd23a' : '#fff6d0'); if (ED[e.type].r >= 25) sfx('thud'); }
        if (cr) sfx('crit');
        e.hp -= dm; e.fl = 0.07; e.kbT = ar ? 0.03 : 0.07; if (S.sk.frost) e.slowT = 1.6; hitSound = true; showDmg(e, dm, cr);
        if (!fxLow() && S.fx.length < 300 && Math.random() < 0.25) S.fx.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 260, vy: Math.random() * 120, life: 0.18, max: 0.18, col: '#ffffff', r: 2 });
        if (e.hp <= 0) { e.dead = true; killEnemy(e); }
        if (b.dead) break;
      }
    }
    if (b.dead) continue;
    for (const br of S.barrels) {
      if (br.dead) continue;
      const dx = b.x - br.x, dy = b.y - br.y;
      if (dx * dx + dy * dy < (br.r + b.r) * (br.r + b.r)) { b.dead = true; br.hp -= bdmg(b); if (br.hp <= 0) { br.dead = true; breakBarrel(br); } break; }
    }
    if (b.dead || !B || S.boss !== B || B.state === 'enter') continue;
    const dx = b.x - B.x, dy = b.y - B.y;
    if (dx * dx + dy * dy < (B.r + b.r) * (B.r + b.r)) {
      if (b.aoe) { b.dead = true; hitSound = true; if (explode(b.x, b.y, b)) return; }
      else if (bulletHit(b, B)) { hitSound = true; if (!(B.spT > S.t)) { B.spT = S.t + 0.05; addSpark(b.x + rr(-10, 10), b.y, '#fff6d0'); B.jit = 0.08; sfx('thud'); } if (hitBoss(bdmg(b))) return; }
    }
  }
  if (hitSound) sfx('hit');

  S.bullets = S.bullets.filter(b => !b.dead);
  S.enemies = S.enemies.filter(e => !e.dead);
  S.eshots = S.eshots.filter(s => !s.dead);
  S.barrels = S.barrels.filter(b => !b.dead);
  S.gates = S.gates.filter(g => !g.dead);
}
function updateFx(dt) {
  for (const p of S.fx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
  for (const t of S.texts) { t.y -= 50 * dt; t.life -= dt; }
  S.fx = S.fx.filter(p => p.life > 0); S.texts = S.texts.filter(t => t.life > 0);
}

// ---------- 繪圖 ----------
let ui = [];
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const NINE = {};
function nine(k, x, y, w, h, m, md) {   // m：原圖邊寬(px)；md：畫面上的邊寬
  const a = spr(k); if (!a) return false;
  const sc = Math.min(view.s * view.d, 2.5), key = k + '@' + Math.round(w) + 'x' + Math.round(h) + '@' + sc;
  let c = NINE[key];
  if (!c) {
    const nk = Object.keys(NINE); if (nk.length > 160) for (const kk of nk.slice(0, 80)) delete NINE[kk];
    c = document.createElement('canvas'); c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
    const x2 = c.getContext('2d'), I = a.img, sw = a.img.naturalWidth || a.w, sh = a.img.naturalHeight || a.h, r = sw / a.w, M = m * r, D = Math.min(md, w / 2.2, h / 2.2) * sc, cw = c.width, ch = c.height;
    x2.imageSmoothingQuality = 'high';
    const Dr = Math.round(D), xs = [0, M, sw - M, sw], ys = [0, M, sh - M, sh], xd = [0, Dr, cw - Dr, cw], yd = [0, Dr, ch - Dr, ch];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) x2.drawImage(I, xs[i] + (i ? 0.5 : 0), ys[j] + (j ? 0.5 : 0), xs[i + 1] - xs[i] - (i ? 0.5 : 0) - (i < 2 ? 0.5 : 0), ys[j + 1] - ys[j] - (j ? 0.5 : 0) - (j < 2 ? 0.5 : 0), xd[i], yd[j], xd[i + 1] - xd[i] + (i < 2 ? 1 : 0), yd[j + 1] - yd[j] + (j < 2 ? 1 : 0));   // 不取到相鄰區塊的像素，並重疊 1px，避免出現格線
    NINE[key] = c;
  }
  ctx.drawImage(c, x, y, w, h); return true;
}
const THREE = {};
function three(k, x, y, w, h, cap) {   // 橫向三段拉伸：左右兩端保持原比例(雲紋、圓頭不變形)，只拉中間
  const a = spr(k); if (!a) return false;
  const sc = Math.min(view.s * view.d, 2.5), key = k + '@' + Math.round(w) + 'x' + Math.round(h) + '@' + sc;
  let c = THREE[key];
  if (!c) {
    const nk = Object.keys(THREE); if (nk.length > 120) for (const kk of nk.slice(0, 60)) delete THREE[kk];
    c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * sc)); c.height = Math.max(1, Math.ceil(h * sc));
    const g = c.getContext('2d'), I = a.img, sw = I.naturalWidth || a.w, sh = I.naturalHeight || a.h, r = sw / a.w, C = cap * r;
    const D = Math.min(Math.round(c.height * cap / a.h), Math.floor(c.width / 2)); g.imageSmoothingQuality = 'high';
    g.drawImage(I, 0, 0, C, sh, 0, 0, D + 1, c.height);
    g.drawImage(I, C + 0.5, 0, sw - 2 * C - 1, sh, D, 0, c.width - 2 * D, c.height);
    g.drawImage(I, sw - C, 0, C, sh, c.width - D - 1, 0, D + 1, c.height);
    THREE[key] = c;
  }
  ctx.drawImage(c, x, y, w, h); return true;
}
function btnPlate(bg) {   // 依按鈕原本的顏色挑對應的美術底板
  const c = (bg || '#c0392b').replace('#', ''); if (c.length < 6) return 'ui_btn_red';
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 30) return mx < 110 ? 'ui_btn_brown' : 'ui_btn_gray';
  let h; if (mx === r) h = ((g - b) / (mx - mn) + 6) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4; h *= 60;
  if (mx < 100 && (h < 50 || h > 330)) return 'ui_btn_brown';
  if (h < 18 || h >= 330) return 'ui_btn_red';
  if (h < 52) return mx < 150 ? 'ui_btn_brown' : 'ui_btn_gold';
  if (h < 170) return 'ui_btn_green';
  if (h < 250) return 'ui_btn_blue';
  return 'ui_btn_purple';
}
const PLATE_T = { '': ['#3d2918', '#2a1b10', '#1c1209'], gold: ['#6a4a16', '#4a3210', '#2c1d08'], red: ['#7a2418', '#561810', '#33100a'], dim: ['#2c2620', '#221d18', '#16120e'] };
function plate(x, y, w, h, r = 14, tint = '') {   // 統一的高級面板：漆木漸層＋上緣光澤＋雙層金框＋金色角花＋陰影(全遊戲共用)
  const T = PLATE_T[tint] || PLATE_T[''];
  if (spr('ui_plate')) {   // 美術面板(九宮格，四角雲紋不變形)
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillStyle = '#1c1209'; roundRect(x + 4, y + 4, w - 8, h - 8, r); ctx.fill(); ctx.restore();
    nine('ui_plate', x, y, w, h, 86, Math.min(30, h * 0.36));
    const TI = { gold: 'rgba(200,140,30,.30)', red: 'rgba(175,30,20,.38)', dim: 'rgba(0,0,0,.38)' }[tint];
    if (TI) { ctx.fillStyle = TI; roundRect(x + 7, y + 7, w - 14, h - 14, Math.max(3, r - 6)); ctx.fill(); }
    roundRect(x + 3, y + 3, w - 6, h - 6, r); return;
  }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, T[0]); g.addColorStop(0.45, T[1]); g.addColorStop(1, T[2]);
  ctx.fillStyle = g; roundRect(x, y, w, h, r); ctx.fill(); ctx.restore();
  ctx.save(); roundRect(x, y, w, h, r); ctx.clip();
  const hh = Math.min(36, h * 0.45), hl = ctx.createLinearGradient(0, y, 0, y + hh); hl.addColorStop(0, 'rgba(255,225,170,.13)'); hl.addColorStop(1, 'rgba(255,225,170,0)'); ctx.fillStyle = hl; ctx.fillRect(x, y, w, hh);
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  ctx.restore();
  const gb = ctx.createLinearGradient(0, y, 0, y + h); gb.addColorStop(0, '#fbe39a'); gb.addColorStop(0.5, '#c9973e'); gb.addColorStop(1, '#85561b');
  ctx.lineWidth = 2.4; ctx.strokeStyle = gb; roundRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4, r); ctx.stroke();
  if (h > 40 && w > 60) { ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(250,215,140,.28)'; roundRect(x + 6, y + 6, w - 12, h - 12, Math.max(3, r - 5)); ctx.stroke();
    const c = Math.min(14, h * 0.22); ctx.strokeStyle = '#f2cf78'; ctx.lineWidth = 2; ctx.lineCap = 'round';   // 四角金色角花
    [[x + 6, y + 6, 1, 1], [x + w - 6, y + 6, -1, 1], [x + 6, y + h - 6, 1, -1], [x + w - 6, y + h - 6, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy + sy * c); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * c, cy); ctx.stroke();
      ctx.fillStyle = '#f7da8a'; ctx.beginPath(); ctx.moveTo(cx + sx * 4, cy + sy * 1); ctx.lineTo(cx + sx * 7, cy + sy * 4); ctx.lineTo(cx + sx * 4, cy + sy * 7); ctx.lineTo(cx + sx * 1, cy + sy * 4); ctx.closePath(); ctx.fill(); });
    ctx.lineCap = 'butt'; }
  roundRect(x, y, w, h, r);   // 留下路徑，呼叫端若要再描一圈品級色可直接 stroke()
}
function panel(x, y, w, h, alpha = 1) {   // 美術面板(木框＋雲紋角)，沒有圖就回傳 false
  if (!spr('ui_panel')) return false;
  ctx.globalAlpha = alpha; const ok = nine('ui_panel', x, y, w, h, 48, Math.min(34, h * 0.3)); ctx.globalAlpha = 1; return ok;
}
function fbtn(x, y, w, h, label, act, opt = {}) {   // 功能按鈕：還沒開放就顯示「通關 x-x 開啟」
  if (featOpen(act)) { btn(x, y, w, h, label, act, opt); return true; }
  btn(x, y, w, h, '', 'noop', { bg: '#555', disabled: true }); ui.push({ x, y, w, h, act: 'locked:' + act });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#cfc6b8'; ctx.font = `${Math.round((opt.size || 23) * 0.82)}px ${TFONT}`; ctx.fillText(label, x + w / 2, y + h * 0.38);
  ctx.fillStyle = '#ffd98a'; ctx.font = `bold 12px ${FONT}`; ctx.fillText(`通關 ${featNeed(act)} 開啟`, x + w / 2, y + h * 0.74);
  return false;
}
function plate2(k, x, y, w, h) {   // 寬按鈕：左右兩半各自等比拉伸(光斑、雲紋不會被拉成長條)，離屏以裝置解析度高品質縮放
  const a = spr(k); if (!a) return false;
  const sc = Math.min(view.s * view.d, 2.5), key = k + '@P2@' + Math.round(w) + 'x' + Math.round(h) + '@' + sc;
  let c = NINE[key];
  if (!c) {
    const I = a.img, sw = I.naturalWidth || a.w, sh = I.naturalHeight || a.h;
    c = document.createElement('canvas'); c.width = Math.ceil(w * sc); c.height = Math.ceil(h * sc);
    const x2 = c.getContext('2d'); x2.imageSmoothingQuality = 'high';
    const hw = Math.ceil(c.width / 2);
    x2.drawImage(I, 0, 0, sw / 2, sh, 0, 0, hw, c.height); x2.drawImage(I, sw / 2, 0, sw / 2, sh, hw - 1, 0, c.width - hw + 1, c.height);
    NINE[key] = c;
  }
  ctx.drawImage(c, x, y, w, h); return true;
}
function btn(x, y, w, h, label, act, opt = {}) {
  if (spr('ui_btn_red')) {
    if (!opt.disabled) ui.push({ x, y, w, h, act });
    if (h < 6) return;
    const pk = opt.disabled ? 'ui_btn_gray' : btnPlate(opt.bg);
    if (w >= 340) plate2(pk, x, y, w, h); else nine(pk, x, y, w, h, 46, Math.min(h * 0.42, 26));
    ctx.globalAlpha = opt.disabled ? 0.6 : 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${opt.size || 26}px ${TFONT}`;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, (opt.size || 26) / 5); ctx.strokeStyle = 'rgba(20,8,4,.8)'; ctx.strokeText(label, x + w / 2, y + h / 2 + 1);
    ctx.fillStyle = '#fff6e0'; ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.globalAlpha = 1; return;
  }
  if (!opt.disabled) ui.push({ x, y, w, h, act });
  ctx.globalAlpha = opt.disabled ? 0.45 : 1;
  ctx.fillStyle = opt.bg || '#c0392b'; roundRect(x, y, w, h, 14); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = opt.border || '#f5d27a'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${opt.size || 26}px ${TFONT}`;
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, (opt.size || 26) / 5); ctx.strokeStyle = 'rgba(20,8,4,.75)'; ctx.strokeText(label, x + w / 2, y + h / 2 + 1);
  ctx.fillStyle = '#fff6e0'; ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.globalAlpha = 1;
}
function soundBtn(x, y) {
  ui.push({ x, y, w: 52, h: 48, act: 'mute' });
  if (!drawIcon('ui_round', x + 26, y + 24, 56)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, 52, 48, 12); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + 12, y + 19); ctx.lineTo(x + 19, y + 19); ctx.lineTo(x + 28, y + 11); ctx.lineTo(x + 28, y + 37); ctx.lineTo(x + 19, y + 29); ctx.lineTo(x + 12, y + 29); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = save.mute ? '#ff6a5a' : '#fff'; ctx.lineWidth = 3; ctx.beginPath();
  if (save.mute) { ctx.moveTo(x + 32, y + 17); ctx.lineTo(x + 42, y + 31); ctx.moveTo(x + 42, y + 17); ctx.lineTo(x + 32, y + 31); }
  else { ctx.arc(x + 30, y + 24, 8, -0.8, 0.8); ctx.moveTo(x + 36, y + 13); ctx.arc(x + 30, y + 24, 13, -0.85, 0.85); }
  ctx.stroke();
}
function inkText(txt, x, y, size, opt = {}) {   // 墨色描邊＋金色漸層的書法感文字
  ctx.save();
  ctx.textAlign = opt.align || 'center'; ctx.textBaseline = 'middle'; ctx.font = `${size}px ${TFONT}`;
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowOffsetY = size / 16; ctx.shadowBlur = size / 10;
  ctx.lineWidth = size / 4.2; ctx.strokeStyle = '#140a05'; ctx.strokeText(txt, x, y);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = size / 11; ctx.strokeStyle = opt.edge || '#8a1a12'; ctx.strokeText(txt, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  const c = opt.cols || ['#fff6d0', '#ffd25a', '#c47a14'];
  g.addColorStop(0, c[0]); g.addColorStop(0.55, c[1]); g.addColorStop(1, c[2]);
  ctx.fillStyle = g; ctx.fillText(txt, x, y);
  ctx.restore();
}
function sealStamp(x, y, size, ch) {   // 紅色印章
  const sa = spr('ui_seal');
  if (sa) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12); ctx.fillStyle = 'rgba(255,240,225,.92)'; ctx.fillRect(-size * 0.42, -size * 0.42, size * 0.84, size * 0.84);
    ctx.drawImage(sa.img, -size / 2, -size / 2, size, size); ctx.fillStyle = '#b8241a'; ctx.font = `900 ${size * 0.6}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * 0.04); ctx.restore(); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
  ctx.fillStyle = '#b8241a'; roundRect(-size / 2, -size / 2, size, size, size * 0.12); ctx.fill();
  ctx.strokeStyle = '#ffd9c8'; ctx.lineWidth = size * 0.05; roundRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8, size * 0.08); ctx.stroke();
  ctx.fillStyle = '#ffeee6'; ctx.font = `900 ${size * 0.62}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * 0.04);
  ctx.restore();
}
const STARC = {};
function starSprite(px, on) {   // 向量星星：依實際像素大小重畫，小尺寸也銳利(切面＋光澤＋深色描邊)
  const k = px + (on ? 'a' : 'b'); if (STARC[k]) return STARC[k];
  const pad = Math.ceil(px * 0.12), c = document.createElement('canvas'); c.width = c.height = px + pad * 2;
  const g = c.getContext('2d'), cx = c.width / 2, cy = c.height / 2 + px * 0.04, R = px / 2, r = R * 0.5;
  const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2]); }
  const path = () => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  path(); g.lineJoin = 'round'; g.lineWidth = Math.max(1.6, px * 0.13); g.strokeStyle = on ? '#3d2104' : '#16100b'; g.stroke();   // 外描邊
  path(); const lg = g.createLinearGradient(0, cy - R, 0, cy + R);
  if (on) { lg.addColorStop(0, '#fff6c8'); lg.addColorStop(0.45, '#ffcf3a'); lg.addColorStop(1, '#d9800c'); } else { lg.addColorStop(0, '#6e6358'); lg.addColorStop(1, '#2f2822'); }
  g.fillStyle = lg; g.fill();
  if (px >= 12) for (let i = 0; i < 10; i++) {   // 切面：每個尖角左右兩半一亮一暗，做出立體感
    const a = pts[i], b = pts[(i + 1) % 10]; g.beginPath(); g.moveTo(cx, cy); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath();
    g.fillStyle = (i % 2 === 0) ? (on ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.08)') : (on ? 'rgba(150,70,0,.22)' : 'rgba(0,0,0,.22)'); g.fill();
  }
  if (on && px >= 10) { g.save(); path(); g.clip(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - R * 0.22, cy - R * 0.42, R * 0.28, R * 0.12, -0.5, 0, 6.283); g.fill(); g.restore(); }   // 高光
  path(); g.lineWidth = Math.max(0.8, px * 0.035); g.strokeStyle = on ? 'rgba(255,240,180,.85)' : 'rgba(150,140,130,.35)'; g.stroke();   // 內圈亮邊
  return STARC[k] = { c, pad };
}
function drawStar(x, y, size, on, glow) {   // 星星(向量繪製，所有畫面共用)
  const d = view.s * view.d, px = Math.max(8, Math.round(size * d)), S2 = starSprite(px, on), sc = size / px;
  if (on && glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(x, y, 1, x, y, size * 0.9); gr.addColorStop(0, 'rgba(255,200,80,.45)'); gr.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, size * 0.9, 0, 6.283); ctx.fill(); ctx.restore(); }
  ctx.drawImage(S2.c, x - S2.c.width * sc / 2, y - S2.c.height * sc / 2, S2.c.width * sc, S2.c.height * sc);
}
function title(txt, y, size = 76) { inkText(txt, W / 2, y, size); }

const SIDE = 30;
const THEMES = [
  { ground: '#cdb88c', track: 'rgba(120,95,60,.22)', stone: 'rgba(110,90,60,.25)', side: '#3f6b33', side2: '#2c4f24', deco: 'grass' },   // 村口
  { ground: '#c8b07a', track: 'rgba(110,90,50,.22)', stone: 'rgba(100,85,50,.22)', side: '#5f8f38', side2: '#7fb04a', deco: 'crop' },    // 田埂
  { ground: '#aaa08e', track: 'rgba(80,75,65,.25)',  stone: 'rgba(70,68,60,.35)',  side: '#5d6656', side2: '#3e443a', deco: 'rock' },    // 山道
  { ground: '#a07c58', track: 'rgba(70,45,25,.25)',  stone: 'rgba(70,50,30,.3)',   side: '#3a281b', side2: '#6e4a2c', deco: 'fence' },   // 寨門
  { ground: '#7e5d4c', track: 'rgba(40,20,15,.3)',   stone: 'rgba(40,20,15,.35)',  side: '#2b1717', side2: '#4a2a1e', deco: 'torch' },   // 黑風寨
  { ground: '#b8a878', track: 'rgba(90,80,40,.22)',  stone: 'rgba(80,90,50,.25)',  side: '#2f5a2a', side2: '#6aa83e', deco: 'bamboo' },  // 竹林入口
  { ground: '#a9a070', track: 'rgba(80,80,40,.22)',  stone: 'rgba(70,90,50,.28)',  side: '#21482a', side2: '#78b84a', deco: 'bamboo' },  // 竹海
  { ground: '#b0a68a', track: 'rgba(90,85,70,.22)',  stone: 'rgba(80,80,70,.28)',  side: '#2f6f9a', side2: '#9ad8f2', deco: 'water' },   // 溪橋
  { ground: '#9a8a60', track: 'rgba(70,60,30,.25)',  stone: 'rgba(70,60,30,.3)',   side: '#2a3f22', side2: '#8a9a4a', deco: 'bamboo' },  // 青竹幫寨
  { ground: '#6f6a50', track: 'rgba(30,30,20,.3)',   stone: 'rgba(30,40,25,.35)',  side: '#122617', side2: '#3f7a3a', deco: 'bamboo' },  // 竹林深處
  { ground: '#6a4a44', track: 'rgba(40,10,10,.3)',   stone: 'rgba(40,10,10,.35)',  side: '#2a0e14', side2: '#5a1a22', deco: 'torch' },   // 山門
  { ground: '#5a2e2e', track: 'rgba(40,0,0,.3)',     stone: 'rgba(60,0,0,.35)',    side: '#1e0606', side2: '#ff5a1a', deco: 'lava' },    // 血池
  { ground: '#4a3a44', track: 'rgba(20,10,20,.3)',   stone: 'rgba(20,10,30,.35)',  side: '#1a1020', side2: '#3a2a44', deco: 'rock' },    // 煉獄長廊
  { ground: '#3a3444', track: 'rgba(10,20,20,.3)',   stone: 'rgba(10,30,30,.35)',  side: '#0e1418', side2: '#3a2a44', deco: 'torch' },   // 鬼火殿
  { ground: '#3e1e26', track: 'rgba(20,0,0,.35)',    stone: 'rgba(30,0,0,.4)',     side: '#140406', side2: '#ff3a1a', deco: 'lava' },    // 魔教總壇
  { ground: '#dfe8ee', track: 'rgba(120,150,170,.25)', stone: 'rgba(140,170,190,.35)', side: '#5a7a8a', side2: '#2f4a3a', deco: 'pine' },   // 雪嶺
  { ground: '#cfe4f0', track: 'rgba(90,140,180,.3)',   stone: 'rgba(120,170,210,.35)', side: '#4a7aa0', side2: '#bfefff', deco: 'water' },  // 冰河
  { ground: '#d8dfe4', track: 'rgba(110,120,130,.3)',  stone: 'rgba(120,130,140,.35)', side: '#3a4a54', side2: '#6a7a84', deco: 'rock' },   // 風雪棧道
  { ground: '#e4eaee', track: 'rgba(120,140,160,.25)', stone: 'rgba(140,160,180,.3)',  side: '#4a5a6a', side2: '#2f4a3a', deco: 'pine' },   // 天山劍閣
  { ground: '#bcd4e8', track: 'rgba(60,100,150,.3)',   stone: 'rgba(80,120,170,.35)',  side: '#1a2a44', side2: '#9fe8ff', deco: 'torch' },  // 冰魄宮
  { ground: '#7a8a5a', track: 'rgba(40,60,20,.3)',  stone: 'rgba(40,60,30,.35)', side: '#1f3a1a', side2: '#6aa83e', deco: 'bamboo' },   // 瘴氣林
  { ground: '#6a7a4a', track: 'rgba(30,50,20,.3)',  stone: 'rgba(30,50,20,.35)', side: '#203a14', side2: '#a8d84a', deco: 'grass' },    // 蠱蟲谷
  { ground: '#8a7050', track: 'rgba(60,40,20,.3)',  stone: 'rgba(60,40,20,.35)', side: '#1f4a3a', side2: '#5ac8a0', deco: 'water' },    // 苗寨吊橋
  { ground: '#4a5a3a', track: 'rgba(20,40,10,.3)',  stone: 'rgba(30,60,20,.4)',  side: '#142a10', side2: '#7aff5a', deco: 'lava' },     // 五毒潭
  { ground: '#3a3a2a', track: 'rgba(10,20,5,.35)',  stone: 'rgba(20,40,10,.4)',  side: '#0e1a0a', side2: '#5aa83a', deco: 'torch' },    // 萬蠱窟
  { ground: '#b89a7a', track: 'rgba(90,40,30,.25)', stone: 'rgba(100,50,40,.3)', side: '#7a1f1f', side2: '#d8a83a', deco: 'fence' },    // 午門
  { ground: '#c8b89a', track: 'rgba(90,70,40,.25)', stone: 'rgba(90,80,60,.3)',  side: '#2f5a8a', side2: '#e8e0c8', deco: 'water' },    // 金水橋
  { ground: '#5a4a44', track: 'rgba(30,20,20,.3)',  stone: 'rgba(30,20,20,.35)', side: '#1e1414', side2: '#5a3a2a', deco: 'torch' },    // 東廠詔獄
  { ground: '#d8c8a8', track: 'rgba(110,80,50,.25)', stone: 'rgba(120,90,60,.3)', side: '#8a2a1f', side2: '#ffc23a', deco: 'fence' },   // 太和殿前
  { ground: '#4a3a5a', track: 'rgba(20,10,40,.3)',  stone: 'rgba(30,20,50,.35)', side: '#140a24', side2: '#ffc23a', deco: 'torch' },    // 紫禁之巔
];
const hash = n => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
const BG_ZOOM = { bg_ch1: 1.06, bg_ch3: 1.22, bg_ch4: 1.18, bg_ch5: 1.1, bg_ch6: 1.18 };   // 路偏窄的章節：從中間放大，讓可走的路寬一致(約佔畫面 8 成)
const BGC = {}, BG_LOOP = new Set(['bg_ch3', 'bg_ch4', 'bg_ch5', 'bg_ch6', 'bg_ch7', 'bg_ch8', 'bg_ch9', 'bg_ch10', 'bg_ch11', 'bg_ch12']);   // 這兩張本身就是無縫循環圖
function bgTile(k) {   // 預先把「原圖＋上下翻轉」畫成一張長圖，捲動時只要貼兩次
  k = artKey(k); const a = spr(k), sc = Math.min(view.s * view.d, 1.4);   // 原圖寬 720，解析度上限 1.4 倍即可
  if (!a) return null;
  if (BGC[k] && BGC[k].s === sc) return BGC[k];
  const z = BG_ZOOM[k] || 1, sw = a.img.width / z, h = W * a.h * z / a.w, c = document.createElement('canvas'), loop = BG_LOOP.has(k), n = loop ? 1 : 2;
  c.width = Math.round(W * sc); c.height = Math.round(h * n * sc);
  const x = c.getContext('2d'); x.scale(sc, sc);
  x.drawImage(a.img, (a.img.width - sw) / 2, 0, sw, a.img.height, 0, 0, W, h);
  if (!loop) { x.save(); x.translate(0, h * 2); x.scale(1, -1); x.drawImage(a.img, 0, 0, W, h); x.restore(); }
  return (BGC[k] = { cv: c, h: h * n, s: sc });
}
const STAGE_TINT = [null, 'rgba(255,215,110,.10)', 'rgba(80,85,95,.30)', 'rgba(90,50,20,.26)', 'rgba(35,0,0,.48)',
                    null, 'rgba(0,45,15,.18)', 'rgba(40,100,150,.16)', 'rgba(110,80,30,.22)', 'rgba(0,12,6,.52)',
                    null, 'rgba(120,0,0,.18)', 'rgba(60,0,60,.22)', 'rgba(0,40,40,.25)', 'rgba(30,0,0,.45)',
                    null, 'rgba(160,210,255,.12)', 'rgba(60,70,90,.2)', 'rgba(200,220,240,.12)', 'rgba(10,30,70,.45)',
                    null, 'rgba(40,90,20,.18)', 'rgba(60,40,10,.18)', 'rgba(20,80,30,.28)', 'rgba(5,25,5,.48)',
                    null, 'rgba(255,200,120,.10)', 'rgba(60,20,20,.32)', 'rgba(255,190,90,.12)', 'rgba(20,5,40,.46)'];
function drawSnow() {   // 場景飄落物：第四章雪、第五章毒孢子、第六章火星
  if (!(S.mode === 'play' || S.mode === 'result' || S.mode === 'revive') || fxLow()) return;
  const ch = [0, 1, 2, 3, 4, 5, -1, -1, 4, 3, 5, -1][STAGES[S.stage].ch];   // 新章節：古墓毒孢子、崑崙雪、地府火星
  if (ch === 4 || ch === 5) {
    ctx.fillStyle = ch === 4 ? 'rgba(170,255,90,.55)' : 'rgba(255,200,90,.7)';
    const pa = spr(ch === 4 ? 'pt_spore' : 'pt_ember'), pc = pa && sprCache(ch === 4 ? 'pt_spore' : 'pt_ember', pa, 16);
    for (let i = 0; i < 26; i++) {
      const h = hash(i * 11 + 5), x = ((h * W + Math.sin(AT * 0.6 + i) * 24) % W + W) % W, y = H - ((hash(i * 17) * H + AT * (25 + h * 35)) % H);
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(AT * 2 + i));
      if (pc) { const z = 7 + h * 9; ctx.drawImage(pc.cv, x - z / 2, y - z / 2, z * pc.w / 16, z); } else { ctx.beginPath(); ctx.arc(x, y, 1.5 + h * 2.2, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1; return;
  }
  if (ch !== 3) return;
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  const sa = spr('pt_snow'), scv = sa && sprCache('pt_snow', sa, 20);
  for (let i = 0; i < 46; i++) {
    const h = hash(i * 7 + 3), x = ((h * W + Math.sin(AT * 0.8 + i) * 30 + AT * 18 * (h - 0.5)) % W + W) % W, y = ((hash(i * 13) * H + AT * (60 + h * 60)) % H);
    if (scv) { const z = 6 + h * 10; ctx.globalAlpha = 0.85; ctx.drawImage(scv.cv, x - z / 2, y - z / 2, z, z); } else { ctx.beginPath(); ctx.arc(x, y, 1.5 + h * 2, 0, 6.283); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function drawImgBg() {
  const inGame = S.mode === 'play' || S.mode === 'result' || S.mode === 'revive';
  if (!inGame) { const m = spr('bg_menu'); if (!m) return false; ctx.drawImage(m.img, 0, 0, W, H); return true; }
  const st = S.stage, T = bgTile('bg_ch' + (STAGES[st].ch + 1)), sq = (STAGES[st].ch < 6 ? STAGES[st].ch : CH_FB[STAGES[st].ch]) * 5 + ((st % 10) >> 1);   // sq：同一章內的時段(白天→黃昏→夜晚)
  if (!T) return false;
  // 只貼畫面看得到的那一段(不整張縮放)，手機上省很多效能
  let y = 0, ty = (T.h - S.scroll % T.h) % T.h;
  while (y < H) {
    const hh = Math.min(H - y, T.h - ty);
    ctx.drawImage(T.cv, 0, ty * T.s, T.cv.width, hh * T.s, 0, y, W, hh);
    y += hh; ty = 0;
  }
  if (STAGE_TINT[sq]) { ctx.fillStyle = STAGE_TINT[sq]; ctx.fillRect(0, 0, W, H); }
  if (sq % 5 === 4) { drawDeco(THEMES[4], 0, S.scroll, 1); drawDeco(THEMES[4], W - SIDE, S.scroll, 2); }   // 夜晚關卡加火把
  return true;
}
function drawBg() {
  if (drawImgBg()) return;
  const th = THEMES[S.mode === 'play' || S.mode === 'result' ? ((STAGES[S.stage].ch < 6 ? STAGES[S.stage].ch : CH_FB[STAGES[S.stage].ch]) * 5 + ((S.stage % 10) >> 1)) : 0], sc = S.scroll;
  ctx.fillStyle = th.side; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = th.ground; ctx.fillRect(SIDE, 0, W - SIDE * 2, H);
  for (const [x0, x1] of [[SIDE, SIDE + 46], [W - SIDE, W - SIDE - 46]]) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), 0, 46, H);
  }
  ctx.strokeStyle = th.track; ctx.lineWidth = 7; ctx.setLineDash([70, 34]); ctx.lineDashOffset = -sc;
  ctx.beginPath(); ctx.moveTo(W * 0.35, 0); ctx.lineTo(W * 0.35, H); ctx.moveTo(W * 0.65, 0); ctx.lineTo(W * 0.65, H); ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  const step = 70, base = Math.floor(sc / step);
  ctx.fillStyle = th.stone;
  for (let k = -1; k <= H / step + 1; k++) {
    const id = base - k, y = k * step + (sc % step), h1 = hash(id), h2 = hash(id + 999);
    if (h1 < 0.55) { ctx.beginPath(); ctx.ellipse(SIDE + 30 + h2 * (W - SIDE * 2 - 60), y, 6 + h1 * 14, 4 + h1 * 6, 0, 0, 6.283); ctx.fill(); }
  }
  drawDeco(th, 0, sc, 1); drawDeco(th, W - SIDE, sc, 2);
}
let GLOW = null;
function glowSprite() { if (GLOW) return GLOW; GLOW = document.createElement('canvas'); GLOW.width = GLOW.height = 96; const x = GLOW.getContext('2d'), g = x.createRadialGradient(48, 48, 2, 48, 48, 48); g.addColorStop(0, 'rgba(255,170,60,.45)'); g.addColorStop(1, 'rgba(255,100,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 96, 96); return GLOW; }
function drawDeco(th, x0, sc, salt) {
  const cx = x0 + SIDE / 2;
  if (th.deco === 'bamboo') {   // 竹子：整排竹竿＋竹節＋竹葉
    for (const [ox, w] of [[4, 8], [17, 9]]) {
      ctx.fillStyle = th.side2; ctx.fillRect(x0 + ox, 0, w, H);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + ox + 1, 0, 2, H);
    }
    const step = 52, base = Math.floor(sc / step);
    for (let k = -1; k <= H / step + 1; k++) {
      const id = (base - k) * 5 + salt, y = k * step + (sc % step), h = hash(id);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0 + 3, y + h * 10, 10, 3); ctx.fillRect(x0 + 16, y + 20 + h * 8, 11, 3);
      if (h > 0.45) {
        ctx.fillStyle = th.side2; const lx = salt === 1 ? x0 + SIDE : x0, dir = salt === 1 ? 1 : -1;
        ctx.beginPath(); ctx.ellipse(lx + dir * 8, y + 14, 14, 4, dir * 0.5, 0, 6.283); ctx.fill();
      }
    }
    return;
  }
  if (th.deco === 'pine') {     // 雪松
    const step = 72, base = Math.floor(sc / step);
    for (let k = -1; k <= H / step + 1; k++) {
      const y = k * step + (sc % step), h = hash((base - k) * 11 + salt), tx = cx + (h - 0.5) * 8, s2 = 0.8 + h * 0.4;
      ctx.fillStyle = th.side2;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(tx, y - 26 * s2 + j * 12 * s2); ctx.lineTo(tx - (10 + j * 4) * s2, y - 8 * s2 + j * 12 * s2); ctx.lineTo(tx + (10 + j * 4) * s2, y - 8 * s2 + j * 12 * s2); ctx.fill(); }
      ctx.fillStyle = '#f4faff'; ctx.beginPath(); ctx.moveTo(tx, y - 26 * s2); ctx.lineTo(tx - 6 * s2, y - 17 * s2); ctx.lineTo(tx + 6 * s2, y - 17 * s2); ctx.fill();
    }
    return;
  }
  if (th.deco === 'lava') {     // 岩漿：發光裂縫往下流
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = th.side2; ctx.lineWidth = 3;
    const step = 64, base = Math.floor(sc / step);
    for (let k = -1; k <= H / step + 1; k++) {
      const y = k * step + (sc % step), h = hash((base - k) * 3 + salt);
      ctx.globalAlpha = 0.45 + 0.35 * Math.sin(S.t * 3 + k);
      ctx.beginPath(); ctx.moveTo(x0 + 4 + h * 8, y); ctx.lineTo(x0 + 14 + h * 6, y + 22); ctx.lineTo(x0 + 8 + h * 10, y + 44); ctx.lineTo(x0 + 20, y + step); ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (th.deco === 'water') {    // 溪流：水波往下流
    ctx.strokeStyle = th.side2; ctx.lineWidth = 2;
    const step = 26, off = (sc * 1.4) % step;
    for (let y = -step + off; y < H + step; y += step) { ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.quadraticCurveTo(cx, y - 6, x0 + SIDE - 4, y); ctx.stroke(); }
    return;
  }
  if (th.deco === 'crop') {   // 稻田：一排排秧苗
    const step = 22, base = Math.floor(sc / step);
    for (let k = -1; k <= H / step + 1; k++) {
      const y = k * step + (sc % step);
      ctx.fillStyle = (base - k) % 2 ? th.side2 : th.side; ctx.fillRect(x0, y, SIDE, step);
      ctx.fillStyle = '#9ccc5a'; for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 5 + i * 9, y + 6, 3, 9);
    }
    return;
  }
  const step = th.deco === 'torch' ? 170 : th.deco === 'fence' ? 20 : 46, base = Math.floor(sc / step);
  for (let k = -1; k <= H / step + 1; k++) {
    const id = (base - k) * 7 + salt, y = k * step + (sc % step), h = hash(id);
    switch (th.deco) {
      case 'grass':
        ctx.fillStyle = th.side2;
        for (let i = 0; i < 3; i++) { const gx = x0 + 6 + h * 8 + i * 6; ctx.beginPath(); ctx.moveTo(gx - 4, y + 12); ctx.lineTo(gx, y - 4 - h * 6); ctx.lineTo(gx + 4, y + 12); ctx.fill(); }
        if (h > 0.8) { ctx.fillStyle = '#e8c84a'; ctx.beginPath(); ctx.arc(cx + (h - 0.9) * 40, y + 20, 3, 0, 6.283); ctx.fill(); }
        break;
      case 'rock':
        ctx.fillStyle = th.side2; ctx.beginPath(); ctx.ellipse(cx + (h - 0.5) * 10, y, 9 + h * 7, 7 + h * 5, h, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(cx + (h - 0.5) * 10 - 3, y - 3, 4 + h * 3, 3, h, 0, 6.283); ctx.fill();
        break;
      case 'fence':
        ctx.fillStyle = th.side2; ctx.fillRect(cx - 5, y, 10, step - 3);
        ctx.beginPath(); ctx.moveTo(cx - 5, y); ctx.lineTo(cx, y - 8); ctx.lineTo(cx + 5, y); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx + 2, y, 3, step - 3);
        break;
      case 'torch': {
        const ta = spr('ui_torch');
        if (ta) {
          const th2 = 70, fl = 0.8 + Math.sin(S.t * 18 + id) * 0.2;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = glowSprite(); ctx.drawImage(gl, cx - 44 * fl, y - 10 - 44 * fl, 88 * fl, 88 * fl); ctx.restore();
          const c = sprCache('ui_torch', ta, th2); ctx.drawImage(c.cv, cx - c.w / 2, y - 22, c.w, th2); break;
        }
        ctx.fillStyle = '#3d2618'; ctx.fillRect(cx - 3, y, 6, 40);
        const fl = 0.8 + Math.sin(S.t * 18 + id) * 0.2;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx, y - 4, 2, cx, y - 4, 46 * fl); g.addColorStop(0, 'rgba(255,170,60,.55)'); g.addColorStop(1, 'rgba(255,100,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, y - 4, 46 * fl, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.ellipse(cx, y - 6, 5, 9 * fl, 0, 0, 6.283); ctx.fill();
        ctx.restore();
        break;
      }
    }
  }
}
function drawGates() {
  if (spr('ui_gate_b')) { drawGatesArt(); return; }
  drawGatesOld();
}
function drawGatesArt() {   // 每一邊一座牌坊，布幔顏色代表好壞，文字寫在布幔上
  for (const g of S.gates) {
    if (g.used) continue;
    const near = g.y > HERO_Y - 360, pick = S.hx < W / 2 ? 'L' : 'R';   // 門靠近時，標出你會走進的那一邊
    for (const side of ['L', 'R']) {
      const gt = g[side], good = gateGood(gt), a = spr(good ? 'ui_gate_b' : 'ui_gate_r'), on = near && side === pick;
      ctx.globalAlpha = near && !on ? 0.5 : 1;
      const gw = W / 2 - SIDE + 18, gh = gw * a.h / a.w, cx = side === 'L' ? SIDE + (W / 2 - SIDE) / 2 : W / 2 + (W / 2 - SIDE) / 2;
      const top = g.y - gh * 0.46;   // 布幔中心對齊門的判定線
      ctx.drawImage(sprCache(good ? 'ui_gate_b' : 'ui_gate_r', a, Math.round(gh)).cv, cx - gw / 2, top, gw, gh);
      jhUiGateAccent(cx,g.y,gw,good,on);
      ctx.font = `30px ${NFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = good ? '#0d2f66' : '#5a0d0a'; ctx.strokeText(gateLabel(gt), cx, g.y + 1);
      ctx.fillStyle = '#fff'; ctx.fillText(gateLabel(gt), cx, g.y + 1);
      ctx.globalAlpha = 1;
      if (on) { const pz = 0.5 + 0.5 * Math.sin(AT * 10); ctx.strokeStyle = good ? `rgba(140,230,255,${0.5 + pz * 0.5})` : `rgba(255,140,120,${0.5 + pz * 0.5})`; ctx.lineWidth = 4; roundRect(cx - gw * 0.4, g.y - g.h * 0.42, gw * 0.8, g.h * 0.84, 8); ctx.stroke(); }
    }
    if (near) { ctx.fillStyle = '#3a2418'; ctx.fillRect(W / 2 - 5, g.y - 40, 10, 80); ctx.fillStyle = '#d8a842'; ctx.fillRect(W / 2 - 7, g.y - 44, 14, 6); }   // 中間的分隔柱
  }
}
function drawGatesOld() {
  for (const g of S.gates) {
    if (g.used) continue;
    const top = g.y - g.h / 2;
    for (const side of ['L', 'R']) {
      const gt = g[side], x0 = side === 'L' ? SIDE + 2 : W / 2 + 7, w = W / 2 - SIDE - 9, good = gateGood(gt);
      const grd = ctx.createLinearGradient(0, top, 0, top + g.h);
      if (good) { grd.addColorStop(0, 'rgba(70,150,240,.82)'); grd.addColorStop(1, 'rgba(30,90,190,.82)'); }
      else { grd.addColorStop(0, 'rgba(235,90,70,.82)'); grd.addColorStop(1, 'rgba(170,35,30,.82)'); }
      ctx.fillStyle = grd; ctx.fillRect(x0, top, w, g.h);
      ctx.fillStyle = good ? 'rgba(200,235,255,.5)' : 'rgba(255,210,200,.5)'; ctx.fillRect(x0, top + 4, w, 3); ctx.fillRect(x0, top + g.h - 7, w, 3);
      ctx.font = `30px ${NFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = good ? '#0d2f66' : '#5a0d0a'; ctx.strokeText(gateLabel(gt), x0 + w / 2, g.y + 1);
      ctx.fillStyle = '#fff'; ctx.fillText(gateLabel(gt), x0 + w / 2, g.y + 1);
    }
    // 牌坊：柱子＋屋簷
    for (const px of [SIDE - 6, W / 2 - 6, W - SIDE - 6]) {
      ctx.fillStyle = '#7a2b1c'; ctx.fillRect(px, top - 22, 12, g.h + 34);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(px + 2, top - 22, 3, g.h + 34);
      ctx.fillStyle = '#2a1d16'; ctx.fillRect(px - 3, top + g.h + 8, 18, 6);
    }
    ctx.fillStyle = '#2f2420';
    ctx.beginPath(); ctx.moveTo(SIDE - 22, top - 18); ctx.quadraticCurveTo(SIDE - 10, top - 26, SIDE + 6, top - 34);
    ctx.lineTo(W - SIDE - 6, top - 34); ctx.quadraticCurveTo(W - SIDE + 10, top - 26, W - SIDE + 22, top - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8a842'; ctx.fillRect(SIDE - 2, top - 20, W - SIDE * 2 + 4, 4);
  }
}
function hpBar(x, y, w, f, col) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - w / 2, y, w, 5); ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, w * clamp(f, 0, 1), 5); }
function drawBarrels() {
  for (const b of S.barrels) {
    const x = b.x, y = b.y, r = b.r;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r, r * 0.35, 0, 0, 6.283); ctx.fill();
    if (drawIcon('ico_jar', x, y - 4, r * 2.7)) { if (b.hp < b.max) hpBar(x, y - r * 1.6, 36, b.hp / b.max, '#ffcf4a'); continue; }
    ctx.fillStyle = '#7a4a24'; ctx.beginPath(); ctx.ellipse(x, y + 2, r * 0.95, r * 0.9, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#5e3618'; ctx.fillRect(x - r * 0.42, y - r * 1.05, r * 0.84, r * 0.4);
    ctx.fillStyle = '#b8342a'; ctx.beginPath(); ctx.ellipse(x, y - r * 1.05, r * 0.62, r * 0.26, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.1, r * 0.17, r * 0.45, 0, 0, 6.283); ctx.fill();
    ctx.save(); ctx.translate(x + 2, y + 4); ctx.rotate(0.785);
    ctx.fillStyle = '#d8382b'; ctx.fillRect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84); ctx.restore();
    ctx.fillStyle = '#1a0c06'; ctx.font = `900 ${Math.round(r * 0.8)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('酒', x + 2, y + 5);
    if (b.hp < b.max) hpBar(x, y - r * 1.5, 36, b.hp / b.max, '#ffcf4a');
  }
}
function drawEnemies() {
  for (const e of S.enemies) {
    const d = ED[e.type], a = spr(e.type);
    ctx.globalAlpha = d.phase && !e.vis ? 0.22 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.8, e.r, e.r * 0.4, 0, 0, 6.283); ctx.fill();
    if (a) {
      const c = sprCache(e.type, a, d.sh), fly = d.wave || d.phase, big = d.r >= 25;
      const ph = S.t * (5 + d.spd / 14) * (e.slowT > 0 ? 0.5 : 1) + e.ph * 3;   // 走路節奏：越快的怪腳步越快
      const hop = fly ? Math.sin(ph * 0.55) * 5 : -Math.abs(Math.sin(ph)) * (big ? 3 : 6);
      const tilt = fly ? Math.sin(ph * 0.45) * 0.07 : Math.sin(ph) * (big ? 0.05 : 0.1);
      const land = fly ? 0 : Math.max(0, Math.cos(ph * 2)) * 0.06;   // 落地時壓扁一點
      let sx = (e.face || 1) * (1 + land), sy = 1 - land;
      if (e.fl > 0) { sx *= 1.12; sy *= 0.88; }
      const fy = e.y + d.sh * 0.38;
      ctx.save(); ctx.translate(e.x, fy); ctx.rotate(tilt); ctx.scale(sx, sy);
      ctx.drawImage(c.cv, -c.w * (d.bx || 0.5), -d.sh + hop, c.w, d.sh);
      if (e.fl > 0) { ctx.globalAlpha = 0.6; ctx.drawImage(sprCache(e.type, a, d.sh, true).cv, -c.w * (d.bx || 0.5), -d.sh + hop, c.w, d.sh); }
      ctx.restore();
      if (e.slowT > 0 && fxDraw('fx_frostring', e.x, e.y + e.r * 0.8, e.r * 2.6, 0, 0.8)) {}
      else if (e.slowT > 0) { ctx.fillStyle = 'rgba(140,210,255,.45)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.8, e.r * 1.1, e.r * 0.45, 0, 0, 6.283); ctx.fill(); }
      if (e.hp < e.max) hpBar(e.x, fy - d.sh - 4, e.r * 2, e.hp / e.max, '#ff5a4a');
      continue;
    }
    ctx.fillStyle = d.col; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(e.r * 1.05)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.ch, e.x, e.y + 1);
    if (e.hp < e.max) hpBar(e.x, e.y - e.r - 8, e.r * 2, e.hp / e.max, '#ff5a4a');
  }
}
function drawBossMarks() {   // 首領落雷預警圈、毒池
  for (const p of S.pools || []) {
    const a = Math.min(1, p.t / 0.5, (p.max - p.t) / 0.25 + 0.2);
    if (fxDraw('fx_pool', p.x, HERO_Y + 10, p.r * 2.3, 0, a * 0.9)) continue;
    ctx.globalAlpha = a * 0.75; ctx.fillStyle = '#3a8a1a'; ctx.beginPath(); ctx.ellipse(p.x, HERO_Y + 10, p.r, p.r * 0.42, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#9aff4a'; ctx.beginPath(); ctx.ellipse(p.x, HERO_Y + 8, p.r * 0.7, p.r * 0.26, 0, 0, 6.283); ctx.fill();
    for (let i = 0; i < 3; i++) { const b = (AT * 1.5 + i / 3 + p.x * 0.01) % 1; ctx.globalAlpha = a * (1 - b); ctx.beginPath(); ctx.arc(p.x + (i - 1) * p.r * 0.45, HERO_Y + 8 - b * 26, 3 + b * 3, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  for (const s of S.eshots || []) if (s.wait > 0) {
    const f = 1 - s.wait / s.wmax, L = 1100;
    ctx.strokeStyle = `rgba(255,60,40,${0.25 + f * 0.6})`; ctx.lineWidth = 2 + f * 4; ctx.setLineDash([16, 10]);
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(s.ang) * L, s.y + Math.sin(s.ang) * L); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const m of S.marks || []) {
    const f = 1 - m.t / m.max;
    if (fxDraw(m.pool ? 'fx_warn_green' : 'fx_warn_red', m.x, m.y, m.r * 2.2, 0, 0.45 + f * 0.5, 1, 0.75)) { ctx.strokeStyle = m.pool ? '#c8ff8a' : '#ffd0c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r * f, m.r * f * 0.6, 0, 0, 6.283); ctx.stroke(); continue; }
    ctx.fillStyle = m.pool ? `rgba(90,220,40,${0.12 + f * 0.25})` : `rgba(255,40,60,${0.12 + f * 0.25})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
    ctx.strokeStyle = m.pool ? '#7aff3a' : '#ff4a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * f, 0, 6.283); ctx.stroke();
  }
}
function drawBoss() {
  const B = S.boss; if (!B) return;
  const d = B.def;
  if (B.state === 'windup') { ctx.fillStyle = 'rgba(255,60,40,.18)'; ctx.fillRect(B.x - B.r, B.y, B.r * 2, H - B.y); }
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(B.x, B.y + B.r * 0.85, B.r, B.r * 0.35, 0, 0, 6.283); ctx.fill();
  const a = spr(d.spr);
  if (a) {
    const top = B.y - d.sh * 0.6, c = sprCache(d.spr, a, d.sh), br = Math.sin(B.t * 3) * 0.015;
    const wind = B.state === 'fight' && B.atkT < 0.45 ? 1 - B.atkT / 0.45 : 0;   // 蓄力 0→1
    const st = clamp(B.strike / 0.3, 0, 1), se = st < 1 ? (1 - st) * (1 - st) : 0;   // 揮砍後的衝勁
    const cs = clamp(B.cast / 0.5, 0, 1), ce = cs < 1 ? Math.sin(cs * 3.14) : 0;   // 施法
    const rot = -0.14 * wind * (B.sdir || 1) * -1 + 0.2 * se * (B.sdir || 1), dy = -8 * wind + 26 * se - 10 * ce, jx = B.jit > 0 ? rr(-4, 4) : 0;
    if (wind > 0 && fxDraw('fx_warn_red', B.x, B.y + B.r * 0.85, B.r * (3.4 - wind * 1.0), AT * 0.6, wind * 0.85, 1, 0.55)) {}
    else if (wind > 0) { ctx.save(); ctx.globalAlpha = wind * 0.7; ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(B.x, B.y, B.r * (1.6 - wind * 0.6), 0, 6.283); ctx.stroke(); ctx.restore(); }
    if (ce > 0 && fxDraw('fx_magic', B.x, B.y + B.r * 0.85, B.r * 3.6 * ce, AT * 1.2, ce * 0.9, 1, 0.55)) {}
    else if (ce > 0) { ctx.save(); ctx.globalAlpha = ce * 0.6; ctx.fillStyle = '#b48aff'; ctx.beginPath(); ctx.ellipse(B.x, B.y + B.r * 0.8, B.r * 1.6 * ce, B.r * 0.5 * ce, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
    const fk = 'ba_' + d.spr.slice(5) + '_' + (wind > 0 || (ce > 0 && cs < 0.5) ? 0 : 1), fa = (wind > 0 || se > 0 || ce > 0) ? spr(fk) : null;   // 出招圖：蓄力用 0、出手用 1
    const m = fa ? 0.3 : 1, img = fa ? sprCache(fk, fa, d.sh * fa.h / 304) : c, ih = fa ? d.sh * fa.h / 304 : d.sh, ibx = fa ? (fa.bx || 0.5) : d.bx;
    ctx.save(); ctx.translate(B.x + jx, top + d.sh + dy * (fa ? 0.5 : 1)); ctx.rotate(rot * m); ctx.scale((1 - br) * (1 + (0.06 * wind - 0.04 * ce) * m), (1 + br) * (1 + (-0.05 * wind + 0.1 * ce) * m)); ctx.drawImage(img.cv, -img.w * ibx, -ih, img.w, ih);
    if (B.flash > 0 || wind > 0.7) { ctx.globalAlpha = B.flash > 0 ? 0.45 : (wind - 0.7) * 1.6; ctx.drawImage((fa ? sprCache(fk, fa, ih, true) : sprCache(d.spr, a, d.sh, true)).cv, -img.w * ibx, -ih, img.w, ih); }
    ctx.restore();
    if (se > 0 && fxDraw('fx_slash_red', B.x, B.y + B.r * 0.9 + 30 * se, d.sh * 2.2, (B.sdir || 1) * (0.15 - st * 0.4), se, B.sdir || 1, 1)) {}
    else if (se > 0) {   // 首領的大刀光
      const w = d.sh * 2.1, h = w * 0.62;
      ctx.save(); ctx.globalAlpha = se; ctx.translate(B.x, B.y + B.r * 0.9 + 26 * se); ctx.scale(B.sdir || 1, -1); ctx.rotate(-0.2 + st * 0.6);
      ctx.drawImage(slashSprite('#ff6a3a'), -w / 2, -h, w, h); ctx.restore();
    }
  } else {
    ctx.fillStyle = B.flash > 0 ? '#ffffff' : d.col; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, 6.283); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#f5d27a'; ctx.stroke();
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(B.x + B.r * 0.6, B.y - B.r * 0.2); ctx.lineTo(B.x + B.r * 1.4, B.y - B.r * 1.0); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(B.r * 0.85)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.ch, B.x, B.y + 3);
  }
  const HB = spr('ui_hpbar'), IN = HB && HB.bx, FW = 510, FH = HB ? FW * HB.h / HB.w * 0.82 : 0, FX = W / 2 - FW / 2, FY = 80;
  const bx0 = HB ? FX + FW * IN[0] : 54, bw = HB ? FW * (IN[2] - IN[0]) : W - 108, by0 = HB ? FY + FH * IN[1] : 84, bh = HB ? FH * (IN[3] - IN[1]) : 20, f = clamp(B.hp / B.max, 0, 1), ft = clamp((B.trail === undefined ? B.hp : B.trail) / B.max, 0, 1);
  ctx.fillStyle = 'rgba(10,4,4,.85)'; if (HB) ctx.fillRect(bx0, by0, bw, bh); else roundRect(bx0 - 4, by0 - 4, bw + 8, bh + 8, 6); ctx.fill();
  if (!HB) { ctx.lineWidth = 2; ctx.strokeStyle = '#d8a842'; ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,240,230,.85)'; ctx.fillRect(bx0, by0, bw * ft, bh);   // 殘影條
  const hg = ctx.createLinearGradient(0, by0, 0, by0 + bh); hg.addColorStop(0, '#ff6a50'); hg.addColorStop(0.5, '#d6281a'); hg.addColorStop(1, '#8a1010');
  ctx.fillStyle = hg; ctx.fillRect(bx0, by0, bw * f, bh);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(bx0, by0 + 2, bw * f, 4);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 1; k < 10; k++) ctx.fillRect(bx0 + bw * k / 10 - 1, by0, 2, bh);
  if (HB) ctx.drawImage(sprCache('ui_hpbar', HB, Math.round(FH)).cv, FX, FY, FW, FH);
  else for (const ex of [bx0 - 10, bx0 + bw + 10]) { ctx.save(); ctx.translate(ex, by0 + bh / 2); ctx.rotate(0.785); ctx.fillStyle = '#d8a842'; ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = '#7a1f1f'; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  inkText(d.name, W / 2, by0 + bh / 2 + 1, 17, { cols: ['#ffffff', '#fff0c0', '#ffd070'] });
  ctx.textAlign = 'right'; ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(Math.ceil(f * 100) + '%', bx0 + bw - 6, by0 + bh / 2 + 1);
}
function drawWeapon(id, x, y, s) {
  ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
  if (id === 'blade') { ctx.strokeStyle = '#ffe2b0'; ctx.beginPath(); ctx.moveTo(x + 11 * s, y + 2 * s); ctx.quadraticCurveTo(x + 20 * s, y - 14 * s, x + 12 * s, y - 28 * s); ctx.stroke(); }
  else if (id === 'bow') { ctx.strokeStyle = '#8a5a2b'; ctx.beginPath(); ctx.arc(x + 8 * s, y - 10 * s, 14 * s, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(x + 8 * s + Math.cos(-1.2) * 14 * s, y - 10 * s + Math.sin(-1.2) * 14 * s); ctx.lineTo(x + 8 * s + Math.cos(1.2) * 14 * s, y - 10 * s + Math.sin(1.2) * 14 * s); ctx.stroke(); }
  else { ctx.strokeStyle = '#dff6ff'; ctx.beginPath(); ctx.moveTo(x + 12 * s, y); ctx.lineTo(x + 12 * s, y - 30 * s); ctx.stroke(); }
}
function drawHero(c, x, y, s) {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y + 14 * s, 16 * s, 6 * s, 0, 0, 6.283); ctx.fill();
  const a = spr(c.spr);
  if (a) { drawSpr(a, x, y - 40 * s, 58 * s, c.bbx || 0.5); return; }
  ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(x, y, 15 * s, 0, 6.283); ctx.fill();
  ctx.lineWidth = 3 * s; ctx.strokeStyle = '#f5d27a'; ctx.stroke();
  ctx.fillStyle = '#ffe0be'; ctx.beginPath(); ctx.arc(x, y - 13 * s, 8 * s, 0, 6.283); ctx.fill();
  drawWeapon(c.id, x, y, s);
}
const CLONES = {}, HS = 1.25, CLH = 42;   // 主角、分身的顯示大小(小怪放大後同步放大)
function cloneSprite(k, a) {   // 分身用的小圖：預先縮好，避免每幀縮放 60 次大圖
  const sc = view.s * view.d, key = k + '@' + sc;
  if (CLONES[key]) return CLONES[key];
  const w = CLH * a.w / a.h, c = document.createElement('canvas');
  c.width = Math.ceil(w * sc); c.height = Math.ceil(CLH * sc);
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(a.img, 0, 0, c.width, c.height);
  return (CLONES[key] = { cv: c, w });
}
const SLASH = {};
function slashSprite(col) {   // 刀光(月牙)預先畫好
  if (SLASH[col]) return SLASH[col];
  const c = document.createElement('canvas'); c.width = 160; c.height = 100;
  const x = c.getContext('2d'); x.translate(80, 92);
  for (const [w, a, cc] of [[16, 0.35, col], [8, 0.8, col], [3, 1, '#ffffff']]) {
    x.globalAlpha = a; x.strokeStyle = cc; x.lineCap = 'round'; x.lineWidth = w;
    x.beginPath(); x.arc(0, 0, 70, -2.7, -0.44); x.stroke();
  }
  return (SLASH[col] = c);
}
function heroFrame(c, p) {   // 依揮擊進度挑主角的出招圖(時裝沒有出招圖就回傳 null)
  if (c.skin) return null;
  let f;
  if (p < 0.4) f = 1; else if (p < 1) f = 2; else if (S.fireT < 0.45 / S.rate) f = 0; else return null;
  const k = 'atk_' + c.id + '_' + f, a = spr(k);
  return a ? { k, a } : null;
}
function swingP() { return clamp(S.swing / (S.swingDur || 0.2), 0, 1); }   // 0 = 剛出手，1 = 收招
function heroSwingTf(id, p, dir) {   // 依職業回傳主角揮擊的旋轉、位移、縮放
  const k = 1 - p, e = k * k;
  if (id === 'bow') return { r: 0, dx: 0, dy: 6 * e, sx: 1 + 0.06 * e, sy: 1 - 0.08 * e };   // 拉弓後座
  if (id === 'dart') return { r: dir * 0.5 * e, dx: dir * -4 * e, dy: 0, sx: 1, sy: 1 };   // 甩手
  if (id === 'demon') return { r: 0, dx: 0, dy: -8 * e, sx: 1 + 0.1 * e, sy: 1 + 0.1 * e };   // 推掌
  if (id === 'healer') return { r: 0, dx: 0, dy: -10 * e, sx: 1, sy: 1 + 0.06 * e };   // 前刺
  return { r: dir * (id === 'blade' ? 0.45 : 0.32) * (p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75), dx: 0, dy: -6 * e, sx: 1 + 0.06 * e, sy: 1 - 0.04 * e };   // 劍客、刀客：揮砍
}
function drawSlash(c) {   // 主角前方的刀光
  const p = swingP(); if (p >= 1) return;
  const id = c.id; if (id === 'bow' || id === 'dart') return;
  if ((id === 'sword' || id === 'blade') && spr('fx_slash_blue')) {
    const R = squadR(), w = (id === 'blade' ? 230 : 180) + R * 1.2;
    fxDraw(id === 'blade' ? 'fx_slash_gold' : 'fx_slash_blue', S.hx + S.swingDir * 10, HERO_Y - R * 0.35 - 40, w, (-0.25 + p * 0.45) * S.swingDir, (1 - p) * 0.95, S.swingDir, -1);
    return;
  }
  if (id === 'healer' && fxDraw('fx_star', S.hx + S.swingDir * 16, HERO_Y - 62, 30 + 40 * (1 - p), p * 0.8, 1 - p)) return;
  if (id === 'demon' && fxDraw('fx_wave', S.hx, HERO_Y - 56 - 20 * p, 50 + 110 * p, 0, (1 - p) * 0.9)) return;
  if (id === 'healer') {   // 醫仙：銀針出手的閃光
    const f = 1 - p, x = S.hx + S.swingDir * 16, y = HERO_Y - 62, L = 10 + 18 * f;
    ctx.save(); ctx.globalAlpha = f; ctx.strokeStyle = '#eafff6'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
    for (const a of [0, 1.57, 0.785, 2.356]) { const l = a % 1.57 ? L * 0.55 : L; ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); }
    ctx.stroke(); ctx.restore(); return;
  }
  if (id === 'demon') {   // 魔教傳人：推掌的紫色氣浪
    const f = 1 - p, r = 20 + 50 * p;
    ctx.save(); ctx.globalAlpha = f * 0.8; ctx.strokeStyle = '#c04aff'; ctx.lineWidth = 6 * f + 1; ctx.beginPath(); ctx.ellipse(S.hx, HERO_Y - 56 - 20 * p, r, r * 0.4, 0, 0, 6.283); ctx.stroke(); ctx.restore(); return;
  }
  const R = squadR(), big = id === 'blade' ? 1.5 : id === 'demon' ? 1.2 : 1, w = (130 + R * 1.4) * big, h = w * 0.62;
  ctx.save(); ctx.globalAlpha = (1 - p) * 0.95; ctx.translate(S.hx, HERO_Y - R * 0.35 + 4);
  ctx.scale(S.swingDir, 1); ctx.rotate(-0.15 + p * 0.5);
  ctx.drawImage(slashSprite(id === 'demon' ? '#c04aff' : c.shot), -w / 2, -h, w, h);
  ctx.restore();
}
function fxDraw(k, x, y, w, rot = 0, alpha = 1, sx = 1, sy = 1) {   // 畫美術特效圖；沒有圖就回傳 false 改用程式畫
  const a = spr(k); if (!a) return false;
  const h = w * a.h / a.w, c = sprCache(k, a, Math.min(a.h, Math.pow(2, Math.ceil(Math.log2(Math.max(16, h))))));   // 依 2 的次方分級快取，避免每種大小都建一張
  ctx.globalAlpha = alpha;
  if (rot || sx !== 1 || sy !== 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(c.cv, -w / 2, -h / 2, w, h); ctx.restore(); }
  else ctx.drawImage(c.cv, x - w / 2, y - h / 2, w, h);
  ctx.globalAlpha = 1; return true;
}
function addSpark(x, y, col) { if (S.sparks.length < 36 && !fxLow()) S.sparks.push({ x, y, a: Math.random() * 3.14, t: 0.16, col }); }
function drawSparks() {   // 打中的十字火花
  if (spr('fx_spark')) { for (const p of S.sparks) { const f = p.t / 0.16; fxDraw('fx_spark', p.x, p.y, 22 + (1 - f) * 26, p.a, f); } for (const p of S.pops || []) { const f = p.t / 0.35; fxDraw('fx_b_burst', p.x, p.y, p.w * (1.2 - f * 0.6), 0, f * 0.9); } return; }
  ctx.lineCap = 'round';
  for (const p of S.sparks) {
    const f = p.t / 0.16, L = 8 + (1 - f) * 16;
    ctx.globalAlpha = f; ctx.strokeStyle = p.col || '#fff6d0'; ctx.lineWidth = 3 * f + 1;
    ctx.beginPath();
    for (const a of [p.a, p.a + 1.57]) { ctx.moveTo(p.x - Math.cos(a) * L, p.y - Math.sin(a) * L); ctx.lineTo(p.x + Math.cos(a) * L, p.y + Math.sin(a) * L); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawSquad() {
  if (S.inv > 0 && Math.floor(S.inv * 10) % 2) return;   // 復活後無敵閃爍
  const n = Math.min(S.units, 60), hy = HERO_Y, c = S.cls;
  if (S.slow > 0 && spr('fx_crystal')) { const R = squadR(); fxDraw('fx_frostring', S.hx, hy + 8, R * 2.4 + 30, 0, 0.85); fxDraw('fx_crystal', S.hx - R - 10, hy - 6, 34); fxDraw('fx_crystal', S.hx + R + 10, hy - 6, 34, 0, 1, -1, 1); }
  else if (S.slow > 0) { ctx.fillStyle = 'rgba(160,220,255,.35)'; ctx.beginPath(); ctx.ellipse(S.hx, hy + 8, squadR() + 10, squadR() * 0.6 + 14, 0, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = 0.85;
  const a = spr(c.spr), cl = a && cloneSprite(c.spr, a), sp = swingP();
  for (const i of squadOrder(n)) {
    const p = FPOS[i], x = S.hx + p.x, y = hy + p.y;
    if (cl) {
      const q = clamp(sp - (i % 5) * 0.06, 0, 1), e2 = (1 - q) * (1 - q), F = heroFrame(c, q);
      if (F) { const fc = cloneSprite(F.k, F.a), fh = CLH * F.a.h / 170; ctx.drawImage(fc.cv, x - fc.w * fh / CLH * (F.a.bx || 0.5), y + 10 - fh, fc.w * fh / CLH, fh); continue; }
      const hh = CLH * (1 + 0.1 * e2); ctx.drawImage(cl.cv, x - cl.w * (c.bbx || 0.5) + S.swingDir * 3 * e2, y + 10 - CLH - 5 * e2 - (hh - CLH), cl.w, hh); continue;
    }
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffe0be'; ctx.beginPath(); ctx.arc(x, y - 7, 5, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (S.units > 0) {
    const P = swingP(), F = heroFrame(c, P), T = heroSwingTf(c.id, P, S.swingDir), m = F ? 0.35 : 1;   // 有出招圖時，轉身幅度縮小
    ctx.save(); ctx.translate(S.hx + T.dx * m, hy + 14 + T.dy * m); ctx.rotate(T.r * m); ctx.scale(1 + (T.sx - 1) * m, 1 + (T.sy - 1) * m); ctx.translate(-S.hx, -hy - 14);
    if (F) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(S.hx, hy + 14 * HS, 16 * HS, 6 * HS, 0, 0, 6.283); ctx.fill(); const fh = 58 * HS * F.a.h / 170, cc = sprCache(F.k, F.a, fh); ctx.drawImage(cc.cv, S.hx - cc.w * (F.a.bx || 0.5), hy + 18 * HS - fh, cc.w, fh); }
    else drawHero(c, S.hx, hy, HS);
    ctx.restore();
    drawSlash(c);
  }
  const R = squadR(), ly = hy - R * 0.6 - 48, label = String(S.units);
  ctx.font = `24px ${FONT}`; const tw = Math.max(64, ctx.measureText(label).width + 44);
  if (!three('ui_count', S.hx - tw / 2, ly - 18, tw, 36, 88)) { ctx.fillStyle = 'rgba(14,28,64,.82)'; roundRect(S.hx - tw / 2, ly - 16, tw, 32, 16); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(160,210,255,.7)'; ctx.stroke(); }
  numText(label, S.hx, ly + 1, 24, 'white');
}
function drawShots() {
  if (spr('fx_b_sword') && spr('fx_e_fire')) { drawShotsArt(); return; }
  drawShotsOld();
}
const FXC = {};
function fxC(k, w, halo) {   // 子彈圖：依顯示寬度快取一次；halo＝外圍加深色描邊，在白色地板上也看得清楚
  const sc = view.s * view.d, key = k + '@' + w + (halo ? 'h' : ''); if (FXC[key] && FXC[key].s === sc) return FXC[key];
  const a = spr(k); if (!a) return null;
  const h = w * a.h / a.w, src = sprCache(k, a, Math.round(h)).cv;
  if (!halo) return (FXC[key] = { cv: src, w, h, s: sc });
  const p = 5, c = document.createElement('canvas'); c.width = Math.ceil((w + p * 2) * sc); c.height = Math.ceil((h + p * 2) * sc);
  const x = c.getContext('2d'); x.shadowColor = 'rgba(10,8,20,.95)'; x.shadowBlur = 3.5 * sc;
  for (let i = 0; i < 3; i++) x.drawImage(src, p * sc, p * sc, w * sc, h * sc);   // 疊三次讓深色外框夠明顯
  x.shadowColor = 'transparent'; x.drawImage(src, p * sc, p * sc, w * sc, h * sc);
  return (FXC[key] = { cv: c, w: w + p * 2, h: h + p * 2, s: sc });
}
function drawShotsArt() {   // 大量子彈：直接設定變換矩陣，不用 save / restore，手機上比較省
  const c = S.cls, big = S.atk > c.atk * 3, M = ctx.getTransform(), k = M.a;
  const NB = S.bullets.length, lim = (c.id === 'blade' ? 30 : c.id === 'demon' ? 40 : 40) * (fxLow() ? 0.6 : 1), stride = Math.max(1, Math.ceil(NB / lim));   // 太多時只畫代表性的一部分(傷害照算)，大量刀氣重疊本來就看不出差別
  const gs = 1 + clamp((S.units - MAXSHOOT) / 160, 0, 0.15);   // 分身越多，劍氣越大越亮
  const put = (I, x, y, rot, al) => {
    if (!I) return;
    if (al !== undefined) ctx.globalAlpha = al;
    const w = I.w * gs, h = I.h * gs;
    if (rot) { const cs = Math.cos(rot) * k, sn = Math.sin(rot) * k; ctx.setTransform(cs, sn, -sn, cs, M.e + x * k, M.f + y * k); ctx.drawImage(I.cv, -w / 2, -h / 2, w, h); }
    else { ctx.setTransform(M); ctx.drawImage(I.cv, x - w / 2, y - h / 2, w, h); }
  };
  const SW = fxC('fx_b_sword', big ? 16 : 13, 1), BL = fxC('fx_b_blade', 66, 1), AR = fxC('fx_b_arrow', 13, 1), DT = fxC('fx_b_dart', 24, 1), OB = fxC('fx_b_orb', 30, 1);
  S.bullets.forEach((b, i) => {
    if (stride > 1 && i % stride) return;
    if (b.k === 'line') { if (c.id !== 'healer') put(SW, b.x, b.y + 10, b.a, 0.82); }
    else if (b.k === 'arc') put(BL, b.x, b.y + 6, b.a + Math.PI + 0.47, clamp(b.life / b.max * 1.6, 0, 1));
    else if (b.k === 'arrow') put(AR, b.x, b.y + 16, b.a);
    else if (b.k === 'dart') put(DT, b.x, b.y, AT * 18 + b.x * 0.05);
    else if (b.k === 'orb') put(OB, b.x, b.y + 12, Math.atan2(b.vx, -b.vy));
    ctx.globalAlpha = 1;
  });
  ctx.setTransform(M);
  if (c.id === 'healer') {   // 醫仙的銀針維持細線(先畫一層深色外框)
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,30,24,.75)'; ctx.lineWidth = 10; ctx.beginPath();
    for (const b of S.bullets) if (b.k === 'line') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.024, b.y - b.vy * 0.024); }
    ctx.stroke();
    ctx.strokeStyle = c.shot; ctx.globalAlpha = 0.6; ctx.lineWidth = 7; ctx.beginPath();
    for (const b of S.bullets) if (b.k === 'line') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.024, b.y - b.vy * 0.024); }
    ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (const b of S.bullets) if (b.k === 'line') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016); }
    ctx.stroke();
  }
  for (const sh of S.eshots) {   // 敵方暗器：火球、毒液、冰錐、火銃子彈
    if (sh.wait > 0) continue;
    const kk = sh.freeze ? 'fx_e_ice' : sh.pool ? 'fx_e_poison' : sh.tvx !== undefined ? 'fx_e_bullet' : 'fx_e_fire';
    const w = Math.round(kk === 'fx_e_bullet' ? 9 : kk === 'fx_e_poison' ? sh.r * 2.4 : sh.r * 3.2), I = fxC(kk, w), rot = Math.atan2(sh.vy, sh.vx) - 1.5708, off = kk === 'fx_e_bullet' ? 14 : sh.r * 0.8;
    put(I, sh.x - Math.sin(rot) * -off * 0, sh.y - off, rot);
  }
  ctx.setTransform(M);
}
function drawShotsOld() {
  const c = S.cls;
  ctx.lineCap = 'round';
  ctx.save();
  const big = S.atk > c.atk * 3;
  // 劍氣：外層光暈＋內層亮芯
  ctx.strokeStyle = c.shot; ctx.globalAlpha = 0.55; ctx.lineWidth = big ? 12 : 9; ctx.beginPath();
  for (const b of S.bullets) if (b.k === 'line') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.024, b.y - b.vy * 0.024); }
  ctx.stroke();
  ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = big ? 4 : 3; ctx.beginPath();
  for (const b of S.bullets) if (b.k === 'line') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016); }
  ctx.stroke();
  // 長箭：淡淡的尾跡
  ctx.strokeStyle = '#fff6d0'; ctx.globalAlpha = 0.45; ctx.lineWidth = 6; ctx.beginPath();
  for (const b of S.bullets) if (b.k === 'arrow') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.05, b.y - b.vy * 0.05); }
  ctx.stroke();
  // 刀氣：月牙光暈
  for (const b of S.bullets) if (b.k === 'arc') {
    const f = clamp(b.life / b.max * 1.6, 0, 1), cy = b.y + b.r * 0.7, a0 = -Math.PI / 2 + b.a;
    ctx.globalAlpha = 0.4 * f; ctx.strokeStyle = c.shot; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(b.x, cy, b.r, a0 - 1.0, a0 + 1.0); ctx.stroke();
    ctx.globalAlpha = f; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(b.x, cy, b.r, a0 - 0.95, a0 + 0.95); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, cy, b.r, a0 - 0.6, a0 + 0.6); ctx.stroke();
  }
  ctx.restore();
  // 箭身
  ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 3; ctx.beginPath();
  for (const b of S.bullets) if (b.k === 'arrow') { ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028); }
  ctx.stroke();
  ctx.fillStyle = '#e8eef5';
  for (const b of S.bullets) if (b.k === 'arrow') { ctx.beginPath(); ctx.moveTo(b.x + Math.sin(b.a) * 7, b.y - Math.cos(b.a) * 7); ctx.lineTo(b.x - 4, b.y + 4); ctx.lineTo(b.x + 4, b.y + 4); ctx.fill(); }
  // 暗器師飛鏢
  ctx.fillStyle = '#dfe6f0';
  for (const b of S.bullets) if (b.k === 'dart') {
    const a = AT * 18 + b.x * 0.05;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.beginPath();
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.moveTo(0, 0); ctx.lineTo(2.5, -2.5); ctx.lineTo(0, -8); ctx.lineTo(-2.5, -2.5); }
    ctx.fill(); ctx.restore();
  }
  // 魔教傳人黑炎
  const orb = orbSprite();
  for (const b of S.bullets) if (b.k === 'orb') ctx.drawImage(orb, b.x - 18, b.y - 18, 36, 36);
  // 敵方暗器
  for (const s of S.eshots) {
    if (s.wait > 0) continue;
    ctx.fillStyle = s.col; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.8, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.4, 0, 6.283); ctx.fill();
  }
}
function drawFx() {
  for (const p of S.fx) {
    const f = clamp(p.life / p.max, 0, 1);
    if (p.ring) {
      ctx.globalAlpha = f; ctx.strokeStyle = p.col; ctx.lineWidth = 2 + 5 * f;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - f), 0, 6.283); ctx.stroke();
    } else { ctx.globalAlpha = clamp(p.life * 2, 0, 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const t of S.texts) {
    ctx.globalAlpha = clamp(t.life * 1.6, 0, 1); ctx.font = `bold ${t.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, t.size * 0.26); ctx.strokeStyle = 'rgba(12,5,0,.95)'; ctx.strokeText(t.txt, t.x, t.y + t.size * 0.08); ctx.strokeText(t.txt, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
function drawTutorial() {
  if (!(S.tut > 0)) return;
  const a = clamp(Math.min(S.tut, 0.5) * 2, 0, 1), hx = W / 2 + Math.sin(S.t * 3.2) * 110, hy = HERO_Y + 70;
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(W / 2 - 150, 560, 300, 60, 14); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 26px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('← 左右拖曳移動 →', W / 2, 591);
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(hx, hy, 18, 0, 6.283); ctx.fill();
  ctx.fillRect(hx - 7, hy, 14, 34);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, hy, 28 + (S.t * 40 % 16), 0, 6.283); ctx.stroke();
  ctx.globalAlpha = 1;
}
// UI v1: draw-only decorative layers; no gameplay or hitbox changes.
function jhUiFrame(x,y,w,h,r=12) {
  ctx.save();
  const gr=ctx.createLinearGradient(0,y,0,y+h);
  gr.addColorStop(0,'rgba(30,43,37,.94)'); gr.addColorStop(1,'rgba(13,22,20,.94)');
  ctx.fillStyle=gr; roundRect(x,y,w,h,r); ctx.fill();
  ctx.strokeStyle='rgba(216,183,111,.88)';ctx.lineWidth=1.6;roundRect(x+.8,y+.8,w-1.6,h-1.6,r);ctx.stroke();
  ctx.strokeStyle='rgba(255,235,176,.16)';ctx.lineWidth=1;roundRect(x+5,y+5,w-10,h-10,Math.max(3,r-4));ctx.stroke();
  ctx.restore();
}
function jhUiGateAccent(cx,cy,gw,good,on) {
  ctx.save();
  const x=cx-gw*.4,y=cy-28,w=gw*.8,h=56;
  ctx.fillStyle=good?'rgba(12,60,57,.82)':'rgba(79,31,29,.82)';roundRect(x,y,w,h,8);ctx.fill();
  ctx.strokeStyle=good?'#b7d9b2':'#e7ac8b';ctx.lineWidth=2;roundRect(x+2,y+2,w-4,h-4,7);ctx.stroke();
  if(on){ctx.strokeStyle=good?'rgba(218,255,210,.8)':'rgba(255,194,146,.8)';ctx.lineWidth=3;roundRect(x-3,y-3,w+6,h+6,10);ctx.stroke();}
  ctx.restore();
}
function drawHud() {
  const f = S.endless ? clamp(1 - (S.nextBoss - S.t) / ENDLESS_GAP, 0, 1) : clamp(S.t / ST().len, 0, 1);
  if (!three('ui_hud_top', 12, 10, 436, 60, 110)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(20, 16, 420, 52, 12); ctx.fill(); }
  jhUiFrame(20, 16, 420, 52, 11);
  ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f5d27a';
  ctx.fillText(S.endless ? `無盡試煉　第 ${S.wave} 波(最高 ${save.endless.best})` : S.tower ? `試煉塔　第 ${S.tower} 層(最高 ${save.tower.best})` : S.weekly ? `每週首領　${WMODS.find(m => m.id === S.weekly.mod).name}` : `${S.hard ? '困難　' : ''}${stageLabel(S.stage)}　${ST().name}`, 32, 31);
  pbar(32, 44, 250, 10, f, '#f5d27a');
  sealStamp(292, 49, 13, S.endless ? '首' : BOSSES[ST().boss].ch); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 18px ${FONT}`;
  ctx.save(); const cp = S.coinPulse > 0 ? 1 + S.coinPulse * 2 : 1; ctx.translate(330, 42); ctx.scale(cp, cp);
  if (drawIcon('ico_coin', 10, 0, 24)) numText(S.coinsRun, 26, 0, 21, 'gold', 'left'); else { ctx.fillStyle = '#ffd700'; ctx.fillText('銅錢', 0, 0); numText(S.coinsRun, 40, 0, 21, 'gold', 'left'); } ctx.restore();
  ui.push({ x: W - 72, y: 16, w: 52, h: 52, act: 'pause' });
  if (!drawIcon('ui_round', W - 46, 42, 60)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(W - 72, 16, 52, 52, 12); ctx.fill(); }
  ctx.fillStyle = '#3a1d04'; ctx.fillRect(W - 55, 29, 8, 26); ctx.fillRect(W - 43, 29, 8, 26); ctx.fillStyle = '#fff6e0'; ctx.fillRect(W - 54, 30, 6, 24); ctx.fillRect(W - 42, 30, 6, 24);
  if (!three('ui_hud_bot', 12, H - 58, W - 24, 46, 80)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(20, H - 52, W - 40, 36, 10); ctx.fill(); }
  jhUiFrame(20, H - 52, W - 40, 36, 9);
  ctx.fillStyle = '#f8e6bb'; ctx.font = `bold 17px ${FONT}`; ctx.textAlign = 'center';
  const extra = (S.spread ? '  ' + (S.cls.id === 'sword' ? '散射' : '分裂') + 'Lv' + S.spread : '') + (S.pierce ? '  強化' : '') + (S.god ? '  【無敵】' : '');
  ctx.fillText(`${S.cls.name}　內力 ${Math.round(S.atk)}　身法 ${S.rate.toFixed(1)}/秒${extra}`, W / 2, H - 33);
  if (S.weekly && S.weekly.on) drawWeeklyHud();
  if (S.synPop) { const P = S.synPop; P.t += 1 / 60; if (P.t > 1.8) S.synPop = null; else {   // 共鳴圖示特寫：彈出→停留→淡出
    const z = P.t < 0.2 ? P.t / 0.2 * 1.2 : P.t < 0.32 ? 1.2 - (P.t - 0.2) / 0.12 * 0.2 : 1, a = clamp((1.8 - P.t) * 3, 0, 1);
    ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(W / 2, H * 0.36 - 92, 4, W / 2, H * 0.36 - 92, 80); gl.addColorStop(0, 'rgba(160,230,255,.6)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(W / 2, H * 0.36 - 92, 80, 0, 6.283); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.translate(W / 2, H * 0.36 - 92); ctx.scale(z, z); synIcon(P.sy, 0, 0, 104); ctx.restore();
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold 17px ${FONT}`; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,20,30,.85)'; ctx.strokeText(P.sy.d, W / 2, H * 0.36 + 56); ctx.fillStyle = '#dff8ff'; ctx.fillText(P.sy.d, W / 2, H * 0.36 + 56); ctx.restore(); } }
  if (chalOn()) drawChalHud();
}
function drawChalHud() {
  const c = chalOf(S.stage), p = chalProg(c), fail = c.t === 'nominus' && S.badG || c.t === 'boss' && S.boss && S.t - S.bossT0 > c.n;
  if (S.t < 4.5 && !S.boss) { const a = clamp(Math.min(S.t - 1.6, 4.5 - S.t) * 3, 0, 1); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = 'rgba(60,35,10,.88)'; roundRect(60, H * 0.36 + 50, W - 120, 46, 12); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`本關挑戰：${c.txt}(元寶 ${c.g})`, W / 2, H * 0.36 + 73); ctx.globalAlpha = 1; } }
  const lab = c.t === 'nominus' ? (S.badG ? '已碰紅門' : '未碰紅門') : c.t === 'boss' ? (S.boss ? `${p.cur}/${c.n} 秒` : `${c.n} 秒速殺`) : `${p.cur}/${c.n}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 13px ${FONT}`; const tw = ctx.measureText('挑戰 ' + lab).width + 34;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(20, H - 124, tw, 26, 13); ctx.fill();
  if (!drawIcon('ico_chal', 34, H - 111, 26)) { ctx.fillStyle = p.ok && c.t !== 'nominus' ? '#7fffa0' : fail ? '#ff7b6a' : '#ffd23a'; ctx.beginPath(); ctx.arc(34, H - 111, 8, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = p.ok && c.t !== 'nominus' && c.t !== 'boss' ? '#7fffa0' : fail ? '#ff9a8a' : '#fff'; ctx.fillText('挑戰 ' + lab, 48, H - 110);
}
function drawBanner() {
  if (!bannerObj) return;
  const a = clamp(Math.min(bannerObj.life, bannerObj.max - bannerObj.life) * 4, 0, 1);
  ctx.globalAlpha = a;
  const rb = spr('ui_ribbon'); if (rb) { const rw = W * 0.98, rh = rw * rb.h / rb.w; ctx.drawImage(rb.img, W / 2 - rw / 2, H * 0.36 - rh / 2, rw, rh); } else { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H * 0.36 - 40, W, 80); }
  const pop = 1 + Math.max(0, 0.25 - (bannerObj.max - bannerObj.life)) * 1.6;
  ctx.save(); ctx.translate(W / 2, H * 0.36); ctx.scale(pop, pop); inkText(bannerObj.txt, 0, 0, 38); ctx.restore();
  ctx.globalAlpha = 1;
}
function dim(a = 0.55) { ctx.fillStyle = `rgba(15,10,5,${a})`; ctx.fillRect(0, 0, W, H); }
const NUMC = { gold: ['#fffbe0', '#ffd23a', '#e0870f', '#3a1d04'], cyan: ['#f2fdff', '#8fe6ff', '#2f8fd8', '#0b2240'], white: ['#ffffff', '#f4f4f4', '#c4ccd8', '#16203a'], green: ['#f0fff4', '#8fffb0', '#2fb860', '#0c2a14'] };
function numText(t, x, y, size, kind = 'gold', align = 'center') {   // 遊戲數字：漸層填色＋深色粗描邊＋下方陰影
  const C = NUMC[kind] || NUMC.gold; t = String(t);
  ctx.save(); ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.24); ctx.strokeStyle = C[3]; ctx.strokeText(t, x, y + size * 0.07); ctx.strokeText(t, x, y);
  const g = ctx.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.45); g.addColorStop(0, C[0]); g.addColorStop(0.5, C[1]); g.addColorStop(1, C[2]);
  ctx.fillStyle = g; ctx.fillText(t, x, y); const w = ctx.measureText(t).width; ctx.restore(); return w;
}
function statLine(label, val, y, kind = 'white', suffix = '') {   // 結算數據：左邊文字、右邊遊戲數字
  ctx.save(); ctx.font = `bold 21px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8dcc8'; ctx.fillText(label, W / 2 + 4, y);
  const w = numText(val, W / 2 + 20, y, 24, kind, 'left'); if (suffix) { ctx.textAlign = 'left'; ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#ffd98a'; ctx.fillText(suffix, W / 2 + 28 + w, y); } ctx.restore();
}
function costBtn(x, y, w, h, prefix, cost, act, opt = {}) {   // 花費按鈕：「強化」＋銅錢圖示＋金色數字，置中排好；cost 給 null 代表尚未選擇 → 顯示 --
  btn(x, y, w, h, '', act, opt);
  if (cost === null || cost === undefined) { const size = opt.size || 22; ctx.save(); ctx.globalAlpha = opt.disabled ? 0.6 : 1; ctx.font = `${size}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = 'rgba(20,8,4,.8)'; const t2 = prefix; ctx.strokeText(t2, x + w / 2, y + h / 2 + 1); ctx.fillStyle = '#fff6e0'; ctx.fillText(t2, x + w / 2, y + h / 2 + 1); ctx.restore(); return; }
  const size = opt.size || 22, ns = Math.round(size * 0.95), t = cost.toLocaleString();
  ctx.save(); ctx.font = `${size}px ${TFONT}`; const pw = prefix ? ctx.measureText(prefix).width + 8 : 0; ctx.font = `${ns}px ${FONT}`; const nw = ctx.measureText(t).width, iw = 26;
  let cx = x + w / 2 - (pw + iw + 4 + nw) / 2, cy = y + h / 2 + 1; ctx.globalAlpha = opt.disabled ? 0.6 : 1;
  if (prefix) { ctx.font = `${size}px ${TFONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = 'rgba(20,8,4,.8)'; ctx.strokeText(prefix, cx, cy); ctx.fillStyle = '#fff6e0'; ctx.fillText(prefix, cx, cy); cx += pw; }
  drawIcon('ico_coin', cx + iw / 2, cy, iw); numText(t, cx + iw + 4, cy, ns, 'gold', 'left'); ctx.restore();
}
function moneyTag(y) {
  const ct = save.coins.toLocaleString(), gt = save.gems.toLocaleString();
  const cw = numText(ct, W / 2 - 14, y, 22, 'gold', 'right');
  if (!drawIcon('ico_coin', W / 2 - 14 - cw - 17, y, 28)) { ctx.fillStyle = '#ffd700'; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText('銅錢', W / 2 - 20 - cw, y); }
  numText(gt, W / 2 + 50, y, 22, 'cyan', 'left');
  if (!drawIcon('ico_gem', W / 2 + 32, y, 32)) { ctx.fillStyle = '#7fe0ff'; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('元寶', W / 2 + 14, y); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
}
function coinsTag(y) { const t = save.coins.toLocaleString(), w = numText(t, W / 2 + 14, y, 24, 'gold'); drawIcon('ico_coin', W / 2 + 14 - w / 2 - 20, y, 28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }

function acctBtn(x, y) {
  ui.push({ x, y, w: 52, h: 48, act: 'account' });
  if (!drawIcon('ui_round', x + 26, y + 24, 56)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, 52, 48, 12); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 26, y + 18, 8, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 26, y + 38, 14, 9, 0, Math.PI, 0); ctx.fill();
  const col = !CLOUD.on ? '#888' : CLOUD.status === 'err' ? '#ff5a4a' : CLOUD.status === 'ok' ? (isAnon() ? '#ffc23a' : '#5fd35f') : '#7fe0ff';
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 44, y + 9, 6, 0, 6.283); ctx.fill();
}
function pbar(x, y, w, h, f, col) {   // 進度條：有美術圖用圖(底框＋金色／藍色填充)，沒有就用程式畫
  f = clamp(f, 0, 1); const blue = /7fe0ff|7fe8|4ab8ff|8fe6/i.test(col || '');
  if (spr('ui_bar_bg')) {
    three('ui_bar_bg', x - 3, y - 3, w + 6, h + 6, 34);
    if (f > 0) three(blue ? 'ui_bar_blue' : 'ui_bar_gold', x, y, Math.max(h * 1.2, w * f), h, 20);
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, w, h, h / 2); ctx.fill();
  if (f > 0) { ctx.fillStyle = col || '#f5d27a'; roundRect(x, y, Math.max(h, w * f), h, h / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.28)'; roundRect(x + 2, y + 1, Math.max(h, w * f) - 4, h * 0.35, h / 4); ctx.fill(); }
}
function redDot(x, y) {
  if (drawIcon('ui_badge', x, y, 24)) return; ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
function drawPreview(c, x, feet, h) {   // 選職業預覽：正面圖(有的話)＋呼吸動作
  const f = spr(c.spr + '_f'), a = f || spr(c.spr), b = Math.sin(AT * 2.4) * 0.022;
  ctx.save(); ctx.translate(x, feet); ctx.scale(1 - b * 0.45, 1 + b);
  if (a) drawSpr(a, 0, -h, h, f ? c.fbx || 0.5 : 0.5); else drawHero(c, 0, -h * 0.3, h / 58);
  ctx.restore();
}
const CLS_ICON = {   // 職業選擇的武器圖示：[圖, 旋轉, 大小](暫用現有美術，之後可換成專屬圖示)
  sword: ['wpn1', 0, 60], blade: ['fx_b_blade', -0.4, 60], bow: ['fx_b_arrow', 0.785, 64], dart: ['fx_b_dart', 0, 46], healer: ['fx_star', 0, 56], demon: ['fx_b_orb', 0, 52],
};
// UI V2: pure Canvas decoration; no hit regions, save data or gameplay changes.
function homeV2Frame(x,y,w,h,active=false) {
  ctx.save();
  const g=ctx.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,active?'rgba(244,210,129,.94)':'rgba(183,149,94,.60)');
  g.addColorStop(.5,active?'rgba(255,241,181,.85)':'rgba(115,100,73,.55)');
  g.addColorStop(1,active?'rgba(194,134,58,.9)':'rgba(184,149,92,.58)');
  ctx.strokeStyle=g;ctx.lineWidth=active?2.5:1.3;
  roundRect(x,y,w,h,12);ctx.stroke();
  const L=13;
  ctx.strokeStyle=active?'#ffe5a1':'rgba(205,169,107,.65)';ctx.lineWidth=active?2.3:1.5;
  for(const [cx,cy,sx,sy] of [[x+5,y+5,1,1],[x+w-5,y+5,-1,1],[x+5,y+h-5,1,-1],[x+w-5,y+h-5,-1,-1]]) {
    ctx.beginPath();ctx.moveTo(cx+sx*L,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*L);ctx.stroke();
  }
  ctx.restore();
}
function homeV2Header() {
  ctx.save();
  const g=ctx.createLinearGradient(0,178,0,438);
  g.addColorStop(0,'rgba(6,29,26,.24)');g.addColorStop(.5,'rgba(7,38,35,.16)');g.addColorStop(1,'rgba(5,23,21,.32)');
  ctx.fillStyle=g;roundRect(24,186,W-48,240,17);ctx.fill();
  homeV2Frame(26,188,W-52,236);
  ctx.strokeStyle='rgba(225,185,102,.45)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(266,211);ctx.lineTo(266,404);ctx.stroke();
  ctx.fillStyle='rgba(9,39,36,.8)';roundRect(276,190,116,24,7);ctx.fill();
  ctx.fillStyle='#e8c78c';ctx.font=`bold 13px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('江湖人物',334,202);
  ctx.restore();
}
function homeV2Section(y,label) {
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.strokeStyle='rgba(220,182,110,.65)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(187,y);ctx.moveTo(353,y);ctx.lineTo(W-28,y);ctx.stroke();
  ctx.fillStyle='rgba(10,37,34,.92)';roundRect(194,y-11,152,22,7);ctx.fill();
  ctx.fillStyle='#f2d49c';ctx.font=`bold 14px ${FONT}`;ctx.fillText(label,W/2,y+1);
  ctx.restore();
}
function homeV2StartAccent(x,y,w,h) {
  ctx.save();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,231,169,.92)';
  roundRect(x+5,y+5,w-10,h-10,12);ctx.stroke();
  ctx.fillStyle='rgba(255,233,174,.85)';
  for(const xx of [x+18,x+w-18]) {ctx.beginPath();ctx.arc(xx,y+h/2,3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
function drawTitle() {
  drawBg(); dim();
  soundBtn(W - 132, 16); acctBtn(20, 16); if (featOpen('achv')) achvBtn(80, 16); gearBtn(W - 72, 16);
  const lg = spr('logo');
  if (lg) { const lw = 340, lh = lw * lg.h / lg.w;
    ctx.save(); ctx.translate(W / 2, 104); ctx.scale(1, 0.42); const rg = ctx.createRadialGradient(0, 0, 10, 0, 0, 200);   // 黑金墨字底下墊一層宣紙色光暈，暗背景上才看得清楚
    rg.addColorStop(0, 'rgba(255,238,200,.85)'); rg.addColorStop(0.6, 'rgba(240,215,165,.5)'); rg.addColorStop(1, 'rgba(240,215,165,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 200, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.drawImage(lg.img, W / 2 - lw / 2 - 4, 102 - lh / 2, lw, lh); sealStamp(W / 2 + 172, 146, 26, '俠'); }
  else { title('人在江湖殺', 108, 64); sealStamp(W / 2 + 196, 132, 36, '俠'); }
  if (save.cleared > 0) cpBadge(W / 2, lg ? 172 : 160, 24); else { ctx.font = `bold 19px ${FONT}`; ctx.fillStyle = '#f5d27a'; ctx.fillText('左右移動・自動出招・一路殺上山', W / 2, lg ? 172 : 160); }
  const c = clsView(save.cls);
  if (!panel(20, 182, W - 40, 248, 0.94)) { plate(24, 186, W - 48, 240, 18); }
  homeV2Header();
  const px = 150, py = spr('ui_pedestal') ? 378 : 404;
  if (!drawIcon('ui_pedestal', px, py + 8, 172)) { const g = ctx.createRadialGradient(px, py, 4, px, py, 100); g.addColorStop(0, c.shot + 'aa'); g.addColorStop(1, c.shot + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, 100, 26, 0, 0, 6.283); ctx.fill(); }
  drawPreview(c, px, py, spr('ui_pedestal') ? 176 : 190);
  const pp = save.pet && petN(save.pet) ? petDef(save.pet) : null;
  if (pp) { const qx = 236, qy = 300 + Math.sin(AT * 2.4) * 7, gl2 = ctx.createRadialGradient(qx, qy, 3, qx, qy, 44); gl2.addColorStop(0, RCOL[pp.g] + '66'); gl2.addColorStop(1, RCOL[pp.g] + '00');
    ctx.fillStyle = gl2; ctx.beginPath(); ctx.arc(qx, qy, 44, 0, 6.283); ctx.fill(); if (!drawIcon('pet_' + pp.id, qx, qy, 70)) petFallback(pp, qx, qy, 26);
    if (featOpen('bag')) ui.push({ x: qx - 36, y: qy - 36, w: 72, h: 72, act: 'bagpet' }); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  inkText(c.name, 282, 226, 32, { align: 'left' }); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (ttlText()) { ctx.fillStyle = '#ffc23a'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(`【${ttlText()}】`, 280, 200); }
  const st = starOf(c.id); ctx.font = `17px ${FONT}`;
  for (let k = 0; k < STAR_MAX; k++) drawStar(292 + k * 20, 254, 18, k < st);
  if (c.skin) { ctx.fillStyle = '#e8b4ff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('時裝：' + SKINS.find(k => k.id === c.skin).name, 384, 254); }
  ctx.fillStyle = '#ddd'; ctx.font = `14px ${FONT}`;
  const words = c.desc.split('，'); words.forEach((w, i) => ctx.fillText(w + (i < words.length - 1 ? '，' : ''), 282, 274 + i * 18));
  const exk = SKILLS.find(k => k.cls === c.id); if (exk) { ctx.fillStyle = '#ffc23a'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('專屬武學：' + exk.name, 282, 311); }
  ['攻擊', '射速', '射程'].forEach((lb, i) => {
    const y = 328 + i * 20;
    ctx.fillStyle = '#ccc'; ctx.font = `bold 13px ${FONT}`; ctx.fillText(lb, 282, y);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = k < c.pv[i] ? c.shot : '#4a4038'; roundRect(318 + k * 30, y - 5, 26, 10, 3); ctx.fill(); }
  });
  if (featOpen('starup')) {
    btn(282, 382, 112, 36, st >= STAR_MAX ? '已滿星' : `升星 ${fragOf(c.id)}/${STAR_FRAG[st]}`, 'starup', { bg: starReady(c.id) ? '#c0392b' : '#3a2e22', size: 14 });
    if (starReady(c.id)) redDot(390, 386);
    btn(402, 382, 104, 36, '時裝', 'skins', { bg: '#5a2f7a', size: 15 });
  }
  CLASSES.forEach((cc, i) => {
    const w = 76, h = 94, x = 22 + i * (w + 8), y = 440;
    const open = isUnlocked(cc), sel = cc.id === save.cls, planned = cc.atk !== undefined;
    if (open) ui.push({ x, y, w, h, act: 'cls:' + cc.id });
    else if (cc.paid) ui.push({ x, y, w, h, act: 'gopaid' });
    const ca = spr(!open ? 'ui_clscard_lock' : sel ? 'ui_clscard_sel' : 'ui_clscard');   // 職業卡底圖
    if (ca) { const e = sel ? 5 : 0; ctx.drawImage(ca.img, x - e, y - e, w + e * 2, h + e * 2); }
    else { ctx.fillStyle = open ? (sel ? 'rgba(122,31,31,.92)' : 'rgba(40,60,90,.88)') : 'rgba(60,55,50,.85)'; roundRect(x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = sel ? 4 : 2; ctx.strokeStyle = sel ? '#ffd700' : open ? '#cfd8e8' : '#666'; ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fa = open && spr(cc.spr + '_f');
    const own = spr('cls_wpn_' + cc.id), wi = open && (own ? ['cls_wpn_' + cc.id, 0, 56] : CLS_ICON[cc.id]), wa = wi && spr(wi[0]);
    if (wa) { ctx.save(); ctx.translate(x + w / 2, y + 36); ctx.rotate(wi[1]); const z = wi[2], s2 = z / Math.max(wa.w, wa.h); ctx.drawImage(wa.img, -wa.w * s2 / 2, -wa.h * s2 / 2, wa.w * s2, wa.h * s2); ctx.restore(); }
    else if (fa) { ctx.save(); ctx.beginPath(); roundRect(x + 2, y + 2, w - 4, h - 4, 10); ctx.clip(); drawSpr(fa, x + w / 2, y + 6, 54, cc.fbx || 0.5); ctx.restore(); }
    else if (open) drawHero(cc, x + w / 2, y + 44, 0.75);
    else { ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x + w / 2, y + 34, 17, 0, 6.283); ctx.fill(); ctx.fillStyle = '#444'; ctx.font = `bold 17px ${FONT}`; ctx.fillText('鎖', x + w / 2, y + 35); }
    const hasSt = open && starOf(cc.id) > 0;
    ctx.fillStyle = '#fff'; ctx.font = `bold ${cc.name.length > 3 ? 13 : 16}px ${FONT}`; ctx.fillText(cc.name, x + w / 2, y + (hasSt ? 66 : 70));
    if (hasSt) for (let k = 0; k < STAR_MAX; k++) drawStar(x + w / 2 + (k - 2) * 11.5, y + 81, 11, k < starOf(cc.id));
    if (!open) { ctx.fillStyle = '#aaa'; ctx.font = `11px ${FONT}`; ctx.fillText(cc.paid ? '商城限定' : planned ? stageLabel(cc.unlock - 1) + ' 解鎖' : '未開放', x + w / 2, y + 86); }
    homeV2Frame(x+1,y+1,w-2,h-2,sel);
  });
  // Render section title after class cards so the card sprites cannot cover it.
  homeV2Section(430, '選擇門派');
  const fresh = save.cleared === 0;
  btn(W / 2 - 140, 550, 280, 70, fresh ? '開始第一戰' : '開始闖蕩', fresh ? 'first' : 'map', { size: 30 });
  homeV2StartAccent(W/2-140,550,280,70);
  if (fresh) { const pz = (Math.sin(AT * 5) + 1) / 2; ctx.save(); ctx.strokeStyle = `rgba(255,220,120,${0.35 + pz * 0.6})`; ctx.lineWidth = 3 + pz * 3; roundRect(W / 2 - 146 - pz * 4, 544 - pz * 4, 292 + pz * 8, 82 + pz * 8, 18); ctx.stroke(); ctx.restore(); }   // 第一次進遊戲：開始按鈕發光
  if (featOpen('idle')) idleBtn(22, 540);
  if (featOpen('mail')) sideBtn(W - 112, 548, 'mail', '信箱', mailHasClaim());
  if (featOpen('event')) sideBtn(W - 112, 660, 'event', evToday().name, false);
  if (featOpen('pawn')) sideBtn(22, 660, 'pawn', '聚寶當鋪', pawnFree() || save.pawn.bag.length > 0);
  fbtn(W / 2 - 140, 634, 135, 56, '修練', 'upgrade', { bg: '#2f5a8a', size: 23 });
  fbtn(W / 2 + 5, 634, 135, 56, '行囊', 'bag', { bg: '#2f6a4a', size: 23 });
  if (fbtn(W / 2 - 140, 702, 135, 56, '召喚閣', 'gacha', { bg: '#5a2f7a', size: 23 }) && (petFreeOk() || synthReady())) redDot(W / 2 - 11, 706);
  if (fbtn(W / 2 + 5, 702, 135, 56, '每日', 'daily', { bg: '#c0392b', size: 23 }) && dailyHasClaim()) redDot(W / 2 + 134, 706);
  if (fbtn(W / 2 - 140, 770, 135, 52, '商城', 'shop', { bg: '#a0731a', size: 23 }) && shopHasClaim()) redDot(W / 2 - 11, 774);
  if (fbtn(W / 2 + 5, 770, 135, 52, '俠客令', 'pass', { bg: '#7a5a1a', size: 23 }) && passClaimable()) redDot(W / 2 + 134, 774);
  // Render section title after function-button sprites for guaranteed visibility.
  homeV2Section(628, '江湖事務');
  homeV2Section(838, '行走江湖');
  moneyTag(852);
  ctx.textAlign = 'center'; ctx.font = `15px ${FONT}`; ctx.fillStyle = '#ddd';
  if (!IS_TOUCH) ctx.fillText('電腦：← → 或 A D 移動　手機：手指左右拖曳', W / 2, 888);
  ctx.fillStyle = '#888'; ctx.font = `13px ${FONT}`; ctx.fillText('版本 ' + BUILD + '　' + cloudStatusText(), W / 2, H - 24);
}
const NODES = [{ x: 150, y: 775 }, { x: 390, y: 714 }, { x: 150, y: 652 }, { x: 390, y: 591 }, { x: 150, y: 529 }, { x: 390, y: 468 }, { x: 150, y: 407 }, { x: 390, y: 345 }, { x: 150, y: 284 }, { x: 270, y: 222 }];   // 每章 10 關：左右交錯往上，首領置中(原本做法)
function drawSubPick(i, hard) {   // 小關選單：一關 10 個小關，兩排各 5 個
  ui.push({ x: 0, y: 0, w: W, h: H, act: 'subclose' });
  const px = 30, py = 300, pw = W - 60, ph = 330;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (!panel(px, py, pw, ph)) plate(px, py, pw, ph, 18);
  ui.push({ x: px, y: py, w: pw, h: ph, act: 'noop' });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hard ? '#ff9ac0' : '#ffe9a8'; ctx.font = `900 26px ${FONT}`; ctx.fillText(`${hard ? '困難　' : ''}${stageLabel(i)}　${STAGES[i].name}`, W / 2, py + 40);
  ctx.fillStyle = '#d8c7a0'; ctx.font = `15px ${FONT}`; ctx.fillText('一關 10 個小關，第 10 個是首領；打過的小關可以重打賺銅錢', W / 2, py + 72);
  const cur = hard ? save.hard.cleared : save.cleared, cs = subCur(hard);
  for (let k = 0; k < SUBN; k++) {
    const row = k < 5 ? 0 : 1, col = row ? 9 - k : k, x = px + 62 + col * 92, y = py + 130 + row * 100, bossK = k === SUBN - 1, rr0 = bossK ? 34 : 28;
    const op = subOpen(i, k, hard), done = i < cur || k < cs, now = i === cur && k === cs;
    if (now) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,90,' + (0.25 + Math.sin(AT * 5) * 0.12) + ')'; ctx.beginPath(); ctx.arc(x, y, rr0 + 12, 0, 6.283); ctx.fill(); ctx.restore(); }
    const na = spr(!op ? 'ui_node_lock' : bossK ? 'ui_node_boss' : 'ui_node');
    if (na && !(bossK && op)) { const kk = 2 * rr0 * 1.04 / Math.max(na.w, na.h); ctx.drawImage(na.img, x - na.w * kk / 2, y - na.h * kk / 2, na.w * kk, na.h * kk); }
    else if (na) { const kk = 2 * rr0 / 170; ctx.drawImage(na.img, x - na.w * kk / 2, y - na.h * kk / 2 - 19 * kk, na.w * kk, na.h * kk); }
    else { ctx.fillStyle = !op ? '#4a4540' : bossK ? '#7a1f1f' : '#2f5a8a'; ctx.beginPath(); ctx.arc(x, y, rr0, 0, 6.283); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = op ? '#f5d27a' : '#777'; ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = `900 ${bossK ? 22 : 22}px ${FONT}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,20,.8)'; const lb = bossK ? '首' : String(k + 1); ctx.strokeText(lb, x, y + 1); ctx.fillText(lb, x, y + 1);
    if (done) { ctx.fillStyle = '#7dff9a'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('已過', x, y + rr0 + 12); }
    else if (now) { ctx.fillStyle = '#ffd23a'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('挑戰', x, y + rr0 + 12); }
    if (op) ui.push({ x: x - rr0 - 6, y: y - rr0 - 6, w: rr0 * 2 + 12, h: rr0 * 2 + 24, act: `sub:${i}:${k}` });
  }
  btn(W / 2 - 80, py + ph - 62, 160, 46, '關閉', 'subclose', { bg: '#4a3b2a', size: 19 });
}
function drawMap() {
  drawBg(); dim(0.5);
  const ch = S.mapCh || 0, last = CHAPTERS.length - 1, hard = !!S.mapHard;
  if (hard) { ctx.fillStyle = 'rgba(90,0,30,.35)'; ctx.fillRect(0, 0, W, H); }
  title(CHAPTERS[ch], 86, 38);
  btn(24, 116, 92, 36, '普通', 'maphard:0', { bg: hard ? '#3a2e22' : '#2f5a8a', size: 17, border: hard ? '#777' : '#ffd700' });
  btn(122, 116, 92, 36, '困難', 'maphard:1', { bg: hard ? '#8a1f3a' : '#3a2e22', size: 17, border: hard ? '#ffd700' : '#777', disabled: save.cleared < 10 });
  { const w0 = numText(save.coins.toLocaleString(), W - 26, 134, 20, 'gold', 'right'); drawIcon('ico_coin', W - 26 - w0 - 15, 134, 24); } ctx.textAlign = 'center';
  const evx = evToday(); { ctx.font = `bold 13px ${FONT}`; const t = `今日 ${evx.name}`, tw = ctx.measureText(t).width + 22; ctx.fillStyle = 'rgba(90,20,40,.85)'; roundRect(24, 160, tw, 24, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,170,200,.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffd0e0'; ctx.textAlign = 'left'; ctx.fillText(t, 35, 172); ctx.textAlign = 'center'; }
  if (ch > 0) btn(14, 62, 50, 50, '◀', 'mapch:-1', { bg: '#4a3b2a', size: 22 });
  if (ch < last) btn(W - 64, 62, 50, 50, '▶', 'mapch:1', { bg: '#4a3b2a', size: 22, disabled: (hard ? save.hard.cleared : save.cleared) < (ch + 1) * 10 });
  const lockCh = hard && save.cleared < (ch + 1) * 10;
  if (spr('ui_pathdot')) { for (let j = 1; j < NODES.length; j++) { const a = NODES[j - 1], b = NODES[j], L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.floor(L / 30); for (let k = 1; k < n; k++) { const t = k / n; drawIcon('ui_pathdot', a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 18); } } }   // 路線：一顆顆石板
  else { ctx.strokeStyle = 'rgba(245,210,122,.7)'; ctx.lineWidth = 6; ctx.setLineDash([14, 12]); ctx.beginPath();
  NODES.forEach((n, j) => j ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y)); ctx.stroke(); ctx.setLineDash([]); }
  NODES.forEach((n, j) => {
    const i = ch * 10 + j, open = hard ? hardOpen(i) : i <= save.cleared, boss = j === 9, r = boss ? 50 : 38, cur = hard ? save.hard.cleared : save.cleared, stars = hard ? save.hard.stars : save.stars;
    if (open) ui.push({ x: n.x - r, y: n.y - r, w: r * 2, h: r * 2 + 50, act: 'stage:' + i });
    const na = spr(!open ? 'ui_node_lock' : boss ? 'ui_node_boss' : 'ui_node');   // 關卡節點美術
    if (na) {
      if (i === cur && open) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pr = r * (1.35 + Math.sin(AT * 4) * 0.08), gg = ctx.createRadialGradient(n.x, n.y, r * 0.6, n.x, n.y, pr); gg.addColorStop(0, 'rgba(255,210,110,.55)'); gg.addColorStop(1, 'rgba(255,180,60,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, 6.283); ctx.fill(); ctx.restore(); }   // 目前這關：脈動金光
      if (boss && open) { const k = 2 * r / 170; ctx.drawImage(na.img, n.x - na.w * k / 2, n.y - na.h * k / 2 - 19 * k, na.w * k, na.h * k); }   // 首領章有火焰，圓心在下方
      else { const k = 2 * r * 1.04 / Math.max(na.w, na.h); ctx.drawImage(na.img, n.x - na.w * k / 2, n.y - na.h * k / 2, na.w * k, na.h * k); }
      if (hard && open) { ctx.fillStyle = 'rgba(130,30,170,.38)'; ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.66, 0, 6.283); ctx.fill(); }   // 困難模式：中心偏紫
    } else {
      ctx.fillStyle = open ? (hard ? (boss ? '#8a0f3a' : '#5a1f7a') : (boss ? '#7a1f1f' : '#2f5a8a')) : '#4a4540'; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      ctx.lineWidth = i === cur && open ? 6 : 3; ctx.strokeStyle = open ? '#f5d27a' : '#777'; ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.font = `900 ${boss ? 30 : 25}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,6,20,.75)'; ctx.strokeText(open ? stageLabel(i) : '鎖', n.x, n.y + 2); ctx.fillText(open ? stageLabel(i) : '鎖', n.x, n.y + 2);
    ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = open ? '#fff' : '#999'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,20,.7)';
    ctx.strokeText(STAGES[i].name + (boss ? '(首領)' : ''), n.x, n.y + r + 15); ctx.fillText(STAGES[i].name + (boss ? '(首領)' : ''), n.x, n.y + r + 15);
    if (open && i === cur && i < STAGES.length) { ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#ffe08a'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,20,.8)'; const tx = '點這裡出發'; ctx.strokeText(tx, n.x, n.y + r + 36); ctx.fillText(tx, n.x, n.y + r + 36); }
    else if (open) for (let k = 0; k < 3; k++) drawStar(n.x + (k - 1) * 20, n.y + r + 36, 17, k < (stars[i] || 0));
    if (open && !hard) { const bx = n.x + r * 0.78, byy = n.y - r * 0.78, dn = !!save.chal[i];
      if (!drawIcon(dn ? 'ico_chal_done' : 'ico_chal', bx, byy, 34)) { ctx.fillStyle = dn ? '#ffd23a' : '#3a2e22'; ctx.beginPath(); ctx.arc(bx, byy, 13, 0, 6.283); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = dn ? '#fff2c0' : '#ffd23a'; ctx.stroke();
        ctx.fillStyle = dn ? '#3a1a00' : '#ffd23a'; ctx.font = `900 14px ${TFONT}`; ctx.fillText(dn ? '✓' : '令', bx, byy + 1); } }
  });
  if (S.subPick !== null && S.subPick !== undefined) drawSubPick(S.subPick, hard);
  if (lockCh) { ctx.fillStyle = 'rgba(0,0,0,.6)'; roundRect(60, 452, W - 120, 64, 14); ctx.fill(); ctx.fillStyle = '#ffd0d0'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('通關本章「普通」後開放困難模式', W / 2, 484); }
  btn(24, H - 86, 140, 60, '返回', 'title', { bg: '#4a3b2a', size: 22 });
  fbtn(W - 164, H - 86, 140, 60, '修練', 'upgrade', { bg: '#2f5a8a', size: 22 });
  const eo = save.cleared >= 10;
  btn(176, H - 92, 188, 72, '', eo ? 'trials' : 'locked:endless', { bg: '#6a1f1f', border: '#ffc23a', disabled: !eo });
  ctx.globalAlpha = eo ? 1 : 0.5; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 23px ${FONT}`; ctx.fillText('江湖試煉', 270, H - 66);
  ctx.fillStyle = '#ffc23a'; ctx.font = `14px ${FONT}`; ctx.fillText(eo ? `試煉塔 ${save.tower.best} 層` : '1-10 通關解鎖', 270, H - 38); ctx.globalAlpha = 1;
  if (eo && trialsDot()) redDot(356, H - 86);
}
function drawUpgrade() {
  drawBg(); dim(0.65);
  title('修練', 96, 56);
  cpBadge(W / 2, 146, 22);
  coinsTag(186);
  UPS.forEach((u, i) => {
    const y = 230 + i * 170, L = save.up[u.k], maxed = L >= u.max, cost = upCost(u.k);
    plate(30, y, W - 60, 145, 16);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9a8'; ctx.font = `900 32px ${FONT}`; ctx.fillText(u.name, 56, y + 42);
    ctx.fillStyle = '#fff'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`等級 ${L} / ${u.max}`, 150, y + 44);
    ctx.fillStyle = '#ccc'; ctx.font = `18px ${FONT}`; ctx.fillText(u.desc + '(每級)', 56, y + 92);
    for (let k = 0; k < u.max; k++) { ctx.fillStyle = k < L ? '#f5d27a' : '#4a4038'; ctx.fillRect(56 + k * (250 / u.max), y + 118, 250 / u.max - 3, 8); }
    if (maxed) btn(W - 210, y + 40, 160, 64, '已滿級', 'buy:' + u.k, { bg: '#555', size: 22, disabled: true }); else costBtn(W - 210, y + 40, 160, 64, '', cost, 'buy:' + u.k, { bg: '#c0392b', size: 24, disabled: save.coins < cost });
  });
  btn(W / 2 - 150, 724, 300, 62, '一鍵強化', 'autoup', { bg: '#c0392b', size: 24 });
  ctx.textAlign = 'center'; ctx.fillStyle = '#aaa'; ctx.font = `13px ${FONT}`; ctx.fillText('自動把銅錢花在最能提升戰力的修練、已裝備的裝備與出戰靈寵', W / 2, 792);
  btn(W / 2 - 140, 812, 280, 60, '返回', 'back', { bg: '#4a3b2a', size: 24 });
}
function drawGearCard(key, x, y, w, h, opt = {}) {
  const r = grar(key), own = save.gear[key], g = gslot(key), equipped = save.eq[g.k] === key;
  ctx.save();
  if (own && r >= 3) { ctx.shadowColor = RCOL[r]; ctx.shadowBlur = 16; }
  ctx.fillStyle = own ? 'rgba(30,22,16,.95)' : 'rgba(40,36,32,.8)'; roundRect(x, y, w, h, 10); ctx.fill();
  ctx.restore();
  ctx.lineWidth = opt.sel ? 4 : 2; ctx.strokeStyle = opt.sel ? '#fff' : own ? RCOL[r] : '#555'; roundRect(x, y, w, h, 10); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (!own && !opt.force) {
    ctx.fillStyle = '#666'; ctx.font = `900 34px ${FONT}`; ctx.fillText('?', x + w / 2, y + h * 0.42);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = RCOL[r]; ctx.globalAlpha = 0.6; ctx.fillText(RAR[r], x + w / 2, y + h - 16); ctx.globalAlpha = 1;
    return;
  }
  const grd = ctx.createRadialGradient(x + w / 2, y + h * 0.38, 2, x + w / 2, y + h * 0.38, w * 0.45);
  grd.addColorStop(0, RCOL[r] + '66'); grd.addColorStop(1, RCOL[r] + '00');
  ctx.fillStyle = grd; ctx.fillRect(x, y, w, h * 0.75);
  if (!drawIcon(key, x + w / 2, y + h * 0.38, w * 0.66)) { ctx.fillStyle = RCOL[r]; ctx.font = `900 ${Math.round(w * 0.42)}px ${FONT}`; ctx.fillText(g.ch, x + w / 2, y + h * 0.38); }
  ctx.fillStyle = '#fff'; ctx.font = `bold ${w < 90 ? 13 : 15}px ${FONT}`; ctx.fillText(gname(key), x + w / 2, y + h - 30);
  if (opt.tag) { ctx.fillStyle = RCOL[r]; ctx.font = `12px ${FONT}`; ctx.fillText(opt.tag, x + w / 2, y + h - 12); }
  else { const L = opt.lv || own, cap = gcap(key), bw = w - 16; ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(x + 8, y + h - 17, bw, 9, 4); ctx.fill(); ctx.fillStyle = L >= cap ? '#ffd23a' : RCOL[r]; roundRect(x + 8, y + h - 17, bw * Math.min(1, L / cap), 9, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold 10px ${FONT}`; ctx.fillText(L >= GMAX ? 'MAX' : `Lv ${L}`, x + w / 2, y + h - 12); }
  if (equipped && !opt.force) { ctx.fillStyle = '#c0392b'; roundRect(x + w - 26, y + 4, 22, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('裝', x + w - 15, y + 15); }
}
function bagTabs() {
  const t = S.bagTab || 'gear';
  btn(40, 100, 220, 48, '裝備', 'btab:gear', { bg: t === 'gear' ? '#2f6a4a' : '#3a2e22', size: 21, border: t === 'gear' ? '#ffd700' : '#777' });
  btn(280, 100, 220, 48, '靈寵', 'btab:pet', { bg: t === 'pet' ? '#7a3a8a' : '#3a2e22', size: 21, border: t === 'pet' ? '#ffd700' : '#777' });
  if (synthReady()) redDot(494, 104);
}
function drawBag() {
  drawBg(); dim(0.7);
  title('行囊', 62, 50);
  cpBadge(W - 18, 62, 18, 'right');
  bagTabs();
  if ((S.bagTab || 'gear') === 'pet') { drawPetTab(); return; }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd98a'; ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`持有效果：內力 +${ownTotal()}%(拿過的都算)`, 34, 166);
  xtIcon(W - 120, 166, 26); ctx.textAlign = 'left'; ctx.fillStyle = '#cfe3ff'; ctx.font = `bold 15px ${FONT}`; ctx.fillText('玄鐵', W - 102, 166); numText(String(save.xt), W - 66, 166, 17, 'white', 'left');
  const SL = S.bagSlot || 'wpn';
  GSLOT.forEach((g, i) => {   // 六個部位：目前裝備
    const x = 30 + (i % 3) * 163, y = 182 + Math.floor(i / 3) * 118, w = 152, h = 108, ek = save.eq[g.k], has = ek && save.gear[ek], sel = SL === g.k;
    ui.push({ x, y, w, h, act: 'gslot:' + g.k });
    plate(x, y, w, h, 12, sel ? 'gold' : ''); if (has) { ctx.lineWidth = sel ? 3 : 2; ctx.strokeStyle = sel ? '#fff' : RCOL[grar(ek)]; roundRect(x + 3, y + 3, w - 6, h - 6, 10); ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 17px ${TFONT}`; ctx.fillText(g.name, x + 12, y + 20);
    ctx.textAlign = 'right'; ctx.fillStyle = '#cfc6b8'; ctx.font = `12px ${FONT}`; ctx.fillText(g.desc, x + w - 10, y + 20);
    if (has) { const r = grar(ek), gl = ctx.createRadialGradient(x + 42, y + 66, 2, x + 42, y + 66, 34); gl.addColorStop(0, RCOL[r] + '66'); gl.addColorStop(1, RCOL[r] + '00'); ctx.fillStyle = gl; ctx.fillRect(x + 6, y + 30, 72, 72);
      if (!drawIcon(ek, x + 42, y + 66, 58)) { ctx.fillStyle = RCOL[r]; ctx.font = `900 30px ${TFONT}`; ctx.textAlign = 'center'; ctx.fillText(g.ch, x + 42, y + 66); }
      ctx.textAlign = 'left'; ctx.fillStyle = RCOL[r]; ctx.font = `bold 14px ${FONT}`; ctx.fillText(gname(ek), x + 80, y + 52);
      ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText(`Lv ${save.gear[ek]}` + (tmpLv(g.k) ? `・淬${tmpLv(g.k)}` : ''), x + 80, y + 72); ctx.fillStyle = '#ffd98a'; ctx.fillText(`+${gearVal(ek)}${g.unit}`, x + 80, y + 91); }
    else { ctx.textAlign = 'center'; ctx.fillStyle = '#777'; ctx.font = `900 30px ${TFONT}`; ctx.fillText(g.ch, x + w / 2, y + 62); ctx.font = `12px ${FONT}`; ctx.fillText('尚未取得', x + w / 2, y + 92); }
  });
  { const g = GSLOT.find(q => q.k === SL);   // 選中部位的五個品級收藏
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 18px ${TFONT}`; ctx.fillText(`${g.name}收藏`, 36, 432);
    ctx.fillStyle = '#ccc'; ctx.font = `14px ${FONT}`; ctx.fillText(`每件提升${g.desc}，點選查看`, 120, 433);
    for (let r = 0; r < 6; r++) { const key = gkey(g.k, r), x = 32 + r * 80, y = 450; if (save.gear[key]) ui.push({ x, y, w: 74, h: 104, act: 'gsel:' + key }); drawGearCard(key, x, y, 74, 104, { sel: S.bagSel === key }); }
  }
  const k = S.bagSel;
  plate(30, 628, W - 60, 168, 16);
  ctx.lineWidth = 2; ctx.strokeStyle = k ? RCOL[grar(k)] : '#665'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (k && save.gear[k]) {
    const lv = save.gear[k], g = gslot(k), equipped = save.eq[g.k] === k, cap = gcap(k), maxed = lv >= GMAX, brk = canBrk(k), c = gUpCost(k), bc = brCost(k), b = gbr(k);
    const rlc = save.relic[g.k] ? relicDef(save.relic[g.k]) : null;
    ctx.fillStyle = RCOL[grar(k)]; ctx.font = `900 ${rlc ? 20 : 23}px ${FONT}`; ctx.fillText(`${RAR[grar(k)]}・${gname(k)}` + (rlc ? `　〔${rlc.name}〕` : ''), W / 2, 650);
    for (let i = 0; i < 9; i++) { const dx = W / 2 + (i - 4) * 17, dy = 674, on = i < b;   // 突破進度：九顆菱形
      ctx.beginPath(); ctx.moveTo(dx, dy - 6); ctx.lineTo(dx + 5, dy); ctx.lineTo(dx, dy + 6); ctx.lineTo(dx - 5, dy); ctx.closePath();
      ctx.fillStyle = on ? '#ffd23a' : 'rgba(0,0,0,.45)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = on ? '#fff3b0' : '#7a6a55'; ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = `bold 17px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(`Lv ${lv} / ${cap}　${gearText(k)}` + (maxed || brk ? '' : `(下一級 +${gearVal(k, lv + 1)}${g.unit})`), W / 2, 698);
    ctx.fillStyle = brk ? '#9fd8ff' : '#ffd98a'; ctx.font = `bold 14px ${FONT}`;
    const myth = grar(k) === 5, ms = save.mstar[g.k] || 0;
    const tl = tmpLv(g.k);
    ctx.fillText(brk ? `已達上限：突破後上限升到 Lv ${cap + 10}(需要玄鐵 ${bc}，擁有 ${save.xt})` : maxed && equipped ? `神兵淬鍊 ${tl}/${TEMPER.max} 階：此部位 +${Math.round(tl * TEMPER.per * 100)}%` + (tl < TEMPER.max ? `(下一階：玄鐵 ${tmpXt(g.k).toLocaleString()}、銅錢 ${(tmpCu(g.k) / 10000).toLocaleString()} 萬)` : '(已滿)') : myth ? `神話星級 ${'★'.repeat(ms)}${'☆'.repeat(MYTH.starMax - ms)}(每星 +10%)　神話精魄 ${save.mess || 0}` : `持有效果　內力 +${ownVal(k)}%(不用裝備也有效)`, W / 2, 720);
    if (myth && equipped) { if (ms >= MYTH.starMax) btn(46, 736, 170, 50, '星級已滿', 'noop', { bg: '#555', size: 20, disabled: true }); else costBtn(46, 736, 170, 50, '升星', mstarCost(g.k), 'mstar', { bg: '#a0281e', size: 19, disabled: (save.mess || 0) < 1 || save.coins < mstarCost(g.k) }); }
    else btn(46, 736, 170, 50, equipped ? '已裝備' : '裝備', 'gequip', { bg: equipped ? '#555' : '#2f6a4a', size: 22, disabled: equipped });
    if (maxed && equipped && tl < TEMPER.max) { const tx = tmpXt(g.k), ok = save.xt >= tx && save.coins >= tmpCu(g.k); btn(232, 736, 262, 50, '', 'gtmp', { bg: '#8a3a1a', size: 21, disabled: !ok }); xtIcon(300, 761, 30); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `900 21px ${TFONT}`; ctx.fillText('淬鍊', 322, 762); numText(tx.toLocaleString(), 380, 762, 19, save.xt < tx ? 'white' : 'cyan', 'left'); }
    else if (maxed) btn(232, 736, 262, 50, tl >= TEMPER.max ? '淬鍊已滿' : '已滿級', 'gup', { bg: '#555', size: 21, disabled: true });
    else if (brk) { btn(232, 736, 262, 50, '', 'gbrk', { bg: '#6a3aa8', size: 21, disabled: save.xt < bc }); xtIcon(300, 761, 30); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `900 21px ${TFONT}`; ctx.fillText('突破', 322, 762); numText(String(bc), 380, 762, 20, save.xt < bc ? 'white' : 'cyan', 'left'); }
    else costBtn(232, 736, 262, 50, '強化', c, 'gup', { bg: '#c0392b', size: 21, disabled: save.coins < c });
  } else {
    ctx.fillStyle = '#e8dcc8'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('裝備怎麼變強？', W / 2, 666);
    ctx.font = `17px ${FONT}`; ctx.fillStyle = '#ccc';
    ctx.fillText('① 花銅錢「強化」升級，最高 Lv 100', W / 2, 698);
    ctx.fillText('② 每 10 級用玄鐵「突破」；滿 Lv100 後用玄鐵「淬鍊」', W / 2, 724);
    ctx.fillStyle = '#ffd98a'; ctx.fillText('每件拿過的裝備都有「持有效果」，越多越強', W / 2, 750);
    ctx.fillStyle = '#aaa'; ctx.font = `14px ${FONT}`; ctx.fillText('裝備來源：召喚閣、首領掉落、試煉塔、每週首領、俠客令、聚寶當鋪', W / 2, 778);
  }
  btn(30, 820, 230, 60, '一鍵強化', 'autoup', { bg: '#c0392b', size: 22 });
  btn(280, 820, 230, 60, '返回', 'back', { bg: '#4a3b2a', size: 24 });
  drawBrkFx();
}
function xtIcon(x, y, size) {   // 玄鐵圖示(有美術用圖)
  if (drawIcon('ico_xt', x, y, size)) return;
  const w = size * 0.92, h = size * 0.5; ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w * 0.32, -h / 2); ctx.lineTo(w * 0.32, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.closePath();
  const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#9fb6d6'); gr.addColorStop(0.5, '#3d4f6e'); gr.addColorStop(1, '#1c2536');
  ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = Math.max(1, size / 16); ctx.strokeStyle = '#cfe3ff'; ctx.stroke(); ctx.restore();
}
function drawBrkFx() {   // 突破成功：金光放射＋上限提升字樣
  const F = S.brkFx; if (!F) return; F.t += 1 / 60; if (F.t > 1.6) { S.brkFx = null; return; }
  const a = clamp((1.6 - F.t) * 2, 0, 1), z = F.t < 0.2 ? 0.5 + F.t / 0.2 * 0.7 : 1.2 - Math.min(0.2, (F.t - 0.2) * 0.5);
  ctx.save(); ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = a;
  ctx.translate(W / 2, 470); ctx.save(); ctx.rotate(F.t * 0.6); ctx.scale(z, z);
  const EB = spr('fx_evoburst'); if (EB) { ctx.globalCompositeOperation = 'lighter'; drawIcon('fx_evoburst', 0, 0, 420); ctx.globalCompositeOperation = 'source-over'; }
  else { const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 200); g.addColorStop(0, 'rgba(255,240,170,.95)'); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (!drawIcon(F.key, 0, -10, 150)) { if (F.pet) petFallback(petDef(F.pet), 0, -10, 60); else { ctx.fillStyle = RCOL[grar(F.key)]; ctx.font = `900 80px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(gslot(F.key).ch, 0, -10); } }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = `900 44px ${TFONT}`; ctx.lineWidth = 8; ctx.strokeStyle = '#3a1d04'; ctx.strokeText('突破成功', 0, 104); ctx.fillStyle = '#ffe08a'; ctx.fillText('突破成功', 0, 104);
  ctx.font = `bold 20px ${FONT}`; ctx.lineWidth = 5; ctx.strokeText(`等級上限 Lv ${F.cap}`, 0, 146); ctx.fillStyle = '#fff'; ctx.fillText(`等級上限 Lv ${F.cap}`, 0, 146);
  ctx.restore();
}
function drawPetCard(id, x, y, w, h, opt = {}) {
  const d = petDef(id), seen = save.petSeen[id], n = petN(id), on = save.pet === id && n;
  ctx.save(); if (seen && d.g >= 3) { ctx.shadowColor = RCOL[d.g]; ctx.shadowBlur = 16; }
  ctx.fillStyle = seen ? 'rgba(30,22,16,.95)' : 'rgba(40,36,32,.8)'; roundRect(x, y, w, h, 10); ctx.fill(); ctx.restore();
  ctx.lineWidth = opt.sel ? 4 : 2; ctx.strokeStyle = opt.sel ? '#fff' : seen || opt.force ? RCOL[d.g] : '#555'; roundRect(x, y, w, h, 10); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = x + w / 2, cy = y + h * 0.4;
  if (!seen && !opt.force) {
    ctx.globalAlpha = 0.35; if (!drawIcon('pet_' + id, cx, cy, w * 0.7)) { ctx.fillStyle = '#666'; ctx.font = `900 34px ${FONT}`; ctx.fillText('?', cx, cy); } ctx.globalAlpha = 1;
    ctx.font = `13px ${FONT}`; ctx.fillStyle = RCOL[d.g]; ctx.globalAlpha = 0.7; ctx.fillText(RAR[d.g], cx, y + h - 14); ctx.globalAlpha = 1; return;
  }
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, w * 0.45); grd.addColorStop(0, RCOL[d.g] + '66'); grd.addColorStop(1, RCOL[d.g] + '00'); ctx.fillStyle = grd; ctx.fillRect(x, y, w, h * 0.78);
  if (!drawIcon('pet_' + id, cx, cy, w * 0.74)) petFallback(d, cx, cy, w * 0.3);
  ctx.fillStyle = '#fff'; ctx.font = `bold ${w < 100 ? 13 : 16}px ${FONT}`; ctx.fillText(d.name, cx, y + h - 30);
  ctx.fillStyle = RCOL[d.g]; ctx.font = `12px ${FONT}`; ctx.fillText(opt.tag || (n ? `Lv${petLv(id)}・×${n}` : '已收錄'), cx, y + h - 12);
  if (on && !opt.force) { ctx.fillStyle = '#c0392b'; roundRect(x + w - 26, y + 4, 22, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('戰', x + w - 15, y + 15); }
}
function drawPetTab() {
  const id = S.petSel || save.pet, d = id && petDef(id);
  plate(30, 162, W - 60, 196, 16); ctx.lineWidth = 2; ctx.strokeStyle = d ? RCOL[d.g] : '#665'; ctx.stroke();
  ctx.textBaseline = 'middle';
  if (d) {
    const cx = 104, cy = 250, gl = ctx.createRadialGradient(cx, cy, 4, cx, cy, 64); gl.addColorStop(0, RCOL[d.g] + '88'); gl.addColorStop(1, RCOL[d.g] + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 64, 0, 6.283); ctx.fill();
    if (!drawIcon('pet_' + id, cx, cy + Math.sin(AT * 3) * 4, 118)) petFallback(d, cx, cy, 44);
    ctx.textAlign = 'left'; ctx.fillStyle = RCOL[d.g]; ctx.font = `900 26px ${TFONT}`; ctx.fillText(`${d.name}`, 178, 196);
    ctx.font = `bold 15px ${FONT}`; ctx.fillText(RAR[d.g], 178 + ctx.measureText(d.name).width * 1.7 + 14, 198);
    const n = petN(id), on = save.pet === id && n, L = petLv(id), cap = pcap(id), brk = canPBrk(id), need = PBR_N[pbr(id)] || 0, pool = pBrkPool(id);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold 16px ${FONT}`; ctx.fillText(`Lv ${L} / ${cap}`, 178, 226);
    for (let i = 0; i < 9; i++) { const dx = 268 + i * 15, dy = 226, onb = i < pbr(id);   // 突破進度
      ctx.beginPath(); ctx.moveTo(dx, dy - 5); ctx.lineTo(dx + 4.5, dy); ctx.lineTo(dx, dy + 5); ctx.lineTo(dx - 4.5, dy); ctx.closePath(); ctx.fillStyle = onb ? '#ffd23a' : 'rgba(0,0,0,.45)'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = onb ? '#fff3b0' : '#7a6a55'; ctx.stroke(); }
    ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 16px ${FONT}`; ctx.fillText(`出戰加成：內力 +${petAtk(id)}%` + (n && !brk && L < 100 ? `(下一級 +${petAtk(id, L + 1)}%)` : ''), 178, 252);
    ctx.fillStyle = '#e8dcc8'; ctx.font = `15px ${FONT}`; ctx.fillText(`技能：${d.d}`, 178, 278);
    ctx.fillStyle = '#aaa'; ctx.font = `13px ${FONT}`; ctx.fillText(n ? (brk ? `已達上限：突破要消耗 ${need} 隻${RAR[d.g]}靈寵(可用 ${pool})` : `擁有 ×${n}・技能傷害 ×${petPow(id).toFixed(2)}`) : '已收錄(目前沒有)', 178, 302);
    if (n) {
      btn(178, 316, 104, 36, on ? '出戰中' : '出戰', 'pequip', { bg: on ? '#555' : '#2f6a4a', size: 17, disabled: on });
      if (L >= 100) btn(292, 316, 208, 36, '已滿級', 'pup', { bg: '#555', size: 17, disabled: true });
      else if (brk) btn(292, 316, 208, 36, `突破(${need} 隻${RAR[d.g]})`, 'pbrk', { bg: '#6a3aa8', size: 16, disabled: pool < need });
      else costBtn(292, 316, 208, 36, '強化', pUpCost(id), 'pup', { bg: '#c0392b', size: 17, disabled: save.coins < pUpCost(id) });
    }
  } else { ctx.textAlign = 'center'; ctx.fillStyle = '#ccc'; ctx.font = `18px ${FONT}`; ctx.fillText('還沒有靈寵，去召喚閣抽一隻吧！', W / 2, 250); }
  PETS.forEach((p, i) => {
    const x = 32 + (i % 5) * 96, y = 370 + Math.floor(i / 5) * 106;
    ui.push({ x, y, w: 88, h: 100, act: 'psel:' + p.id });
    drawPetCard(p.id, x, y, 88, 100, { sel: id === p.id });
  });
  btn(40, 692, 220, 54, '合成', 'synth', { bg: '#7a3a8a', size: 22 }); if (synthReady()) redDot(254, 696);
  btn(280, 692, 220, 54, `圖鑑 ${PSETS.filter(st => st.ids.every(k => save.petSeen[k])).length}/${PSETS.length}`, 'petbook', { bg: '#2f5a8a', size: 22 });
  const PB = petBonus(); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd98a'; ctx.font = `15px ${FONT}`;
  ctx.fillText('總加成：' + (bonusText(PB) || '無'), W / 2, 764);
  ctx.fillStyle = '#aaa'; ctx.font = `14px ${FONT}`; ctx.fillText('重複的靈寵：同品級 4 隻可合成高一品級，或拿來突破', W / 2, 790);
  btn(30, 820, 230, 60, '一鍵強化', 'autoup', { bg: '#c0392b', size: 22 });
  btn(280, 820, 230, 60, '返回', 'back', { bg: '#4a3b2a', size: 24 });
  drawBrkFx();
}
function tkIcon(kind, x, y, size) {   // 召喚券圖示(有美術用圖)
  if (drawIcon(kind === 'pet' ? 'ico_tk_pet' : 'ico_tk_gear', x, y, size)) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.15); const w = size * 0.9, h = size * 0.6;
  ctx.fillStyle = kind === 'pet' ? '#7a3a8a' : '#2f5a8a'; roundRect(-w / 2, -h / 2, w, h, 4); ctx.fill(); ctx.strokeStyle = '#f2cf78'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffe9a8'; ctx.font = `900 ${Math.round(size * 0.38)}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kind === 'pet' ? '寵' : '兵', 0, 1); ctx.restore();
}
function drawGacha() {
  drawBg(); dim(0.72);
  const T = S.gtab || 'pet', pet = T === 'pet';
  title('召喚閣', 62, 52);
  moneyTag(108);
  [['pet', '靈寵召喚券'], ['gear', '裝備召喚券']].forEach(([k, lb], i) => { const x = i ? W / 2 + 20 : 40; tkIcon(k, x + 18, 140, 34); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8dcc8'; ctx.font = `bold 15px ${FONT}`; ctx.fillText(lb, x + 40, 140); numText('×' + save.tk[k], x + 40 + ctx.measureText(lb).width + 8, 140, 20, k === 'pet' ? 'gold' : 'cyan', 'left'); });
  btn(40, 162, 220, 46, '靈寵召喚', 'gtab:pet', { bg: pet ? '#7a3a8a' : '#3a2e22', size: 20, border: pet ? '#ffd700' : '#777' });
  btn(280, 162, 220, 46, '裝備召喚', 'gtab:gear', { bg: !pet ? '#2f5a8a' : '#3a2e22', size: 20, border: !pet ? '#ffd700' : '#777' });
  if (petFreeOk()) redDot(254, 166);
  plate(40, 220, W - 80, 238, 16);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(pet ? '傳說靈寵' : '傳說裝備', W / 2, 244);
  if (pet) ['qinglong', 'baihu', 'fenghuang'].forEach((id, k) => { const x = W / 2 + (k - 1) * 120, d = petDef(id); if (!drawIcon('pet_' + id, x, 288 + Math.sin(AT * 2 + k) * 4, 70)) petFallback(d, x, 288, 28); });
  else ['wpn4', 'hlm4', 'jad4'].forEach((k2, k) => { const x = W / 2 + (k - 1) * 120, gl = ctx.createRadialGradient(x, 288, 3, x, 288, 40); gl.addColorStop(0, RCOL[4] + '88'); gl.addColorStop(1, RCOL[4] + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, 288, 40, 0, 6.283); ctx.fill(); if (!drawIcon(k2, x, 288 + Math.sin(AT * 2 + k) * 4, 64)) { ctx.fillStyle = RCOL[4]; ctx.font = `900 34px ${TFONT}`; ctx.fillText(gslot(k2).ch, x, 288); } ctx.fillStyle = RCOL[4]; ctx.font = `bold 13px ${FONT}`; ctx.fillText(gname(k2), x, 330); });
  const RT = pet ? PRATES : RATES;
  if (!pet) { ctx.textAlign = 'right'; ctx.fillStyle = RCOL[5]; ctx.font = `bold 13px ${FONT}`; ctx.fillText(mythOpen() ? `神話 ${MYTH.rate}%(每抽先判定)` : '神話：主線全通後開放', W - 56, 244); ctx.textAlign = 'center'; }
  for (let g = 4; g >= 0; g--) { const y = 352 + (4 - g) * 19; ctx.textAlign = 'left'; ctx.fillStyle = RCOL[g]; ctx.font = `bold 15px ${FONT}`; ctx.fillText(RAR[g], 140, y); ctx.textAlign = 'right'; ctx.fillText(RT[g] + '%', W - 140, y); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#9fd8ff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText(`機率公開・${pet ? '同品級內每隻機率相同' : '六個部位機率相同'}　▶ 詳細機率公告`, W / 2, 445); ui.push({ x: 60, y: 432, w: W - 120, h: 28, act: 'legal:odds' });
  ctx.fillStyle = '#ffc23a'; ctx.font = `bold 19px ${FONT}`; ctx.fillText(pet ? `再抽 ${PPITY - (save.ppity || 0)} 次必得傳說靈寵` : mythOpen() ? `傳說保底 ${PITY - (save.pity || 0)} 抽・神話保底 ${MYTH.pity - (save.mpity || 0)} 抽` : `再抽 ${PITY - (save.pity || 0)} 次必得傳說裝備`, W / 2, 484);
  const K = pet ? 'pet' : 'gear', fr = pet && petFreeOk(), lab = n => (n === 1 && fr) ? ['今日免費！', '#ffe9a8'] : save.tk[K] >= n ? [`召喚券 ×${n}`, pet ? '#ffd98a' : '#9fe8ff'] : [`元寶 ${n === 10 ? '900(省 100)' : 100}`, '#7fe0ff'];
  [[1, 40, '單抽'], [10, 280, '十連抽']].forEach(([n, x, nm]) => {
    const ok = canPull(K, n), L = lab(n); btn(x, 506, 220, 86, '', (pet ? 'pull' : 'pullg') + n, { bg: n === 1 && fr ? '#c0392b' : pet ? (n === 1 ? '#4a2f6a' : '#7a2f8a') : (n === 1 ? '#2a4a6a' : '#2f5a8a'), disabled: !ok });
    if (n === 1 && fr) redDot(x + 214, 510);
    ctx.globalAlpha = ok ? 1 : 0.45; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `900 26px ${FONT}`; ctx.fillText(nm, x + 110, 536);
    ctx.fillStyle = L[1]; ctx.font = `bold 17px ${FONT}`; ctx.fillText(L[0], x + 110, 570); ctx.globalAlpha = 1;
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`;
  (pet ? ['十連抽保證至少一隻精品以上', '重複的靈寵別浪費：同品級 4 隻可合成更高品級', '收集到的靈寵會登錄圖鑑，集齊一組有永久加成']
       : ['十連抽保證至少一件精品以上', '兵器、護甲、心法、頭冠、玉佩、靴子六個部位', '重複的裝備變成玄鐵，用來突破等級上限']).forEach((t, i) => ctx.fillText(t, W / 2, 620 + i * 26));
  ctx.fillStyle = '#ffd98a'; ctx.font = `bold 14px ${FONT}`; ctx.fillText('召喚券來源：每日登入、每日任務、通關、試煉塔、每週首領', W / 2, 706);
  btn(40, 740, 220, 60, pet ? '我的靈寵' : '我的裝備', pet ? 'bagpet' : 'baggear', { bg: '#2f5a8a', size: 22 });
  btn(280, 740, 220, 60, '返回', 'back', { bg: '#4a3b2a', size: 22 });
  if (S.pres) drawPetResult();
}
function drawPetResult() {
  ui = [];
  const G = S.pres, n = G.list.length;
  dim(0.93);
  const gear = G.src === 'gear', rOf = it => it.key ? grar(it.key) : petDef(it.id).g;
  title(G.src === 'synth' ? (G.ok ? '合成成功！' : '合成失敗') : G.best >= 4 ? (gear ? '神兵出世！' : '神獸降世！') : G.best >= 3 ? (gear ? '極品到手！' : '極品靈寵！') : '恭喜獲得', 150, 48);
  const pos = i => { const w = n === 1 ? 170 : 88, h = n === 1 ? 200 : 116; return { w, h, x: n === 1 ? W / 2 - w / 2 : 30 + (i % 5) * (w + 8), y: n === 1 ? 250 : 240 + Math.floor(i / 5) * (h + 16) }; };
  G.list.forEach((it, i) => {   // 依品級出現光柱
    if (G.t < i * 0.12) return;
    const { x, y, w, h } = pos(i), r = rOf(it), pop = clamp((G.t - i * 0.12) * 4, 0, 1), fl = 0.75 + Math.sin(AT * 6 + i) * 0.25;
    const g = ctx.createLinearGradient(0, 0, 0, y + h); g.addColorStop(0, RCOL[r] + '00'); g.addColorStop(0.7, RCOL[r] + (r >= 3 ? 'cc' : r >= 2 ? '88' : '44')); g.addColorStop(1, RCOL[r] + '00');
    ctx.globalAlpha = pop * fl; ctx.fillStyle = g; const bw = w * (r >= 3 ? 0.8 : 0.5); ctx.fillRect(x + w / 2 - bw / 2, 0, bw, y + h); ctx.globalAlpha = 1;
  });
  G.list.forEach((it, i) => {
    if (G.t < i * 0.12) return;
    const { x, y, w, h } = pos(i), pop = clamp((G.t - i * 0.12) * 6, 0, 1);
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop); ctx.globalAlpha = pop;
    if (it.key) drawGearCard(it.key, -w / 2, -h / 2, w, h, { force: true, lv: it.lv, tag: it.isNew ? 'NEW!' : it.xt ? '玄鐵 +' + it.xt : it.coins ? '銅錢+' + it.coins : 'Lv ' + it.lv });
    else drawPetCard(it.id, -w / 2, -h / 2, w, h, { force: true, tag: it.isNew ? 'NEW!' : `擁有 ×${petN(it.id)}` });
    ctx.restore();
  });
  ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (G.src === 'synth') {
    ctx.font = `bold 18px ${FONT}`;
    if (G.ok) { ctx.fillStyle = '#ffe9a8'; ctx.fillText(`${RAR[G.g]} → ${RAR[G.g + 1]}，得到 ${petDef(G.list[0].id).name}`, W / 2, 486); }
    else { ctx.fillStyle = '#ffb08a'; ctx.fillText(`退回 1 隻${RAR[G.g]}靈寵，福緣 +${FY_ADD}(${save.fy[G.g]}/100)`, W / 2, 486);
      ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`; ctx.fillText(save.fy[G.g] >= 100 ? '福緣已滿，下次合成必定成功！' : '福緣滿 100，下次合成必定成功', W / 2, 516); }
  }
  if (G.t > n * 0.12 + 0.2) {
    btn(W / 2 - 230, 600, 220, 64, '確定', 'pclose', { bg: '#4a3b2a', size: 24 });
    if (G.src === 'synth') btn(W / 2 + 10, 600, 220, 64, '再合成', 'syn:' + G.g, { bg: '#7a3a8a', size: 22, disabled: synthAvail(G.g) < 4 });
    else { const kd = gear ? 'gear' : 'pet'; btn(W / 2 + 10, 600, 220, 64, n === 10 ? '再十連' : (kd === 'pet' && petFreeOk()) ? '免費再抽' : '再抽一次', (gear ? 'pullg' : 'pull') + n, { bg: '#7a2f8a', size: 22, disabled: !canPull(kd, n) }); }
  }
}
function drawSynth() {
  drawBg(); dim(0.8);
  title('靈寵合成', 70, 50);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8dcc8'; ctx.font = `16px ${FONT}`;
  ctx.fillText('同品級 4 隻 → 隨機 1 隻高一品級靈寵(出戰中的會保留一隻)', W / 2, 118);
  ctx.fillText(`失敗會退回 1 隻同品級，並加福緣 ${FY_ADD}；福緣滿 100 必定成功`, W / 2, 144);
  for (let g = 0; g < 4; g++) {
    const y = 172 + g * 140, n = synthAvail(g), ok = n >= 4, fy = save.fy[g];
    plate(24, y, W - 48, 126, 14); ctx.lineWidth = 2; ctx.strokeStyle = RCOL[g + 1]; ctx.stroke();
    ctx.textAlign = 'left'; ctx.font = `900 22px ${FONT}`; ctx.fillStyle = RCOL[g]; ctx.fillText(RAR[g], 44, y + 30);
    ctx.fillStyle = '#fff'; ctx.fillText('→', 44 + 52, y + 30); ctx.fillStyle = RCOL[g + 1]; ctx.fillText(RAR[g + 1], 44 + 80, y + 30);
    ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = ok ? '#7fffa0' : '#ccc'; ctx.fillText(`可用 ${n} 隻(需要 4)`, 44, y + 64);
    ctx.fillStyle = '#ffe9a8'; ctx.fillText(`成功率 ${fy >= 100 ? 100 : PSYN[g]}%`, 250, y + 64);
    if (PSYN[g] < 100) {
      pbar(44, y + 90, 230, 12, fy / 100, fy >= 100 ? '#ffd23a' : '#ff9ad8');
      ctx.fillStyle = '#ffb3e0'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(fy >= 100 ? '福緣已滿・必定成功' : `福緣 ${fy}/100`, 284, y + 97);
    } else { ctx.fillStyle = '#aaa'; ctx.font = `14px ${FONT}`; ctx.fillText('必定成功', 44, y + 97); }
    btn(W - 168, y + 30, 130, 64, '合成', 'syn:' + g, { bg: ok ? '#7a3a8a' : '#3a2e22', size: 22, disabled: !ok });
    if (ok) redDot(W - 44, y + 34);
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#aaa'; ctx.font = `13px ${FONT}`; ctx.fillText('機率公開：成功時同品級內每隻機率相同(還沒有的靈寵機率加倍)', W / 2, 744);
  btn(W / 2 - 140, 820, 280, 60, '返回', 'bagpet', { bg: '#4a3b2a', size: 24 });
  if (S.pres) drawPetResult();
}
function drawPetBook() {
  drawBg(); dim(0.82);
  title('靈寵圖鑑', 66, 50);
  const PB = petBonus(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd98a'; ctx.font = `bold 16px ${FONT}`;
  ctx.fillText(`總加成：${bonusText(PB) || '無'}`, W / 2, 110);
  ctx.fillStyle = '#aaa'; ctx.font = `13px ${FONT}`; ctx.fillText(`已收集 ${petSeenN()}/${PETS.length} 種(曾經擁有就算，合成用掉也不會消失)`, W / 2, 134);
  PSETS.forEach((st, i) => {
    const y = 152 + i * 92, got = st.ids.filter(id => save.petSeen[id]).length, done = got === st.ids.length;
    plate(24, y, W - 48, 82, 12, done ? 'gold' : ''); if (done) { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.fillStyle = done ? '#ffe9a8' : '#fff'; ctx.font = `900 19px ${TFONT}`; ctx.fillText(st.name, 40, y + 24);
    ctx.fillStyle = done ? '#ffd23a' : '#bfb3a0'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(bonusText(st.b), 40, y + 56);
    st.ids.forEach((id, k) => { const x = 300 + k * 52, d = petDef(id), sn = save.petSeen[id]; ctx.globalAlpha = sn ? 1 : 0.3; if (!drawIcon('pet_' + id, x, y + 34, 46)) petFallback(d, x, y + 34, 18); ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.fillStyle = sn ? RCOL[d.g] : '#777'; ctx.font = `11px ${FONT}`; ctx.fillText(d.name, x, y + 70); });
    ctx.textAlign = 'right'; ctx.fillStyle = done ? '#ffd23a' : '#ccc'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(done ? '已啟動' : `${got}/${st.ids.length}`, W - 36, y + 24);
  });
  btn(W / 2 - 140, 820, 280, 60, '返回', 'bagpet', { bg: '#4a3b2a', size: 24 });
}
function drawDaily() {
  drawBg(); dim(0.74); dailyCheck();
  title('每日', 76, 52); moneyTag(130);
  plate(16, 158, W - 32, 228, 16);
  const cur = save.login.n % 7, ready = loginReady();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(`每日登入獎勵(已累積 ${save.login.n} 天)`, W / 2, 186);
  LOGIN.forEach((rw, i) => {
    const w = 64, x = 24 + i * (w + 6), y = 208, done = i < cur, now = i === cur && ready;
    plate(x, y, w, 96, 10, done ? 'dim' : now ? 'red' : '');
    ctx.lineWidth = now ? 3 : 1.5; ctx.strokeStyle = now ? '#ffd700' : '#776'; ctx.stroke();
    ctx.fillStyle = '#ccc'; ctx.font = `13px ${FONT}`; ctx.fillText(`第${i + 1}天`, x + w / 2, y + 16);
    if (!drawIcon(rw.g ? 'ico_gem' : 'ico_coin', x + w / 2, y + 44, 40)) { ctx.fillStyle = rw.g ? '#7fe0ff' : '#ffd700'; ctx.font = `900 20px ${FONT}`; ctx.fillText(rw.g ? '寶' : '錢', x + w / 2, y + 44); }
    ctx.fillStyle = rw.g ? '#7fe0ff' : '#ffd700';
    ctx.font = `bold 14px ${FONT}`; ctx.fillText(String(rw.g || rw.c), x + w / 2, y + 70);
    const tks = [['pet', rw.pt], ['gear', rw.et]].filter(t => t[1]);   // 附贈召喚券
    tks.forEach(([k, n], j) => { const cx = x + w / 2 + (tks.length > 1 ? (j ? 15 : -15) : 0); tkIcon(k, cx - 8, y + 86, 16); ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('×' + n, cx + 1, y + 87); ctx.textAlign = 'center'; });
    if (done) { ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(x, y, w, 96, 10); ctx.fill(); ctx.fillStyle = '#5fd35f'; ctx.font = `900 30px ${FONT}`; ctx.fillText('✓', x + w / 2, y + 48); }
  });
  btn(W / 2 - 120, 318, 240, 54, ready ? '領取今日獎勵' : '明天再來', 'login', { bg: ready ? '#c0392b' : '#555', size: 21, disabled: !ready });
  plate(16, 400, W - 32, 400, 16);
  ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('每日任務(每天午夜更新)', W / 2, 428);
  save.daily.tasks.forEach((t, k) => {
    const T = taskDef(t.id), y = 452 + k * 96, done = t.p >= t.n;
    plate(30, y, W - 60, 84, 12);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold 19px ${FONT}`; ctx.fillText(T.name(t.n), 46, y + 24);
    ctx.fillStyle = T.rw.g ? '#7fe0ff' : '#ffd700'; ctx.font = `15px ${FONT}`; ctx.fillText('獎勵：' + rwText(T.rw), 46, y + 50);
    pbar(46, y + 64, 260, 10, t.p / t.n, done ? '#5fd35f' : '#f5d27a');
    ctx.fillStyle = '#ccc'; ctx.font = `13px ${FONT}`; ctx.fillText(`${t.p}/${t.n}`, 314, y + 69);
    btn(W - 160, y + 16, 116, 52, t.got ? '已領取' : done ? '領取' : '進行中', 'task:' + k, { bg: t.got ? '#555' : done ? '#c0392b' : '#4a3b2a', size: 19, disabled: t.got || !done });
  });
  const all = save.daily.tasks.every(t => t.got);
  btn(40, 744, W - 80, 46, save.daily.chest ? '今日寶箱已領取' : `全勤寶箱：${rwText(DAILY_CHEST, 1)}`, 'chest', { bg: all && !save.daily.chest ? '#c0392b' : '#4a3b2a', size: 18, disabled: !all || save.daily.chest });
  btn(W / 2 - 140, 822, 280, 60, '返回', 'back', { bg: '#4a3b2a', size: 24 });
}
function drawAccount() {
  drawBg(); dim(0.76);
  title('帳號', 80, 52);
  plate(24, 130, W - 48, 250, 16);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `bold 19px ${FONT}`;
  const line = (lb, v, col, y) => { ctx.fillStyle = '#aaa'; ctx.fillText(lb, 48, y); ctx.fillStyle = col || '#fff'; ctx.fillText(v, 150, y); };
  if (!CLOUD.on) {
    line('連線狀態', '未連線', '#aaa', 170);
    ctx.fillStyle = '#ddd'; ctx.font = `16px ${FONT}`;
    ctx.fillText('這個版本沒有連到伺服器(離線測試版)，', 48, 220);
    ctx.fillText('進度只存在這台裝置的瀏覽器裡。', 48, 248);
  } else {
    line('連線狀態', cloudStatusText(), CLOUD.status === 'err' ? '#ff8a7a' : CLOUD.status === 'ok' ? '#5fd35f' : '#7fe0ff', 170);
    line('帳號類型', isAnon() ? '訪客帳號' : 'Email 帳號', isAnon() ? '#ffc23a' : '#5fd35f', 210);
    if (!isAnon()) line('Email', acctEmail(), '#fff', 250);
    line('玩家編號', uid() ? uid().slice(0, 8).toUpperCase() : '—', '#ccc', isAnon() ? 250 : 290);
    if (CLOUD.last) { ctx.fillStyle = '#999'; ctx.font = `15px ${FONT}`; ctx.fillText('上次同步：' + new Date(CLOUD.last).toLocaleTimeString('zh-TW'), 48, isAnon() ? 290 : 330); }
    if (isAnon()) { ctx.fillStyle = '#ffc23a'; ctx.font = `15px ${FONT}`; ctx.fillText('訪客進度只跟這台裝置綁定，建議綁定 Email，', 48, 326); ctx.fillText('換手機或清除資料也能找回進度。', 48, 350); }
    let y = 404;
    if (isAnon()) { btn(W / 2 - 150, y, 300, 58, '連結 Email', 'acc_bind', { bg: '#2f6a4a', size: 22 }); y += 72; }
    btn(W / 2 - 150, y, 300, 58, '登入其他帳號', 'acc_login', { bg: '#2f5a8a', size: 22 }); y += 72;
    btn(W / 2 - 150, y, 300, 58, '立即同步', 'acc_sync', { bg: '#5a4a2a', size: 22, disabled: CLOUD.busy }); y += 72;
    if (!isAnon()) { btn(W / 2 - 150, y, 300, 58, '登出', 'acc_logout', { bg: '#4a3b2a', size: 22 }); y += 72; }
    btn(W / 2 - 100, y + 6, 200, 44, '刪除帳號', 'acc_del', { bg: '#5a1a1a', border: '#a55', size: 17 });
  }
  btn(W / 2 - 140, 822, 280, 60, '返回', 'back', { bg: '#4a3b2a', size: 24 });
}
const ENDLESS_GAP = 35;
// ---------- 試煉塔 ----------
const TOWER_ELITE = ['elite', 'elite2', 'elite3', 'elite4', 'elite5', 'elite6', 'elite7', 'elite8', 'elite9', 'elite10', 'elite11', 'elite12'], TOWER_CHIEF = ['chief', 'chief2', 'chief3', 'chief4', 'chief5', 'chief6', 'chief7', 'chief8', 'chief9', 'chief10', 'chief11', 'chief12'];
const towerHm = f => 1.6 * Math.pow(1.09, f - 1);   // 每層強 9%：約 40 層追上主線最後一關
const towerCh = f => Math.floor((f - 1) / 5) % 12;     // 每 5 層換一個章節的場景與敵人
const towerIdx = f => towerCh(f) * 10 + ((f - 1) % 5) * 2 + 1;
function towerRw(f) {   // 每層第一次通過的獎勵
  const r = { c: 150 + 50 * f, g: 15 + Math.floor(f / 5) * 2, pt: f % 2 ? 1 : 0, et: f % 2 ? 0 : 1 };
  if (f % 5 === 0) { r.g += 40; r.frag = 10; r.pt += 3; r.et += 3; }
  if (f % 10 === 0) { r.g += 60; r.gear = Math.min(4, Math.floor(f / 10)); }   // 每 10 層保底裝備：10 層良品、20 層精品、30 層極品、40 層傳說
  return r;
}
const rwLine = r => [r.g ? `元寶 ${r.g}` : '', r.c ? `銅錢 ${r.c.toLocaleString()}` : '', r.pt ? `靈寵券 ${r.pt}` : '', r.et ? `裝備券 ${r.et}` : '', r.frag ? `碎片 ${r.frag}` : '', r.gear !== undefined ? `${RAR[r.gear]}以上裝備` : ''].filter(Boolean).join('、');
function startTower() {
  const f = save.tower.best + 1, i = towerIdx(f);
  startOv(i, () => {
    S.wantHard = false; S.wantSub = SUBN - 1; newRun(i); S.tower = f;
    S.ov = Object.assign({}, STAGES[i], { name: `試煉塔 第 ${f} 層`, len: 42 + Math.min(18, f), hm: towerHm(f), boss: (f % 5 === 0 ? TOWER_CHIEF : TOWER_ELITE)[towerCh(f)] });
    bannerObj = null; banner(`試煉塔　第 ${f} 層`, 1.6); logEv('tower_start', { f, cls: S.cls.id });
    if (!save.guide.tower) S.guide = 'tower';
  });
}
function towerEnd(win) {
  const f = S.tower; let rw = null, drop = null;
  if (win && f > save.tower.best) {
    rw = towerRw(f); save.tower.best = f; save.coins += rw.c; save.gems += rw.g; save.tk.pet += rw.pt; save.tk.gear += rw.et;
    if (rw.frag) addFrag(save.cls, rw.frag);
    if (rw.gear !== undefined) drop = bossDrop(NST - 1, false, rw.gear);
  }
  const coins = Math.round(S.coinsRun * 0.5), pxp = S.kills, lvUp = passXp(pxp); save.coins += coins;
  if (win) { track('win'); stat('wins'); }
  logEv('tower_end', { f, win: win ? 1 : 0, cls: S.cls.id, t: Math.round(S.t) });
  persist();
  S.result = { tower: f, win, rw, drop, coins, pxp, lvUp, kills: S.kills, units: S.units, doubled: false };
  S.mode = 'result'; S.paused = false; drag.on = false; sfx(win ? 'win' : 'lose');
}
function drawTowerResult() {
  dim(0.75); const r = S.result;
  title(r.win ? '登塔成功' : '止步於此', 200, 60);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.font = `900 34px ${FONT}`; ctx.fillText(`試煉塔　第 ${r.tower} 層`, W / 2, 280);
  ctx.fillStyle = '#ffc23a'; ctx.font = `bold 19px ${FONT}`; ctx.fillText(`最高紀錄：第 ${save.tower.best} 層`, W / 2, 322);
  let y = 370;
  if (r.rw) { ctx.fillStyle = 'rgba(120,80,10,.8)'; roundRect(50, y - 26, W - 100, r.drop ? 92 : 56, 12); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 19px ${FONT}`; ctx.fillText('首次通過：' + rwLine(Object.assign({}, r.rw, { gear: undefined })), W / 2, y);
    if (r.drop) { ctx.fillStyle = RCOL[grar(r.drop.key)]; ctx.fillText(`獲得 ${RAR[grar(r.drop.key)]}・${gname(r.drop.key)}`, W / 2, y + 36); y += 36; } y += 50; }
  ctx.fillStyle = '#ffd700'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`銅錢 +${r.coins}　擊敗 ${r.kills}`, W / 2, y); y += 34;
  ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#c9a86a'; ctx.fillText(`俠客令經驗 +${r.pxp}` + (r.lvUp ? `　升到 Lv ${passLv()}！` : ''), W / 2, y); y += 30;
  const nf = save.tower.best + 1, nr = towerRw(nf); ctx.fillStyle = '#e8dcc8'; ctx.font = `15px ${FONT}`; ctx.fillText(`第 ${nf} 層獎勵：${rwLine(nr)}`, W / 2, y); y += 36;
  btn(W / 2 - 150, y, 300, 76, r.win ? `挑戰第 ${nf} 層` : '再戰一次', 'tower', { size: 28 }); y += 92;
  if (!r.win && featOpen('upgrade')) { btn(W / 2 - 140, y, 280, 56, '去修練', 'upgrade', { bg: '#2f5a8a', size: 21 }); y += 70; }
  btn(W / 2 - 140, y, 280, 56, '回到江湖試煉', 'trials', { bg: '#4a3b2a', size: 21 });
}

// ---------- 每週首領 ----------
const WEEK_BOSS = ['chief', 'elite4', 'chief2', 'elite5', 'chief3', 'elite6', 'chief4', 'elite', 'chief5', 'elite2', 'chief6', 'elite3'];
const WMODS = [
  { id: 'swarm',  name: '群魔亂舞', d: '小怪和首領的手下數量加倍' },
  { id: 'gift',   name: '天賜奇緣', d: '開局直接領悟兩門武學' },
  { id: 'legion', name: '萬人之軍', d: '開局分身 +12，但內力 −20%' },
  { id: 'rage',   name: '首領狂暴', d: '首領出招快 40%' },
  { id: 'swift',  name: '疾風驟雨', d: '出招速度 +30%，敵人也快 30%' },
];
const WTIER = [0.4, 0.9, 1.5, 2.2, 3.0];   // 傷害門檻＝本週基準的倍數
const WRW = [{ g: 30, c: 1000, pt: 2 }, { g: 50, c: 2000, et: 3 }, { g: 80, frag: 10, pt: 5 }, { g: 120, c: 5000, et: 5 }, { g: 200, gear: 2, pt: 10 }];
const WEEK_TRIES = 3, WEEK_T = 60;
const weekNo = () => (window.JH && JH.wkOverride !== undefined) ? JH.wkOverride : Math.floor((Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5) + 3) / 7);   // 每週一換
const wkBoss = () => WEEK_BOSS[weekNo() % WEEK_BOSS.length];
const wkModDef = () => WMODS[weekNo() % WMODS.length];
const wkMod = id => !!(S.weekly && S.weekly.mod === id);
const bossCh = k => { const m = k.match(/\d+/); return m ? +m[0] - 1 : 0; };
function wkCheck() {
  const W8 = save.weekly, wk = weekNo();
  if (W8.wk !== wk) Object.assign(W8, { wk, ref: clamp(save.cleared - 1, 0, STAGES.length - 1), best: 0, got: 0 });   // 新的一週：以目前進度定基準
  if (W8.day !== today()) Object.assign(W8, { day: today(), tries: 0, adUsed: false });
}
const wkLeft = () => WEEK_TRIES + (save.weekly.adUsed ? 1 : 0) - save.weekly.tries;
const wkD = () => { const st = STAGES[save.weekly.ref]; return 30000 * st.hm * (1 + 0.05 * st.ch); };
const trialsDot = () => { wkCheck(); return wkLeft() > 0 && save.weekly.got < WTIER.length; };
function startWeekly() {
  wkCheck();
  if (wkLeft() <= 0) { toast('今天的挑戰次數用完了，明天再來！'); return; }
  const bk = wkBoss(), ch = bossCh(bk), i = ch * 10 + 5, mod = wkModDef();
  startOv(i, () => {
    save.weekly.tries++; persist();
    S.wantHard = false; S.wantSub = SUBN - 1; newRun(i);
    const ref = STAGES[save.weekly.ref], D = wkD();
    S.weekly = { mod: mod.id, dmg: 0, T: WEEK_T, D, cap: D * 6, on: false };
    S.ov = Object.assign({}, STAGES[i], { name: `每週首領　${BOSSES[bk].name}`, len: 28, hm: ref.hm * 0.8, boss: bk });
    if (mod.id === 'legion') { S.units += 12; S.atk *= 0.8; }
    if (mod.id === 'swift') { S.rate *= 1.3; S.wspd = 1.3; }
    if (mod.id === 'gift') { S.xp = xpNeed(0) + xpNeed(1); gainXp(0); }
    bannerObj = null; banner(`每週首領・${mod.name}`, 1.8); logEv('weekly_start', { boss: bk, mod: mod.id, cls: S.cls.id });
    if (!save.guide.weekly) S.guide = 'weekly';
  });
}
function weeklyEnd() {
  const W8 = save.weekly, dmg = Math.round(S.weekly.dmg), D = S.weekly.D, newBest = dmg > W8.best, got = [];
  W8.best = Math.max(W8.best, dmg);
  while (W8.got < WTIER.length && W8.best >= D * WTIER[W8.got]) {
    const rw = WRW[W8.got], it = { rw };
    giveRw(rw); if (rw.frag) addFrag(save.cls, rw.frag);
    if (rw.gear !== undefined) it.drop = bossDrop(NST - 1, false, rw.gear);
    got.push(it); W8.got++;
  }
  const coins = Math.round(S.coinsRun * 0.5), pxp = S.kills, lvUp = passXp(pxp); save.coins += coins;
  logEv('weekly_end', { dmg, pct: Math.round(dmg / D * 100), mod: S.weekly.mod, cls: S.cls.id });
  persist();
  S.result = { weekly: true, dmg, D, best: W8.best, newBest, got, coins, pxp, lvUp, kills: S.kills, units: S.units, doubled: false };
  S.mode = 'result'; S.paused = false; drag.on = false; sfx(got.length || newBest ? 'win' : 'lose');
}
const fmtN = n => n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(n >= 1e6 ? 0 : 1) + '萬' : String(Math.round(n));
function tierBar(x, y, w, val, D, got) {   // 傷害門檻進度條(5 格)
  ctx.fillStyle = 'rgba(0,0,0,.6)'; roundRect(x, y, w, 12, 6); ctx.fill();
  const mx = D * WTIER[WTIER.length - 1], f = clamp(val / mx, 0, 1);
  ctx.fillStyle = '#ff9a2e'; roundRect(x, y, w * f, 12, 6); ctx.fill();
  WTIER.forEach((t, k) => { const px = x + w * t / WTIER[WTIER.length - 1], ok = val >= D * t || k < got;
    ctx.fillStyle = ok ? '#ffd23a' : '#5a4a3a'; ctx.beginPath(); ctx.arc(px, y + 6, 11, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = ok ? '#3a1a00' : '#cfc6b8'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k + 1, px, y + 7); });
}
function drawWeeklyHud() {   // 首領戰：傷害、倒數、門檻
  const Wk = S.weekly; ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(20, H - 128, W - 40, 40, 10); ctx.fill();   // 放在畫面下方，不擋首領
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 19px ${FONT}`; ctx.fillText(fmtN(Wk.dmg), 34, H - 108);
  ctx.textAlign = 'right'; ctx.fillStyle = Wk.T < 10 ? '#ff6a4a' : '#fff'; ctx.fillText(`${Math.ceil(Math.max(0, Wk.T))}秒`, W - 32, H - 108);
  tierBar(132, H - 114, W - 240, Wk.dmg, Wk.D, 0);
  ctx.restore();
}
function drawWeeklyResult() {
  dim(0.78); const r = S.result;
  title(r.newBest ? '本週新紀錄！' : '挑戰結束', 190, 56);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.font = `900 40px ${FONT}`; ctx.fillText('傷害 ' + fmtN(r.dmg), W / 2, 270);
  ctx.fillStyle = '#ffc23a'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`本週最高：${fmtN(r.best)}`, W / 2, 312);
  tierBar(70, 340, W - 140, r.best, r.D, save.weekly.got);
  let y = 392;
  r.got.forEach(it => { ctx.fillStyle = 'rgba(120,80,10,.8)'; roundRect(50, y - 20, W - 100, 40, 10); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 17px ${FONT}`;
    ctx.fillText('達成門檻：' + rwLine(Object.assign({}, it.rw, { gear: undefined })) + (it.drop ? `、${RAR[grar(it.drop.key)]}・${gname(it.drop.key)}` : ''), W / 2, y); y += 48; });
  const nk = save.weekly.got;
  if (nk < WTIER.length) { ctx.fillStyle = '#e8dcc8'; ctx.font = `15px ${FONT}`; ctx.fillText(`下一個門檻 ${fmtN(r.D * WTIER[nk])}：${rwLine(WRW[nk])}`, W / 2, y); y += 30; }
  ctx.fillStyle = '#ffd700'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`銅錢 +${r.coins}　俠客令經驗 +${r.pxp}`, W / 2, y); y += 40;
  const left = wkLeft();
  if (left > 0) btn(W / 2 - 150, y, 300, 72, `再戰(今日剩 ${left} 次)`, 'weekly', { size: 24 });
  else if (!save.weekly.adUsed) btn(W / 2 - 150, y, 300, 72, '看廣告 再戰一次', 'wad', { bg: '#2f6a4a', size: 24 });
  else btn(W / 2 - 150, y, 300, 72, '明天再來', 'noop', { bg: '#555', size: 24, disabled: true });
  y += 88; btn(W / 2 - 140, y, 280, 56, '回到江湖試煉', 'trials', { bg: '#4a3b2a', size: 21 });
}

// ---------- 江湖試煉(入口畫面) ----------
function trialCard(y, h, ico, fallCh, col, name, lines, act, label, opt = {}) {
  if (!panel(30, y, W - 60, h)) { ctx.fillStyle = 'rgba(40,26,14,.94)'; roundRect(30, y, W - 60, h, 16); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); }
  const cx = 104, cy = y + h / 2 - 8;
  if (!drawIcon(ico, cx, cy, 112)) { ctx.fillStyle = 'rgba(15,8,4,.9)'; ctx.beginPath(); ctx.arc(cx, cy, 46, 0, 6.283); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    ctx.fillStyle = col; ctx.font = `900 46px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fallCh, cx, cy + 2); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `900 28px ${TFONT}`; ctx.fillText(name, 176, y + 40);
  lines.forEach((l, k) => { ctx.fillStyle = l[1] || '#e8dcc8'; ctx.font = `${k ? '' : 'bold '}15px ${FONT}`; ctx.fillText(l[0], 176, y + 74 + k * 24); });
  btn(176, y + h - 66, W - 236, 48, label, act, Object.assign({ size: 20 }, opt));
}
function drawTrials() {
  drawBg(); dim(0.7); wkCheck();
  title('江湖試煉', 84, 58);
  const nf = save.tower.best + 1;
  trialCard(140, 236, 'ico_trial_tower', '塔', '#ffc23a', '試煉塔',
    [[`最高第 ${save.tower.best} 層・下一層更強 9%`, '#ffd98a'], [`第 ${nf} 層獎勵：${rwLine(towerRw(nf))}`], [`第 ${Math.ceil(nf / 10) * 10} 層大獎：${rwLine({ gear: Math.min(4, Math.ceil(nf / 10)) })}`]],
    'tower', `挑戰第 ${nf} 層`);
  const bk = wkBoss(), B = BOSSES[bk], md = wkModDef(), W8 = save.weekly, left = wkLeft();
  const days = 7 - ((Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5) + 3) % 7);
  trialCard(392, 270, B.spr, B.ch, '#ff6a4a', '每週首領',
    [[`${B.name}・規則「${md.name}」`, '#ffb38a'], [md.d], [`本週最高 ${fmtN(W8.best)}・${days} 天後換首領`]],
    left > 0 ? 'weekly' : W8.adUsed ? 'noop' : 'wad', left > 0 ? `挑戰(今日剩 ${left} 次)` : W8.adUsed ? '明天再來' : '看廣告 +1 次', { bg: left > 0 ? '#c0392b' : '#2f6a4a', disabled: left <= 0 && W8.adUsed });
  tierBar(190, 392 + 166, W - 270, W8.best, wkD(), W8.got);
  trialCard(678, 196, 'ico_trial_endless', '無', '#9fe8ff', '無盡試煉', [[`最高 ${save.endless.best} 波`, '#bff4ff'], ['撐得越久，獎勵越多']], 'endless', '開始');
  btn(W / 2 - 110, H - 72, 220, 56, '返回', 'map', { bg: '#4a3b2a', size: 22 });
}

function endlessStages() { return Math.min(STAGES.length, Math.max(10, save.cleared)); }
function startEndless() {
  S.wantHard = false; S.wantSub = SUBN - 1; newRun(0); S.endless = true; S.wave = 1; S.nextBoss = ENDLESS_GAP; S.tut = 0;
  bannerObj = null; banner('無盡試煉　開始！', 1.6);
  if (!save.guide.endless) { S.guide = 'endless'; }
}
function endlessNext() {
  S.wave++; S.nextBoss = S.t + ENDLESS_GAP;
  S.stage = ((S.wave - 1) * 2) % endlessStages();   // 換場景與敵人種類
  banner(`突破第 ${S.wave - 1} 波！`, 1.8); sfx('win');
}
function startOv(i, fn) {   // 試煉用：素材好了才開局
  if (chunkReady(STAGES[i].ch)) { fn(); return; }
  S.mode = 'loading'; S.waitStage = i; S.waitT = 0; S.waitFn = fn;
}
function startStage(i) {   // 素材還沒下載完就先顯示載入畫面
  S.waitFn = null;
  if (chunkReady(STAGES[i].ch)) { newRun(i); return; }
  S.mode = 'loading'; S.waitStage = i; S.waitT = 0;
}
function drawLoading() {
  drawBg(); dim(0.7);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8'; ctx.font = `900 28px ${FONT}`; ctx.fillText(`載入${CHAPTERS[STAGES[S.waitStage].ch].split('　')[0]}素材中…`, W / 2, H / 2 - 20);
  ctx.strokeStyle = '#f5d27a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(W / 2, H / 2 + 50, 22, AT * 5, AT * 5 + 4.5); ctx.stroke();
}
function doRevive() {
  S.revived = true; S.mode = 'play'; S.paused = false;
  S.units = Math.max(5, Math.round((S.peak || 5) * 0.3));
  S.enemies = S.enemies.filter(e => e.y < HERO_Y - 320); S.eshots = [];
  if (S.boss && S.boss.state !== 'enter' && S.boss.state !== 'fight') { S.boss.state = 'return'; }
  S.inv = 2.5; ring(S.hx, HERO_Y, '#ffe9a8', 20, 240, 0.8); burst(S.hx, HERO_Y, '#ffd36b', 30, 300);
  banner('浴火重生！', 1.4); sfx('up');
}
function drawRevive() {
  dim(0.7);
  title('分身全滅', 270, 52);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.font = `bold 21px ${FONT}`; ctx.fillText(`復活後恢復 ${Math.max(5, Math.round((S.peak || 5) * 0.3))} 個分身，繼續戰鬥`, W / 2, 340);
  { const pz = 1 + Math.max(0, (S.reviveT % 1) - 0.75) * 1.2; ctx.save(); ctx.translate(W / 2, 400); ctx.scale(pz, pz); numText(String(Math.ceil(S.reviveT)), 0, 0, 64, 'gold'); ctx.restore(); }
  btn(W / 2 - 150, 450, 300, 70, '看廣告免費復活', 'rev_ad', { bg: '#2f6a4a', size: 24 });
  btn(W / 2 - 150, 536, 300, 62, `元寶 ${REVIVE_GEMS} 立即復活`, 'rev_gem', { bg: '#5a2f7a', size: 21, disabled: save.gems < REVIVE_GEMS });
  btn(W / 2 - 110, 618, 220, 52, '放棄', 'rev_no', { bg: '#4a3b2a', size: 20 });
}
function drawShop() {
  drawBg(); dim(0.78);
  title('商城', 70, 50); moneyTag(122);
  const tab = S.shopTab || 'gems';
  [['gems', '元寶'], ['packs', '禮包'], ['xt', '玄鐵'], ['month', '月卡']].forEach(([k, lb], i) => {
    btn(30 + i * 122, 148, 114, 50, lb, 'stab:' + k, { bg: tab === k ? '#c0392b' : '#3a2e22', border: tab === k ? '#ffd700' : '#776', size: 20 });
    if (k === 'month' && monthReady()) redDot(30 + i * 122 + 108, 152);
    if (k === 'packs' && offerLeft() > 0) redDot(30 + i * 122 + 108, 152);
  });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (tab === 'gems') {
    GEM_TIERS.forEach((t, i) => {
      const w = 152, h = 228, x = 30 + (i % 3) * 164, y = 218 + Math.floor(i / 3) * 244, first = !save.shop.first[t.id];
      plate(x, y, w, h, 14); ctx.lineWidth = 2; ctx.strokeStyle = '#7fe0ff'; ctx.stroke();
      const g = ctx.createRadialGradient(x + w / 2, y + 66, 4, x + w / 2, y + 66, 52); g.addColorStop(0, 'rgba(127,224,255,.55)'); g.addColorStop(1, 'rgba(127,224,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y + 10, w, 110);
      if (!drawIcon('ico_gem', x + w / 2, y + 66, 62 + i * 9)) { ctx.fillStyle = '#7fe0ff'; ctx.font = `900 ${34 + i * 3}px ${FONT}`; ctx.fillText('寶', x + w / 2, y + 66); }
      ctx.fillStyle = '#fff'; ctx.font = `900 24px ${FONT}`; ctx.fillText((first ? t.g * 2 : t.g + (t.b || 0)).toLocaleString(), x + w / 2, y + 128);
      ctx.font = `13px ${FONT}`; ctx.fillStyle = first ? '#ffc23a' : '#9cd';
      ctx.fillText(first ? `首儲雙倍(原 ${t.g})` : t.b ? `含贈送 ${t.b}` : '　', x + w / 2, y + 154);
      if (first) { ctx.fillStyle = '#c0392b'; roundRect(x + w - 60, y - 8, 66, 26, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `bold 14px ${FONT}`; ctx.fillText('雙倍', x + w - 27, y + 5); }
      btn(x + 14, y + 172, w - 28, 44, `NT$ ${t.p}`, 'bg:' + t.id, { bg: '#2f6a8a', size: 19 });
    });
    ctx.fillStyle = '#999'; ctx.font = `14px ${FONT}`; ctx.fillText('每個方案第一次購買元寶雙倍', W / 2, 706);
    plate(24, 722, W - 48, 70, 12); ctx.textAlign = 'left'; ctx.fillStyle = '#ffd98a'; ctx.font = `bold 17px ${FONT}`; ctx.fillText('元寶換銅錢', 40, 746); ctx.fillStyle = '#ccc'; ctx.font = `13px ${FONT}`; ctx.fillText(`1 元寶 = ${CU_RATE} 銅錢`, 40, 772); ctx.textAlign = 'center';
    btn(200, 732, 148, 50, '', 'cu:100', { bg: '#7a5a1a', size: 15, disabled: save.gems < 100 }); drawIcon('ico_gem', 222, 757, 22); numText('100', 236, 757, 16, 'cyan', 'left'); ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('→', 284, 757); numText((100 * CU_RATE / 1000) + 'K', 296, 757, 16, 'gold', 'left');
    btn(358, 732, 148, 50, '', 'cu:1000', { bg: '#7a5a1a', size: 15, disabled: save.gems < 1000 }); drawIcon('ico_gem', 378, 757, 22); numText('1000', 392, 757, 16, 'cyan', 'left'); ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('→', 446, 757); numText((1000 * CU_RATE / 1000) + 'K', 456, 757, 16, 'gold', 'left');
  } else if (tab === 'packs') {
    let y = 218;
    const row = (id, extra) => {
      const P = PACKS[id];
      plate(24, y, W - 48, 150, 14); ctx.lineWidth = 2; ctx.strokeStyle = id === 'stuck' ? '#ff7b6b' : '#ffc23a'; ctx.stroke();
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 24px ${FONT}`; ctx.fillText(P.name, 44, y + 30);
      ctx.fillStyle = id === 'stuck' ? '#ff9a8a' : '#ffc23a'; ctx.font = `bold 15px ${FONT}`; ctx.fillText(extra || P.tag, 44 + ctx.measureText(P.name).width * 0 + 170, y + 31);
      ctx.fillStyle = '#ddd'; ctx.font = `17px ${FONT}`; P.items.forEach((it, k) => ctx.fillText('・' + it, 44, y + 64 + k * 26));
      ctx.textAlign = 'center';
      btn(W - 190, y + 54, 150, 56, `NT$ ${P.p}`, 'bp:' + id, { bg: '#c0392b', size: 21 });
      y += 164;
    };
    if (offerLeft() > 0) { const m = Math.ceil(offerLeft() / 60000); row('stuck', `剩 ${m} 分鐘`); save.shop.packs.stuckSeen = true; }
    if (!save.shop.packs.first) row('first');
    if (!save.shop.packs.grow) row('grow');
    if (!save.owned.demon && y < 620) row('demon');
    plate(24, y, W - 48, 96, 14); ctx.lineWidth = 2; ctx.strokeStyle = '#5fd35f'; ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`看廣告領元寶 ${AD_GEMS}`, 44, y + 34);
    ctx.fillStyle = '#aaa'; ctx.font = `15px ${FONT}`; ctx.fillText(`今日還剩 ${adLeft()} 次`, 44, y + 64);
    ctx.textAlign = 'center';
    btn(W - 190, y + 22, 150, 52, '看廣告', 'adgem', { bg: '#2f6a4a', size: 20, disabled: adLeft() <= 0 });
  } else if (tab === 'xt') {
    ctx.fillStyle = '#cfe3ff'; ctx.font = `bold 16px ${FONT}`; ctx.fillText(`玄鐵用來突破裝備等級上限・目前擁有 ${save.xt}`, W / 2, 226);
    XT_PACKS.forEach((P, i) => {
      const y = 246 + i * 150, got = xtBought(P.id);
      plate(24, y, W - 48, 136, 14, got ? 'dim' : ''); ctx.lineWidth = 2; ctx.strokeStyle = '#7fb8ff'; ctx.stroke();
      const gl = ctx.createRadialGradient(92, y + 68, 4, 92, y + 68, 56); gl.addColorStop(0, 'rgba(127,184,255,.5)'); gl.addColorStop(1, 'rgba(127,184,255,0)'); ctx.fillStyle = gl; ctx.fillRect(36, y + 8, 112, 120);
      xtIcon(92, y + 68, 64 + i * 10);
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 23px ${FONT}`; ctx.fillText(P.name, 162, y + 34);
      ctx.fillStyle = '#cfe3ff'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`玄鐵 ${P.xt.toLocaleString()}` + (P.g ? `・元寶 ${P.g}` : ''), 162, y + 62); if (P.c) { ctx.fillStyle = '#ffd98a'; ctx.font = `bold 15px ${FONT}`; ctx.fillText(`＋銅錢 ${P.c.toLocaleString()}`, 162, y + 84); }
      ctx.fillStyle = '#aaa'; ctx.font = `14px ${FONT}`; ctx.fillText(got ? '本週已購買，下週一再來' : '每週限購一次', 162, y + 110);
      ctx.textAlign = 'center';
      btn(W - 176, y + 42, 136, 52, got ? '已購買' : `NT$ ${P.p}`, 'bx:' + P.id, { bg: got ? '#555' : '#2f5a8a', size: 20, disabled: got });
    });
    ctx.fillStyle = '#999'; ctx.font = `14px ${FONT}`; ctx.fillText('免費也能拿：重複的裝備會變成玄鐵，月卡每天也送玄鐵', W / 2, 712);
  } else {
    plate(30, 218, W - 60, 470, 18);
    ctx.fillStyle = '#ffc23a'; ctx.font = `900 34px ${FONT}`; ctx.fillText('俠客月卡', W / 2, 262);
    ctx.fillStyle = '#fff'; ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`購買立即獲得 元寶 ${MONTH.now}`, W / 2, 316);
    ctx.fillText(`之後 ${MONTH.days} 天，每天可領 元寶 ${MONTH.daily}＋玄鐵 ${MONTH.xt}`, W / 2, 352);
    ctx.fillStyle = '#7fe0ff'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`總共 ${MONTH.now + MONTH.daily * MONTH.days} 元寶，最划算的方案`, W / 2, 392);
    if (monthActive()) {
      ctx.fillStyle = '#5fd35f'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`月卡生效中，剩餘 ${monthLeft()} 天`, W / 2, 450);
      btn(W / 2 - 140, 486, 280, 64, monthReady() ? `領取今日獎勵` : '今日已領取', 'mclaim', { bg: monthReady() ? '#c0392b' : '#555', size: 21, disabled: !monthReady() });
      btn(W / 2 - 140, 570, 280, 56, `續購 NT$ ${MONTH.p}(+${MONTH.days} 天)`, 'mbuy', { bg: '#2f6a8a', size: 19 });
    } else {
      ctx.fillStyle = '#aaa'; ctx.font = `17px ${FONT}`; ctx.fillText('記得每天上線領取，錯過的天數不會補發', W / 2, 450);
      btn(W / 2 - 140, 500, 280, 70, `NT$ ${MONTH.p} 購買`, 'mbuy', { bg: '#c0392b', size: 24 });
    }
  }
  ctx.fillStyle = '#777'; ctx.font = `13px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('測試版：所有購買都是模擬，不會真的扣款', W / 2, 800);
  btn(W / 2 - 140, 828, 280, 58, '返回', 'back', { bg: '#4a3b2a', size: 24 });
}
function drawPass() {
  drawBg(); dim(0.8); const P = passCheck(), L = passLv();
  title('俠客令', 66, 48);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`;
  ctx.fillText(`第 ${P.season + 1} 季・剩餘 ${seasonLeft()} 天`, W / 2, 108);
  plate(24, 126, W - 48, 70, 14);
  ctx.fillStyle = '#ffe9a8'; ctx.font = `900 30px ${FONT}`; ctx.fillText('Lv ' + L, 84, 161);
  const cur = L >= PASS.max ? PASS.per : P.xp - L * PASS.per;
  pbar(140, 150, 270, 16, cur / PASS.per, '#ffc23a');
  ctx.fillStyle = '#ccc'; ctx.font = `13px ${FONT}`; ctx.fillText(L >= PASS.max ? '已滿級' : `${cur} / ${PASS.per}`, 275, 180);
  ctx.fillStyle = '#9a8'; ctx.font = `12px ${FONT}`; ctx.fillText('打關卡、每日任務、登入都能得到經驗', 275, 138);
  if (!P.premium) btn(424, 136, 94, 50, '解鎖進階', 'passbuy', { bg: '#c0392b', size: 16 });
  else { ctx.fillStyle = '#ffc23a'; ctx.font = `bold 16px ${FONT}`; ctx.fillText('進階已解鎖', 470, 161); }
  // 欄位標題
  ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#ccc'; ctx.fillText('等級', 62, 216); ctx.fillText('免費獎勵', 196, 216); ctx.fillStyle = '#ffc23a'; ctx.fillText('進階獎勵', 392, 216);
  const page = S.passPage === undefined ? Math.min(4, Math.floor(Math.max(0, L - 1) / 6)) : S.passPage;
  for (let k = 0; k < 6; k++) {
    const lv = page * 6 + k + 1, y = 232 + k * 88, got = lv <= L;
    plate(24, y, W - 48, 80, 12, got ? 'dim' : '');
    ctx.fillStyle = got ? '#ffe9a8' : '#776'; ctx.font = `900 24px ${FONT}`; ctx.fillText(String(lv), 62, y + 40);
    [[PASS_FREE(lv), P.free[lv], 108, 'pf:' + lv, true], [PASS_PREM(lv), P.prem[lv], 304, 'pp:' + lv, P.premium]].forEach(([rw, claimed, x, act, open]) => {
      ctx.fillStyle = rw.gear ? RCOL[grar(rw.gear)] : rw.g ? '#7fe0ff' : '#ffd700'; ctx.font = `bold ${rw.gear ? 15 : 17}px ${FONT}`; ctx.textAlign = 'left';
      ctx.fillText(passRwText(rw), x + 8, y + 40); ctx.textAlign = 'center';
      if (claimed) { ctx.fillStyle = '#5fd35f'; ctx.font = `900 26px ${FONT}`; ctx.fillText('✓', x + 172, y + 40); }
      else if (!open) { ctx.fillStyle = '#887'; ctx.font = `bold 15px ${FONT}`; ctx.fillText('鎖', x + 172, y + 40); }
      else if (got) btn(x + 142, y + 20, 58, 40, '領', act, { bg: '#c0392b', size: 18 });
    });
  }
  btn(24, 762, 90, 46, '◀', 'ppage:-1', { bg: '#4a3b2a', size: 20, disabled: page <= 0 });
  ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`; ctx.fillText(`${page * 6 + 1}～${page * 6 + 6} 級`, 166, 785);
  btn(218, 762, 90, 46, '▶', 'ppage:1', { bg: '#4a3b2a', size: 20, disabled: page >= 4 });
  const n = passClaimable();
  btn(322, 762, 194, 46, n ? `一鍵領取(${n})` : '沒有可領的獎勵', 'passall', { bg: n ? '#c0392b' : '#555', size: 17, disabled: !n });
  btn(W / 2 - 140, 830, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
function drawAchv() {
  drawBg(); dim(0.8);
  title('成就', 66, 48);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`;
  const done = ACHV.reduce((n, a) => n + achvTier(a), 0), all = ACHV.reduce((n, a) => n + a.goals.length, 0);
  ctx.fillText(`完成 ${done} / ${all}　目前稱號：${ttlText() || '無'}`, W / 2, 108);
  const page = S.achvPage || 0, per = 6;
  ACHV.slice(page * per, page * per + per).forEach((a, k) => {
    const y = 128 + k * 104, t = achvTier(a), maxed = t >= a.goals.length, goal = a.goals[Math.min(t, a.goals.length - 1)], v = a.v(), ready = achvReady(a);
    plate(24, y, W - 48, 94, 12, ready ? 'gold' : '');
    ctx.lineWidth = 2; ctx.strokeStyle = maxed ? '#ffc23a' : ready ? '#ffd700' : '#5a4a3a'; ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = maxed ? '#ffc23a' : '#ffe9a8'; ctx.font = `900 21px ${FONT}`; ctx.fillText(a.name, 42, y + 24);
    for (let i = 0; i < a.goals.length; i++) drawStar(200 + i * 22, y + 24, 19, i < t);
    ctx.fillStyle = '#ddd'; ctx.font = `15px ${FONT}`; ctx.fillText(maxed ? `已全部完成・獲得稱號「${a.ttl}」` : a.d(goal), 42, y + 52);
    if (!maxed) {
      pbar(42, y + 70, 250, 9, v / goal, ready ? '#5fd35f' : '#f5d27a');
      ctx.fillStyle = '#aaa'; ctx.font = `12px ${FONT}`; ctx.fillText(`${Math.min(v, goal).toLocaleString()} / ${goal.toLocaleString()}`, 300, y + 75);
    }
    ctx.textAlign = 'center';
    if (maxed) btn(W - 156, y + 24, 112, 46, save.ttl === a.id ? '使用中' : '使用稱號', 'ttl:' + a.id, { bg: save.ttl === a.id ? '#555' : '#7a5a1a', size: 16, disabled: save.ttl === a.id });
    else btn(W - 156, y + 24, 112, 46, ready ? `領 元寶${a.rw[t]}` : `元寶 ${a.rw[t]}`, 'ach:' + a.id, { bg: ready ? '#c0392b' : '#3a2e22', size: 15, disabled: !ready });
  });
  const pages = Math.ceil(ACHV.length / per);
  btn(24, 762, 110, 46, '◀', 'apage:-1', { bg: '#4a3b2a', size: 20, disabled: page <= 0 });
  ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(`${page + 1} / ${pages}`, W / 2, 785);
  btn(W - 134, 762, 110, 46, '▶', 'apage:1', { bg: '#4a3b2a', size: 20, disabled: page >= pages - 1 });
  btn(W / 2 - 140, 830, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
function achvBtn(x, y) {   // 主畫面左上角的獎盃按鈕
  ui.push({ x, y, w: 52, h: 48, act: 'achv' });
  if (!drawIcon('ui_round', x + 26, y + 24, 56)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, 52, 48, 12); ctx.fill(); }
  ctx.fillStyle = '#ffc23a';
  ctx.beginPath(); ctx.moveTo(x + 15, y + 10); ctx.lineTo(x + 37, y + 10); ctx.lineTo(x + 35, y + 24); ctx.quadraticCurveTo(x + 26, y + 32, x + 17, y + 24); ctx.closePath(); ctx.fill();
  ctx.fillRect(x + 24, y + 28, 4, 7); ctx.fillRect(x + 18, y + 35, 16, 4);
  ctx.strokeStyle = '#ffc23a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 15, y + 16, 5, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 37, y + 16, 5, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  if (achvHasClaim()) redDot(x + 46, y + 6);
}
function drawEndlessResult() {
  dim(0.75); const r = S.result;
  title(r.newBest ? '新紀錄！' : '試煉結束', 210, 58);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.font = `900 36px ${FONT}`; ctx.fillText(`突破 ${r.wave} 波`, W / 2, 292);
  ctx.fillStyle = '#ffc23a'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`最高紀錄：${r.best} 波`, W / 2, 336);
  ctx.font = `bold 23px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('擊敗敵人　' + r.kills, W / 2, 396);
  ctx.fillStyle = '#ffd700'; ctx.fillText('獲得銅錢　' + r.coins + (r.frag ? `　碎片 +${r.frag}` : ''), W / 2, 434);
  ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = r.lvUp ? '#ffc23a' : '#c9a86a'; ctx.fillText(`俠客令經驗 +${r.pxp}` + (r.lvUp ? `　升到 Lv ${passLv()}！` : ''), W / 2, 470);
  let y = 500;
  if (r.coins > 0 && !r.doubled) { btn(90, y, W - 180, 44, `看廣告 銅錢加倍(+${r.coins})`, 'addouble', { bg: '#2f6a4a', size: 18 }); y += 58; }
  btn(W / 2 - 140, y + 10, 280, 70, '再次挑戰', 'endless'); y += 96;
  btn(W / 2 - 140, y, 280, 56, '回到江湖試煉', 'trials', { bg: '#4a3b2a', size: 22 });
}
// ---------- 新手引導(第一次進入各畫面時說明) ----------
const GUIDES = {
  hard:    ['困難模式', '敵人和首領強很多，但獎勵也更好：\n首次通關元寶更多、首通必掉裝備(重打 60%)、碎片加倍。\n每章普通通關後開放，要依序挑戰。'],
  mail:    ['信箱', '系統獎勵、維修補償、活動禮物都會寄到這裡。\n信件有期限，記得在期限內領取！'],
  pawn:    ['聚寶當鋪', '用銅錢買下來路不明的舊物，打開可能是好裝備，也可能是一堆破銅爛鐵。\n買之前可以先「掂量」，但寶氣僅供參考，不一定準；買下後才能「掀角」。\n掌櫃的話聽聽就好，別全信。只能用銅錢、機率完全公開；首領也會掉舊物。'],
  event:   ['每日活動', '每天會有不同的加成活動，\n週末銅錢加倍、平日掉寶或碎片加倍。\n挑對日子刷關卡，收穫更多！'],
  map:     ['選擇關卡', '點關卡開始挑戰，通關會解鎖下一關。\n通關時剩下越多分身，拿到的星星越多。'],
  upgrade: ['修練', '花銅錢永久提升能力，所有職業都有效。\n打不過的關卡，回來修練後再挑戰！'],
  bag:     ['行囊', '【裝備】花銅錢強化，每 10 級用玄鐵突破(重複的裝備會變成玄鐵)。\n【靈寵】在召喚閣召喚，出戰會跟著你打，\n同品級 4 隻可以合成更高品級。'],
  gacha:   ['召喚閣', '用召喚券或元寶抽取靈寵與裝備，機率完全公開。\n召喚券每天登入、做任務、通關都會送！\n重複的靈寵可以合成，重複的裝備會變成玄鐵。'],
  daily:   ['每日', '每天登入領獎勵，完成三個每日任務還有寶箱。\n每天午夜更新。'],
  shop:    ['商城', '購買元寶、禮包和月卡。\n每個元寶方案第一次購買都是雙倍。'],
  pass:    ['俠客令', '打關卡、做每日任務累積經驗，升級領獎勵。\n解鎖進階可以多領一排，晚買也能補領。'],
  achv:    ['成就', '完成成就領元寶，\n三階全部完成還能獲得稱號。'],
  synth:   ['靈寵合成', '同品級 4 隻 → 高一品級的靈寵。\n失敗會退回 1 隻同品級靈寵，並累積福緣；\n福緣滿 100，下次合成必定成功。'],
  idle:    ['掛機收益', '離線時也會累積銅錢和碎片，最多 12 小時。\n通關越多，每小時的收益越高。\n記得每天回來領取！'],
  tower:   ['試煉塔', '一層一層往上爬，每層都比上一層更強。\n每層第一次通過就有獎勵，第 5、10 層還有大獎！'],
  weekly:  ['每週首領', '每週換一隻首領和一條特殊規則。\n60 秒內打出越多傷害，領到的獎勵越多，每天 3 次。'],
  endless: ['無盡試煉', '敵人會越來越強，每隔一段時間出現首領。\n撐得越久獎勵越多，挑戰你的最高紀錄！'],
};
function drawGuide() {
  if (!S.guide || !GUIDES[S.guide]) return;
  const [t, body] = GUIDES[S.guide];
  ui = [];
  // 防呆：超過板寬自動換行(手動 \n 仍保留)，避免說明文字超出外框
  ctx.font = `18px ${FONT}`;
  const lines = body.split('\n').flatMap(l => wrapLines(l, W - 128));
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
  const h = 150 + lines.length * 30, y = H / 2 - h / 2;
  ctx.fillStyle = '#2a1d14'; roundRect(40, y, W - 80, h, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#f5d27a'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 28px ${FONT}`; ctx.fillText(t, W / 2, y + 40);
  ctx.fillStyle = '#eee'; ctx.font = `18px ${FONT}`; lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 84 + i * 30));
  btn(W / 2 - 90, y + h - 66, 180, 50, '知道了', 'gok', { size: 21 });
}
function gearBtn(x, y) {
  ui.push({ x, y, w: 52, h: 48, act: 'settings' });
  if (!drawIcon('ui_round', x + 26, y + 24, 56)) { ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(x, y, 52, 48, 12); ctx.fill(); }
  ctx.save(); ctx.translate(x + 26, y + 24); ctx.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-3, -15, 6, 7); }
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 6.283); ctx.fill();
  ctx.restore();
}
function drawSkins() {
  drawBg(); dim(0.8);
  const base = clsById(save.cls), list = [{ id: '', name: '預設外觀', spr: base.spr, bbx: base.bbx, desc: base.desc }].concat(SKINS.filter(k => k.cls === base.id));
  title('時裝', 70, 50); moneyTag(122);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`;
  ctx.fillText(`${base.name}的時裝・只改變外觀與攻擊顏色，不影響強度`, W / 2, 156);
  list.forEach((k, i) => {
    const y = 180 + i * 200, eq = (save.skins.eq[base.id] || '') === k.id, own = !k.id || save.skins.own[k.id];
    plate(24, y, W - 48, 186, 16); ctx.lineWidth = eq ? 4 : 2; ctx.strokeStyle = eq ? '#ffd700' : k.id ? '#c46bff' : '#776'; ctx.stroke();
    const fa = spr(k.spr + '_f'), a = fa || spr(k.spr);
    if (a) drawSpr(a, 110, y + 18, 150, fa ? (k.id ? k.fbx || 0.5 : base.fbx || 0.5) : k.bbx || 0.5);   // 有正面圖就用正面
    else { ctx.fillStyle = 'rgba(255,255,255,.08)'; roundRect(50, y + 20, 120, 146, 12); ctx.fill(); ctx.fillStyle = '#887'; ctx.font = `46px ${TFONT}`; ctx.textAlign = 'center'; ctx.fillText('？', 110, y + 94); }
    ctx.textAlign = 'left'; ctx.fillStyle = k.id ? '#e8b4ff' : '#ffe9a8'; ctx.font = `900 26px ${FONT}`; ctx.fillText(k.name, 210, y + 40);
    ctx.fillStyle = '#ddd'; ctx.font = `15px ${FONT}`; ctx.fillText(k.desc, 210, y + 76);
    ctx.textAlign = 'center';
    if (eq) btn(300, y + 112, 180, 52, '使用中', 'noop', { bg: '#555', size: 20, disabled: true });
    else if (own) btn(300, y + 112, 180, 52, '換上', 'skin:' + k.id, { bg: '#2f6a4a', size: 20 });
    else if (!skinReady(k)) { ctx.fillStyle = '#999'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('美術準備中', 390, y + 138); }
    else btn(300, y + 112, 180, 52, `元寶 ${k.price}`, 'skinbuy:' + k.id, { bg: '#7a2f8a', size: 20, disabled: save.gems < k.price });
  });
  if (list.length === 1) { ctx.fillStyle = '#999'; ctx.font = `17px ${FONT}`; ctx.fillText('這個職業的時裝敬請期待', W / 2, 440); }
  btn(W / 2 - 140, 830, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
const PATCH = [
  ['1012-K', '全遊戲文案用語調整：鍍金假貨、劈開見真章、試試眼力等新說法'],
  ['1012-J', '買價固定不變(取消三娘改價)；寶氣改為僅供參考(95% 隨機、5% 真實，機率公開)；買下後跳出手上寶箱專屬畫面；手上有貨時禁止掂量；「開山輪・劈開！」改名「確認劈開」；掀過有光賣回上限調回原價 1.5 倍'],
  ['1012-I', '「掀一角」改名「掀角」(按鈕、提示、機率公開、導覽、法務頁)'],
  ['1012-H', '當鋪改兩段式玩法：掂量限架上且三娘驗貨改價；掀一角改為買下後；賣回規則調整(掀過沒光 40%、有光最高現價 1.2 倍)；防挑星套利，各玩法回收率 87%~93%'],
  ['1012-G', '「掂重」全面改名「掂量」(按鈕、機率公開、說明文案)'],
  ['1012-F', '依實玩錄影修正：前三關的紅門不再扣分身(只扣內力，新手保護)；首領戰分身剩 3 隻以下時，打倒首領召喚的小怪有一半機率補 1 個分身(上限 10)，不會再卡在「打不動首領又死不了」的死局'],
  ['1012-E', '關卡改單場制：每一關就是一場完整戰鬥(打贏首領即過關)，取消關內 10 小關；地圖點關直接開打；補償包：普通重打掉落 30→45%、困難 40→60%、通關銅錢加成 35→60、每關首通元寶+27/碎片+9/70%加碼掉落(經濟模擬 S23：無課 548 天、重課 235 天，兩條壽命目標皆守住)'],
  ['1012-D', '按鈕清晰度修復：買下等寬按鈕改回裝置解析度高品質縮放；黛青／墨綠／紫檀底圖從原版重新上色並以高品質壓縮(消除色帶)；主畫布全域啟用高品質縮放'],
  ['1012-C', '當鋪未選中時，掂量／掀一角／買下只顯示灰色標籤，不再顯示 -- 佔位(和聽她說一致，也沒有怪空隙)'],
  ['1012-B', '穩定性三件組：存檔雙保險(主檔損毀自動用備份，進度不再歸零)；章節總表 CHAP(接新章素材只改一張表)；戰鬥拖曳鎖定單指，第二根手指不再搶搖桿'],
  ['1012-A', '開山輪劈開動畫重做：鋸片轉起來後沿機架下降、咬進舊物，火花和碎屑從接觸點噴出，劈開瞬間回彈，不再在上方空轉'],
  ['1009-ZZ', '修復：對話列的「三娘」名牌被舞台裁切線切到上半(看起來像一娘)，對話列移到裁切區外繪製'],
  ['1009-ZY', '全遊戲視覺統一：藍綠紫按鈕底圖重上色為黛青、墨綠、紫檀(商城、召喚閣、試煉等全部生效)；全專案括號統一為半形；素材載入失敗自動重試 2 次'],
  ['1009-ZX', '當鋪對話改成古風木牌對話列(和資訊欄同底板、掛「三娘」名牌、右下短角指向她)，不再用現代感的奶油色泡泡和長尾巴'],
  ['1009-ZW', '泡泡尾巴精準指到錢三娘嘴角旁；賣回改墨綠、免費換一批改古銅金，亮紅只留給「開山輪・劈開」主按鈕；手上標籤位置微調'],
  ['1009-ZV', '對話泡泡尾巴改指到錢三娘嘴角側邊，定位參數抽成常數便於微調；試玩頁測試面板改預設收合，不再蓋住對話'],
  ['1009-ZU', '當鋪：對話泡泡移到錢三娘頭頂、短尾巴指著她的臉；手上的舊物改放進下方資訊欄小格(不再佔舞台)；掉落格提示併進標題、不再壓在格子上；買下等寬按鈕的高光不再被拉成長條；每件舊物帶固定微角度、同款鏡像，架上不再有兩件一模一樣'],
  ['1009-ZT', '當鋪精修：未選舊物時掂量／掀一角／買下顯示 -- 不再顯示 0 銅錢；機率公開改黛青、免費換一批改硃砂紅等古風配色；首領掉落改 10 格凹槽(空格也有框)；對話泡泡尾巴指向錢三娘臉部；同款舊物第二件自動鏡像微轉；測試工具統一 DEBUG_MODE 開關'],
  ['1009-ZS', '當鋪稽核修復：背景用原圖重切(清晰度翻倍)；剛開遊戲就進當鋪改顯示「開門中」，不再閃暫代版面；錢三娘加落地陰影、不再浮動，開心姿勢不超出畫面；點空白處取消選取；改視窗大小時重建圖片快取'],
  ['1009-ZR', '字體總修正：標題字型換成思源宋體黑(全字庫)，鏢、她、掂、垮、鏽、鑲等 59 個缺字不再混出第二種字體，全遊戲標題、按鈕、物品名、對話框同一套字；字型檔還變小一半'],
  ['1009-ZQ', '當鋪：五件舊物改成骰子五點排列(四角＋中央、放大到 80 像素、加展示座)，錢三娘再放大三分之一，手上的舊物移到右上角'],
  ['1009-ZP', '各章路寬統一：第七章石橋重製(路面佔畫面約 75%)，第1、3、4、5、6章背景放大裁邊，敵人與分身活動範圍對齊路面，不再走到路肩外；當鋪整體放大 13%(舊物、木架跟著變大)、錢三娘完整顯示不再被畫面切掉、對話泡泡接到她頭上；聽她說／掂量／掀一角三顆按鈕字體統一'],
  ['1009-ZO', '全畫面健檢(30 多個畫面無程式錯誤)；傷害數字改為同時最多 18 個、合併間隔拉長，暴擊一定顯示，數字不再疊成一面牆'],
  ['1009-ZN', '當鋪：整個畫面換成當鋪背景、舊物放大、錢三娘移到右邊不擋第 5 格；書法字型補上新字(聚寶當鋪、淬鍊等不再混到別的字體)；第七章背景改回正向(不再上下顛倒)，石板路加寬約 2 倍、上下無縫接'],
  ['1009-ZM', '當鋪舊物放進木架格子裡(不再浮著，加落地陰影，選中改成沿外形描金光)；介面畫面一律用最高解析度，字不再糊；戰鬥卡頓時先降特效再降解析度，順了會自動升回；飄字加粗深色描邊；劍氣同時最多畫 40 道、略透明；第七章石橋放大 1.5 倍、修掉背景接縫'],
  ['1009-ZL', '接上美術：第七章大首領「東海蛟王」本體與出招動作、海寇頭領出招動作、頭冠(良品)圖示；線上試玩頁更新到最新版'],
  ['1009-ZK', '接上美術：聚寶當鋪全套(背景、錢三娘、舊物、開山輪、特效)、6 件神話裝備、古物秘技圖示、玄鐵圖示、第七章背景與小怪、海寇頭領'],
  ['1009-ZJ', '新增「神兵淬鍊」：裝備練滿 Lv100 後，可用玄鐵淬鍊 1～20 階，每階該部位 +3%'],
  ['1009-ZI', '依實測校正：首領小關加長(路程 44 秒)、強度 ×1.5，讓第 10 小關和原本整關一樣難；困難敵人血量倍率重新校正(實測後期約為普通的 2 倍難度)'],
  ['1009-ZH', '新增神話品級(主線全通後開放)；新增聚寶當鋪「翻舊物」：用銅錢買舊物打開找裝備，傳說以上附古物秘技'],
  ['1009-ZG', '每關改為 10 個小關(第 10 小關是首領)；掉落、玄鐵、銅錢、強化費、困難難度、靈寵突破依經濟報告調整'],
  ['1009-ZF', '關卡地圖改回原本左右交錯往上的排列，首領關置中'],
  ['1009-ZE', '主線擴充為 12 章、每章 10 關(共 120 關)，新增第七～十二章：東海蓬萊、大漠孤煙、古墓幽谷、崑崙仙境、幽冥地府、華山論劍；新增 24 種敵人、12 位首領；商城新增元寶換銅錢'],
  ['1009-ZD', '靈寵等級上限開到 Lv100(花銅錢強化、每 10 級用同品級靈寵突破，技能傷害也會變強)；經濟重新平衡：玄鐵成為後期主要瓶頸、10 級後強化更便宜；商城新增玄鐵禮包，月卡每天多送玄鐵'],
  ['1009-ZC', '裝備等級上限開到 Lv100：每 10 級用玄鐵突破一次，重複的裝備會變成玄鐵；一鍵強化會自動突破已裝備的裝備'],
  ['1009-ZB2', '頭冠、玉佩、靴子共 14 件裝備換上正式美術圖；戰力徽章、靈寵召喚券、裝備召喚券換上正式圖示'],
  ['1009-ZB', '裝備擴充為 6 個部位(新增頭冠、玉佩、靴子)；召喚閣新增裝備召喚；召喚券大量發送(登入、任務、通關、試煉塔、每週首領)'],
  ['1009-ZA', '新增「戰力」數字(主畫面、修練、行囊)，變強時跳出戰力提升；修練與行囊新增一鍵強化'],
  ['1009-Z', '武學共鳴換上正式圖示；設定新增隱私權政策、使用條款、機率公告(上架必備)'],
  ['1009-Y', '武學共鳴：觸發時圖示特寫、技能列顯示已觸發的共鳴、選武學卡片顯示共鳴圖示(預留美術圖)'],
  ['1009-X', '後期大量刀氣不再卡頓、分身越多子彈越大越亮、掉幀時不再少出招、四種武學共鳴、防止調手機時間刷掛機收益'],
  ['1009-W', '主角台座、進度條、戰鬥上下資訊列、分身數框、橫幅、地圖路線石、紅點、圓形按鈕全部換上正式美術圖'],
  ['1009-V', '地圖關卡節點、清單面板換上正式美術圖；主角台座、進度條、橫幅、戰鬥介面等預留美術圖'],
  ['1009-U', '上架前品質總檢查：全遊戲面板統一成金框漆木風格、花費按鈕改銅錢圖示＋金色數字、地圖與戰鬥介面細節打磨；圖片背景預先解碼、畫質自動調整更快並記住手機設定'],
  ['1009-T', '15 隻靈寵戰鬥中改用背面圖(跟主角同方向往前衝)'],
  ['1009-S', '戰鬥中的靈寵活起來：繞著主角飄、轉身、呼吸、傾斜、出招撲擊、元素拖尾光點；預留戰鬥背面圖'],
  ['1009-R', '數字改用遊戲專用數字字體＋金色描邊樣式；書法字庫補齊新字(靈寵閣等按鈕字體統一)'],
  ['1009-Q', '星星改用向量繪製(切面＋光澤)，職業卡改成卡內一排小星，不再用數字'],
  ['1009-P', '星星、職業卡換上正式美術圖；靈寵閣每日免費抽一次；主畫面顯示出戰靈寵'],
  ['1009-O', '15 隻靈寵換上正式美術圖(良品改為小蛟龍、玉兔、小貔貅)；星星與職業卡預留美術圖'],
  ['1009-N', '裝備新增「持有效果」：拿過的每件裝備都永久加內力(不用裝備也有效)，裝備卡顯示等級進度'],
  ['1009-M', '行囊重做：裝備只看等級(重複自動升級、滿級換銅錢)；新增靈寵系統(靈寵閣抽取、4 合 1 合成＋福緣保底、圖鑑收藏加成、出戰靈寵跟著打)'],
  ['1009-L', '關卡挑戰令牌換上正式美術圖'],
  ['1009-K', '每關新增「關卡挑戰」(分身數、不碰紅門、擊殺數、連擊、速殺首領、打酒罈)，第一次完成送元寶；江湖試煉換上正式圖示'],
  ['1009-J', '新增江湖試煉：試煉塔(一層層往上爬，每 5／10 層大獎)、每週首領(每週換首領與特殊規則，比傷害領獎)'],
  ['1009-I', '整體數值平衡：修練與裝備強化費用、掛機收益、後三章難度曲線重新調整；武學進化特寫換上金光美術圖'],
  ['1009-H', '五種武學進化換上正式圖示、進化瞬間大特寫、選武學時提示可進化路線、暫停畫面看進化圖鑑'],
  ['1009-G', '小怪數量加倍更好砍、五種武學進化、結算顯示差多少就三星'],
  ['1009-F', '手機效能自動調整、打擊音效重做(命中、擊殺、重擊、分身冒出)、分身一個個冒出來'],
  ['1009-E', '新手引導：功能隨通關逐步開啟、第一次直接開打、前兩關更爽快'],
  ['1009-D', '職業武器圖示、專屬武學圖示、回春光環換成美術圖'],
  ['1009-C', '六職業各有一門專屬武學：萬劍歸宗、旋風斬、穿雲連珠、暴雨梨花針、回春妙手、天魔解體'],
  ['1009-B', '職業選擇改成武器圖示、門會標示你要走的那一邊、四到六章走道加寬、修正按鈕格線與醫仙臉上黑影'],
  ['1009-A', '武功門、按鈕、面板、首領血條、印章、火把、飄落粒子換成美術圖'],
  ['1008-Z', '刀光、子彈、火花、武學圖示與特效、首領招式全部換成美術圖'],
  ['1008-Y', '主角與分身放大、刀客出招動畫、醫仙與魔教傳人的出招特效修正'],
  ['1008-X', '主角與首領真正的出招姿勢(逐格動畫)'],
  ['1008-W', '主角與首領出招動畫、刀光與打擊火花、連斬音階、重擊震動'],
  ['1008-V', '武學三選一、小怪放大與走路動畫、倒地飛出特效、首領戰效能優化'],
  ['1008-U', '第五、六章怪物與首領美術、場景背景、信箱與活動圖示'],
  ['1008-T', '第五章南疆苗寨、第六章紫禁皇城、困難模式、信箱、每日活動'],
  ['1008-S', '第四章怪物與頭目美術、五套時裝上線、標題書法 Logo、第三章地圖修正'],
  ['1008-R', '第四章天山雪域、書法字體、五套新時裝(美術準備中)'],
  ['1008-Q', '掛機收益、背景音樂、可安裝到手機桌面'],
  ['1008-P', '打擊感強化：傷害數字、暴擊、連斬、金幣飛行、首領血條'],
  ['1008-O', '新增職業升星、時裝「白衣劍俠」、設定頁與改版公告'],
  ['1008-N', '新職業與第三章美術上線'],
  ['1008-M', '新職業：暗器師、醫仙、魔教傳人；第三章魔教總壇'],
  ['1008-K', '無盡試煉、裝備分解與合成、新手引導'],
  ['1008-J', '成就與稱號系統'],
  ['1008-I', '俠客令(戰令)'],
];
function showLegal(tab) {   // 隱私權政策／使用條款／機率公告：用網頁層顯示，可捲動、可複製
  const L = window.JH_LEGAL; if (!L) { toast('條款載入中，請稍後再試'); return; }
  let el = document.getElementById('jhlegal');
  if (!el) {
    el = document.createElement('div'); el.id = 'jhlegal';
    el.innerHTML = '<style>#jhlegal{position:fixed;inset:0;z-index:50;background:rgba(10,6,3,.92);display:flex;justify-content:center}#jhlegal .bx{width:100%;max-width:560px;display:flex;flex-direction:column}#jhlegal .tb{display:flex;gap:6px;padding:10px 12px;background:#2a1b0e;border-bottom:2px solid #c9973e}#jhlegal .tb button{flex:1;padding:9px 4px;border-radius:18px;border:1px solid #c9973e;background:#3a2810;color:#ffe9a8;font:bold 14px "PingFang TC","Microsoft JhengHei",sans-serif}#jhlegal .tb button.on{background:#f5d27a;color:#1a120b}#jhlegal .tb .x{flex:0 0 44px;background:#7a1f1f;color:#fff}#jhlegal .ct{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:4px 16px 40px}' + L.css.replace(/body\{/, '#jhlegal .ct{').replace(/\.w\{[^}]*\}/, '') + '</style><div class="bx"><div class="tb"><button data-t="privacy">隱私權政策</button><button data-t="terms">使用條款</button><button data-t="odds">機率公告</button><button class="x">✕</button></div><div class="ct"></div></div>';
    document.body.appendChild(el);
    el.querySelector('.x').onclick = () => { el.style.display = 'none'; };
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => showLegal(b.dataset.t));
  }
  el.style.display = 'flex'; el.querySelector('.ct').innerHTML = L[tab] || ''; el.querySelector('.ct').scrollTop = 0;
  el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
}
// ---------- 戰力：把所有成長換算成一個數字 ----------
function calcCP() {
  const c = clsView(save.cls), st = starOf(c.id), PB = petBonus(), pd = save.pet && petN(save.pet) ? petDef(save.pet) : null;
  const A = c.atk * (1 + 0.08 * st) * (1 + 0.12 * save.up.atk) * (1 + eqVal('wpn') / 100) * (1 + PB.atk / 100) * (1 + ownTotal() / 100);
  const R = c.rate * (1 + 0.04 * st) * (1 + 0.05 * save.up.rate) * (1 + eqVal('art') / 100) * (1 + PB.rate / 100);
  const U = 1 + save.up.hp + eqVal('arm') + PB.units, cr = CRIT + (PB.crit + (pd && pd.sk === 'crit' ? pd.v : 0) + eqVal('hlm')) / 100;
  const cx2 = CRIT_X + (relicHas('crit') ? 0.6 : 0);
  return Math.round(A * R * (1 + 0.08 * U) * (1 + cr * (cx2 - 1)) * (1 + eqVal('jad') / 100 * 0.35) * (1 + eqVal('bot') / 100 * 0.3) * 10);
}
const CPV = { last: 0, pops: [] };
function cpWatch() {   // 選單畫面中戰力變高時，跳出「戰力 +N」
  const v = calcCP(), same = CPV.cls === save.cls; CPV.cls = save.cls; if (same && CPV.last && v > CPV.last) { CPV.pops.push({ d: v - CPV.last, t: 0 }); if (CPV.pops.length > 3) CPV.pops.shift(); sfx('up'); } CPV.last = v; return v;
}
function drawCPPops() {
  for (const P of CPV.pops) { P.t += 1 / 60; }
  CPV.pops = CPV.pops.filter(P => P.t < 1.4);
  CPV.pops.forEach((P, i) => { const a = clamp((1.4 - P.t) * 3, 0, 1), y = 300 - P.t * 60 - i * 40, z = P.t < 0.15 ? 0.6 + P.t / 0.15 * 0.6 : P.t < 0.25 ? 1.2 - (P.t - 0.15) * 2 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, y); ctx.scale(z, z); ctx.font = `900 30px ${TFONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#3a1d04'; ctx.strokeText('戰力', -6, 0); ctx.fillStyle = '#ffe9a8'; ctx.fillText('戰力', -6, 0);
    numText('+' + P.d.toLocaleString(), 4, 0, 32, 'green', 'left'); ctx.restore(); });
}
function cpBadge(x, y, size = 26, align = 'center') {   // 戰力標示：劍形圖示＋「戰力」＋金色數字
  const v = CPV.last || calcCP(), t = v.toLocaleString();
  ctx.save(); ctx.font = `${size}px ${FONT}`; const nw = ctx.measureText(t).width; ctx.font = `900 ${Math.round(size * 0.72)}px ${TFONT}`; const lw = ctx.measureText('戰力').width;
  const ic = spr('ico_cp') ? size * 1.5 : 0, tw = ic + lw + 10 + nw, x0 = (align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x) + ic;
  if (ic) drawIcon('ico_cp', x0 - ic / 2 - 2, y, ic);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#2a1204'; ctx.strokeText('戰力', x0, y); ctx.fillStyle = '#ffd98a'; ctx.fillText('戰力', x0, y);
  numText(t, x0 + lw + 10, y, size, 'gold', 'left'); ctx.restore();
}
function autoUpgrade() {   // 一鍵強化：銅錢花在「每一銅錢加最多戰力」的地方，直到花不起
  let n = 0, spent = 0, brk = 0; const cp0 = calcCP();
  for (let guard = 0; guard < 400; guard++) {
    const base = calcCP(), opts = [];
    for (const u of UPS) if (save.up[u.k] < u.max) { const c = upCost(u.k); if (c <= save.coins) { save.up[u.k]++; opts.push({ g: (calcCP() - base) / c, c, f: () => save.up[u.k]++ }); save.up[u.k]--; } }
    for (const sl of GSLOT.map(g => g.k).sort((a, b) => grar(save.eq[b] || 'xxx0') - grar(save.eq[a] || 'xxx0'))) { const k = save.eq[sl]; if (k && save.gear[k] && doBrk(k)) { n++; brk++; } }   // 已裝備的先突破(高品級優先)
    for (const sl of GSLOT.map(g => g.k)) { const k = save.eq[sl]; if (k && save.gear[k] && save.gear[k] < gcap(k)) { const c = gUpCost(k); if (c <= save.coins) { save.gear[k]++; opts.push({ g: (calcCP() - base) / c, c, f: () => save.gear[k]++ }); save.gear[k]--; } } }
    { const id = save.pet; if (id && petN(id) && petLv(id) < pcap(id)) { const c = pUpCost(id); if (c <= save.coins) { save.plv[id] = petLv(id) + 1; opts.push({ g: (calcCP() - base) / c, c, f: () => { save.plv[id] = petLv(id) + 1; } }); save.plv[id]--; } } }   // 出戰靈寵
    if (!opts.length) break;
    const o = opts.sort((a, b) => b.g - a.g)[0]; save.coins -= o.c; o.f(); n++; spent += o.c; track('upgrade');
  }
  if (!n) { toast('銅錢不夠，再去闖蕩一下吧！'); return; }
  persist(); toast(`一鍵強化 ${n - brk} 次` + (brk ? `・突破 ${brk} 次` : '') + `・花費銅錢 ${spent.toLocaleString()}・戰力 +${(calcCP() - cp0).toLocaleString()}`);
}
function drawSettings() {
  drawBg(); dim(0.82);
  title('設定', 70, 50);
  const o = save.opt, row = (y, lb, val, act, on) => {
    plate(30, y, W - 60, 64, 12);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(lb, 52, y + 32);
    ctx.textAlign = 'center'; btn(W - 196, y + 10, 150, 44, val, act, { bg: on ? '#2f6a4a' : '#4a3b2a', size: 18 });
  };
  row(112, '音效', save.mute ? '關閉' : '開啟', 'mute', !save.mute);
  row(184, '背景音樂', o.bgm ? '開啟' : '關閉', 'opt_bgm', o.bgm);
  row(256, '畫面震動', o.shake ? '開啟' : '關閉', 'opt_shake', o.shake);
  row(328, '特效品質', o.fx === 'high' ? '高' : '低(省電)', 'opt_fx', o.fx === 'high');
  row(400, '新手引導', '重新觀看', 'opt_guide', true);
  plate(30, 482, W - 60, 238, 14);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 21px ${FONT}`; ctx.fillText('改版公告', W / 2, 510);
  ctx.textAlign = 'left'; PATCH.slice(0, 5).forEach(([v, t], i) => {
    const y = 546 + i * 35; ctx.fillStyle = '#ffc23a'; ctx.font = `bold 15px ${FONT}`; ctx.fillText(v, 50, y);
    ctx.fillStyle = '#ddd'; ctx.font = `14px ${FONT}`; let tt = t; while (ctx.measureText(tt).width > W - 190 && tt.length > 4) tt = tt.slice(0, -1); ctx.fillText(tt === t ? t : tt + '…', 124, y);
  });
  btn(30, 732, 154, 46, '隱私權政策', 'legal:privacy', { bg: '#4a3b2a', size: 16 }); btn(193, 732, 154, 46, '使用條款', 'legal:terms', { bg: '#4a3b2a', size: 16 }); btn(356, 732, 154, 46, '機率公告', 'legal:odds', { bg: '#4a3b2a', size: 16 });
  ctx.textAlign = 'center'; ctx.fillStyle = '#888'; ctx.font = `13px ${FONT}`; ctx.fillText('版本 ' + BUILD, W / 2, 800);
  btn(W / 2 - 140, 830, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
function sideBtn(x, y, act, label, dot) {   // 主畫面右側的小圖示按鈕
  ui.push({ x, y, w: 92, h: 100, act });
  const bob = dot ? Math.sin(AT * 3) * 2 : 0;
  ctx.fillStyle = 'rgba(20,14,10,.6)'; roundRect(x + 10, y + 4, 72, 68, 14); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = act === 'event' ? evToday().col : '#f5d27a'; ctx.stroke();
  const cx = x + 46, cy = y + 38 + bob;
  if (!drawIcon(act === 'mail' ? 'ico_mail' : act === 'pawn' ? 'ico_pawn' : 'ico_event', cx, cy, 56)) {
    if (act === 'pawn') {   // 寶箱(暫代，等 AI 圖)
      ctx.fillStyle = '#6a3a1a'; roundRect(cx - 22, cy - 8, 44, 26, 4); ctx.fill(); ctx.fillStyle = '#8a4a1f'; roundRect(cx - 22, cy - 20, 44, 14, 6); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - 4, cy - 10, 8, 10);
    } else if (act === 'mail') {   // 信封
      ctx.fillStyle = '#f2e2c0'; roundRect(cx - 24, cy - 16, 48, 32, 4); ctx.fill();
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 24, cy - 16); ctx.lineTo(cx, cy + 3); ctx.lineTo(cx + 24, cy - 16); ctx.stroke();
      ctx.fillStyle = '#b8241a'; ctx.beginPath(); ctx.arc(cx, cy + 3, 6, 0, 6.283); ctx.fill();
    } else {   // 燈籠
      ctx.fillStyle = '#5a2a10'; ctx.fillRect(cx - 1, cy - 26, 2, 8);
      ctx.fillStyle = '#d8241a'; ctx.beginPath(); ctx.ellipse(cx, cy, 20, 18, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - 12, cy - 20, 24, 5); ctx.fillRect(cx - 12, cy + 15, 24, 5);
      ctx.fillStyle = '#ffe9a8'; ctx.font = `900 18px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('慶', cx, cy + 1);
    }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText(label, x + 46, y + 86);
  if (dot) redDot(x + 78, y + 10);
}
function drawMail() {
  drawBg(); dim(0.8);
  title('信箱', 74, 50);
  const L = mailList(), page = S.mailPage || 0, per = 4, pages = Math.max(1, Math.ceil(L.length / per));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`;
  ctx.fillText(L.length ? `共 ${L.length} 封，未領取 ${L.filter(m => !save.mail.got[m.id]).length} 封` : '目前沒有信件', W / 2, 118);
  L.slice(page * per, page * per + per).forEach((m, k) => {
    const y = 140 + k * 150, got = save.mail.got[m.id];
    if (!panel(20, y, W - 40, 140, got ? 0.6 : 1)) { ctx.fillStyle = got ? 'rgba(30,26,22,.9)' : 'rgba(60,44,22,.96)'; roundRect(24, y, W - 48, 138, 12); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = got ? '#5a4a3a' : '#ffd700'; ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.fillStyle = got ? '#aaa' : '#ffe9a8'; ctx.font = `900 20px ${FONT}`; ctx.fillText(m.title, 42, y + 24);
    ctx.fillStyle = '#888'; ctx.font = `12px ${FONT}`; ctx.fillText(m.to && m.to < '2090' ? `期限 ${m.to}` : '永久', 42, y + 46);
    ctx.fillStyle = got ? '#888' : '#ddd'; ctx.font = `14px ${FONT}`; (m.body || '').split('\n').slice(0, 2).forEach((t, i) => ctx.fillText(t, 42, y + 70 + i * 20));
    ctx.fillStyle = got ? '#777' : '#7fe0ff'; ctx.font = `bold 15px ${FONT}`; ctx.fillText('附件：' + (rwFull(m.rw || {}) || '無'), 42, y + 118);
    ctx.textAlign = 'center';
    btn(W - 150, y + 84, 108, 42, got ? '已領取' : '領取', 'mailget:' + m.id, { bg: got ? '#555' : '#c0392b', size: 17, disabled: got });
  });
  if (pages > 1) {
    btn(24, 752, 100, 44, '◀', 'mpage:-1', { bg: '#4a3b2a', size: 20, disabled: page <= 0 });
    ctx.fillStyle = '#ccc'; ctx.font = `15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(`${page + 1} / ${pages}`, W / 2, 774);
    btn(W - 124, 752, 100, 44, '▶', 'mpage:1', { bg: '#4a3b2a', size: 20, disabled: page >= pages - 1 });
  }
  btn(60, 816, 200, 56, '全部領取', 'mailall', { bg: '#a0731a', size: 21, disabled: !mailHasClaim() });
  btn(280, 816, 200, 56, '返回', 'back', { bg: '#4a3b2a', size: 21 });
}
function drawEvent() {
  drawBg(); dim(0.8);
  title('每日活動', 80, 50);
  const E = evToday();
  if (!panel(26, 126, W - 52, 198)) { ctx.fillStyle = 'rgba(70,20,16,.95)'; roundRect(30, 130, W - 60, 190, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = E.col; ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffc8a0'; ctx.font = `bold 16px ${FONT}`; ctx.fillText('今日活動', W / 2, 160);
  inkText(E.name, W / 2, 210, 46, { cols: ['#fff6d0', E.col, '#c47a14'] });
  ctx.fillStyle = '#fff'; ctx.font = `bold 21px ${FONT}`; ctx.fillText(E.desc, W / 2, 262);
  ctx.fillStyle = '#ccc'; ctx.font = `14px ${FONT}`; ctx.fillText(evLeftText(), W / 2, 296);
  ctx.fillStyle = '#f5d27a'; ctx.font = `900 19px ${FONT}`; ctx.fillText('本週活動表', W / 2, 360);
  const days = ['日', '一', '二', '三', '四', '五', '六'], td = new Date().getDay();
  days.forEach((d, i) => {
    const e = EVENTS[EV_WEEK[i]], y = 388 + i * 52, on = i === td;
    ctx.fillStyle = on ? 'rgba(122,31,31,.92)' : 'rgba(30,22,16,.9)'; roundRect(50, y, W - 100, 44, 10); ctx.fill();
    if (on) { ctx.lineWidth = 2; ctx.strokeStyle = '#ffd700'; ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.fillStyle = on ? '#ffd700' : '#ccc'; ctx.font = `bold 17px ${FONT}`; ctx.fillText('週' + d, 70, y + 22);
    ctx.fillStyle = e.col; ctx.fillText(e.name, 140, y + 22);
    ctx.fillStyle = '#ddd'; ctx.font = `15px ${FONT}`; ctx.fillText(e.desc, 250, y + 22);
  });
  ctx.textAlign = 'center';
  btn(W / 2 - 140, 840, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
function idleBtn(x, y) {   // 主畫面左側的寶箱
  clockGuard(); if (!save.idle.t) { save.idle.t = nowT(); persist(); }
  const h = idleHours(), f = h / IDLE_MAX_H, bob = Math.sin(AT * 3) * (h >= 1 ? 3 : 0);
  ui.push({ x, y, w: 96, h: 96, act: 'idle' });
  if (h >= 1) { const g = ctx.createRadialGradient(x + 48, y + 40, 4, x + 48, y + 40, 50); g.addColorStop(0, 'rgba(255,210,90,.55)'); g.addColorStop(1, 'rgba(255,210,90,0)'); ctx.fillStyle = g; ctx.fillRect(x - 10, y - 10, 116, 100); }
  if (!drawIcon('ico_chest', x + 48, y + 36 + bob, 64)) { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x + 20, y + 14, 56, 44); }
  pbar(x + 8, y + 72, 80, 10, f, f >= 1 ? '#ff7b4a' : '#ffc23a');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('掛機收益', x + 48, y + 94);
  if (h >= 1) redDot(x + 84, y + 8);
}
function drawIdle() {
  drawBg(); dim(0.8);
  title('掛機收益', 80, 50); moneyTag(132);
  const h = idleHours(), a = idleAmt(), r = idleRate();
  const g = ctx.createRadialGradient(W / 2, 260, 10, W / 2, 260, 140); g.addColorStop(0, 'rgba(255,210,90,.5)'); g.addColorStop(1, 'rgba(255,210,90,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 140, W, 260);
  drawIcon('ico_chest', W / 2, 262 + Math.sin(AT * 3) * 4, 170);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  inkText(`已累積 ${hh} 小時 ${String(mm).padStart(2, '0')} 分`, W / 2, 378, 26);
  pbar(80, 404, W - 160, 14, h / IDLE_MAX_H, h >= IDLE_MAX_H ? '#ff7b4a' : '#ffc23a');
  ctx.fillStyle = h >= IDLE_MAX_H ? '#ff9a7a' : '#aaa'; ctx.font = `14px ${FONT}`; ctx.fillText(h >= IDLE_MAX_H ? '已達上限 12 小時，快領取！' : `最多累積 ${IDLE_MAX_H} 小時`, W / 2, 434);
  plate(50, 456, W - 100, 132, 14);
  const line = (ic, txt, col, y) => { drawIcon(ic, 120, y, 34); ctx.textAlign = 'left'; ctx.fillStyle = col; ctx.font = `bold 20px ${FONT}`; ctx.fillText(txt, 150, y); };
  line('ico_coin', `銅錢 ${a.c.toLocaleString()}`, '#ffd700', 488);
  line('ico_crystal', `${clsById(save.cls).name}碎片 ${a.f}`, '#e8b4ff', 524);
  ctx.textAlign = 'left'; ctx.fillStyle = '#c9a86a'; ctx.font = `bold 17px ${FONT}`; ctx.fillText(`俠客令經驗 ${a.xp}`, 150, 560);
  ctx.textAlign = 'center'; ctx.fillStyle = '#999'; ctx.font = `13px ${FONT}`;
  ctx.fillText(`每小時：銅錢 ${r.c.toLocaleString()}・碎片 ${r.f}(通關越多收益越高，碎片給目前職業)`, W / 2, 606);
  const ok = h >= 1 / 60;
  btn(50, 630, 210, 62, '領取', 'idle_get', { bg: '#c0392b', size: 22, disabled: !ok });
  btn(280, 630, 210, 62, '看廣告領雙倍', 'idle_ad', { bg: '#2f6a4a', size: 19, disabled: !ok });
  btn(50, 706, W - 100, 52, `元寶 50 立即獲得 2 小時收益(今日剩 ${idleQuickLeft()} 次)`, 'idle_quick', { bg: '#5a2f7a', size: 17, disabled: idleQuickLeft() <= 0 || save.gems < 50 });
  btn(W / 2 - 140, 830, 280, 56, '返回', 'back', { bg: '#4a3b2a', size: 23 });
}
function drawResult() {
  if (S.result && S.result.endless) { drawEndlessResult(); return; }
  if (S.result && S.result.tower) { drawTowerResult(); return; }
  if (S.result && S.result.weekly) { drawWeeklyResult(); return; }
  dim(0.72);
  const r = S.result; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  title(r.win ? '大獲全勝' : '壯烈犧牲', 210, 60);
  ctx.font = `bold 20px ${FONT}`; ctx.fillStyle = r.hard ? '#ff8ab0' : '#f5d27a'; ctx.fillText(`${r.hard ? '困難　' : ''}${stageLabel(S.stage)}　${ST().name}`, W / 2, 268);
  if (r.win && r.sub !== undefined) {   // 小關：顯示這一關 10 個小關的進度
    for (let k = 0; k < SUBN; k++) { const x = W / 2 + (k - 4.5) * 40, on = k <= r.sub, bossK = k === SUBN - 1; ctx.fillStyle = on ? '#ffd23a' : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x, 330, bossK ? 15 : 12, 0, 6.283); ctx.fill(); if (k === r.sub) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); } ctx.fillStyle = on ? '#3a1a00' : '#bbb'; ctx.font = `900 ${bossK ? 15 : 14}px ${FONT}`; ctx.fillText(bossK ? '首' : String(k + 1), x, 331); }
    ctx.fillStyle = '#ffe08a'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(r.first ? (r.sub === SUBN - 2 ? '下一個小關：首領！' : `小關突破！還差 ${SUBN - 1 - r.sub} 個小關到首領`) : '重打小關：銅錢照拿', W / 2, 372);
  } else if (r.win) { for (let i = 0; i < 3; i++) { const pz = i < r.stars ? 1 + Math.max(0, 0.4 - Math.abs(AT % 3 - i * 0.15)) * 0.3 : 1; drawStar(W / 2 + (i - 1) * 80, 335, 62 * pz, i < r.stars, true); }
    if (r.stars < 3) { const need = (r.stars === 1 ? 10 : 30) - r.units, pz = 1 + Math.sin(AT * 6) * 0.04; ctx.save(); ctx.translate(W / 2, 372); ctx.scale(pz, pz); ctx.fillStyle = '#ffe08a'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`差 ${need} 個分身就 ${r.stars + 1} 星！`, 0, 0); ctx.restore(); } }
  else { const pz = 1 + Math.sin(AT * 6) * 0.04; ctx.save(); ctx.translate(W / 2, 330); ctx.scale(pz, pz); ctx.fillStyle = '#ffb08a'; ctx.font = `bold 22px ${FONT}`; ctx.fillText(r.bossPct !== null ? (r.bossPct <= 35 ? `差一點！首領只剩 ${r.bossPct}% 血` : `首領還剩 ${r.bossPct}% 血，變強再來！`) : (r.prog >= 70 ? `差一點！已經走完 ${r.prog}%` : `走到 ${r.prog}%，再試一次！`), 0, 0); ctx.restore(); }
  ctx.font = `bold 23px ${FONT}`; ctx.fillStyle = '#fff';
  statLine('擊敗敵人', r.kills, 400);
  statLine('剩餘分身', r.units, 436);
  statLine('獲得銅錢', r.coins, 472, 'gold', r.ev ? `${r.ev} ×2` : '');
  let by = 494;
  if (r.gems) { statLine('獲得元寶', r.gems, 508, 'cyan'); by = 530; }
  if (r.frag) { ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = '#e8b4ff'; ctx.fillText(`${S.cls.name}碎片 +${r.frag}` + (r.tk ? `　靈寵券 +${r.tk}・裝備券 +${r.tk}` : ''), W / 2, by + 6); by += 24; }
  ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = r.lvUp ? '#ffc23a' : '#c9a86a'; ctx.fillText(`俠客令經驗 +${r.pxp}` + (r.lvUp ? `　升到 Lv ${passLv()}！` : ''), W / 2, by + 6); by += 26;
  if (r.drop) {
    const k = r.drop.key, rc = RCOL[grar(k)];
    ctx.save(); ctx.shadowColor = rc; ctx.shadowBlur = grar(k) >= 2 ? 20 : 0;
    plate(60, by, W - 120, 46, 12); ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = rc; roundRect(60, by, W - 120, 46, 12); ctx.stroke();
    ctx.fillStyle = rc; ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`${r.sub !== undefined ? '小關' : '首領'}掉落：${RAR[grar(k)]}・${gname(k)}　` + (r.drop.isNew ? 'NEW!' : r.drop.xt ? `玄鐵 +${r.drop.xt}` : r.drop.coins ? `銅錢+${r.drop.coins}` : `升到 Lv ${r.drop.lv}`), W / 2, by + 24);
    by += 54;
  }
  if (r.drop2) { const k2 = r.drop2.key, rc2 = RCOL[grar(k2)]; ctx.fillStyle = 'rgba(40,60,30,.92)'; roundRect(60, by, W - 120, 40, 12); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rc2; ctx.stroke();
    ctx.fillStyle = rc2; ctx.font = `bold 17px ${FONT}`; ctx.fillText(`首通加碼：${RAR[grar(k2)]}・${gname(k2)}　` + (r.drop2.isNew ? 'NEW!' : r.drop2.xt ? `玄鐵 +${r.drop2.xt}` : ''), W / 2, by + 21); by += 48; }
  if (r.myth) { ctx.fillStyle = 'rgba(120,20,20,.92)'; roundRect(60, by, W - 120, 40, 12); ctx.fill(); ctx.strokeStyle = RCOL[5]; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#ffd0d0'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(`首通獎勵：神話・${gname(r.myth.key)}` + (r.myth.isNew ? '　NEW!' : '　神話精魄 +1'), W / 2, by + 21); by += 48; }
  if (r.old) { ctx.fillStyle = 'rgba(70,40,15,.92)'; roundRect(60, by, W - 120, 40, 12); ctx.fill(); ctx.fillStyle = '#ffd98a'; ctx.font = `bold 17px ${FONT}`; ctx.fillText(`撿到舊物：${r.old}(到聚寶當鋪打開)`, W / 2, by + 21); by += 48; }
  if (r.chal) { ctx.fillStyle = r.chal.ok ? 'rgba(120,80,10,.92)' : 'rgba(40,30,22,.85)'; roundRect(60, by, W - 120, 40, 12); ctx.fill(); if (r.chal.ok) { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = r.chal.ok ? '#ffe9a8' : '#bfb3a0'; ctx.font = `bold 17px ${FONT}`; ctx.fillText(r.chal.ok ? `關卡挑戰完成！元寶 +${r.chal.g}` : `挑戰未完成：${r.chal.txt}`, W / 2, by + 21); by += 48; }
  if (r.feats && r.feats.length) { const pz = 1 + Math.sin(AT * 6) * 0.03; ctx.save(); ctx.translate(W / 2, by + 23); ctx.scale(pz, pz); ctx.fillStyle = 'rgba(30,90,60,.95)'; roundRect(-(W - 120) / 2, -23, W - 120, 46, 12); ctx.fill(); ctx.strokeStyle = '#8fffd0'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#e8fff4'; ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('新功能開啟：' + r.feats.join('、'), 0, 1); ctx.restore(); by += 54; }
  if (r.unlock) { ctx.fillStyle = 'rgba(122,31,31,.9)'; roundRect(60, by, W - 120, 46, 12); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 22px ${FONT}`; ctx.fillText('解鎖新職業：' + r.unlock + '！', W / 2, by + 24); by += 54; }
  if (r.coins > 0 && !r.doubled) { btn(90, by, W - 180, 44, `看廣告 銅錢加倍(+${r.coins})`, 'addouble', { bg: '#2f6a4a', size: 18 }); by += 54; }
  if (!r.win && offerLeft() > 0) { btn(90, by, W - 180, 44, `限時突破禮包(剩 ${Math.ceil(offerLeft() / 60000)} 分鐘)`, 'gooffer', { bg: '#a0281e', border: '#ffd700', size: 18 }); by += 54; }
  let y = Math.max(590, by + 14);
  // 下方按鈕：主要按鈕一顆大的，次要的兩顆並排，避免畫面太長被切掉
  const half = (l, a, o) => [btn(W / 2 - 150, y, 145, 56, l, a, Object.assign({ size: 19 }, o)), btn(W / 2 + 5, y, 145, 56, '回到地圖', 'map', { bg: '#4a3b2a', size: 19 })];
  if (r.win && r.sub !== undefined) { btn(W / 2 - 150, y, 300, 76, r.sub === SUBN - 2 ? '挑戰首領' : '下一小關', 'next', { size: 30 }); y += 88; half('再打一次', 'retry', { bg: '#7a4a1f' }); }
  else if (r.win && S.stage < STAGES.length - 1 && (!S.hard || hardOpen(S.stage + 1))) { btn(W / 2 - 150, y, 300, 76, '下一關', 'next', { size: 30 }); y += 88; half(r.stars < 3 ? '再戰拿三星' : '再戰一次', 'retry', { bg: r.stars < 3 ? '#a0731a' : '#7a4a1f' }); }
  else if (r.win) { btn(W / 2 - 150, y, 300, 70, '再戰一次', 'retry'); y += 84; btn(W / 2 - 140, y, 280, 56, '回到地圖', 'map', { bg: '#4a3b2a', size: 22 }); }
  else { btn(W / 2 - 160, y, 320, 84, '再戰一次', 'retry', { size: 34 }); y += 96; if (featOpen('upgrade')) half('去修練', 'upgrade', { bg: '#2f5a8a' }); else btn(W / 2 - 140, y, 280, 56, '回到地圖', 'map', { bg: '#4a3b2a', size: 22 }); }
}
function drawPause() {
  dim(0.65);
  const RL = [...(S.relic || [])].map(relicDef).filter(Boolean), dy = RL.length ? -70 : 0;
  title('暫停', 300 + dy, 54);
  btn(W / 2 - 130, 390 + dy, 260, 70, '繼續', 'resume');
  btn(W / 2 - 130, 476 + dy, 260, 60, save.mute ? '音效：關' : '音效：開', 'mute', { bg: '#2f5a8a', size: 22 });
  btn(W / 2 - 130, 552 + dy, 260, 60, '放棄這局', 'map', { bg: '#4a3b2a', size: 22 });
  if (RL.length) {   // 裝備技能：古物秘技
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffb0a0'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('裝備技能(古物秘技)', W / 2, 566);
    RL.forEach((d, i) => { const x = W / 2 + (i - (RL.length - 1) / 2) * 84, y = 604; if (!drawIcon('sk_' + d.icon, x, y, 40)) { ctx.fillStyle = '#5a2a1a'; ctx.beginPath(); ctx.arc(x, y, 20, 0, 6.283); ctx.fill(); ctx.fillStyle = '#ffd98a'; ctx.font = `900 18px ${TFONT}`; ctx.fillText(d.name[0], x, y + 1); }
      ctx.fillStyle = '#fff'; ctx.font = `bold 12px ${FONT}`; ctx.fillText(d.name, x, y + 32); if (d.id === 'burst' && S.rBurst) { ctx.fillStyle = '#aaa'; ctx.fillText('已用', x, y - 30); } });
  }
  // 武學進化圖鑑：主武學練到 Lv3＋學過搭配武學
  const evs = SKILLS.filter(e => e.evo); let y = RL.length ? 694 : 644;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd98a'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('武學進化圖鑑', W / 2, y - 20);
  for (const e of evs) {
    const a = skDef(e.evo[0]), b = skDef(e.evo[1]), la = S.sk[a.id] || 0, lb = S.sk[b.id] || 0, done = !!S.sk[e.id];
    plate(40, y, W - 80, 46, 10, done ? 'gold' : '');
    drawIcon('ico_sk_' + e.id, 66, y + 23, 40);
    ctx.textAlign = 'left'; ctx.fillStyle = done ? '#ffe9a8' : '#fff'; ctx.font = `900 18px ${TFONT}`; ctx.fillText(e.name, 92, y + 23);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = la >= 3 ? '#7fffa0' : '#cfc6b8'; ctx.fillText(`${a.name} Lv${Math.min(la, 3)}/3`, 196, y + 23);
    ctx.fillStyle = '#cfc6b8'; ctx.fillText('＋', 312, y + 23); ctx.fillStyle = lb >= 1 ? '#7fffa0' : '#cfc6b8'; ctx.fillText(b.name, 330, y + 23);
    if (done) { ctx.fillStyle = '#ffd23a'; ctx.textAlign = 'right'; ctx.fillText('已練成', W - 52, y + 23); }
    y += 50;
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'center';
}
function draw() { drawMain(); if (S.mode !== 'play' && S.mode !== 'loading') { cpWatch(); drawCPPops(); } drawGuide(); drawAd(); drawToast(); }
function drawMain() {
  ui = [];
  ctx.setTransform(view.s * view.d, 0, 0, view.s * view.d, 0, 0);
  if (S.mode === 'title') { drawTitle(); return; }
  if (S.mode === 'map') { drawMap(); return; }
  if (S.mode === 'upgrade') { drawUpgrade(); return; }
  if (S.mode === 'bag') { drawBag(); return; }
  if (S.mode === 'gacha') { drawGacha(); return; }
  if (S.mode === 'daily') { drawDaily(); return; }
  if (S.mode === 'account') { drawAccount(); return; }
  if (S.mode === 'shop') { drawShop(); return; }
  if (S.mode === 'pawn') { drawPawn(); return; }
  if (S.mode === 'pass') { drawPass(); return; }
  if (S.mode === 'achv') { drawAchv(); return; }
  if (S.mode === 'forge' || S.mode === 'synth') { drawSynth(); return; }
  if (S.mode === 'petbook') { drawPetBook(); return; }
  if (S.mode === 'loading') { drawLoading(); return; }
  if (S.mode === 'trials') { drawTrials(); return; }
  if (S.mode === 'skins') { drawSkins(); return; }
  if (S.mode === 'settings') { drawSettings(); return; }
  if (S.mode === 'idle') { drawIdle(); return; }
  if (S.mode === 'mail') { drawMail(); return; }
  if (S.mode === 'event') { drawEvent(); return; }
  ctx.save();
  if (S.shake > 0 && save.opt.shake) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  drawBg(); drawGates(); drawBossMarks(); drawBarrels(); drawEnemies(); ctx.globalAlpha = 1; drawCorpses(); drawBoss(); drawShots(); drawSquad(); drawPet(); drawSkills(); drawFx(); drawSparks(); drawSnow(); drawHitFx();
  ctx.restore();
  if (S.mode === 'play') { drawHud(); drawSkillBar(); drawCombo(); drawBanner(); drawTutorial(); if (S.evoFx) drawEvoFx(); else if (S.pick) drawPick(); else if (S.paused) { ui = []; drawPause(); } }
  else if (S.mode === 'result') { ui = []; drawResult(); }
  else if (S.mode === 'revive') { drawHud(); ui = []; drawRevive(); }
}


// ---------- 聚寶當鋪：翻舊物(只能用銅錢；機率公開；不能交易) ----------
const OLD = [{ id: 'old0', name: '破布包袱', p: 10000 }, { id: 'old1', name: '生鏽鐵匣', p: 30000 }, { id: 'old2', name: '鏢局遺箱', p: 80000 }, { id: 'old3', name: '古墓陪葬匣', p: 160000 }, { id: 'old4', name: '皇陵密匣', p: 300000 }];   // 價格比例 1:3:8:16:30
const OLD_W = [30, 28, 20, 14, 8], OLD_N = [10, 15, 25, 25, 25];   // 舊物種類權重(便宜的多)、架上件數 1~5 的權重
const OLD_VAL = [3000, 10000, 40000, 150000, 800000, 10000000];   // 開出各品級時，掌櫃當場收購的價錢
// 機率(%)：[垮了, 凡品, 良品, 精品, 極品, 傳說, 神話]；每種舊物長期回收率都是 87%(pawn_solve.py 解出並驗算)
const OLD_P = [[50, 33.5337, 11.1343, 3.6969, 1.2275, 0.4076, 0.0], [42, 29.8828, 14.9728, 7.5021, 3.7589, 1.8834, 0.0], [36, 21.7057, 15.8939, 11.6382, 8.522, 6.2402, 0.0], [30, 14.1414, 14.0703, 13.9996, 13.9293, 13.8594, 0.0], [25, 5.9236, 8.7546, 12.9386, 19.1222, 28.261, 0.0]];
const OLD_PM = [[50, 33.5337, 11.1343, 3.6969, 1.2275, 0.4076, 0.0], [42, 29.8828, 14.9728, 7.5021, 3.7589, 1.8834, 0.0], [36, 21.7057, 15.8939, 11.6382, 8.522, 6.2402, 0.0], [30, 35.725, 17.7685, 8.8375, 4.3955, 2.1862, 1.0873], [25, 32.7648, 18.9944, 11.0114, 6.3835, 3.7006, 2.1453]];   // 主線全通(神話開放)後：古墓陪葬匣、皇陵密匣開得出神話
const OLD_LAMP = [1, 2, 2, 3, 4, 5, 5];   // 掂量：各結果的基礎寶氣星數(僅在「掂準」時使用，±1@25%)
// 寶氣會騙人(1012-J 定案)：買價固定不變，掂量結果有 LAMP_FUZZ 機率完全失準(1~5 星均等隨機)，
// 僅 5% 反映真實分量。pawn_solve5.py 精算：搭配賣回規則，全遊戲最優玩法回收率 87%~93%。勿手改。
const LAMP_FUZZ = 0.95;
const PAWN_CD = 600e3, PEEK_C = ['w', 'g', 'b', 'p', 'y', 'r'], PEEK_N = ['白光', '綠光', '藍光', '紫光', '金光', '赤光'];
const RELIC = [
  { id: 'shield', icon: 'relic0', name: '金鐘罩', d: '每 12 秒產生一層金色護盾，擋下一次傷害' },
  { id: 'burst', icon: 'relic1', name: '玉石俱焚', d: '每場一次：分身快耗盡時爆開，震飛周圍敵人並補回大量分身' },
  { id: 'coin', icon: 'relic2', name: '財源廣進', d: '擊敗敵人的銅錢 +60%' },
  { id: 'regen', icon: 'relic3', name: '回元真氣', d: '3 秒沒受傷就開始快速補回分身' },
  { id: 'bolt', icon: 'relic4', name: '天雷引', d: '每 6 秒降下天雷，轟擊 3 個敵人' },
  { id: 'crit', icon: 'relic5', name: '會心一擊', d: '暴擊傷害 ×1.8 → ×2.4' },
];
const relicDef = id => RELIC.find(r => r.id === id);
const relicHas = id => Object.values(save.relic || {}).includes(id);
const oldTable = t => (mythOpen() ? OLD_PM : OLD_P)[t];
function wpick(w) { const s = w.reduce((a, b) => a + b, 0); let x = Math.random() * s, i = 0; while ((x -= w[i]) > 0 && i < w.length - 1) i++; return i; }
function oldMake(t) {   // 上架的那一刻就決定好打開的結果(out：0＝垮了，1~6＝凡品~神話)
  const o = { t, out: wpick(oldTable(t)), lamp: 0, peek: false };
  if (o.out === 0 && Math.random() < 0.25) o.fake = 3 + Math.floor(Math.random() * 3);   // 鍍金騙局：其實是空的，縫裡卻透出精品～傳說的光
  return o;
}
const pawnFree = () => Date.now() - (save.pawn.t || 0) >= PAWN_CD;
const pawnCost = (o, f) => Math.max(10, Math.round(OLD[o.t].p * f / 10) * 10);
function pawnRestock() { const n = 1 + wpick(OLD_N); save.pawn.shelf = Array.from({ length: n }, () => oldMake(wpick(OLD_W))); S.pawnSel = null; sfx('restock'); }
function pawnEnter() {
  if (!save.pawn.shelf.length && !save.pawn.t) { pawnRestock(); save.pawn.t = Date.now(); persist(); }
  S.pawnSel = save.pawn.hand ? 'hand' : null; S.pawnHand = !!save.pawn.hand; S.pawnCut = null; S.pawnRes = null; S.pawnProb = false; S.pawnPose = 'idle'; pawnSay('idle');
}
function pawnSel() { return S.pawnSel === 'hand' ? save.pawn.hand : typeof S.pawnSel === 'number' ? save.pawn.shelf[S.pawnSel] : null; }
const PL = {   // 錢三娘的台詞
  idle: ['客官裡邊請，今兒個剛收了一批好東西。', '一刀窮、一刀富，客官要不要試試眼力？', '江湖上的寶貝，十件有九件流進我這當鋪。', '看上哪件就說一聲，三娘給你個公道價。', '神仙難斷寸寶，全憑客官的眼力和手氣。'],
  flat: ['客官好眼力！這件可是我壓箱底的貨。', '這麼有福相的客官，開什麼都旺！', '老身看人從沒走眼，客官今天鴻運當頭。', '這件跟客官有緣，我都捨不得賣了。'],
  pos: ['這包袱的紮法……像是大戶人家收的。', '你聞聞，這匣子裡有股檀香，裡頭的東西不俗。', '上回跟它同一批出來的，開出了一把寶劍。', '鎖頭這麼講究，不是寶貝何必鎖這麼牢？', '分量壓手，裡頭東西不輕。'],
  neg: ['這件嘛……我只能說，包得比裡頭的東西還用心。', '有點鏽斑，不過「鏽裡藏金」也是有的。', '這是從亂葬崗收來的，客官自己斟酌。', '老實說，我收的時候只花了半吊錢。', '輕飄飄的，客官可想清楚了。'],
  lamp: [['輕得像塊棉花……客官三思。', '敲起來空空的，嗯……', '這聲音，跟敲爛木頭差不多。'],
         ['有點分量，但不多。', '聲音悶悶的，說不準。', '裡頭像是有東西，又像沒有。'],
         ['分量還行，算是中規中矩。', '敲起來有回音，有點意思。', '不輕不重，試一把也不吃虧。'],
         ['咦，這分量……裡頭有硬貨！', '敲起來清脆，像是好鐵。', '寶氣隱隱的，老身都心動了。'],
         ['好重！這寶氣都快溢出來了！', '這聲音……是神兵在裡頭低鳴啊！', '老身三十年沒摸過這麼沉的貨！']],
  peekV: ['看見沒？這光澤，絕對是好東西！', '好傢伙，這光都照亮半間鋪子了！', '老身眼睛都花了，快開、快開！'],
  peekC: ['有光，有光！裡頭確實藏著東西。', '透出一點色，不算差。', '這光不亮不暗，就看客官的運氣了。'],
  peekN: ['黑漆漆的……什麼也沒看見。', '一點光都沒有，客官可要想清楚。', '空空的縫，空空的心。'],
  big: ['大漲！客官這一刀，開出了傳家寶！', '天啊！這可是千金不換的神物！', '老身今天算是開了眼界，客官好手氣！'],
  up: ['漲了漲了！這筆買賣客官穩賺！', '不錯不錯，是件實在的好貨。', '有眼光！這件值這個價。'],
  small: ['小賺一點，聊勝於無。', '是件尋常貨色，倒也能用。', '不虧不賺，就當交個朋友。'],
  bust: ['唉……一堆破銅爛鐵。', '江湖險惡，舊物更險惡啊。', '這一刀……客官別灰心，下回準行。', '翻舊物就是這樣，有賺有賠。'],
  fake: ['這層鍍金……連老身都看走眼了。', '外頭鍍了層金皮，裡頭是空的！', '好個奸商，連老身都被唬住了！'],
  streak: ['你連垮 3 件了……要不要先去打個怪，轉轉手氣？'],
  buy: ['好！這件是客官的了，要開還是要轉手，隨意。', '成交！老身就喜歡爽快的客官。'],
  sell: ['行，老身收回來了，童叟無欺。', '這價錢公道吧？下回再來。'],
};
const PL_POSE = { idle: 'idle', flat: 'hint', pos: 'hint', neg: 'hint', lamp: 'lamp', peekV: 'wow', peekC: 'wow', peekN: 'sad', big: 'joy', up: 'wow', small: 'idle', bust: 'sad', fake: 'sad', streak: 'sad', buy: 'idle', sell: 'idle' };
function pawnSay(cat, sub) {
  const L = sub !== undefined ? PL[cat][sub] : PL[cat]; S.pawnLine = { txt: L[Math.floor(Math.random() * L.length)], t: 0 }; S.pawnPose = PL_POSE[cat] || 'idle'; S.pawnPoseT = 3.5;
}
function pawnTalk(o) {   // 結果越好越常講好話；但會騙人
  const [po, fl] = o.out >= 5 ? [45, 40] : o.out >= 3 ? [30, 50] : o.out >= 1 ? [15, 55] : [10, 50], x = Math.random() * 100;
  pawnSay(x < fl ? 'flat' : x < fl + po ? 'pos' : 'neg');
}
function pawnSellVal(o) {   // 不開直接賣回：沒掀過 80%；掀過看到光＝同色品級估價 ×0.8(最高原價 1.5 倍、無保底)；掀過沒光 40%
  const p = OLD[o.t].p; if (!o.peek) return Math.round(p * 0.8);
  const c = o.out ? o.out - 1 : o.fake ? o.fake - 1 : -1;
  return c < 0 ? Math.round(p * 0.4) : Math.round(Math.min(OLD_VAL[c] * 0.8, p * 1.5));
}
function pawnAct(a) {
  const P = save.pawn, o = pawnSel();
  if (a === 'pwback') { S.mode = 'title'; return; }
  if (a.startsWith('pwsel:')) { const v = a.slice(6); if (v === 'none') { S.pawnSel = null; return; } S.pawnSel = v === 'hand' ? 'hand' : +v; if (v === 'hand') { S.pawnHand = true; return; } const q = pawnSel(); if (q) pawnTalk(q); return; }
  if (a.startsWith('pwbag:')) { if (P.hand) { toast('手上已經有一件了，先打開或賣回'); return; } P.hand = P.bag.splice(+a.slice(6), 1)[0]; S.pawnSel = 'hand'; S.pawnHand = true; persist(); pawnSay('buy'); return; }
  if (a === 'pwtalk' && o) { pawnTalk(o); return; }
  if (a === 'pwlamp' && o && !o.lamp) { if (P.hand) { toast('手上還有一件，先劈開或賣回'); return; } if (S.pawnSel === 'hand') { toast('買定離手，三娘只掂架上的貨'); return; } const c = pawnCost(o, 0.03); if (save.coins < c) { toast('銅錢不夠'); return; } save.coins -= c; P.st.spent += c;
    // 寶氣會騙人：LAMP_FUZZ 機率完全失準(1~5 星均等)，其餘才反映真實分量(±1@25%)
    o.lamp = Math.random() < LAMP_FUZZ ? 1 + Math.floor(Math.random() * 5) : clamp(OLD_LAMP[o.out] + (Math.random() < 0.25 ? (Math.random() < 0.5 ? -1 : 1) : 0), 1, 5);
    persist(); sfx('knock'); pawnSay('lamp', o.lamp - 1); return; }
  if (a === 'pwpeek' && o && !o.peek) { if (S.pawnSel !== 'hand') { toast('先買下來，才能掀角看光'); return; } const c = pawnCost(o, 0.1); if (save.coins < c) { toast('銅錢不夠'); return; } save.coins -= c; P.st.spent += c; o.peek = true; persist(); sfx('peek');
    const col = o.out ? o.out - 1 : o.fake ? o.fake - 1 : -1; pawnSay(col < 0 ? 'peekN' : col >= 4 ? 'peekV' : 'peekC'); return; }
  if (a === 'pwbuy' && o && S.pawnSel !== 'hand') { if (P.hand) { toast('手上只能拿一件，先打開或賣回'); return; } const p = OLD[o.t].p; if (save.coins < p) { toast('銅錢不夠'); return; }
    save.coins -= p; P.st.spent += p; P.hand = P.shelf.splice(S.pawnSel, 1)[0]; S.pawnSel = 'hand'; S.pawnHand = true; persist(); sfx('coin'); pawnSay('buy'); return; }
  if (a === 'pwsell' && P.hand) { const v = pawnSellVal(P.hand); save.coins += v; P.st.got += v; P.hand = null; S.pawnSel = null; S.pawnHand = false; persist(); sfx('coin'); pawnSay('sell'); toast(`賣回給掌櫃：銅錢 +${v.toLocaleString()}`); return; }
  if (a === 'pwopen' && P.hand) { S.pawnCut = { t: 0, o: P.hand }; P.hand = null; S.pawnSel = null; S.pawnHand = false; P.st.n++; stat('pawnOpen'); persist(); sfx('saw'); return; }
  if (a === 'pwhvx') { S.pawnHand = false; S.pawnSel = null; return; }
  if (a === 'pwre') { if (pawnFree()) { pawnRestock(); P.t = Date.now(); persist(); pawnSay('idle'); return; }
    const c = OLD[0].p * 2; if (save.coins < c) { toast('銅錢不夠'); return; } save.coins -= c; P.st.spent += c; pawnRestock(); persist(); pawnSay('idle'); return; }
  if (a === 'pwprob') { S.pawnProb = !S.pawnProb; return; }
  if (a === 'pwkeep' || a === 'pwkeep2' || a === 'pwsellg') { const R = S.pawnRes; if (!R) return;
    if (a === 'pwsellg') { save.coins += R.val; P.st.got += R.val; toast(`賣給掌櫃：銅錢 +${R.val.toLocaleString()}`); sfx('coin'); }
    else { grant(R.key); const g = gslot(R.key); if (R.relic && (!save.relic[g.k] || a === 'pwkeep2')) { save.relic[g.k] = R.relic; sfx('forge'); toast(`${g.name}鑲上古物秘技「${relicDef(R.relic).name}」！`); } else sfx('up'); }
    S.pawnRes = null; S.pawnCut = null; persist(); return; }
  if (a === 'pwok') { S.pawnRes = null; S.pawnCut = null; return; }
  if (a === 'pwdev') { S.pawnDev = !S.pawnDev; return; }
  if (a.startsWith('pwd:')) { const k = a.slice(4);
    if (k === 'cu') { save.coins += 10000000; toast('已送 1,000 萬銅錢(測試)'); }
    if (k === 're') { pawnRestock(); P.t = Date.now(); }
    if (k === 'top' || k === 'junk') { S.pawnForce = k; toast(k === 'top' ? '下一件必出最高品級(測試)' : '下一件必垮(測試)'); }
    if (k === 'relic') { GSLOT.forEach((g, i) => { save.relic[g.k] = RELIC[i].id; }); toast('六個部位都鑲上古物秘技(測試)'); }
    if (k === 'fight') { GSLOT.forEach((g, i) => { save.relic[g.k] = RELIC[i].id; }); persist(); S.wantHard = false; S.wantSub = save.cleared < STAGES.length ? subCur(false) : SUBN - 1; startStage(Math.min(save.cleared, STAGES.length - 1)); return; }
    persist(); return; }
}
function pawnReveal() {   // 開山輪劈開：揭曉結果
  const C = S.pawnCut, o = C.o, P = save.pawn;
  let out = o.out; if (S.pawnForce === 'top') out = mythOpen() ? 6 : 5; else if (S.pawnForce === 'junk') out = 0; S.pawnForce = null;
  const price = OLD[o.t].p;
  if (!out) { P.streak = (P.streak || 0) + 1; S.pawnRes = { junk: true, fake: !!o.fake, price }; sfx('junk'); pawnSay(o.fake ? 'fake' : 'bust'); if (P.streak >= 3 && P.streak % 3 === 0) setTimeout(() => pawnSay('streak'), 1600); persist(); return; }
  P.streak = 0; const r = out - 1, key = gkey(GSLOT[Math.floor(Math.random() * GSLOT.length)].k, r), val = OLD_VAL[r];
  P.st.best = Math.max(P.st.best || 0, val);
  S.pawnRes = { key, r, val, price, relic: r >= 4 ? RELIC[Math.floor(Math.random() * RELIC.length)].id : null, isNew: !save.gear[key] };
  const ratio = val / price; pawnSay(ratio >= 3 ? 'big' : ratio >= 1.2 ? 'up' : 'small'); if (r >= 4) S.pawnPose = 'joy';
  sfx(r >= 5 ? 'jackpot' : r >= 4 ? 'gbig' : r >= 2 ? 'gmid' : 'gsmall'); if (r >= 4) { flash(0.4); }
  logEv('pawn_open', { t: o.t, out, peek: o.peek ? 1 : 0, lamp: o.lamp }); persist();
}
function wrapLines(txt, maxW) { const out = []; let line = ''; for (const ch of txt) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; }
function oldIcon(o, x, y, size) {   // 舊物圖(沒圖時先用暫代畫法)
  const d = OLD[o.t], k = d.id + (o.peek ? 'w' : '');
  const col = o.peek ? (o.out ? o.out - 1 : o.fake ? o.fake - 1 : -1) : -1;
  if (col >= 0) { const gk = 'fx_peek_' + PEEK_C[col]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75 + Math.sin(AT * 4) * 0.2; if (!drawIcon(gk, x, y - size * 0.25, size * 1.3)) { const gl = ctx.createRadialGradient(x, y - size * 0.15, 2, x, y - size * 0.15, size * 0.7); gl.addColorStop(0, RCOL[col] + 'cc'); gl.addColorStop(1, RCOL[col] + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y - size * 0.15, size * 0.7, 0, 6.283); ctx.fill(); } ctx.restore(); }
  if (drawIcon(k, x, y, size) || drawIcon(d.id, x, y, size)) return;
  const BC = ['#6a5a8a', '#7a5040', '#8a2a20', '#3a6a5a', '#1a1a1a'], TC = ['#c8b89a', '#c08060', '#ffd23a', '#9fd8c0', '#ffd23a'];
  ctx.fillStyle = BC[o.t]; roundRect(x - size * 0.42, y - size * 0.28, size * 0.84, size * 0.6, 6); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TC[o.t]; ctx.stroke();
  ctx.fillStyle = TC[o.t]; ctx.font = `900 ${Math.round(size * 0.26)}px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.name[0], x, y + 2);
}
function drawPawnNpc(x, footY, h) {   // 錢三娘(沒圖時先用暫代剪影)
  const a = spr('npc_pawn_' + (S.pawnPose || 'idle')) || spr('npc_pawn');
  if (S.pawnPose === 'joy') h *= 0.92;   // 開心姿勢(張開雙手)比較寬，縮一點才不會超出畫面
  const bob = a ? 0 : Math.sin(AT * 2) * 2;
  if (a) {
    const sw = h * 0.46, sg = ctx.createRadialGradient(x, footY - 2, 0, x, footY - 2, sw);   // 落地陰影
    sg.addColorStop(0, 'rgba(8,3,0,.55)'); sg.addColorStop(0.6, 'rgba(8,3,0,.28)'); sg.addColorStop(1, 'rgba(8,3,0,0)');
    ctx.save(); ctx.translate(x, footY - 2); ctx.scale(1, 0.22); ctx.translate(-x, -(footY - 2)); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, footY - 2, sw, 0, 6.283); ctx.fill(); ctx.restore();
    drawSpr(a, x, footY - h, h, 0.5); return;
  }
  ctx.save(); ctx.translate(x, footY + bob);
  ctx.fillStyle = '#8a1a1a'; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(46, 0); ctx.lineTo(28, -h * 0.62); ctx.lineTo(-28, -h * 0.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1f6a6a'; ctx.fillRect(-30, -h * 0.5, 60, 10);
  ctx.fillStyle = '#ffe0c8'; ctx.beginPath(); ctx.arc(0, -h * 0.74, h * 0.15, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(0, -h * 0.86, h * 0.1, 0, 6.283); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-2, -h * 0.97, 30, 4);
  ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('錢三娘(暫代)', 0, -6); ctx.restore();
}
function drawPawn() {
  const P = save.pawn, top = 92, SH = 405, cx = W / 2;
  const pc0 = CHUNKS.find(c => c.file === 'assets_pawn.js');
  if (!spr('bg_pawn') && pc0 && pc0.state !== 'fail' && (S.pawnWait = (S.pawnWait || 0) + 1 / 60) < 8) {   // 素材還在載：先畫開門中，載好直接進正式版面，不閃暫代版
    loadChunk(pc0); ctx.fillStyle = '#1a120b'; ctx.fillRect(0, 0, W, H); title('聚寶當鋪', 52, 44);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#d8c7a0'; ctx.font = `bold 20px ${TFONT}`; ctx.fillText('當鋪開門中…', W / 2, 420);
    ctx.save(); ctx.translate(W / 2, 480); ctx.rotate(AT * 4); ctx.strokeStyle = '#e8c26a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 4.4); ctx.stroke(); ctx.restore();
    btn(W / 2 - 100, 870, 200, 56, '返回', 'pwback', { bg: '#4a3b2a', size: 22 }); return;
  }
  if (S.pawnLine) S.pawnLine.t += 1 / 60; if (S.pawnPoseT > 0 && (S.pawnPoseT -= 1 / 60) <= 0) S.pawnPose = 'idle';
  // 標題列
  { const pb = spr('bg_pawn'); if (pb) { const ch = H * 1.13, cw = ch * pb.w / pb.h; ctx.drawImage(pb.img, (W - cw) / 2, -H * 0.044, cw, ch); dim(0.78); } else { drawBg(); dim(0.6); } }   // 整個畫面都在當鋪裡(不再是竹林)
  title('聚寶當鋪', 52, 44);
  { const w0 = numText(save.coins.toLocaleString(), W - 22, 78, 18, 'gold', 'right'); drawIcon('ico_coin', W - 22 - w0 - 13, 78, 22); } ctx.textAlign = 'center';
  ui.push({ x: 0, y: top, w: W, h: SH, act: 'pwsel:none' });   // 點空白處取消選取
  // 舞台(固定 4:3)
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, SH); ctx.clip();
  const bg = spr('bg_pawn');
  if (bg) ctx.drawImage(bg.img, 0, top, W, SH);
  else { const gr = ctx.createLinearGradient(0, top, 0, top + SH); gr.addColorStop(0, '#3a2414'); gr.addColorStop(0.7, '#2a1a0e'); gr.addColorStop(0.72, '#4a2e18'); gr.addColorStop(1, '#2a180c'); ctx.fillStyle = gr; ctx.fillRect(0, top, W, SH);
    ctx.fillStyle = '#5a3018'; ctx.fillRect(170, top + 150, 360, 112); ctx.fillStyle = '#2a160a'; for (let i = 0; i < 5; i++) ctx.fillRect(178 + i * 70, top + 158, 62, 96); }
  const DICE = { 5: [0, 1, 2, 3, 4], 4: [0, 1, 3, 4], 3: [0, 2, 4], 2: [0, 4], 1: [2] };   // 骰子五點：四角＋中央，少於 5 件時挑對稱的位置
  const PXY = [[96, 195], [268, 195], [182, 290], [96, 385], [268, 385]];
  const SXA = [209, 279, 349, 419, 489], SX = i => SXA[i], SY = top + 214, OS = bg ? 80 : 62, n = P.shelf.length, off = Math.floor((5 - n) / 2);
  P.shelf.forEach((o, i) => {
    const sel = S.pawnSel === i, x = bg ? PXY[(DICE[n] || DICE[5])[i]][0] : SX(i + off), y = bg ? PXY[(DICE[n] || DICE[5])[i]][1] : SY, fy = y + OS * 0.45;
    if (bg) {   // 展示座＋接觸陰影
      if (!drawIcon('ui_pedestal', x, fy + 6, OS * 1.35)) { const sg = ctx.createRadialGradient(x, fy, 0, x, fy, OS * 0.6); sg.addColorStop(0, 'rgba(8,3,0,.7)'); sg.addColorStop(1, 'rgba(8,3,0,0)');
        ctx.save(); ctx.translate(x, fy); ctx.scale(1, 0.22); ctx.translate(-x, -fy); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, fy, OS * 0.6, 0, 6.283); ctx.fill(); ctx.restore(); } }
    const oa = spr(OLD[o.t].id + (o.peek ? 'w' : '')) || spr(OLD[o.t].id), iy = bg && oa ? fy - 2 - OS * oa.h / Math.max(oa.w, oa.h) / 2 : y;
    const dup = P.shelf.slice(0, i).filter(q => q.t === o.t).length, flip = bg && dup % 2 === 1;   // 同款第二件鏡像，加上依編號的固定微轉，看起來不是同一件
    const rot = bg ? (((o.id || i * 7) * 2654435761 >>> 0) % 9 - 4) * 0.012 : 0;
    ctx.save(); ctx.translate(x, iy); ctx.rotate(rot); if (flip) ctx.scale(-1, 1); ctx.translate(-x, -iy);
    if (sel) { ctx.save(); ctx.shadowColor = `rgba(255,214,120,${0.75 + Math.sin(AT * 5) * 0.2})`; ctx.shadowBlur = 12 * view.s * view.d; oldIcon(o, x, iy, OS); ctx.restore(); }
    oldIcon(o, x, iy, OS); ctx.restore(); ui.push({ x: x - (bg ? 44 : 32), y: y - (bg ? 48 : 34), w: bg ? 88 : 64, h: bg ? 96 : 68, act: 'pwsel:' + i });
    if (!bg) { ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 11px ${FONT}`; ctx.fillText(OLD[o.t].name, x, SY + 46); } });
  drawPawnNpc(bg ? 426 : 96, bg ? 500 : top + SH - 10, bg ? 300 : 272);
  if (P.hand && !bg) { const x = 470, y = top + SH - 70, sel = S.pawnSel === 'hand'; ctx.fillStyle = sel ? 'rgba(120,80,20,.85)' : 'rgba(20,12,6,.7)'; roundRect(x - 52, y - 52, 104, 112, 12); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd23a'; ctx.stroke();
    oldIcon(P.hand, x, y - 4, 70); ctx.fillStyle = '#ffd23a'; ctx.font = `bold 13px ${FONT}`; ctx.fillText('手上', x, y + 46); ui.push({ x: x - 52, y: y - 52, w: 104, h: 112, act: 'pwsel:hand' }); }
  // 對話泡泡(靠近掌櫃的頭)
  ctx.restore();
  /* ⚠️ FIXED: DO NOT OVERWRITE - 對話列定位(木牌對話列的所有座標只改這個常數) */
  const BUB = { x: 16, y: 92, chipX: 30 };   // 木牌對話列：名牌標明說話者
  if (S.pawnLine && bg) {   // 古風木牌對話列：和下方資訊欄同一套底板，掛「三娘」名牌＋右下短角指向她
    ctx.font = `15px ${TFONT}`; const bw = W - 32, lines = wrapLines(S.pawnLine.txt, bw - 40), bh = 22 + lines.length * 21, bx = BUB.x, by = BUB.y;
    plate(bx, by, bw, bh, 10);
    ctx.fillStyle = '#7e3324'; roundRect(BUB.chipX, by - 10, 58, 22, 9); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#e8c26a'; ctx.stroke();
    ctx.font = `13px ${TFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9c8'; ctx.fillText('三娘', BUB.chipX + 29, by + 1);
    ctx.font = `15px ${TFONT}`; ctx.textAlign = 'left'; ctx.fillStyle = '#f3e6cf'; lines.forEach((l, i) => ctx.fillText(l, bx + 20, by + 25 + i * 21)); ctx.textAlign = 'center';
  } else if (S.pawnLine) {
    ctx.font = `15px ${TFONT}`; const lines = wrapLines(S.pawnLine.txt, 220), bh = 18 + lines.length * 21, bx = 150, by = top + 14;
    ctx.fillStyle = 'rgba(255,248,232,.95)'; roundRect(bx, by, 244, bh, 12); ctx.fill(); ctx.beginPath();
    ctx.moveTo(bx + 16, by + bh - 6); ctx.lineTo(bx - 14, by + bh + 26); ctx.lineTo(bx + 40, by + bh - 2); ctx.fill();
    ctx.fillStyle = '#4a1a10'; ctx.font = `15px ${TFONT}`; ctx.textAlign = 'left'; lines.forEach((l, i) => ctx.fillText(l, bx + 12, by + 19 + i * 21)); ctx.textAlign = 'center'; }

  // 選中的舊物
  const o = pawnSel(), inHand = S.pawnSel === 'hand';
  plate(16, 504, W - 32, 58, 12);
  if (P.hand && bg) {   // 手上的舊物：放在資訊欄右側的小格
    const hx = 352, hy = 533, hs = S.pawnSel === 'hand';
    ctx.fillStyle = hs ? 'rgba(120,80,20,.9)' : 'rgba(10,6,3,.55)'; roundRect(hx - 25, hy - 25, 50, 50, 8); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = hs ? '#ffd23a' : '#8a6a3a'; ctx.stroke();
    oldIcon(P.hand, hx, hy + 1, 42);
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 10px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('手上', hx, hy - 31);
    ui.push({ x: hx - 27, y: hy - 27, w: 54, h: 54, act: 'pwsel:hand' });
  }
  ctx.textBaseline = 'middle';
  if (o) { const d = OLD[o.t]; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 19px ${TFONT}`; ctx.fillText(d.name + (inHand ? '(手上)' : ''), 32, 522);
    ctx.fillStyle = '#ddd'; ctx.font = `14px ${FONT}`; ctx.fillText(`價格 ${d.p.toLocaleString()} 銅錢`, 32, 546);
    ctx.textAlign = 'right'; ctx.font = `bold 14px ${FONT}`;
    if (o.lamp) { ctx.fillStyle = '#ffd23a'; ctx.fillText('寶氣 ' + '★'.repeat(o.lamp) + '☆'.repeat(5 - o.lamp), W - 30, 522); }
    if (o.peek) { const c = o.out ? o.out - 1 : o.fake ? o.fake - 1 : -1; ctx.fillStyle = c < 0 ? '#999' : RCOL[c]; ctx.fillText(c < 0 ? '縫裡沒有光' : '縫裡透出' + PEEK_N[c], W - 30, 546); } }
  else { ctx.textAlign = 'center'; ctx.fillStyle = '#d8c7a0'; ctx.font = `bold 16px ${FONT}`; if (P.hand) { ctx.textAlign = 'left'; ctx.font = `bold 14px ${FONT}`; ctx.fillText('點「手上」的舊物', 32, 522); ctx.fillText('可以打開或賣回', 32, 546); ctx.textAlign = 'center'; } else ctx.fillText('點架上的舊物看看(手上同時只能有一件)', W / 2, 533); }
  ctx.textAlign = 'center';
  const dis = !o;
  btn(16, 570, 164, 52, '聽她說', 'pwtalk', { bg: '#4a3b2a', size: 17, disabled: dis });
  if (o && o.lamp) btn(188, 570, 164, 52, '已掂量', 'noop', { bg: '#555', size: 17, disabled: true });
  else if (inHand) btn(188, 570, 164, 52, '掂量(限架上)', 'noop', { bg: '#555', size: 14, disabled: true });
  else costBtn(188, 570, 164, 52, '掂量', o ? pawnCost(o, 0.03) : null, 'pwlamp', { bg: '#3a5570', size: 17, disabled: dis || !!P.hand || save.coins < pawnCost(o, 0.03) });
  if (o && o.peek) btn(360, 570, 164, 52, '已掀角', 'noop', { bg: '#555', size: 17, disabled: true });
  else if (!inHand) btn(360, 570, 164, 52, '掀角(買後)', 'noop', { bg: '#555', size: 15, disabled: true });
  else costBtn(360, 570, 164, 52, '掀角', o ? pawnCost(o, 0.1) : null, 'pwpeek', { bg: '#54406a', size: 17, disabled: dis || save.coins < pawnCost(o, 0.1) });
  if (inHand) { costBtn(16, 630, 200, 58, '賣回', pawnSellVal(P.hand), 'pwsell', { bg: '#b08020', size: 18 }); btn(224, 630, 300, 58, '確認劈開', 'pwopen', { bg: '#c0392b', size: 24, border: '#ffd700' }); }
  else costBtn(16, 630, 508, 58, '買下', o ? OLD[o.t].p : null, 'pwbuy', { bg: '#a0731a', size: 22, disabled: dis || save.coins < (o ? OLD[o.t].p : 0) || !!P.hand });
  // 換一批、機率
  // 換一批免費時用古銅金，不和開山輪的主紅搶視覺
  const free = pawnFree();
  if (free) btn(16, 698, 250, 50, '換一批(免費)', 'pwre', { bg: '#6a4a20', size: 19 });
  else costBtn(16, 698, 250, 50, '換一批', OLD[0].p * 2, 'pwre', { bg: '#4a3b2a', size: 18, disabled: save.coins < OLD[0].p * 2 });
  if (!free) { const left = Math.ceil((PAWN_CD - (Date.now() - P.t)) / 1000); ctx.fillStyle = '#cfc6b8'; ctx.font = `13px ${FONT}`; ctx.fillText(`免費換一批：${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 141, 760); }
  btn(274, 698, 250, 50, '機率公開', 'pwprob', { bg: '#31484e', size: 19 });
  // 首領掉落的舊物
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffd98a'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(`首領掉落的舊物(${P.bag.length}/10${P.bag.length ? '，點一下拿到手上' : '，打贏關卡首領有機會撿到'})`, 22, 784); ctx.textAlign = 'center';
  for (let i = 0; i < 10; i++) {   // 10 格凹槽：空格也畫置灰框
    const x = 40 + i * 50, y = 812;
    ctx.fillStyle = 'rgba(0,0,0,.34)'; roundRect(x - 23, y - 23, 46, 46, 8); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = P.bag[i] ? '#8a6a3a' : 'rgba(122,96,58,.45)'; ctx.stroke();
    if (P.bag[i]) { oldIcon(P.bag[i], x, y, 38); ui.push({ x: x - 24, y: y - 24, w: 48, h: 48, act: 'pwbag:' + i }); }
  }
  // 我的戰績
  ctx.fillStyle = '#cfc6b8'; ctx.font = `13px ${FONT}`; ctx.fillText(`戰績：開了 ${P.st.n} 件・花費 ${P.st.spent.toLocaleString()}・回收 ${P.st.got.toLocaleString()}・最大一刀 ${(P.st.best || 0).toLocaleString()}`, W / 2, 848);
  btn(W / 2 - 100, 870, 200, 56, '返回', 'pwback', { bg: '#4a3b2a', size: 22 });
  if (DEBUG_MODE) btn(10, 10, 60, 36, '測試', 'pwdev', { bg: '#333', size: 15 });
  if (S.pawnProb) drawPawnProb();
  if (S.pawnDev) drawPawnDev();
  if (S.pawnHand && P.hand && !S.pawnCut && !S.pawnRes) drawPawnHand();
  if (S.pawnCut) drawPawnCut();
}
function drawPawnHand() {   // 手上寶箱專屬畫面(買下後自動開啟；未賣回/劈開前鎖住其他操作)
  const o = save.pawn.hand, d = OLD[o.t];
  ui.push({ x: 0, y: 0, w: W, h: H, act: 'noop' });
  ctx.fillStyle = 'rgba(8,4,2,.82)'; ctx.fillRect(0, 0, W, H);
  plate(36, 150, W - 72, 640, 16);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8'; ctx.font = `900 26px ${TFONT}`; ctx.fillText(d.name, W / 2, 196);
  ctx.fillStyle = '#ddd'; ctx.font = `15px ${FONT}`; ctx.fillText(`買入價 ${d.p.toLocaleString()} 銅錢`, W / 2, 228);
  const bob = Math.sin(AT * 2.2) * 5;
  oldIcon(o, W / 2, 372 + bob, 190);
  let iy = 492;
  if (o.lamp) { ctx.fillStyle = '#ffd23a'; ctx.font = `bold 17px ${FONT}`; ctx.fillText('寶氣 ' + '★'.repeat(o.lamp) + '☆'.repeat(5 - o.lamp) + ' (僅供參考)', W / 2, iy); iy += 30; }
  if (o.peek) { const c = o.out ? o.out - 1 : o.fake ? o.fake - 1 : -1; ctx.fillStyle = c < 0 ? '#999' : RCOL[c]; ctx.font = `bold 17px ${FONT}`; ctx.fillText(c < 0 ? '縫裡沒有光……' : '縫裡透出' + PEEK_N[c] + '！', W / 2, iy); }
  else { ctx.fillStyle = '#cfc6b8'; ctx.font = `14px ${FONT}`; ctx.fillText('掀角看光再決定，或是直接劈開見真章', W / 2, iy); }
  if (o.peek) btn(60, 584, 200, 54, '已掀角', 'noop', { bg: '#555', size: 17, disabled: true });
  else costBtn(60, 584, 200, 54, '掀角', pawnCost(o, 0.1), 'pwpeek', { bg: '#54406a', size: 18, disabled: save.coins < pawnCost(o, 0.1) });
  costBtn(280, 584, 200, 54, '賣回', pawnSellVal(o), 'pwsell', { bg: '#b08020', size: 18 });
  btn(60, 652, 420, 62, '確認劈開', 'pwopen', { bg: '#c0392b', size: 25, border: '#ffd700' });
  btn(W / 2 - 90, 728, 180, 44, '先放著(回當鋪)', 'pwhvx', { bg: '#4a3b2a', size: 15 });
}
function drawPawnProb() {   // 機率公開
  ui.push({ x: 0, y: 0, w: W, h: H, act: 'pwprob' });
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H); plate(14, 150, W - 28, 560, 16);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe9a8'; ctx.font = `900 24px ${TFONT}`; ctx.fillText('翻舊物・機率公開', W / 2, 184);
  ctx.fillStyle = '#ddd'; ctx.font = `13px ${FONT}`; ctx.fillText(mythOpen() ? '目前：神話已開放(主線全通)' : '目前：神話未開放(主線全通後，古墓陪葬匣、皇陵密匣才開得出神話)', W / 2, 210);
  const T = mythOpen() ? OLD_PM : OLD_P, cols = ['垮了', '凡品', '良品', '精品', '極品', '傳說', '神話'], cx0 = 132, cw = 56;
  ctx.font = `bold 13px ${FONT}`; cols.forEach((c, j) => { ctx.fillStyle = j ? RCOL[j - 1] : '#aaa'; ctx.fillText(c, cx0 + j * cw, 244); });
  OLD.forEach((d, i) => { const y = 280 + i * 44; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 13px ${FONT}`; ctx.fillText(d.name, 26, y - 7); ctx.fillStyle = '#bbb'; ctx.font = `11px ${FONT}`; ctx.fillText(d.p.toLocaleString() + ' 銅錢', 26, y + 9);
    ctx.textAlign = 'center'; ctx.font = `12px ${FONT}`; T[i].forEach((p, j) => { ctx.fillStyle = p ? '#fff' : '#666'; ctx.fillText(p ? (p >= 1 ? p.toFixed(2) : p.toFixed(3)) + '%' : '—', cx0 + j * cw, y); }); });
  ctx.fillStyle = '#cfc6b8'; ctx.font = `13px ${FONT}`; ctx.textAlign = 'center';
  ['每一件舊物上架時就決定好結果；不掂不掀直接劈開，長期回收率 87%。', '開出裝備時部位隨機(六個部位機率相同)，可收進行囊或賣給掌櫃。', `掌櫃收購價：凡品 ${OLD_VAL[0].toLocaleString()}、良品 ${OLD_VAL[1].toLocaleString()}、精品 ${OLD_VAL[2].toLocaleString()}、極品 ${OLD_VAL[3].toLocaleString()}`, `傳說 ${OLD_VAL[4].toLocaleString()}、神話 ${OLD_VAL[5].toLocaleString()} 銅錢；傳說以上附 1 個古物秘技(6 種機率相同)。`,
   '掂量(3%，限架上)：寶氣僅供參考——95% 機率隨機亂跳(各星均等)，', '只有 5% 反映真實分量。買價固定，不因寶氣改變。', '掀角(10%，買下後)：看品級光；垮了的有 25% 是鍍金假貨，會透出假光。', '賣回：沒掀 80%；掀過沒光 40%、有光＝品級估價 8 折(最高原價 1.5 倍)。', '只能用銅錢，不能交易。各玩法經精算，回收率介於 87%～93% 之間。'].forEach((t, i) => ctx.fillText(t, W / 2, 500 + i * 22));
  ctx.fillStyle = '#9fd8ff'; ctx.fillText('點任意處關閉', W / 2, 692);
}
function drawPawnDev() {   // 測試版開發者面板(網址加 ?dev=1)
  const B = [['送 1000 萬銅錢', 'pwd:cu'], ['馬上補貨', 'pwd:re'], ['下一件必出最高品級', 'pwd:top'], ['下一件必垮', 'pwd:junk'], ['六部位鑲上古物秘技', 'pwd:relic'], ['戴秘技進戰鬥', 'pwd:fight']];
  plate(10, 50, 250, 30 + B.length * 46, 12); B.forEach(([l, a], i) => btn(20, 64 + i * 46, 230, 40, l, a, { bg: '#2a2a3a', size: 15 }));
}
function drawPawnCut() {   // 開山輪劈開動畫 → 結果
  const C = S.pawnCut; C.t += 1 / 60; ui.push({ x: 0, y: 0, w: W, h: H, act: 'noop' });
  ctx.fillStyle = 'rgba(8,4,2,.88)'; ctx.fillRect(0, 0, W, H);
  const T = 1.3, x = W / 2, y = 360;
  if (C.t < T + 0.35) {
    const sp = 4 + C.t * C.t * 40; C.ang = (C.ang || 0) + sp / 60;
    const art = !!spr('cut_body');
    const dive = clamp((C.t - 0.35) / 0.25, 0, 1) * 55 - (C.t > T ? clamp((C.t - T) / 0.2, 0, 1) * 55 : 0);   // 鋸片下降咬進舊物，劈開後回彈
    const grind = art && C.t > 0.62 && C.t < T;
    const hy = (art ? 330 + dive + (grind ? rr(-1.5, 1.5) : 0) : y), WR = art ? 180 : 210, boxX = art ? 250 : x, boxY = art ? 482 : y + 150;
    if (art) drawIcon('cut_body', 299, 484, 456); else { ctx.fillStyle = '#4a2a14'; roundRect(x - 170, y + 20, 340, 160, 14); ctx.fill(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 6, y - 10, 12, 60); }
    const shk = C.t > 0.4 && C.t < T ? rr(-3, 3) : 0;
    if (C.t < T) oldIcon(C.o, boxX + shk, boxY, art ? 108 : 120);
    ctx.save(); ctx.translate(x, hy); ctx.rotate(C.ang);
    if (!drawIcon('cut_wheel', 0, 0, WR)) { ctx.fillStyle = '#b8862a'; ctx.beginPath(); for (let k = 0; k < 24; k++) { const a1 = k / 24 * 6.283, a2 = (k + 0.5) / 24 * 6.283; ctx.lineTo(Math.cos(a1) * 104, Math.sin(a1) * 104); ctx.lineTo(Math.cos(a2) * 90, Math.sin(a2) * 90); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6a4a14'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.283); ctx.fill(); }
    ctx.restore();
    if (!drawIcon('cut_guard', x, art ? 296 : y - 50, art ? 198 : 250)) { ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.arc(x, y, 118, Math.PI, 0); ctx.lineTo(x + 100, y); ctx.arc(x, y, 100, 0, Math.PI, true); ctx.closePath(); ctx.fill(); }
    if (grind && Math.random() < 0.45) burst(boxX + rr(-8, 14), hy + 76, '#d8bc8a', 2, 210);
    if ((art ? grind : C.t > 0.4 && C.t < T)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const f = 0.6 + Math.random() * 0.6; if (!drawIcon('fx_sawspark', art ? boxX + 12 : x + 50, art ? hy + 82 : y + 110, (art ? 135 : 160) * f)) { ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x, y + 104); ctx.lineTo(x + rr(20, 120), y + 104 - rr(10, 90)); ctx.stroke(); } } ctx.restore(); }
    if (C.t >= T) { const k = (C.t - T) / 0.35; if (!C.cracked) { C.cracked = true; sfx('crack'); S.shake = 10; } ctx.save(); ctx.globalAlpha = 1 - k * 0.5; if (!drawIcon('fx_debris', boxX, boxY, 160 + k * 260)) burst(boxX, boxY, '#c89a6a', 2, 300); ctx.restore(); }
    if (C.t >= T + 0.34 && !S.pawnRes) pawnReveal();
    return;
  }
  if (!S.pawnRes) pawnReveal();
  const R = S.pawnRes; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (R.junk) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; drawIcon('fx_dust', x, 380, 360); ctx.restore();
    if (!drawIcon('junk', x, 380, 200)) { ctx.fillStyle = '#6a5a4a'; ctx.font = `900 60px ${TFONT}`; ctx.fillText('破銅爛鐵', x, 380); }
    title(R.fake ? '鍍金假貨！' : '垮了…', 220, 54); ctx.fillStyle = '#ffb08a'; ctx.font = `bold 20px ${FONT}`; ctx.fillText(`一堆破銅爛鐵，${R.price.toLocaleString()} 銅錢打水漂`, x, 520);
    btn(W / 2 - 120, 600, 240, 64, '再接再厲', 'pwok', { bg: '#4a3b2a', size: 24 });
  } else {
    const rc = RCOL[R.r], gl = ctx.createRadialGradient(x, 360, 10, x, 360, 220); gl.addColorStop(0, rc + 'aa'); gl.addColorStop(1, rc + '00'); ctx.fillStyle = gl; ctx.fillRect(0, 140, W, 440);
    if (R.r >= 4) { ctx.save(); ctx.translate(x, 360); ctx.rotate(AT * 0.5); ctx.globalCompositeOperation = 'lighter'; drawIcon('fx_evoburst', 0, 0, 440); ctx.restore(); }
    const sc = 1 + Math.max(0, 0.3 - (C.t - T - 0.35)) * 1.5;
    if (!drawIcon(R.key, x, 360, 180 * sc)) { ctx.fillStyle = rc; ctx.font = `900 90px ${TFONT}`; ctx.fillText(gslot(R.key).ch, x, 360); }
    title(R.r >= 5 ? '神物出世！' : R.r >= 4 ? '大漲！' : R.val >= R.price * 1.2 ? '漲了！' : '小賺', 200, 54);
    ctx.fillStyle = rc; ctx.font = `900 28px ${FONT}`; ctx.fillText(`${RAR[R.r]}・${gname(R.key)}` + (R.isNew ? '　NEW!' : ''), x, 484);
    ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 17px ${FONT}`; ctx.fillText(`掌櫃收購價 ${R.val.toLocaleString()} 銅錢(舊物 ${R.price.toLocaleString()})`, x, 516);
    let yb = 548;
    if (R.relic) { const d = relicDef(R.relic), g = gslot(R.key), old = save.relic[g.k]; ctx.fillStyle = 'rgba(90,20,20,.9)'; roundRect(40, yb - 6, W - 80, 58, 12); ctx.fill(); ctx.strokeStyle = '#ff9a7a'; ctx.lineWidth = 2; ctx.stroke();
      drawIcon('sk_' + d.icon, 76, yb + 23, 40); ctx.textAlign = 'left'; ctx.fillStyle = '#ffd0c0'; ctx.font = `bold 16px ${FONT}`; ctx.fillText(`古物秘技「${d.name}」：${g.name}屬性 +20%`, 104, yb + 12); ctx.fillStyle = '#ddd'; ctx.font = `12px ${FONT}`; ctx.fillText(d.d + (old ? `(目前已有「${relicDef(old).name}」)` : ''), 104, yb + 34); ctx.textAlign = 'center'; yb += 66; }
    const old = R.relic && save.relic[gslot(R.key).k];
    if (old) { btn(30, yb, 236, 58, '收進行囊(保留舊秘技)', 'pwkeep', { bg: '#2f6a4a', size: 15 }); btn(274, yb, 236, 58, '收進行囊(換新秘技)', 'pwkeep2', { bg: '#a0281e', size: 15 }); yb += 66; }
    else { btn(30, yb, 236, 58, R.isNew ? '收進行囊' : '收下(換成玄鐵)', 'pwkeep', { bg: '#2f6a4a', size: 18 }); }
    costBtn(old ? 30 : 274, yb, old ? 480 : 236, 58, '賣給掌櫃', R.val, 'pwsellg', { bg: '#a0731a', size: 17 });
  }
}

// ---------- 輸入 ----------
let upBack = 'title';
const SUBS = ['upgrade', 'bag', 'gacha', 'daily', 'account', 'shop', 'pass', 'achv', 'forge', 'skins', 'settings', 'idle', 'mail', 'event', 'pawn'];
function toLogical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function doAct(a) {
  ui = [];   // 畫面切換後舊按鈕失效，等下一幀重建
  sfx('click');
  if (a.startsWith('locked:')) { const k = a.slice(7); toast(`通關 ${featNeed(k)} 後開啟「${FNAME[k]}」`); return; }
  if (FEAT[a] !== undefined && !featOpen(a)) { toast(`通關 ${featNeed(a)} 後開啟「${FNAME[a]}」`); return; }
  if (a === 'first') { S.wantHard = false; S.wantSub = 0; startStage(0); return; }
  const fromResult = S.mode === 'result' || S.mode === 'play';
  if (a === 'map' && !save.guide.map) S.guide = 'map';
  if (a === 'map') { S.mode = 'map'; S.paused = false; S.cls = clsView(save.cls); S.mapHard = fromResult && !S.endless ? !!S.hard : !!S.mapHard; S.mapCh = fromResult && !S.endless ? STAGES[S.stage].ch : Math.floor(Math.min(S.mapHard ? save.hard.cleared : save.cleared, STAGES.length - 1) / 10); }
  else if (a === 'title') { S.mode = 'title'; S.paused = false; }
  else if (SUBS.includes(a)) {
    if (!save.guide[a] && GUIDES[a]) S.guide = a;
    if (a === 'pass') S.passPage = undefined;
    if (a === 'mail') S.mailPage = 0;
    if (!SUBS.includes(S.mode)) upBack = S.mode === 'result' ? 'map' : S.mode;
    S.mode = a; S.gres = null; S.pres = null; if (a === 'bag') S.bagSel = null; if (a === 'gacha') petStarter(); if (a === 'pawn') { S.pawnWait = 0; const pc = CHUNKS.find(c => c.file === 'assets_pawn.js'); if (pc) loadChunk(pc); pawnEnter(); }
  }
  else if (a === 'back') { S.mode = upBack; S.gres = null; S.pres = null; }
  else if (a === 'gok') { if (S.guide) { save.guide[S.guide] = true; persist(); } S.guide = null; }
  else if (a === 'endless') { if (save.cleared >= 10) startEndless(); }
  else if (a === 'trials') { wkCheck(); S.mode = 'trials'; S.result = null; }
  else if (a === 'tower') { if (save.cleared >= 10) startTower(); }
  else if (a === 'weekly') { if (save.cleared >= 10) startWeekly(); }
  else if (a === 'wad') { wkCheck(); if (!save.weekly.adUsed) showAd(() => { save.weekly.adUsed = true; persist(); toast('今日挑戰次數 +1'); }, 'weekly'); }
  else if (a === 'starup') {
    const id = save.cls, st = starOf(id);
    if (st >= STAR_MAX) toast('已經滿星了');
    else if (!starReady(id)) toast(`需要 ${clsById(id).name}碎片 ${STAR_FRAG[st]} 個、銅錢 ${STAR_COIN[st].toLocaleString()}`);
    else showForm({ title: '職業升星', ok: '升星',
      desc: `${clsById(id).name}　★${st} → ★${st + 1}\n攻擊 +8%、射速 +4%\n\n消耗：碎片 ${STAR_FRAG[st]}、銅錢 ${STAR_COIN[st].toLocaleString()}`,
      async onOk() { save.frag[id] -= STAR_FRAG[st]; save.coins -= STAR_COIN[st]; save.star[id] = st + 1; track('upgrade'); persist(); sfx('win'); return `${clsById(id).name}升到 ★${st + 1}！`; } });
  }
  else if (a.startsWith('skin:')) { save.skins.eq[save.cls] = a.slice(5) || null; S.cls = clsView(save.cls); persist(); sfx('up'); toast('已換上時裝'); }
  else if (a.startsWith('skinbuy:')) {
    const k = SKINS.find(x => x.id === a.slice(8));
    if (k && save.gems >= k.price) showForm({ title: '購買時裝', ok: `元寶 ${k.price}`, desc: `${k.name}\n${k.desc}\n\n購買後自動換上`,
      async onOk() { save.gems -= k.price; save.skins.own[k.id] = true; save.skins.eq[k.cls] = k.id; S.cls = clsView(save.cls); persist(); sfx('win'); return `獲得時裝「${k.name}」`; } });
  }
  else if (a === 'idle_get' || a === 'idle_ad') {
    clockGuard(); const amt = idleAmt(), give = m => { idleGive(amt, m); save.idle.t = nowT(); persist(); sfx('win'); toast(`獲得 銅錢 ${(amt.c * m).toLocaleString()}・碎片 ${amt.f * m}`); };
    if (idleHours() >= 1 / 60) { if (a === 'idle_ad') showAd(() => give(2), 'idle'); else give(1); }
  }
  else if (a === 'idle_quick') {
    if (idleQuickLeft() > 0 && save.gems >= 50) { const amt = idleAmt(2); save.gems -= 50; if (save.idle.quick.d !== today()) save.idle.quick = { d: today(), n: 0 }; save.idle.quick.n++; idleGive(amt); persist(); sfx('win'); toast(`獲得 銅錢 ${amt.c.toLocaleString()}・碎片 ${amt.f}`); }
  }
  else if (a === 'opt_bgm') { save.opt.bgm = !save.opt.bgm; persist(); }
  else if (a === 'opt_shake') { save.opt.shake = !save.opt.shake; persist(); }
  else if (a === 'opt_fx') { save.opt.fx = save.opt.fx === 'high' ? 'low' : 'high'; persist(); }
  else if (a === 'opt_guide') { save.guide = {}; save.tut = false; persist(); toast('新手引導已重置'); }
  else if (a.startsWith('apage:')) S.achvPage = clamp((S.achvPage || 0) + (+a.slice(6)), 0, Math.ceil(ACHV.length / 6) - 1);
  else if (a.startsWith('ach:')) { const A = ACHV.find(x => x.id === a.slice(4)); if (A && achvReady(A)) { const t = achvTier(A), g = A.rw[t]; save.achv[A.id] = t + 1; save.gems += g; if (t + 1 >= A.goals.length && !save.ttl) save.ttl = A.id; persist(); sfx('win'); toast(`獲得 元寶 ${g}` + (t + 1 >= A.goals.length ? `・稱號「${A.ttl}」` : '')); } }
  else if (a.startsWith('ttl:')) { save.ttl = a.slice(4); persist(); sfx('up'); toast(`已使用稱號「${ttlText()}」`); }
  else if (a.startsWith('ppage:')) { const L = passLv(), cur = S.passPage === undefined ? Math.min(4, Math.floor(Math.max(0, L - 1) / 6)) : S.passPage; S.passPage = clamp(cur + (+a.slice(6)), 0, 4); }
  else if (a.startsWith('pf:') || a.startsWith('pp:')) {
    const lv = +a.slice(3), P = passCheck(), prem = a[1] === 'p';
    if (lv <= passLv() && !(prem ? P.prem : P.free)[lv] && (!prem || P.premium)) { (prem ? P.prem : P.free)[lv] = true; const rw = prem ? PASS_PREM(lv) : PASS_FREE(lv); passGive(rw); persist(); sfx('up'); toast('獲得 ' + passRwText(rw)); }
  }
  else if (a === 'passall') { const n = passClaimAll(); if (n) { persist(); sfx('win'); toast(`領取了 ${n} 份獎勵`); } }
  else if (a === 'passbuy') buy('俠客令・進階', PASS.price, () => { passCheck().premium = true; return '進階俠客令已解鎖！之前等級的進階獎勵都可以補領'; }, SKU.pass);
  else if (a.startsWith('stab:')) S.shopTab = a.slice(5);
  else if (a.startsWith('bg:')) { const t = GEM_TIERS.find(t => t.id === a.slice(3)); if (t) buy(`元寶 ${t.g}`, t.p, () => { const first = !save.shop.first[t.id], n = first ? t.g * 2 : t.g + (t.b || 0); save.shop.first[t.id] = true; save.gems += n; return `獲得 元寶 ${n}`; }, SKU[t.id]); }
  else if (a.startsWith('bp:')) { const id = a.slice(3), P = PACKS[id]; if (P) buy(P.name, P.p, () => { if (id !== 'stuck') save.shop.packs[id] = true; grantPack(id); return `獲得 ${P.name}`; }, SKU[id]); }
  else if (a.startsWith('bx:')) { const P = XT_PACKS.find(q => q.id === a.slice(3)); if (P && !xtBought(P.id)) buy(P.name, P.p, () => { save.shop.xtw[P.id] = weekNo(); save.xt += P.xt; save.gems += P.g; save.coins += P.c || 0; return `獲得 玄鐵 ${P.xt}` + (P.g ? `・元寶 ${P.g}` : '') + (P.c ? `・銅錢 ${P.c.toLocaleString()}` : ''); }, SKU[P.id]); }
  else if (a.startsWith('cu:')) { const n = +a.slice(3); if (save.gems >= n) { save.gems -= n; save.coins += n * CU_RATE; logEv('gem_cu', { n }); persist(); sfx('up'); toast(`獲得 銅錢 ${(n * CU_RATE).toLocaleString()}`); } else toast('元寶不夠'); }
  else if (a === 'mbuy') buy('俠客月卡', MONTH.p, () => { save.gems += MONTH.now; save.shop.monthEnd = addDays(monthActive() ? save.shop.monthEnd : today(), monthActive() ? MONTH.days : MONTH.days - 1); return `月卡開通！獲得 元寶 ${MONTH.now}`; }, SKU.month);
  else if (a === 'mclaim') { if (monthReady()) { save.shop.monthLast = today(); save.gems += MONTH.daily; save.xt += MONTH.xt; persist(); sfx('up'); toast(`獲得 元寶 ${MONTH.daily}・玄鐵 ${MONTH.xt}`); } }
  else if (a === 'adgem') { if (adLeft() > 0) showAd(() => { if (save.shop.ad.d !== today()) save.shop.ad = { d: today(), n: 0 }; save.shop.ad.n++; save.gems += AD_GEMS; persist(); toast(`獲得 元寶 ${AD_GEMS}`); }, 'gems'); }
  else if (a === 'addouble') { const r = S.result; if (r && !r.doubled) { r.doubled = true; showAd(() => { save.coins += r.coins; r.coins *= 2; persist(); toast('銅錢加倍！'); }, 'double'); } }
  else if (a === 'gooffer') { upBack = 'map'; S.mode = 'shop'; S.shopTab = 'packs'; }
  else if (a === 'rev_ad') showAd(doRevive, 'revive');
  else if (a === 'rev_gem') { if (save.gems >= REVIVE_GEMS) { save.gems -= REVIVE_GEMS; persist(); doRevive(); } }
  else if (a === 'rev_no') { S.revived = true; S.mode = 'play'; endRun(false); }
  else if (a.startsWith('mapch:')) S.subPick = null, S.mapCh = clamp((S.mapCh || 0) + (+a.slice(6)), 0, CHAPTERS.length - 1);
  else if (a.startsWith('pick:')) { if (S.pick && AT - S.pick.at > 0.35) pickSkill(a.slice(5)); }
  else if (a.startsWith('mailget:')) { const m = mailList().find(m => m.id === a.slice(8)); if (claimMail(m)) { persist(); sfx('coin'); toast('獲得 ' + rwFull(m.rw || {})); } }
  else if (a === 'mailall') { const got = mailList().filter(m => claimMail(m)); if (got.length) { persist(); sfx('win'); toast(`領取了 ${got.length} 封信件的獎勵`); } }
  else if (a.startsWith('mpage:')) S.mailPage = Math.max(0, (S.mailPage || 0) + (+a.slice(6)));
  else if (a.startsWith('maphard:')) { S.mapHard = a.slice(8) === '1'; if (S.mapHard) { S.mapCh = Math.floor(Math.min(save.hard.cleared, STAGES.length - 1) / 10); if (!save.guide.hard) S.guide = 'hard'; } else S.mapCh = Math.floor(Math.min(save.cleared, STAGES.length - 1) / 10); }
  else if (a === 'login') { if (loginReady()) { const rw = LOGIN[save.login.n % 7]; giveRw(rw); save.login.n++; save.login.last = today(); passXp(40); persist(); sfx('up'); toast('獲得 ' + rwText(rw) + '・俠客令經驗 +40'); } }
  else if (a.startsWith('task:')) { const t = save.daily.tasks[+a.slice(5)]; if (t && !t.got && t.p >= t.n) { const rw = taskDef(t.id).rw; t.got = true; giveRw(rw); passXp(60); persist(); sfx('up'); toast('獲得 ' + rwText(rw) + '・俠客令經驗 +60'); } }
  else if (a === 'chest') { if (!save.daily.chest && save.daily.tasks.every(t => t.got)) { save.daily.chest = true; giveRw(DAILY_CHEST); addFrag(save.cls, 5); persist(); sfx('win'); toast('獲得 ' + rwText(DAILY_CHEST) + `・${clsById(save.cls).name}碎片 +5`); } }
  else if (a === 'acc_bind') ACCT.bind();
  else if (a === 'acc_login') ACCT.login();
  else if (a === 'acc_logout') ACCT.logout();
  else if (a === 'acc_del') ACCT.del();
  else if (a === 'acc_sync') { cloudSync().then(() => toast(CLOUD.status === 'ok' ? '同步完成' : '同步失敗')); }
  else if (a === 'pull1') pullPet(1);
  else if (a === 'pull10') pullPet(10);
  else if (a === 'pullg1') pullGear(1);
  else if (a === 'pullg10') pullGear(10);
  else if (a.startsWith('gtab:')) { S.gtab = a.slice(5); S.pres = null; }
  else if (a.startsWith('gslot:')) { S.bagSlot = a.slice(6); S.bagSel = null; }
  else if (a === 'baggear') { S.mode = 'bag'; S.bagTab = 'gear'; S.pres = null; }
  else if (a === 'pclose') S.pres = null;
  else if (a === 'autoup') autoUpgrade();
  else if (a.startsWith('legal:')) showLegal(a.slice(6));
  else if (a.startsWith('btab:')) { S.bagTab = a.slice(5); if (S.bagTab === 'pet') { petStarter(); if (!save.guide.pets) { save.guide.pets = 1; } } }
  else if (a.startsWith('psel:')) S.petSel = a.slice(5);
  else if (a === 'pequip') { const id = S.petSel; if (id && petN(id)) { save.pet = id; persist(); sfx('up'); toast(`${petDef(id).name} 出戰！`); } }
  else if (a === 'synth') { S.mode = 'synth'; S.pres = null; if (!save.guide.synth) S.guide = 'synth'; }
  else if (a.startsWith('syn:')) { S.pres = null; synth(+a.slice(4)); }
  else if (a === 'petbook') { S.mode = 'petbook'; }
  else if (a === 'bagpet') { S.mode = 'bag'; S.bagTab = 'pet'; S.pres = null; S.gres = null; }
  else if (a === 'gclose') S.gres = null;
  else if (a.startsWith('gsel:')) S.bagSel = a.slice(5);
  else if (a === 'gequip') { const k = S.bagSel; if (k && save.gear[k]) { save.eq[gslot(k).k] = k; persist(); sfx('up'); } }
  else if (a === 'gup') { const k = S.bagSel, c = k && gUpCost(k); if (k && save.gear[k] < gcap(k) && save.coins >= c) { save.coins -= c; save.gear[k]++; track('upgrade'); persist(); sfx('up'); } }
  else if (a === 'pup') { const id = S.petSel || save.pet, c = id && pUpCost(id); if (id && petN(id) && petLv(id) < pcap(id) && save.coins >= c) { save.coins -= c; save.plv[id] = petLv(id) + 1; track('upgrade'); persist(); sfx('up'); } }
  else if (a === 'pbrk') { const id = S.petSel || save.pet; if (id && doPBrk(id)) { track('upgrade'); logEv('pet_brk', { id, b: pbr(id) }); persist(); sfx('win'); S.brkFx = { t: 0, key: 'pet_' + id, cap: pcap(id), pet: id }; } else if (id) toast(`同品級的靈寵不夠：去召喚閣多抽幾隻吧`); }
  else if (a === 'gtmp') { const k = S.bagSel, g = k && gslot(k); if (g && save.eq[g.k] === k && save.gear[k] >= GMAX && tmpLv(g.k) < TEMPER.max && save.xt >= tmpXt(g.k) && save.coins >= tmpCu(g.k)) { save.xt -= tmpXt(g.k); save.coins -= tmpCu(g.k); save.temper[g.k] = tmpLv(g.k) + 1; stat('temper'); logEv('gear_temper', { k: g.k, lv: save.temper[g.k] }); persist(); sfx('forge'); S.brkFx = { t: 0, key: k }; toast(`${g.name}淬鍊到第 ${save.temper[g.k]} 階！此部位 +${Math.round(save.temper[g.k] * TEMPER.per * 100)}%`); } }
  else if (a === 'gbrk') { const k = S.bagSel; if (k && doBrk(k)) { track('upgrade'); logEv('gear_brk', { k, b: gbr(k) }); persist(); sfx('win'); S.brkFx = { t: 0, key: k, cap: gcap(k) }; } else if (k) toast('玄鐵不夠：重複的裝備會變成玄鐵，去召喚閣試試吧'); }
  else if (a === 'pause') { S.paused = true; drag.on = false; }
  else if (a === 'resume') S.paused = false;
  else if (a === 'gopaid') { upBack = 'title'; S.mode = 'shop'; S.shopTab = 'packs'; toast('魔教傳人可在禮包購買'); }
  else if (a === 'retry') { S.wantHard = S.hard; S.wantSub = S.sub; startStage(S.stage); }
  else if (a === 'next') { S.wantHard = S.hard; if (S.sub < SUBN - 1) { S.wantSub = S.sub + 1; startStage(S.stage); } else { S.wantSub = 0; startStage(Math.min(STAGES.length - 1, S.stage + 1)); } }
  else if (a === 'mute') { save.mute = !save.mute; persist(); }
  else if (a.startsWith('cls:')) { save.cls = a.slice(4); S.cls = clsView(save.cls); persist(); }
  else if (a.startsWith('stage:')) { const si = +a.slice(6); S.subPick = null; S.wantHard = !!S.mapHard; S.wantSub = SUBN - 1; startStage(si); }
  else if (a.startsWith('sub:')) { const [i, k] = a.slice(4).split(':').map(Number); S.subPick = null; S.wantHard = !!S.mapHard; S.wantSub = k; startStage(i); }
  else if (a === 'subclose') S.subPick = null;
  else if (a === 'mstar') { const k = S.bagSel, g = k && gslot(k); if (g && grar(k) === 5 && (save.mess || 0) >= 1 && (save.mstar[g.k] || 0) < MYTH.starMax && save.coins >= mstarCost(g.k)) { save.coins -= mstarCost(g.k); save.mess -= 1; save.mstar[g.k] = (save.mstar[g.k] || 0) + 1; persist(); S.brkFx = { t: 0, key: k }; sfx('forge'); toast(`${gname(k)} 升到 ${save.mstar[g.k]} 星！`); } }
  else if (a.startsWith('pw')) pawnAct(a);
  else if (a === 'noop') {}
  else if (a.startsWith('buy:')) {
    const k = a.slice(4), u = UPS.find(u => u.k === k), c = upCost(k);
    if (u && save.up[k] < u.max && save.coins >= c) { save.coins -= c; save.up[k]++; track('upgrade'); persist(); sfx('up'); }
  }
}
function clickUI(p) {
  if (S.ad) return true;
  for (let i = ui.length - 1; i >= 0; i--) { const b = ui[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { doAct(b.act); return true; } }
  return false;
}
cv.addEventListener('pointerdown', e => {
  if (S.modal) return;
  e.preventDefault(); audioInit();
  const p = toLogical(e);
  if (clickUI(p)) return;
  if (S.mode !== 'play' || S.paused || S.pick) return;
  if (drag.on) return;   // 已經有一根手指在拖曳：第二根手指不搶
  drag.on = true; drag.pid = e.pointerId; drag.px0 = drag.px = p.x; drag.hx0 = S.hx;
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
});
cv.addEventListener('pointermove', e => { if (drag.on && e.pointerId === drag.pid) drag.px = toLogical(e).x; });
const endDrag = e => { if (e && e.pointerId !== undefined && drag.on && e.pointerId !== drag.pid) return; drag.on = false; };   // 只有拖曳中的那根手指放開才結束
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
window.addEventListener('keydown', e => {
  if (S.modal) { if (e.key === 'Escape') closeForm(); return; }
  audioInit();
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = true;
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true;
  else if (k === 'Enter' || k === ' ') {
    if (S.mode === 'title') doAct('map');
    else if (S.mode === 'map') { S.wantHard = false; S.wantSub = SUBN - 1; newRun(Math.min(save.cleared, STAGES.length - 1)); }
    else if (S.mode === 'result') { if (S.result && S.result.tower) startTower(); else if (!S.result || (!S.result.weekly && !S.result.endless)) { S.wantSub = S.sub; newRun(S.stage); } }
    else if (S.paused) S.paused = false;
  }
  else if (k === 'Escape' || k === 'p' || k === 'P') { if (S.mode === 'play') S.paused = !S.paused; }
});
window.addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.mode === 'play') S.paused = true;
  if (AU.ctx) { if (document.hidden) AU.ctx.suspend().catch(() => {}); else AU.ctx.resume().catch(() => {}); }   // 切到背景時停止聲音
  if (document.hidden && CLOUD.on && CLOUD.dirty && !CLOUD.busy) cloudPushSafe();
});
if (CLOUD.on) cloudSync();

// ---------- 主迴圈 ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); perfTick(now - last); last = now;
  if (Math.abs(Math.min(window.devicePixelRatio || 1, wantDmax()) - view.d) > 0.01) resize();
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- 測試介面 ----------
window.JH = {
  S, build: BUILD, STAGES,
  get save() { return save; }, CHUNKS, evToday, mailList, get evq() { return EVQ; }, EVENTS, set evOverride(v) { EV_OVERRIDE = v; }, chunkReady, startStage,
  pull: pullPet, pullPet, ownTotal, idleHours, clockGuard, synth, petBonus, PETS, hurt, grant, eqVal, track, dailyCheck, cloudSync, ACCT, get cloud() { return CLOUD; }, closeForm,
  start(stage = 0, cls, sub = SUBN - 1) { if (cls) save.cls = cls; S.wantSub = sub; newRun(stage); },
  step(dt) { update(dt); },
  draw, doAct, pawn: { oldMake, OLD, OLD_VAL, OLD_P, OLD_PM, sellVal: pawnSellVal },
  cmd(c) {
    if (c === 'god') { S.god = !S.god; return; }
    if (c === 'auto') { S.auto = !S.auto; return; }
    if (c === 'unlock') { save.cleared = STAGES.length; persist(); return; }
    if (c === 'hard') { save.cleared = STAGES.length; save.hard.cleared = STAGES.length; persist(); toast('困難模式全開(測試)'); return; }
    if (c === 'mail') { save.mail.got = {}; persist(); toast('信件已重置'); return; }
    if (c === 'coins') { save.coins += 5000; persist(); return; }
    if (c === 'gems') { save.gems += 1000; persist(); return; }
    if (c === 'guide') { save.guide = {}; persist(); toast('新手引導已重置'); return; }
    if (c === 't_brk') { ['wpn4', 'jad3', 'hlm2', 'bot1'].forEach(k => { if (!save.gear[k]) grant(k); save.gear[k] = Math.max(save.gear[k], 10); }); save.eq.wpn = 'wpn4'; save.eq.jad = 'jad3'; save.eq.hlm = 'hlm2'; save.eq.bot = 'bot1'; save.xt += 200; save.coins += 300000; persist(); S.mode = 'bag'; S.bagTab = 'gear'; S.bagSlot = 'wpn'; S.bagSel = 'wpn4'; toast('已送玄鐵 200、銅錢 30 萬，兵器已到 Lv10 可突破'); return; }
    if (c === 't_pet') { ['qinglong', 'baihu', 'fenghuang', 'qinglong', 'baihu'].forEach(id => { save.pets[id] = petN(id) + 1; save.petSeen[id] = 1; }); save.pet = 'qinglong'; save.plv.qinglong = 10; save.coins += 200000; persist(); S.mode = 'bag'; S.bagTab = 'pet'; S.petSel = 'qinglong'; toast('已送傳說靈寵 5 隻、銅錢 20 萬，青龍已到 Lv10 可突破'); return; }
    if (c === 't_xtshop') { S.mode = 'shop'; S.shopTab = 'xt'; return; }
    if (c === 't_tk') { save.tk.pet += 30; save.tk.gear += 30; persist(); S.mode = 'gacha'; S.gtab = 'gear'; toast('已送靈寵券、裝備券各 30 張'); return; }
    if (c === 't_gear6') { ['hlm0', 'hlm2', 'jad1', 'jad3', 'bot0', 'bot4', 'wpn2', 'arm1', 'art3'].forEach(k => grant(k)); persist(); S.mode = 'bag'; S.bagTab = 'gear'; S.bagSlot = 'jad'; S.bagSel = null; toast('已送新部位裝備：點六格切換部位'); return; }
    if (c === 't_cp') { save.coins += 50000; persist(); S.mode = 'upgrade'; toast('已送銅錢 50,000：按「一鍵強化」看戰力跳動'); return; }
    if (c === 't_cpbag') { save.coins += 50000; persist(); S.mode = 'bag'; S.bagTab = 'gear'; S.bagSel = null; toast('已送銅錢 50,000：按左下「一鍵強化」'); return; }
    if (c === 't_legal') { S.mode = 'settings'; showLegal('privacy'); return; }
    if (c === 't_syn') {   // 本次更新測試：直接觸發一種武學共鳴
      const sy = SYN[(JH.synK = ((JH.synK === undefined ? -1 : JH.synK) + 1) % SYN.length)];
      save.tut = true; save.guide.gate = true; newRun(Math.min(save.cleared, 6)); S.god = true; S.sk[sy.a] = 1; if (sy.a === 'shield') S.shieldT = 0.5;
      S.pick = { opts: [sy.b], at: -9 }; pickSkill(sy.b); toast(`測試共鳴：${sy.name}(${sy.d})`); return; }
    if (c === 't_synpick') { save.tut = true; save.guide.gate = true; newRun(Math.min(save.cleared, 6)); S.god = true; S.sk.frost = 1; S.sk.vamp = 1; S.pick = { opts: ['orbit', 'crit', 'atk'], at: -9 }; toast('選武學卡片：看「可共鳴」提示'); return; }
    if (c === 't_late') { save.tut = true; save.guide.gate = true; newRun(24); S.god = true; S.auto = true; S.units = 150; S.spread = 2; S.rate = 12; toast('後期壓力測試：150 分身＋散射滿＋攻速滿'); return; }
    if (c === 't_clock') { clockGuard(); save.idle.t = Date.now() - 6 * 3600e3; save.idle.seen = Date.now() + 3 * 3600e3; clockGuard(); persist(); S.mode = 'idle'; toast('模擬手機時間被往回撥 3 小時 → 掛機收益歸零'); return; }
    if (c === 'pets') { PETS.forEach(p => { save.pets[p.id] = petN(p.id) + 4; save.petSeen[p.id] = 1; }); persist(); toast('每種靈寵 +4'); return; }
    if (c === 'demon') { save.owned.demon = true; persist(); toast('已解鎖魔教傳人(測試)'); return; }
    if (c === 'idle') { save.idle.t = Date.now() - 5 * 3600e3; persist(); toast('掛機時間 +5 小時(測試)'); return; }
    if (c === 'frag') { CLASSES.forEach(c => addFrag(c.id, 100)); persist(); toast('每個職業碎片 +100'); return; }
    if (c === 'stats') { Object.assign(save.stats, { kills: 20000, wins: 120, bosses: 60, gates: 2000, barrels: 700, pulls: 250, maxUnits: 200 }); persist(); toast('成就進度已填滿'); return; }
    if (c === 'pxp') { passXp(1000); persist(); toast('俠客令經驗 +1000'); return; }
    if (c === 'offer') { save.shop.offer = Date.now() + 3600e3; save.shop.packs.stuckSeen = false; persist(); toast('已觸發限時禮包'); return; }
    if (c === 'kill') { if (S.mode === 'play') hurt(9999); return; }
    if (c === 'daily') { save.daily = null; save.login.last = ''; dailyCheck(); persist(); toast('每日已重置'); return; }
    if (c === 'reset') { save = defSave(); persist(); S.cls = clsView('sword'); S.mode = 'title'; return; }
    if (S.mode !== 'play') return;
    if (c === 'boss') { S.t = ST().len; S.enemies = []; S.gates = []; S.barrels = []; S.eshots = []; }
  }
};
})();

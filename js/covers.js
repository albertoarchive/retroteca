// Búsqueda automática de portadas en las miniaturas públicas de libretro
// (https://github.com/libretro-thumbnails). Se descarga el listado de cada consola una vez,
// se cachea en el navegador y se empareja el título del juego con el nombre de la carátula.
window.Covers = (function () {
  const OWNER = 'libretro-thumbnails';
  const REPOS = {
    nes: ['Nintendo_-_Nintendo_Entertainment_System'],
    snes: ['Nintendo_-_Super_Nintendo_Entertainment_System'],
    n64: ['Nintendo_-_Nintendo_64'],
    gb: ['Nintendo_-_Game_Boy', 'Nintendo_-_Game_Boy_Color'],
    gba: ['Nintendo_-_Game_Boy_Advance'],
    nds: ['Nintendo_-_Nintendo_DS'],
    vb: ['Nintendo_-_Virtual_Boy'],
    segaMS: ['Sega_-_Master_System_-_Mark_III'],
    segaMD: ['Sega_-_Mega_Drive_-_Genesis'],
    segaGG: ['Sega_-_Game_Gear'],
    sega32x: ['Sega_-_32X'],
    segaCD: ['Sega_-_Mega-CD_-_Sega_CD'],
    segaSaturn: ['Sega_-_Saturn'],
    psx: ['Sony_-_PlayStation'],
    pce: ['NEC_-_PC_Engine_-_TurboGrafx_16'],
    atari2600: ['Atari_-_2600'],
    atari7800: ['Atari_-_7800'],
    lynx: ['Atari_-_Lynx'],
    jaguar: ['Atari_-_Jaguar'],
    ws: ['Bandai_-_WonderSwan', 'Bandai_-_WonderSwan_Color'],
    ngp: ['SNK_-_Neo_Geo_Pocket', 'SNK_-_Neo_Geo_Pocket_Color'],
    coleco: ['Coleco_-_ColecoVision'],
    '3do': ['The_3DO_Company_-_3DO']
  };

  const memory = new Map(); // repo -> [nombres]

  // "Super Mario Bros. 3 (USA) (Rev 1)" -> "supermariobros3"
  function norm(s) {
    return s.toLowerCase()
      .replace(/[\(\[][^\)\]]*[\)\]]/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
  }

  // Preferimos versiones europeas/españolas, luego mundiales y USA; penalizamos betas y demos.
  function score(name) {
    let s = 0;
    if (/spain/i.test(name)) s += 6;
    else if (/europe/i.test(name)) s += 5;
    else if (/world/i.test(name)) s += 4;
    else if (/usa/i.test(name)) s += 3;
    if (/beta|proto|demo|sample|kiosk|unl|pirate|hack/i.test(name)) s -= 8;
    if (/rev|alt/i.test(name)) s -= 1;
    return s;
  }

  async function getIndex(repo) {
    if (memory.has(repo)) return memory.get(repo);
    const key = 'covidx:' + repo;
    try {
      const cached = localStorage.getItem(key);
      if (cached) { const a = JSON.parse(cached); memory.set(repo, a); return a; }
    } catch (e) { /* sin localStorage: seguimos */ }

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/git/trees/master?recursive=1`);
    if (!res.ok) throw new Error('index ' + res.status);
    const data = await res.json();
    const names = (data.tree || [])
      .filter(t => t.path.startsWith('Named_Boxarts/') && t.path.endsWith('.png'))
      .map(t => t.path.slice('Named_Boxarts/'.length, -4));
    memory.set(repo, names);
    try { localStorage.setItem(key, JSON.stringify(names)); } catch (e) { /* demasiado grande: solo en memoria */ }
    return names;
  }

  function pick(names, title) {
    const key = norm(title);
    if (!key) return null;
    let c = names.filter(n => norm(n) === key);
    if (!c.length) c = names.filter(n => norm(n).startsWith(key)).sort((a, b) => norm(a).length - norm(b).length).slice(0, 8);
    if (!c.length) return null;
    return c.sort((a, b) => score(b) - score(a))[0];
  }

  // Devuelve {status:'ok', blob} | {status:'none'} | {status:'error'}
  async function find(game) {
    const repos = (REPOS[game.system] || []).slice();
    if (!repos.length) return { status: 'none' };
    const ext = ((game.fileName || '').split('.').pop() || '').toLowerCase();
    if (['gbc', 'wsc', 'ngc'].includes(ext)) repos.reverse(); // versión Color primero

    let failed = false;
    for (const repo of repos) {
      try {
        const names = await getIndex(repo);
        const name = pick(names, game.title) || pick(names, cleanTitle(game.fileName || ''));
        if (!name) continue;
        const url = `https://raw.githubusercontent.com/${OWNER}/${repo}/master/Named_Boxarts/${encodeURIComponent(name)}.png`;
        const r = await fetch(url);
        if (!r.ok) { failed = true; continue; }
        return { status: 'ok', blob: await r.blob() };
      } catch (e) {
        failed = true;
      }
    }
    return { status: failed ? 'error' : 'none' };
  }

  return { find, norm, pick };
})();

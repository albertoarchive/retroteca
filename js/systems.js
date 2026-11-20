// Consolas soportadas. "core" es el identificador de EmulatorJS.
// "exts" son extensiones que identifican la consola sin ambigüedad.
// "bios": 'req' = necesaria, 'opt' = mejora la compatibilidad, undefined = no hace falta.
window.SYSTEMS = [
  { id: 'nes', ratio: 1.1, w: 1.0,        name: 'Nintendo (NES)',            short: 'NES',   core: 'nes',        exts: ['nes', 'unf', 'unif'],  color: '#b8453a' },
  { id: 'snes', ratio: 1.25, w: 1.0,       name: 'Super Nintendo',            short: 'SNES',  core: 'snes',       exts: ['sfc', 'smc', 'fig', 'swc'], color: '#6b5b95' },
  { id: 'n64', ratio: 1.2, w: 1.0,        name: 'Nintendo 64',               short: 'N64',   core: 'n64',        exts: ['z64', 'n64', 'v64'],   color: '#2f7d5b' },
  { id: 'gb', ratio: 1.1, w: 0.8,         name: 'Game Boy / Color',          short: 'GB',    core: 'gb',         exts: ['gb', 'gbc'],           color: '#7a8b3c' },
  { id: 'gba', ratio: 1.65, w: 0.85,        name: 'Game Boy Advance',          short: 'GBA',   core: 'gba',        exts: ['gba'],                 color: '#4a5fa8' },
  { id: 'nds', ratio: 0.95, w: 0.7,        name: 'Nintendo DS',               short: 'NDS',   core: 'nds',        exts: ['nds'],                 color: '#8a8f98', bios: 'opt' },
  { id: 'vb', ratio: 1.1, w: 1.0,         name: 'Virtual Boy',               short: 'VB',    core: 'vb',         exts: ['vb', 'vboy'],          color: '#a3262a' },
  { id: 'segaMS', ratio: 0.65, w: 0.75,     name: 'Master System',             short: 'SMS',   core: 'segaMS',     exts: ['sms'],                 color: '#2c5f9e' },
  { id: 'segaMD', ratio: 1.25, w: 1.0,     name: 'Mega Drive / Genesis',      short: 'MD',    core: 'segaMD',     exts: ['md', 'gen', 'smd'],    color: '#1f1f24' },
  { id: 'segaGG', ratio: 1.15, w: 0.85,     name: 'Game Gear',                 short: 'GG',    core: 'segaGG',     exts: ['gg'],                  color: '#3a3a6e' },
  { id: 'sega32x', ratio: 1.25, w: 1.0,    name: 'Sega 32X',                  short: '32X',   core: 'sega32x',    exts: ['32x'],                 color: '#6e2a3a' },
  { id: 'segaCD', ratio: 1.12, w: 1.0,     name: 'Mega-CD / Sega CD',         short: 'MCD',   core: 'segaCD',     exts: [],                      color: '#3d6f8c', bios: 'req' },
  { id: 'segaSaturn', ratio: 1.12, w: 1.0, name: 'Sega Saturn',               short: 'SAT',   core: 'segaSaturn', exts: [],                      color: '#5a5f66', bios: 'req' },
  { id: 'psx', ratio: 1.12, w: 1.0,        name: 'PlayStation',               short: 'PS1',   core: 'psx',        exts: ['pbp', 'ccd', 'm3u'],   color: '#4b5563', bios: 'opt' },
  { id: 'pce', ratio: 0.64, w: 0.7,        name: 'PC Engine / TurboGrafx',    short: 'PCE',   core: 'pce',        exts: ['pce'],                 color: '#c46a2b' },
  { id: 'atari2600', ratio: 1.0, w: 0.9,  name: 'Atari 2600',                short: '2600',  core: 'atari2600',  exts: ['a26'],                 color: '#8a5a2b' },
  { id: 'atari7800', ratio: 1.0, w: 0.9,  name: 'Atari 7800',                short: '7800',  core: 'atari7800',  exts: ['a78'],                 color: '#7a4a2e' },
  { id: 'lynx', ratio: 1.4, w: 0.9,       name: 'Atari Lynx',                short: 'LYNX',  core: 'lynx',       exts: ['lnk', 'lyx'],          color: '#9a6a1f' },
  { id: 'jaguar', ratio: 1.1, w: 1.0,     name: 'Atari Jaguar',              short: 'JAG',   core: 'jaguar',     exts: ['j64', 'jag'],          color: '#a33a2a' },
  { id: 'ws', ratio: 0.9, w: 0.75,         name: 'WonderSwan',                short: 'WS',    core: 'ws',         exts: ['ws', 'wsc'],           color: '#4f8a8b' },
  { id: 'ngp', ratio: 1.3, w: 0.8,        name: 'Neo Geo Pocket',            short: 'NGP',   core: 'ngp',        exts: ['ngp', 'ngc'],          color: '#6a8a3a' },
  { id: 'coleco', ratio: 1.0, w: 0.95,     name: 'ColecoVision',              short: 'COL',   core: 'coleco',     exts: ['col', 'cv'],           color: '#8b4f6b' },
  { id: '3do', ratio: 1.12, w: 1.0,        name: '3DO',                       short: '3DO',   core: '3do',        exts: [],                      color: '#b08a2e', bios: 'req' },
  { id: 'arcade', ratio: 0.75, w: 1.0,     name: 'Arcade (FBNeo)',            short: 'ARC',   core: 'arcade',     exts: [],                      color: '#b5338a' }
];

window.SYS_BY_ID = Object.fromEntries(window.SYSTEMS.map(s => [s.id, s]));

// extensión -> id de consola (solo las inequívocas)
window.EXT_MAP = {};
window.SYSTEMS.forEach(s => s.exts.forEach(e => { window.EXT_MAP[e] = s.id; }));

// Extensiones comunes que pueden ser de varias consolas: se pregunta al usuario.
window.AMBIGUOUS_EXTS = ['bin', 'cue', 'iso', 'chd', 'zip', '7z', 'rom'];

window.detectSystem = function (filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return window.EXT_MAP[ext] || null;
};

// "Super_Mario_World_(USA)[!].sfc" -> "Super Mario World"
window.cleanTitle = function (filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[\(\[][^\)\]]*[\)\]]/g, '')
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || filename;
};

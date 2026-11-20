(async function () {
  // Versión de EmulatorJS. Para fijar una versión concreta cambia "stable" por p. ej. "4.2.3".
  const DATA_PATH = 'https://cdn.emulatorjs.org/stable/data/';

  const msg = document.getElementById('msg');
  const fail = html => { msg.style.display = 'grid'; msg.innerHTML = '<div>' + html + '</div>'; };

  const id = new URLSearchParams(location.search).get('id');
  const game = id && await DB.getGame(id);
  if (!game) return fail('No encuentro ese juego.<br><a href="index.html">Volver al estante</a>');

  const rom = await DB.getRom(id);
  if (!rom) return fail('Falta el archivo del juego.<br><a href="index.html">Volver al estante</a>');

  const sys = SYS_BY_ID[game.system];
  document.title = game.title + ' · Retroteca';

  // ROM como File para que conserve el nombre y la extensión original
  const file = new File([rom], game.fileName || game.title, { type: rom.type || 'application/octet-stream' });

  window.EJS_player = '#game';
  window.EJS_core = sys.core;
  window.EJS_gameUrl = file;
  window.EJS_gameName = game.title;          // las partidas guardadas se asocian a este nombre
  window.EJS_pathtodata = DATA_PATH;
  window.EJS_startOnLoaded = true;
  window.EJS_color = '#c2492f';
  window.EJS_language = 'es-ES';

  if (sys.bios) {
    const bios = await DB.getBios(sys.id);
    if (bios) window.EJS_biosUrl = URL.createObjectURL(bios);
    else if (sys.bios === 'req') {
      console.warn('Esta consola necesita BIOS: súbela desde el botón BIOS del estante.');
    }
  }

  // anotamos la última vez jugado
  game.lastPlayed = Date.now();
  DB.updateGame(game);

  const s = document.createElement('script');
  s.src = DATA_PATH + 'loader.js';
  s.onerror = () => fail('No se pudo cargar el emulador. Comprueba tu conexión.<br><a href="index.html">Volver al estante</a>');
  document.body.appendChild(s);

  if (sys.bios === 'req' && !window.EJS_biosUrl) {
    const note = document.createElement('div');
    note.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:1000;background:rgba(20,17,14,.85);color:#f0e9dc;padding:8px 14px;border-radius:999px;font:13px sans-serif';
    note.textContent = 'Esta consola necesita archivo BIOS (botón BIOS en el estante).';
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 7000);
  }
})();

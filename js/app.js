(function () {
  const $ = id => document.getElementById(id);
  const shelves = $('shelves'), chips = $('chips'), emptyEl = $('empty');
  let games = [];
  let filterSys = 'all';
  let query = '';
  const coverUrls = new Map(); // id -> object URL

  /* ---------- utilidades ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function fmtSize(b) {
    if (b > 1e9) return (b / 1e9).toFixed(1) + ' GB';
    if (b > 1e6) return (b / 1e6).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1e3)) + ' KB';
  }
  function sysOptions(selected) {
    return SYSTEMS.map(s => `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${s.name}</option>`).join('');
  }

  /* ---------- carga y render ---------- */
  async function load() {
    games = await DB.listGames();
    for (const g of games) {
      if (g.hasCover && !coverUrls.has(g.id)) {
        const blob = await DB.getCover(g.id);
        if (blob) coverUrls.set(g.id, URL.createObjectURL(blob));
      }
    }
    render();
  }

  function render() {
    const total = games.length;
    $('count').textContent = total ? `${total} ${total === 1 ? 'juego cargado' : 'juegos cargados'}` : 'Emulador de consolas retro';
    emptyEl.hidden = total > 0;

    // chips de consola (solo las que tienen juegos)
    const present = SYSTEMS.filter(s => games.some(g => g.system === s.id));
    if (filterSys !== 'all' && !present.some(s => s.id === filterSys)) filterSys = 'all';
    chips.innerHTML = '';
    if (present.length > 1) {
      [{ id: 'all', short: 'Todas' }, ...present].forEach(s => {
        const b = document.createElement('button');
        b.className = 'chip'; b.textContent = s.short;
        b.setAttribute('aria-pressed', String(filterSys === s.id));
        b.onclick = () => { filterSys = s.id; render(); };
        chips.appendChild(b);
      });
    }

    const q = query.trim().toLowerCase();
    shelves.innerHTML = '';
    SYSTEMS.forEach(sys => {
      if (filterSys !== 'all' && filterSys !== sys.id) return;
      const list = games
        .filter(g => g.system === sys.id && (!q || g.title.toLowerCase().includes(q)))
        .sort((a, b) => a.title.localeCompare(b.title, 'es'));
      if (!list.length) return;

      const sec = document.createElement('section');
      sec.className = 'shelf';
      sec.innerHTML = `<h2>${sys.name} <small>${list.length}</small></h2><div class="row-games"></div><div class="shelf-board"></div>`;
      const row = sec.querySelector('.row-games');
      list.forEach(g => row.appendChild(card(g, sys)));
      shelves.appendChild(sec);
    });
  }

  function card(g, sys) {
    const el = document.createElement('div');
    el.className = 'game';
    const url = coverUrls.get(g.id);
    const cover = url
      ? `<div class="cover"><img src="${url}" alt="" loading="lazy"></div>`
      : `<div class="cover gen" style="--c:${sys.color}"><span class="tag">${sys.short}</span><span class="t"></span></div>`;
    el.innerHTML = `
      <button class="cover-btn" aria-label="Jugar a ${g.title.replace(/"/g, '&quot;')}">${cover}</button>
      <button class="edit-btn" aria-label="Editar" title="Editar">⋯</button>
      <div class="meta"><b></b><span>${fmtSize(g.size)}</span></div>`;
    el.querySelector('.meta b').textContent = g.title;
    const t = el.querySelector('.cover .t'); if (t) t.textContent = g.title;
    el.querySelector('.cover-btn').onclick = () => { location.href = 'player.html?id=' + encodeURIComponent(g.id); };
    el.querySelector('.edit-btn').onclick = () => openEdit(g);
    return el;
  }

  /* ---------- importar ---------- */
  async function importFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const ready = [], ask = [];
    files.forEach(f => {
      const sys = detectSystem(f.name);
      (sys ? ready : ask).push({ file: f, system: sys });
    });

    if (ask.length) {
      const chosen = await askSystems(ask);
      if (chosen) ready.push(...chosen);
    }
    if (!ready.length) return;

    for (const { file, system } of ready) {
      const meta = { id: DB.uid(), title: cleanTitle(file.name), system, fileName: file.name, size: file.size, added: Date.now(), lastPlayed: 0, hasCover: false };
      await DB.addGame(meta, file);
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    toast(ready.length === 1 ? 'Juego añadido' : `${ready.length} juegos añadidos`);
    await load();
  }

  function askSystems(items) {
    return new Promise(resolve => {
      const dlg = $('dlgImport'), rows = $('importRows');
      rows.innerHTML = '';
      items.forEach((it, i) => {
        const r = document.createElement('div');
        r.className = 'imp-row';
        r.innerHTML = `<span title="${it.file.name.replace(/"/g, '&quot;')}"></span><select data-i="${i}"><option value="">Elige consola…</option>${sysOptions('')}</select>`;
        r.querySelector('span').textContent = it.file.name;
        rows.appendChild(r);
      });
      let done = false;
      const finish = val => { if (done) return; done = true; dlg.close(); resolve(val); };
      $('importCancel').onclick = () => finish(null);
      dlg.oncancel = () => finish(null);
      $('formImport').onsubmit = e => {
        e.preventDefault();
        const sels = [...rows.querySelectorAll('select')];
        const out = [];
        sels.forEach(s => { if (s.value) out.push({ file: items[+s.dataset.i].file, system: s.value }); });
        finish(out);
      };
      dlg.showModal();
    });
  }

  /* ---------- editar ---------- */
  let editing = null, newCover = undefined; // undefined = sin cambios, null = quitar, Blob = nueva
  function openEdit(g) {
    editing = g; newCover = undefined;
    $('editTitle').value = g.title;
    $('editSystem').innerHTML = sysOptions(g.system);
    $('editCover').value = '';
    $('dlgEdit').showModal();
  }
  $('editCover').onchange = e => { newCover = e.target.files[0] || undefined; };
  $('editCoverClear').onclick = () => { newCover = null; $('editCover').value = ''; toast('La portada se quitará al guardar'); };
  $('editCancel').onclick = () => $('dlgEdit').close();
  $('editDelete').onclick = async () => {
    if (!confirm(`¿Eliminar "${editing.title}" de la biblioteca?`)) return;
    await DB.deleteGame(editing.id);
    if (coverUrls.has(editing.id)) { URL.revokeObjectURL(coverUrls.get(editing.id)); coverUrls.delete(editing.id); }
    $('dlgEdit').close();
    await load();
  };
  $('formEdit').onsubmit = async e => {
    e.preventDefault();
    const g = { ...editing, title: $('editTitle').value.trim() || editing.title, system: $('editSystem').value };
    if (newCover instanceof Blob) {
      await DB.setCover(g.id, newCover); g.hasCover = true;
      if (coverUrls.has(g.id)) URL.revokeObjectURL(coverUrls.get(g.id));
      coverUrls.set(g.id, URL.createObjectURL(newCover));
    } else if (newCover === null) {
      await DB.setCover(g.id, null); g.hasCover = false;
      if (coverUrls.has(g.id)) { URL.revokeObjectURL(coverUrls.get(g.id)); coverUrls.delete(g.id); }
    }
    await DB.updateGame(g);
    $('dlgEdit').close();
    await load();
  };

  /* ---------- BIOS ---------- */
  async function openBios() {
    const have = new Set(await DB.listBios());
    const rows = $('biosRows'); rows.innerHTML = '';
    SYSTEMS.filter(s => s.bios).forEach(s => {
      const r = document.createElement('div');
      r.className = 'bios-row';
      r.innerHTML = `<div><span>${s.name}</span><small>${s.bios === 'req' ? 'Necesaria' : 'Opcional'}${have.has(s.id) ? ' · cargada ✓' : ''}</small></div>
        <div class="row"><input type="file"><button type="button" class="ghost" ${have.has(s.id) ? '' : 'hidden'}>Quitar</button></div>`;
      r.querySelector('input').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        await DB.setBios(s.id, f); toast('BIOS guardada'); openBios();
      };
      r.querySelector('button').onclick = async () => { await DB.setBios(s.id, null); openBios(); };
      rows.appendChild(r);
    });
    if (!$('dlgBios').open) $('dlgBios').showModal();
  }

  /* ---------- eventos ---------- */
  const fi = $('fileInput');
  $('btnAdd').onclick = $('btnAdd2').onclick = () => fi.click();
  fi.onchange = () => { importFiles(fi.files); fi.value = ''; };
  $('btnBios').onclick = openBios;
  $('search').oninput = e => { query = e.target.value; render(); };

  const dropEl = $('drop');
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  const hideDrop = () => { dropEl.hidden = true; };
  window.addEventListener('dragover', e => { if (hasFiles(e)) { e.preventDefault(); dropEl.hidden = false; } });
  // al salir de la ventana el navegador manda dragleave sin elemento destino
  window.addEventListener('dragleave', e => { if (!e.relatedTarget) hideDrop(); });
  window.addEventListener('dragend', hideDrop);
  window.addEventListener('blur', hideDrop);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') hideDrop(); });
  dropEl.addEventListener('click', hideDrop);
  window.addEventListener('drop', e => {
    e.preventDefault(); hideDrop();
    if (hasFiles(e) && e.dataTransfer.files.length) importFiles(e.dataTransfer.files);
  });

  load();
})();

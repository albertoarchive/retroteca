// Almacenamiento local en IndexedDB. Todo queda en el navegador del usuario.
// games: metadatos · roms: archivo del juego · covers: portada propia · bios: BIOS por consola
window.DB = (function () {
  const NAME = 'retroteca', VERSION = 1;
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('games', { keyPath: 'id' });
        db.createObjectStore('roms');
        db.createObjectStore('covers');
        db.createObjectStore('bios');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function tx(stores, mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      let result;
      Promise.resolve(fn(t)).then(r => { result = r; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  const wrap = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  return {
    async listGames() {
      return tx(['games'], 'readonly', t => wrap(t.objectStore('games').getAll()));
    },
    async getGame(id) {
      return tx(['games'], 'readonly', t => wrap(t.objectStore('games').get(id)));
    },
    async addGame(meta, romBlob) {
      return tx(['games', 'roms'], 'readwrite', t => {
        t.objectStore('games').put(meta);
        t.objectStore('roms').put(romBlob, meta.id);
      });
    },
    async updateGame(meta) {
      return tx(['games'], 'readwrite', t => { t.objectStore('games').put(meta); });
    },
    async getRom(id) {
      return tx(['roms'], 'readonly', t => wrap(t.objectStore('roms').get(id)));
    },
    async deleteGame(id) {
      return tx(['games', 'roms', 'covers'], 'readwrite', t => {
        t.objectStore('games').delete(id);
        t.objectStore('roms').delete(id);
        t.objectStore('covers').delete(id);
      });
    },
    async setCover(id, blob) {
      return tx(['covers'], 'readwrite', t => {
        blob ? t.objectStore('covers').put(blob, id) : t.objectStore('covers').delete(id);
      });
    },
    async getCover(id) {
      return tx(['covers'], 'readonly', t => wrap(t.objectStore('covers').get(id)));
    },
    async setBios(system, blob) {
      return tx(['bios'], 'readwrite', t => {
        blob ? t.objectStore('bios').put(blob, system) : t.objectStore('bios').delete(system);
      });
    },
    async getBios(system) {
      return tx(['bios'], 'readonly', t => wrap(t.objectStore('bios').get(system)));
    },
    async listBios() {
      return tx(['bios'], 'readonly', t => wrap(t.objectStore('bios').getAllKeys()));
    },
    uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
  };
})();

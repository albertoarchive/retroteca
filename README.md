# Retroteca

Emulador retro en el navegador. HTML, CSS y JS puros, sin build ni claves.

## Cómo funciona
- `index.html`: la biblioteca. Arrastra ROMs o pulsa "Añadir juegos". Se agrupan por consola.
- `player.html`: carga el juego con [EmulatorJS](https://emulatorjs.org) (núcleos RetroArch en WebAssembly) desde su CDN.
- Todo (ROMs, portadas, BIOS) se guarda en **IndexedDB**, en el navegador de cada persona. No hay servidor ni subida de archivos.
- Las partidas guardadas y los ajustes de control los gestiona EmulatorJS (también en el navegador).

## Publicar en Netlify
Arrastra la carpeta `retroteca` a Netlify Drop, o sube el repo y deja build command y publish directory vacíos / `.`.

## Consolas
NES, SNES, N64, Game Boy/Color, GBA, DS, Virtual Boy, Master System, Mega Drive, Game Gear, 32X, Mega-CD, Saturn, PlayStation, PC Engine, Atari 2600/7800/Lynx/Jaguar, WonderSwan, Neo Geo Pocket, ColecoVision, 3DO y arcade.
Las extensiones ambiguas (`.bin`, `.cue`, `.iso`, `.chd`, `.zip`, `.7z`) te preguntan la consola al importar.

## Notas
- **Legal:** no incluyas ROMs comerciales en el repo ni en la web. Que cada persona cargue las suyas, o usa homebrew y juegos de dominio público.
- **Discos (PS1, Mega-CD, Saturn, 3DO):** lo más fiable es un único `.chd`, `.pbp` o un `.zip` con el `.cue` y los `.bin`.
- **BIOS:** botón BIOS. Necesaria en Mega-CD, Saturn y 3DO; opcional en PS1 y DS.
- **Rendimiento:** N64, PS1, Saturn y DS piden un equipo decente; en móvil pueden ir justos.
- Para fijar una versión de EmulatorJS cambia `DATA_PATH` en `js/player.js`.

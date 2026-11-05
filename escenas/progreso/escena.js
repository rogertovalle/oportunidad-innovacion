/* El progreso · paso 5 — «Enigma en grabado y tinta» (misma arquitectura y lenguaje que «La carta» v2).
   Siluetas planas sin rostro, paleta mínima, un mundo hecho del motivo (rotores, letras, grabado), cuerpos e ideas que se
   deshacen en letras, cámara que entra y sale del patrón. Ilustración y textos propios; cuenta el paso como lo plantea la
   película, marca lo que es invención del guion y agrega lo que pasó en la vida real.
   Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 48, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
  const $ = (id) => doc.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; } return sy(clamp(t, 0, 1)); };
  }
  const ease = bezier(0.2, 0, 0, 1), easeIn = bezier(0.6, 0, 1, 1);
  const tr = (t, a, b) => ease(lin(t, a, b));
  const f2 = (v) => v.toFixed(2);
  let semilla = 1941; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const mundo = $("mundo"), defs = doc.querySelector("defs");
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", letraAzar = () => ABC[Math.floor(azar() * 26)];

  /* ── siluetas propias (origen en los pies) ── */
  const FIG = {
    turing: { cuerpo: "M-52 -300C-62 -240 -60 -190 -50 -150L-40 0H-8L0 -130L8 0H40L50 -150C60 -190 62 -240 52 -300C36 -318 18 -324 0 -324C-18 -324 -36 -318 -52 -300Z", cabeza: [0, -362, 36], extra: "" },
    joan: { cuerpo: "M-44 -296C-54 -240 -52 -196 -44 -162L-72 -18 -68 0H68L72 -18 44 -162C52 -196 54 -240 44 -296C30 -314 16 -318 0 -318C-16 -318 -30 -314 -44 -296Z", cabeza: [0, -354, 32], extra: "M12 -384A17 17 0 1 0 46 -384A17 17 0 1 0 12 -384ZM-34 -362C-38 -398 34 -398 34 -366C22 -378 -20 -380 -34 -362Z" },
    espia: { cuerpo: "M-78 -300C-92 -230 -88 -150 -84 -40L-60 0H-16L0 -60L16 0H60L84 -40C88 -150 92 -230 78 -300C54 -322 28 -328 0 -328C-28 -328 -54 -322 -78 -300ZM-30 -320L0 -250 30 -320Z", cabeza: [0, -364, 35], extra: "M-32 -390C-36 -424 -18 -436 0 -428C18 -436 36 -424 32 -390ZM-56 -392C-34 -382 34 -382 56 -392C34 -402 -34 -402 -56 -392Z" },
    pasajero: { cuerpo: "M-66 -300C-76 -236 -72 -180 -60 -150L-50 0H-12L0 -126L12 0H50L60 -150C72 -180 76 -236 66 -300C44 -320 22 -326 0 -326C-22 -326 -44 -320 -66 -300Z", cabeza: [0, -364, 36], extra: "M-46 -390H46L36 -420H-36ZM-58 -394H58V-382H-58Z" },
  };
  function figura(tipo, x, y, s, clase, padre) {
    const f = FIG[tipo], g = el("g", { transform: `translate(${x} ${y}) scale(${s})`, class: clase }, padre);
    el("path", { d: f.cuerpo, "fill-rule": "evenodd" }, g); el("circle", { cx: f.cabeza[0], cy: f.cabeza[1], r: f.cabeza[2] }, g); if (f.extra) el("path", { d: f.extra }, g);
    return g;
  }
  /* guilloché: curvas de rotor entrelazadas, como el grabado de un billete */
  function guilloche(cx, cy, R, capas, padre, color, op) {
    const g = el("g", { class: "guilloche", opacity: op }, padre);
    capas.forEach(([r, d, giros]) => { let p = ""; for (let i = 0; i <= 720; i++) { const t = (i / 720) * Math.PI * 2 * giros, k = (R - r) / r;
      const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t), y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t); p += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
      el("path", { d: p, stroke: color }, g); });
    return g;
  }
  function rotor(cx, cy, r, padre, color) {
    const g = el("g", {}, padre), gi = el("g", {}, g);
    el("circle", { cx, cy, r, class: "rotor-aro", style: `stroke:${color}` }, gi); el("circle", { cx, cy, r: r * 0.62, class: "rotor-aro", style: `stroke:${color}` }, gi);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; el("rect", { x: cx + Math.cos(a) * (r + 6) - 9, y: cy + Math.sin(a) * (r + 6) - 9, width: 18, height: 18, class: "rotor-diente", style: `fill:${color}`, transform: `rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * (r + 6)} ${cy + Math.sin(a) * (r + 6)})` }, gi);
      el("text", { x: cx + Math.cos(a) * r * 0.81, y: cy + Math.sin(a) * r * 0.81 + 8, class: "rotor-letra", "text-anchor": "middle", style: `fill:${color}` }, gi, ABC[i]); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el("path", { d: `M${cx} ${cy}L${cx + Math.cos(a) * r * 0.6} ${cy + Math.sin(a) * r * 0.6}`, stroke: color, "stroke-width": 3 }, gi); }
    g.gi = gi; return g;
  }
  /* piezas pequeñas (origen en el centro) */
  const BARCO = "M-44 -4H44L32 14H-32ZM-12 -4V-22H14V-4ZM-28 -4V-14H-16V-4Z";
  const AVION = "M-70 -6H50Q74 -6 78 0Q74 6 50 6H-70ZM-6 -6L-30 -62H-14L22 -6ZM-6 6L-30 62H-14L22 6ZM-64 -6L-80 -28H-70L-52 -6ZM-64 6L-80 28H-70L-52 6Z";
  function taza(x, y, padre) { const g = el("g", { transform: `translate(${x} ${y})` }, padre);
    el("path", { d: "M26 -24C44 -24 44 -6 24 -6", class: "asa" }, g); el("path", { d: "M-26 -34H28L20 0H-18Z", class: "taza" }, g); el("path", { d: "M-40 0H42", stroke: "#0A1F2E", "stroke-width": 4 }, g); return g; }
  function sello(padre) { const g = el("g", {}, padre);
    el("circle", { r: 84, class: "sello-aro" }, g); el("circle", { r: 50, class: "sello-aro-2" }, g);
    const tx = el("text", { class: "sello-borde" }, g); el("textPath", { href: "#p-sello", startOffset: "0" }, tx, "SERVICIO SECRETO · LONDRES · ULTRA · ");
    el("text", { y: 22, class: "sello-c", "text-anchor": "middle" }, g, "C"); return g; }

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b) => { const g = el("g", { id }, mundo); E[id] = { g, a, b }; return g; };
  const etiquetaPelicula = (padre, x, y, color) => el("text", { x, y, class: "etiqueta-pelicula", style: color ? `fill:${color}` : "" }, padre, "ASÍ LO CUENTA LA PELÍCULA");

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.4);
  E.titulo.rosa = guilloche(800, 450, 300, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#0A1F2E", 0.35);
  E.titulo.rosa2 = guilloche(800, 450, 300, [[73, 150, 73]], s0, "#E02040", 0.55);
  el("text", { x: 800, y: 360, class: "titulo-ceja", "text-anchor": "middle" }, s0, "PASO 5 · LA IDEA COMO PROGRESO");
  el("text", { x: 800, y: 500, class: "titulo-grande", "text-anchor": "middle" }, s0, "El secreto");
  E.titulo.raya = el("path", { d: "M600 540H1000", stroke: "#E02040", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 400, "stroke-dashoffset": 400 }, s0);

  /* S1 · el tren en la noche */
  const s1 = escena("tren", 4.4, 10.2);
  el("rect", { width: W, height: H, class: "tinta" }, s1);
  E.tren.luna = guilloche(250, 170, 100, [[37, 60, 37], [23, 40, 23]], s1, "#E7B53A", 0.5);
  el("path", { d: "M0 560C220 470 420 520 640 480S1100 430 1320 500 1600 470 1600 470V900H0Z", fill: "#0F2A3C" }, s1);
  el("path", { d: "M0 655H1600", class: "riel" }, s1);
  E.tren.durm = el("path", { d: "M0 668H1600", class: "durmiente" }, s1);
  E.tren.postes = [0, 1, 2, 3].map(() => el("rect", { x: 0, y: 300, width: 12, height: 355, fill: "#2B4556" }, s1));
  const vag = el("g", {}, s1);
  el("rect", { x: 110, y: 410, width: 1060, height: 200, rx: 14, class: "vagon" }, vag);
  el("path", { d: "M1190 450H1380V410H1440V610H1190Z", class: "vagon" }, vag);
  el("rect", { x: 1370, y: 340, width: 40, height: 74, class: "vagon" }, vag);
  el("path", { d: "M1170 560H1190", class: "riel" }, vag);
  const VENT = [[170, null], [430, "turing"], [690, "joan"], [950, null]];
  VENT.forEach(([x, quien], i) => {
    el("rect", { x, y: 440, width: 200, height: 118, rx: 8, class: "ventana" }, vag);
    if (!quien) return;
    const cp = el("clipPath", { id: `v${i}` }, defs); el("rect", { x, y: 440, width: 200, height: 118, rx: 8 }, cp);
    const gg = el("g", { "clip-path": `url(#v${i})` }, vag);
    figura(quien, x + (quien === "joan" ? 80 : 110), quien === "joan" ? 676 : 682, 0.5, "tinta", gg);
  });
  E.tren.ruedas = [200, 340, 940, 1080, 1250, 1380].map((x) => { const g = el("g", {}, s1); el("circle", { cx: x, cy: 625, r: 30, class: "rueda" }, g);
    el("path", { d: `M${x - 26} 625H${x + 26}M${x} 599V651`, stroke: "#E7B53A", "stroke-width": 3 }, g); g.cx = x; return g; });
  E.tren.humo = Array.from({ length: 46 }, () => ({ f: azar(), dx: -300 - azar() * 420, dy: -150 - azar() * 90, e: el("text", { class: "humo", "text-anchor": "middle" }, s1, letraAzar()) }));

  /* S2 · el salón de té */
  const s2 = escena("te", 10.2, 16.4);
  guilloche(800, 300, 520, [[71, 140, 71]], s2, "#0A1F2E", 0.09);
  el("rect", { x: 0, y: 600, width: W, height: 300, fill: "#E6DCC6" }, s2);
  el("path", { d: "M0 600H1600", stroke: "#0A1F2E", "stroke-width": 3 }, s2);
  el("circle", { cx: 800, cy: 170, r: 72, class: "reloj-aro" }, s2);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; el("path", { d: `M${800 + Math.cos(a) * 58} ${170 + Math.sin(a) * 58}L${800 + Math.cos(a) * 66} ${170 + Math.sin(a) * 66}`, stroke: "#0A1F2E", "stroke-width": 4 }, s2); }
  E.te.horario = el("path", { d: "M800 170V128", class: "aguja", "stroke-width": 7 }, s2);
  E.te.minutero = el("path", { d: "M800 170V112", class: "aguja", "stroke-width": 4 }, s2);
  el("circle", { cx: 800, cy: 170, r: 6, class: "tinta" }, s2);
  figura("turing", 470, 784, 1, "tinta", s2);
  figura("joan", 700, 790, 1, "tinta", s2);
  E.te.espia = figura("espia", 1140, 806, 1.08, "rojo", s2);
  el("rect", { x: 0, y: 780, width: W, height: 120, fill: "#E6DCC6" }, s2);
  el("path", { d: "M300 590H1320L1350 780H270Z", class: "mantel" }, s2);
  el("rect", { x: 290, y: 584, width: 1040, height: 14, class: "tinta" }, s2);
  E.te.tazas = [560, 790, 1040].map((x) => taza(x, 584, s2));
  E.te.vapores = [560, 790, 1040].map((x) => el("path", { d: `M${x - 4} 540C${x - 18} 520 ${x + 14} 508 ${x} 486`, class: "vapor" }, s2));
  const mini = E.te.mini = el("g", {}, s2);
  const mr = rotor(0, 0, 190, mini, "#0A1F2E"); E.te.miniRot = mr;
  E.te.cinta = el("g", { opacity: 0 }, s2);
  el("rect", { x: -110, y: -24, width: 220, height: 48, rx: 4, class: "banda-roja" }, E.te.cinta);
  el("text", { y: 11, class: "banda-texto", "text-anchor": "middle", style: "font-size:24px" }, E.te.cinta, "SECRETO");
  etiquetaPelicula(s2, 70, 80);

  /* S3 · la misma idea cambia de traje */
  const s3 = escena("traje", 16.4, 23.4);
  guilloche(800, 420, 470, [[47, 110, 47]], s3, "#0A1F2E", 0.08);
  figura("turing", 250, 880, 0.95, "tinta", s3);
  E.traje.espia = figura("espia", 1360, 880, 1.0, "rojo", s3);
  el("text", { x: 520, y: 180, class: "ceja-chica", "text-anchor": "middle", style: "fill:#0A1F2E" }, s3, "LO QUE TURING VE");
  E.traje.izq = el("text", { x: 520, y: 228, class: "texto-tinta", "text-anchor": "middle" }, s3, "una máquina");
  E.traje.derCeja = el("text", { x: 1040, y: 180, class: "ceja-chica", "text-anchor": "middle" }, s3, "LO QUE EL ESPÍA VALORA");
  E.traje.rot = rotor(520, 440, 130, s3, "#0A1F2E");
  const emb = E.traje.emb = el("g", {}, s3);
  el("circle", { cx: 1040, cy: 400, r: 110, class: "emblema" }, emb);
  el("circle", { cx: 1040, cy: 372, r: 32, class: "ojo-cerradura" }, emb);
  el("path", { d: "M1024 388L1008 468H1072L1056 388Z", class: "ojo-cerradura" }, emb);
  E.traje.palabras = ["el control", "la ventaja", "el secreto"].map((p, i) => el("text", { x: 1040, y: 580 + i * 48, class: "texto-tinta", "text-anchor": "middle", style: "fill:#C8102E" }, s3, p));
  const ptsRot = [], ptsEmb = [];
  for (let i = 0; i < 96; i++) { const a = azar() * Math.PI * 2, r = 70 + azar() * 70; ptsRot.push([520 + Math.cos(a) * r, 440 + Math.sin(a) * r]);
    const b = (i / 96) * Math.PI * 2; ptsEmb.push(i % 3 ? [1040 + Math.cos(b) * 110, 400 + Math.sin(b) * 110] : [1040 + (azar() - 0.5) * 50, 360 + azar() * 100]); }

  /* S4 · la estadística: qué ataques detener */
  const s4 = escena("tablero", 23.4, 29.4);
  el("rect", { width: W, height: H, class: "tinta" }, s4);
  guilloche(800, 430, 460, [[61, 140, 61]], s4, "#E7B53A", 0.1);
  etiquetaPelicula(s4, 70, 80, "#E7B53A");
  el("text", { x: 800, y: 190, class: "titulo-ceja", "text-anchor": "middle", style: "fill:#E7B53A" }, s4, "¿CUÁLES DETENER?");
  const SALVA = [1, 4, 8, 11, 13, 16];
  E.tablero.barcos = Array.from({ length: 18 }, (_, i) => { const c = i % 6, r = Math.floor(i / 6), x = 425 + c * 150, y = 300 + r * 130;
    const g = el("g", { transform: `translate(${x} ${y})` }, s4); const b = el("path", { d: BARCO, class: "barco", transform: "scale(1.3)" }, g);
    const aro = el("circle", { r: 58, class: "barco-aro", opacity: 0 }, g); g.b = b; g.aro = aro; g.x = x; g.y = y; g.salva = SALVA.indexOf(i); return g; });
  E.tablero.barrido = el("path", { d: "M0 230V610", class: "barrido" }, s4);
  E.tablero.lema = el("text", { x: 800, y: 700, class: "texto-luz", "text-anchor": "middle" }, s4, "lo justo para ganar · sin delatar la fuente");

  /* S5 · la historia falsa */
  const s5 = escena("cobertura", 29.4, 35.2);
  guilloche(800, 430, 470, [[57, 120, 57]], s5, "#0A1F2E", 0.1);
  etiquetaPelicula(s5, 70, 80);
  figura("joan", 150, 880, 0.82, "tinta", s5);
  E.cobertura.espia = figura("espia", 1420, 880, 0.86, "rojo", s5);
  const real = E.cobertura.real = el("g", {}, s5);
  el("rect", { x: -190, y: -230, width: 380, height: 460, class: "papel" }, real);
  el("text", { x: -160, y: -178, class: "papel-texto", style: "font-size:22px;letter-spacing:2px" }, real, "MENSAJE DESCIFRADO");
  ["KZQRW TLXPB", "MOQVE ANDRU", "CONVOY · SUR", "SALE AL ALBA"].forEach((l, i) => el("text", { x: -160, y: -110 + i * 50, class: i < 2 ? "cifra" : "papel-texto", style: i < 2 ? "" : "font-size:24px" }, real, l));
  const sr = E.cobertura.sello = el("g", {}, real);
  el("rect", { x: -150, y: -46, width: 300, height: 92, rx: 8, class: "sello" }, sr);
  el("text", { x: 0, y: 20, class: "sello-texto", "text-anchor": "middle", style: "font-size:52px" }, sr, "SECRETO");
  const cob = E.cobertura.cob = el("g", {}, s5);
  el("rect", { x: -200, y: -210, width: 400, height: 420, class: "papel" }, cob);
  el("text", { x: -170, y: -158, class: "papel-texto", style: "font-size:22px;letter-spacing:2px;fill:#8A4B00" }, cob, "INFORME DE COBERTURA");
  el("text", { x: -170, y: -98, class: "papel-texto", style: "font-size:22px" }, cob, "Fuente: avión de");
  el("text", { x: -170, y: -64, class: "papel-texto", style: "font-size:22px" }, cob, "reconocimiento");
  el("text", { x: -170, y: -4, class: "papel-texto", style: "font-size:22px" }, cob, "«Convoy avistado");
  el("text", { x: -170, y: 30, class: "papel-texto", style: "font-size:22px" }, cob, " desde el aire»");
  el("path", { d: BARCO, class: "tinta", transform: "translate(0 120) scale(1.2)" }, cob);
  el("path", { d: AVION, class: "avion", transform: "translate(70 80) rotate(-20) scale(.42)" }, cob);
  E.cobertura.estela = el("path", { d: "M-120 170C300 90 700 130 1000 150S1500 120 1720 160", class: "estela" }, s5);
  E.cobertura.avion = el("path", { d: AVION, class: "avion" }, s5);
  E.cobertura.v = el("path", { d: "M-40 0L-10 30L44 -38", class: "marca-v", transform: "translate(1420 380)", opacity: 0 }, s5);

  /* S6 · el expediente ULTRA */
  const s6 = escena("ultra", 35.2, 42.2);
  guilloche(520, 440, 420, [[67, 130, 67]], s6, "#0A1F2E", 0.12);
  E.ultra.sombra = figura("espia", 0, 0, 1.55, "tinta", s6);
  const carp = E.ultra.carp = el("g", {}, s6);
  el("path", { d: "M200 230H400L430 200H560L590 230H760V690H200Z", class: "carpeta-atras" }, carp);
  el("rect", { x: 190, y: 250, width: 580, height: 450, rx: 6, class: "carpeta" }, carp);
  el("text", { x: 480, y: 440, class: "titulo-grande", "text-anchor": "middle", style: "font-size:132px;letter-spacing:.06em" }, carp, "ULTRA");
  el("rect", { x: 190, y: 484, width: 580, height: 58, class: "banda-roja" }, carp);
  el("text", { x: 480, y: 524, class: "banda-texto", "text-anchor": "middle" }, carp, "ALTO SECRETO");
  el("text", { x: 230, y: 300, class: "etiqueta-pelicula", style: "fill:#0A1F2E" }, carp, "EXPEDIENTE · 1941");
  E.ultra.sello = sello(s6);

  /* S7 · cierre: las piezas se juntan en la flecha del progreso */
  const s7 = escena("cierre", 42.2, 48.5);
  E.cierre.rosa = guilloche(800, 450, 360, [[57, 120, 57], [83, 140, 83]], s7, "#0A1F2E", 0.2);
  const FV = [[520, 400], [900, 400], [900, 310], [1100, 460], [900, 610], [900, 520], [520, 520]];
  E.cierre.flecha = el("path", { d: "M" + FV.map((p) => p.join(" ")).join("L") + "Z", class: "flecha", opacity: 0 }, s7);
  E.cierre.ceja = el("text", { x: 800, y: 230, class: "titulo-ceja", "text-anchor": "middle", style: "fill:#E02040" }, s7, "LA IDEA COMO PROGRESO");
  const piezas = E.cierre.piezas = [];
  { const g = el("g", {}, s7); rotor(0, 0, 190, g, "#0A1F2E"); g.s0 = 0.32; g.p = [220, 220]; piezas.push(g); }
  { const g = el("g", {}, s7); taza(0, 20, g); g.s0 = 1.4; g.p = [1380, 230]; piezas.push(g); }
  { const g = el("g", {}, s7); el("path", { d: BARCO, class: "tinta" }, g); g.s0 = 1.8; g.p = [230, 690]; piezas.push(g); }
  { const g = el("g", {}, s7); sello(g); g.s0 = 0.8; g.p = [1380, 680]; piezas.push(g); }
  const flechaPts = [];
  for (let i = 0; i < 170; i++) { const l = i % 7, a = FV[l], b = FV[(l + 1) % 7], f = azar(); flechaPts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }

  /* letras sueltas (compartidas): la idea que cambia de traje y las letras que forman la flecha */
  const capaL = $("letras-sueltas");
  const letrasIdea = ptsRot.map(([x, y], i) => ({ x, y, ex: ptsEmb[i][0], ey: ptsEmb[i][1], arco: -120 - azar() * 140, e: el("text", { class: "letra", "text-anchor": "middle", fill: "#0A1F2E", opacity: 0 }, capaL, letraAzar()) }));
  const letrasFle = flechaPts.map(([x, y]) => ({ x, y, sx: azar() * W, sy: azar() * H, e: el("text", { class: "letra", "text-anchor": "middle", fill: "#0A1F2E", opacity: 0 }, capaL, letraAzar()) }));

  const SUBS = [
    [0.8, 4.2, "", false],
    [4.7, 7.4, "Turing y Joan viajan de noche con un secreto enorme.", true],
    [7.4, 10, "Ya rompieron Enigma. Ahora la pregunta es otra: <em>¿qué hacer con eso?</em>", true],
    [10.5, 13.2, "Los espera el jefe del servicio secreto británico.", false],
    [13.2, 16.2, "Primera regla: nadie puede saber que <em>Enigma cayó</em>.", false],
    [16.7, 19.8, "Turing no le vende una máquina…", false],
    [19.8, 23.2, "…le habla en su idioma: <em>control, ventaja y secreto</em>.", false],
    [23.7, 26.4, "Si salvan a todos, el enemigo sabrá que lo están leyendo.", true],
    [26.4, 29.2, "La estadística decide qué ataques detener: <em>los justos para ganar</em>.", true],
    [29.7, 32.4, "Joan propone una historia falsa que explique de dónde sale cada dato.", false],
    [32.4, 35, "Al espía le encanta: una red de mentiras <em>en lo más alto</em>.", false],
    [35.5, 38.7, "Así nace <em>Ultra</em>: información que gana batallas sin delatar su fuente.", false],
    [38.7, 42, "Inteligencia para planes precisos: ganar la guerra <em>con menos pérdidas</em>.", false],
    [42.6, 48, "Una idea se vuelve <em>progreso</em> cuando conecta con lo que el otro valora y lo mueve a actuar.", false],
  ];
  const NOTAS = [[36.4, 42, "<b>En la vida real…</b>Ultra fue el nombre de la inteligencia descifrada en Bletchley Park. Para proteger la fuente se montaban coberturas: un avión de reconocimiento sobrevolaba el convoy para que el enemigo creyera que lo habían visto. Stewart Menzies sí dirigía el MI6 (1939-1952) y controlaba a quién llegaba Ultra. La reunión del salón de té y las decisiones estadísticas en manos de Turing son dramatización."]];
  const sub = $("subtitulo"), nota = $("nota"); let subI = -2, notaI = -2;

  function vis(t, a, b, f = 0.7) { return Math.min(tr(t, a - f / 2, a + f / 2), 1 - tr(t, b - f / 2, b + f / 2)); }

  function cuadro(t) {
    t = clamp(Number(t) || 0, 0, D);
    $("cortina").setAttribute("opacity", (1 - tr(t, 0, 1) + tr(t, D - 0.7, D)).toFixed(3));
    /* cámara: cada escena entra desde un poco lejos y sale entrando en el patrón */
    for (const k in E) { const { g, a, b } = E[k]; const v = vis(t, a, b);
      const ent = 1 - tr(t, a - 0.4, a + 0.6), sal = tr(t, b - 0.5, b + 0.4);
      const s = 1 - 0.08 * ent + 0.5 * easeIn(sal);
      g.setAttribute("opacity", v.toFixed(3)); g.setAttribute("transform", `translate(800 450) scale(${s.toFixed(4)}) translate(-800 -450)`);
      g.style.display = v > 0.001 ? "" : "none"; }
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${f2(t * 6)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${f2(-t * 9)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (400 * (1 - tr(t, 1.2, 2.4))).toFixed(1));
    /* S1: el tren corre; el paisaje pasa; el humo es de letras */
    const enS1 = t > 4 && t < 10.6, vS1 = vis(t, 4.4, 10.2);
    E.tren.luna.setAttribute("transform", `rotate(${f2(t * 8)} 250 170)`);
    E.tren.durm.setAttribute("stroke-dashoffset", f2(t * 600));
    E.tren.ruedas.forEach((g) => g.setAttribute("transform", `rotate(${f2(t * 400)} ${g.cx} 625)`));
    E.tren.postes.forEach((p, i) => { const x = ((((i * 520 - t * 1100) % 2080) + 2080) % 2080) - 240; p.setAttribute("x", f2(x)); });
    E.tren.humo.forEach((h) => { const u = (t * 0.32 + h.f) % 1, op = enS1 ? Math.sin(u * Math.PI) * 0.85 : 0;
      h.e.setAttribute("opacity", op.toFixed(3)); h.e.setAttribute("font-size", f2(16 + u * 30));
      h.e.setAttribute("transform", `translate(${f2(1390 + h.dx * u)} ${f2(330 + h.dy * Math.sqrt(u))}) rotate(${f2(u * 90 * (h.f - 0.5))})`); });
    /* S2: el reloj avanza; el secreto queda bajo una cinta */
    E.te.minutero.setAttribute("transform", `rotate(${f2(t * 36)} 800 170)`); E.te.horario.setAttribute("transform", `rotate(${f2(120 + t * 3)} 800 170)`);
    E.te.vapores.forEach((v, i) => v.setAttribute("transform", `translate(0 ${f2(-6 * Math.sin(t * 2 + i))})`));
    E.te.miniRot.gi.setAttribute("transform", `rotate(${f2(t * 30)} 0 0)`);
    E.te.mini.setAttribute("transform", `translate(870 470) scale(${f2(0.26 * (0.6 + 0.4 * tr(t, 10.8, 12)))})`);
    const pc = lin(t, 13.4, 13.8); E.te.cinta.setAttribute("opacity", pc > 0 ? "1" : "0");
    E.te.cinta.setAttribute("transform", `translate(870 470) rotate(-12) scale(${f2(0.8 * (pc < 1 ? 2 - easeIn(pc) : 1))})`);
    E.te.espia.setAttribute("transform", `translate(1140 ${f2(806 + 18 * (1 - tr(t, 10.4, 11.8)))}) scale(1.08)`);
    /* S3: la máquina se deshace en letras y se rearma como lo que el espía valora */
    E.traje.rot.gi.setAttribute("transform", `rotate(${f2(t * 40)} 520 440)`);
    E.traje.rot.setAttribute("opacity", (1 - tr(t, 18.4, 19)).toFixed(3));
    E.traje.izq.setAttribute("opacity", (1 - 0.6 * tr(t, 18.4, 19)).toFixed(3));
    const pl = lin(t, 18.4, 20.4), enS3 = t > 16 && t < 23.8;
    letrasIdea.forEach((L, i) => { const d = ease(clamp((pl - (i % 16) * 0.012) / 0.8, 0, 1));
      const op = enS3 && pl > 0 ? (d < 0.1 ? d / 0.1 : 1) * (1 - tr(t, 20.2, 20.8)) * vis(t, 16.4, 23.4) : 0;
      L.e.setAttribute("opacity", op.toFixed(3)); L.e.setAttribute("fill", d > 0.5 ? "#C8102E" : "#0A1F2E");
      L.e.setAttribute("transform", `translate(${f2(L.x + (L.ex - L.x) * d)} ${f2(L.y + (L.ey - L.y) * d + L.arco * Math.sin(d * Math.PI))}) rotate(${f2(360 * d)})`); });
    const pe = tr(t, 19.9, 20.6); E.traje.emb.setAttribute("opacity", pe.toFixed(3));
    E.traje.emb.setAttribute("transform", `translate(1040 400) scale(${f2(0.85 + 0.15 * pe)}) translate(-1040 -400)`);
    E.traje.derCeja.setAttribute("opacity", tr(t, 19.6, 20.2).toFixed(3));
    E.traje.palabras.forEach((p, i) => p.setAttribute("opacity", tr(t, 20.5 + i * 0.5, 21 + i * 0.5).toFixed(3)));
    E.traje.espia.setAttribute("transform", `translate(1360 880) scale(${f2(1 + 0.05 * tr(t, 21.6, 22.4))})`);
    /* S4: el barrido estadístico; solo algunos barcos se salvan */
    const pb = tr(t, 24, 26.2); E.tablero.barrido.setAttribute("transform", `translate(${f2(330 + 940 * pb)} 0)`);
    E.tablero.barrido.setAttribute("opacity", (pb > 0 && pb < 1 ? 0.9 : 0).toFixed(2));
    E.tablero.barcos.forEach((g) => { const paso = clamp((330 + 940 * pb - g.x) / 60, 0, 1);
      if (g.salva < 0) { g.b.setAttribute("opacity", (1 - 0.68 * tr(t, 26.4, 27.2)).toFixed(3)); g.aro.setAttribute("opacity", "0"); g.b.style.fill = ""; }
      else { const ps = lin(t, 26.6 + g.salva * 0.28, 26.9 + g.salva * 0.28); g.aro.setAttribute("opacity", ps > 0 ? "1" : "0");
        g.aro.setAttribute("transform", `scale(${f2(ps < 1 ? 1.8 - 0.8 * ease(ps) : 1)})`); g.b.style.fill = ps > 0 ? "#E7B53A" : ""; g.b.setAttribute("opacity", "1"); }
      g.setAttribute("transform", `translate(${g.x} ${g.y}) scale(${f2(1 + 0.12 * Math.sin(paso * Math.PI))})`); });
    E.tablero.lema.setAttribute("opacity", tr(t, 28.2, 28.8).toFixed(3));
    /* S5: el mensaje real queda bajo el sello; encima, la cobertura; pasa el avión */
    E.cobertura.real.setAttribute("transform", `translate(600 420) rotate(-4) scale(${f2(0.96 + 0.04 * tr(t, 29.4, 30.2))})`);
    const ps5 = lin(t, 30.3, 30.7); E.cobertura.sello.setAttribute("opacity", ps5 > 0 ? "1" : "0");
    E.cobertura.sello.setAttribute("transform", `rotate(-12) scale(${f2(ps5 < 1 ? 2 - easeIn(ps5) : 1)})`);
    const pcv = tr(t, 31, 32); E.cobertura.cob.setAttribute("transform", `translate(${f2(1800 - 1000 * pcv)} ${f2(450 - 10 * pcv)}) rotate(${f2(14 - 9 * pcv)})`);
    const est = E.cobertura.estela, LE = est.getTotalLength(), pav = tr(t, 31.3, 33.4);
    est.setAttribute("stroke-dasharray", `8 12`); est.setAttribute("opacity", (pav > 0 ? 0.5 : 0).toFixed(2));
    const pa = est.getPointAtLength(LE * pav), pa2 = est.getPointAtLength(Math.min(LE, LE * pav + 2));
    E.cobertura.avion.setAttribute("transform", `translate(${f2(pa.x)} ${f2(pa.y)}) rotate(${f2((Math.atan2(pa2.y - pa.y, pa2.x - pa.x) * 180) / Math.PI)}) scale(.7)`);
    E.cobertura.avion.setAttribute("opacity", (pav > 0 && pav < 1 ? 1 : 0).toFixed(2));
    const pv = lin(t, 33, 33.35); E.cobertura.v.setAttribute("opacity", pv > 0 ? "1" : "0");
    E.cobertura.v.setAttribute("transform", `translate(1420 360) scale(${f2(pv < 1 ? 1.8 - 0.8 * ease(pv) : 1)})`);
    /* S6: pasa una sombra con sombrero; el expediente se sella */
    const psb = tr(t, 35.2, 37.4); E.ultra.sombra.setAttribute("transform", `translate(${f2(1000 - 230 * psb)} 900) skewX(-20) scale(1.2)`);
    E.ultra.sombra.setAttribute("opacity", (0.2 * tr(t, 35.2, 36)).toFixed(3));
    E.ultra.carp.setAttribute("transform", `translate(0 ${f2(20 * (1 - tr(t, 35.2, 36.2)))})`);
    const pss = lin(t, 36.9, 37.3); E.ultra.sello.setAttribute("opacity", pss > 0 ? "0.92" : "0");
    E.ultra.sello.setAttribute("transform", `translate(690 640) rotate(-16) scale(${f2(pss < 1 ? 2.2 - 1.2 * easeIn(pss) : 1)})`);
    /* S7: las piezas viajan al centro y las letras forman la flecha */
    E.cierre.rosa.setAttribute("transform", `rotate(${f2(t * 5)} 800 450)`);
    const pp = tr(t, 42.6, 44.4);
    piezas.forEach((g) => { const x = g.p[0] + (760 - g.p[0]) * pp, y = g.p[1] + (460 - g.p[1]) * pp;
      g.setAttribute("transform", `translate(${f2(x)} ${f2(y)}) scale(${f2(g.s0 * (1 - 0.7 * pp))})`); g.setAttribute("opacity", (1 - tr(t, 44, 44.6)).toFixed(3)); });
    const pj = lin(t, 43.6, 45.6);
    letrasFle.forEach((L, i) => { const d = ease(clamp((pj - (i % 15) * 0.02) / 0.7, 0, 1)), op = t > 42.2 ? Math.min(1, pj * 3) * (1 - tr(t, 45.6, 46.2)) : 0;
      L.e.setAttribute("opacity", op.toFixed(3)); L.e.setAttribute("transform", `translate(${f2(L.sx + (L.x - L.sx) * d)} ${f2(L.sy + (L.y - L.sy) * d)})`); });
    const pf = tr(t, 45.2, 46); E.cierre.flecha.setAttribute("opacity", pf.toFixed(3));
    E.cierre.flecha.setAttribute("transform", `translate(${f2(40 * tr(t, 46, 47.6))} 0)`);
    E.cierre.ceja.setAttribute("opacity", tr(t, 46, 46.6).toFixed(3));
    /* subtítulos y nota */
    const i = SUBS.findIndex(([a, b]) => t >= a && t < b);
    if (i !== subI) { subI = i; sub.innerHTML = i >= 0 ? SUBS[i][2] : ""; sub.classList.toggle("claro", i >= 0 && SUBS[i][3]); }
    sub.style.opacity = i >= 0 && SUBS[i][2] ? String(vis(t, SUBS[i][0], SUBS[i][1], 0.5)) : "0";
    const j = NOTAS.findIndex(([a, b]) => t >= a && t < b);
    if (j !== notaI) { notaI = j; if (j >= 0) nota.innerHTML = NOTAS[j][2]; }
    nota.style.opacity = j >= 0 ? String(vis(t, NOTAS[j][0], NOTAS[j][1], 0.6)) : "0";
  }

  /* ── reproductor ── */
  const btn = $("btn-play"), barra = $("tiempo"), reloj = $("reloj");
  let t = 0, jugando = false, t0 = 0, base = 0;
  const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  const reducido = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function pintar() { cuadro(t); barra.value = String(t); reloj.textContent = fmt(t) + " / " + fmt(D); }
  function bucle(now) { if (!jugando) return; t = Math.min(D, base + (now - t0) / 1000); pintar(); if (t >= D) { pausar(); return; } requestAnimationFrame(bucle); }
  function reproducir() { if (t >= D) t = 0; jugando = true; base = t; t0 = performance.now(); btn.textContent = "❚❚"; btn.setAttribute("aria-label", "Pausar"); requestAnimationFrame(bucle); }
  function pausar() { jugando = false; btn.textContent = t >= D ? "↺" : "▶"; btn.setAttribute("aria-label", t >= D ? "Repetir" : "Reproducir"); }
  btn.addEventListener("click", () => (jugando ? pausar() : reproducir()));
  barra.addEventListener("input", () => { t = Number(barra.value); if (jugando) { base = t; t0 = performance.now(); } pintar(); });
  addEventListener("keydown", (e) => { if (e.key === " " || e.key === "k") { e.preventDefault(); jugando ? pausar() : reproducir(); } });
  pintar();
  const q = new URLSearchParams(location.search);
  if (q.has("t")) { t = Number(q.get("t")) || 0; pintar(); } else if (q.has("auto") && !reducido()) reproducir();
  window.escena = { listo: true, duracion: D, cuadro(s) { t = clamp(s, 0, D); pintar(); }, sonido() { return []; },
    validar() { return { ok: true, notas: ["ilustración y textos propios", "película y vida real diferenciadas", "sin red", "sin motivos ajenos (nada de Bond)"] }; } };
})();

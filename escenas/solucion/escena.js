/* La solución · paso 4 — «Enigma en grabado y tinta» (misma arquitectura que la carta v2).
   La idea como solución: las palabras predecibles, la máquina que encuentra la clave del día, el proceso completo y el
   secreto del convoy. Ilustración y textos propios; cuenta el paso como lo plantea la película y agrega lo que pasó en la
   vida real. Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 58, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
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
  let semilla = 1940; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const mundo = $("mundo"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letraAz = () => ABC[Math.floor(azar() * 26)];

  /* ── siluetas propias (origen en los pies) ── */
  const FIG = {
    turing: { cuerpo: "M-52 -300C-62 -240 -60 -190 -50 -150L-40 0H-8L0 -130L8 0H40L50 -150C60 -190 62 -240 52 -300C36 -318 18 -324 0 -324C-18 -324 -36 -318 -52 -300Z", cabeza: [0, -362, 36], extra: "" },
    colega: { cuerpo: "M-66 -300C-76 -236 -72 -180 -60 -150L-50 0H-12L0 -126L12 0H50L60 -150C72 -180 76 -236 66 -300C44 -320 22 -326 0 -326C-22 -326 -44 -320 -66 -300Z", cabeza: [0, -364, 36], extra: "" },
    /* compañera: falda acampanada y moño, sin rasgos */
    joan: { cuerpo: "M-44 -300C-54 -250 -50 -210 -42 -180L-86 -40H-30L-24 0H-8L-4 -40H4L8 0H24L30 -40H86L42 -180C50 -210 54 -250 44 -300C30 -316 14 -320 0 -320C-14 -320 -30 -316 -44 -300Z", cabeza: [0, -356, 33], extra: "M14 -392C30 -400 46 -388 40 -372C34 -360 20 -366 18 -376Z" },
    /* zancada (para la carrera nocturna) */
    zancada: { cuerpo: "M-40 -300C-50 -240 -46 -190 -36 -150L-96 -14L-70 0L-2 -118L44 -6L72 -20L36 -150C48 -190 52 -240 42 -300C28 -318 14 -322 0 -322C-14 -322 -28 -318 -42 -300Z", cabeza: [10, -360, 34], extra: "" },
    paso: { cuerpo: "M-40 -300C-50 -240 -46 -190 -36 -150L-30 0H-2L4 -126L16 0H40L36 -150C48 -190 52 -240 42 -300C28 -318 14 -322 0 -322C-14 -322 -28 -318 -42 -300Z", cabeza: [10, -360, 34], extra: "" },
  };
  function figura(tipo, x, y, s, clase, padre) {
    const f = FIG[tipo], g = el("g", { transform: `translate(${x} ${y}) scale(${s})`, class: clase }, padre);
    el("path", { d: f.cuerpo }, g); el("circle", { cx: f.cabeza[0], cy: f.cabeza[1], r: f.cabeza[2] }, g); if (f.extra) el("path", { d: f.extra }, g);
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
  /* rotor / tambor (fs: tamaño de letra; los tambores pequeños de la máquina usan letra chica) */
  function rotor(cx, cy, r, padre, color, fs = 22) {
    const g = el("g", {}, padre), gi = el("g", {}, g), d = Math.max(6, r * 0.09);
    el("circle", { cx, cy, r, class: "rotor-aro", style: `stroke:${color};stroke-width:${Math.max(3, r * 0.03)}` }, gi); el("circle", { cx, cy, r: r * 0.62, class: "rotor-aro", style: `stroke:${color};stroke-width:${Math.max(3, r * 0.03)}` }, gi);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, px = cx + Math.cos(a) * (r + d / 2), py = cy + Math.sin(a) * (r + d / 2);
      el("rect", { x: px - d / 2, y: py - d / 2, width: d, height: d, style: `fill:${color}`, transform: `rotate(${(a * 180) / Math.PI} ${px} ${py})` }, gi);
      el("text", { x: cx + Math.cos(a) * r * 0.81, y: cy + Math.sin(a) * r * 0.81 + fs * 0.36, class: "rotor-letra", "text-anchor": "middle", style: `fill:${color};font-size:${fs}px` }, gi, ABC[i]); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el("path", { d: `M${cx} ${cy}L${cx + Math.cos(a) * r * 0.6} ${cy + Math.sin(a) * r * 0.6}`, stroke: color, "stroke-width": Math.max(2, r * 0.016) }, gi); }
    g.gi = gi; g.cx = cx; g.cy = cy; return g;
  }
  function pelicula(x, y, padre, color) { return el("text", { x, y, class: "etiqueta-pelicula", "text-anchor": "middle", style: color ? `fill:${color}` : "" }, padre, "ASÍ LO CUENTA LA PELÍCULA"); }

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b) => { const g = el("g", { id }, mundo); E[id] = { g, a, b }; return g; };

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.6);
  E.titulo.rosa = guilloche(800, 450, 300, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#0A1F2E", 0.35);
  E.titulo.rosa2 = guilloche(800, 450, 300, [[73, 150, 73]], s0, "#E08000", 0.6);
  el("text", { x: 800, y: 360, class: "titulo-ceja", "text-anchor": "middle" }, s0, "PASO 4 · LA IDEA COMO SOLUCIÓN");
  el("text", { x: 800, y: 500, class: "titulo-grande", "text-anchor": "middle" }, s0, "La solución");
  E.titulo.raya = el("path", { d: "M560 540H1040", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 480, "stroke-dashoffset": 480 }, s0);

  /* S1 · la propuesta de valor como reloj: cada medianoche, clave nueva */
  const s1 = escena("valor", 4.6, 11.8);
  guilloche(470, 400, 300, [[61, 130, 61]], s1, "#0A1F2E", 0.14);
  el("circle", { cx: 470, cy: 400, r: 230, class: "esfera" }, s1);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r1 = i % 6 ? 204 : 190;
    el("path", { d: `M${470 + Math.cos(a) * r1} ${400 + Math.sin(a) * r1}L${470 + Math.cos(a) * 218} ${400 + Math.sin(a) * 218}`, class: "tic" }, s1); }
  el("text", { x: 470, y: 238, class: "esfera-hora", "text-anchor": "middle" }, s1, "00:00");
  E.valor.aguja = el("path", { d: "M470 400V215", class: "aguja" }, s1);
  el("circle", { cx: 470, cy: 400, r: 16, class: "rojo" }, s1);
  el("text", { x: 1130, y: 190, class: "titulo-ceja", "text-anchor": "middle" }, s1, "CLAVE DE HOY");
  E.valor.vent = [0, 1, 2].map((k) => { const x = 960 + k * 170; const r = el("rect", { x, y: 220, width: 130, height: 150, rx: 10, class: "ventana" }, s1);
    const l = el("text", { x: x + 65, y: 326, class: "ventana-letra", "text-anchor": "middle" }, s1, "A"); return { r, l }; });
  const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
  E.valor.dias = DIAS.map((d, i) => { const x = 930 + i * 72; el("rect", { x, y: 430, width: 56, height: 56, rx: 6, class: "dia" }, s1);
    el("text", { x: x + 28, y: 467, class: "dia-letra", "text-anchor": "middle" }, s1, d);
    return el("path", { d: `M${x + 6} ${480}L${x + 50} ${436}`, class: "dia-raya", opacity: 0 }, s1); });
  E.valor.aviso = el("text", { x: 1180, y: 556, class: "titulo-ceja", "text-anchor": "middle", style: "font-size:22px" }, s1, "A MEDIANOCHE, CLAVE NUEVA");
  el("text", { x: 1180, y: 630, class: "prop", "text-anchor": "middle" }, s1, "Encontrarla cada día, con una máquina,");
  el("text", { x: 1180, y: 676, class: "prop", "text-anchor": "middle" }, s1, "para ganar la guerra.");

  /* S2 · el bar (así lo cuenta la película) */
  const s2 = escena("bar", 11.8, 16.4);
  guilloche(800, 380, 520, [[47, 110, 47]], s2, "#0A1F2E", 0.1);
  for (let i = 0; i < 13; i++) { const x = 210 + i * 92, h = 70 + ((i * 37) % 4) * 14; // botellas en el estante
    el("path", { d: `M${x - 18} 300V${300 - h + 34}Q${x - 18} ${300 - h + 16} ${x - 6} ${300 - h + 10}V${300 - h}H${x + 6}V${300 - h + 10}Q${x + 18} ${300 - h + 16} ${x + 18} ${300 - h + 34}V300Z`, class: "tinta", opacity: 0.8 }, s2); }
  el("rect", { x: 150, y: 300, width: 1300, height: 12, class: "tinta" }, s2);
  E.bar.colega = figura("colega", 560, 880, 0.95, "rojo", s2);
  E.bar.joan = figura("joan", 810, 880, 0.9, "tinta", s2);
  E.bar.turing = figura("turing", 1060, 880, 0.95, "tinta", s2);
  el("rect", { x: 420, y: 640, width: 760, height: 22, class: "tinta" }, s2); el("rect", { x: 780, y: 662, width: 40, height: 220, class: "tinta" }, s2);
  pelicula(800, 110, s2);
  E.bar.palabra = "WETTER".split("").map((c, i) => el("text", { x: 0, y: 0, class: "palabra-bar", "text-anchor": "middle", opacity: 0 }, s2, c));
  E.bar.aro = el("circle", { cx: 1060, cy: 880 - 362 * 0.95, r: 0, class: "aro", style: "stroke-width:7" }, s2);

  /* S3 · el mensaje: se encienden las palabras predecibles; el espacio de búsqueda se desploma */
  const s3 = escena("mensaje", 16.4, 22.6);
  el("rect", { x: 160, y: 100, width: 1280, height: 360, class: "papel" }, s3);
  el("text", { x: 200, y: 150, class: "papel-texto", style: "font-size:20px;fill:#C8102E;letter-spacing:2px" }, s3, "MENSAJE INTERCEPTADO · 06:00");
  const CRIB = "WETTERBERICHT";
  E.mensaje.letras = [];
  for (let fila = 0; fila < 3; fila++) for (let gI = 0; gI < 9; gI++) for (let c = 0; c < 5; c++) {
    const idx = gI * 5 + c, x = 214 + gI * 128 + c * 20, y = 230 + fila * 82;
    let ci = letraAz(); const plano = fila === 0 && idx < CRIB.length ? CRIB[idx] : null; while (plano && ci === plano) ci = letraAz();
    E.mensaje.letras.push({ e: el("text", { x, y, class: "cifra", "text-anchor": "middle", fill: "#0A1F2E" }, s3, ci), ci, plano, idx });
  }
  E.mensaje.resalte = el("rect", { x: 202, y: 196, width: 0, height: 46, rx: 4, class: "resalte" }, s3);
  s3.insertBefore(E.mensaje.resalte, E.mensaje.letras[0].e);
  E.mensaje.saludo = el("rect", { x: 214 + 8 * 128 - 14, y: 408, width: 108, height: 6, class: "oro", opacity: 0 }, s3);
  E.mensaje.saludoTxt = el("text", { x: 214 + 8 * 128 + 40, y: 442, class: "chico", "text-anchor": "middle", opacity: 0 }, s3, "el saludo de rigor");
  E.mensaje.cribTxt = el("text", { x: 340, y: 186, class: "chico", "text-anchor": "middle", opacity: 0 }, s3, "el parte del clima");
  el("text", { x: 800, y: 548, class: "titulo-ceja", "text-anchor": "middle", style: "font-size:22px" }, s3, "CONFIGURACIONES POSIBLES DE ENIGMA");
  const NUM = "159 000 000 000 000 000 000";
  E.mensaje.digitos = NUM.split("").map((c, i) => ({ c, i, dx: (azar() - 0.5) * 300, r: (azar() - 0.5) * 120, d: azar(), e: el("text", { x: 800 + (i - (NUM.length - 1) / 2) * 44, y: 640, class: "contador", "text-anchor": "middle" }, s3, c) }));
  E.mensaje.encajan = el("text", { x: 800, y: 640, class: "encajan", "text-anchor": "middle", opacity: 0 }, s3, "solo las que encajan");

  /* S4 · la carrera nocturna */
  const s4 = escena("noche", 22.6, 27.2);
  el("rect", { width: W, height: H, class: "tinta" }, s4);
  E.noche.luna = guilloche(1280, 190, 110, [[29, 60, 29], [37, 70, 37]], s4, "#E7B53A", 0.75);
  el("path", { d: "M1120 760V520L1310 420L1500 520V760Z", class: "cabana" }, s4);
  E.noche.ventana = el("rect", { x: 1280, y: 560, width: 70, height: 60, class: "ventanuco", opacity: 0.3 }, s4);
  el("rect", { x: 0, y: 760, width: W, height: 140, fill: "#06141E" }, s4);
  pelicula(250, 90, s4, "#E7B53A");
  E.noche.corredores = [0, 1, 2].map((k) => { const g = el("g", {}, s4);
    g.a = figura("zancada", 0, 0, 1, "crema", g); g.b = figura("paso", 0, 0, 1, "crema", g); g.k = k; return g; });

  /* S5 · los tambores giran y se detienen */
  const s5 = escena("tambores", 27.2, 33.6);
  el("rect", { width: W, height: H, class: "tinta" }, s5);
  el("rect", { x: 170, y: 110, width: 1260, height: 600, rx: 14, class: "maquina" }, s5);
  E.tambores.lampara = el("circle", { cx: 800, cy: 140, r: 16, class: "lampara" }, s5);
  E.tambores.t = [];
  for (let f = 0; f < 3; f++) for (let c = 0; c < 6; c++) { const color = c % 3 === 1 ? "#E7B53A" : "#F1EADB";
    E.tambores.t.push(rotor(325 + c * 190, 250 + f * 180, 66, s5, color, 12)); }
  E.tambores.giros = E.tambores.t.map(() => 1800 + Math.floor(azar() * 9) * 360 + Math.floor(azar() * 26) * (360 / 26));
  E.tambores.etiqueta = el("g", {}, s5);
  el("rect", { x: -380, y: -70, width: 760, height: 140, rx: 10, class: "etiqueta", stroke: "#F1EADB", "stroke-width": 5 }, E.tambores.etiqueta);
  el("text", { x: 0, y: 20, class: "etiqueta-texto", "text-anchor": "middle" }, E.tambores.etiqueta, "CLAVE ENCONTRADA");

  /* S6 · el circuito: los cinco pasos de la solución */
  const s6 = escena("circuito", 33.6, 41.4);
  guilloche(800, 400, 480, [[59, 130, 59]], s6, "#0A1F2E", 0.06);
  el("text", { x: 800, y: 170, class: "titulo-ceja", "text-anchor": "middle" }, s6, "LA SOLUCIÓN: UN PROCESO");
  const NX = [170, 420, 670, 920, 1170], NY = 340, MX = 1430;
  el("path", { d: `M${NX[0]} ${NY}H${MX}`, class: "cable" }, s6);
  E.circuito.luz = el("path", { d: `M${NX[0]} ${NY}H${MX}`, class: "cable-luz", "stroke-dasharray": MX - NX[0], "stroke-dashoffset": MX - NX[0] }, s6);
  const PASOS = [["Identificar la", "configuración"], ["Decodificar", "los mensajes"], ["Traducir", "los mensajes"], ["Actualizar", "el mapa"], ["Mantener", "el secreto"]];
  E.circuito.nodos = PASOS.map((p, i) => { const c = el("circle", { cx: NX[i], cy: NY, r: 70, class: "nodo" }, s6);
    const n = el("text", { x: NX[i], y: NY + 20, class: "nodo-num", "text-anchor": "middle" }, s6, String(i + 1));
    const tx = el("g", { opacity: 0.35 }, s6); p.forEach((l, j) => el("text", { x: NX[i], y: 470 + j * 36, class: "nodo-txt", "text-anchor": "middle" }, tx, l));
    if (i === 0) el("text", { x: NX[i], y: 552, class: "chico", "text-anchor": "middle" }, tx, "con otra máquina");
    return { c, n, tx }; });
  E.circuito.meta = el("g", { opacity: 0.35 }, s6);
  el("path", { d: `M${MX} ${NY - 82}L${MX + 82} ${NY}L${MX} ${NY + 82}L${MX - 82} ${NY}Z`, class: "meta" }, E.circuito.meta);
  el("text", { x: MX, y: 470, class: "nodo-txt", "text-anchor": "middle", style: "fill:#C8102E" }, E.circuito.meta, "Ganar");
  el("text", { x: MX, y: 506, class: "nodo-txt", "text-anchor": "middle", style: "fill:#C8102E" }, E.circuito.meta, "la guerra");
  el("text", { x: MX, y: NY + 12, class: "titulo-ceja", "text-anchor": "middle", style: "fill:#0A1F2E;font-size:20px;letter-spacing:.14em" }, E.circuito.meta, "META");

  /* S7 · el mapa y el convoy (así lo cuenta la película) */
  const s7 = escena("mapa", 41.4, 49.2);
  el("rect", { x: 70, y: 70, width: 940, height: 640, class: "mapa" }, s7);
  for (let x = 130; x < 1010; x += 60) el("path", { d: `M${x} 72V708`, class: "reticula" }, s7);
  for (let y = 130; y < 710; y += 60) el("path", { d: `M72 ${y}H1008`, class: "reticula" }, s7);
  el("path", { d: "M72 72H330C350 120 300 170 320 220C340 280 270 300 240 360C210 420 150 430 72 470Z", class: "tierra" }, s7);
  el("path", { d: "M1008 380C960 400 930 460 950 520C970 580 930 640 960 708H1008Z", class: "tierra" }, s7);
  [[260, 140], [180, 300], [600, 180], [760, 600], [420, 620], [880, 150]].forEach(([x, y], i) => { el("path", { d: `M${x} ${y}L${[150, 100, 700, 980, 330, 990][i]} ${[100, 420, 90, 680, 690, 300][i]}`, class: "hilo", opacity: 0.45 }, s7); el("circle", { cx: x, cy: y, r: 9, class: "chincheta" }, s7); });
  E.mapa.ruta = el("path", { d: "M180 620C380 560 560 470 900 300", class: "ruta" }, s7);
  E.mapa.barcos = [0, 1, 2, 3, 4].map((k) => { const g = el("g", {}, s7); el("path", { d: "M-24 0H24L16 11H-16Z", class: "barco" }, g); el("rect", { x: -8, y: -10, width: 14, height: 10, class: "barco" }, g); g.k = k; return g; });
  E.mapa.amenazas = [[820, 120], [960, 200], [640, 100], [940, 120]].map(([x, y]) => { const g = el("path", { d: "M0 -14L12 10H-12Z", class: "amenaza" }, s7); g.sx = x; g.sy = y; return g; });
  E.mapa.alerta = el("circle", { cx: 640, cy: 430, r: 0, fill: "none", stroke: "#C8102E", "stroke-width": 5 }, s7);
  E.mapa.ataque = el("text", { x: 640, y: 338, class: "titulo-ceja", "text-anchor": "middle", opacity: 0, style: "font-size:22px" }, s7, "ATAQUE");
  E.mapa.sello = el("g", { opacity: 0 }, s7);
  el("rect", { x: -170, y: -48, width: 340, height: 96, rx: 8, class: "sello", style: "fill:rgba(251,247,238,.92)" }, E.mapa.sello); el("text", { x: 0, y: 19, class: "sello-texto", "text-anchor": "middle" }, E.mapa.sello, "SECRETO");
  pelicula(1290, 118, s7);
  /* la línea para avisar a la Marina; el colega quiere avisar, Turing se interpone */
  el("rect", { x: 1420, y: 640, width: 150, height: 14, class: "tinta" }, s7); el("rect", { x: 1488, y: 654, width: 14, height: 226, class: "tinta" }, s7);
  el("path", { d: "M1452 640V612H1538V640Z", class: "tinta" }, s7); el("path", { d: "M1440 606C1440 586 1550 586 1550 606H1530C1526 598 1464 598 1460 606Z", class: "tinta" }, s7);
  E.mapa.linea1 = el("path", { d: "M1010 440C1120 450 1180 520 1260 560", class: "linea-aviso" }, s7);
  E.mapa.linea2 = el("path", { d: "M1260 560C1340 600 1400 620 1452 626", class: "linea-aviso" }, s7);
  E.mapa.corte = el("path", { d: "M1236 532L1284 588M1284 532L1236 588", class: "corte", opacity: 0 }, s7);
  E.mapa.colega = figura("colega", 1180, 880, 0.78, "rojo", s7);
  E.mapa.turing = figura("turing", 1700, 880, 0.82, "tinta", s7);

  /* S8 · en la vida real: un crib alineado con el mensaje */
  const s8 = escena("real", 49.2, 53.8);
  const hoja = el("g", { transform: "translate(-250 0)" }, s8);
  el("rect", { x: 420, y: 140, width: 780, height: 560, class: "papel" }, hoja);
  el("text", { x: 470, y: 210, class: "papel-texto", style: "fill:#C8102E;font-size:22px;letter-spacing:2px" }, hoja, "UN CRIB, ALINEADO CON EL MENSAJE");
  E.real.crib = CRIB.split("").map((p, i) => { const x = 500 + i * 52; let ci = letraAz(); while (ci === p) ci = letraAz();
    el("text", { x, y: 320, class: "crib-letra", "text-anchor": "middle", fill: "#0A1F2E" }, hoja, ci);
    el("path", { d: `M${x} 336V366`, stroke: "#B9AE98", "stroke-width": 3 }, hoja);
    return el("text", { x, y: 410, class: "crib-letra", "text-anchor": "middle", fill: "#C8102E", opacity: 0 }, hoja, p); });
  el("text", { x: 470, y: 280, class: "chico", style: "fill:#4A5A66" }, hoja, "cifrado");
  el("text", { x: 470, y: 452, class: "chico", style: "fill:#4A5A66" }, hoja, "texto adivinado");
  E.real.regla = el("g", { opacity: 0 }, hoja);
  el("text", { x: 470, y: 560, class: "nota-hoja" }, E.real.regla, "Enigma nunca cifraba una letra en sí misma:");
  el("text", { x: 470, y: 596, class: "nota-hoja" }, E.real.regla, "eso ayudaba a ubicar el crib en el mensaje.");

  /* S9 · cierre: el circuito se cierra en el rombo de la solución */
  const s9 = escena("cierre", 53.8, 59);
  E.cierre.rosa = guilloche(800, 420, 340, [[57, 120, 57], [83, 140, 83]], s9, "#0A1F2E", 0.2);
  el("text", { x: 800, y: 150, class: "titulo-ceja", "text-anchor": "middle", style: "fill:#8A4B00" }, s9, "LA IDEA COMO SOLUCIÓN");
  E.cierre.rombo = el("path", { d: "M800 200L1020 420L800 640L580 420Z", class: "rombo", opacity: 0 }, s9);
  const rv = [[800, 200], [1020, 420], [800, 640], [580, 420]], romPts = [];
  for (let i = 0; i < 160; i++) { const l = i % 4, a = rv[l], b = rv[(l + 1) % 4], f = azar(); romPts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  E.cierre.nodos = [0, 1, 2, 3, 4].map((i) => el("circle", { cx: 0, cy: 0, r: 26, class: "nodo", style: "fill:#E08000" }, s9));

  /* letras sueltas: las que forman el rombo */
  const capaL = $("letras-sueltas");
  const letrasRom = romPts.map(([x, y]) => ({ x, y, sx: azar() * W, sy: azar() * H, e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: "#0A1F2E", opacity: 0 }, capaL, letraAz()) }));

  const SUBS = [
    [0.8, 4.4, "", false],
    [4.9, 8.3, "La propuesta de valor: <em>descubrir la clave de Enigma todos los días</em>, usando una máquina…", false],
    [8.3, 11.6, "…para tener ventaja frente al enemigo y <em>ganar la guerra</em>.", false],
    [12.1, 14.2, "Así lo cuenta la película: en un bar, una charla casual…", false],
    [14.2, 16.3, "…le hace ver a Turing que los mensajes <em>repiten palabras</em>.", false],
    [16.7, 19.5, "Cada mañana, el parte del clima. Y al final, el saludo de rigor.", false],
    [19.5, 22.4, "Ya no hay que probarlo todo: solo lo que encaja con esas palabras.", false],
    [22.9, 27, "Esa misma noche corren a la cabaña de la máquina.", true],
    [27.5, 30.9, "La máquina gira con los nuevos parámetros… hasta que se <em>detiene</em>.", true],
    [30.9, 33.4, "Clave encontrada: los mensajes del día se pueden leer.", true],
    [33.9, 37.6, "La solución no es solo la máquina: es un <em>proceso</em> completo.", false],
    [37.6, 41.2, "Y cada paso apunta al objetivo del usuario: <em>ganar la guerra</em>.", false],
    [41.7, 44.4, "En el mapa aparece un ataque contra un convoy.", false],
    [44.4, 47.1, "Turing impide que avisen: los alemanes sabrían que <em>Enigma está rota</em>.", false],
    [47.1, 49, "Guardar el secreto también es parte de la solución.", false],
    [49.5, 53.6, "En la vida real, esas palabras predecibles se llamaban <em>cribs</em>.", false],
    [54.1, 58, "Comunica los detalles sin perder de vista el objetivo; si no, <em>es solo una invención</em>.", false],
  ];
  const NOTAS = [
    [45.6, 49, "<b>En la vida real…</b>El dilema del convoy es dramatización. Lo que sí era regla: para no delatar lo descifrado, solo se actuaba si había otra explicación creíble, como un avión de reconocimiento que «por casualidad» veía al enemigo."],
    [49.4, 53.6, "<b>En la vida real…</b>Los <i>cribs</i> —texto adivinable, como el parte del clima— eran rutina en Bletchley Park: con ellos se armaba el «menú» de la bombe. La primera, <i>Victory</i>, llegó en marzo de 1940; la diseñaron Turing y Gordon Welchman sobre el trabajo de criptógrafos polacos. La escena del bar es dramatización."],
  ];
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
    $("fondo").style.fill = t > 22.6 && t < 33.6 ? "#0A1F2E" : "";
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${(-t * 9).toFixed(2)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (480 * (1 - tr(t, 1.2, 2.4))).toFixed(1));
    /* S1: siete días; la aguja da la vuelta, las letras buscan y a medianoche se borra todo */
    const dp = clamp((t - 5.4) / 0.84, 0, 7), dk = Math.floor(dp), df = dp - dk;
    E.valor.aguja.setAttribute("transform", `rotate(${(360 * dp).toFixed(1)} 470 400)`);
    const flash = dp > 0.5 && df < 0.16 ? 1 - df / 0.16 : 0;
    E.valor.vent.forEach((v, k) => { v.l.textContent = ABC[(Math.floor(t * 13) * (7 + k * 4) + k * 9 + dk * 5) % 26];
      v.r.style.stroke = flash > 0.3 ? "#C8102E" : ""; v.l.style.fill = flash > 0.3 ? "#C8102E" : ""; });
    E.valor.dias.forEach((r, i) => r.setAttribute("opacity", dp >= i + 1 ? "1" : "0"));
    E.valor.aviso.setAttribute("opacity", (0.45 + 0.55 * flash).toFixed(2));
    /* S2: las palabras viajan del colega a Turing; se enciende la idea */
    const pw = tr(t, 13, 14.8), c0 = [560, 520], c1 = [1060, 440];
    E.bar.palabra.forEach((L, i) => { const d = ease(clamp((pw - i * 0.06) / 0.7, 0, 1)), x = c0[0] + (c1[0] - c0[0]) * d + (i - 2.5) * 36 * d, y = c0[1] + (c1[1] - c0[1]) * d - 120 * Math.sin(d * Math.PI);
      L.setAttribute("x", x.toFixed(1)); L.setAttribute("y", y.toFixed(1)); L.setAttribute("opacity", (pw > i * 0.06 ? Math.min(1, d * 4) : 0).toFixed(2)); });
    const pa = tr(t, 14.8, 15.4); E.bar.aro.setAttribute("r", (62 * pa).toFixed(1)); E.bar.aro.setAttribute("opacity", (1 - 0.5 * lin(t, 15.6, 16.4)).toFixed(2));
    E.bar.turing.setAttribute("transform", `translate(1060 ${(880 - 10 * tr(t, 14.8, 15.2) + 10 * tr(t, 15.2, 15.8)).toFixed(1)}) scale(0.95)`);
    /* S3: el crib se enciende letra a letra; el número se desploma */
    const pr = tr(t, 17, 18.4); E.mensaje.resalte.setAttribute("width", (322 * pr).toFixed(1));
    E.mensaje.letras.forEach((L) => { if (!L.plano) return; const on = t >= 17 + L.idx * 0.1; L.e.textContent = on ? L.plano : L.ci; L.e.setAttribute("fill", on ? "#C8102E" : "#0A1F2E"); });
    E.mensaje.cribTxt.setAttribute("opacity", tr(t, 18.2, 18.7).toFixed(2));
    E.mensaje.saludo.setAttribute("opacity", tr(t, 18.6, 19).toFixed(2)); E.mensaje.saludoTxt.setAttribute("opacity", tr(t, 18.8, 19.3).toFixed(2));
    E.mensaje.digitos.forEach((g) => { const st = 19.8 + g.d * 1.2, d = easeIn(lin(t, st, st + 0.8));
      g.e.setAttribute("opacity", Math.max(0, 1 - d * 1.7).toFixed(3)); g.e.setAttribute("transform", `translate(${(g.dx * d).toFixed(1)} ${(220 * d).toFixed(1)}) rotate(${(g.r * d).toFixed(1)} ${800 + (g.i - 13) * 44} 640)`); });
    E.mensaje.encajan.setAttribute("opacity", tr(t, 21.2, 21.8).toFixed(2));
    /* S4: tres que corren de noche hacia la luz de la cabaña */
    E.noche.luna.setAttribute("transform", `rotate(${(t * 8).toFixed(1)} 1280 190)`);
    E.noche.ventana.setAttribute("opacity", (0.3 + 0.7 * tr(t, 25.6, 26.4)).toFixed(2));
    E.noche.corredores.forEach((g) => { const p = lin(t, 22.4 + g.k * 0.25, 26.8), x = -120 + 1260 * p - g.k * 150, fase = Math.floor(t / 0.16 + g.k) % 2;
      const y = 760 - Math.abs(Math.sin((t / 0.16 + g.k) * Math.PI)) * 10;
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.72 - g.k * 0.04).toFixed(2)}) rotate(7)`);
      g.a.setAttribute("opacity", fase ? "1" : "0"); g.b.setAttribute("opacity", fase ? "0" : "1"); });
    /* S5: giran rápido, frenan y se detienen; cae el sello */
    const pg = ease(lin(t, 27.2, 31.1));
    E.tambores.t.forEach((r, i) => r.gi.setAttribute("transform", `rotate(${(E.tambores.giros[i] * pg * (i % 2 ? -1 : 1)).toFixed(1)} ${r.cx} ${r.cy})`));
    const alto = t >= 31.1; E.tambores.lampara.style.fill = alto ? "#C8102E" : "";
    const pe = lin(t, 31.3, 31.7); E.tambores.etiqueta.setAttribute("opacity", pe > 0 ? "1" : "0");
    E.tambores.etiqueta.setAttribute("transform", `translate(800 430) rotate(-4) scale(${(pe < 1 ? 2.1 - 1.1 * easeIn(pe) : 1).toFixed(3)})`);
    /* S6: el circuito se ilumina en orden hasta la meta */
    const L6 = MX - NX[0], pl = lin(t, 34.2, 38.4); E.circuito.luz.setAttribute("stroke-dashoffset", (L6 * (1 - pl)).toFixed(1));
    E.circuito.nodos.forEach((n, i) => { const on = NX[0] + L6 * pl >= NX[i]; n.c.style.fill = on ? "#E08000" : ""; n.n.style.fill = on ? "#FBF7EE" : "";
      n.tx.setAttribute("opacity", on ? "1" : "0.35"); });
    E.circuito.meta.setAttribute("opacity", pl >= 1 ? "1" : "0.35");
    E.circuito.meta.setAttribute("transform", `translate(${MX} ${NY}) scale(${(1 + 0.12 * Math.sin(Math.PI * lin(t, 38.4, 39.2))).toFixed(3)}) translate(${-MX} ${-NY})`);
    /* S7: avanza el convoy; aparece la amenaza; Turing corta el aviso; sello de secreto */
    const ruta = E.mapa.ruta, LR = ruta.getTotalLength(), pv = lin(t, 41.4, 49.2);
    E.mapa.barcos.forEach((g) => { const pt = ruta.getPointAtLength(LR * clamp(0.1 + 0.42 * pv - g.k * 0.05, 0, 1)); g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${(pt.y - 8 + (g.k % 2) * 18).toFixed(1)}) rotate(-24)`); });
    const pm = tr(t, 42.2, 45.6);
    E.mapa.amenazas.forEach((g, i) => { const tx = 640 + (i - 1.5) * 46, ty = 404 + (i % 2) * 36; g.setAttribute("transform", `translate(${(g.sx + (tx - g.sx) * pm).toFixed(1)} ${(g.sy + (ty - g.sy) * pm).toFixed(1)}) rotate(200)`);
      g.setAttribute("opacity", tr(t, 42, 42.6).toFixed(2)); });
    const pu = lin(t, 42.8, 44.4); E.mapa.alerta.setAttribute("r", (pu > 0 ? 50 + 16 * Math.sin(t * 6) : 0).toFixed(1));
    E.mapa.ataque.setAttribute("opacity", tr(t, 43, 43.5).toFixed(2));
    E.mapa.colega.setAttribute("transform", `translate(1180 880) rotate(${(6 * tr(t, 43.6, 44.4) - 6 * tr(t, 45.2, 46)).toFixed(2)}) scale(0.78)`);
    E.mapa.turing.setAttribute("transform", `translate(${(1700 - 360 * tr(t, 44.4, 45.3)).toFixed(1)} 880) scale(0.82)`);
    const cut = t >= 45.4; E.mapa.corte.setAttribute("opacity", cut ? "1" : "0"); E.mapa.linea2.setAttribute("opacity", (1 - 0.8 * tr(t, 45.4, 46.2)).toFixed(2));
    E.mapa.linea2.setAttribute("transform", `translate(${(30 * tr(t, 45.4, 46.2)).toFixed(1)} ${(40 * tr(t, 45.4, 46.2)).toFixed(1)})`);
    const ps = lin(t, 46.6, 47); E.mapa.sello.setAttribute("opacity", ps > 0 ? "1" : "0");
    E.mapa.sello.setAttribute("transform", `translate(740 610) rotate(-10) scale(${(ps < 1 ? 2 - easeIn(ps) : 1).toFixed(3)})`);
    /* S8: el texto adivinado se alinea bajo el cifrado */
    E.real.crib.forEach((e, i) => e.setAttribute("opacity", tr(t, 49.8 + i * 0.1, 50.2 + i * 0.1).toFixed(3)));
    E.real.regla.setAttribute("opacity", tr(t, 51.6, 52.2).toFixed(3));
    /* S9: los cinco nodos giran hacia el centro; las letras forman el rombo */
    E.cierre.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 420)`);
    const pn = tr(t, 54, 55.8);
    E.cierre.nodos.forEach((n, i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + pn * 2.4, r = 300 * (1 - pn);
      n.setAttribute("cx", (800 + Math.cos(a) * r).toFixed(1)); n.setAttribute("cy", (420 + Math.sin(a) * r).toFixed(1)); n.setAttribute("opacity", (1 - lin(t, 55.6, 56)).toFixed(2)); });
    const pj = lin(t, 54.4, 56.4);
    letrasRom.forEach((L3, i) => { const d = ease(clamp((pj - (i % 15) * 0.02) / 0.7, 0, 1)), op = t > 53.8 ? Math.min(1, pj * 3) * (1 - tr(t, 56.4, 57)) : 0;
      L3.e.setAttribute("opacity", op.toFixed(3)); L3.e.setAttribute("transform", `translate(${(L3.sx + (L3.x - L3.sx) * d).toFixed(1)} ${(L3.sy + (L3.y - L3.sy) * d).toFixed(1)})`); });
    E.cierre.rombo.setAttribute("opacity", tr(t, 55.8, 56.6).toFixed(3));
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
    validar() { return { ok: true, notas: ["ilustración y textos propios", "película y vida real diferenciadas", "sin red", "saludo solo como fragmento pequeño, sin texto"] }; } };
})();

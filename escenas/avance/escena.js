/* El avance · portadilla del acto V — «Enigma en grabado y tinta» (misma arquitectura y helpers que escenas/carta-churchill-v2).
   Un avance de cine propio del caso: golpes cortos, textos breves, cortes que entran en el patrón. Anticipa las cinco
   escenas (paradigma, concepto, intención, solución, progreso) sin repetirlas. Siluetas planas sin rostro, paleta mínima,
   un mundo hecho de rotores, letras cifradas y grabado. Ilustración y textos propios; sin diálogos de la película.
   Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 30, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
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
  /* golpe: algo que cae de grande a su tamaño (sello, signo) */
  const golpe = (t, a, d = 0.3, desde = 2) => { const p = lin(t, a, a + d); return { on: p > 0, s: p < 1 ? desde - (desde - 1) * easeIn(p) : 1 }; };
  let semilla = 1939; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const mundo = $("mundo"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ── siluetas propias (origen en los pies) — las mismas de las cinco escenas ── */
  const FIG = {
    turing: { cuerpo: "M-52 -300C-62 -240 -60 -190 -50 -150L-40 0H-8L0 -130L8 0H40L50 -150C60 -190 62 -240 52 -300C36 -318 18 -324 0 -324C-18 -324 -36 -318 -52 -300Z", cabeza: [0, -362, 36], extra: "" },
    oficial: { cuerpo: "M-80 -300C-92 -230 -86 -170 -70 -140L-58 0H-14L0 -120L14 0H58L70 -140C86 -170 92 -230 80 -300C56 -322 28 -330 0 -330C-28 -330 -56 -322 -80 -300Z", cabeza: [0, -370, 38], extra: "M-46 -398H46L36 -428H-36ZM-60 -402H60V-390H-60Z" },
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
  function rotor(cx, cy, r, padre, color) {
    const g = el("g", {}, padre), gi = el("g", {}, g);
    el("circle", { cx, cy, r, class: "rotor-aro", style: `stroke:${color}` }, gi); el("circle", { cx, cy, r: r * 0.62, class: "rotor-aro", style: `stroke:${color}` }, gi);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; el("rect", { x: cx + Math.cos(a) * (r + 6) - 9, y: cy + Math.sin(a) * (r + 6) - 9, width: 18, height: 18, class: "rotor-diente", style: `fill:${color}`, transform: `rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * (r + 6)} ${cy + Math.sin(a) * (r + 6)})` }, gi);
      el("text", { x: cx + Math.cos(a) * r * 0.81, y: cy + Math.sin(a) * r * 0.81 + 8, class: "rotor-letra", "text-anchor": "middle", style: `fill:${color}` }, gi, ABC[i]); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el("path", { d: `M${cx} ${cy}L${cx + Math.cos(a) * r * 0.6} ${cy + Math.sin(a) * r * 0.6}`, stroke: color, "stroke-width": 3 }, gi); }
    g.gi = gi; g.cx = cx; g.cy = cy; return g;
  }
  /* los cinco signos de las formas de la idea (centrados en 0,0; s ≈ radio) */
  const COLOR = ["#006060", "#00A080", "#3DD9B0", "#E08000", "#E02040"], NOMBRE = ["PARADIGMA", "CONCEPTO", "INTENCIÓN", "SOLUCIÓN", "PROGRESO"];
  function signo(k, s, padre, clase = "") {
    const c = `signo f${k + 1} ${clase}`;
    if (k === 0) return el("circle", { cx: 0, cy: 0, r: s, class: c }, padre);
    if (k === 1) return el("rect", { x: -s * 0.88, y: -s * 0.88, width: s * 1.76, height: s * 1.76, class: c }, padre);
    if (k === 2) return el("path", { d: `M0 ${-s * 1.08}L${s * 1.12} ${s * 0.86}H${-s * 1.12}Z`, class: c }, padre);
    if (k === 3) return el("path", { d: `M0 ${-s * 1.15}L${s * 1.15} 0L0 ${s * 1.15}L${-s * 1.15} 0Z`, class: c }, padre);
    const F = [[-290, -60], [90, -60], [90, -150], [290, 0], [90, 150], [90, 60], [-290, 60]], k2 = (s * 1.2) / 290;
    return el("path", { d: "M" + F.map(([x, y]) => `${(x * k2).toFixed(1)} ${(y * k2).toFixed(1)}`).join("L") + "Z", class: c }, padre);
  }

  /* ═══ escenas (cada una trae su fondo: los cortes entran en el patrón) ═══ */
  const E = {};
  const escena = (id, a, b, op = {}) => { const g = el("g", { id }, mundo); E[id] = { g, a, b, f: op.f || 0.3, zoom: op.zoom || 0.7, cx: op.cx || 800, cy: op.cy || 450 };
    if (op.fondo) el("rect", { x: -400, y: -300, width: W + 800, height: H + 600, fill: op.fondo }, g); return g; };

  /* S0 · 1939: un rotor que se enciende */
  const s0 = escena("anio", 0, 3.2, { fondo: "#0A1F2E", cy: 440 });
  E.anio.brillo = el("circle", { cx: 800, cy: 440, r: 420, fill: "url(#g-brillo)", opacity: 0 }, s0);
  E.anio.rosa = guilloche(800, 440, 380, [[57, 120, 57], [83, 140, 83]], s0, "#E7B53A", 0.16);
  E.anio.rotor = rotor(800, 440, 300, s0, "#E7B53A");
  E.anio.dientes = Array.from(E.anio.rotor.gi.querySelectorAll("rect")); E.anio.letras = Array.from(E.anio.rotor.gi.querySelectorAll("text"));
  E.anio.aros = Array.from(E.anio.rotor.gi.querySelectorAll("circle, path"));
  el("circle", { cx: 800, cy: 440, r: 176, class: "tinta" }, s0);
  E.anio.txt = el("text", { x: 800, y: 518, class: "golpe-xl", "text-anchor": "middle", style: "font-size:200px" }, s0, "1939");

  /* S1 · un mensaje cifrado cada día: letras que pasan por el rotor */
  const s1 = escena("mensaje", 3.2, 6.4, { fondo: "#F1EADB", cy: 540 });
  guilloche(800, 540, 330, [[61, 140, 61]], s1, "#0A1F2E", 0.12);
  el("text", { x: 800, y: 190, class: "golpe", "text-anchor": "middle" }, s1, "Un mensaje cifrado cada día.");
  E.mensaje.carril = el("rect", { x: -50, y: 512, width: W + 100, height: 56, fill: "#E6DCC6" }, s1);
  const CLARO = "WETTERBERICHTXFUERXDENXTAG".split("");
  /* como en Enigma, ninguna letra se cifra en sí misma */
  const CIF = CLARO.map((c) => { let k = c; while (k === c) k = ABC[Math.floor(azar() * 26)]; return k; });
  const capaChorro = el("g", {}, s1);
  E.mensaje.letras = CLARO.map((c, i) => ({ i, p: CLARO.length - 1 - i, e: el("text", { y: 556, class: "chorro", "text-anchor": "middle" }, capaChorro, c) }));
  E.mensaje.rotor = rotor(800, 540, 150, s1, "#0A1F2E");
  el("circle", { cx: 800, cy: 540, r: 88, class: "crema" }, E.mensaje.rotor.gi);
  el("text", { x: 800, y: 556, class: "chorro", "text-anchor": "middle", style: "fill:#C8102E" }, s1, "→");

  /* S2 · 159 trillones: la cifra estalla en dígitos */
  const s2 = escena("cifra", 6.4, 9.8, { fondo: "#0A1F2E" });
  E.cifra.campo = el("g", {}, s2);
  const NUM = "158.962.555.217.826.360.000", PASO = 36, X0 = 800 - ((NUM.length - 1) * PASO) / 2;
  E.cifra.digitos = NUM.split("").map((c, i) => ({ i, x: X0 + i * PASO, dx: (azar() - 0.5) * 1700, dy: (azar() - 0.5) * 1100, r: (azar() - 0.5) * 540,
    e: el("text", { x: 0, y: 0, class: "digito", "text-anchor": "middle" }, s2, c) }));
  E.cifra.sueltos = Array.from({ length: 160 }, () => { const a = azar() * Math.PI * 2, d = 260 + azar() * 820;
    return { tx: Math.cos(a) * d, ty: Math.sin(a) * d * 0.62, r: (azar() - 0.5) * 360, k: azar(), e: el("text", { class: "digito-suelto", "text-anchor": "middle", opacity: 0 }, E.cifra.campo, String(Math.floor(azar() * 10))) }; });
  el("rect", { x: 520, y: 118, width: 560, height: 46, fill: "#0A1F2E" }, s2);
  el("text", { x: 800, y: 150, class: "ceja oro", "text-anchor": "middle" }, s2, "ENIGMA MILITAR · TRES ROTORES");
  E.cifra.big = el("g", { opacity: 0 }, s2);
  el("rect", { x: 330, y: 310, width: 940, height: 330, rx: 18, fill: "#0A1F2E", opacity: 0.82 }, E.cifra.big);
  el("text", { x: 800, y: 470, class: "golpe-cifra", "text-anchor": "middle" }, E.cifra.big, "159 trillones");
  el("text", { x: 800, y: 580, class: "golpe claro", "text-anchor": "middle", style: "font-size:72px;fill:#E7B53A" }, E.cifra.big, "de posibilidades.");

  /* S3 · dos miradas: traducción (oficial) o rompecabezas (Turing) */
  const s3 = escena("miradas", 9.8, 14.2, { fondo: "#F1EADB" });
  E.miradas.rosa = guilloche(400, 520, 330, [[61, 140, 61]], s3, "#C8102E", 0.2);
  E.miradas.palabras = [["der Feind", 120, 300], ["die Küste", 610, 360], ["das Schiff", 90, 560], ["die Nacht", 640, 610], ["der Morgen", 150, 760], ["die Meldung", 600, 800]]
    .map(([w, x, y], i) => { const e = el("text", { x, y, class: "palabra", "text-anchor": "middle", opacity: 0 }, s3, w); e.i = i; return e; });
  E.miradas.oficial = figura("oficial", 380, 880, 1.32, "rojo", s3);
  /* la rejilla del rompecabezas detrás de Turing */
  E.miradas.rejilla = el("g", { opacity: 0 }, s3);
  E.miradas.celdas = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) { const x = 1110 + c * 66, y = 300 + r * 66, g = el("g", {}, E.miradas.rejilla);
    const q = el("rect", { x, y, width: 62, height: 62, rx: 4, class: "celda" }, g); el("text", { x: x + 31, y: y + 40, class: "celda-letra", "text-anchor": "middle" }, g, ABC[Math.floor(azar() * 26)]);
    E.miradas.celdas.push({ q, k: azar(), on: azar() < 0.32 }); }
  E.miradas.turing = figura("turing", 980, 880, 1.2, "tinta", s3);
  E.miradas.txtA = el("text", { x: 800, y: 150, class: "golpe", "text-anchor": "middle" }, s3, "Un problema de traducción…");
  E.miradas.txtB = el("text", { x: 800, y: 150, class: "golpe", "text-anchor": "middle" }, s3, "…o un rompecabezas.");

  /* S4 · una máquina contra otra máquina */
  const s4 = escena("maquinas", 14.2, 17, { fondo: "#0A1F2E", cy: 400 });
  guilloche(800, 400, 440, [[47, 110, 47]], s4, "#E7B53A", 0.14);
  E.maquinas.r1 = rotor(612, 400, 170, s4, "#F1EADB"); E.maquinas.r2 = rotor(988, 400, 170, s4, "#C8102E");
  E.maquinas.chispa = el("g", { opacity: 0 }, s4);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; el("path", { d: `M${800 + Math.cos(a) * 16} ${400 + Math.sin(a) * 16}L${800 + Math.cos(a) * 58} ${400 + Math.sin(a) * 58}`, stroke: "#E7B53A", "stroke-width": 6, "stroke-linecap": "round" }, E.maquinas.chispa); }
  el("text", { x: 800, y: 760, class: "golpe claro", "text-anchor": "middle" }, s4, "Una máquina contra otra máquina.");

  /* S5 · golpes rápidos: los signos de los cinco pasos */
  const GA = 17, GD = 0.85;
  /* 5a · el plano (concepto) */
  const g1 = escena("plano", GA, GA + GD, { fondo: "#0A1F2E", f: 0.16, zoom: 0.5 });
  for (let x = 120; x < 1600; x += 60) el("path", { d: `M${x} 0V900`, class: "plano-reticula" }, g1);
  for (let y = 30; y < 900; y += 60) el("path", { d: `M0 ${y}H1600`, class: "plano-reticula" }, g1);
  E.plano.trazos = [];
  el("rect", { x: 430, y: 180, width: 740, height: 520, rx: 10, class: "plano-linea" }, g1);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) E.plano.trazos.push(el("circle", { cx: 530 + c * 135, cy: 300 + r * 140, r: 52, class: "plano-linea", "stroke-dasharray": 330, "stroke-dashoffset": 330 }, g1));
  el("text", { x: 450, y: 160, class: "ceja", style: "fill:#00A080;font-size:22px" }, g1, "PLANO");
  /* 5b · el sello (la carta) */
  const g2 = escena("sello", GA + GD, GA + 2 * GD, { fondo: "#F1EADB", f: 0.16, zoom: 0.5 });
  guilloche(800, 450, 420, [[61, 140, 61]], g2, "#C8102E", 0.15);
  const pap = el("g", { transform: "translate(800 450) rotate(-4)" }, g2);
  el("rect", { x: -230, y: -300, width: 460, height: 600, class: "papel" }, pap);
  el("text", { x: -190, y: -230, class: "papel-texto" }, pap, "SOLICITUD");
  [-170, -120, -70, 110, 160, 210].forEach((y) => el("path", { d: `M-190 ${y}H190`, class: "renglon" }, pap));
  E.sello.marca = el("g", {}, pap);
  el("rect", { x: -175, y: -52, width: 350, height: 104, rx: 10, class: "sello" }, E.sello.marca);
  el("text", { x: 0, y: 21, class: "sello-texto", "text-anchor": "middle", style: "font-size:56px" }, E.sello.marca, "DENEGADO");
  /* 5c · el triángulo (la intención) */
  const g3 = escena("triangulo", GA + 2 * GD, GA + 3 * GD, { fondo: "#0A1F2E", f: 0.16, zoom: 0.5 });
  E.triangulo.rosa = guilloche(800, 450, 400, [[67, 130, 67]], g3, "#E7B53A", 0.25);
  E.triangulo.sig = el("g", {}, g3); signo(2, 220, E.triangulo.sig, "sobre-tinta");
  /* 5d · el mapa con barcos (la solución) */
  const g4 = escena("mapa", GA + 3 * GD, GA + 4 * GD, { fondo: "#F1EADB", f: 0.16, zoom: 0.5 });
  el("rect", { x: 200, y: 110, width: 1200, height: 680, class: "mapa" }, g4);
  for (let x = 260; x < 1400; x += 60) el("path", { d: `M${x} 112V788`, class: "reticula" }, g4);
  for (let y = 170; y < 790; y += 60) el("path", { d: `M202 ${y}H1398`, class: "reticula" }, g4);
  el("path", { d: "M202 112H480C500 170 440 230 470 290C500 350 410 380 380 450C350 520 280 540 202 560Z", class: "tierra" }, g4);
  el("path", { d: "M1398 420C1340 450 1300 520 1330 590C1360 660 1310 740 1340 788H1398Z", class: "tierra" }, g4);
  E.mapa.ruta = el("path", { d: "M330 720C560 650 820 540 1260 330", class: "ruta" }, g4);
  E.mapa.barcos = [0, 1, 2, 3, 4].map((k) => { const g = el("g", {}, g4); el("path", { d: "M-34 0H34L24 16H-24Z", class: "barco" }, g); el("rect", { x: -12, y: -14, width: 20, height: 14, class: "barco" }, g); g.k = k; return g; });
  E.mapa.amenazas = [[1060, 210], [1200, 250], [920, 170]].map(([x, y]) => el("path", { d: `M${x} ${y - 20}L${x + 18} ${y + 14}H${x - 18}Z`, class: "amenaza", opacity: 0 }, g4));
  /* 5e · el expediente que se sella (el progreso) */
  const g5 = escena("expediente", GA + 4 * GD, GA + 5 * GD, { fondo: "#0A1F2E", f: 0.16, zoom: 0.6 });
  guilloche(800, 450, 420, [[73, 150, 73]], g5, "#E02040", 0.18);
  const carp = el("g", { transform: "translate(800 470) rotate(3)" }, g5);
  el("path", { d: "M-380 -250H-140L-110 -290H60L90 -250H380V250H-380Z", class: "carpeta" }, carp);
  el("text", { x: 0, y: -40, class: "carpeta-texto", "text-anchor": "middle" }, carp, "ULTRA");
  el("path", { d: "M-260 30H260M-260 90H260", class: "renglon" }, carp);
  E.expediente.marca = el("g", {}, carp);
  el("rect", { x: -190, y: 110, width: 380, height: 104, rx: 10, class: "sello" }, E.expediente.marca);
  el("text", { x: 0, y: 184, class: "sello-texto", "text-anchor": "middle" }, E.expediente.marca, "SECRETO");

  /* S6 · el título y los cinco signos */
  const s6 = escena("titulo", GA + 5 * GD, 26.6, { fondo: "#0A1F2E", cy: 420 });
  E.titulo.rosa = guilloche(800, 420, 400, [[57, 120, 19], [83, 140, 83]], s6, "#E7B53A", 0.13);
  E.titulo.ceja = el("text", { x: 800, y: 170, class: "ceja oro", "text-anchor": "middle" }, s6, "THE IMITATION GAME (2014)");
  E.titulo.l1 = el("text", { x: 800, y: 320, class: "titulo-grande", "text-anchor": "middle" }, s6, "Las cinco formas");
  E.titulo.l2 = el("text", { x: 800, y: 450, class: "titulo-grande", "text-anchor": "middle" }, s6, "de una idea");
  E.titulo.signos = NOMBRE.map((n, k) => { const x = 800 + (k - 2) * 200, g = el("g", {}, s6), gs = el("g", {}, g);
    signo(k, 48, gs, "sobre-tinta"); el("text", { x: 0, y: 108, class: "signo-nombre", "text-anchor": "middle" }, g, n); g.x = x; g.gs = gs; return g; });

  /* S7 · remate: un caso aplicado */
  const s7 = escena("remate", 26.6, D + 1, { fondo: "#F1EADB", cy: 430 });
  E.remate.rosa = guilloche(800, 430, 380, [[57, 120, 57], [83, 140, 83]], s7, "#0A1F2E", 0.12);
  E.remate.signos = [0, 1, 2, 3, 4].map((k) => { const g = el("g", {}, s7); signo(k, 22, g); return g; });
  E.remate.txt = el("text", { x: 800, y: 500, class: "remate", "text-anchor": "middle" }, s7, "Un caso aplicado.");
  E.remate.raya = el("path", { d: "M560 560H1040", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 480, "stroke-dashoffset": 480 }, s7);

  /* texto para lectores de pantalla (los textos visibles viven dentro del dibujo) */
  const SUBS = [
    [0.4, 3.2, "1939."], [3.2, 6.4, "Un mensaje cifrado cada día."], [6.4, 9.8, "159 trillones de posibilidades."],
    [9.8, 12, "Un problema de traducción…"], [12, 14.2, "…o un rompecabezas."], [14.2, 17, "Una máquina contra otra máquina."],
    [17, 21.25, "Un plano. Un sello: denegado. Un triángulo. Un mapa con barcos. Un expediente que se sella."],
    [21.25, 26.6, "The Imitation Game (2014). Las cinco formas de una idea: paradigma, concepto, intención, solución, progreso."],
    [26.6, D + 0.1, "Un caso aplicado."],
  ];
  const NOTAS = [[27.6, D + 1, "Basado en la historia de Bletchley Park y en la película <i>The Imitation Game</i> (2014). Ilustración propia."]];
  const sub = $("subtitulo"), nota = $("nota"); let subI = -2, notaI = -2;

  function vis(t, a, b, f = 0.3) { return Math.min(a <= 0 ? 1 : tr(t, a - f / 2, a + f / 2), 1 - tr(t, b - f / 2, b + f / 2)); }

  function cuadro(t) {
    t = clamp(Number(t) || 0, 0, D);
    $("cortina").setAttribute("opacity", (1 - tr(t, 0, 0.8) + tr(t, D - 0.7, D)).toFixed(3));
    /* cámara: cada golpe entra desde un poco lejos y sale entrando en su patrón */
    for (const k in E) { const { g, a, b, f, zoom, cx, cy } = E[k]; const v = vis(t, a, b, f);
      const ent = 1 - tr(t, a - 0.3, a + 0.6), sal = lin(t, b - 0.45, b + f / 2);
      const s = 1 - 0.06 * ent + zoom * easeIn(sal);
      g.setAttribute("opacity", v.toFixed(3)); g.setAttribute("transform", `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`);
      g.style.display = v > 0.001 ? "" : "none"; }

    /* S0: el rotor se enciende diente a diente; 1939 */
    E.anio.dientes.forEach((d, i) => d.setAttribute("opacity", lin(t, 0.4 + i * 0.035, 0.6 + i * 0.035).toFixed(3)));
    E.anio.letras.forEach((d, i) => d.setAttribute("opacity", (0.25 + 0.75 * lin(t, 0.5 + i * 0.035, 0.7 + i * 0.035)).toFixed(3)));
    E.anio.aros.forEach((d) => d.setAttribute("opacity", (0.3 + 0.7 * tr(t, 0.3, 1.2)).toFixed(3)));
    E.anio.brillo.setAttribute("opacity", (tr(t, 1.2, 1.7) * (0.75 + 0.25 * Math.sin(t * 9))).toFixed(3));
    E.anio.rotor.gi.setAttribute("transform", `rotate(${(-Math.floor(t * 4) * (360 / 26)).toFixed(2)} 800 440)`);
    E.anio.rosa.setAttribute("transform", `rotate(${(t * 7).toFixed(2)} 800 440)`);
    const g0 = golpe(t, 1.45, 0.3, 1.6); E.anio.txt.setAttribute("opacity", g0.on ? "1" : "0");
    E.anio.txt.setAttribute("transform", `translate(800 440) scale(${g0.s.toFixed(3)}) translate(-800 -440)`);

    /* S1: el mensaje entra en claro (tinta) y sale cifrado (rojo); el rotor avanza un paso por letra */
    const v1 = 330, tt = t - 3.2; let pasos = 0;
    E.mensaje.letras.forEach((L) => { const x = 560 + v1 * tt * 1.3 - L.p * 54; const dentro = Math.abs(x - 800) < 170, cif = x > 800;
      if (x > 800) pasos++;
      L.e.setAttribute("x", x.toFixed(1)); L.e.textContent = cif ? CIF[L.i] : CLARO[L.i]; L.e.style.fill = cif ? "#C8102E" : "#0A1F2E";
      L.e.setAttribute("opacity", dentro || x < -40 || x > 1640 ? "0" : "1"); });
    E.mensaje.rotor.gi.setAttribute("transform", `rotate(${(pasos * (360 / 26)).toFixed(2)} 800 540)`);

    /* S2: la cifra se escribe, golpea y estalla en dígitos */
    E.cifra.digitos.forEach((d) => { const ap = lin(t, 6.5 + d.i * 0.03, 6.56 + d.i * 0.03), pe = ease(lin(t, 7.9, 9.4));
      d.e.setAttribute("opacity", (ap * (1 - 0.75 * pe)).toFixed(3));
      d.e.setAttribute("transform", `translate(${(d.x + d.dx * pe).toFixed(1)} ${(470 + d.dy * pe).toFixed(1)}) rotate(${(d.r * pe).toFixed(1)})`); });
    E.cifra.sueltos.forEach((d) => { const p = ease(lin(t, 7.9 + d.k * 0.4, 9.2 + d.k * 0.4));
      d.e.setAttribute("opacity", p > 0 ? (0.25 + 0.5 * d.k).toFixed(2) : "0");
      d.e.setAttribute("transform", `translate(${(800 + d.tx * p).toFixed(1)} ${(470 + d.ty * p).toFixed(1)}) rotate(${(d.r * p).toFixed(1)})`); });
    const g2 = golpe(t, 8.0, 0.28, 1.8); E.cifra.big.setAttribute("opacity", g2.on ? "1" : "0");
    E.cifra.big.setAttribute("transform", `translate(800 470) scale(${g2.s.toFixed(3)}) translate(-800 -470)`);

    /* S3: dos miradas al mismo problema */
    const b3 = tr(t, 11.9, 12.4);
    E.miradas.txtA.setAttribute("opacity", (tr(t, 10, 10.4) * (1 - lin(t, 11.75, 11.95))).toFixed(3));
    E.miradas.txtB.setAttribute("opacity", lin(t, 12.0, 12.25).toFixed(3));
    E.miradas.palabras.forEach((p) => p.setAttribute("opacity", (tr(t, 10.3 + p.i * 0.18, 10.7 + p.i * 0.18) * (1 - 0.7 * b3)).toFixed(3)));
    E.miradas.oficial.setAttribute("opacity", (1 - 0.55 * b3).toFixed(3));
    E.miradas.oficial.setAttribute("transform", `translate(${(380 - 40 * b3).toFixed(1)} ${(880 + 30 * (1 - tr(t, 9.8, 10.6))).toFixed(1)}) scale(1.32)`);
    E.miradas.rosa.setAttribute("opacity", (0.2 * (1 - 0.6 * b3)).toFixed(3));
    E.miradas.turing.setAttribute("transform", `translate(${(980 + 720 * (1 - b3)).toFixed(1)} 880) scale(1.2)`);
    E.miradas.rejilla.setAttribute("opacity", tr(t, 12.0, 12.5).toFixed(3));
    E.miradas.celdas.forEach((c) => c.q.classList.toggle("on", c.on && t > 12.4 + c.k * 1.4));

    /* S4: dos rotores llegan, engranan y giran en sentidos opuestos */
    const junta = tr(t, 14.2, 15.0), giro = Math.max(0, t - 14.9) * 70;
    E.maquinas.r1.setAttribute("transform", `translate(${(-520 * (1 - junta)).toFixed(1)} 0)`); E.maquinas.r2.setAttribute("transform", `translate(${(520 * (1 - junta)).toFixed(1)} 0)`);
    E.maquinas.r1.gi.setAttribute("transform", `rotate(${(giro + 90 * junta).toFixed(1)} 612 400)`); E.maquinas.r2.gi.setAttribute("transform", `rotate(${(-giro - 90 * junta).toFixed(1)} 988 400)`);
    const ch = lin(t, 14.95, 15.5); E.maquinas.chispa.setAttribute("opacity", (ch > 0 ? 1 - ch : 0).toFixed(3));
    E.maquinas.chispa.setAttribute("transform", `translate(800 400) scale(${(0.6 + 1.2 * ease(ch)).toFixed(3)}) translate(-800 -400)`);

    /* S5: golpes */
    E.plano.trazos.forEach((c, i) => c.setAttribute("stroke-dashoffset", (330 * (1 - tr(t, GA + 0.02 + i * 0.025, GA + 0.32 + i * 0.025))).toFixed(1)));
    const gs = golpe(t, GA + GD + 0.18, 0.2, 2.2); E.sello.marca.setAttribute("opacity", gs.on ? "1" : "0"); E.sello.marca.setAttribute("transform", `rotate(-12) scale(${gs.s.toFixed(3)})`);
    const gt = golpe(t, GA + 2 * GD + 0.02, 0.26, 0.2); E.triangulo.sig.setAttribute("transform", `translate(800 470) scale(${gt.on ? gt.s.toFixed(3) : 0})`);
    E.triangulo.rosa.setAttribute("transform", `rotate(${(t * 30).toFixed(1)} 800 450)`);
    const pv = lin(t, GA + 3 * GD - 0.1, GA + 4 * GD + 0.1), LR = E.mapa.ruta.getTotalLength();
    E.mapa.barcos.forEach((g) => { const pt = E.mapa.ruta.getPointAtLength(LR * clamp(0.18 + 0.45 * pv - g.k * 0.07, 0, 1)); g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${(pt.y - 10 + (g.k % 2) * 22).toFixed(1)}) rotate(-22)`); });
    E.mapa.amenazas.forEach((a, i) => a.setAttribute("opacity", lin(t, GA + 3 * GD + 0.25 + i * 0.08, GA + 3 * GD + 0.35 + i * 0.08).toFixed(2)));
    const ge = golpe(t, GA + 4 * GD + 0.22, 0.2, 2.2); E.expediente.marca.setAttribute("opacity", ge.on ? "1" : "0");
    E.expediente.marca.setAttribute("transform", `translate(0 162) rotate(-8) scale(${ge.s.toFixed(3)}) translate(0 -162)`);

    /* S6: título y los cinco signos, uno por uno */
    const a6 = GA + 5 * GD;
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 420)`);
    E.titulo.ceja.setAttribute("opacity", tr(t, a6 + 0.2, a6 + 0.7).toFixed(3));
    [E.titulo.l1, E.titulo.l2].forEach((l, i) => { const p = tr(t, a6 + 0.5 + i * 0.35, a6 + 1.1 + i * 0.35); l.setAttribute("opacity", p.toFixed(3)); l.setAttribute("transform", `translate(0 ${(24 * (1 - p)).toFixed(1)})`); });
    E.titulo.signos.forEach((g, k) => { const gk = golpe(t, a6 + 1.9 + k * 0.5, 0.26, 0.2);
      g.setAttribute("opacity", gk.on ? "1" : "0"); g.setAttribute("transform", `translate(${g.x} 640)`); g.gs.setAttribute("transform", `scale(${gk.on ? gk.s.toFixed(3) : 0})`);
      g.lastChild.setAttribute("opacity", tr(t, a6 + 2.05 + k * 0.5, a6 + 2.4 + k * 0.5).toFixed(3)); });

    /* S7: remate */
    E.remate.rosa.setAttribute("transform", `rotate(${(-t * 4).toFixed(2)} 800 430)`);
    E.remate.signos.forEach((g, k) => { const p = tr(t, 26.5 + k * 0.08, 27.2 + k * 0.08);
      g.setAttribute("transform", `translate(${(800 + (k - 2) * (200 - 130 * p)).toFixed(1)} ${(640 - 380 * p).toFixed(1)}) scale(${(2.2 - 1.2 * p).toFixed(3)})`); });
    E.remate.txt.setAttribute("opacity", tr(t, 27.0, 27.5).toFixed(3));
    E.remate.raya.setAttribute("stroke-dashoffset", (480 * (1 - tr(t, 27.4, 28.3))).toFixed(1));

    /* texto para lectores y rótulo final */
    const i = SUBS.findIndex(([a, b]) => t >= a && t < b);
    if (i !== subI) { subI = i; sub.textContent = i >= 0 ? SUBS[i][2] : ""; }
    const j = NOTAS.findIndex(([a, b]) => t >= a && t < b);
    if (j !== notaI) { notaI = j; if (j >= 0) nota.innerHTML = NOTAS[j][2]; }
    nota.style.opacity = j >= 0 ? String(tr(t, NOTAS[j][0], NOTAS[j][0] + 0.6) * (1 - tr(t, D - 0.7, D))) : "0";
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
  if (q.has("t")) { t = clamp(Number(q.get("t")) || 0, 0, D); pintar(); } else if (q.has("auto") && !reducido()) reproducir();
  window.escena = { listo: true, duracion: D, cuadro(s) { t = clamp(Number(s) || 0, 0, D); pintar(); }, sonido() { return []; },
    validar() { const ok = Object.keys(E).length === 12 && NOTAS.length === 1; return { ok, notas: ["ilustración y textos propios", "sin diálogos ni planos de la película", "rótulo «basado en» al final", "sin red"] }; } };
})();

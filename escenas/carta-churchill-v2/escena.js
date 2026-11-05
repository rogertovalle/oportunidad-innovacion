/* La carta · v2 — «Enigma en grabado y tinta».
   Principios tomados del lenguaje de las secuencias de títulos gráficas (siluetas planas, paleta mínima, un mundo hecho
   del motivo, cuerpos que se deshacen en el motivo, cámara que entra y sale del patrón). Motivo propio: rotores y letras
   de Enigma. Ilustración y textos propios; cuenta el paso como lo plantea la película y agrega lo que pasó en la vida real.
   Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 46, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
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
  let semilla = 1941; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const mundo = $("mundo");

  /* ── siluetas propias (origen en los pies) ── */
  const FIG = {
    turing: { cuerpo: "M-52 -300C-62 -240 -60 -190 -50 -150L-40 0H-8L0 -130L8 0H40L50 -150C60 -190 62 -240 52 -300C36 -318 18 -324 0 -324C-18 -324 -36 -318 -52 -300Z", cabeza: [0, -362, 36], extra: "" },
    oficial: { cuerpo: "M-80 -300C-92 -230 -86 -170 -70 -140L-58 0H-14L0 -120L14 0H58L70 -140C86 -170 92 -230 80 -300C56 -322 28 -330 0 -330C-28 -330 -56 -322 -80 -300Z", cabeza: [0, -370, 38], extra: "M-46 -398H46L36 -428H-36ZM-60 -402H60V-390H-60Z" },
    estadista: { cuerpo: "M-92 -290C-112 -220 -104 -150 -76 -120L-62 0H-16L0 -110L16 0H62L76 -120C104 -150 112 -220 92 -290C64 -316 32 -322 0 -322C-32 -322 -64 -316 -92 -290Z", cabeza: [0, -358, 42], extra: "M-40 -392C-40 -444 40 -444 40 -392ZM-68 -392C-40 -378 40 -378 68 -392C40 -402 -40 -402 -68 -392Z" },
    colega: { cuerpo: "M-66 -300C-76 -236 -72 -180 -60 -150L-50 0H-12L0 -126L12 0H50L60 -150C72 -180 76 -236 66 -300C44 -320 22 -326 0 -326C-22 -326 -44 -320 -66 -300Z", cabeza: [0, -364, 36], extra: "" },
  };
  function figura(tipo, x, y, s, clase, padre) {
    const f = FIG[tipo], g = el("g", { transform: `translate(${x} ${y}) scale(${s})`, class: clase }, padre);
    el("path", { d: f.cuerpo }, g); el("circle", { cx: f.cabeza[0], cy: f.cabeza[1], r: f.cabeza[2] }, g); if (f.extra) el("path", { d: f.extra }, g);
    g.dataset.tipo = tipo; g.dataset.x = x; g.dataset.y = y; g.dataset.s = s; return g;
  }
  /* puntos dentro de una silueta (para deshacerla en letras) */
  function puntosDe(tipo, x, y, s, n) {
    const c = doc.createElement("canvas"); c.width = W; c.height = H; const k = c.getContext("2d");
    k.setTransform(s, 0, 0, s, x, y); const f = FIG[tipo]; k.fill(new Path2D(f.cuerpo)); k.beginPath(); k.arc(f.cabeza[0], f.cabeza[1], f.cabeza[2], 0, 7); k.fill(); if (f.extra) k.fill(new Path2D(f.extra));
    const px = k.getImageData(0, 0, W, H).data, out = []; let intentos = 0;
    while (out.length < n && intentos++ < n * 400) { const xx = Math.floor(azar() * W), yy = Math.floor(azar() * H); if (px[(yy * W + xx) * 4 + 3] > 0) out.push([xx, yy]); }
    return out;
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
    const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; el("rect", { x: cx + Math.cos(a) * (r + 6) - 9, y: cy + Math.sin(a) * (r + 6) - 9, width: 18, height: 18, class: "rotor-diente", style: `fill:${color}`, transform: `rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * (r + 6)} ${cy + Math.sin(a) * (r + 6)})` }, gi);
      el("text", { x: cx + Math.cos(a) * r * 0.81, y: cy + Math.sin(a) * r * 0.81 + 8, class: "rotor-letra", "text-anchor": "middle", style: `fill:${color}` }, gi, ABC[i]); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; el("path", { d: `M${cx} ${cy}L${cx + Math.cos(a) * r * 0.6} ${cy + Math.sin(a) * r * 0.6}`, stroke: color, "stroke-width": 3 }, gi); }
    g.gi = gi; g.cx = cx; g.cy = cy; return g;
  }
  function sobre(padre) { const g = el("g", {}, padre); el("rect", { x: -48, y: -32, width: 96, height: 64, rx: 4, class: "sobre" }, g); el("path", { d: "M-48 -32L0 8 48 -32", class: "sobre-pliegue" }, g); return g; }

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b) => { const g = el("g", { id }, mundo); E[id] = { g, a, b }; return g; };

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.6);
  E.titulo.rosa = guilloche(800, 450, 300, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#0A1F2E", 0.35);
  E.titulo.rosa2 = guilloche(800, 450, 300, [[73, 150, 73]], s0, "#E7B53A", 0.7);
  el("text", { x: 800, y: 360, class: "titulo-ceja", "text-anchor": "middle" }, s0, "PASO 3 · LA IDEA COMO INTENCIÓN");
  el("text", { x: 800, y: 500, class: "titulo-grande", "text-anchor": "middle" }, s0, "La carta");
  E.titulo.raya = el("path", { d: "M600 540H1000", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 400, "stroke-dashoffset": 400 }, s0);

  /* S1 · el «no» */
  const s1 = escena("no", 4.6, 11);
  guilloche(1080, 420, 420, [[61, 140, 61]], s1, "#C8102E", 0.18);
  E.no.oficial = figura("oficial", 1100, 900, 1.95, "rojo", s1);
  el("rect", { x: 720, y: 640, width: 760, height: 130, class: "tinta" }, s1);
  E.no.turing = figura("turing", 360, 880, 0.95, "tinta", s1);
  const pap = E.no.papel = el("g", {}, s1);
  el("rect", { x: -150, y: -190, width: 300, height: 380, class: "papel" }, pap);
  el("text", { x: -122, y: -138, class: "papel-texto" }, pap, "SOLICITUD");
  el("text", { x: -122, y: -102, class: "papel-texto", style: "font-size:20px" }, pap, "piezas para la máquina");
  [-60, -20, 20, 60, 100].forEach((y) => el("path", { d: `M-122 ${y}H122`, class: "renglon" }, pap));
  const sello = E.no.sello = el("g", {}, pap);
  el("rect", { x: -150, y: -50, width: 300, height: 96, rx: 8, class: "sello" }, sello);
  el("text", { x: 0, y: 20, class: "sello-texto", "text-anchor": "middle" }, sello, "DENEGADO");

  /* S2 · la idea: una máquina contra otra máquina */
  const s2 = escena("idea", 11, 17.2);
  guilloche(800, 450, 430, [[47, 110, 47]], s2, "#0A1F2E", 0.16);
  E.idea.r1 = rotor(610, 440, 190, s2, "#0A1F2E"); E.idea.r2 = rotor(1000, 440, 190, s2, "#C8102E");

  /* S3 · saltarse al comandante */
  const s3 = escena("cadena", 17.2, 25.4);
  E.cadena.turing = figura("turing", 300, 880, 0.82, "tinta", s3);
  E.cadena.oficial = figura("oficial", 800, 880, 1.45, "rojo", s3);
  E.cadena.estadista = figura("estadista", 1300, 640, 0.95, "tinta", s3);
  el("path", { d: "M1150 640H1450V660H1150Z", class: "tinta" }, s3);
  E.cadena.ruta = el("path", { d: "M380 560C460 220 700 40 940 110S1200 250 1260 300", fill: "none", stroke: "#E7B53A", "stroke-width": 4, "stroke-dasharray": "10 12", opacity: 0 }, s3);
  E.cadena.sobre = sobre(s3);
  E.cadena.puntos = puntosDe("oficial", 800, 880, 1.45, 240);

  /* S4 · a quién le vendió de verdad */
  const s4 = escena("franjas", 25.4, 32.8);
  const BANDAS = [
    { x: -100, color: "#00A080", tipo: "colega", quien: "ALEXANDER", texto: ["Su poder y", "reconocimiento", "como líder"], marca: "x" },
    { x: 430, color: "#1F6F86", tipo: "estadista", quien: "CHURCHILL", texto: ["Ganar", "la guerra"], marca: "v" },
    { x: 960, color: "#C8102E", tipo: "oficial", quien: "EL COMANDANTE", texto: ["Disciplina,", "estructura", "y orden"], marca: "x" },
  ];
  E.franjas.bandas = BANDAS.map((b, i) => {
    const g = el("g", {}, s4);
    el("path", { d: `M${b.x + 300} 0H${b.x + 900}L${b.x + 600} 900H${b.x}Z`, fill: b.color }, g);
    const cx = b.x + 450;
    figura(b.tipo, cx - 10, 760, 0.62, "tinta", g);
    el("text", { x: cx, y: 130, class: "franja-quien", "text-anchor": "middle" }, g, b.quien);
    b.texto.forEach((l, j) => el("text", { x: cx + 20, y: 190 + j * 40, class: "franja-texto", "text-anchor": "middle" }, g, l));
    const m = el("g", { transform: `translate(${cx} 390)` }, g);
    if (b.marca === "x") el("path", { d: "M-46 -46L46 46M46 -46L-46 46", class: "marca-x" }, m); else el("path", { d: "M-56 0L-14 44L62 -54", class: "marca-v" }, m);
    g.marca = m; g.cx = cx; return g;
  });
  E.franjas.sobre = sobre(s4);

  /* S5 · la respuesta */
  const s5 = escena("respuesta", 32.8, 38.2);
  el("rect", { width: W, height: H, class: "tinta" }, s5);
  guilloche(800, 430, 380, [[67, 130, 67]], s5, "#E7B53A", 0.22);
  E.respuesta.etiqueta = el("g", {}, s5);
  el("rect", { x: -300, y: -70, width: 600, height: 140, rx: 10, class: "etiqueta" }, E.respuesta.etiqueta);
  el("text", { x: 0, y: 20, class: "etiqueta-texto", "text-anchor": "middle" }, E.respuesta.etiqueta, "ACTION THIS DAY");
  E.respuesta.pelicula = el("g", { opacity: 0 }, s5);
  el("text", { x: 800, y: 640, class: "etiqueta-pelicula", "text-anchor": "middle", style: "fill:#E7B53A" }, E.respuesta.pelicula, "ASÍ LO CUENTA LA PELÍCULA");
  el("text", { x: 800, y: 700, class: "franja-texto", "text-anchor": "middle" }, E.respuesta.pelicula, "Turing queda al mando del equipo");

  /* S6 · en la vida real */
  const s6 = escena("real", 38.2, 42.8);
  const hoja = el("g", { transform: "translate(-250 0)" }, s6);
  el("rect", { x: 420, y: 140, width: 760, height: 560, class: "papel" }, hoja);
  el("text", { x: 470, y: 210, class: "papel-texto", style: "fill:#C8102E;font-size:22px;letter-spacing:2px" }, hoja, "SECRETO · SOLO PARA EL PRIMER MINISTRO");
  el("text", { x: 470, y: 262, class: "papel-texto", style: "font-size:22px" }, hoja, "Bletchley Park, 21 de octubre de 1941");
  [["A. M. Turing", 470, 400], ["W. G. Welchman", 820, 400], ["C. H. O'D. Alexander", 470, 500], ["P. S. Milner-Barry", 820, 500]].forEach(([n, x, y], i) => { const f = el("text", { x, y, class: "firma", opacity: 0 }, hoja, n); f.dataset.i = i; });
  E.real.firmas = Array.from(hoja.querySelectorAll(".firma"));
  E.real.aro = el("ellipse", { cx: 612, cy: 490, rx: 0, ry: 0, class: "aro" }, hoja);

  /* S7 · cierre: las letras se juntan en el triángulo de la intención */
  const s7 = escena("cierre", 42.8, 47);
  E.cierre.rosa = guilloche(800, 430, 340, [[57, 120, 57], [83, 140, 83]], s7, "#0A1F2E", 0.22);
  E.cierre.tri = el("path", { d: "M800 220L1010 590H590Z", class: "triangulo", opacity: 0 }, s7);
  const triPts = []; const tv = [[800, 220], [1010, 590], [590, 590]];
  for (let i = 0; i < 150; i++) { const l = i % 3, a = tv[l], b = tv[(l + 1) % 3], f = azar(); triPts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }

  /* letras sueltas (compartidas: el comandante que se deshace, las letras que forman el triángulo) */
  const capaL = $("letras-sueltas"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letrasCom = E.cadena.puntos.map(([x, y]) => ({ x, y, dx: (azar() - 0.5) * 900, dy: -200 - azar() * 500, r: (azar() - 0.5) * 240, e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: "#C8102E", opacity: 0 }, capaL, ABC[Math.floor(azar() * 26)]) }));
  const letrasTri = triPts.map(([x, y]) => ({ x, y, sx: azar() * W, sy: azar() * H, e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: "#0A1F2E", opacity: 0 }, capaL, ABC[Math.floor(azar() * 26)]) }));

  const SUBS = [
    [0.8, 4.4, "", false],
    [4.9, 7.8, "Turing pide piezas para construir su máquina.", false],
    [7.8, 11, "El comandante dice que <em>no</em>.", false],
    [11.3, 17, "Su argumento: a una máquina solo la puede vencer <em>otra máquina</em>.", false],
    [17.5, 21, "No intenta convencer a su jefe…", false],
    [21, 25.2, "Le escribe directamente a Churchill, <em>por encima de él</em>.", false],
    [25.7, 29.4, "Tres personas, tres motivaciones.", true],
    [29.4, 32.6, "Su intención solo conecta con una: <em>ganar la guerra</em>.", true],
    [33.1, 38, "Churchill responde con prioridad máxima.", true],
    [38.5, 42.6, "En la vida real, uno de los cuatro firmantes fue <em>Hugh Alexander</em>.", false],
    [43, 46, "La intención encontró a quien compartía su objetivo: ahí nace la <em>propuesta de valor</em>.", false],
  ];
  const NOTAS = [[38.6, 42.6, "<b>En la vida real…</b>El 21 de octubre de 1941 lo firmaron Turing, Welchman, Alexander y Milner-Barry, que lo llevó en persona a Downing Street. Churchill ordenó darles todo lo que pedían, con prioridad máxima."]];
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
    $("fondo").style.fill = t > 32.8 && t < 38.2 ? "#0A1F2E" : "";
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${(-t * 9).toFixed(2)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (400 * (1 - tr(t, 1.2, 2.4))).toFixed(1));
    /* S1: el papel viaja de Turing al escritorio; cae el sello */
    const pv = tr(t, 5.2, 6.8); E.no.papel.setAttribute("transform", `translate(${(420 + 520 * pv).toFixed(1)} ${(560 - 40 * pv).toFixed(1)}) rotate(${(-12 + 16 * pv).toFixed(1)}) scale(${(0.6 + 0.4 * pv).toFixed(3)})`);
    const ps = lin(t, 7.6, 8); E.no.sello.setAttribute("opacity", ps > 0 ? "1" : "0"); E.no.sello.setAttribute("transform", `rotate(-14) scale(${(ps < 1 ? 2 - easeIn(ps) : 1).toFixed(3)})`);
    E.no.oficial.setAttribute("transform", `translate(1100 ${(900 + 30 * (1 - tr(t, 4.6, 6))).toFixed(1)}) scale(${(1.95 + 0.06 * tr(t, 7.6, 8.4)).toFixed(3)})`);
    /* S2: dos rotores engranan */
    const giro = Math.max(0, t - 11) * 42; E.idea.r1.gi.setAttribute("transform", `rotate(${giro.toFixed(1)} 610 440)`); E.idea.r2.gi.setAttribute("transform", `rotate(${(-giro).toFixed(1)} 1000 440)`);
    const junta = tr(t, 11.4, 13); E.idea.r1.setAttribute("transform", `translate(${(-120 * (1 - junta)).toFixed(1)} 0)`); E.idea.r2.setAttribute("transform", `translate(${(120 * (1 - junta)).toFixed(1)} 0)`);
    /* S3: la carta sube por encima del comandante, que se deshace en letras */
    const ruta = E.cadena.ruta, L = ruta.getTotalLength(), pr = tr(t, 18.6, 23.6); ruta.setAttribute("opacity", (0.8 * tr(t, 18.2, 18.8)).toFixed(2));
    const pt = ruta.getPointAtLength(L * pr); E.cadena.sobre.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(-14 + 28 * pr).toFixed(1)}) scale(${(0.8 + 0.2 * Math.sin(pr * Math.PI)).toFixed(3)})`);
    E.cadena.sobre.setAttribute("opacity", tr(t, 18, 18.6).toFixed(2));
    const pd = lin(t, 20.6, 23.4), enS3 = t > 17 && t < 25.6;
    E.cadena.oficial.setAttribute("opacity", (1 - tr(t, 20.6, 21.6)).toFixed(3));
    letrasCom.forEach((L2, i) => { const d = ease(clamp((pd - (i % 20) * 0.01) / 0.8, 0, 1));
      const op = enS3 ? (pd <= 0 ? 0 : (d < 0.15 ? d / 0.15 : 1 - (d - 0.15) / 0.85)) * vis(t, 17.2, 25.4) : 0;
      L2.e.setAttribute("opacity", op.toFixed(3)); L2.e.setAttribute("transform", `translate(${(L2.x + L2.dx * d).toFixed(1)} ${(L2.y + L2.dy * d).toFixed(1)}) rotate(${(L2.r * d).toFixed(1)})`); });
    E.cadena.estadista.setAttribute("transform", `translate(1300 640) scale(${(0.95 + 0.08 * tr(t, 23.2, 24)).toFixed(3)})`);
    /* S4: las marcas caen una a una; la carta entra en la franja de Churchill */
    E.franjas.bandas.forEach((g, i) => { const p = tr(t, 25.6 + i * 0.35, 26.4 + i * 0.35); g.setAttribute("transform", `translate(${(-160 * (1 - p)).toFixed(1)} 0)`);
      const orden = [27.4, 29.6, 28.3][i], pm = lin(t, orden, orden + 0.35); g.marca.setAttribute("opacity", pm > 0 ? "1" : "0");
      g.marca.setAttribute("transform", `translate(${g.cx} 390) scale(${(pm < 1 ? 1.8 - 0.8 * ease(pm) : 1).toFixed(3)})`); });
    const pc = tr(t, 29.8, 31.4); const cz = E.franjas.bandas[1].cx;
    E.franjas.sobre.setAttribute("transform", `translate(${(120 + (cz - 120) * pc).toFixed(1)} ${(820 - 420 * pc).toFixed(1)}) rotate(${(20 - 20 * pc).toFixed(1)})`);
    E.franjas.sobre.setAttribute("opacity", tr(t, 29.4, 29.8).toFixed(2));
    /* S5: sello rojo y, aparte, cómo lo cuenta la película */
    const pe = lin(t, 33.6, 34.05); E.respuesta.etiqueta.setAttribute("opacity", pe > 0 ? "1" : "0");
    E.respuesta.etiqueta.setAttribute("transform", `translate(800 430) rotate(-5) scale(${(pe < 1 ? 2.1 - 1.1 * easeIn(pe) : 1).toFixed(3)})`);
    E.respuesta.pelicula.setAttribute("opacity", tr(t, 35.4, 36.2).toFixed(3));
    /* S6: firmas y el aro sobre Alexander */
    E.real.firmas.forEach((f, i) => f.setAttribute("opacity", tr(t, 38.8 + i * 0.45, 39.3 + i * 0.45).toFixed(3)));
    const pa = tr(t, 40.9, 41.7); E.real.aro.setAttribute("rx", (175 * pa).toFixed(1)); E.real.aro.setAttribute("ry", (40 * pa).toFixed(1));
    /* S7: las letras se juntan en el triángulo */
    E.cierre.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 430)`);
    const pj = lin(t, 43, 45);
    letrasTri.forEach((L3, i) => { const d = ease(clamp((pj - (i % 15) * 0.02) / 0.7, 0, 1)), op = t > 42.8 ? Math.min(1, pj * 3) * (1 - tr(t, 45, 45.6)) : 0;
      L3.e.setAttribute("opacity", op.toFixed(3)); L3.e.setAttribute("transform", `translate(${(L3.sx + (L3.x - L3.sx) * d).toFixed(1)} ${(L3.sy + (L3.y - L3.sy) * d).toFixed(1)})`); });
    E.cierre.tri.setAttribute("opacity", tr(t, 44.6, 45.4).toFixed(3));
    /* subtítulos y nota */
    const i = SUBS.findIndex(([a, b]) => t >= a && t < b);
    if (i !== subI) { subI = i; sub.innerHTML = i >= 0 ? SUBS[i][2] : ""; sub.classList.toggle("claro", i >= 0 && SUBS[i][3]); }
    sub.style.opacity = i >= 0 ? String(vis(t, SUBS[i][0], SUBS[i][1], 0.5)) : "0";
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
    validar() { return { ok: true, notas: ["ilustración y textos propios", "película y vida real diferenciadas", "sin red"] }; } };
})();

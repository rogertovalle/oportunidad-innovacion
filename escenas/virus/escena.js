/* La idea como virus — acto III · la idea.
   Mismo lenguaje que «La carta · v2» (siluetas planas sin rostro, crema/tinta/rojo/oro, un mundo hecho de un motivo,
   cámara que entra en el patrón, golpes con ritmo). Motivo propio: la idea misma — una semilla de luz, redes de nodos
   y los cinco signos de las formas de la idea. Solo toma la metáfora general (una idea se propaga como un virus y
   puede extraerse e implantarse); no recrea ninguna película. Ilustración y textos propios.
   Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 43, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
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
  const golpe = (t, a, d = 0.35, k = 0.7) => { const p = lin(t, a, a + d); return p <= 0 ? 0 : p < 1 ? 1 + k * (1 - easeIn(p)) : 1; }; /* entra grande y cae */
  let semilla = 2010; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mezcla = (a, b, f) => { const A = hex(a), B = hex(b); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(f, 0, 1))).join(",") + ")"; };
  const mundo = $("mundo");

  /* ── la mente: cabeza de perfil plana, sin rostro (origen en el centro del cráneo, mira a la derecha) ── */
  const CABEZA = "M-150 200C-150 120 -172 60 -176 -20C-186 -160 -92 -250 18 -250C128 -250 190 -172 196 -82C198 -52 202 -32 216 -4C226 16 222 28 206 32C206 48 208 60 198 70C204 80 202 92 192 98C190 120 178 140 140 140C112 140 100 152 100 200C160 214 242 236 272 300L272 330H-322V300C-282 232 -202 214 -150 200Z";
  const SEM = [10, -100]; /* dónde vive la semilla, en coordenadas de la cabeza */
  const P2 = new Path2D(CABEZA), k2 = doc.createElement("canvas").getContext("2d");
  /* nodos de la red interior (cerebro), deterministas */
  const NODOS = (() => { const out = []; let n = 0;
    while (out.length < 20 && n++ < 6000) { const x = -160 + azar() * 340, y = -228 + azar() * 225;
      if (!k2.isPointInPath(P2, x, y) || !k2.isPointInPath(P2, x + 22, y) || !k2.isPointInPath(P2, x - 22, y) || !k2.isPointInPath(P2, x, y - 22)) continue;
      if (Math.hypot(x - SEM[0], y - SEM[1]) < 46 || out.some(([a, b]) => Math.hypot(a - x, b - y) < 52)) continue; out.push([x, y]); }
    return out; })();
  const ARISTAS = (() => { const s = new Set(), out = [];
    NODOS.forEach((a, i) => NODOS.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2)
      .forEach(([j]) => { const k = i < j ? i + "-" + j : j + "-" + i; if (!s.has(k)) { s.add(k); out.push([i, j]); } }));
    return out; })();
  const RAICES = NODOS.map((p, i) => [i, Math.hypot(p[0] - SEM[0], p[1] - SEM[1])]).sort((a, b) => a[1] - b[1]).slice(0, 5).map(([i]) => i);

  function cabeza(x, y, s, dir, padre, conRed) {
    const g = el("g", { transform: `translate(${x} ${y}) scale(${dir * s} ${s})` }, padre);
    el("path", { d: CABEZA, class: "cabeza" }, g);
    const glob = (lx, ly) => [x + dir * s * lx, y + s * ly];
    const c = { g, glob, sem: glob(SEM[0], SEM[1]), s };
    if (conRed) { const r = el("g", { class: "red-int" }, g);
      c.lineas = ARISTAS.map(([i, j]) => el("line", { x1: NODOS[i][0], y1: NODOS[i][1], x2: NODOS[j][0], y2: NODOS[j][1], opacity: 0 }, r));
      c.nodos = NODOS.map(([nx, ny]) => el("circle", { cx: nx, cy: ny, r: 7, opacity: 0 }, r));
      c.dist = NODOS.map(([nx, ny]) => Math.hypot(nx - SEM[0], ny - SEM[1])); }
    return c;
  }
  /* la semilla de luz: halo, núcleo, y espinas de virus (en coordenadas globales) */
  function semillaDe(padre) {
    const g = el("g", {}, padre);
    const halo = el("circle", { r: 70, fill: "url(#g-luz)" }, g), aros = [0, 1].map(() => el("circle", { r: 20, class: "halo", opacity: 0 }, g));
    const esp = el("g", { opacity: 0 }, g);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; el("line", { x1: Math.cos(a) * 18, y1: Math.sin(a) * 18, x2: Math.cos(a) * 30, y2: Math.sin(a) * 30, class: "espina" }, esp); el("circle", { cx: Math.cos(a) * 32, cy: Math.sin(a) * 32, r: 4.5, class: "semilla" }, esp); }
    const nucleo = el("circle", { r: 19, class: "semilla" }, g);
    return { g, halo, aros, esp, nucleo };
  }
  function ponSemilla(S, x, y, esc, op, espinas, giro) {
    S.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${esc.toFixed(3)})`); S.g.setAttribute("opacity", op.toFixed(3));
    S.esp.setAttribute("opacity", espinas.toFixed(3)); S.esp.setAttribute("transform", `rotate(${(giro || 0).toFixed(1)})`);
  }
  function aros(S, t, desde, periodo) { S.aros.forEach((a, i) => { const f = t < desde ? -1 : (((t - desde) / periodo + i / 2) % 1);
    a.setAttribute("opacity", f < 0 ? "0" : (0.8 * (1 - f)).toFixed(3)); a.setAttribute("r", (20 + 70 * Math.max(0, f)).toFixed(1)); }); }
  /* pinza gráfica: dos patas desde un pivote; origen en las puntas */
  function pinza(padre, color) { const g = el("g", { class: "pinza", style: `stroke:${color}` }, padre);
    const pa = el("path", { d: "" }, g), pb = el("path", { d: "" }, g); el("path", { d: "M0 -330V-520", style: "stroke-width:16" }, g); el("circle", { cx: 0, cy: -330, r: 15, fill: color, stroke: "none" }, g);
    return { g, pa, pb }; }
  function ponPinza(P, x, y, ang, abre, op) { const o = 6 + 26 * abre;
    P.pa.setAttribute("d", `M0 -330L${-o} -60L${-o * 0.5} 0`); P.pb.setAttribute("d", `M0 -330L${o} -60L${o * 0.5} 0`);
    P.g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`); P.g.setAttribute("opacity", op.toFixed(3)); }
  /* guilloché: curvas entrelazadas, como el grabado de un billete (helper de la referencia) */
  function guilloche(cx, cy, R, capas, padre, color, op) {
    const g = el("g", { class: "guilloche", opacity: op }, padre);
    capas.forEach(([r, d, giros]) => { let p = ""; for (let i = 0; i <= 720; i++) { const t = (i / 720) * Math.PI * 2 * giros, k = (R - r) / r;
      const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t), y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t); p += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
      el("path", { d: p, stroke: color }, g); });
    return g;
  }
  /* los cinco signos (misma geometría que la presentación: caja de 600, centro 300) */
  const VERT = [
    Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * 6.283 - 1.5708; return [300 + Math.cos(a) * 240, 300 + Math.sin(a) * 240]; }),
    [[80, 80], [520, 80], [520, 520], [80, 520]],
    [[300, 50], [550, 505], [50, 505]],
    [[300, 36], [564, 300], [300, 564], [36, 300]],
    [[40, 215], [320, 215], [320, 85], [565, 300], [320, 515], [320, 385], [40, 385]],
  ];
  const COLOR = ["#006060", "#00A080", "#3DD9B0", "#E08000", "#E02040"], NOMBRE = ["paradigma", "concepto", "intención", "solución", "progreso"], N = 96;
  function muestrear(v) {
    const lados = v.map((a, i) => { const b = v[(i + 1) % v.length]; return [a, b, Math.hypot(b[0] - a[0], b[1] - a[1])]; });
    const tot = lados.reduce((s, l) => s + l[2], 0), out = [];
    for (let k = 0; k < N; k++) { let d = (k / N) * tot; for (const [a, b, l] of lados) { if (d <= l) { out.push([(a[0] + (b[0] - a[0]) * d / l - 300) / 600, (a[1] + (b[1] - a[1]) * d / l - 300) / 600]); break; } d -= l; } }
    return out;
  }
  const FORMAS = VERT.map(muestrear);
  const camino = (pts, x, y, s) => "M" + pts.map(([a, b]) => (x + a * s).toFixed(1) + " " + (y + b * s).toFixed(1)).join("L") + "Z";
  const morph = (a, b, f) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * f, p[1] + (b[i][1] - p[1]) * f]);

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b, fx = 800, fy = 450) => { const g = el("g", { id }, mundo); E[id] = { g, a, b, fx, fy }; return g; };

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.6);
  E.titulo.rosa = guilloche(800, 450, 320, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#0A1F2E", 0.3);
  E.titulo.rosa2 = guilloche(800, 450, 320, [[73, 150, 73]], s0, "#E7B53A", 0.7);
  el("text", { x: 800, y: 300, class: "titulo-ceja", "text-anchor": "middle" }, s0, "ACTO III · LA IDEA");
  el("text", { x: 800, y: 440, class: "titulo-grande", "text-anchor": "middle" }, s0, "¿Qué es una idea");
  el("text", { x: 800, y: 568, class: "titulo-grande", "text-anchor": "middle" }, s0, "para ti?");
  E.titulo.raya = el("path", { d: "M640 615H960", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 320, "stroke-dashoffset": 320 }, s0);

  /* S1 · la mente y la semilla; S2 · resiste (misma escena, sin corte) */
  const M = cabeza(780, 520, 1.22, 1, null, true);
  const s1 = escena("mente", 4.6, 16.4, M.sem[0], M.sem[1]);
  guilloche(780, 400, 430, [[61, 140, 61]], s1, "#0A1F2E", 0.12);
  s1.appendChild(M.g);
  E.mente.raices = RAICES.map(() => el("path", { class: "raiz", opacity: 0 }, s1));
  E.mente.sem = semillaDe(s1);
  E.mente.pinza = pinza(s1, "#C8102E");

  /* S3 · contagio y S4 · la red se reorganiza (fondo de tinta) */
  const s3 = escena("red", 16.4, 28.8);
  el("rect", { x: -400, y: -300, width: W + 800, height: H + 600, class: "tinta" }, s3);
  E.red.rosa = guilloche(800, 430, 340, [[67, 130, 67], [47, 110, 47]], s3, "#E7B53A", 0);
  const RP = [[800, 430], [600, 290], [610, 580], [930, 270], [960, 600], [400, 430], [420, 180], [780, 150], [400, 690], [210, 300], [220, 560], [1150, 560], [1380, 660], [1440, 500], [790, 690]];
  const RA = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 6], [1, 7], [1, 5], [2, 5], [2, 8], [2, 14], [3, 7], [4, 11], [4, 14], [5, 9], [5, 10], [6, 9], [8, 10], [11, 12], [11, 13], [12, 13], [4, 13], [6, 7], [8, 14]];
  /* orden de contagio (BFS desde 0) con ritmo que se acelera, como un virus */
  const CONT = (() => { const orden = [[0, -1]], visto = new Set([0]); for (let q = 0; q < orden.length; q++) { const u = orden[q][0];
      RA.forEach(([a, b]) => { const v = a === u ? b : b === u ? a : -1; if (v >= 0 && !visto.has(v)) { visto.add(v); orden.push([v, u]); } }); }
    let tt = 17.0; return orden.map(([v, p], k) => { if (k > 0) tt += 0.6 * Math.pow(0.88, k - 1); return { v, p, t: tt }; }); })();
  const tCont = []; CONT.forEach((c) => (tCont[c.v] = c.t));
  /* destino en el patrón nuevo: anillo ordenado por ángulo + centro */
  const ANILLO = (() => { const otros = RP.map((p, i) => [i, Math.atan2(p[1] - 430, p[0] - 800)]).filter(([i]) => i !== 0).sort((a, b) => a[1] - b[1]);
    const out = []; out[0] = [800, 430]; otros.forEach(([i], k) => { const a = (k / otros.length) * Math.PI * 2 - Math.PI / 2; out[i] = [800 + Math.cos(a) * 255, 430 + Math.sin(a) * 255]; }); return { out, orden: otros.map(([i]) => i) }; })();
  const gAr = el("g", {}, s3), gEst = el("g", { opacity: 0 }, s3), gMini = el("g", {}, s3);
  E.red.aristas = RA.map(() => el("line", { class: "arista" }, gAr));
  E.red.estrella = ANILLO.orden.map(() => el("line", { class: "estrella" }, gEst)); E.red.gEst = gEst;
  E.red.minis = RP.map(() => { const g = el("g", {}, gMini); el("path", { d: CABEZA, class: "mini" }, g); const c = el("circle", { cx: SEM[0], cy: SEM[1], r: 42, class: "semilla", opacity: 0 }, g); g.sem = c; g.cab = g.firstChild; return g; });
  E.red.viaje = el("circle", { r: 9, class: "semilla", opacity: 0 }, s3);

  /* S5 · extraer e implantar */
  const s5 = escena("injerto", 28.8, 36.6, 1120, 470);
  guilloche(800, 360, 420, [[61, 140, 61]], s5, "#0A1F2E", 0.1);
  E.injerto.A = cabeza(470, 587, 0.95, 1, s5, true); E.injerto.B = cabeza(1130, 587, 0.95, -1, s5, true);
  E.injerto.ruta = el("path", { d: `M${E.injerto.A.sem[0]} 300C700 120 900 120 ${E.injerto.B.sem[0]} 300`, fill: "none", stroke: "#0A1F2E", "stroke-width": 3, "stroke-dasharray": "2 12", "stroke-linecap": "round", opacity: 0 }, s5);
  E.injerto.raices = RAICES.map(() => el("path", { class: "raiz", opacity: 0 }, s5));
  E.injerto.sem = semillaDe(s5);
  E.injerto.forma = el("path", { class: "forma-signo", opacity: 0 }, s5);
  E.injerto.rot = el("g", { opacity: 0 }, s5);
    el("text", { x: 1130, y: 236, class: "rotulo", "text-anchor": "middle" }, E.injerto.rot, "OTRA MENTE · OTRA FORMA");
  el("text", { x: 1130, y: 280, class: "signo-nombre", "text-anchor": "middle", style: "font-weight:400" }, E.injerto.rot, "la idea como intención");
  E.injerto.pinza = pinza(s5, "#0A1F2E");

  /* S6 · cierre: las cinco formas, nacidas de puntos que se juntan */
  const s6 = escena("cierre", 36.6, 44);
  E.cierre.rosa = guilloche(800, 400, 360, [[57, 120, 57], [83, 140, 83]], s6, "#0A1F2E", 0.16);
  el("text", { x: 800, y: 200, class: "titulo-ceja", "text-anchor": "middle" }, s6, "LAS CINCO FORMAS DE LA IDEA");
  E.cierre.hilo = el("path", { d: "M300 400H1300", class: "hilo", opacity: 0 }, s6);
  const SX = (i) => 800 + (i - 2) * 250, SY = 400, SS = 170;
  E.cierre.signos = FORMAS.map((f, i) => { const g = el("g", { opacity: 0 }, s6);
    el("path", { d: camino(f, 0, 0, SS), class: "forma-signo", fill: COLOR[i] }, g);
    el("text", { x: 0, y: 150, class: "signo-nombre", "text-anchor": "middle" }, g, NOMBRE[i]); return g; });
  const capaP = $("puntos-sueltos");
  const puntos = [];
  FORMAS.forEach((f, i) => { for (let k = 0; k < 24; k++) { const p = f[(k * 4) % N]; puntos.push({ i, x: SX(i) + p[0] * SS, y: SY + p[1] * SS, sx: azar() * W, sy: 80 + azar() * 640, e: el("circle", { r: 5, class: "punto", opacity: 0 }, capaP) }); } });

  const SUBS = [
    [0.8, 4.4, "", false],
    [4.9, 7.6, "Hay muchos significados de la palabra <em>idea</em>.", false],
    [7.6, 10.3, "Te comparto una de las mejores definiciones, desde mi punto de vista.", false],
    [10.5, 12.8, "Sí: en este caso, la idea se compara con un <em>virus</em>.", false],
    [12.8, 16.2, "Una vez instalada, es muy difícil de quitar.", false],
    [16.7, 20.2, "Se contagia: salta de una mente a otra.", true],
    [20.2, 24.2, "Y con cada contagio, la red entera cambia de color.", true],
    [24.6, 28.6, "Como sabemos, un virus puede <em>cambiarlo todo</em>.", true],
    [29.1, 32.5, "Pero las ideas también pueden ser <em>extraídas</em>…", false],
    [32.5, 36.4, "…e <em>implantadas</em>. Y en la mente nueva toman otra forma.", false],
    [36.9, 39.6, "Esta capacidad influye en cómo creamos y desarrollamos productos.", false],
    [39.6, 43, "Saber extraer e implantar ideas es lo que vuelve <em>ágil</em> el desarrollo de productos.", false],
  ];
  const NOTAS = [[20.5, 24.2, "<b>Por qué se propaga</b>Una idea no avanza porque alguien la repita: se propaga cuando otra persona la adopta como propia y la vuelve a contar."]];
  const sub = $("subtitulo"), nota = $("nota"); let subI = -2, notaI = -2;

  function vis(t, a, b, f = 0.7) { return Math.min(tr(t, a - f / 2, a + f / 2), 1 - tr(t, b - f / 2, b + f / 2)); }
  const raiz = (p, x1, y1, x2, y2) => { const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18; p.setAttribute("d", `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`); };
  /* enciende la red interior de una cabeza: aparición por nodo, color por distancia a la semilla */
  function redInterior(C, aparece, contagio, color, apagado) {
    C.nodos.forEach((n, i) => { const o = tr(aparece, i * 0.04, i * 0.04 + 0.3), c = lin(contagio, C.dist[i] / 260 - 0.1, C.dist[i] / 260 + 0.25);
      n.setAttribute("opacity", (o * (0.55 + 0.45 * c) * (1 - 0.7 * apagado)).toFixed(3)); n.style.fill = c > 0 ? mezcla("#F1EADB", color, c) : ""; });
    C.lineas.forEach((l, k) => { const [i, j] = ARISTAS[k], o = Math.min(tr(aparece, i * 0.04, i * 0.04 + 0.3), tr(aparece, j * 0.04, j * 0.04 + 0.3));
      const c = lin(contagio, Math.max(C.dist[i], C.dist[j]) / 260 - 0.1, Math.max(C.dist[i], C.dist[j]) / 260 + 0.25);
      l.setAttribute("opacity", (o * (0.3 + 0.5 * c) * (1 - 0.7 * apagado)).toFixed(3)); l.style.stroke = c > 0 ? mezcla("#F1EADB", color, c) : ""; });
  }

  function cuadro(t) {
    t = clamp(Number(t) || 0, 0, D);
    $("cortina").setAttribute("opacity", (1 - tr(t, 0, 1) + tr(t, D - 0.7, D)).toFixed(3));
    /* cámara: cada escena entra desde un poco lejos y sale entrando en el patrón (hacia su punto focal) */
    for (const k in E) { const { g, a, b, fx, fy } = E[k]; const v = vis(t, a, b);
      const ent = 1 - tr(t, a - 0.4, a + 0.6), sal = tr(t, b - 0.5, b + 0.4);
      const s = 1 - 0.08 * ent + 1.4 * easeIn(sal);
      g.setAttribute("opacity", v.toFixed(3)); g.setAttribute("transform", `translate(${fx} ${fy}) scale(${s.toFixed(4)}) translate(${-fx} ${-fy})`);
      g.style.display = v > 0.001 ? "" : "none"; }
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${(-t * 9).toFixed(2)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (320 * (1 - tr(t, 1.2, 2.4))).toFixed(1));

    /* S1–S2: la mente aparece, la red interior se enciende, cae la semilla; se vuelve virus; la pinza no puede sacarla */
    M.g.setAttribute("transform", `translate(780 ${(520 + 40 * (1 - tr(t, 4.6, 6))).toFixed(1)}) scale(1.22)`);
    const dyM = 40 * (1 - tr(t, 4.6, 6));
    redInterior(M, lin(t, 5.2, 6.6) * 1.1, lin(t, 10.6, 12.4) * 1.4, "#E7B53A", 0);
    /* tirones: la semilla se estira hacia arriba y vuelve con rebote */
    const tiron = (a, b) => { const p = lin(t, a, b); return p <= 0 || p >= 1 ? 0 : (p < 0.7 ? ease(p / 0.7) : 1 - easeIn((p - 0.7) / 0.3)); };
    const tir = 70 * tiron(13.3, 14.1) + 105 * tiron(14.4, 15.2);
    const rebote = Math.sin(Math.max(0, t - 14.1) * 30) * 6 * (1 - lin(t, 14.1, 14.4)) + Math.sin(Math.max(0, t - 15.2) * 30) * 8 * (1 - lin(t, 15.2, 15.6));
    const smx = M.sem[0], smy = M.sem[1] + dyM - tir + (t > 14.1 ? rebote : 0);
    ponSemilla(E.mente.sem, smx, smy, golpe(t, 7.4, 0.4, 1.2) * (1 + 0.04 * Math.sin(t * 5)) * 1.2, lin(t, 7.4, 7.5), tr(t, 10.4, 11), t * 20);
    aros(E.mente.sem, t, 7.6, 1.4);
    const ra = tr(t, 12.6, 13.2) * (1 - tr(t, 15.7, 16.3));
    E.mente.raices.forEach((p, k) => { const [nx, ny] = M.glob(...NODOS[RAICES[k]]); raiz(p, smx, smy, nx, ny + dyM); p.setAttribute("opacity", ra.toFixed(3)); });
    /* la pinza roja: entra, agarra, tira dos veces, resbala, se va */
    const pin = tr(t, 12.4, 13.2) - tr(t, 15.4, 16.2);
    const py = smy - 22 - 420 * (1 - pin), suelta = (t > 14.05 && t < 14.4) || t > 15.15;
    ponPinza(E.mente.pinza, smx + 30, py, 8, t < 13.25 ? 1 : suelta ? 1 : 0, pin > 0.01 ? 1 : 0);

    /* S3: contagio en cadena, cada vez más rápido */
    const infect = (i) => tr(t, tCont[i], tCont[i] + 0.22);
    const fr = CONT.filter((c) => t >= c.t).length / CONT.length;
    const re = tr(t, 24.6, 27.4); /* reorganización */
    const pos = RP.map((p, i) => { const q = ANILLO.out[i], d = ease(clamp((lin(t, 24.6, 27.4) - (i % 5) * 0.06) / 0.76, 0, 1)); return [p[0] + (q[0] - p[0]) * d, p[1] + (q[1] - p[1]) * d]; });
    const giro = re * 24 + Math.max(0, t - 27.4) * 6;
    const rot = (p) => { const a = (giro * Math.PI) / 180, dx = p[0] - 800, dy = p[1] - 430; return [800 + dx * Math.cos(a) - dy * Math.sin(a), 430 + dx * Math.sin(a) + dy * Math.cos(a)]; };
    const P = pos.map((p) => (re > 0 ? rot(p) : p));
    E.red.minis.forEach((g, i) => { const f = infect(i), es = 0.2 * (i === 0 ? 1.25 : 1) * (t < tCont[i] ? 1 : golpe(t, tCont[i], 0.3, 0.35));
      g.setAttribute("transform", `translate(${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)}) scale(${(RP[i][0] > 800 ? -es : es).toFixed(3)} ${es.toFixed(3)})`);
      g.cab.style.fill = f < 1 || re <= 0 ? mezcla("#2E4B5E", "#C8102E", f) : mezcla("#C8102E", "#F1EADB", re);
      g.sem.setAttribute("opacity", f.toFixed(3)); });
    const colBase = mezcla("#2E4B5E", "#8A2433", fr);
    E.red.aristas.forEach((l, k) => { const [a, b] = RA[k], cta = Math.max(tCont[a], tCont[b]), ok = t >= cta + 0.2;
      l.setAttribute("x1", P[a][0].toFixed(1)); l.setAttribute("y1", P[a][1].toFixed(1)); l.setAttribute("x2", P[b][0].toFixed(1)); l.setAttribute("y2", P[b][1].toFixed(1));
      l.style.stroke = ok ? "#E7B53A" : colBase; l.setAttribute("opacity", ((ok ? 0.85 : 0.6) * (1 - 0.85 * re)).toFixed(3)); });
    E.red.gEst.setAttribute("opacity", tr(t, 25.8, 27.4).toFixed(3));
    E.red.estrella.forEach((l, k) => { const o = ANILLO.orden, a = o[k], b = o[(k + 5) % o.length];
      l.setAttribute("x1", P[a][0].toFixed(1)); l.setAttribute("y1", P[a][1].toFixed(1)); l.setAttribute("x2", P[b][0].toFixed(1)); l.setAttribute("y2", P[b][1].toFixed(1)); });
    E.red.rosa.setAttribute("opacity", (0.4 * tr(t, 25, 27.4)).toFixed(3)); E.red.rosa.setAttribute("transform", `rotate(${(-giro * 1.5).toFixed(2)} 800 430)`);
    /* la chispa que viaja por la arista de cada contagio */
    const cv = CONT.find((c, k) => k > 0 && t >= c.t - 0.4 && t < c.t);
    if (cv) { const f = ease(lin(t, cv.t - 0.4, cv.t)), a = RP[cv.p], b = RP[cv.v]; E.red.viaje.setAttribute("cx", (a[0] + (b[0] - a[0]) * f).toFixed(1)); E.red.viaje.setAttribute("cy", (a[1] - 20 + (b[1] - a[1]) * f).toFixed(1)); E.red.viaje.setAttribute("opacity", "1"); }
    else E.red.viaje.setAttribute("opacity", "0");
    /* entrada: la semilla cae desde la cámara en la primera mente */
    const caida = tr(t, 16.4, 17.0);
    if (t < 17.05) { E.red.viaje.setAttribute("cx", "802"); E.red.viaje.setAttribute("cy", (410 - 300 * (1 - caida)).toFixed(1)); E.red.viaje.setAttribute("r", (9 + 30 * (1 - caida)).toFixed(1)); E.red.viaje.setAttribute("opacity", t > 16.3 ? "1" : "0"); }
    else E.red.viaje.setAttribute("r", "9");

    /* S5: extraer de A, cruzar, implantar en B; en B la idea pasa por los cinco signos y queda en uno */
    const A = E.injerto.A, B = E.injerto.B, pi = E.injerto.pinza;
    redInterior(A, lin(t, 28.8, 29.6) * 1.1, 1.4, "#E7B53A", tr(t, 31.2, 32.2));
    const bOn = tr(t, 33.4, 35.6);
    redInterior(B, lin(t, 28.8, 29.6) * 1.1, lin(t, 33.3, 35) * 1.4, "#3DD9B0", 0);
    const ax = A.sem[0], ay = A.sem[1], bx = B.sem[0], by = B.sem[1];
    const sube = tr(t, 30.5, 31.3), cruza = lin(t, 31.4, 32.6), baja = tr(t, 32.6, 33.1);
    const ruta = E.injerto.ruta, RL = ruta.getTotalLength(), rp = ruta.getPointAtLength(RL * ease(cruza));
    let sx, sy;
    if (t < 31.4) { sx = ax; sy = ay - (ay - 300) * sube; } else if (t < 32.6) { sx = rp.x; sy = rp.y; } else { sx = bx; sy = 300 + (by - 300) * baja; }
    ruta.setAttribute("opacity", (0.7 * tr(t, 30.8, 31.4) * (1 - tr(t, 33.2, 33.8))).toFixed(3));
    const enForma = t >= 33.25;
    ponSemilla(E.injerto.sem, sx, sy, (enForma ? 1 - lin(t, 33.25, 33.45) : 1) * (1 + 0.05 * Math.sin(t * 5)), enForma ? 1 - lin(t, 33.25, 33.45) : 1, 0, 0);
    aros(E.injerto.sem, t, t < 33.1 ? 99 : 33.1, 0.9);
    /* las raíces: estiradas hasta que se sueltan, y salen con la semilla como zarcillos */
    const rr = tr(t, 29.0, 29.6) * (1 - tr(t, 32.6, 33.2)), corta = tr(t, 30.85, 31.2);
    E.injerto.raices.forEach((p, k) => { const [nx, ny] = A.glob(...NODOS[RAICES[k]]); const ex = nx + (sx + (nx - ax) * 0.25 - nx) * corta, ey = ny + (sy + 40 + (ny - ay) * 0.2 - ny) * corta;
      raiz(p, sx, sy, ex, ey); p.setAttribute("opacity", rr.toFixed(3)); });
    /* la pinza: baja, cierra, sube, cruza, baja, abre, se va */
    let qx = ax, qy = 120, qo = 1;
    if (t < 30.3) { qy = 120 + (ay - 22 - 120) * tr(t, 29.3, 30.2); }
    else if (t < 33.1) { qx = sx; qy = sy - 22; qo = t < 30.45 ? 1 - lin(t, 30.3, 30.45) : 0; }
    else { qx = bx; qy = by - 22 - 420 * tr(t, 33.3, 34.1); qo = lin(t, 33.1, 33.25); }
    ponPinza(pi, qx, qy, -6 + 12 * cruza, qo, 1 - tr(t, 33.8, 34.2));
    /* el injerto: golpe y morfología por los cinco signos */
    const sec = [0, 1, 2, 3, 4, 2], t0 = 33.3, paso = 0.36;
    const u = clamp((t - t0) / paso, 0, sec.length - 1), k0 = Math.floor(u), k1 = Math.min(sec.length - 1, k0 + 1), fm = ease(clamp((u - k0) * 1.6, 0, 1));
    const pts = morph(FORMAS[sec[k0]], FORMAS[sec[k1]], fm), tam = 92 * golpe(t, t0, 0.4, 0.8);
    E.injerto.forma.setAttribute("d", camino(pts, bx, by, tam)); E.injerto.forma.setAttribute("opacity", enForma ? lin(t, 33.25, 33.4).toFixed(3) : "0");
    E.injerto.forma.style.fill = mezcla(COLOR[sec[k0]], COLOR[sec[k1]], fm);
    E.injerto.rot.setAttribute("opacity", tr(t, 35.3, 35.9).toFixed(3));
    void bOn;

    /* S6: los puntos se juntan en las cinco formas, con golpe una por una */
    E.cierre.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 400)`);
    puntos.forEach((p, k) => { const a = 36.8 + p.i * 0.3, d = ease(clamp((t - a - (k % 6) * 0.04) / 0.8, 0, 1));
      const op = t > 36.6 && t < 38.6 + p.i * 0.3 ? Math.min(1, (t - 36.6) * 3) * (1 - lin(t, a + 0.9, a + 1.2)) : 0;
      p.e.setAttribute("opacity", op.toFixed(3)); p.e.setAttribute("cx", (p.sx + (p.x - p.sx) * d).toFixed(1)); p.e.setAttribute("cy", (p.sy + (p.y - p.sy) * d).toFixed(1)); });
    E.cierre.signos.forEach((g, i) => { const a = 37.7 + i * 0.3, s = golpe(t, a, 0.35, 0.55);
      g.setAttribute("opacity", lin(t, a, a + 0.08).toFixed(3)); g.setAttribute("transform", `translate(${SX(i)} ${SY}) scale(${s.toFixed(3)})`); });
    E.cierre.hilo.setAttribute("opacity", tr(t, 39.2, 39.8).toFixed(3));

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
    validar() { return { ok: true, notas: ["ilustración y textos propios", "solo la metáfora general; no recrea ninguna película", "sin red"] }; } };
})();

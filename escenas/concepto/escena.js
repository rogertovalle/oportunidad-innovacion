/* El concepto · suerte contra máquina — paso 2 · la idea como concepto. Lenguaje «Enigma en grabado y tinta»
   (misma arquitectura, reproductor y helpers que escenas/carta-churchill-v2). Ilustración y textos propios; cuenta el
   paso como lo plantea la película y agrega lo que pasó en la vida real.
   Todo se dibuja según el segundo t → cuadro(t). Contrato atril-video/v1: window.escena = { listo, duracion, cuadro, sonido, validar }. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 47, NS = "http://www.w3.org/2000/svg", W = 1600, H = 900;
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
  /* ruido determinista en t (para «tirar los dados») */
  const ruido = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function el(tag, attrs, padre, texto) { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (texto != null) e.textContent = texto; if (padre) padre.appendChild(e); return e; }
  const mundo = $("mundo"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ── siluetas propias (origen en los pies) ── */
  const FIG = {
    turing: { cuerpo: "M-52 -300C-62 -240 -60 -190 -50 -150L-40 0H-8L0 -130L8 0H40L50 -150C60 -190 62 -240 52 -300C36 -318 18 -324 0 -324C-18 -324 -36 -318 -52 -300Z", cabeza: [0, -362, 36], extra: "" },
    /* el colega que presume: hombros anchos, brazo que señala la pizarra */
    presume: { cuerpo: "M-78 -296C-90 -232 -84 -176 -68 -146L-56 0H-14L0 -122L14 0H56L68 -146C84 -176 90 -232 78 -296C54 -318 28 -326 0 -326C-28 -326 -54 -318 -78 -296Z", cabeza: [0, -366, 37], extra: "M60 -292L196 -352L206 -330L72 -262Z" },
    colega: { cuerpo: "M-66 -300C-76 -236 -72 -180 -60 -150L-50 0H-12L0 -126L12 0H50L60 -150C72 -180 76 -236 66 -300C44 -320 22 -326 0 -326C-22 -326 -44 -320 -66 -300Z", cabeza: [0, -364, 36], extra: "" },
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
  /* tambor giratorio (dibujo propio, no réplica): disco con muescas y letras */
  function tambor(cx, cy, r, color, padre) {
    const g = el("g", {}, padre), gi = el("g", {}, g);
    el("circle", { cx, cy, r, fill: color }, gi); el("circle", { cx, cy, r: r * 0.34, fill: "#F1EADB" }, gi);
    for (let i = 0; i < 13; i++) { const a = (i / 13) * Math.PI * 2;
      el("path", { d: `M${(cx + Math.cos(a) * r * 0.5).toFixed(1)} ${(cy + Math.sin(a) * r * 0.5).toFixed(1)}L${(cx + Math.cos(a) * r * 0.88).toFixed(1)} ${(cy + Math.sin(a) * r * 0.88).toFixed(1)}`, stroke: "#F1EADB", "stroke-width": 3 }, gi); }
    el("circle", { cx: cx + r * 0.7, cy, r: 6, fill: "#F1EADB" }, gi);
    g.gi = gi; g.cx = cx; g.cy = cy; return g;
  }
  function lampara(x, y0, largo, padre, op) {
    const g = el("g", {}, padre);
    el("path", { d: `M${x - 330} 900L${x - 62} ${y0 + largo + 40}H${x + 62}L${x + 330} 900Z`, class: "cono", opacity: op }, g);
    el("path", { d: `M${x} 0V${y0 + largo}`, stroke: "#0A1F2E", "stroke-width": 4 }, g);
    el("path", { d: `M${x - 62} ${y0 + largo + 40}L${x - 24} ${y0 + largo}H${x + 24}L${x + 62} ${y0 + largo + 40}Z`, class: "lampara" }, g);
    return g;
  }
  /* mezcla: las primeras letras ya son el texto final; el resto sigue girando como un rotor */
  function mezcla(final, p, t, salto) { const n = Math.floor(final.length * clamp(p, 0, 1)); let s = "";
    for (let i = 0; i < final.length; i++) s += i < n || final[i] === " " ? final[i] : ABC[Math.floor(ruido(Math.floor(t * 14) + i * 7.1 + salto) * 26)];
    return s; }

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b) => { const g = el("g", { id }, mundo); E[id] = { g, a, b }; return g; };

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.6);
  E.titulo.rosa = guilloche(800, 450, 300, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#0A1F2E", 0.35);
  E.titulo.rosa2 = guilloche(800, 450, 300, [[73, 150, 73]], s0, "#00A080", 0.7);
  el("text", { x: 800, y: 360, class: "titulo-ceja", "text-anchor": "middle" }, s0, "PASO 2 · LA IDEA COMO CONCEPTO");
  el("text", { x: 800, y: 500, class: "titulo-grande", "text-anchor": "middle" }, s0, "Suerte contra máquina");
  E.titulo.raya = el("path", { d: "M600 540H1000", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 400, "stroke-dashoffset": 400 }, s0);

  /* S1 · el método de siempre (y su caída): oficina de luz amarilla, pizarra, frecuencia de letras del alemán */
  const s1 = escena("metodo", 4.6, 18);
  lampara(470, 0, 150, s1, 0.32);
  el("text", { x: 70, y: 70, class: "etiqueta-pelicula" }, s1, "ASÍ LO CUENTA LA PELÍCULA");
  el("rect", { x: 760, y: 110, width: 760, height: 540, rx: 6, class: "pizarra" }, s1);
  el("text", { x: 810, y: 178, class: "tiza", style: "font-size:30px;opacity:.55;letter-spacing:6px" }, s1, "QXKBV RTLEO PZMAW");
  E.metodo.palabras = el("text", { x: 810, y: 240, class: "tiza", style: "font-size:42px;fill:#E7B53A;letter-spacing:5px" }, s1, "");
  /* frecuencias aproximadas del alemán (%): E N I S R A T D */
  const FREQ = [["E", 17.4], ["N", 9.8], ["I", 7.6], ["S", 7.3], ["R", 7.0], ["A", 6.5], ["T", 6.2], ["D", 5.1]];
  const BASE = 590, KH = 15.5;
  E.metodo.barras = FREQ.map(([l, f], i) => { const x = 818 + i * 84;
    const r = el("rect", { x, y: BASE, width: 56, height: 0, class: i ? "barra" : "barra-e" }, s1);
    el("text", { x: x + 28, y: 628, class: "barra-letra", "text-anchor": "middle" }, s1, l);
    return { r, x, h: f * KH }; });
  E.metodo.hugh = figura("presume", 330, 900, 1.12, "rojo", s1);
  E.metodo.turing = figura("turing", 660, 900, 1.04, "tinta", s1);
  const sello = E.metodo.sello = el("g", {}, s1);
  el("rect", { x: -230, y: -66, width: 460, height: 132, rx: 10, fill: "#F1EADB", class: "sello" }, sello);
  el("text", { x: 0, y: 30, class: "sello-texto", "text-anchor": "middle", style: "font-size:84px" }, sello, "SUERTE");
  /* puntos dentro de las barras (a altura real) para deshacerlas en letras */
  const ptsBarras = []; E.metodo.barras.forEach((b) => { const n = Math.round(b.h / 4.2); for (let k = 0; k < n; k++) ptsBarras.push([b.x + 6 + azar() * 44, BASE - azar() * b.h]); });

  /* S2 · el concepto como promesa */
  const s2 = escena("promesa", 18, 24.6);
  el("rect", { width: W, height: H, class: "tinta" }, s2);
  E.promesa.rosa = guilloche(800, 430, 420, [[61, 140, 61], [47, 110, 47]], s2, "#00A080", 0.16);
  el("text", { x: 800, y: 190, class: "promesa-ceja", "text-anchor": "middle" }, s2, "EL CONCEPTO DE TURING · UNA PROMESA");
  const LINEAS = [[["Una", "máquina", "que", "descifre"], 330], [["cada", "mensaje,"], 460], [["cada", "día,", "a", "toda", "hora."], 590]];
  E.promesa.palabras = [];
  LINEAS.forEach(([ps, y], li) => { const t = el("text", { x: 800, y, class: "promesa", "text-anchor": "middle" }, s2);
    ps.forEach((p, k) => { const sp = el("tspan", { opacity: 0 }, t, (k ? " " : "") + p); if (li > 0 && k < 2) sp.setAttribute("fill", "#3DD9B0"); E.promesa.palabras.push(sp); }); });

  /* S3 · el equipo se va; Turing se queda */
  const s3 = escena("solo", 24.6, 30.6);
  E.solo.luz = lampara(520, 0, 190, s3, 0.34);
  el("text", { x: 70, y: 70, class: "etiqueta-pelicula" }, s3, "ASÍ LO CUENTA LA PELÍCULA");
  figura("turing", 520, 770, 0.92, "tinta", s3);
  el("rect", { x: 300, y: 600, width: 460, height: 34, class: "tinta" }, s3);
  el("rect", { x: 330, y: 634, width: 22, height: 270, class: "tinta" }, s3); el("rect", { x: 708, y: 634, width: 22, height: 270, class: "tinta" }, s3);
  [[380, -8], [470, 6], [600, -4]].forEach(([x, r]) => el("rect", { x, y: 584, width: 110, height: 18, class: "papel", transform: `rotate(${r} ${x + 55} 593)`, style: "stroke-width:2" }, s3));
  E.solo.grupo = [["presume", 1000, 1.0], ["colega", 1170, 0.96], ["colega", 1330, 1.0], ["colega", 1480, 0.92]].map(([tp, x, s], i) => { const f = figura(tp === "presume" ? "colega" : tp, x, 900, s, i === 0 ? "rojo" : "tinta", s3); f.x0 = x; f.s0 = s; return f; });

  /* S4 · los planos: trazo a trazo sobre papel cuadriculado, y se vuelven máquina */
  const s4 = escena("planos", 30.6, 38.6);
  el("rect", { width: W, height: H, fill: "#FBF7EE" }, s4);
  for (let x = 0; x <= W; x += 40) el("path", { d: `M${x} 0V${H}`, class: "cuadricula" }, s4);
  for (let y = 0; y <= H; y += 40) el("path", { d: `M0 ${y}H${W}`, class: "cuadricula" }, s4);
  /* bocetos clavados en la pared */
  E.planos.bocetos = [[70, 110, -4], [90, 360, 3], [1300, 120, 4], [1290, 380, -3]].map(([x, y, r], i) => { const g = el("g", { transform: `rotate(${r} ${x + 115} ${y + 100})` }, s4);
    el("rect", { x, y, width: 230, height: 200, class: "boceto" }, g);
    if (i % 2 === 0) { el("circle", { cx: x + 70, cy: y + 100, r: 42, class: "plano-fino" }, g); el("circle", { cx: x + 160, cy: y + 100, r: 42, class: "plano-fino" }, g); el("path", { d: `M${x + 112} ${y + 100}H${x + 118}`, class: "plano-fino" }, g); }
    else { for (let k = 0; k < 5; k++) el("path", { d: `M${x + 24} ${y + 40 + k * 30}H${x + 120 + azar() * 80}`, class: "plano-fino" }, g); el("path", { d: `M${x + 30} ${y + 180}L${x + 200} ${y + 30}`, class: "plano-fino" }, g); }
    el("circle", { cx: x + 115, cy: y + 14, r: 9, class: "chinche" }, g); return g; });
  E.planos.caja = el("rect", { x: 420, y: 140, width: 760, height: 500, rx: 8, class: "plano", fill: "#0A1F2E", "fill-opacity": 0 }, s4);
  const trazos = [E.planos.caja];
  const COLS = [540, 680, 820, 960, 1100], FILAS = [[250, "#C8102E"], [390, "#E7B53A"], [530, "#1F6F86"]];
  FILAS.forEach(([y]) => COLS.forEach((x) => trazos.push(el("circle", { cx: x, cy: y, r: 52, class: "plano" }, s4))));
  [[460, 320, 1140, 320], [460, 460, 1140, 460], [420, 600, 1180, 600], [470, 160, 470, 620], [1130, 160, 1130, 620]].forEach(([a, b, c, d]) => trazos.push(el("path", { d: `M${a} ${b}L${c} ${d}`, class: "plano-fino" }, s4)));
  E.planos.trazos = trazos;
  E.planos.cables = el("g", { opacity: 0 }, s4);
  COLS.slice(0, 4).forEach((x, k) => el("path", { d: `M${x + 52} ${250 + (k % 2) * 140}C${x + 70} 330 ${x + 90} 420 ${x + 140 - 52} ${530 - (k % 2) * 140}`, class: "cable" }, E.planos.cables));
  E.planos.tambores = FILAS.map(([y, c]) => COLS.map((x) => tambor(x, y, 52, c, s4)));
  E.planos.maquina = el("g", { opacity: 0 }, s4);
  el("text", { x: 800, y: 690, class: "etiqueta-pelicula", "text-anchor": "middle" }, E.planos.maquina, "UN CONCEPTO QUE YA SE PUEDE VER");

  /* S5 · en la vida real */
  const s5 = escena("real", 38.6, 43.2);
  const TARJ = [{ x: 90, ceja: "POLONIA · 1938", nombre: "Bomba", quien: ["Marian Rejewski"], c: "#1F6F86" },
    { x: 590, ceja: "BLETCHLEY PARK · 1940", nombre: "Bombe", quien: ["Alan Turing", "Gordon Welchman"], c: "#C8102E" }];
  E.real.tarjetas = TARJ.map((k) => { const g = el("g", {}, s5);
    el("rect", { x: k.x, y: 170, width: 390, height: 470, rx: 8, class: "tarjeta" }, g);
    el("text", { x: k.x + 36, y: 222, class: "tarjeta-ceja" }, g, k.ceja);
    g.ds = [0, 1, 2].map((j) => tambor(k.x + 92 + j * 104, 320, 44, k.c, g));
    el("text", { x: k.x + 36, y: 470, class: "tarjeta-nombre" }, g, k.nombre);
    k.quien.forEach((q, j) => el("text", { x: k.x + 36, y: 528 + j * 38, class: "tarjeta-quien" }, g, q));
    return g; });
  E.real.flecha = el("path", { d: "M500 405H570M548 383L572 405L548 427", class: "flecha" }, s5);

  /* S6 · cierre: los trazos del plano se cierran en el cuadrado del concepto */
  const s6 = escena("cierre", 43.2, 47.5);
  E.cierre.rosa = guilloche(800, 400, 340, [[57, 120, 57], [83, 140, 83]], s6, "#0A1F2E", 0.22);
  E.cierre.cuad = el("path", { d: "M620 220H980V580H620Z", class: "cuadrado", opacity: 0 }, s6);
  const lados = [[620, 220, 980, 220], [980, 220, 980, 580], [980, 580, 620, 580], [620, 580, 620, 220]];
  E.cierre.trazos = [];
  lados.forEach(([x1, y1, x2, y2]) => { for (let k = 0; k < 6; k++) { const a = k / 6, b = (k + 1) / 6, cx = azar() * W, cy = 80 + azar() * 620, ang = azar() * Math.PI, len = 40 + azar() * 40;
    E.cierre.trazos.push({ e: el("line", { class: "trazo", opacity: 0 }, s6), fin: [x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b],
      ini: [cx - Math.cos(ang) * len / 2, cy - Math.sin(ang) * len / 2, cx + Math.cos(ang) * len / 2, cy + Math.sin(ang) * len / 2], k: azar() }); } });

  /* letras sueltas: el método de siempre se deshace en letras */
  const capaL = $("letras-sueltas");
  const letrasMet = ptsBarras.map(([x, y]) => ({ x, y, dx: (azar() - 0.3) * 700, dy: -260 - azar() * 520, r: (azar() - 0.5) * 300,
    e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: "#E7B53A", opacity: 0 }, capaL, ABC[Math.floor(azar() * 26)]) }));

  const SUBS = [
    [0.8, 4.4, "", false],
    [5.0, 8.6, "Hugh Alexander presume del método de siempre: contar qué letras se repiten más.", false],
    [8.6, 12.2, "Así descifra algunos mensajes, <em>a mano</em>.", false],
    [12.6, 15.4, "Turing lo descarta: eso no es un método, <em>es suerte</em>.", false],
    [15.4, 17.8, "Cada día la clave cambia, y lo de ayer ya no sirve.", false],
    [18.4, 24.3, "Su concepto es una promesa: algo que todavía no existe, pero que ya se puede decir.", true],
    [25.0, 27.8, "El equipo se va a almorzar…", false],
    [27.8, 30.4, "…y Turing se queda solo con su promesa.", false],
    [31.0, 34.6, "Dibuja planos sin parar y llena la pared con ellos.", false],
    [34.6, 38.4, "Trazo a trazo, el concepto toma forma: <em>una máquina</em>.", false],
    [39.0, 43.0, "En la vida real, la máquina se llamó <em>bombe</em>, y Turing no la hizo solo.", false],
    [43.6, 47, "El arte da forma al concepto. Al comunicarlo, pone a prueba el <em>paradigma</em> de los demás.", false],
  ];
  const NOTAS = [[39.1, 43.0, "<b>En la vida real…</b>La máquina se llamó <i>bombe</i>. Partió de la <i>bomba</i> que el polaco Marian Rejewski diseñó en 1938; Turing la rediseñó en 1939 y Gordon Welchman le sumó el «tablero diagonal». La primera, apodada «Victory», empezó a funcionar en marzo de 1940. El nombre «Christopher» es invento de la película."]];
  const sub = $("subtitulo"), nota = $("nota"); let subI = -2, notaI = -2, lens = null;

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
    $("fondo").style.fill = t > 18 && t < 24.6 ? "#0A1F2E" : "";
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${(-t * 9).toFixed(2)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (400 * (1 - tr(t, 1.2, 2.4))).toFixed(1));
    /* S1: las barras crecen (el método); con Turing tiemblan como dados; luego se deshacen en letras */
    const M = E.metodo, crece = tr(t, 5.4, 8.2), dados = lin(t, 13.6, 14.0) * (1 - lin(t, 14.9, 15.3)), cae = lin(t, 15.5, 17.6);
    M.barras.forEach((b, i) => { const p = ease(clamp(crece * 1.6 - i * 0.08, 0, 1));
      const h = b.h * p * (1 + dados * (ruido(Math.floor(t * 7) + i * 3.3) * 1.6 - 0.8));
      b.r.setAttribute("height", h.toFixed(1)); b.r.setAttribute("y", (BASE - h).toFixed(1)); b.r.setAttribute("opacity", (1 - tr(t, 15.5, 16.1)).toFixed(3)); });
    M.palabras.textContent = t < 8.6 ? "" : t < 15.5 ? mezcla("WETTER NORD REGEN", lin(t, 8.8, 11.6), t, 0) : mezcla("WETTER NORD REGEN", 1 - lin(t, 15.5, 16.8), t, 5);
    M.hugh.setAttribute("transform", `translate(330 ${(900 + 30 * (1 - tr(t, 4.6, 6))).toFixed(1)}) scale(1.12)`);
    M.hugh.setAttribute("opacity", (1 - 0.55 * tr(t, 12.6, 13.4)).toFixed(3));
    M.turing.setAttribute("transform", `translate(${(660 - 340 * (1 - tr(t, 12.2, 13.4))).toFixed(1)} 900) scale(1.04)`);
    M.turing.setAttribute("opacity", tr(t, 12.2, 12.9).toFixed(3));
    const ps = lin(t, 14.0, 14.4); M.sello.setAttribute("opacity", ps > 0 ? (1 - tr(t, 15.6, 16.2)).toFixed(3) : "0");
    M.sello.setAttribute("transform", `translate(1140 410) rotate(-9) scale(${(ps < 1 ? 2 - easeIn(ps) : 1).toFixed(3)})`);
    const enS1 = t > 15 && t < 18.2;
    letrasMet.forEach((L, i) => { const d = ease(clamp((cae - (i % 20) * 0.012) / 0.8, 0, 1));
      const op = enS1 ? (cae <= 0 ? 0 : (d < 0.12 ? d / 0.12 : 1 - (d - 0.12) / 0.88)) * vis(t, 4.6, 18) : 0;
      L.e.setAttribute("opacity", op.toFixed(3)); L.e.setAttribute("transform", `translate(${(L.x + L.dx * d).toFixed(1)} ${(L.y + L.dy * d).toFixed(1)}) rotate(${(L.r * d).toFixed(1)})`); });
    /* S2: la promesa, palabra a palabra, a golpes */
    E.promesa.rosa.setAttribute("transform", `rotate(${(t * 4).toFixed(2)} 800 430)`);
    E.promesa.palabras.forEach((w, i) => { const a = 18.8 + i * 0.32 + (i >= 4 ? 0.45 : 0) + (i >= 6 ? 0.45 : 0); w.setAttribute("opacity", tr(t, a, a + 0.3).toFixed(3)); });
    /* S3: el grupo sale a la derecha, uno tras otro; la luz se queda con Turing */
    E.solo.grupo.forEach((f, i) => { const p = easeIn(lin(t, 25.6 + i * 0.45, 28.4 + i * 0.35)), paso = Math.abs(Math.sin((t - 25.6) * 7 + i)) * 10 * (p > 0 && p < 1 ? 1 : 0);
      f.setAttribute("transform", `translate(${(f.x0 + 820 * p).toFixed(1)} ${(900 - paso).toFixed(1)}) scale(${f.s0})`); });
    E.solo.luz.firstChild.setAttribute("opacity", (0.34 + 0.12 * tr(t, 28.2, 30)).toFixed(3));
    /* S4: el plano se dibuja trazo a trazo; los tambores giran */
    if (!lens) { const ls = E.planos.trazos.map((e) => e.getTotalLength()); if (ls.every((x) => x > 0)) { lens = ls; E.planos.trazos.forEach((e, i) => e.setAttribute("stroke-dasharray", `${ls[i].toFixed(1)} ${ls[i].toFixed(1)}`)); } }
    if (lens) E.planos.trazos.forEach((e, i) => { const a = 31.0 + i * 0.13; e.setAttribute("stroke-dashoffset", (lens[i] * (1 - tr(t, a, a + 0.7))).toFixed(1)); });
    E.planos.bocetos.forEach((g, i) => { const p = tr(t, 31.4 + i * 0.55, 31.9 + i * 0.55); g.setAttribute("opacity", p.toFixed(3)); });
    const vm = tr(t, 34.6, 35.6); E.planos.caja.setAttribute("fill-opacity", (0.92 * vm).toFixed(3));
    E.planos.cables.setAttribute("opacity", tr(t, 35.4, 36).toFixed(3)); E.planos.maquina.setAttribute("opacity", tr(t, 36.2, 36.8).toFixed(3));
    E.planos.tambores.forEach((fila, fi) => fila.forEach((d, k) => { const p = tr(t, 34.8 + k * 0.12 + fi * 0.08, 35.4 + k * 0.12 + fi * 0.08);
      d.setAttribute("opacity", p.toFixed(3)); d.gi.setAttribute("transform", `rotate(${(Math.max(0, t - 34.8) * [160, 60, 24][fi] * (k % 2 ? -1 : 1)).toFixed(1)} ${d.cx} ${d.cy})`); }));
    /* S5: las tarjetas entran; la flecha une la bomba polaca con la bombe */
    E.real.tarjetas.forEach((g, i) => { const p = tr(t, 39 + i * 0.6, 39.8 + i * 0.6); g.setAttribute("opacity", p.toFixed(3)); g.setAttribute("transform", `translate(0 ${(40 * (1 - p)).toFixed(1)})`);
      g.ds.forEach((d, j) => d.gi.setAttribute("transform", `rotate(${(t * (40 + j * 25) * (j % 2 ? -1 : 1)).toFixed(1)} ${d.cx} ${d.cy})`)); });
    E.real.flecha.setAttribute("opacity", tr(t, 39.6, 40.1).toFixed(3));
    /* S6: los trazos vuelan y se cierran en el cuadrado */
    E.cierre.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 400)`);
    const pj = lin(t, 43.4, 45.6);
    E.cierre.trazos.forEach((z) => { const d = ease(clamp((pj - z.k * 0.3) / 0.7, 0, 1)), [a, b, c, e] = z.ini, [A, B, C, F] = z.fin;
      z.e.setAttribute("x1", (a + (A - a) * d).toFixed(1)); z.e.setAttribute("y1", (b + (B - b) * d).toFixed(1)); z.e.setAttribute("x2", (c + (C - c) * d).toFixed(1)); z.e.setAttribute("y2", (e + (F - e) * d).toFixed(1));
      z.e.setAttribute("opacity", (t > 43.2 ? Math.min(1, pj * 4) * (1 - tr(t, 45.6, 46.1)) : 0).toFixed(3)); });
    E.cierre.cuad.setAttribute("opacity", tr(t, 45.3, 45.9).toFixed(3));
    E.cierre.cuad.setAttribute("transform", `translate(800 400) scale(${(1 + 0.06 * (1 - tr(t, 45.3, 46.2))).toFixed(3)}) translate(-800 -400)`);
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
    validar() { return { ok: true, notas: ["ilustración y textos propios", "película y vida real diferenciadas", "sin red"] }; } };
})();

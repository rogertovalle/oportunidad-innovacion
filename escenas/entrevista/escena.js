/* La entrevista — «Enigma en grabado y tinta» (misma arquitectura que la carta v2).
   Paso 1 · la idea como paradigma: el mismo problema (Enigma) visto desde dos lugares — traducir (el comandante) o combinar (Turing).
   Principios tomados del lenguaje de las secuencias de títulos gráficas (siluetas planas, paleta mínima, un mundo hecho
   del motivo, cuerpos/palabras que se deshacen en el motivo, cámara que entra y sale del patrón). Ilustración y textos propios;
   cuenta el paso como lo plantea la película y agrega lo que pasó en la vida real.
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
  let semilla = 1939; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
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

  /* máquina Enigma (dos lecturas del mismo objeto): «palabras» por fuera, «engranajes» por dentro */
  function maquina(padre, modo) {
    const g = el("g", {}, padre);
    if (modo === "palabras") {
      el("rect", { x: 580, y: 280, width: 440, height: 330, rx: 18, class: "maq-cuerpo" }, g);
      el("rect", { x: 600, y: 296, width: 400, height: 70, rx: 8, class: "maq-tapa" }, g);
      const v = []; [740, 800, 860].forEach((x) => { el("rect", { x: x - 22, y: 308, width: 44, height: 46, rx: 4, class: "maq-ventana" }, g); v.push(el("text", { x, y: 341, class: "maq-ventana-l", "text-anchor": "middle" }, g, "A")); });
      g.ventanas = v;
      const filas = ["QWERTZUIO", "ASDFGHJK", "PYXCVBNML"];
      filas.forEach((f, j) => f.split("").forEach((c, i) => { const x = 800 + (i - (f.length - 1) / 2) * 40, y = 420 + j * 58;
        el("circle", { cx: x, cy: y, r: 17, class: "maq-tecla" }, g); el("text", { x, y: y + 5, class: "maq-tecla-l", "text-anchor": "middle" }, g, c); }));
    } else {
      el("rect", { x: 580, y: 280, width: 440, height: 330, rx: 18, class: "maq-rayos" }, g);
      const rs = [700, 800, 900].map((x, i) => { const r = rotor(x, 380, 42, g, i === 1 ? "#E7B53A" : "#F5F3EF"); r.querySelectorAll("text").forEach((tx) => tx.remove()); return r; });
      g.rotores = rs;
      for (let i = 0; i < 9; i++) { const x = 640 + i * 40; el("path", { d: `M${x} 580C${x} 500 ${700 + (i % 3) * 100} 520 ${700 + (i % 3) * 100} 430`, class: "cable" }, g); }
      for (let i = 0; i < 9; i++) el("circle", { cx: 640 + i * 40, cy: 580, r: 8, fill: "#F5F3EF" }, g);
    }
    return g;
  }
  function globo(padre, x, y, w, texto, cola) {
    const g = el("g", {}, padre), h = 92;
    el("path", { d: `M${x - w / 2} ${y - h / 2}H${x + w / 2}V${y + h / 2}H${cola[0] + 26}L${cola[0]} ${cola[1]}L${cola[0] - 4} ${y + h / 2}H${x - w / 2}Z`, class: "globo" }, g);
    el("text", { x, y: y + 16, class: "globo-texto", "text-anchor": "middle" }, g, texto);
    return g;
  }

  /* ═══ escenas ═══ */
  const E = {};
  const escena = (id, a, b) => { const g = el("g", { id }, mundo); E[id] = { g, a, b }; return g; };

  /* S0 · título */
  const s0 = escena("titulo", 0, 4.4);
  E.titulo.rosa = guilloche(800, 450, 300, [[57, 120, 19], [83, 140, 83], [41, 90, 41]], s0, "#006060", 0.32);
  E.titulo.rosa2 = guilloche(800, 450, 300, [[73, 150, 73]], s0, "#E7B53A", 0.7);
  el("text", { x: 800, y: 360, class: "titulo-ceja", "text-anchor": "middle" }, s0, "PASO 1 · LA IDEA COMO PARADIGMA");
  el("text", { x: 800, y: 500, class: "titulo-grande", "text-anchor": "middle" }, s0, "La entrevista");
  E.titulo.raya = el("path", { d: "M560 540H1040", stroke: "#C8102E", "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": 480, "stroke-dashoffset": 480 }, s0);

  /* S1 · contexto y oportunidad: el mensaje entra en claro y sale cifrado */
  const s1 = escena("contexto", 4.4, 10.4);
  guilloche(800, 430, 430, [[47, 110, 47]], s1, "#0A1F2E", 0.12);
  el("text", { x: 800, y: 110, class: "titulo-ceja", "text-anchor": "middle" }, s1, "1939 · SEGUNDA GUERRA MUNDIAL");
  const CLARO = ["ANGRIFF IM MORGENGRAUEN ", "WETTERBERICHT NORDSEE ", "GELEITZUG KURS WEST ", "STANDORT BEFEHL FOLGT "];
  const cifrado = () => { let s = ""; for (let i = 0; i < 40; i++) s += (i % 5 === 4 ? " " : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(azar() * 26)]); return s; };
  E.contexto.filas = [250, 340, 520, 610].map((y, i) => {
    const iz = el("text", { x: 0, y, class: "cifra-fila", fill: "#0A1F2E", "clip-path": "url(#c-izq-1)" }, s1, CLARO[i].repeat(4));
    const de = el("text", { x: 0, y, class: "cifra-fila", fill: "#C8102E", "clip-path": "url(#c-der-1)" }, s1, cifrado() + cifrado());
    return { iz, de, v: 60 + i * 14 };
  });
  el("circle", { cx: 800, cy: 430, r: 236, fill: "#F1EADB" }, s1);
  E.contexto.rotor = rotor(800, 430, 170, s1, "#0A1F2E");
  E.contexto.aro = el("circle", { cx: 800, cy: 430, r: 0, class: "aro", "stroke-width": 8 }, s1);
  E.contexto.op = el("g", { opacity: 0 }, s1);
  el("rect", { x: 610, y: 668, width: 380, height: 58, rx: 8, fill: "#0A1F2E" }, E.contexto.op);
  el("text", { x: 800, y: 707, class: "titulo-ceja", "text-anchor": "middle", style: "fill:#E7B53A" }, E.contexto.op, "LA OPORTUNIDAD");

  /* S2 · el despacho: «¿habla alemán?» — «no» — la puerta — el acertijo */
  const s2 = escena("despacho", 10.4, 22.4);
  for (let x = 40; x < W; x += 120) el("path", { d: `M${x} 0V900`, class: "panel" }, s2);
  el("path", { d: "M0 160H1600M0 600H1600", class: "panel" }, s2);
  el("rect", { x: 1290, y: 120, width: 230, height: 330, class: "ventana" }, s2);
  el("path", { d: "M1405 120V450M1290 285H1520", stroke: "#0A1F2E", "stroke-width": 6 }, s2);
  E.despacho.luz = el("path", { d: "M90 260H250V880H90Z", class: "puerta-luz", opacity: 0 }, s2);
  E.despacho.puerta = el("path", { d: "M90 260H250V880H90Z", class: "puerta" }, s2);
  E.despacho.oficial = figura("oficial", 1080, 880, 1.8, "rojo", s2);
  el("rect", { x: 760, y: 640, width: 640, height: 120, class: "tinta" }, s2);
  el("rect", { x: 800, y: 760, width: 40, height: 140, class: "tinta" }, s2); el("rect", { x: 1320, y: 760, width: 40, height: 140, class: "tinta" }, s2);
  E.despacho.turing = figura("turing", 470, 880, 0.9, "tinta", s2);
  E.despacho.ruta = el("path", { d: "M960 300C760 170 420 160 250 330", fill: "none", stroke: "#E7B53A", "stroke-width": 5, "stroke-dasharray": "12 12", opacity: 0 }, s2);
  E.despacho.g1 = globo(s2, 760, 170, 440, "¿Habla alemán?", [930, 250]);
  E.despacho.g2 = globo(s2, 470, 420, 170, "No.", [480, 500]);
  E.despacho.g3 = globo(s2, 640, 300, 460, "Es un acertijo.", [560, 420]);
  E.despacho.g3.querySelector("path").style.fill = "#E7B53A";
  E.despacho.peli = el("text", { x: 60, y: 70, class: "etiqueta-pelicula", opacity: 0 }, s2, "ASÍ LO CUENTA LA PELÍCULA");
  E.despacho.puntos = [];
  { const c = doc.createElement("canvas"); c.width = W; c.height = H; const k = c.getContext("2d"); k.fillRect(540, 124, 440, 92); const px = k.getImageData(0, 0, W, H).data;
    let n = 0; while (E.despacho.puntos.length < 110 && n++ < 60000) { const x = Math.floor(azar() * W), y = Math.floor(azar() * H); if (px[(y * W + x) * 4 + 3] > 0) E.despacho.puntos.push([x, y]); } }

  /* S3 · el mismo objeto visto desde dos lugares */
  const s3 = escena("dos", 22.4, 31.2);
  const izq = el("g", { "clip-path": "url(#c-izq-2)" }, s3), der = el("g", { "clip-path": "url(#c-der-2)" }, s3);
  el("rect", { width: W, height: H, fill: "#E6DCC6" }, izq);
  E.dos.dicc = el("g", {}, izq);
  const DICC = [["das Wetter", "el clima"], ["der Befehl", "la orden"], ["der Angriff", "el ataque"], ["der Kurs", "el rumbo"], ["das Meer", "el mar"], ["der Hafen", "el puerto"],
    ["die Nacht", "la noche"], ["der Feind", "el enemigo"], ["die Küste", "la costa"], ["die Meldung", "el parte"], ["das Schiff", "el barco"], ["der Morgen", "la mañana"]];
  const POS = [[60, 290], [300, 350], [80, 450], [320, 520], [60, 610], [290, 680], [1100, 290], [1340, 350], [1110, 450], [1350, 520], [1100, 610], [1340, 680]];
  DICC.forEach(([de, es], i) => { const [x, y] = POS[i];
    const gg = el("g", { opacity: 0.55 }, E.dos.dicc); el("text", { x, y, class: "dicc" }, gg, de); el("text", { x, y: y + 30, class: "dicc-trad" }, gg, "· " + es); });
  E.dos.mIzq = maquina(izq, "palabras");
  E.dos.lblIzq = el("g", {}, izq);
  el("text", { x: 0, y: 110, class: "lado-quien", "text-anchor": "middle", fill: "#C8102E" }, E.dos.lblIzq, "EL COMANDANTE");
  el("text", { x: 0, y: 170, class: "lado-idea", "text-anchor": "middle", fill: "#0A1F2E" }, E.dos.lblIzq, "Hay que traducir");
  E.dos.sello = el("g", { opacity: 0 }, izq);
  el("rect", { x: -170, y: -44, width: 340, height: 88, rx: 8, class: "sello", style: "fill:#FBF7EE" }, E.dos.sello);
  el("text", { x: 0, y: 18, class: "sello-texto", "text-anchor": "middle", style: "font-size:50px" }, E.dos.sello, "IMPOSIBLE");
  E.dos.com = figura("oficial", 0, 790, 0.5, "rojo", izq);
  el("rect", { width: W, height: H, fill: "#0A1F2E" }, der);
  E.dos.engr = [[1500, 300, 66, "#E7B53A"], [1230, 690, 58, "#3DD9B0"], [1560, 470, 40, "#1F6F86"]].map(([x, y, r, c]) => { const R = rotor(x, y, r, der, c); R.setAttribute("opacity", 0.45); return R; });
  ["5 × 4 × 3", "26 × 26 × 26", "10 pares de cables"].forEach((s, i) => el("text", { x: 1070, y: 330 + i * 95, class: "comb", opacity: 0.7 }, der, s));
  E.dos.mDer = maquina(der, "engranajes");
  E.dos.lblDer = el("g", {}, der);
  el("text", { x: 0, y: 110, class: "lado-quien", "text-anchor": "middle", fill: "#3DD9B0" }, E.dos.lblDer, "TURING");
  el("text", { x: 0, y: 170, class: "lado-idea", "text-anchor": "middle", fill: "#F5F3EF" }, E.dos.lblDer, "Hay que combinar");
  E.dos.tur = figura("turing", 0, 790, 0.5, "crema", der);
  E.dos.raya = el("path", { d: "M0 0V900", stroke: "#E7B53A", "stroke-width": 6 }, s3);

  /* S4 · la medianoche y la cifra */
  const s4 = escena("cifra", 31.2, 39.6);
  el("rect", { width: W, height: H, class: "tinta" }, s4);
  guilloche(800, 430, 420, [[67, 130, 67]], s4, "#E7B53A", 0.16);
  el("circle", { cx: 800, cy: 215, r: 120, class: "reloj-aro" }, s4);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; el("path", { d: `M${800 + Math.sin(a) * 96} ${215 - Math.cos(a) * 96}L${800 + Math.sin(a) * 108} ${215 - Math.cos(a) * 108}`, class: "reloj-marca" }, s4); }
  E.cifra.hora = el("path", { d: "M800 215V150", class: "reloj-aguja-c" }, s4);
  E.cifra.min = el("path", { d: "M800 215V120", class: "reloj-aguja" }, s4);
  el("circle", { cx: 800, cy: 215, r: 10, class: "tinta" }, s4);
  E.cifra.flash = el("circle", { cx: 800, cy: 215, r: 120, fill: "none", stroke: "#E7B53A", "stroke-width": 6, opacity: 0 }, s4);
  E.cifra.ceja = el("text", { x: 800, y: 420, class: "contador-ceja", "text-anchor": "middle" }, s4, "CONFIGURACIONES POSIBLES · CADA DÍA, DE CERO");
  E.cifra.num = el("text", { x: 800, y: 530, class: "contador", "text-anchor": "middle" }, s4, "0");
  E.cifra.desg = el("text", { x: 800, y: 600, class: "contador-desglose", "text-anchor": "middle", opacity: 0 }, s4, "60 órdenes de rotores × 17.576 posiciones × 150.738.274.937.250 formas de cablear el tablero");

  /* S5 · en la vida real */
  const s5 = escena("real", 39.6, 43.8);
  const ficha = el("g", {}, s5);
  el("rect", { x: 140, y: 170, width: 780, height: 480, class: "papel" }, ficha);
  el("text", { x: 190, y: 240, class: "papel-texto", style: "fill:#C8102E;font-size:22px;letter-spacing:2px" }, ficha, "GOVERNMENT CODE & CYPHER SCHOOL");
  [["Lugar:   Bletchley Park", 330], ["Llegada: 4 de septiembre de 1939", 400], ["Nombre:  A. M. Turing", 470], ["Oficio:  matemático", 540]].forEach(([s, y]) => el("text", { x: 190, y, class: "ficha-texto" }, ficha, s));
  [300, 370, 440, 510, 580].forEach((y) => el("path", { d: `M190 ${y}H870`, class: "renglon" }, ficha));
  E.real.sello = el("g", { opacity: 0 }, ficha);
  el("rect", { x: -150, y: -40, width: 300, height: 80, rx: 8, class: "sello", style: "stroke:#006060" }, E.real.sello);
  el("text", { x: 0, y: 18, class: "sello-texto", "text-anchor": "middle", style: "fill:#006060;font-size:44px" }, E.real.sello, "HISTÓRICO");

  /* S6 · cierre: las letras se juntan en el círculo del paradigma */
  const s6 = escena("cierre", 43.8, 48.4);
  E.cierre.rosa = guilloche(800, 410, 330, [[57, 120, 57], [83, 140, 83]], s6, "#006060", 0.22);
  E.cierre.circ = el("circle", { cx: 800, cy: 410, r: 190, class: "circulo", opacity: 0 }, s6);
  E.cierre.txt = el("text", { x: 800, y: 426, class: "circulo-texto", "text-anchor": "middle", opacity: 0 }, s6, "paradigma");
  const circPts = []; for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; circPts.push([800 + Math.cos(a) * 190, 418 + Math.sin(a) * 190]); }

  /* letras sueltas: el «¿habla alemán?» que se deshace; las letras que forman el círculo */
  const capaL = $("letras-sueltas"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", MIX = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÄÖÜ";
  const letrasGlobo = E.despacho.puntos.map(([x, y]) => ({ x, y, dx: (azar() - 0.5) * 800, dy: -120 - azar() * 360, r: (azar() - 0.5) * 300, e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: "#0A1F2E", opacity: 0 }, capaL, ABC[Math.floor(azar() * 26)]) }));
  const letrasCirc = circPts.map(([x, y], i) => ({ x, y, sx: azar() * W, sy: azar() * H, e: el("text", { x: 0, y: 0, class: "letra", "text-anchor": "middle", fill: i % 2 ? "#C8102E" : "#0A1F2E", opacity: 0 }, capaL, MIX[Math.floor(azar() * MIX.length)]) }));

  const SUBS = [
    [0.8, 4.2, "", false],
    [4.8, 7.6, "Segunda Guerra Mundial. Enigma cifra las comunicaciones del enemigo.", false],
    [7.6, 10.2, "La oportunidad: descifrarlas daría una <em>ventaja para ganar la guerra</em>.", false],
    [10.8, 13.4, "Un programa secreto busca a los mejores lingüistas y criptógrafos.", false],
    [13.4, 16.2, "El comandante pregunta si habla alemán. Turing: <em>no</em>.", false],
    [16.2, 18.5, "Para él, la conversación terminó: casi lo echa.", false],
    [18.5, 22.2, "Turing lo frena: los códigos no son un idioma, son <em>un acertijo</em>.", false],
    [22.7, 26.4, "Para el comandante, Enigma es un problema de traducción. Sin alemán: <em>imposible</em>.", false],
    [26.4, 31, "Para Turing es un rompecabezas: combinar <em>más allá de la capacidad humana</em>.", false],
    [31.5, 34.8, "Y la configuración cambia cada medianoche: cada día se empieza de cero.", true],
    [34.8, 39.4, "Hay unos <em>159 trillones</em> de configuraciones posibles.", true],
    [39.9, 43.6, "En la vida real, Turing llegó a Bletchley Park al día siguiente de declararse la guerra.", false],
    [44.1, 48, "El mismo problema, visto desde dos lugares: eso es un <em>paradigma</em>.", false],
  ];
  const NOTAS = [
    [35.6, 39.4, "<b>En la vida real…</b>La cifra es real: la Enigma militar de 3 rotores (elegidos entre 5, con 10 cables en el tablero) admitía 158.962.555.217.826.360.000 configuraciones."],
    [40, 43.6, "<b>En la vida real…</b>Turing colaboraba con la escuela de cifras del Gobierno desde 1938 y llegó a Bletchley Park el 4 de septiembre de 1939. La entrevista tensa con el comandante Denniston es una dramatización de la película."],
  ];
  const sub = $("subtitulo"), nota = $("nota"); let subI = -2, notaI = -2;

  function vis(t, a, b, f = 0.7) { return Math.min(tr(t, a - f / 2, a + f / 2), 1 - tr(t, b - f / 2, b + f / 2)); }
  const NUM_FIN = "158962555217826360000";
  const puntos = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  function cuadro(t) {
    t = clamp(Number(t) || 0, 0, D);
    $("cortina").setAttribute("opacity", (1 - tr(t, 0, 1) + tr(t, D - 0.7, D)).toFixed(3));
    /* cámara: cada escena entra desde un poco lejos y sale entrando en el patrón */
    for (const k in E) { const { g, a, b } = E[k]; const v = vis(t, a, b);
      const ent = 1 - tr(t, a - 0.4, a + 0.6), sal = tr(t, b - 0.5, b + 0.4);
      const s = 1 - 0.08 * ent + 0.5 * easeIn(sal);
      g.setAttribute("opacity", v.toFixed(3)); g.setAttribute("transform", `translate(800 450) scale(${s.toFixed(4)}) translate(-800 -450)`);
      g.style.display = v > 0.001 ? "" : "none"; }
    $("fondo").style.fill = t > 31.2 && t < 39.6 ? "#0A1F2E" : "";
    /* S0 */
    E.titulo.rosa.setAttribute("transform", `rotate(${(t * 6).toFixed(2)} 800 450)`); E.titulo.rosa2.setAttribute("transform", `rotate(${(-t * 9).toFixed(2)} 800 450)`);
    E.titulo.raya.setAttribute("stroke-dashoffset", (480 * (1 - tr(t, 1.2, 2.4))).toFixed(1));
    /* S1: el texto en claro entra al rotor y sale cifrado; el aro dorado marca la oportunidad */
    const t1 = Math.max(0, t - 4.4);
    E.contexto.filas.forEach((f, i) => { const dx = ((t1 * f.v) % 600); f.iz.setAttribute("x", (-dx).toFixed(1)); f.de.setAttribute("x", (800 - 600 + dx).toFixed(1)); });
    E.contexto.rotor.gi.setAttribute("transform", `rotate(${(t1 * 36).toFixed(1)} 800 430)`);
    E.contexto.aro.setAttribute("r", (250 * tr(t, 7.8, 8.6)).toFixed(1));
    E.contexto.op.setAttribute("opacity", tr(t, 8.2, 8.8).toFixed(3));
    /* S2: el despacho */
    E.despacho.peli.setAttribute("opacity", (tr(t, 11, 11.8) * (1 - tr(t, 21.6, 22.2))).toFixed(3));
    const pg = (g, a, b) => { const p = lin(t, a, a + 0.35); g.setAttribute("opacity", (p > 0 ? 1 : 0) * (1 - tr(t, b, b + 0.3)));
      g.setAttribute("transform", `translate(0 ${(16 * (1 - ease(p))).toFixed(1)})`); };
    E.despacho.g1.setAttribute("opacity", (lin(t, 13.4, 13.75) > 0 ? 1 : 0) * (t < 18.9 ? 1 : 0));
    E.despacho.g1.setAttribute("transform", `translate(0 ${(16 * (1 - ease(lin(t, 13.4, 13.75)))).toFixed(1)})`);
    pg(E.despacho.g2, 14.8, 16.2);
    pg(E.despacho.g3, 19.4, 22.4);
    /* casi lo echa: la puerta se abre, la ruta dorada señala la salida, Turing camina hacia ella; luego se detiene y se vuelve */
    E.despacho.luz.setAttribute("opacity", (tr(t, 16.2, 16.8) * (1 - tr(t, 19.2, 20))).toFixed(3));
    E.despacho.puerta.setAttribute("transform", `translate(90 0) scale(${(1 - 0.82 * tr(t, 16.2, 16.9) * (1 - tr(t, 19.2, 20))).toFixed(3)} 1) translate(-90 0)`);
    E.despacho.ruta.setAttribute("opacity", (0.85 * tr(t, 16.2, 16.7) * (1 - tr(t, 18.4, 18.9))).toFixed(3));
    const camina = tr(t, 16.6, 18.4) - 0.6 * tr(t, 19.4, 20.6), escTur = 0.9 + 0.12 * tr(t, 19.4, 20.6);
    E.despacho.turing.setAttribute("transform", `translate(${(470 - 170 * camina).toFixed(1)} 880) scale(${escTur.toFixed(3)})`);
    E.despacho.oficial.setAttribute("transform", `translate(1080 ${(880 + 30 * (1 - tr(t, 10.4, 11.8))).toFixed(1)}) scale(${(1.8 + 0.06 * tr(t, 14.8, 15.4) - 0.16 * tr(t, 19.6, 21)).toFixed(3)})`);
    /* la pregunta del comandante se deshace en letras cuando cae su marco */
    const pd = lin(t, 18.9, 21.4), enS2 = t > 18.8 && t < 22.6;
    letrasGlobo.forEach((L2, i) => { const d = ease(clamp((pd - (i % 20) * 0.01) / 0.8, 0, 1));
      const op = enS2 ? (pd <= 0 ? 0 : (d < 0.15 ? d / 0.15 : 1 - (d - 0.15) / 0.85)) * vis(t, 10.4, 22.4) : 0;
      L2.e.setAttribute("opacity", op.toFixed(3)); L2.e.setAttribute("transform", `translate(${(L2.x + L2.dx * d).toFixed(1)} ${(L2.y + L2.dy * d).toFixed(1)}) rotate(${(L2.r * d).toFixed(1)})`); });
    /* S3: la línea divide la máquina en dos lecturas; cada lado se mueve a su ritmo (paralaje) */
    const pdv = tr(t, 25.6, 27.2), dv = 1600 - 800 * pdv;
    $("c-izq-2r").setAttribute("width", dv.toFixed(1)); $("c-der-2r").setAttribute("x", dv.toFixed(1)); $("c-der-2r").setAttribute("width", (1600 - dv).toFixed(1));
    E.dos.raya.setAttribute("transform", `translate(${dv.toFixed(1)} 0)`); E.dos.raya.setAttribute("opacity", pdv > 0 && pdv < 1 ? "1" : (pdv >= 1 ? "1" : "0"));
    E.dos.dicc.setAttribute("transform", `translate(${(-30 * pdv - 2.5 * Math.max(0, t - 22.4)).toFixed(1)} 0)`);
    const cIz = dv / 2, cDe = (dv + 1600) / 2;
    E.dos.lblIzq.setAttribute("transform", `translate(${cIz.toFixed(1)} 0)`); E.dos.lblDer.setAttribute("transform", `translate(${cDe.toFixed(1)} 0)`);
    const ps = lin(t, 24.4, 24.8); E.dos.sello.setAttribute("opacity", ((ps > 0 ? 1 : 0) * (1 - tr(t, 25.3, 25.8))).toFixed(3));
    E.dos.sello.setAttribute("transform", `translate(800 470) rotate(-6) scale(${(ps < 1 ? 1.9 - 0.9 * easeIn(ps) : 1).toFixed(3)})`);
    E.dos.com.setAttribute("transform", `translate(${(510 + 10 * pdv).toFixed(1)} 790) scale(0.5)`);
    E.dos.tur.setAttribute("transform", `translate(${(cDe + 270 - 20 * pdv).toFixed(1)} 790) scale(0.5)`);
    const g3 = Math.max(0, t - 22.4) * 30;
    E.dos.engr.forEach((R, i) => R.gi.setAttribute("transform", `rotate(${(i % 2 ? -g3 : g3).toFixed(1)} ${R.cx} ${R.cy})`));
    E.dos.mDer.rotores.forEach((R, i) => R.gi.setAttribute("transform", `rotate(${((i % 2 ? -1 : 1) * g3 * (1 + i)).toFixed(1)} ${R.cx} ${R.cy})`));
    const vent = Math.floor(Math.max(0, t - 22.4) * 3);
    E.dos.mIzq.ventanas.forEach((v, i) => { v.textContent = ABC[(vent * (i + 1) * 7 + i * 5) % 26]; });
    /* S4: el reloj llega a medianoche y la cifra crece */
    const ph = tr(t, 31.6, 34.2), ang = -50 * (1 - ph);
    E.cifra.min.setAttribute("transform", `rotate(${(ang * 12 % 360).toFixed(1)} 800 215)`); E.cifra.hora.setAttribute("transform", `rotate(${ang.toFixed(1)} 800 215)`);
    const pf = lin(t, 34.2, 34.9); E.cifra.flash.setAttribute("r", (120 + 160 * ease(pf)).toFixed(1)); E.cifra.flash.setAttribute("opacity", (pf > 0 ? 1 - pf : 0).toFixed(3));
    const pn = tr(t, 34.8, 37.4); let ns;
    if (pn >= 1) ns = NUM_FIN; else { const v = Math.floor(1.58962555217826e20 * Math.pow(pn, 4)); ns = v < 1 ? "0" : BigInt(v).toString(); }
    E.cifra.num.textContent = puntos(ns);
    E.cifra.desg.setAttribute("opacity", tr(t, 37.4, 38).toFixed(3));
    /* S5: la ficha y el sello histórico */
    const pr = lin(t, 41, 41.4); E.real.sello.setAttribute("opacity", pr > 0 ? "1" : "0");
    E.real.sello.setAttribute("transform", `translate(740 600) rotate(-8) scale(${(pr < 1 ? 1.9 - 0.9 * easeIn(pr) : 1).toFixed(3)})`);
    /* S6: las letras se juntan en el círculo */
    E.cierre.rosa.setAttribute("transform", `rotate(${(t * 5).toFixed(2)} 800 410)`);
    const pj = lin(t, 44, 46);
    letrasCirc.forEach((L3, i) => { const d = ease(clamp((pj - (i % 15) * 0.02) / 0.7, 0, 1)), op = t > 43.8 ? Math.min(1, pj * 3) * (1 - tr(t, 46, 46.6)) : 0;
      L3.e.setAttribute("opacity", op.toFixed(3)); L3.e.setAttribute("transform", `translate(${(L3.sx + (L3.x - L3.sx) * d).toFixed(1)} ${(L3.sy + (L3.y - L3.sy) * d).toFixed(1)})`); });
    E.cierre.circ.setAttribute("opacity", tr(t, 45.6, 46.4).toFixed(3));
    E.cierre.txt.setAttribute("opacity", tr(t, 46.2, 46.9).toFixed(3));
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
    validar() { return { ok: true, notas: ["ilustración y textos propios", "película y vida real diferenciadas", "datos verificados: 4-9-1939, 158.962.555.217.826.360.000", "sin red"] }; } };
})();

/* Oportunidad, Innovación y TD · 1.0
   Una sola posición continua `u` (0 … pasos-1) dibuja todo lo que se mueve: el colibrí, la idea que lleva (el signo),
   su forma, la cámara de Turing y la bandada. En «recorrer» `u` sigue al scroll (suavizado); en «presentar» se
   interpola con la curva de marca. Lo discreto (textos que se revelan, láminas que se funden) va por ir/paso.
   Cada lámina declara su pose en el HTML:
     data-colibri="heroe"             el colibrí grande en su [data-ancla="colibri"] (si no: firma en la esquina)
     data-signo="heroe|estrella"      la idea grande en su [data-ancla="signo"], o en la estrella del colibrí
                                      (sin atributo: pequeña, en el [data-ancla="signo"] de la ceja)
     data-signo-forma="0,1,…"         forma por estado (0 círculo · 1 cuadrado · 2 triángulo · 3 rombo · 4 flecha);
                                      sin atributo, hereda la última forma que tuvo la idea
     data-halo · data-medios · data-giro · data-inclina
   Contrato atril-escena/v1: window.escena = { ir, total, actual, paso, modo, configurar, presentacion }.
   Sin red, sin dependencias, sin scripts inline. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  const secs = Array.from(doc.querySelectorAll("section[data-lamina]"));
  secs.forEach((s, i) => { s.dataset.n = String(i + 1); });
  const total = secs.length;
  const estados = (s) => Math.max(1, Number(s.dataset.estados) || 1);
  const pasos = [];
  secs.forEach((s, i) => { for (let k = 1; k <= estados(s); k++) pasos.push([i + 1, k]); });
  const ULT = pasos.length - 1;
  const hooks = {};
  let ctx = null;

  /* ── utilidades ── */
  const cssVar = (n) => getComputedStyle(html).getPropertyValue(n).trim();
  const ms = (n) => { const v = cssVar(n); return v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : 0; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const espera = (t) => new Promise((r) => setTimeout(r, t));
  const lista = (s, attr, kk, def) => { const v = s.dataset[attr]; if (v == null || v === "") return def; const xs = v.split(",").map(Number); return xs[Math.min(xs.length, kk) - 1]; };
  function reducido() {
    if (ctx && ctx.movimiento) return ctx.movimiento === "reducido";
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; }
      return sy(clamp(t, 0, 1)); };
  }
  const curva = bezier(0.2, 0, 0, 1);
  const hex = (h) => { h = (h || "#000000").replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const rgb = (c) => "rgb(" + c.map((x) => Math.round(x)).join(",") + ")";

  /* ═════════ discreto: láminas y revelados ═════════ */
  let cur = 0, k = 0, token = 0;
  const anuncio = doc.getElementById("anuncio");
  function revelar(s, kk, sinTransicion) {
    if (sinTransicion) s.setAttribute("data-sin-transicion", "");
    s.querySelectorAll("[data-revela]").forEach((el) => el.toggleAttribute("data-oculto", Number(el.dataset.revela) > kk));
    s.querySelectorAll("[data-revela-solo]").forEach((el) => el.toggleAttribute("data-oculto", Number(el.dataset.revelaSolo) !== kk));
    s.dataset.estado = String(kk);
    if (sinTransicion) { void s.offsetWidth; s.removeAttribute("data-sin-transicion"); }
  }
  function modo(n) { const s = secs[clamp(Math.round(n) || 1, 1, total) - 1]; const m = s && s.dataset.modo; return m === "oscuro" || m === "claro" ? m : null; }
  function ir_a(n, kk) {
    n = clamp(Math.round(Number(n) || 1), 1, total);
    const s = secs[n - 1];
    kk = clamp(Math.round(Number(kk) || 1), 1, estados(s));
    if (n === cur && kk === k) return;
    const t = ++token, antes = cur, kAntes = k;
    cur = n; k = kk;
    html.dataset.lamina = s.dataset.lamina; html.dataset.estado = String(kk);
    try { history.replaceState(null, "", "#" + n + "-" + kk); } catch (e) {}
    if (n !== antes) {
      if (antes) {
        const sa = secs[antes - 1]; sa.removeAttribute("data-actual"); sa.setAttribute("data-saliente", "");
        hooks[sa.dataset.lamina]?.salir?.();
        setTimeout(() => { if (!sa.hasAttribute("data-actual")) sa.removeAttribute("data-saliente"); }, ms("--mov-progreso") + 40);
      }
      revelar(s, 0, true);
      s.removeAttribute("data-saliente"); s.setAttribute("data-actual", "");
      html.dataset.temaLamina = modo(n) || "claro";
      anuncio.textContent = (s.querySelector("h1, h2") || {}).textContent || "";
      hooks[s.dataset.lamina]?.entrar?.(kk);
      /* al entrar a una lámina, sus textos llegan cuando la idea ya aterrizó */
      const demora = antes && !reducido() ? Math.round(ms("--mov-escena") * 0.5) : 0;
      setTimeout(() => requestAnimationFrame(() => { if (t !== token) return; revelar(s, kk, false); hooks[s.dataset.lamina]?.estado?.(kk, 0); }), demora);
    } else {
      revelar(s, kk, false);
      hooks[s.dataset.lamina]?.estado?.(kk, kAntes);
    }
  }

  /* ═════════ la capa viva: colibrí + signo ═════════ */
  const NS = "http://www.w3.org/2000/svg";
  const viva = doc.getElementById("viva"), formaEl = doc.getElementById("signo-forma"), ecoEl = doc.getElementById("signo-eco");
  const haloEl = doc.getElementById("signo-halo"), mediosEl = doc.getElementById("medios");
  const cajaCol = doc.getElementById("colibri-caja"), firma = doc.getElementById("firma"), barra = doc.getElementById("barra");
  const piezas = Array.from(doc.querySelectorAll("#colibri .pz")).map((g) => {
    const st = g.style; return { g, dx: parseFloat(st.getPropertyValue("--dx")), dy: parseFloat(st.getPropertyValue("--dy")),
      rz: parseFloat(st.getPropertyValue("--rz")), o: parseFloat(st.getPropertyValue("--o")), estrella: g.classList.contains("estrella") };
  });
  const oMax = Math.max(...piezas.map((p) => p.o), 1); piezas.forEach((p) => { p.o /= oMax; });
  const ESTRELLA = [0.82, 0.241];                      // dónde está la estrella dentro de la caja del colibrí
  const BASE_COL = 400;

  const M = 180;
  const VERT = [
    Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * 6.283 - 1.5708; return [300 + Math.cos(a) * 240, 300 + Math.sin(a) * 240]; }),
    [[80, 80], [520, 80], [520, 520], [80, 520]],
    [[300, 50], [550, 505], [50, 505]],
    [[300, 36], [564, 300], [300, 564], [36, 300]],
    [[40, 215], [320, 215], [320, 85], [565, 300], [320, 515], [320, 385], [40, 385]],
  ];
  function muestrear(v) {
    const lados = v.map((a, i) => { const b = v[(i + 1) % v.length]; return [a, b, Math.hypot(b[0] - a[0], b[1] - a[1])]; });
    const per = lados.reduce((s, l) => s + l[2], 0), out = []; let li = 0, acc = 0;
    for (let i = 0; i < M; i++) { const d = (i / M) * per; while (acc + lados[li][2] < d) { acc += lados[li][2]; li++; }
      const [a, b, L] = lados[li], f = (d - acc) / L; out.push([(a[0] + (b[0] - a[0]) * f - 300) / 260, (a[1] + (b[1] - a[1]) * f - 300) / 260]); }
    let mejor = 0, dm = 1e9;
    out.forEach((q, i) => { const ang = Math.atan2(q[1], q[0]), dd = Math.abs(Math.atan2(Math.sin(ang + 1.5708), Math.cos(ang + 1.5708))); if (dd < dm) { dm = dd; mejor = i; } });
    return out.slice(mejor).concat(out.slice(0, mejor));
  }
  const FORMAS = VERT.map(muestrear);
  const camino = (pts, x, y, r, s) => "M" + pts.map((q) => (x + q[0] * r * s).toFixed(1) + " " + (y + q[1] * r * s).toFixed(1)).join("L") + "Z";
  let COL = {};
  function colores() { COL = { oro: hex(cssVar("--oro") || "#F9C333") }; for (let i = 0; i < 5; i++) COL[i] = hex(cssVar("--forma-" + (i + 1))); }

  /* poses: se calculan una vez por layout (resize, fuentes) para cada paso */
  let POSES = [];
  const caja = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); if (b.width < 2) return null; return { x: b.left, y: b.top, w: b.width, h: b.height, cx: b.left + b.width / 2, cy: b.top + b.height / 2 }; };
  function calcularPoses() {
    viva.setAttribute("viewBox", "0 0 " + innerWidth + " " + innerHeight);
    const F = caja(doc.getElementById("a-firma")) || { x: 24, y: innerHeight - 60, w: 48, h: 36, cx: 48, cy: innerHeight - 42 };
    const enFirma = { x: F.x, y: F.y, w: F.w, op: 1, armado: 1, estrella: 0 };
    let formaPrevia = 0;
    POSES = pasos.map(([n, kk]) => {
      const s = secs[n - 1], lam = s.dataset.lamina, sig = s.dataset.signo || "mini";
      const p = { col: enFirma, firma: 1, bandada: 1, giro: lista(s, "giro", kk, 0), inclina: lista(s, "inclina", kk, 6), medios: s.hasAttribute("data-medios") ? 1 : 0 };
      if (s.dataset.colibri === "heroe") {
        const b = caja(s.querySelector('[data-ancla="colibri"]')) || F;
        const estrella = lam === "cierre" ? (kk >= 2 ? 1 : 0) : 1;
        p.col = { x: b.x, y: b.y, w: b.w, op: lam === "portada" && kk < 2 ? 0 : 1, armado: lam === "portada" && kk < 2 ? 0 : 1, estrella };
        p.firma = 0;
      }
      if (lam === "portada") p.bandada = kk >= 2 ? 1 : 0;
      if (sig === "estrella") {
        const b = p.col, sx = b.x + b.w * ESTRELLA[0], sy = b.y + (b.w * 290 / 390) * ESTRELLA[1];
        const visible = lam === "portada" ? kk >= 2 : kk < 2;
        p.sig = { x: sx, y: sy, r: b.w * 0.032, f: 0, c: COL.oro, op: visible ? 1 : 0, halo: 0 };
        if (lam === "cierre") formaPrevia = 0;
      } else {
        const b = caja(s.querySelector('[data-ancla="signo"]'));
        const f = lista(s, "signoForma", kk, formaPrevia); formaPrevia = f;
        if (b) p.sig = { x: b.cx, y: b.cy, r: (b.w / 2) * (sig === "heroe" ? 0.8 : 0.92), f, c: COL[f], op: 1, halo: s.hasAttribute("data-halo") ? 1 : 0 };
        else p.sig = { x: F.cx, y: F.cy, r: 4, f, c: COL[f], op: 0, halo: 0 };
      }
      return p;
    });
  }

  let ultimoArmado = -1, ultimaEstrella = -1;
  const mundo = doc.getElementById("mundo");
  const estado = { bandada: 0 };
  function arco(a, b, t) {                              // los viajes largos van en arco, por debajo del texto
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return d > innerWidth * 0.18 ? Math.sin(Math.PI * t) * Math.min(innerHeight * 0.24, d * 0.32) : 0;
  }
  function dibujar(u) {
    if (!POSES.length) return;
    const i0 = Math.floor(clamp(u, 0, ULT)), i1 = Math.min(ULT, i0 + 1), t = clamp(u - i0, 0, 1);
    const a = POSES[i0], b = POSES[i1];
    /* colibrí */
    const cx = mix(a.col.x, b.col.x, t), cy = mix(a.col.y, b.col.y, t) + arco(a.col, b.col, t), cw = mix(a.col.w, b.col.w, t);
    cajaCol.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px) scale(" + (cw / BASE_COL).toFixed(4) + ")";
    cajaCol.style.opacity = mix(a.col.op, b.col.op, t) > 0 ? "1" : "0";
    const armado = mix(a.col.armado, b.col.armado, t), estrella = mix(a.col.estrella, b.col.estrella, t);
    if (Math.abs(armado - ultimoArmado) > 0.0005 || Math.abs(estrella - ultimaEstrella) > 0.0005) {
      ultimoArmado = armado; ultimaEstrella = estrella;
      for (const p of piezas) {
        const e = curva(clamp((armado - p.o * 0.6) / 0.4, 0, 1)), q = 1 - e;
        p.g.style.transform = q > 0.0005 ? "translate(" + (p.dx * q).toFixed(1) + "px," + (p.dy * q).toFixed(1) + "px) rotate(" + (p.rz * q).toFixed(1) + "deg)" : "";
        p.g.style.opacity = String(e * (p.estrella ? estrella : 1));
      }
    }
    firma.style.setProperty("--firma-op", String(mix(a.firma, b.firma, t)));
    /* signo */
    const sx = mix(a.sig.x, b.sig.x, t), sy = mix(a.sig.y, b.sig.y, t) + arco(a.sig, b.sig, t), sr = mix(a.sig.r, b.sig.r, t);
    const fa = FORMAS[a.sig.f], fb = FORMAS[b.sig.f], cambiaForma = a.sig.f !== b.sig.f, ft = cambiaForma ? t : 0;
    const pts = fa.map((q, j) => [mix(q[0], fb[j][0], curva(ft)), mix(q[1], fb[j][1], curva(ft))]);
    formaEl.setAttribute("d", camino(pts, sx, sy, sr, 1));
    const tc = clamp((t - 0.55) / 0.3, 0, 1);
    formaEl.style.fill = rgb([0, 1, 2].map((j) => mix(a.sig.c[j], b.sig.c[j], tc)));
    formaEl.style.opacity = String(mix(a.sig.op, b.sig.op, t));
    formaEl.style.strokeWidth = sr < 20 ? "1.5" : "3";
    if (cambiaForma && sr > 30 && ft > 0.02 && ft < 0.98) { ecoEl.setAttribute("d", camino(fa, sx, sy, sr, 1 + 0.16 * ft)); ecoEl.style.opacity = String(0.6 * (1 - ft)); }
    else ecoEl.style.opacity = "0";
    const halo = mix(a.sig.halo, b.sig.halo, t);
    haloEl.setAttribute("cx", sx.toFixed(1)); haloEl.setAttribute("cy", sy.toFixed(1)); haloEl.setAttribute("r", (sr * 1.16).toFixed(1));
    haloEl.style.opacity = String(halo);
    const cerca = cambiaForma ? 1 - 2 * Math.abs(t - Math.round(t)) : 1;
    mediosEl.setAttribute("transform", "translate(" + sx.toFixed(1) + " " + sy.toFixed(1) + ") scale(" + (sr / 260).toFixed(4) + ") translate(-300 -300)");
    mediosEl.style.opacity = String(mix(a.medios, b.medios, t) * cerca);
    /* cámara de Turing y bandada */
    if (mundo) { mundo.style.setProperty("--giro", mix(a.giro, b.giro, t).toFixed(2) + "deg"); mundo.style.setProperty("--inclina", mix(a.inclina, b.inclina, t).toFixed(2) + "deg"); }
    estado.bandada = mix(a.bandada, b.bandada, t);
    hooks.portada?.pintar?.();
    barra.style.setProperty("--avance", String((u + 1) / pasos.length));
  }

  /* ═════════ el reloj: un solo rAF que corre solo mientras algo cambia ═════════ */
  let u = 0, uScroll = 0, tween = null, puntero = 0, punteroMeta = 0, corriendo = false;
  function tick(now) {
    let sigue = false;
    if (tween) {
      const p = clamp((now - tween.t0) / tween.dur, 0, 1); u = mix(tween.desde, tween.hasta, curva(p));
      if (p < 1) sigue = true; else tween = null;
    } else if (html.dataset.vista === "recorrer") {
      const d = uScroll - u; if (Math.abs(d) > 0.0008) { u += d * (reducido() ? 1 : 0.16); sigue = true; } else u = uScroll;
      const i = Math.round(u); ir_a(pasos[i][0], pasos[i][1]);
    }
    if (Math.abs(punteroMeta - puntero) > 0.01) { puntero += (punteroMeta - puntero) * 0.12; sigue = true; mundo && mundo.style.setProperty("--puntero", puntero.toFixed(2) + "deg"); }
    dibujar(u);
    if (sigue) requestAnimationFrame(tick); else corriendo = false;
  }
  function despertar() { if (!corriendo) { corriendo = true; requestAnimationFrame(tick); } }
  function animarA(i) {
    i = clamp(i, 0, ULT);
    const desde = u, salto = Math.abs(i - desde), r0 = Math.round(desde);
    let dur = (r0 === 0 && i === 1) || (r0 === 1 && i === 0) ? 1400 : ms("--mov-escena");
    if (salto > 1.5) dur = ms("--mov-escena") * 1.2;
    if (reducido()) dur = 150;
    ir_a(pasos[i][0], pasos[i][1]);
    tween = { desde, hasta: i, t0: performance.now(), dur };
    despertar();
  }

  /* ═════════ PORTADA: el entorno se junta en el colibrí ═════════ */
  (function () {
    const lienzo = doc.getElementById("bandada"), c = lienzo.getContext("2d"), seccion = lienzo.closest("section");
    const N = 260; let W = 0, H = 0, puntos = [], vivo = false, raf = 0, mouse = null, paleta = [];
    let semilla = 7; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    function preparar() {
      const dpr = Math.min(2, devicePixelRatio || 1); W = lienzo.clientWidth; H = lienzo.clientHeight;
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!puntos.length) { semilla = 7; for (let i = 0; i < N; i++) puntos.push({ hx: azar(), hy: azar(), ph: azar() * 6.283, v: 0.6 + azar(), col: Math.floor(azar() * 6), r: 1.6 + azar() * 2.6, d: azar() * 0.3, a: azar() * 6.283, rr: Math.sqrt(azar()), ex: 0, ey: 0 }); }
      paleta = [1, 2, 3, 4, 5].map((i) => cssVar("--forma-" + i)).concat(cssVar("--tenue"));
    }
    function pintar(tiempo) {
      if (!W) return;
      const b = caja(seccion.querySelector('[data-ancla="colibri"]')); if (!b) return;
      const ccx = b.cx, ccy = b.cy, p = estado.bandada, t = tiempo || performance.now();
      c.clearRect(0, 0, W, H);
      if (p >= 0.999) return;
      for (const q of puntos) {
        let x0 = q.hx * W + Math.sin(t * 0.00035 * q.v + q.ph) * 22, y0 = q.hy * H + Math.cos(t * 0.00029 * q.v + q.ph * 1.3) * 18;
        if (mouse && p < 0.05) { const ex = x0 - mouse.x, ey = y0 - mouse.y, d2 = ex * ex + ey * ey;
          if (d2 < 22000) { const f = (1 - d2 / 22000) * 48, d = Math.sqrt(d2) || 1; q.ex += ((ex / d) * f - q.ex) * 0.12; q.ey += ((ey / d) * f - q.ey) * 0.12; } else { q.ex *= 0.92; q.ey *= 0.92; } }
        x0 += q.ex; y0 += q.ey;
        const e = curva(clamp((p - q.d) / (1 - q.d), 0, 1));
        const tx = ccx + Math.cos(q.a) * q.rr * b.w * 0.34, ty = ccy + Math.sin(q.a) * q.rr * b.h * 0.3;
        c.globalAlpha = 0.85 * (1 - e) * (1 - e * 0.3); c.fillStyle = paleta[q.col];
        c.beginPath(); c.arc(mix(x0, tx, e), mix(y0, ty, e), q.r * (1 - 0.5 * e), 0, 6.283); c.fill();
      }
      c.globalAlpha = 1;
    }
    function bucle(t) { if (!vivo) return; pintar(t); if (estado.bandada < 0.999) raf = requestAnimationFrame(bucle); else vivo = false; }
    function arrancar() { if (vivo || reducido()) { pintar(); return; } vivo = true; raf = requestAnimationFrame(bucle); }
    seccion.addEventListener("pointermove", (e) => { mouse = { x: e.clientX, y: e.clientY }; });
    seccion.addEventListener("pointerleave", () => { mouse = null; });
    hooks.portada = {
      preparar, entrar() { preparar(); arrancar(); }, estado() { arrancar(); },
      pintar() { if (!vivo && secs[cur - 1] === seccion) { if (estado.bandada < 0.999) arrancar(); else pintar(); } },
      salir() { vivo = false; cancelAnimationFrame(raf); c.clearRect(0, 0, W, H); },
    };
  })();

  /* ═════════ PREGUNTA ÁGIL: la sala responde (nada se guarda ni se envía) ═════════ */
  (function () {
    const form = doc.querySelector(".respuestas"); if (!form) return;
    const input = form.querySelector("input"), nube = doc.getElementById("nube");
    form.addEventListener("submit", (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) return;
      const s = doc.createElement("span"); s.textContent = v; nube.appendChild(s); input.value = ""; if (nube.children.length > 14) nube.firstChild.remove(); });
    input.addEventListener("keydown", (e) => e.stopPropagation());        // escribir no avanza la presentación
    hooks["pregunta-agil"] = { estado(kk) { if (kk === 2 && html.dataset.vista === "presentar" && !html.classList.contains("en-atril")) setTimeout(() => input.focus({ preventScroll: true }), 300); } };
  })();

  /* ═════════ LA IDEA COMO VIRUS: una red que se contagia desde un nodo ═════════ */
  (function () {
    const red = doc.getElementById("red-virus"); if (!red) return;
    let semilla = 23; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    const nodos = []; for (let i = 0; i < 34; i++) nodos.push({ x: 30 + azar() * 540, y: 30 + azar() * 420, v: [] });
    const lados = [];
    nodos.forEach((a, i) => { const cerca = nodos.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 3);
      cerca.forEach(([j]) => { if (!lados.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) { lados.push([i, j]); a.v.push(j); nodos[j].v.push(i); } }); });
    const dist = nodos.map(() => Infinity); dist[0] = 0; const cola = [0];
    while (cola.length) { const i = cola.shift(); nodos[i].v.forEach((j) => { if (dist[j] === Infinity) { dist[j] = dist[i] + 1; cola.push(j); } }); }
    lados.forEach(([i, j]) => { const l = doc.createElementNS(NS, "line"); l.setAttribute("x1", nodos[i].x); l.setAttribute("y1", nodos[i].y); l.setAttribute("x2", nodos[j].x); l.setAttribute("y2", nodos[j].y);
      l.style.setProperty("--d", String(Math.min(dist[i], dist[j]) * 160 + 80)); red.appendChild(l); });
    nodos.forEach((n, i) => { const c = doc.createElementNS(NS, "circle"); c.setAttribute("cx", n.x); c.setAttribute("cy", n.y); c.setAttribute("r", i === 0 ? 11 : 7);
      if (i === 0) c.classList.add("paciente0"); c.style.setProperty("--d", String((dist[i] === Infinity ? 6 : dist[i]) * 160)); red.appendChild(c); });
  })();

  /* ═════════ ONCE DEFINICIONES: las cinco claves llevan su número ═════════ */
  doc.querySelectorAll(".fichas .clave").forEach((el) => { el.dataset.n = String(Array.from(el.parentNode.children).indexOf(el) + 1); });

  /* ═════════ LAS CINCO FORMAS: textos y medios ═════════ */
  (function () {
    const TEXTOS = [
      { nombre: "La idea como paradigma", def: "Primero y más obvio de los actos del entendimiento, que se limita al simple conocimiento de algo.", util: "paradigmas", medioN: "las historias", medio: "Las historias son útiles para comunicarlas." },
      { nombre: "La idea como concepto", def: "Plan y disposición que se ordena en la imaginación para la formación de una obra.", util: "conceptos", medioN: "el arte", medio: "El arte es útil para visualizar y comunicar los conceptos." },
      { nombre: "La idea como intención", def: "Intención de hacer algo.", util: "propuestas de valor", medioN: "experimentar", medio: "Experimentar ayuda a descubrir motivaciones que permiten comunicar las propuestas de valor efectivamente." },
      { nombre: "La idea como solución", def: "Ingenio para disponer, inventar y trazar una cosa.", util: "soluciones", medioN: "describir", medio: "Describir cómo un producto o servicio funciona para lograr un objetivo del usuario facilita su comunicación." },
      { nombre: "La idea como progreso", def: "Convicciones, creencias y opiniones.", util: "progreso", medioN: "la empatía", medio: "Generar empatía al describir cómo una solución puede cambiar la vida del usuario, y cómo se alinea con sus valores, facilita su comunicación." },
    ];
    const el = (id) => doc.getElementById(id), seccion = secs.find((s) => s.dataset.lamina === "formas"), cambia = el("forma-cambia");
    const medios = Array.from(mediosEl.querySelectorAll(".medio"));
    let swap = 0;
    function pintar(i) {
      const x = TEXTOS[i];
      seccion.style.setProperty("--color-forma", "var(--forma-" + (i + 1) + ")");
      el("forma-nombre").textContent = x.nombre; el("forma-def").textContent = x.def; el("forma-util").textContent = x.util;
      el("forma-medio-nombre").textContent = x.medioN; el("forma-medio").textContent = x.medio;
      el("forma-cuenta").textContent = (i + 1) + " de 5"; el("signo-numero").textContent = (i + 1) + " / 5";
      seccion.querySelectorAll(".formas-nav span").forEach((s) => { const n = Number(s.dataset.f) - 1; s.classList.toggle("activa", n === i); s.classList.toggle("hecha", n < i); });
    }
    function medio(i) { medios.forEach((m, j) => { if (j === i) { if (!m.classList.contains("on")) { void m.getBoundingClientRect(); m.classList.add("on"); } } else m.classList.remove("on"); }); }
    async function textos(i) {
      const t = ++swap;
      if (reducido()) { pintar(i); return; }
      cambia.classList.add("saliendo"); await espera(ms("--mov-normal") + 40); if (t !== swap) return;
      pintar(i); cambia.classList.remove("saliendo"); cambia.classList.add("entrando"); void cambia.offsetWidth; cambia.classList.remove("entrando");
    }
    hooks.formas = { entrar(kk) { pintar(kk - 1); medio(-1); }, estado(kk, antes) { medio(kk - 1); if (antes) textos(kk - 1); }, salir() { medio(-1); } };
  })();

  /* ═════════ MATRIZ: el enfoque de ideación tal como está en el original ═════════
     Columnas = las cinco capas; filas = los cuatro momentos; a los lados, cómo se gestiona el recorrido. */
  (function () {
    const COLS = [
      { k: "inspiracion", t: "Inspiración", s: "para crear idea innovadora" },
      { k: "accion", t: "Acción", s: "para crear idea innovadora" },
      { k: "expresion", t: "Expresión", s: "de la idea innovadora" },
      { k: "enfoque", t: "Enfoque de ideación", s: "para innovar" },
      { k: "evaluacion", t: "Evaluación", s: "de la idea innovadora", v: "Validación de idea" },
    ];
    const FILAS = [
      ["Cuestionamos paradigmas para encontrar dónde suplir o crear valor.",
       ["Imaginar nuevas realidades", "Es el momento del arte."],
       ["Concepto", "Describir el concepto de alguna manera."],
       "Establecer un concepto diferente que represente una creencia, convicción u opinión que cuestione un paradigma.",
       "¿Puede una persona entender fácilmente el concepto?"],
      ["Aprendemos de otras soluciones para identificar oportunidades de diferenciación.",
       ["Experimentar con el concepto", "Es el momento de la ciencia."],
       ["Motivo", "Establecer un reto que me asuste, pero que al mismo tiempo me anime a superarlo."],
       "Proponer alternativas que tengan la intención de representar el concepto y le den propósito y sentido. <i>(Establezco un propósito)</i>",
       "¿Es claro el propósito de mi idea? ¿Qué personas comparten ese propósito? ¿Quiénes están dispuestos a perseguirlo?"],
      ["Describimos hábitos y comportamientos para identificar expectativas y necesidades.",
       ["Construir una solución", "Es el momento de la ingeniería."],
       ["Solución", "Proponer una solución radicalmente mejor y altamente diferenciada de las ya existentes."],
       "Enunciar una propuesta de valor que atraiga la atención hacia mi solución. <i>(Establezco una propuesta de valor)</i>",
       "¿Por qué razón les gusta la solución? ¿Por qué no les gusta? ¿Se identifica fácilmente el diferencial frente a otras soluciones?"],
      ["Observamos la interacción que hay con nuestra solución para realizar ajustes.",
       ["Monitorear comportamientos", "Es el momento del diseño."],
       ["Progreso", "Generar entusiasmo en las personas por la utilidad de la solución, al punto de que hablen de la idea sin que se les pida."],
       "Diseñar un plan que me permita entender la utilidad percibida de mi solución por parte del usuario. <i>(Diseño un mínimo producto de aprendizaje)</i>",
       "¿Cuántos beneficiarios potenciales tiene mi idea? ¿Quiénes son? ¿En qué contexto? ¿Qué están dispuestos a dar?"],
    ];
    const celda = (c) => Array.isArray(c) ? `<b>${c[0]}</b><span>${c[1]}</span>` : c;
    doc.querySelectorAll(".matriz-marco").forEach((marco) => {
      const val = marco.dataset.matriz === "validacion";
      let h = '<p class="eje eje-arriba">Describo el contexto</p>';
      h += '<p class="eje eje-izq e1">Identifico oportunidad</p><p class="eje eje-izq e2">Gestiono el proyecto de innovación</p>';
      h += '<p class="eje eje-der e1">Valido oportunidad</p><p class="eje eje-der e2">Gestiono el cambio</p>';
      h += '<div class="matriz" role="table" aria-label="Enfoque de ideación para innovar">';
      h += '<div class="m-fila m-cabeza" role="row">' + COLS.map((c, i) => `<p role="columnheader" class="m-col c${i + 1}" data-col="${i + 1}"><b>${val && c.v ? c.v : c.t}</b>${val && c.v ? "" : `<span>${c.s}</span>`}</p>`).join("") + "</div>";
      FILAS.forEach((f, r) => { h += `<div class="m-fila" role="row">` + f.map((c, i) => `<p role="cell" class="m-celda c${i + 1}" data-col="${i + 1}">${celda(c)}</p>`).join("") + "</div>"; });
      h += '</div><p class="eje eje-abajo">Influyo en el contexto</p>';
      marco.innerHTML = h;
    });
    function pintar(s, kk) {
      const val = s.dataset.lamina === "matriz-validacion";
      const marco = s.querySelector(".matriz-marco"), cuenta = s.querySelector(".capa-cuenta");
      if (val) {                                          // después del caso: todo visible y la validación al frente
        marco.querySelectorAll("[data-col]").forEach((el) => { el.classList.remove("oculta"); el.classList.toggle("tenue", kk >= 2 && el.dataset.col !== "5"); el.classList.toggle("nueva", kk >= 2 && el.dataset.col === "5"); });
        marco.classList.add("con-ejes");
        cuenta.textContent = kk >= 2 ? "La evaluación ahora es validación" : "El recorrido completo";
        return;
      }
      marco.querySelectorAll("[data-col]").forEach((el) => { const c = Number(el.dataset.col); el.classList.toggle("oculta", c > kk); el.classList.toggle("nueva", c === Math.min(kk, 5)); el.classList.remove("tenue"); });
      marco.classList.toggle("con-ejes", kk >= 6);
      cuenta.textContent = kk <= 5 ? "Capa " + kk + " de 5" : "Cómo se gestiona";
    }
    ["matriz", "matriz-validacion"].forEach((lam) => {
      const s = secs.find((x) => x.dataset.lamina === lam); if (!s) return;
      hooks[lam] = { entrar(kk) { pintar(s, kk); }, estado(kk) { pintar(s, kk); } };
    });
  })();

  /* ═════════ TURING ═════════ */
  (function () {
    if (!mundo) return;
    const seccion = mundo.closest("section");
    let semilla = 11; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    const capaLetras = doc.getElementById("capa-letras"), ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < 64; i++) { const s = doc.createElement("span"); s.textContent = ABC[Math.floor(azar() * 26)] + ABC[Math.floor(azar() * 26)] + ABC[Math.floor(azar() * 26)]; capaLetras.appendChild(s); }
    const letras = Array.from(capaLetras.children), teclas = doc.getElementById("m-teclas");
    [9, 8, 9].forEach((cuantas, f) => { for (let i = 0; i < cuantas; i++) { const r = doc.createElementNS(NS, "rect");
      r.setAttribute("x", 200 - (cuantas * 34) / 2 + i * 34 + 6); r.setAttribute("y", 172 + f * 32); r.setAttribute("width", 22); r.setAttribute("height", 20); r.setAttribute("rx", 4); teclas.appendChild(r); } });
    const lamparas = Array.from(teclas.children), comb = doc.getElementById("combinaciones"), nodos = [];
    for (let i = 0; i < 22; i++) nodos.push([20 + azar() * 360, 20 + azar() * 260]);
    for (let i = 0; i < 44; i++) { const a = nodos[Math.floor(azar() * 22)], b = nodos[Math.floor(azar() * 22)], l = doc.createElementNS(NS, "line");
      l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]); l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]); comb.appendChild(l); }
    nodos.forEach((n) => { const c = doc.createElementNS(NS, "circle"); c.setAttribute("cx", n[0]); c.setAttribute("cy", n[1]); c.setAttribute("r", 3); comb.appendChild(c); });
    let reloj = 0, lectura = 0;
    function parar() { clearInterval(reloj); reloj = 0; clearInterval(lectura); lectura = 0; lamparas.forEach((r) => r.classList.remove("on")); }
    function leer() {
      letras.forEach((s) => s.classList.remove("lee")); if (reducido()) { letras.forEach((s) => s.classList.add("lee")); return; }
      let i = 0; lectura = setInterval(() => { if (i >= letras.length) { clearInterval(lectura); lectura = 0; return; } letras[i++].classList.add("lee"); }, 36);
    }
    function combinar() {
      if (reducido()) { lamparas.forEach((r, i) => r.classList.toggle("on", i % 5 === 0)); return; }
      reloj = setInterval(() => { lamparas.forEach((r) => r.classList.remove("on")); lamparas[Math.floor(Math.random() * lamparas.length)].classList.add("on"); }, 240);
    }
    seccion.addEventListener("pointermove", (e) => { if (reducido() || html.classList.contains("en-atril")) return; punteroMeta = ((e.clientX / innerWidth) - 0.5) * 8; despertar(); });
    seccion.addEventListener("pointerleave", () => { punteroMeta = 0; despertar(); });
    hooks.turing = {
      entrar() { parar(); },
      estado(kk) { parar(); if (kk === 2) leer(); if (kk === 3) combinar(); if (kk === 4) letras.forEach((s) => s.classList.add("lee")); },
      salir() { parar(); punteroMeta = 0; },
    };
  })();

  /* ═════════ SALA DE CINE: escenas de YouTube embebidas, con regreso a la misma lámina ═════════ */
  const cine = doc.getElementById("cine"), marco = doc.getElementById("cine-marco");
  let cineConPantalla = false, cineVolverA = null;
  function abrirCine(a) {
    const id = a.dataset.video, ini = Number(a.dataset.inicio) || 0, propia = a.dataset.escena;
    cineVolverA = a;
    doc.getElementById("cine-titulo").textContent = a.dataset.titulo || a.textContent.trim();
    doc.getElementById("cine-yt").href = a.href;
    const f = doc.createElement("iframe");
    f.title = a.dataset.titulo || "Escena";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
    f.src = propia ? propia : "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&playsinline=1&start=" + ini + (a.dataset.fin ? "&end=" + a.dataset.fin : "");
    doc.getElementById("cine-yt").hidden = !!propia;              // la escena propia no depende de YouTube
    marco.replaceChildren(f);
    cine.showModal();
    cineConPantalla = false;
    if (!html.classList.contains("en-atril") && cine.requestFullscreen) {
      cine.requestFullscreen().then(() => { cineConPantalla = true; }).catch(() => {});
    }
  }
  function cerrarCine() {
    if (!cine.open) return;
    marco.replaceChildren();                              // detiene el video
    const salir = cineConPantalla && doc.fullscreenElement === cine;
    cineConPantalla = false;
    cine.close();
    if (salir) doc.exitFullscreen().catch(() => {});      // vuelve a la presentación (y a su pantalla completa si la tenía)
    cineVolverA && cineVolverA.focus({ preventScroll: true });
  }
  doc.querySelectorAll("a[data-video], a[data-escena]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // abrir en pestaña nueva sigue funcionando
    e.preventDefault(); e.stopPropagation(); abrirCine(a);
  }));
  doc.getElementById("cine-volver").addEventListener("click", cerrarCine);
  cine.addEventListener("cancel", (e) => { e.preventDefault(); cerrarCine(); });
  doc.addEventListener("fullscreenchange", () => { if (cine.open && cineConPantalla && doc.fullscreenElement !== cine) { cineConPantalla = false; cerrarCine(); } });

  /* ═════════ vistas ═════════ */
  const pista = doc.getElementById("pista");
  pasos.forEach(() => pista.appendChild(doc.createElement("div")));
  const alto = () => innerHeight;
  addEventListener("scroll", () => { if (html.dataset.vista !== "recorrer") return; uScroll = clamp(scrollY / alto(), 0, ULT); tween = null; despertar(); }, { passive: true });
  function indice() { return Math.max(0, pasos.findIndex((p) => p[0] === cur && p[1] === k)); }
  function irAPaso(i) {
    i = clamp(i, 0, ULT);
    if (html.dataset.vista === "recorrer") scrollTo({ top: i * alto(), behavior: reducido() ? "auto" : "smooth" });
    else animarA(i);
  }
  function vista(v) {
    html.dataset.vista = v;
    const b = doc.getElementById("btn-vista"); b.textContent = v === "presentar" ? "Recorrer" : "Presentar"; b.setAttribute("aria-pressed", String(v === "presentar"));
    if (v === "recorrer") { const i = indice(); scrollTo({ top: i * alto() }); uScroll = i; u = i; tween = null; despertar(); }
  }
  doc.getElementById("btn-vista").addEventListener("click", () => vista(html.dataset.vista === "presentar" ? "recorrer" : "presentar"));
  addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (cine.open) return;                                   // con la escena abierta, el teclado es del video
    if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
    const pres = html.dataset.vista === "presentar";
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key) || (pres && e.key === "ArrowDown")) { e.preventDefault(); irAPaso(indice() + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key) || (pres && e.key === "ArrowUp")) { e.preventDefault(); irAPaso(indice() - 1); }
    else if (e.key === "Home") { e.preventDefault(); irAPaso(0); }
    else if (e.key === "End") { e.preventDefault(); irAPaso(ULT); }
    else if (e.key === "f" || e.key === "F") { if (!doc.fullscreenElement) { vista("presentar"); html.requestFullscreen?.().catch(() => {}); } else doc.exitFullscreen?.(); }
    else if (e.key === "p" || e.key === "P") vista(pres ? "recorrer" : "presentar");
    else if (e.key === "Escape" && pres && !doc.fullscreenElement) vista("recorrer");
  });
  doc.getElementById("escenario").addEventListener("click", (e) => {
    if (html.dataset.vista !== "presentar" || e.target.closest("a, button, input, form")) return;
    irAPaso(indice() + (e.clientX < innerWidth * 0.25 ? -1 : 1));
  });
  let cuadroResize = 0;
  addEventListener("resize", () => { cancelAnimationFrame(cuadroResize); cuadroResize = requestAnimationFrame(() => {
    calcularPoses(); hooks.portada.preparar(); if (html.dataset.vista === "recorrer") { uScroll = clamp(scrollY / alto(), 0, ULT); u = uScroll; } ultimoArmado = -1; dibujar(u); }); });

  /* ── contrato atril-escena/v1 ── */
  const aPaso = (n, kk) => Math.max(0, pasos.findIndex((p) => p[0] === clamp(Math.round(n), 1, total) && p[1] === Math.round(kk)));
  window.escena = {
    total,
    ir(n) { if (html.dataset.vista !== "presentar") vista("presentar"); animarA(aPaso(n, 1)); },
    paso(n, kk) { if (html.dataset.vista !== "presentar") vista("presentar"); const s = secs[clamp(Math.round(n), 1, total) - 1]; animarA(aPaso(n, clamp(kk, 1, estados(s)))); },
    actual() { return cur; },
    modo,
    configurar(c) {
      ctx = c || null; html.dataset.movimiento = reducido() ? "reducido" : "normal";
      if (c && c.reserva) { html.style.setProperty("--atril-reserva-arriba", (c.reserva.arriba || 0) + "px"); html.style.setProperty("--atril-reserva-abajo", (c.reserva.abajo || 0) + "px"); }
      if (html.classList.contains("en-atril")) vista("presentar");
      requestAnimationFrame(() => { calcularPoses(); dibujar(u); });
    },
    presentacion: { id: "oportunidad-innovacion", revision: "1.0", laminas: secs.map((s) => s.dataset.lamina) },
  };

  /* ── arranque ── */
  html.dataset.movimiento = reducido() ? "reducido" : "normal";
  colores(); calcularPoses();
  const q = new URLSearchParams(location.search), m = /^#(\d+)-(\d+)$/.exec(location.hash);
  const i0 = m ? aPaso(Number(m[1]), Number(m[2])) : 0;
  if (q.get("vista") === "presentar" || html.classList.contains("en-atril")) vista("presentar");
  u = i0; uScroll = i0;
  ir_a(pasos[i0][0], pasos[i0][1]);
  if (html.dataset.vista === "recorrer") scrollTo({ top: i0 * alto() });
  dibujar(u);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { calcularPoses(); dibujar(u); });
})();

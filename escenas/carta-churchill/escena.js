/* La carta a Churchill · escena animada.
   Todo se dibuja en función del segundo t (cuadro(t)): se puede pausar, adelantar y grabar cuadro a cuadro.
   Contrato atril-video/v1: window.escena = { listo, duracion, cuadro(t), sonido(), validar() }.
   Textos propios (paráfrasis), basados en el memorando del 21-10-1941; no reproduce la película. */
"use strict";
(function () {
  const doc = document, html = doc.documentElement;
  if (new URLSearchParams(location.search).has("incrustada")) html.classList.add("incrustada");
  const D = 38, NS = "http://www.w3.org/2000/svg";
  const $ = (id) => doc.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; } return sy(clamp(t, 0, 1)); };
  }
  const ease = bezier(0.2, 0, 0, 1);
  const tramo = (t, a, b) => ease(lin(t, a, b));
  const ventana = (t, a, b, f = 0.6) => Math.min(tramo(t, a - f / 2, a + f / 2), 1 - tramo(t, b - f / 2, b + f / 2));   // visible entre a y b, con fundidos
  let semilla = 41; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

  /* ── construcción del dibujo ── */
  const est = $("estrellas"); for (let i = 0; i < 70; i++) { const c = doc.createElementNS(NS, "circle"); c.setAttribute("cx", (azar() * 1600).toFixed(0)); c.setAttribute("cy", (azar() * 460).toFixed(0)); c.setAttribute("r", (0.6 + azar() * 1.6).toFixed(1)); c.dataset.f = azar().toFixed(3); est.appendChild(c); }
  const pila = $("pila"); const mensajes = [];
  for (let i = 0; i < 36; i++) { const r = doc.createElementNS(NS, "rect"); const x = 1220 + (i % 3) * 18 + azar() * 10, y = 628 - Math.floor(i / 3) * 9;
    r.setAttribute("x", x.toFixed(0)); r.setAttribute("y", y.toFixed(0)); r.setAttribute("width", "130"); r.setAttribute("height", "8"); r.setAttribute("rx", "2"); r.setAttribute("class", "mensaje");
    r.setAttribute("transform", `rotate(${(azar() * 8 - 4).toFixed(1)} ${x + 65} ${y + 4})`); pila.appendChild(r); mensajes.push(r); }
  const teclas = $("teclas"), filasT = [12, 11, 10], listaT = [];
  filasT.forEach((n, f) => { for (let i = 0; i < n; i++) { const c = doc.createElementNS(NS, "circle"); c.setAttribute("cx", 800 - (n * 52) / 2 + i * 52 + 26 + f * 10); c.setAttribute("cy", 676 + f * 28); c.setAttribute("r", "12"); c.setAttribute("class", "tecla"); teclas.appendChild(c); listaT.push(c); } });
  const ret = doc.querySelector("#viaje .reticula"); for (let x = 0; x <= 1600; x += 80) ret.insertAdjacentHTML("beforeend", `<path d="M${x} 0V900"/>`); for (let y = 0; y <= 900; y += 80) ret.insertAdjacentHTML("beforeend", `<path d="M0 ${y}H1600"/>`);
  const bombes = $("bombes"), listaB = [];
  for (let i = 0; i < 5; i++) { const g = doc.createElementNS(NS, "g"); const x = 160 + i * 270;
    g.innerHTML = `<rect class="bombe" x="${x}" y="420" width="220" height="300" rx="10"/>` + [0, 1, 2].map((r) => [0, 1, 2].map((c) => `<g><circle class="tambor" cx="${x + 50 + c * 60}" cy="${490 + r * 80}" r="24"/><path class="tambor-raya" d="M${x + 50 + c * 60} ${466 + r * 80}v14"/></g>`).join("")).join("");
    bombes.appendChild(g); listaB.push(g); }

  const CARTA = ["Le escribimos por iniciativa propia.", "Nuestro trabajo se está frenando", "por falta de personas y de máquinas.", "Creemos que es nuestro deber", "hacérselo saber directamente."];
  const MINUTA = ["Que tengan todo lo que necesitan,", "con máxima prioridad, y que me", "informen cuando esté hecho."];
  const SUBS = [
    [0.4, 5.6, "Bletchley Park, otoño de 1941. Aquí se intenta leer <em>Enigma</em>."],
    [5.6, 12, "Faltan manos y faltan máquinas. Hay mensajes que se quedan sin leer."],
    [12, 21, "Cuatro de ellos deciden saltarse la cadena de mando y escribirle al Primer Ministro."],
    [21, 25.6, "Firman Turing, Welchman, Alexander y Milner-Barry. Sí: también <em>Hugh Alexander</em>."],
    [25.6, 30.2, "Milner-Barry la lleva en persona hasta el número 10 de Downing Street."],
    [30.2, 34.6, "Churchill responde: <em>«Action this day»</em>. Que tengan todo lo que necesitan."],
    [34.6, 38.2, "La intención conectó con el objetivo de quien podía decidir: <em>ganar la guerra</em>."],
  ];
  const escenas = { exterior: [0, 5.6], interior: [5.6, 12], escritura: [12, 25.6], viaje: [25.6, 30.2], respuesta: [30.2, 34.6], llegan: [34.6, 39] };
  const sub = $("subtitulo"); let subActual = -1;
  const lineas = [1, 2, 3, 4, 5].map((i) => $("l" + i)), mLineas = [1, 2, 3].map((i) => $("m" + i));
  const firmas = Array.from(doc.querySelectorAll(".firma")), ruta = $("ruta"), largoRuta = ruta.getTotalLength();

  function escribir(el, texto, p) { const n = Math.round(texto.length * clamp(p, 0, 1)); el.textContent = texto.slice(0, n); return n; }

  function cuadro(t) {
    t = clamp(Number(t) || 0, 0, D);
    $("cortina").setAttribute("opacity", (1 - tramo(t, 0, 1.2) + tramo(t, D - 0.8, D)).toFixed(3));
    for (const [id, [a, b]] of Object.entries(escenas)) $(id).setAttribute("opacity", ventana(t, a, b).toFixed(3));
    /* I · exterior: la ventana encendida respira apenas */
    est.querySelectorAll("circle").forEach((c) => c.setAttribute("opacity", (0.35 + 0.55 * Math.abs(Math.sin(t * 0.8 + Number(c.dataset.f) * 9))).toFixed(2)));
    $("halo-ventana").setAttribute("opacity", (0.6 + 0.4 * Math.sin(t * 1.4)).toFixed(2));
    $("exterior").setAttribute("transform", `translate(0 ${(-30 * tramo(t, 0, 5.6)).toFixed(1)}) scale(${(1 + 0.06 * tramo(t, 0, 5.6)).toFixed(4)})`);
    /* II · los mensajes se acumulan */
    const pp = tramo(t, 6, 11.4); mensajes.forEach((m, i) => m.setAttribute("opacity", i / mensajes.length < pp ? "1" : "0"));
    $("cono").setAttribute("opacity", (0.75 + 0.25 * Math.sin(t * 3.1) * Math.sin(t * 1.7)).toFixed(2));
    /* III · la carta se escribe */
    const tiempos = [[12.6, 14.4], [14.5, 16], [16.1, 17.8], [17.9, 19.3], [19.4, 20.8]];
    let tecleando = -1;
    lineas.forEach((el, i) => { const [a, b] = tiempos[i]; const p = lin(t, a, b); const n = escribir(el, CARTA[i], p); if (p > 0 && p < 1) tecleando = n; });
    escribir($("fecha"), "Bletchley Park, 21 de octubre de 1941", lin(t, 20.9, 21.6));
    const linea = tiempos.findIndex(([a, b]) => t < b); const avance = linea < 0 ? 5 : linea;
    $("hoja").setAttribute("transform", `translate(0 ${(-avance * 10 - 60 * tramo(t, 21, 22.4)).toFixed(1)})`);
    listaT.forEach((k, i) => k.classList.toggle("on", tecleando >= 0 && (tecleando * 7 + i * 3) % listaT.length === i));
    $("maquina-escribir").setAttribute("opacity", (1 - tramo(t, 21, 22.2)).toFixed(3));
    firmas.forEach((f, i) => f.setAttribute("opacity", tramo(t, 21.8 + i * 0.6, 22.4 + i * 0.6).toFixed(3)));
    const pa = tramo(t, 24.2, 25); $("aro-alexander").setAttribute("rx", (150 * pa).toFixed(1)); $("aro-alexander").setAttribute("ry", (36 * pa).toFixed(1));
    $("aro-alexander").setAttribute("opacity", (1 - tramo(t, 25.2, 25.6) * 0.4).toFixed(2));
    /* IV · el viaje */
    const pv = tramo(t, 26.2, 29.4); const pt = ruta.getPointAtLength(largoRuta * pv);
    $("sobre").setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(-8 + 16 * pv).toFixed(1)})`);
    ruta.setAttribute("stroke-dashoffset", (-40 * t).toFixed(1));
    /* V · la respuesta */
    const pd = tramo(t, 30.4, 31.6);
    $("puerta").setAttribute("opacity", (1 - tramo(t, 31.4, 32)).toFixed(3));
    $("puerta").setAttribute("transform", `translate(800 430) scale(${(1 + 0.8 * pd).toFixed(3)}) translate(-800 -430)`);
    $("minuta").setAttribute("opacity", tramo(t, 31.5, 32.1).toFixed(3));
    mLineas.forEach((el, i) => escribir(el, MINUTA[i], lin(t, 32 + i * 0.6, 32.6 + i * 0.6)));
    const pe = lin(t, 33.6, 34); const golpe = pe < 1 ? 1.8 - 0.8 * ease(pe) : 1;
    $("etiqueta").setAttribute("transform", `translate(800 560) rotate(-6) scale(${golpe.toFixed(3)})`);
    $("etiqueta").setAttribute("opacity", (pe > 0 ? 1 : 0).toFixed(0));
    /* VI · llegan las máquinas */
    listaB.forEach((g, i) => { const p = tramo(t, 35 + i * 0.35, 35.6 + i * 0.35); g.setAttribute("opacity", p.toFixed(3)); g.setAttribute("transform", `translate(0 ${(40 * (1 - p)).toFixed(1)})`);
      g.querySelectorAll(".tambor-raya").forEach((r, j) => { const c = r.previousElementSibling; r.setAttribute("transform", `rotate(${(t * 140 * (j % 2 ? -1 : 1)).toFixed(1)} ${c.getAttribute("cx")} ${c.getAttribute("cy")})`); }); });
    const ps = tramo(t, 36.4, 37.2);
    $("signo-triangulo").setAttribute("opacity", ps.toFixed(3));
    $("signo-triangulo").setAttribute("transform", `translate(800 225) scale(${(0.6 + 0.4 * ps).toFixed(3)}) translate(-800 -225)`);
    /* subtítulos */
    const i = SUBS.findIndex(([a, b]) => t >= a && t < b);
    if (i !== subActual) { subActual = i; sub.innerHTML = i >= 0 ? SUBS[i][2] : ""; }
    sub.style.opacity = i >= 0 ? String(ventana(t, SUBS[i][0], SUBS[i][1], 0.5)) : "0";
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
  addEventListener("message", (e) => { if (e.data === "reproducir") reproducir(); if (e.data === "pausar") pausar(); });

  /* con movimiento reducido: no arranca sola; se avanza con la barra */
  pintar();
  const q = new URLSearchParams(location.search);
  if (q.has("t")) { t = Number(q.get("t")) || 0; pintar(); }
  else if (q.has("auto") && !reducido()) reproducir();

  window.escena = {
    listo: true, duracion: D, cuadro(s) { t = clamp(s, 0, D); pintar(); },
    sonido() { return []; },
    validar() { return { ok: true, notas: ["ilustración y texto propios", "subtítulos en pantalla", "sin red"] }; },
  };
})();

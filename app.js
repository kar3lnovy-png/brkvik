/* ==========================================================
   Brkvík — jednoduchá klientská "registrace a přihlášení"
   Data se ukládají do localStorage prohlížeče (bez backendu).
   Přihlášení funguje jako vyhledání registrace podle e-mailu,
   žádné heslo se nikde neukládá.
   ========================================================== */

const STORAGE_KEY = "brkvik_registrations";

/* ---------- Generovaná grafika brka v hero sekci ---------- */

function buildFeather() {
  const svg = document.getElementById("feather-hero");
  if (!svg) return;

  const ns = "http://www.w3.org/2000/svg";
  const cx = 400;      // střed shaftu (osa pera)
  const top = 60;
  const bottom = 860;
  const barbCount = 34;

  // Zakřivený shaft (dřík brka)
  const shaft = document.createElementNS(ns, "path");
  shaft.setAttribute(
    "d",
    `M ${cx} ${top} C ${cx + 30} ${top + 260}, ${cx - 20} ${bottom - 260}, ${cx} ${bottom}`
  );
  shaft.setAttribute("fill", "none");
  shaft.setAttribute("stroke", "var(--amber)");
  shaft.setAttribute("stroke-width", "2.5");
  shaft.setAttribute("opacity", "0.7");
  svg.appendChild(shaft);

  // Barbs (vousky) po obou stranách, jemně animované
  for (let i = 0; i < barbCount; i++) {
    const t = i / (barbCount - 1);
    const y = top + t * (bottom - top);

    // pozice na zakřivené ose shaftu (aproximace kubické křivky)
    const curveX = cx + Math.sin(t * Math.PI) * (t < 0.5 ? 20 : -14);

    // délka vousků: kratší na koncích, delší uprostřed (tvar pera)
    const spread = Math.sin(t * Math.PI);
    const len = 40 + spread * 170;

    // úhel vousků, mírně dozadu jako u skutečného pera
    const angle = 28 + t * 34;

    [1, -1].forEach((side) => {
      const rad = (angle * Math.PI) / 180;
      const x2 = curveX + side * Math.cos(rad) * len;
      const y2 = y - Math.sin(rad) * len * 0.35;

      const barb = document.createElementNS(ns, "line");
      barb.setAttribute("x1", curveX);
      barb.setAttribute("y1", y);
      barb.setAttribute("x2", x2);
      barb.setAttribute("y2", y2);
      barb.setAttribute("stroke", side === 1 ? "var(--cream)" : "var(--ember)");
      barb.setAttribute("stroke-width", "1");
      barb.setAttribute("opacity", 0.15 + spread * 0.35);
      barb.style.transformOrigin = `${curveX}px ${y}px`;
      barb.style.animation = `barb-sway ${4 + (i % 5)}s ease-in-out infinite`;
      barb.style.animationDelay = `${(i % 7) * 0.3}s`;
      svg.appendChild(barb);
    });
  }

  // keyframes pro jemné pohupování vousků ve "větru"
  const style = document.createElement("style");
  style.textContent = `
    @keyframes barb-sway {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(1.2deg); }
    }
  `;
  document.head.appendChild(style);
}

/* ---------- Úložiště ---------- */

function loadRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRegistrations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/* ---------- Přepínání záložek ---------- */

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const target = btn.dataset.tab;
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));

      document.getElementById("registration-result").hidden = true;
    });
  });
}

/* ---------- Registrace ---------- */

function initRegisterForm() {
  const form = document.getElementById("register-form");
  const msg = document.getElementById("register-msg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.className = "form-msg";

    const jmeno = form.jmeno.value.trim();
    const email = normalizeEmail(form.email.value);
    const oddil = form.oddil.value.trim();
    const tricko = form.tricko.value;
    const poznamka = form.poznamka.value.trim();

    if (!jmeno || !email) {
      msg.textContent = "Vyplň prosím jméno a e-mail.";
      msg.classList.add("is-error");
      return;
    }

    const registrations = loadRegistrations();

    if (registrations.some((r) => r.email === email)) {
      msg.textContent = "Tenhle e-mail už je zaregistrovaný. Zkus záložku „Najít svou registraci“.";
      msg.classList.add("is-error");
      return;
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      jmeno,
      email,
      oddil,
      tricko,
      poznamka,
      createdAt: new Date().toISOString(),
    };

    registrations.push(entry);
    saveRegistrations(registrations);

    msg.textContent = "Registrace uložena. Díky, těšíme se na tebe!";
    msg.classList.add("is-success");
    form.reset();

    showResult(entry);
  });
}

/* ---------- Vyhledání registrace ("přihlášení") ---------- */

function initLookupForm() {
  const form = document.getElementById("lookup-form");
  const msg = document.getElementById("lookup-msg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.className = "form-msg";

    const email = normalizeEmail(form.email.value);
    const registrations = loadRegistrations();
    const entry = registrations.find((r) => r.email === email);

    if (!entry) {
      msg.textContent = "Pod tímhle e-mailem jsme žádnou registraci nenašli.";
      msg.classList.add("is-error");
      document.getElementById("registration-result").hidden = true;
      return;
    }

    msg.textContent = "";
    showResult(entry);
  });
}

function showResult(entry) {
  const result = document.getElementById("registration-result");
  const list = document.getElementById("result-list");

  list.innerHTML = "";
  const rows = [
    ["Jméno", entry.jmeno],
    ["E-mail", entry.email],
    ["Oddíl / středisko", entry.oddil || "—"],
    ["Velikost trička", entry.tricko || "—"],
    ["Poznámka", entry.poznamka || "—"],
  ];

  rows.forEach(([key, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = value;
    list.appendChild(dt);
    list.appendChild(dd);
  });

  result.hidden = false;
  result.dataset.email = entry.email;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function initCancelRegistration() {
  const btn = document.getElementById("cancel-registration");

  btn.addEventListener("click", () => {
    const result = document.getElementById("registration-result");
    const email = result.dataset.email;
    if (!email) return;

    if (!confirm("Opravdu chceš zrušit svou registraci na Brkvík?")) return;

    const registrations = loadRegistrations().filter((r) => r.email !== email);
    saveRegistrations(registrations);

    result.hidden = true;
    document.getElementById("lookup-msg").textContent = "Registrace zrušena. Mrzí nás to — snad příště!";
    document.getElementById("lookup-msg").className = "form-msg is-success";
  });
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  buildFeather();
  initTabs();
  initRegisterForm();
  initLookupForm();
  initCancelRegistration();
});

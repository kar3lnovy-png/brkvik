/* ==========================================================
   Brkvík — registrace napojená na Google Sheets (přes Apps Script)
   ========================================================== */

// Sem vlož URL Web Appky z Apps Scriptu (Deploy -> New deployment -> Web app),
// musí končit na /exec. Viz README.md.
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

/* ---------- Generovaná grafika brka v hero sekci ---------- */

function buildFeather() {
  const svg = document.getElementById("feather-hero");
  if (!svg) return;

  const ns = "http://www.w3.org/2000/svg";
  const cx = 400;
  const top = 60;
  const bottom = 860;
  const barbCount = 34;

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

  for (let i = 0; i < barbCount; i++) {
    const t = i / (barbCount - 1);
    const y = top + t * (bottom - top);
    const curveX = cx + Math.sin(t * Math.PI) * (t < 0.5 ? 20 : -14);
    const spread = Math.sin(t * Math.PI);
    const len = 40 + spread * 170;
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

  const style = document.createElement("style");
  style.textContent = `
    @keyframes barb-sway {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(1.2deg); }
    }
  `;
  document.head.appendChild(style);
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

/* ---------- Volání backendu (Apps Script Web App) ---------- */

async function callBackend(action, params) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith("PASTE_")) {
    throw new Error(
      "Appka ještě není napojená na Google Sheets — doplň APPS_SCRIPT_URL v app.js (viz README.md)."
    );
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value ?? ""));

  // Používáme GET (ne POST), protože Apps Script Web Appky přesměrovávají
  // odpověď a POST tělo by se při přesměrování ztratilo. GET s parametry
  // v URL je pro tenhle účel spolehlivější a nepotřebuje CORS preflight.
  const res = await fetch(url.toString());
  return res.json();
}

/* ---------- Registrace ---------- */

function initRegisterForm() {
  const form = document.getElementById("register-form");
  const msg = document.getElementById("register-msg");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    submitBtn.disabled = true;

    const jmeno = form.jmeno.value.trim();
    const email = form.email.value.trim();
    const oddil = form.oddil.value.trim();
    const tricko = form.tricko.value;
    const poznamka = form.poznamka.value.trim();

    if (!jmeno || !email) {
      msg.textContent = "Vyplň prosím jméno a e-mail.";
      msg.classList.add("is-error");
      submitBtn.disabled = false;
      return;
    }

    try {
      const data = await callBackend("register", { jmeno, email, oddil, tricko, poznamka });

      if (data.error) {
        msg.textContent = data.error;
        msg.classList.add("is-error");
      } else {
        msg.textContent = "Registrace uložena — platební údaje ti přišly na e-mail.";
        msg.classList.add("is-success");
        form.reset();
      }
    } catch (err) {
      msg.textContent = err.message || "Nepodařilo se spojit se serverem. Zkus to prosím znovu.";
      msg.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Vyhledání registrace ("přihlášení") ---------- */

function initLookupForm() {
  const form = document.getElementById("lookup-form");
  const msg = document.getElementById("lookup-msg");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    submitBtn.disabled = true;
    document.getElementById("registration-result").hidden = true;

    const email = form.email.value.trim();

    try {
      const data = await callBackend("lookup", { email });

      if (data.error) {
        msg.textContent = data.error;
        msg.classList.add("is-error");
      } else {
        msg.textContent = "";
        showResult(data);
      }
    } catch (err) {
      msg.textContent = err.message || "Nepodařilo se spojit se serverem. Zkus to prosím znovu.";
      msg.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function showResult(entry) {
  const result = document.getElementById("registration-result");
  const list = document.getElementById("result-list");

  list.innerHTML = "";

  const badge = document.getElementById("paid-badge");
  badge.className = `paid-badge ${entry.paid ? "is-paid" : "is-unpaid"}`;
  badge.textContent = entry.paid ? "Zaplaceno" : "Čeká na platbu";

  const rows = [
    ["Jméno", entry.jmeno],
    ["E-mail", entry.email],
    ["Oddíl / středisko", entry.oddil || "—"],
    ["Velikost trička", entry.tricko || "—"],
    ["Poznámka", entry.poznamka || "—"],
    ["Variabilní symbol", entry.variableSymbol],
    ["Částka", `${Number(entry.amount).toFixed(2)} Kč`],
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

  btn.addEventListener("click", async () => {
    const result = document.getElementById("registration-result");
    const email = result.dataset.email;
    if (!email) return;

    if (!confirm("Opravdu chceš zrušit svou registraci na Brkvík?")) return;

    btn.disabled = true;
    try {
      const data = await callBackend("cancel", { email });
      if (data.error) {
        alert(data.error);
      } else {
        result.hidden = true;
        const msg = document.getElementById("lookup-msg");
        msg.textContent = "Registrace zrušena. Mrzí nás to — snad příště!";
        msg.className = "form-msg is-success";
      }
    } catch (err) {
      alert(err.message || "Zrušení se nepodařilo, zkus to prosím znovu.");
    } finally {
      btn.disabled = false;
    }
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

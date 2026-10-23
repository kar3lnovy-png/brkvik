/* ==========================================================
   Brkvík 2027 — registrace napojená na Google Sheets (Apps Script)
   ========================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRhjR1nXjXWpbNvWWHzoctCRtiFwiCI0ABieGAIQW2VFTqWx5W9eZQZ7Mjij8sSog-Ig/exec";

// Datum, ke kterému se počítá dovršení 16 let (uprav podle termínu akce)
const FESTIVAL_START_DATE = new Date("2027-05-28");

/* ---------- Pomocné funkce ---------- */

function isAtLeast16(birthDateStr) {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return false;

  const refDate = FESTIVAL_START_DATE;
  let age = refDate.getFullYear() - birth.getFullYear();
  const m = refDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 16;
}

function formatCzDate(isoDateStr) {
  if (!isoDateStr) return "—";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  return `${Number(parts[2])}. ${Number(parts[1])}. ${parts[0]}`;
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

      const resultBox = document.getElementById("registration-result");
      if (resultBox) resultBox.hidden = true;
    });
  });
}

/* ---------- Volání backendu (Apps Script Web App) ---------- */

async function callBackend(action, params) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith("PASTE_")) {
    throw new Error(
      "Aplikace zatím není propojena s databází — doplňte APPS_SCRIPT_URL v souboru app.js."
    );
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value ?? ""));

  const res = await fetch(url.toString());
  return res.json();
}

/* ---------- Registrace ---------- */

function initRegisterForm() {
  const form = document.getElementById("register-form");
  const msg = document.getElementById("register-msg");
  if (!form) return;
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";

    const jmeno = form.jmeno.value.trim();
    const email = form.email.value.trim();
    const narozeni = form.narozeni.value; // formát YYYY-MM-DD
    const oddil = form.oddil.value.trim();
    const tricko = form.tricko.value;
    const poznamka = form.poznamka.value.trim();

    if (!jmeno || !email || !narozeni) {
      msg.textContent = "Vyplňte prosím jméno, e-mail a datum narození.";
      msg.classList.add("is-error");
      return;
    }

    if (!isAtLeast16(narozeni)) {
      msg.textContent = "Festival je určen pouze pro účastníky starší 16 let.";
      msg.classList.add("is-error");
      return;
    }

    msg.textContent = "Odesílám přihlášku…";
    submitBtn.disabled = true;

    try {
      const data = await callBackend("register", { jmeno, email, narozeni, oddil, tricko, poznamka });

      if (data.error) {
        msg.textContent = data.error;
        msg.classList.add("is-error");
      } else {
        msg.textContent = "Registrace byla uložena. Platební údaje jsme odeslali na uvedený e-mail.";
        msg.classList.add("is-success");
        form.reset();
      }
    } catch (err) {
      msg.textContent = err.message || "Spojení se serverem selhalo. Zkuste to prosím znovu.";
      msg.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Vyhledání registrace ---------- */

function initLookupForm() {
  const form = document.getElementById("lookup-form");
  const msg = document.getElementById("lookup-msg");
  if (!form) return;
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    document.getElementById("registration-result").hidden = true;

    const email = form.email.value.trim();
    const narozeni = form.narozeni.value;

    if (!email || !narozeni) {
      msg.textContent = "Zadejte prosím e-mail i datum narození.";
      msg.classList.add("is-error");
      return;
    }

    msg.textContent = "Vyhledávám…";
    submitBtn.disabled = true;

    try {
      const data = await callBackend("lookup", { email, narozeni });

      if (data.error) {
        msg.textContent = data.error;
        msg.classList.add("is-error");
      } else {
        msg.textContent = "";
        showResult(data, narozeni);
      }
    } catch (err) {
      msg.textContent = err.message || "Spojení se serverem selhalo. Zkuste to prosím znovu.";
      msg.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function showResult(entry, lookupNarozeni) {
  const result = document.getElementById("registration-result");
  const list = document.getElementById("result-list");

  list.innerHTML = "";

  const badge = document.getElementById("paid-badge");
  badge.className = `paid-badge ${entry.paid ? "is-paid" : "is-unpaid"}`;
  badge.textContent = entry.paid ? "Uhrazeno" : "Čeká na platbu";

  const rows = [
    ["Jméno", entry.jmeno],
    ["E-mail", entry.email],
    ["Datum narození", formatCzDate(entry.narozeni || lookupNarozeni)],
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
  result.dataset.narozeni = entry.narozeni || lookupNarozeni;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function initCancelRegistration() {
  const btn = document.getElementById("cancel-registration");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const result = document.getElementById("registration-result");
    const email = result.dataset.email;
    const narozeni = result.dataset.narozeni;
    if (!email || !narozeni) return;

    if (!confirm("Opravdu si přejete zrušit svou registraci na festival Brkvík?")) return;

    btn.disabled = true;
    try {
      const data = await callBackend("cancel", { email, narozeni });
      if (data.error) {
        alert(data.error);
      } else {
        result.hidden = true;
        const msg = document.getElementById("lookup-msg");
        msg.textContent = "Registrace byla úspěšně zrušena.";
        msg.className = "form-msg is-success";
      }
    } catch (err) {
      alert(err.message || "Zrušení registrace se nezdařilo. Zkuste to prosím znovu.");
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- Inicializace ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initRegisterForm();
  initLookupForm();
  initCancelRegistration();
});

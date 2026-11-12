/* ==========================================================
   Brkvík 2027 — hlídač registrace
   ========================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRhjR1nXjXWpbNvWWHzoctCRtiFwiCI0ABieGAIQW2VFTqWx5W9eZQZ7Mjij8sSog-Ig/exec";
const REQUEST_TIMEOUT_MS = 25000;

function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-msg" + (type ? " is-" + type : "");
}

function isEmailLike(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

// Jakákoli neošetřená chyba se ukáže pod tlačítkem
window.addEventListener("error", (e) => {
  setMsg(document.getElementById("watch-msg"), "Chyba skriptu: " + e.message, "error");
});
window.addEventListener("unhandledrejection", (e) => {
  setMsg(document.getElementById("watch-msg"), "Chyba: " + ((e.reason && e.reason.message) || e.reason), "error");
});

async function callBackend(action, params) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v == null ? "" : v));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal, redirect: "follow" });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Neplatná odpověď serveru:", text.slice(0, 300));
      throw new Error("Server vrátil neočekávanou odpověď (zkontrolujte nasazení Apps Scriptu).");
    }
  } catch (err) {
    if (err && err.name === "AbortError") throw new Error("Server neodpověděl včas. Zkuste to znovu.");
    if (err instanceof TypeError) throw new Error("Spojení se serverem selhalo (síť nebo nastavení přístupu k Apps Scriptu).");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function handleWatchSubmit() {
  const form = document.getElementById("watch-form");
  const msg = document.getElementById("watch-msg");
  const btn = document.getElementById("w-submit");

  setMsg(msg, "Kontroluji…", "");

  try {
    const jmeno = (document.getElementById("w-jmeno").value || "").trim();
    const email = (document.getElementById("w-email").value || "").trim();
    const souhlas = document.getElementById("w-souhlas").checked;
    const honeypot = (document.getElementById("w-web").value || "").trim();

    if (!jmeno || !email) return setMsg(msg, "Vyplňte prosím jméno a e-mail.", "error");
    if (!isEmailLike(email)) return setMsg(msg, "Zadejte prosím platný e-mail.", "error");
    if (!souhlas) return setMsg(msg, "Potvrďte prosím souhlas se zasláním upozornění.", "error");
    if (honeypot) return setMsg(msg, "Hotovo! Dáme vám vědět, jakmile se registrace spustí.", "success");

    if (btn) btn.disabled = true;
    setMsg(msg, "Ukládám…", "");

    const data = await callBackend("watch", { jmeno, email });

    if (data && data.error) {
      setMsg(msg, data.error, "error");
    } else if (data && data.ok) {
      setMsg(msg, "Hotovo! Dáme vám vědět, jakmile se registrace spustí.", "success");
      if (form) form.reset();
    } else {
      setMsg(msg, "Server vrátil neočekávanou odpověď. Zkuste to později.", "error");
    }
  } catch (err) {
    console.error(err);
    setMsg(msg, (err && err.message) || "Něco se nepovedlo. Zkuste to znovu.", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Odeslání formuláře (Enter i klik) – zachyceno globálně
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "watch-form") {
    e.preventDefault();
    handleWatchSubmit();
  }
});

// Pojistka: přímo i na klik tlačítka
document.addEventListener("click", (e) => {
  const b = e.target && e.target.closest && e.target.closest("#w-submit");
  if (b) {
    e.preventDefault();
    handleWatchSubmit();
  }
});

async function initUnsubscribe() {
  const token = new URLSearchParams(location.search).get("odhlasit");
  if (!token) return;

  const msg = document.getElementById("unsub-msg");
  setMsg(msg, "Odhlašuji…", "");
  try {
    const data = await callBackend("unsubscribe", { token });
    if (data && data.error) setMsg(msg, data.error, "error");
    else setMsg(msg, "Odhlášeno. Už vám nic nepošleme a údaje jsme smazali.", "success");
  } catch (err) {
    setMsg(msg, (err && err.message) || "Odhlášení se nezdařilo.", "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUnsubscribe);
} else {
  initUnsubscribe();
}

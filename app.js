/* ==========================================================
   Brkvík 2027 — hlídač registrace (Google Apps Script)
   ========================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzRhjR1nXjXWpbNvWWHzoctCRtiFwiCI0ABieGAIQW2VFTqWx5W9eZQZ7Mjij8sSog-Ig/exec";

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

/* ---------- Hlídač registrace ---------- */

function initWatchForm() {
  const form = document.getElementById("watch-form");
  const msg = document.getElementById("watch-msg");
  if (!form) return;
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";

    const jmeno = form.jmeno.value.trim();
    const email = form.email.value.trim();

    if (!jmeno || !email) {
      msg.textContent = "Vyplňte prosím jméno a e-mail.";
      msg.classList.add("is-error");
      return;
    }
 if (!form.elements["souhlas"].checked) {
      msg.textContent = "Potvrďte prosím souhlas se zasláním upozornění.";
      msg.classList.add("is-error");
      return;
    }
    if (form.web.value) return; // honeypot vyplnil bot

    msg.textContent = "Ukládám…";
    submitBtn.disabled = true;

    try {
      const data = await callBackend("watch", { jmeno, email });
      if (data.error) {
        msg.textContent = data.error;
        msg.classList.add("is-error");
      } else {
        msg.textContent = "Hotovo! Dáme vám vědět, jakmile se registrace spustí.";
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

/* ---------- Odhlášení z hlídání (odkaz z e-mailu: registrace?odhlasit=TOKEN) ---------- */

async function initUnsubscribe() {
  const token = new URLSearchParams(location.search).get("odhlasit");
  if (!token) return;

  const msg = document.getElementById("unsub-msg");
  if (!msg) return;
  msg.textContent = "Odhlašuji…";
  try {
    const data = await callBackend("unsubscribe", { token });
    if (data.error) {
      msg.textContent = data.error;
      msg.className = "form-msg is-error";
    } else {
      msg.textContent = "Odhlášeno. Už vám nic nepošleme a údaje jsme smazali.";
      msg.className = "form-msg is-success";
    }
  } catch (err) {
    msg.textContent = err.message || "Odhlášení se nezdařilo. Zkuste to prosím znovu.";
    msg.className = "form-msg is-error";
  }
}

/* ---------- Inicializace ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initWatchForm();
  initUnsubscribe();
});

# Brkvík — registrace přes Google Sheets

Statický web (jde na GitHub Pages) napojený na Google Sheets jako databázi. Žádný Vercel, Supabase
ani Node server — jen Google účet a GitHub.

## Jak to funguje

1. Člověk vyplní registraci na webu.
2. Web pošle data do **Apps Scriptu**, který je zapíše jako řádek do **Google Sheetu**.
3. Apps Script mu rovnou pošle e-mail s **QR platbou** (formát „QR Platba“, přečte to jakákoliv
   česká bankovní appka) a s číslem účtu, částkou a variabilním symbolem.
4. Vy jako pořadatelé máte **přehled všech registrací přímo v tabulce** — filtrujete, řadíte,
   exportujete, a jakmile vám dojde platba, zaškrtnete sloupec „Zaplaceno“.
5. Účastník si přes „Najít svou registraci“ na webu kdykoliv zobrazí svoje údaje a stav platby
   (podle e-mailu, bez hesla).

---

## 1. Založ Google Sheet a vlož Apps Script

1. Vytvoř novou Google tabulku (např. „Brkvík — registrace“) na [sheets.google.com](https://sheets.google.com)
   — ideálně na vaší Workspace doméně, ne na osobním Gmailu (kvůli limitu na počet e-mailů/den).
2. V tabulce jdi do **Extensions → Apps Script**.
3. Smaž vygenerovaný prázdný kód a vlož místo něj celý obsah souboru
   [`apps-script/Code.gs`](apps-script/Code.gs) z tohohle projektu.
4. Ulož (Ctrl/Cmd+S).

## 2. Nastav proměnné (Script Properties)

V Apps Scriptu jdi do **Project Settings** (ozubené kolo vlevo) → **Script Properties** → **Add script property**
a přidej:

| Property | Hodnota (příklad) |
|---|---|
| `BANK_IBAN` | `CZ6508000000192000145399` |
| `EVENT_PRICE` | `500` |
| `EVENT_NAME` | `Brkvík 2026` |
| `ORGANIZER_EMAIL` | `vas@email.cz` (nepovinné — kopie každé registrace) |

IBAN najdeš v internetovém bankovnictví (i běžný český účet má IBAN tvar, banka ti ho ukáže).

## 3. Autorizuj appku

1. V Apps Scriptu nahoře vyber v rozbalovací nabídce funkci **`setup`** a klikni **Run**.
2. Google se zeptá na oprávnění (přístup k tabulce, odesílání e-mailů, internet pro QR kódy) —
   odsouhlas. Tohle je jen jednorázový krok, protože je to tvůj vlastní skript.
3. V tabulce by se mělo objevit nové sešit s hlavičkou sloupců.

## 4. Nasaď jako Web App

1. V Apps Scriptu vpravo nahoře **Deploy → New deployment**.
2. Typ: **Web app**.
3. **Execute as:** Me (tvůj účet).
4. **Who has access:** Anyone.
5. **Deploy** → zkopíruj si URL, která končí na `/exec`.

## 5. Napoj web na Apps Script

V souboru `app.js` najdi řádek:

```js
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

a nahraď placeholder URL adresou z kroku 4.

## 6. Nahraj na GitHub Pages

1. Nahraj `index.html`, `style.css` a `app.js` do repa na GitHubu (soubory `apps-script/` a
   `README.md` tam klidně nechej pro dokumentaci, na fungování webu vliv nemají).
2. V repu **Settings → Pages** → jako Source vyber branch (např. `main`) a složku `/root`.
3. Ulož — dostaneš URL typu `https://tvuj-ucet.github.io/nazev-repa/`.

---

## Co ještě doplnit v `index.html`

Hledej text **„doplnit“** — termín, místo a cenu akce. Cenu zadanou v `EVENT_PRICE` (script property)
zkontroluj, ať odpovídá tomu, co je vidět na webu v sekci „Praktické info“.

## Limity, o kterých bys měl vědět

- **E-maily:** Workspace účet umí poslat cca 1 500 e-mailů/den — na 500 lidí bohatě stačí, i kdyby
  se přihlásili všichni ve stejný den.
- **QR kód pro platbu** se generuje přes veřejné API [api.qrserver.com](https://api.qrserver.com) —
  je zdarma a bez klíče, ale je to externí služba mimo vaši kontrolu. Kdyby náhodou vypadla, appka by
  e-mail neposlala (registrace v tabulce ale zůstane uložená, dá se to poslat ručně nebo doplnit
  vlastní generování QR).
- **Registrační data jdou v URL** (GET requesty na Apps Script) — pro jméno/e-mail/oddíl/tričko je to
  v pohodě, jen to nepoužívej pro citlivější údaje.
- Sloupec **„Zaplaceno“** se zatím zaškrtává ručně v tabulce. Pro plnou automatizaci (appka sama
  pozná příchozí platbu) by šlo napojit tabulku na **API Fio banky**, pokud tam máte účet — to je
  jasný další krok, klidně se ozvi, ať to doplním.

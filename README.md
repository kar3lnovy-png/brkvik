# Brkvík — web

Jednoduchá statická stránka pro brněnský skautský víkend Brkvík, s registrací a "přihlášením" (vyhledáním vlastní registrace).

## Soubory

- `index.html` — celá stránka (hero, o akci, program, info, registrace)
- `style.css` — vzhled
- `app.js` — logika registrace/vyhledávání + generovaná grafika brka v hero sekci

## Jak nasadit na GitHub Pages

1. Nahraj tyhle tři soubory (`index.html`, `style.css`, `app.js`) do repa na GitHubu.
2. V repu jdi do **Settings → Pages**.
3. U **Source** vyber branch (typicky `main`) a složku `/root`.
4. Ulož — GitHub vygeneruje URL typu `https://tvuj-ucet.github.io/nazev-repa/`.

Žádný build krok není potřeba, je to čisté HTML/CSS/JS.

## Co je potřeba doplnit

V `index.html` hledej text **"doplnit"** — je na místech, kde chybí reálné datum, lokace, cena a kontaktní e-mail. V `app.js` a `style.css` není potřeba nic měnit, pokud nechceš upravit vzhled nebo pole formuláře.

## Důležité: jak funguje "registrace a přihlášení"

Tohle je čistě statická stránka bez serveru, takže **skutečný účet s heslem tady nedává smysl** — heslo by se dalo ukládat jen v prohlížeči každého uživatele zvlášť, což by nebylo ani bezpečné, ani použitelné. Místo toho:

- **Registrace** uloží údaje (jméno, e-mail, oddíl, velikost trička, poznámku) do `localStorage` v prohlížeči toho, kdo formulář vyplnil.
- **"Přihlášení"** je ve skutečnosti vyhledání registrace podle e-mailu — žádné heslo se nikde netvoří ani neukládá.

**Zásadní omezení:** data v `localStorage` existují jen v tom jednom prohlížeči na tom jednom zařízení. Když se někdo zaregistruje na mobilu a pak otevře stránku v počítači, jeho registraci tam nenajde — a vy jako pořadatelé taky nemáte odnikud centrální seznam přihlášených, dokud si ho lidé sami neexportují nebo vám neřeknou.

### Pro reálnou akci to znamená

Pro pár desítek lidí a neformální event to může stačit jako "hezčí formulář", ale pokud chcete mít **jeden centrální seznam registrací**, budete potřebovat něco s backendem. Nejjednodušší cesty:

- **Google Forms / Tally** propojený se sheetem — nejrychlejší, nulový kód navíc.
- **Formspree / Getform** — formulář na vaší stránce, data vám chodí e-mailem nebo do dashboardu.
- **Firebase (Firestore)** — pokud chcete, ať to pořád vypadá takhle a je to napojené na společnou databázi; dá se doplnit do stejného `app.js` během pár desítek řádků.

Klidně se ozvi, pokud chceš, ať tohle rovnou napojím na Firebase nebo Google Sheet — aby všechny registrace padaly na jedno místo.

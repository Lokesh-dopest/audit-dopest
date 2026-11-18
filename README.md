# Dopest audit pages (static HTML / CSS / JS)

No build step. Open `pyannote/index.html` through any static server, or deploy the folder as is.

```
audit-site/
  assets/
    css/audit.css      shared styles (all clients)
    js/audit.js        nav, reveal, counters, button links
    js/visuals.js      all animated visuals
    fonts/             Nohemi web fonts (Regular, Medium, SemiBold, Bold)
  pyannote/
    index.html         page copy (from the content sheet)
    data.js            numbers + links the visuals read
```

Deploy so that `audit.dopest.io/pyannote` serves `pyannote/index.html`
(Vercel, Netlify and Cloudflare Pages all do this for a plain folder).

## Local preview
    cd audit-site && python3 -m http.server 8000
    open http://localhost:8000/pyannote/

## Before sending to the client
1. Fonts are pre-installed in `assets/fonts/` (Nohemi Regular, Medium, SemiBold, Bold).
2. Fill `links.book / pitch / pricing` in `pyannote/data.js`.
3. Replace `keywordTrend` in `data.js` with the exact Semrush export (current values are
   read off the chart by eye).
4. The three headline numbers in `index.html` (`#numbers`) are static text: 370, 7.5%, 12.
   Swap "High-value keyword gaps" for the real gap count from a Semrush Keyword Gap export.
5. Sub-pages linked from the three chapters: `technical-seo/`, `content-pipeline/`, `paid-search/`.

## New client
Copy `pyannote/` to `newclient/`, edit `data.js` and the copy in `index.html`.
Shared CSS/JS stay untouched.

/* =========================================================
   CLIENT DATA — Pyannote
   Everything the visuals draw comes from this file.
   For a new client: copy this folder, rename it, edit this file
   and the copy in index.html.
   Source for all numbers: Semrush (US, desktop, 17 Nov 2026)
   and the Screaming Frog crawl.
   ========================================================= */
window.AUDIT_DATA = {
  client: { name: 'Pyannote', domain: 'pyannote.ai', prepared: 'November 2026' },

  /* Fill these in. They are wired to every [data-link] on the page. */
  links: {
    book: 'https://calendly.com/shifa-dopest/new-meeting',
    pitch: 'https://dopest.io',
    pricing: 'https://dopest.io/pricing'
  },

  /* Organic keywords ranking (US), monthly.
     NOTE: approximated from the Semrush 2Y chart.
     Replace with the exact export (Organic Research > Export) when you have it. */
  keywordTrend: {
    labels: ["Jan '25","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan '26","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
    values: [6, 6, 8, 8, 9, 9, 10, 10, 10, 11, 12, 24, 62, 105, 160, 228, 244, 258, 272, 300, 352, 462, 370]
  },

  /* Keywords by intent (Semrush "Keywords by Intent") */
  intent: [
    { label: 'Informational', pct: 80.2, keywords: 308, color: 'rgba(255,255,255,.78)' },
    { label: 'Navigational',  pct: 12.2, keywords: 47,  color: 'rgba(255,255,255,.30)' },
    { label: 'Commercial',    pct: 7.0,  keywords: 27,  color: '#8DED11' },
    { label: 'Transactional', pct: 0.5,  keywords: 2,   color: '#5ea50b' }
  ],

  /* AI search (Semrush "AI Search") */
  ai: {
    visibility: 29,
    mentions: 70,
    citedPages: 23,
    surfaces: [
      { name: 'ChatGPT',     mentions: 13 },
      { name: 'AI Overview', mentions: 17 },
      { name: 'AI Mode',     mentions: 23 },
      { name: 'Gemini',      mentions: 17 }
    ]
  },

  /* Screaming Frog crawl */
  crawl: { urls: 134, core: 93, docs: 41, findings: 12, blockers: 0 },

  /* Hub shown in the content strategy visual */
  cluster: {
    pillar: 'Speaker diarization',
    topics: [
      'What is diarization',
      'DER benchmarks',
      'Open-source models',
      'Real-time pipelines',
      'Speaker embeddings',
      'Pyannote vs alternatives'
    ]
  },

  /* Paid search mock + keyword economics (Semrush, US) */
  serp: {
    queries: [
      { engine: 'Google', q: 'speaker diarization api' },
      { engine: 'Bing',   q: 'pyannote alternatives' }
    ]
  },
  keywords: [
    { kw: 'diarization',  pos: 7, volume: '2.4K', cpc: 42.82 },
    { kw: 'pyannote',     pos: 2, volume: '720',  cpc: 5.63 },
    { kw: 'pyannoteai',   pos: 1, volume: '210',  cpc: 19.10 }
  ]
};

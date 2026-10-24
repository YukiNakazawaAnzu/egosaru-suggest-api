// Fetch expanded autocomplete suggestions from the Egosaru Suggest API (Node 18+, no dependencies).
// KEY=gsk_... node suggest.mjs "running shoes" google en us
const [q, source = "google", lang = "en", country] = process.argv.slice(2);
if (!q || !process.env.KEY) {
  console.error("usage: KEY=... node suggest.mjs <keyword> [source] [lang] [country]");
  process.exit(1);
}

const params = new URLSearchParams({ q, lang, flat: "1", ...(country ? { country } : {}) });
const url = `https://gstudio1.com/api/v1/${source}/suggest?${params}`;

for (let i = 0; i < 12; i++) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.KEY}` } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 200) { console.log((data.suggestions ?? []).join("\n")); process.exit(0); }
  if (res.status === 202) { await new Promise((r) => setTimeout(r, (data.retry_after_seconds ?? 20) * 1000)); continue; }
  console.error(`HTTP ${res.status}`, data);
  process.exit(1);
}
console.error("still queued; try again later");
process.exit(2);

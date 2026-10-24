# Egosaru Suggest API: examples and clients

[Egosaru](https://gstudio1.com/suggest/en/posts/google) collects autocomplete suggestions from Google, Bing, YouTube, Amazon, eBay, Shopee, DuckDuckGo, Baidu, Yandex, Naver, Daum, Yahoo! and Rakuten, expanded letter by letter, in 20 languages. This repository has small, dependency-free examples for its JSON API.

- Web tool (free, no sign-up): <https://gstudio1.com/suggest/en/posts/google>
- API documentation: <https://gstudio1.com/api/en/>
- Free API key: log in at gstudio1.com and issue one from "API" in the user menu.

## Quick start

```bash
export KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
curl -H "Authorization: Bearer $KEY" \
  "https://gstudio1.com/api/v1/google/suggest?q=running%20shoes&lang=en&country=us&flat=1"
```

Keywords that are not cached yet are queued: the API answers `202` with `retry_after_seconds`. Send the same request again after that many seconds and you get `200` with the data. Results are cached for 7 days (after that you get the old data with `"stale": true` while it refreshes).

The examples here handle that loop for you:

| File | Run with |
|---|---|
| [`examples/suggest.sh`](examples/suggest.sh) | `KEY=... ./examples/suggest.sh "running shoes" google en us` |
| [`examples/suggest.py`](examples/suggest.py) | `KEY=... python examples/suggest.py "running shoes" --source google --lang en --country us` |
| [`examples/suggest.mjs`](examples/suggest.mjs) | `KEY=... node examples/suggest.mjs "running shoes" google en us` (Node 18+) |

## Notes

- Keep the key on your server. If it is in browser JavaScript, anyone can use it.
- `source` is one of `google bing youtube amazon ebay shopee duckduckgo baidu yandex naver daum yahoo rakuten`. Regional engines work only for the languages listed in the docs (for example `naver` is `ko`, `yandex` is `ru` or `tr`).
- `lang` takes the 20 site language codes; `country` selects a market within the language (`en` + `gb`, `es` + `mx`, `pt` + `br`, ...).
- Free plan limits: 30 requests/minute, 1,000/day, 20 new (uncached) keywords/day. Paid plans are coming; the free plan stays.
- Questions, missing engines or markets: open an issue, or message [@yknkzw on Telegram](https://t.me/yknkzw).

## About

Built and run by [Yuki Nakazawa](https://nkzw.jp/) in Japan. The name comes from "egosa" (ego search) plus the verb ending "-ru": [the story of the name](https://nkzw.jp/2026/10/24/egosaru_name_origin_en/).

## License

MIT for the examples in this repository. The API itself is covered by its [terms of service](https://gstudio1.com/api/en/terms/).

"""Fetch expanded autocomplete suggestions from the Egosaru Suggest API (standard library only).

KEY=gsk_... python suggest.py "running shoes" --source google --lang en --country us
"""
import argparse, json, os, time, urllib.error, urllib.parse, urllib.request

API = "https://gstudio1.com/api/v1"


def suggest(q, source="google", lang="en", country=None, max_wait=300):
    params = {"q": q, "lang": lang, "flat": 1}
    if country:
        params["country"] = country
    url = f"{API}/{source}/suggest?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + os.environ["KEY"]})
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                status, data = r.status, json.load(r)
        except urllib.error.HTTPError as e:
            status, data = e.code, json.loads(e.read() or b"{}")
        if status == 200:
            return data
        if status == 202:                      # queued: ask again after retry_after_seconds
            time.sleep(data.get("retry_after_seconds", 20))
            continue
        raise RuntimeError(f"HTTP {status}: {data}")
    raise TimeoutError("still queued; try again later")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("q")
    ap.add_argument("--source", default="google")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--country")
    a = ap.parse_args()
    out = suggest(a.q, a.source, a.lang, a.country)
    print("\n".join(out.get("suggestions", [])) or json.dumps(out, ensure_ascii=False, indent=1))

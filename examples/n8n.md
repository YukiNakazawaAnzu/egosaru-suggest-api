# Using the Egosaru Suggest API from n8n

No custom node is needed: the standard **HTTP Request** node is enough. The only thing to handle is the
`202` answer for keywords that are not cached yet, which the workflow below does with an **IF** and a **Wait** node.

## Import the example workflow

1. In n8n, open **Workflows → Import from file** and choose [`n8n-egosaru-suggest.workflow.json`](n8n-egosaru-suggest.workflow.json).
2. Open the **Egosaru API** node and create a credential of type **Header Auth**:
   - Name: `Authorization`
   - Value: `Bearer gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your key from gstudio1.com, user menu "API")
3. Edit the **Keyword** node (`q`, `source`, `lang`, `country`) and run the workflow.

The **Result** node outputs `statusCode`, `count`, `suggestions` (a deduplicated array) and, on failure, `error`.

## How the loop works

```
Keyword -> Egosaru API -> Queued? (statusCode == 202)
                              yes -> Wait retry_after_seconds -> Egosaru API (again)
                              no  -> Result
```

The HTTP Request node has **Response → Include Response Headers and Status** and **Never Error** turned on,
so a `202` or a `429` is data, not an exception. `retry_after_seconds` from the API body sets the Wait node.

## Doing it by hand

If you build your own flow, these are the settings that matter on the HTTP Request node:

| Setting | Value |
|---|---|
| Method / URL | `GET https://gstudio1.com/api/v1/{source}/suggest` |
| Authentication | Generic → Header Auth (`Authorization: Bearer gsk_...`) |
| Query parameters | `q`, `lang`, optional `country`, `flat=1` |
| Options → Response | Include headers and status: on. Never error: on |

Then branch on `{{ $json.statusCode }}`: `202` → wait `{{ $json.body.retry_after_seconds }}` seconds and call again;
`200` → use `{{ $json.body.suggestions }}`; `429` → wait the `Retry-After` header and call again.

## Limits to keep in mind

The free plan allows 30 requests/minute, 1,000/day and 20 new (uncached) keywords/day. A loop that polls every
`retry_after_seconds` stays well inside the per-minute limit; a workflow that fans out over hundreds of keywords
will hit the daily limits, so batch them or use a paid plan (https://gstudio1.com/suggest/en/pricing).

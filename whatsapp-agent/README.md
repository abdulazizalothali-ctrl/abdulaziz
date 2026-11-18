# WhatsApp sender (Kapso)

1. `npm install`
2. `cp .env.example .env` and fill in `KAPSO_API_KEY` and `KAPSO_PHONE_NUMBER_ID`
   (get them from the Kapso dashboard, or `kapso whatsapp numbers list --output json`).
3. Send:
   ```bash
   node send.mjs --to +15551234567 --text "Hello from my agent"
   node send.mjs --to +15551234567 --template order_status_update --lang en_US --params '{"order_id":"123"}'
   ```
   Add `--dry-run` to preview the payload.

Free-form text only works inside WhatsApp's 24-hour customer window; to start a
conversation, use an approved template.

## Scheduled messages
Edit `schedules.json` (one-time via `at`, or every day via `daily` + `timezone`), then:
```bash
node scheduler.mjs --dry-run --once   # preview what would fire now
node scheduler.mjs                    # run continuously (keep it alive with pm2/systemd)
```
Sent jobs are tracked in `state.json` so nothing is sent twice. Outside the 24h window use `"template": "name", "lang": "ar"` instead of `"text"`.

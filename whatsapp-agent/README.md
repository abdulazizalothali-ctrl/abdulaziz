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

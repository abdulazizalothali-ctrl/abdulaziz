#!/usr/bin/env node
// Usage:
//   node send.mjs --to +15551234567 --text "Hello"
//   node send.mjs --to +15551234567 --template order_status_update --lang en_US \
//        --params '{"order_id":"123"}'
//   add --dry-run to print the payload without sending
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const { values: a } = parseArgs({
  options: {
    to: { type: "string" },
    text: { type: "string" },
    template: { type: "string" },
    lang: { type: "string", default: "en_US" },
    params: { type: "string" },
    "phone-number-id": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const fail = (m) => { console.error(m); process.exit(1); };
if (!a.to) fail("Missing --to (E.164 number, e.g. +15551234567)");
if (!a.text && !a.template) fail("Provide --text or --template");

const phoneNumberId = a["phone-number-id"] ?? process.env.KAPSO_PHONE_NUMBER_ID;
if (!phoneNumberId) fail("Missing phone number id (--phone-number-id or KAPSO_PHONE_NUMBER_ID)");

let payload;
if (a.template) {
  const named = a.params ? JSON.parse(a.params) : {};
  payload = {
    phoneNumberId,
    to: a.to,
    template: {
      name: a.template,
      language: { code: a.lang },
      components: Object.keys(named).length
        ? [{
            type: "body",
            parameters: Object.entries(named).map(([k, v]) => ({
              type: "text", parameter_name: k, text: String(v),
            })),
          }]
        : [],
    },
  };
} else {
  payload = { phoneNumberId, to: a.to, body: a.text };
}

if (a["dry-run"]) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

if (!process.env.KAPSO_API_KEY) fail("Missing KAPSO_API_KEY");
const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: process.env.KAPSO_API_KEY,
});

try {
  const res = a.template
    ? await client.messages.sendTemplate(payload)
    : await client.messages.sendText(payload);
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  fail(`Send failed: ${e.message ?? e}`);
}

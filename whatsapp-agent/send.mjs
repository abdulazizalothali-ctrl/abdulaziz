#!/usr/bin/env node
// node send.mjs --to +9665XXXXXXXX --text "Hello" [--template name --lang ar --params '{"k":"v"}'] [--dry-run]
import { parseArgs } from "node:util";
import { loadEnv, buildPayload, sendPayload } from "./lib.mjs";

loadEnv();
const { values: a } = parseArgs({
  options: {
    to: { type: "string" }, text: { type: "string" }, template: { type: "string" },
    lang: { type: "string", default: "en_US" }, params: { type: "string" },
    "phone-number-id": { type: "string" }, "dry-run": { type: "boolean", default: false },
  },
});
try {
  const payload = buildPayload({
    to: a.to, text: a.text, template: a.template, lang: a.lang,
    params: a.params ? JSON.parse(a.params) : undefined,
    phoneNumberId: a["phone-number-id"] ?? process.env.KAPSO_PHONE_NUMBER_ID,
  });
  if (a["dry-run"]) { console.log(JSON.stringify(payload, null, 2)); process.exit(0); }
  console.log(JSON.stringify(await sendPayload(payload), null, 2));
} catch (e) { console.error(e.message ?? e); process.exit(1); }

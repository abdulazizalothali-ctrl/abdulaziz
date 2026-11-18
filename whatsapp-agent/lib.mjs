import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { readFileSync, existsSync } from "node:fs";

export function loadEnv(file = ".env") {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

export function buildPayload({ to, text, template, lang = "en_US", params, phoneNumberId }) {
  if (!to) throw new Error("Missing 'to'");
  if (!phoneNumberId) throw new Error("Missing phone number id");
  if (template) {
    const named = params ?? {};
    return {
      phoneNumberId, to,
      template: {
        name: template,
        language: { code: lang },
        components: Object.keys(named).length
          ? [{ type: "body", parameters: Object.entries(named).map(([k, v]) => ({ type: "text", parameter_name: k, text: String(v) })) }]
          : [],
      },
    };
  }
  if (!text) throw new Error("Provide 'text' or 'template'");
  return { phoneNumberId, to, body: text };
}

export async function sendPayload(payload) {
  if (!process.env.KAPSO_API_KEY) throw new Error("Missing KAPSO_API_KEY");
  const client = new WhatsAppClient({
    baseUrl: "https://api.kapso.ai/meta/whatsapp",
    kapsoApiKey: process.env.KAPSO_API_KEY,
  });
  return payload.template ? client.messages.sendTemplate(payload) : client.messages.sendText(payload);
}

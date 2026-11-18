#!/usr/bin/env node
// Runs continuously and sends scheduled WhatsApp messages from schedules.json.
// node scheduler.mjs [--dry-run] [--once]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadEnv, buildPayload, sendPayload } from "./lib.mjs";

loadEnv();
const DRY = process.argv.includes("--dry-run");
const ONCE = process.argv.includes("--once");
const STATE = "state.json";
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2));

// Current date (YYYY-MM-DD) and time (HH:MM) in a given IANA timezone
function nowIn(tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

async function fire(job) {
  const payload = buildPayload({ ...job, phoneNumberId: job.phoneNumberId ?? process.env.KAPSO_PHONE_NUMBER_ID });
  if (DRY) { console.log(`[dry-run] ${job.id}:`, JSON.stringify(payload)); return; }
  await sendPayload(payload);
  console.log(`[${new Date().toISOString()}] sent ${job.id} -> ${job.to}`);
}

async function tick() {
  const jobs = JSON.parse(readFileSync("schedules.json", "utf8"));
  for (const job of jobs) {
    try {
      if (job.at) { // one-time: ISO timestamp with offset, e.g. 2026-11-20T09:00:00+03:00
        if (state[job.id]?.sent || Date.now() < Date.parse(job.at)) continue;
        await fire(job);
        if (!DRY) { state[job.id] = { sent: true }; save(); }
      } else if (job.daily) { // every day at HH:MM in job.timezone
        const { date, time } = nowIn(job.timezone ?? "Asia/Riyadh");
        if (time < job.daily || state[job.id]?.lastDate === date) continue;
        await fire(job);
        if (!DRY) { state[job.id] = { lastDate: date }; save(); }
      }
    } catch (e) {
      console.error(`job ${job.id} failed: ${e.message ?? e}`);
    }
  }
}

await tick();
if (!ONCE) { console.log("Scheduler running. Ctrl+C to stop."); setInterval(tick, 30_000); }

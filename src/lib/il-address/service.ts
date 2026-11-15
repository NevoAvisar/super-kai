import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { fetchOfficialDataset, type AddressDataset } from "./dataset";

/**
 * The official localities-and-streets dataset, for the address API routes and
 * the server-side validation.
 *
 * It starts from the snapshot bundled with the app (src/data/il-addresses.json,
 * written by `npm run addresses:fetch`), so validation works even when
 * data.gov.il is slow, down or blocking the host. Once the data in memory is
 * older than a day it is re-read from data.gov.il in the background and swapped
 * in when the download succeeds; a failed refresh keeps the current data and is
 * retried an hour later.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 60 * 1000;
const SNAPSHOT = path.join(process.cwd(), "src", "data", "il-addresses.json");

interface State {
  dataset?: Promise<AddressDataset>;
  refreshing: boolean;
  nextRefreshAt: number;
}

// One copy per server process, kept across hot reloads in development.
const globalForAddresses = globalThis as unknown as { ilAddresses?: State };
const state = (globalForAddresses.ilAddresses ??= { refreshing: false, nextRefreshAt: 0 });

async function readSnapshot(): Promise<AddressDataset> {
  return JSON.parse(await fs.readFile(SNAPSHOT, "utf8")) as AddressDataset;
}

function refreshInBackground(current: AddressDataset) {
  const now = Date.now();
  if (state.refreshing || now < state.nextRefreshAt || now - Date.parse(current.fetchedAt) < MAX_AGE_MS) return;
  state.refreshing = true;
  fetchOfficialDataset()
    .then((fresh) => {
      state.dataset = Promise.resolve(fresh);
      state.nextRefreshAt = 0;
    })
    .catch((err) => {
      state.nextRefreshAt = Date.now() + RETRY_MS;
      console.warn(`[il-address] refresh from data.gov.il failed, keeping data from ${current.fetchedAt}:`, err instanceof Error ? err.message : err);
    })
    .finally(() => {
      state.refreshing = false;
    });
}

export async function getAddressDataset(): Promise<AddressDataset> {
  state.dataset ??= readSnapshot().catch((err) => {
    state.dataset = undefined; // let the next request try again
    throw err;
  });
  const dataset = await state.dataset;
  if (process.env.IL_ADDRESS_REFRESH !== "off") refreshInBackground(dataset);
  return dataset;
}

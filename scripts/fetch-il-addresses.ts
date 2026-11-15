/**
 * Refreshes the bundled snapshot of official Israeli localities and streets
 * from data.gov.il (the same reader the server uses at runtime):
 *   src/data/il-addresses.json
 *   npm run addresses:fetch
 */
import fs from "node:fs";
import path from "node:path";
import { fetchOfficialDataset } from "../src/lib/il-address/dataset";

const out = path.resolve(import.meta.dirname, "../src/data/il-addresses.json");
const dataset = await fetchOfficialDataset();
fs.writeFileSync(out, JSON.stringify(dataset));
const streets = Object.values(dataset.streets).reduce((n, list) => n + list.length, 0);
console.log(`${dataset.cities.length} localities, ${streets} streets → ${path.relative(process.cwd(), out)}`);

import { config } from "dotenv";
config({ path: ".env.local" });
import { ensureTabsExist, readTab, writeTab } from "../src/lib/sheets/client";
import { TABS, HEADERS } from "../src/lib/sheets/schema";
import type { AdminRow } from "../src/lib/sheets/schema";

const SUPERADMIN_EMAIL = process.argv[2];

async function main() {
  await ensureTabsExist(Object.values(TABS));

  for (const [key, tab] of Object.entries(TABS)) {
    const header = HEADERS[key as keyof typeof HEADERS];
    const existing = await readTab(tab);
    if (existing.length === 0) {
      await writeTab(tab, [...header], []);
      console.log(`Initialized tab: ${tab}`);
    } else {
      console.log(`Tab already has data, skipping header reset: ${tab}`);
    }
  }

  if (SUPERADMIN_EMAIL) {
    const admins = await readTab<AdminRow>(TABS.admins);
    if (!admins.some((a) => a.email === SUPERADMIN_EMAIL)) {
      await writeTab(TABS.admins, [...HEADERS.admins], [
        ...admins,
        { email: SUPERADMIN_EMAIL, role: "superadmin", addedAt: new Date().toISOString() },
      ]);
      console.log(`Added superadmin: ${SUPERADMIN_EMAIL}`);
    } else {
      console.log(`${SUPERADMIN_EMAIL} is already an admin`);
    }
  } else {
    console.log("No superadmin email passed. Usage: npm run seed:sheets -- you@example.com");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

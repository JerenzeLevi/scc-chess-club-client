import { google } from "googleapis";

function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID env var");
  return id;
}

function getAuth() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Missing Google Sheets service account env vars");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsApi() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

/** Reads all rows from a tab, returning objects keyed by the header row. */
export async function readTab<T extends Record<string, string>>(
  tabName: string,
): Promise<T[]> {
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: tabName,
  });

  const rows = res.data.values ?? [];
  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  return body.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((col: string, i: number) => {
      obj[col] = row[i] ?? "";
    });
    return obj as T;
  });
}

/** Appends a single row to a tab, in header column order. */
export async function appendRow(
  tabName: string,
  header: string[],
  row: Record<string, string | number>,
): Promise<void> {
  const sheets = getSheetsApi();
  const values = [header.map((col) => String(row[col] ?? ""))];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: tabName,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

/** Overwrites an entire tab (header + rows). Used for recompute/rewrite operations. */
export async function writeTab(
  tabName: string,
  header: string[],
  rows: Record<string, string | number>[],
): Promise<void> {
  const sheets = getSheetsApi();
  const values = [
    header,
    ...rows.map((row) => header.map((col) => String(row[col] ?? ""))),
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSpreadsheetId(),
    range: tabName,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

/** Updates a single row (by its 1-based row index within the tab, header excluded) in place. */
export async function updateRow(
  tabName: string,
  header: string[],
  rowIndex: number,
  row: Record<string, string | number>,
): Promise<void> {
  const sheets = getSheetsApi();
  const values = [header.map((col) => String(row[col] ?? ""))];
  const rangeRow = rowIndex + 2; // +1 for header, +1 for 1-based indexing

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${tabName}!A${rangeRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function ensureTabsExist(tabs: string[]): Promise<void> {
  const sheets = getSheetsApi();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  const existing = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean),
  );

  const missing = tabs.filter((t) => !existing.has(t));
  if (missing.length === 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    },
  });
}

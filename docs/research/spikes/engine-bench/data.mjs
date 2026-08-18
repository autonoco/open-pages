// Shared invoice data for both engines.
const BASE_ITEMS = [
  { sku: "SVC-101", name: "Discovery & scoping workshop", detail: "Two-day onsite workshop covering requirements, stakeholder interviews, and system mapping.", qty: 2, unit: 1850.0 },
  { sku: "SVC-102", name: "API integration development", detail: "REST integration with payment provider, retry queue, and webhook fan-out handlers.", qty: 38, unit: 165.0 },
  { sku: "SVC-103", name: "Data pipeline buildout", detail: "Nightly ELT jobs from Postgres to the warehouse with schema drift alerts.", qty: 24, unit: 175.0 },
  { sku: "SVC-104", name: "Dashboard implementation", detail: "Executive KPI dashboard with drill-downs and scheduled email snapshots.", qty: 16, unit: 155.0 },
  { sku: "LIC-201", name: "Platform license (annual)", detail: "Production tenant, up to 50 seats, standard SLA with 99.9% uptime.", qty: 1, unit: 12000.0 },
  { sku: "LIC-202", name: "Sandbox environment", detail: "Isolated staging tenant refreshed weekly from anonymized production data.", qty: 1, unit: 2400.0 },
  { sku: "SVC-105", name: "Load testing & tuning", detail: "k6 scenario suite to 5,000 RPS with query plan fixes and cache tuning.", qty: 12, unit: 190.0 },
  { sku: "SVC-106", name: "Security review", detail: "OWASP ASVS L2 assessment, dependency audit, and remediation report.", qty: 10, unit: 210.0 },
  { sku: "TRN-301", name: "Admin training sessions", detail: "Three remote sessions with recordings and a runbook for the ops team.", qty: 3, unit: 650.0 },
  { sku: "SVC-107", name: "Migration of legacy records", detail: "One-time migration of 2.1M rows with validation and rollback plan.", qty: 1, unit: 4800.0 },
  { sku: "SUP-401", name: "Priority support retainer", detail: "Monthly retainer, 4-hour response window, dedicated Slack channel.", qty: 3, unit: 950.0 },
  { sku: "EXP-501", name: "Travel & expenses", detail: "Airfare, lodging, and ground transport for the onsite workshop, at cost.", qty: 1, unit: 1638.42 },
];

export function makeItems(multiplier = 1) {
  const out = [];
  for (let m = 0; m < multiplier; m++) {
    for (const it of BASE_ITEMS) {
      out.push({ ...it, sku: multiplier === 1 ? it.sku : `${it.sku}-${m + 1}` });
    }
  }
  return out;
}

export const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function totals(items) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unit, 0);
  const tax = subtotal * 0.07;
  return { subtotal, tax, total: subtotal + tax };
}

export const COMPANY = {
  name: "Meridian Systems LLC",
  addr1: "2201 Biscayne Blvd, Suite 400",
  addr2: "Miami, FL 33137",
  email: "billing@meridiansystems.example",
};

export const BILL_TO = {
  name: "Harborline Logistics Inc.",
  contact: "Attn: Dana Whitfield, AP",
  addr1: "780 Port Center Drive",
  addr2: "Savannah, GA 31401",
};

export const META = {
  number: "INV-2026-0147",
  date: "August 17, 2026",
  due: "September 16, 2026",
  terms: "Net 30",
};

// Shared invoice data used by BOTH engine implementations.

export type LineItem = {
  sku: string;
  description: string;
  detail: string;
  qty: number;
  unitPrice: number;
};

const BASE_ITEMS: LineItem[] = [
  { sku: "SKU-1001", description: "Cloud compute credits", detail: "Reserved c7g.xlarge, us-east-1, 730 hrs", qty: 4, unitPrice: 118.4 },
  { sku: "SKU-1002", description: "Object storage", detail: "Standard tier, 12 TB-month", qty: 12, unitPrice: 23.55 },
  { sku: "SKU-1003", description: "Managed Postgres", detail: "db.r6g.large, multi-AZ, 730 hrs", qty: 2, unitPrice: 342.0 },
  { sku: "SKU-1004", description: "CDN egress", detail: "North America + EU, 8.2 TB", qty: 8, unitPrice: 71.25 },
  { sku: "SKU-1005", description: "Log ingestion", detail: "Structured logs, 950 GB indexed", qty: 1, unitPrice: 1140.0 },
  { sku: "SKU-1006", description: "Support plan", detail: "Business tier, monthly", qty: 1, unitPrice: 500.0 },
  { sku: "SKU-1007", description: "GPU inference", detail: "L40S spot, 312 GPU-hrs", qty: 312, unitPrice: 1.87 },
  { sku: "SKU-1008", description: "Email delivery", detail: "Transactional, 480k sends", qty: 48, unitPrice: 9.8 },
  { sku: "SKU-1009", description: "DNS zones", detail: "24 hosted zones + 41M queries", qty: 24, unitPrice: 3.5 },
  { sku: "SKU-1010", description: "Secrets manager", detail: "1,180 secrets, API ops included", qty: 118, unitPrice: 0.4 },
  { sku: "SKU-1011", description: "Container registry", detail: "Private repos, 640 GB stored", qty: 64, unitPrice: 2.1 },
  { sku: "SKU-1012", description: "SSO seats", detail: "SAML/OIDC, 85 seats", qty: 85, unitPrice: 6.0 },
];

/** k=1 -> the 12-row two-page invoice; larger k multiplies line items. */
export function makeItems(k: number): LineItem[] {
  const out: LineItem[] = [];
  for (let i = 0; i < k; i++) {
    for (const it of BASE_ITEMS) {
      out.push(i === 0 ? it : { ...it, sku: `${it.sku}-${i}` });
    }
  }
  return out;
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function totals(items: LineItem[]) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = subtotal * 0.07;
  return { subtotal, tax, total: subtotal + tax };
}

export const COMPANY = {
  name: "Acme Supply Co.",
  address: "500 Brickell Ave, Suite 2200, Miami, FL 33131",
  invoiceNo: "INV-2026-0817",
  date: "August 17, 2026",
  due: "September 16, 2026",
};

export const BILL_TO = {
  name: "Northwind Robotics LLC",
  contact: "Accounts Payable",
  address1: "77 Summer St, Floor 4",
  address2: "Boston, MA 02110",
  email: "ap@northwindrobotics.example",
};

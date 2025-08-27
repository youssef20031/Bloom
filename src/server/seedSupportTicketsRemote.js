import axios from 'axios';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

// Reuse the dataset from setupSupportDemoData by dynamic import (so we have a single source of truth)
// Fallback: if import fails, instruct user.
async function loadDataset() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const datasetPath = path.join(__dirname, 'supportTicketsDataset.json');
  try {
    const raw = fs.readFileSync(datasetPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[seedSupportTicketsRemote] Cannot read dataset file at', datasetPath);
    throw e;
  }
}

const BASE_URL = process.env.SEED_BASE_URL || 'https://bloom-871375843448.europe-west1.run.app';
const DRY_RUN = process.env.DRY_RUN === '1';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function fetchExistingUsersByEmail() {
  // No bulk endpoint by email; we'll lazily cache per lookup.
  return new Map();
}

async function getUserByEmail(email) {
  try { const res = await axios.get(`${BASE_URL}/api/users/email/${encodeURIComponent(email)}`); return res.data; }
  catch (e) { if (e.response && e.response.status === 404) return null; throw e; }
}
async function createUser(name, email) { const res = await axios.post(`${BASE_URL}/api/users`, { name, email, password: 'demo123', role: 'customer' }); return res.data; }
async function fetchCustomers() { const res = await axios.get(`${BASE_URL}/api/customers`); return res.data; }
async function createCustomer(userId, companyName) { const res = await axios.post(`${BASE_URL}/api/customers`, { userId, companyName, contactPerson: companyName }); return res.data; }
async function fetchExistingTickets() { const res = await axios.get(`${BASE_URL}/api/support-ticket`); return res.data; }
function normalizeDateKey(dmy) { const [dd, mm, yyyy] = dmy.split('/'); return `${yyyy}-${mm}-${dd}`; }
async function createTicket(customerId, row) { const payload = { customerId, issue: row.subject, status: row.status, createdAt: row.createdAt }; const res = await axios.post(`${BASE_URL}/api/support-ticket`, payload); return res.data.ticket; }

export async function main() {
  console.log(`[seedSupportTicketsRemote] Start (dryRun=${DRY_RUN}) BASE_URL=${BASE_URL}`);
  let dataset;
  try { dataset = await loadDataset(); } catch (e) { console.error('Failed to load dataset', e); process.exit(1); }
  console.log(`Dataset size: ${dataset.length}`);
  let customers;
  try { customers = await fetchCustomers(); } catch (e) { console.error('Failed to fetch customers. Is the API reachable?', e.message); process.exit(1); }
  const customerByCompany = new Map(customers.map(c => [c.companyName, c]));
  let existingTickets = [];
  try { existingTickets = await fetchExistingTickets(); } catch (e) { console.warn('Could not fetch existing tickets (continuing):', e.message); }
  const ticketKeySet = new Set();
  for (const t of existingTickets) {
    try {
      const companyName = t.customerId?.companyName || 'UNKNOWN';
      const date = new Date(t.createdAt);
      const key = `${companyName}|${t.issue}|${t.status}|${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      ticketKeySet.add(key);
    } catch { /* ignore malformed */ }
  }
  let created = 0, skipped = 0, errors = 0, usersCreated = 0, customersCreated = 0;
  const userCache = new Map();
  const queue = [...dataset];
  async function worker() {
    while (queue.length) {
      const row = queue.shift();
      const dateKey = normalizeDateKey(row.createdAt);
      const ticketKey = `${row.name}|${row.subject}|${row.status}|${dateKey}`;
      if (ticketKeySet.has(ticketKey)) { skipped++; continue; }
      try {
        let user = userCache.get(row.email);
        if (!user) {
          user = await getUserByEmail(row.email);
          if (!user) {
            if (!DRY_RUN) user = await createUser(row.name, row.email); else user = { _id: 'dry-run-user' };
            usersCreated++;
          }
          userCache.set(row.email, user);
        }
        let customer = customerByCompany.get(row.name);
        if (!customer) {
          if (!DRY_RUN) customer = await createCustomer(user._id, row.name); else customer = { _id: 'dry-run-customer', companyName: row.name };
          customersCreated++;
          customerByCompany.set(row.name, customer);
        }
        if (!DRY_RUN) await createTicket(customer._id, row);
        created++;
        ticketKeySet.add(ticketKey);
        if ((created + skipped + errors) % 50 === 0) {
            console.log(`Progress: created=${created} skipped=${skipped} errors=${errors}`);
        }
      } catch (e) {
        errors++;
        console.error('Row error', row.name, row.subject, e.response?.status, e.response?.data || e.message);
        await sleep(200);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('Summary:', { created, skipped, errors, usersCreated, customersCreated, dataset: dataset.length, dryRun: DRY_RUN });
}

// Always execute when run directly (import.meta.url reliable across platforms)
if (process.argv[1] && path.basename(process.argv[1]) === path.basename(new URL(import.meta.url).pathname)) {
  main().catch(e => { console.error('Fatal error', e); process.exit(1); });
}

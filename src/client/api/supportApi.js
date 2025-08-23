// API utility for support tickets
const BASE_URL = '/api/support-ticket';

export async function listSupportTickets() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error('Failed to fetch support tickets');
  return res.json();
}

export async function createSupportTicket(data) {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create support ticket');
  return res.json();
}

export async function getSupportTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}`);
  if (!res.ok) throw new Error('Failed to fetch ticket details');
  return res.json();
}

export async function addTicketMessage(ticketId, message) {
  const res = await fetch(`${BASE_URL}/${ticketId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to add message');
  return res.json();
}

export async function updateTicketStatus(ticketId, status) {
  const res = await fetch(`${BASE_URL}/${ticketId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function assignSupportAgent(ticketId, agentId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  });
  if (!res.ok) throw new Error('Failed to assign agent');
  return res.json();
}

export async function deleteSupportTicket(ticketId) {
  const res = await fetch(`${BASE_URL}/${ticketId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete ticket');
  return res.json();
}

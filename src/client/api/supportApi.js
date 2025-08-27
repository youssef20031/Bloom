// API utility for support tickets
const BASE_URL = '/api/support-ticket';
const CHANGE_REQ_BASE = '/api/request-change';

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

export async function addTicketMessage(ticketId, message, authorId) {
  const res = await fetch(`${BASE_URL}/${ticketId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, authorId })
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

export async function submitChangeRequest(ticketId, tag, description, authorId, { addHistoryMessage = true } = {}) {
  // Ensure tag matches backend enum (ai, dc)
  const normalizedTag = (tag || '').toLowerCase();
  if (!['ai', 'dc'].includes(normalizedTag)) {
    throw new Error('Tag must be AI or DC');
  }
  // Create dedicated RequestChange document
  const res = await fetch(`${CHANGE_REQ_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supportTicketId: ticketId, tag: normalizedTag, description })
  });
  if (!res.ok) {
    const errJson = await res.json().catch(()=>({}));
    throw new Error(errJson.message || 'Failed to create change request');
  }
  const data = await res.json();

  // Optionally also append a readable history message to the support ticket
  if (addHistoryMessage) {
    const safeDesc = description && description.trim() ? description : 'N/A';
    const message = `[Change Request]\nTag: ${normalizedTag}\nDescription: ${safeDesc}\nRequestChangeId: ${data.requestChange?._id || ''}`;
    try {
      await addTicketMessage(ticketId, message, authorId);
    } catch (e) {
      // Non-fatal: surface a warning but still return the created change request
      console.warn('Change Request created but failed to append ticket message:', e);
    }
  }
  return data.requestChange;
}

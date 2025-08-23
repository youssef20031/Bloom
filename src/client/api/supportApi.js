// API utility for support tickets
const BASE_URL = '/api/customers/tickets';

export async function getCustomerTickets(customerId) {
  const res = await fetch(`${BASE_URL}/${customerId}`);
  if (!res.ok) throw new Error('Failed to fetch support tickets');
  return res.json();
}

// Add more functions as needed for creating tickets, adding messages, etc.


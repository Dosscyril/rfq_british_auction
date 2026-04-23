const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data;
}
// RFQs
export const listRFQs   = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString();
  return request(`/rfqs${qs ? '?' + qs : ''}`);
};
export const getRFQ     = (id) => request(`/rfqs/${id}`);
export const createRFQ  = (body) => request('/rfqs', { method: 'POST', body: JSON.stringify(body) });
export const submitBid  = (rfqId, body) =>
  request(`/rfqs/${rfqId}/bids`, { method: 'POST', body: JSON.stringify(body) });
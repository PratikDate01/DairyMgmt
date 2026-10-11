const API_BASE_URL = 'http://localhost:5000/api/complaints';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const complaintService = {
  async submitComplaint(token, { title, description, category }) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ title, description, category })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to submit complaint');
    return data;
  },

  async getMyComplaints(token) {
    const response = await fetch(`${API_BASE_URL}/my`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch complaints');
    return data;
  }
};

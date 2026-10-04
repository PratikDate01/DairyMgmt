const API_BASE_URL = 'http://localhost:5000/api/veterinarian';

export const veterinarianService = {
  async getCases(token, status = 'all') {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${API_BASE_URL}/cases${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch veterinarian case queue.');
    }
    return data.data || [];
  },

  async getCaseById(id, token) {
    const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch case detail.');
    }
    return data.data;
  },

  async reviewCase(id, reviewData, token) {
    const response = await fetch(`${API_BASE_URL}/cases/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit case review.');
    }
    return data;
  }
};

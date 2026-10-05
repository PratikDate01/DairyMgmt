const API_BASE_URL = 'http://localhost:5000/api/vet-requests';

export const vetRequestService = {
  async createVetRequest(requestData, token) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send veterinarian consultation request.');
    }
    return data;
  },

  async getFarmerRequests(token) {
    const response = await fetch(`${API_BASE_URL}/farmer`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch your veterinarian requests.');
    }
    return data.data || [];
  },

  async getVeterinarianRequests(token, status = 'all') {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${API_BASE_URL}/veterinarian${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch incoming consultation requests.');
    }
    return data.data || [];
  },

  async getVetRequestById(id, token) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch request detail.');
    }
    return data.data;
  },

  async acceptVetRequest(id, token) {
    const response = await fetch(`${API_BASE_URL}/${id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept consultation request.');
    }
    return data;
  },

  async rejectVetRequest(id, rejectionReason, token) {
    const response = await fetch(`${API_BASE_URL}/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rejectionReason })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject consultation request.');
    }
    return data;
  },

  async escalateVetRequest(id, force = false, token) {
    const response = await fetch(`${API_BASE_URL}/${id}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ force })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to escalate veterinarian request.');
    }
    return data;
  }
};

const API_BASE_URL = 'http://localhost:5000/api/dairy-connections';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const dairyFarmerService = {
  async searchFarmer(phone, token) {
    const response = await fetch(`${API_BASE_URL}/search-farmer?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Farmer not found');
    }
    return data.farmer;
  },

  async requestConnection(farmerPhone, token) {
    const response = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ farmerPhone })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send connection request');
    }
    return data;
  },

  async getDairyFarmers(token) {
    const response = await fetch(`${API_BASE_URL}/dairy-farmers`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch connected farmers');
    }
    return data.connections;
  },

  async getFarmerDairies(token) {
    const response = await fetch(`${API_BASE_URL}/farmer-dairies`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch dairy connections');
    }
    return data.connections;
  },

  async acceptConnection(connectionId, token) {
    const response = await fetch(`${API_BASE_URL}/${connectionId}/accept`, {
      method: 'PATCH',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept connection');
    }
    return data;
  },

  async rejectConnection(connectionId, token) {
    const response = await fetch(`${API_BASE_URL}/${connectionId}/reject`, {
      method: 'PATCH',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject connection');
    }
    return data;
  },

  async disconnectConnection(connectionId, token) {
    const response = await fetch(`${API_BASE_URL}/${connectionId}/disconnect`, {
      method: 'PATCH',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to disconnect relationship');
    }
    return data;
  }
};

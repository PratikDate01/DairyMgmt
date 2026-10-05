const API_BASE_URL = 'http://localhost:5000/api/cattle';

export const cattleService = {
  async getFarmerCattle(token, farmerId = '') {
    const url = farmerId ? `${API_BASE_URL}?farmerId=${farmerId}` : API_BASE_URL;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch cattle records');
    }
    return data;
  },

  async getCattleById(token, id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch cattle details');
    }
    return data.cattle;
  },

  async createCattle(token, cattleData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cattleData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register cattle record');
    }
    return data;
  },

  async updateCattle(token, id, cattleData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cattleData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update cattle record');
    }
    return data;
  },

  async deleteCattle(token, id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete cattle record');
    }
    return data;
  }
};

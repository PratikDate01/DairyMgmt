const API_BASE_URL = 'http://localhost:5000/api/disease-scans';

export const diseaseScanService = {
  async createScan(scanData, token) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(scanData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to analyze disease scan.');
    }
    return data;
  },

  async getFarmerScans(token, cattleId = '') {
    const url = cattleId ? `${API_BASE_URL}?cattleId=${cattleId}` : API_BASE_URL;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch disease scan history.');
    }
    return data.data || [];
  },

  async getScanById(id, token) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch scan details.');
    }
    return data.data;
  },

  async getRecommendedVeterinarians(scanId, token) {
    const response = await fetch(`${API_BASE_URL}/${scanId}/recommended-veterinarians`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch recommended veterinarians.');
    }
    return data;
  }
};

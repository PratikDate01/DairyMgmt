const API_BASE_URL = 'http://localhost:5000/api/cattle';

const parseResponse = async (response, fallbackMsg) => {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned status ${response.status} (${response.statusText || fallbackMsg})`);
  }
  if (!response.ok) {
    throw new Error(data?.message || fallbackMsg);
  }
  return data;
};

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
    return parseResponse(response, 'Failed to fetch cattle records');
  },

  async getCattleById(token, id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await parseResponse(response, 'Failed to fetch cattle details');
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
    return parseResponse(response, 'Failed to register cattle record');
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
    return parseResponse(response, 'Failed to update cattle record');
  },

  async deleteCattle(token, id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return parseResponse(response, 'Failed to delete cattle record');
  }
};

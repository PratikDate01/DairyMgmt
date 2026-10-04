const API_BASE_URL = 'http://localhost:5000/api/milk-collections';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const milkCollectionService = {
  async createCollection(collectionData, token) {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(collectionData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to record milk collection');
    }
    return data;
  },

  async getDairyOwnerCollections(token, queryParams = {}) {
    const query = new URLSearchParams();
    if (queryParams.farmerId) query.append('farmerId', queryParams.farmerId);
    if (queryParams.date) query.append('date', queryParams.date);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/dairy-owner${queryString}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch milk collections');
    }
    return data;
  },

  async getFarmerCollections(token) {
    const response = await fetch(`${API_BASE_URL}/farmer`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch milk collections');
    }
    return data;
  },

  async getFarmerCollectionsForDairy(farmerId, token) {
    const response = await fetch(`${API_BASE_URL}/farmer/${farmerId}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch farmer collection history');
    }
    return data;
  }
};

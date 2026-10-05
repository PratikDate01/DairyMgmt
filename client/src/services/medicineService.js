const API_BASE_URL = 'http://localhost:5000/api/medicines';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const medicineService = {
  async createMedicine(medicineData, token) {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(medicineData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add medicine');
    }
    return data;
  },

  async getMyMedicines(token, params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.availability) query.append('availability', params.availability);
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    if (params.lowStock !== undefined) query.append('lowStock', params.lowStock);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/my${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch inventory');
    }
    return data;
  },

  async getAvailableMedicines(token, params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/available${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch available medicine catalog');
    }
    return data;
  },

  async getMedicineById(medicineId, token) {
    const response = await fetch(`${API_BASE_URL}/${medicineId}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medicine details');
    }
    return data;
  },

  async updateMedicine(medicineId, updateData, token) {
    const response = await fetch(`${API_BASE_URL}/${medicineId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update medicine details');
    }
    return data;
  },

  async updateStock(medicineId, stockQuantity, token) {
    const response = await fetch(`${API_BASE_URL}/${medicineId}/stock`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ stockQuantity })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update stock');
    }
    return data;
  },

  async updateAvailability(medicineId, availability, token) {
    const response = await fetch(`${API_BASE_URL}/${medicineId}/availability`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ availability })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update availability status');
    }
    return data;
  },

  async deactivateMedicine(medicineId, token) {
    const response = await fetch(`${API_BASE_URL}/${medicineId}/deactivate`, {
      method: 'PATCH',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to deactivate medicine');
    }
    return data;
  },

  async getInventorySummary(token) {
    const response = await fetch(`${API_BASE_URL}/summary`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch inventory summary');
    }
    return data;
  },

  async getLowStockMedicines(token) {
    const response = await fetch(`${API_BASE_URL}/low-stock`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch low stock items');
    }
    return data;
  },

  async processPrescription(token, payload) {
    const response = await fetch(`${API_BASE_URL}/process-prescription`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to process prescription.');
    }
    return data;
  }
};

const API_BASE_URL = 'http://localhost:5000/api/reports';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const reportService = {
  async getMilkSummary(token, params = {}) {
    const query = new URLSearchParams();
    if (params.preset) query.append('preset', params.preset);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.farmerId) query.append('farmerId', params.farmerId);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/milk-summary${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch milk collection report summary');
    }
    return data;
  },

  async getPaymentSummary(token, params = {}) {
    const query = new URLSearchParams();
    if (params.preset) query.append('preset', params.preset);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.farmerId) query.append('farmerId', params.farmerId);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/payment-summary${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment report summary');
    }
    return data;
  },

  async getFarmerSummary(token) {
    const response = await fetch(`${API_BASE_URL}/farmer-summary`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch farmer performance summary');
    }
    return data;
  },

  async getDateWiseMilk(token, params = {}) {
    const query = new URLSearchParams();
    if (params.preset) query.append('preset', params.preset);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.farmerId) query.append('farmerId', params.farmerId);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/date-wise-milk${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch date-wise milk collection report');
    }
    return data;
  },

  async getDateWisePayments(token, params = {}) {
    const query = new URLSearchParams();
    if (params.preset) query.append('preset', params.preset);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/date-wise-payments${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch date-wise payment report');
    }
    return data;
  },

  async getDashboardSummary(token) {
    const response = await fetch(`${API_BASE_URL}/dashboard-summary`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch system dashboard summary');
    }
    return data;
  }
};

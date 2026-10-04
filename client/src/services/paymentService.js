const API_BASE_URL = 'http://localhost:5000/api/payments';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const paymentService = {
  async getUnpaidCollections(farmerId, startDate, endDate, token) {
    const params = new URLSearchParams({ farmerId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/unpaid-collections?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch unpaid collections');
    }
    return data;
  },

  async previewSettlement(farmerId, collectionIds, token) {
    const response = await fetch(`${API_BASE_URL}/preview`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ farmerId, collectionIds })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to calculate settlement preview');
    }
    return data;
  },

  async createPayment(paymentData, token) {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(paymentData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment settlement');
    }
    return data;
  },

  async getDairyOwnerPayments(token, filters = {}) {
    const params = new URLSearchParams();
    if (filters.farmerId) params.append('farmerId', filters.farmerId);
    if (filters.status) params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/dairy-owner${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment history');
    }
    return data;
  },

  async getFarmerPayments(token) {
    const response = await fetch(`${API_BASE_URL}/farmer`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment history');
    }
    return data;
  },

  async getPaymentDetails(paymentId, token) {
    const response = await fetch(`${API_BASE_URL}/${paymentId}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment details');
    }
    return data;
  },

  async updatePaymentStatus(paymentId, updateData, token) {
    const response = await fetch(`${API_BASE_URL}/${paymentId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(updateData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update payment status');
    }
    return data;
  }
};

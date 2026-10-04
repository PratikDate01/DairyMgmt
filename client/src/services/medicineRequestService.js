const API_BASE_URL = 'http://localhost:5000/api/medicine-requests';

const getHeaders = (token) => {
  const authToken = token || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };
};

export const createMedicineRequest = async (requestData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(requestData)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to create medicine request');
    error.response = { data };
    throw error;
  }
  return data;
};

export const getMyMedicineRequests = async (params = {}, token) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/my${queryStr}`, {
    method: 'GET',
    headers: getHeaders(token)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch requests');
    error.response = { data };
    throw error;
  }
  return data;
};

export const getMyMedicineRequestById = async (requestId, token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}`, {
    method: 'GET',
    headers: getHeaders(token)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch request details');
    error.response = { data };
    throw error;
  }
  return data;
};

export const getProviderMedicineRequests = async (params = {}, token) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/provider${queryStr}`, {
    method: 'GET',
    headers: getHeaders(token)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch provider requests');
    error.response = { data };
    throw error;
  }
  return data;
};

export const getProviderRequestsSummary = async (token) => {
  const response = await fetch(`${API_BASE_URL}/provider/summary`, {
    method: 'GET',
    headers: getHeaders(token)
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch summary stats');
    error.response = { data };
    throw error;
  }
  return data;
};

export const acceptMedicineRequest = async (requestId, providerRemarks = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/accept`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ providerRemarks })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to accept medicine request');
    error.response = { data };
    throw error;
  }
  return data;
};

export const rejectMedicineRequest = async (requestId, providerRemarks = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/reject`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ providerRemarks })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to reject medicine request');
    error.response = { data };
    throw error;
  }
  return data;
};

export const packMedicineRequest = async (requestId, providerRemarks = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/pack`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ providerRemarks })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to pack medicine request');
    error.response = { data };
    throw error;
  }
  return data;
};

export const readyMedicineRequest = async (requestId, providerRemarks = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/ready`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ providerRemarks })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to mark request ready');
    error.response = { data };
    throw error;
  }
  return data;
};

export const completeMedicineRequest = async (requestId, providerRemarks = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/complete`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ providerRemarks })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to complete request');
    error.response = { data };
    throw error;
  }
  return data;
};

export const cancelMedicineRequest = async (requestId, reason = '', token) => {
  const response = await fetch(`${API_BASE_URL}/${requestId}/cancel`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ reason })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to cancel request');
    error.response = { data };
    throw error;
  }
  return data;
};

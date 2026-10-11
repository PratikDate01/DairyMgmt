const API_BASE_URL = 'http://localhost:5000/api/admin';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const adminService = {
  // 1. Overview Stats
  async getOverviewStats(token) {
    const response = await fetch(`${API_BASE_URL}/overview-stats`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch overview stats');
    return data;
  },

  // 2. User Directory & Management
  async getUsers(token, params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.verificationStatus) query.append('verificationStatus', params.verificationStatus);
    if (params.search) query.append('search', params.search);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/users${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
    return data;
  },

  async toggleUserStatus(token, userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to toggle user status');
    return data;
  },

  async updateUserVerification(token, userId, { status, notes, licenseNumber }) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/verification`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, notes, licenseNumber })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update verification status');
    return data;
  },

  // 3. Cattle Records
  async getCattle(token, params = {}) {
    const query = new URLSearchParams();
    if (params.healthStatus) query.append('healthStatus', params.healthStatus);
    if (params.search) query.append('search', params.search);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/cattle${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch cattle records');
    return data;
  },

  // 4. Veterinary Requests
  async getVetRequests(token, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.riskLevel) query.append('riskLevel', params.riskLevel);
    if (params.search) query.append('search', params.search);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/vet-requests${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch veterinary requests');
    return data;
  },

  // 5. Medicines
  async getMedicines(token, params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.availability) query.append('availability', params.availability);
    if (params.search) query.append('search', params.search);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/medicines${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch medicines');
    return data;
  },

  // 6. Fodder Listings
  async getFodderListings(token, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.fodderType) query.append('fodderType', params.fodderType);
    if (params.search) query.append('search', params.search);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/fodder-listings${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch fodder listings');
    return data;
  },

  async moderateFodderListing(token, listingId, status) {
    const response = await fetch(`${API_BASE_URL}/fodder-listings/${listingId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to moderate fodder listing');
    return data;
  },

  // 7. Complaints
  async getComplaints(token, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/complaints${queryStr}`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch complaints');
    return data;
  },

  async updateComplaintStatus(token, complaintId, { status, adminNotes }) {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, adminNotes })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update complaint');
    return data;
  }
};

const API_BASE_URL = 'http://localhost:5000/api/auth';

export const authService = {
  async register(name, phone, role) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, phone, role })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  async requestOTP(identity) {
    const response = await fetch(`${API_BASE_URL}/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: identity })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to request OTP');
    }
    return data;
  },

  async verifyOTP(identity, otp) {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: identity, otp })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }
    return data;
  },

  async getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Session expired');
    }
    return data.user;
  }
};

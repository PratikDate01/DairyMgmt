const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fodderListingService = {
  /**
   * Fetch active marketplace listings with optional fodderType and search filters
   */
  getMarketplaceListings: async (token, { fodderType = 'All', search = '' } = {}) => {
    try {
      const params = new URLSearchParams();
      if (fodderType && fodderType !== 'All') params.append('fodderType', fodderType);
      if (search && search.trim()) params.append('search', search.trim());

      const url = `${API_URL}/fodder-listings${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch fodder marketplace listings');
      return data;
    } catch (err) {
      console.error('getMarketplaceListings error:', err);
      throw err;
    }
  },

  /**
   * Fetch listings created by the authenticated farmer
   */
  getFarmerListings: async (token) => {
    try {
      const res = await fetch(`${API_URL}/fodder-listings/farmer`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch your fodder listings');
      return data;
    } catch (err) {
      console.error('getFarmerListings error:', err);
      throw err;
    }
  },

  /**
   * Fetch details of a single listing
   */
  getListingById: async (token, id) => {
    try {
      const res = await fetch(`${API_URL}/fodder-listings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch listing details');
      return data;
    } catch (err) {
      console.error('getListingById error:', err);
      throw err;
    }
  },

  /**
   * Create a new fodder listing
   */
  createListing: async (token, listingData) => {
    try {
      const res = await fetch(`${API_URL}/fodder-listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(listingData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create fodder listing');
      return data;
    } catch (err) {
      console.error('createListing error:', err);
      throw err;
    }
  },

  /**
   * Update an existing fodder listing
   */
  updateListing: async (token, id, listingData) => {
    try {
      const res = await fetch(`${API_URL}/fodder-listings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(listingData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update fodder listing');
      return data;
    } catch (err) {
      console.error('updateListing error:', err);
      throw err;
    }
  },

  /**
   * Delete a fodder listing
   */
  deleteListing: async (token, id) => {
    try {
      const res = await fetch(`${API_URL}/fodder-listings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete fodder listing');
      return data;
    } catch (err) {
      console.error('deleteListing error:', err);
      throw err;
    }
  }
};

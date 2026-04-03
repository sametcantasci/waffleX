import axios from 'axios';

// Get current base URL (useful for dev vs prod)
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetches IP, Country, and ISP information from the backend proxy
 * @param {string} proxyUrl - Optional HTTP proxy string to route the check through
 * @returns {Promise<Object>} The IP information object
 */
export const fetchIpInfo = async (proxyUrl = '') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/check-ip`, { proxyUrl });
    
    if (response.data.status === 'success') {
       return {
           ip: response.data.query,
           country: response.data.country,
           countryCode: response.data.countryCode,
           isp: response.data.isp,
           timezone: response.data.timezone
       };
    } else {
        throw new Error(response.data.message || 'Failed to fetch IP details');
    }
  } catch (error) {
    console.error("fetchIpInfo Error:", error);
    // Return a structured error object so the UI can display it
    return {
        error: error.response?.data?.message || error.message || "Network Error",
        ip: "Unknown",
        country: "Unknown",
        countryCode: "XX",
        isp: "Unknown"
    };
  }
};

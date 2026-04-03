import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Sends a single request variant through the backend relay for analysis
 */
export const sendProxyRequest = async ({ targetUrl, method, headers, cookies, payload }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/proxy`, {
            targetUrl,
            method,
            headers,
            cookies,
            payload
        });
        
        // The backend intercepts errors to ensure they are returned with a status code
        // instead of throwing an uncatchable exception
        return response.data;
    } catch (error) {
        // This catch block mainly handles errors communicating with our own backend
        console.error("Proxy Request Error:", error);
         return {
             status: 0,
             latency: 0,
             error: error.message,
             isHardError: true
         };
    }
}

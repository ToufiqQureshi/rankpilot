
// Ye file centralized API calling ke liye hai.
// Hardcoded URLs avoid karne ke liye.

const API_BASE_URL = "http://127.0.0.1:8000/api";

export const API_ENDPOINTS = {
    CHAT: `${API_BASE_URL}/chat`,
    SESSIONS: (userId) => `${API_BASE_URL}/sessions/${userId}`,
    HISTORY: (sessionId) => `${API_BASE_URL}/history/${sessionId}`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    BRAND_VOICES: `${API_BASE_URL}/brand-voices`,
    REPORTS: `${API_BASE_URL}/reports`
};

export async function fetchJson(url, options = {}) {
    // 1. Get Token
    const token = localStorage.getItem('auth_token');

    // 2. Attach Headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        // Auto Logout if token invalid
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }
    return response.json();
}

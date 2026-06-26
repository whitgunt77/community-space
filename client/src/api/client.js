import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Response interceptor – normalise error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong.';
    return Promise.reject(new Error(message));
  }
);

export default api;
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (
  import.meta.env.DEV ? "http://localhost:5000" : window.location.origin
);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

export default api;

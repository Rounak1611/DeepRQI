import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({ baseURL });

// Attach the JWT to every request once the user is logged in.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("deeprqi_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email, password) {
  const { data } = await client.post("/api/auth/login", { email, password });
  return data;
}

export async function register(name, email, password) {
  const { data } = await client.post("/api/auth/register", { name, email, password });
  return data;
}

export async function uploadImage(file, meta) {
  const form = new FormData();
  form.append("file", file);
  form.append("roadName", meta.roadName);
  if (meta.city) form.append("city", meta.city);
  if (meta.district) form.append("district", meta.district);
  if (meta.state) form.append("state", meta.state);
  if (meta.lat) form.append("lat", meta.lat);
  if (meta.lng) form.append("lng", meta.lng);

  const { data } = await client.post("/api/images/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getRoads() {
  const { data } = await client.get("/api/roads");
  return data;
}

export async function getDashboardStats() {
  const { data } = await client.get("/api/dashboard/stats");
  return data;
}

export async function getRoad(id) {
  const { data } = await client.get(`/api/roads/${id}`);
  return data;
}

export default client;

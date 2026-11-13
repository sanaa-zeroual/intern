import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

export async function authenticateUser(
  email: string,
  password: string
) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}
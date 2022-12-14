import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

export const apis = {
  fetchPlanet: () => api.get(`/planets`),
};

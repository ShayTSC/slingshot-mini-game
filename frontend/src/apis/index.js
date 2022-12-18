import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080",
});

export const apis = {
  fetchPlanet: () => instance.get(`/planets`),
  fetchAsteroids: () => instance.get(`/asteroids`),
  fetchMiners: () => instance.get(`/miners`),
  fetchMinerByName: (name) =>
    instance.get(`/miners`, {
      params: {
        name,
      },
    }),
  /**
   * Fetch miners by planet id
   * @param {array} id Array of planet id
   * @returns {array} miners
   */
  fetchMinerByPlanetId: (id) => {
    return instance.get(`/miners`, {
      params: {
        planetId: JSON.stringify(id),
      },
    });
  },
  fetchHistoryByMinerId: (id) => instance.get(`/history/${id}`),
  createMiner: (props) => instance.post(`/miners`, props),
};

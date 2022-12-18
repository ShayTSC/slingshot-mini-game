import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080",
});

export const apis = {
  fetchPlanet: () => instance.get(`/planets`),
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
  createMiner: (props) => instance.post(`/miners`, props),
};

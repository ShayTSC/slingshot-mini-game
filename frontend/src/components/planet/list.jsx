/**
 * List of planets
 */

import React, { useEffect, useState, useReducer } from "react";
import Rodal from "rodal";
import PopupContent from "./popup.jsx";
import CreateMinerForm from "./createMiner.jsx";
import Loader from "../layout/loader.jsx";
import { apis } from "../../apis/index.js";
import { subject } from "../layout/app.jsx";

function PlanetList() {
  const [state, setState] = useState({
    popupVisible: false,
    formVisible: false,
    loading: false,
  });
  // const [planets, setPlanets] = useState([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState(0);
  const [planets, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "update":
        const index = state.findIndex(
          (planet) => planet.name === action.planet.name
        );
        if (index !== -1) {
          console.debug("Planet updated", action.planet);
          const newPlanets = [...state];
          newPlanets[index] = Object.assign(
            {},
            newPlanets[index],
            action.planet
          );
          return newPlanets;
        }
        return state;
      default:
        return action.planets;
    }
  }, []);

  // Show planet popup
  const showPopup = function (id) {
    setSelectedPlanetId(id);

    setState({
      ...state,
      popupVisible: true,
    });
  };

  // Hide planet popup
  const hidePopup = function () {
    setState({
      ...state,
      popupVisible: false,
    });
  };

  // Show create miner form popup
  const showForm = function (e, id) {
    e.stopPropagation();
    setState({
      ...state,
      formVisible: true,
    });
  };

  // Hide create miner form popup
  const hideForm = function () {
    setState({
      ...state,
      formVisible: false,
    });
  };

  useEffect(() => {
    apis.fetchPlanet().then((planets) => {
      dispatch({
        planets: planets.data,
      });
    });
  }, []);

  useEffect(() => {
    const sub = subject.subscribe({
      next: (data) => {
        if (data.planet && data.action === "update") {
          const index = planets.data.findIndex(
            (planet) => Number(planet.id) === Number(data.planet.id)
          );
          if (index !== -1) {
            const newPlanets = [...planets.data];
            newPlanets[index] = Object.assign(
              {},
              newPlanets[index],
              data.planet
            );
            dispatch({
              type: "update",
              planets: newPlanets,
            });
          }
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Miners</th>
            <th>Minerals</th>
            <th>Position (x, y)</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {planets?.map((planet, i) => {
            return (
              <tr onClick={() => showPopup(planet.id)} key={i}>
                <td>Planet {planet.id}</td>
                <td>{planet.minersCount}</td>
                <td className={planet.minerals > 1000 ? "green" : ""}>
                  {planet.minerals}/1000
                </td>
                <td>{`(${planet.position.x},${planet.position.y})`}</td>
                <td>
                  <div
                    className="icon-addminer"
                    onClick={(e) => showForm(e, planet.id)}
                  >
                    Create a miner
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Rodal
        visible={state.popupVisible}
        onClose={hidePopup}
        width={550}
        height={480}
      >
        <h2>List of miners of Planet {selectedPlanetId}</h2>
        {state.loading ? (
          <Loader />
        ) : (
          <PopupContent planetId={selectedPlanetId} />
        )}
      </Rodal>

      <Rodal
        visible={state.formVisible}
        onClose={hideForm}
        width={440}
        height={480}
      >
        <h2>Create a miner</h2>
        <CreateMinerForm planetId={selectedPlanetId} />
      </Rodal>
    </div>
  );
}

export default PlanetList;

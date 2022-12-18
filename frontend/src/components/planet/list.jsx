/**
 * List of planets
 */

import React, { useEffect, useState } from "react";
import Rodal from "rodal";
import PopupContent from "./popup.jsx";
import CreateMinerForm from "./createMiner.jsx";
import Loader from "../layout/loader.jsx";
import { apis } from "../../apis/index.js";

function PlanetList() {
  const [state, setState] = useState({
    popupVisible: false,
    formVisible: false,
    loading: false,
  });
  const [planets, setPlanets] = useState([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState(0);

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
      setPlanets(planets.data);
    });
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

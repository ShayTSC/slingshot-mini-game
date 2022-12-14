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

  // Show planet popup
  const showPopup = function () {
    // If there is a timeout in progress, cancel it
    if (state.loaderTimeout) clearTimeout(state.loaderTimeout);

    setState({
      popupVisible: true,
      loading: true,
      loaderTimeout: setTimeout(() => {
        setState({
          loading: false,
        });
      }, 2000),
    });
  };

  // Hide planet popup
  const hidePopup = function () {
    setState({
      popupVisible: false,
    });
  };

  // Show create miner form popup
  const showForm = function (e) {
    e.stopPropagation();
    setState({
      formVisible: true,
    });
  };

  // Hide create miner form popup
  const hideForm = function () {
    setState({
      formVisible: false,
    });
  };

  useEffect(() => {
    apis.fetchPlanet().then((planets) => {
      console.log(planets);
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
          <tr onClick={showPopup}>
            <td>Planet 1</td>
            <td>3</td>
            <td>560/1000</td>
            <td>832, 635</td>
            <td></td>
          </tr>

          <tr onClick={showPopup}>
            <td>Planet 2</td>
            <td>3</td>
            <td className="green">1080/1000</td>
            <td>658, 136</td>
            <td>
              <div className="icon-addminer" onClick={showForm}>
                Create a miner
              </div>
            </td>
          </tr>

          <tr onClick={showPopup}>
            <td>Planet 3</td>
            <td>4</td>
            <td className="green">2650/1000</td>
            <td>168, 695</td>
            <td>
              <div className="icon-addminer" onClick={showForm}>
                Create a miner
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <Rodal
        visible={state.popupVisible}
        onClose={hidePopup}
        width="550"
        height="480"
      >
        <h2>List of miners of Planet 1</h2>
        {state.loading ? <Loader /> : <PopupContent />}
      </Rodal>

      <Rodal
        visible={state.formVisible}
        onClose={hideForm}
        width="440"
        height="480"
      >
        <h2>Create a miner</h2>
        <CreateMinerForm />
      </Rodal>
    </div>
  );
}

export default PlanetList;

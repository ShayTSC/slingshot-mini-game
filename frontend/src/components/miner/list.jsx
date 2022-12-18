/**
 * List of miners
 */

import React, { useEffect, useState } from "react";
import Rodal from "rodal";
import PopupContent from "./popup.jsx";
import { apis } from "../../apis/index.js";

export default function MinerList() {
  const [state, setState] = useState({
    popupVisible: false,
    loading: true,
  });
  const [selectedMiner, setSelectedMiner] = useState(0);
  const [miners, setMiners] = useState([]);

  const openPopup = function () {
    setState({
      ...state,
      popupVisible: true,
      loading: true,
    });
  };

  const hidePopup = function () {
    setState({
      ...state,
      popupVisible: false,
    });
  };

  useEffect(() => {
    apis.fetchMiners().then((miners) => {
      setMiners(miners.data);
    });
  }, []);

  return (
    <div className="list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Planet</th>
            <th>Carry capacity</th>
            <th>Travel speed</th>
            <th>Mining speed</th>
            <th>Position (x, y)</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {miners?.map((miner) => {
            return (
              <tr
                key={miner.id}
                onClick={() => {
                  setSelectedMiner(miner.id);
                  openPopup();
                }}
              >
                <td>{miner.name}</td>
                <td>{miner.planetId}</td>
                <td
                  className={
                    Number(miner.history.payload) ===
                    Number(miner.history.carryCapacity)
                      ? "green"
                      : ""
                  }
                >
                  {miner.history.payload}/{miner.carryCapacity}
                </td>
                <td>{miner.travelSpeed}</td>
                <td>{miner.miningSpeed}</td>
                <td>
                  {miner.history.metadata.position.x || 0},{" "}
                  {miner.history.metadata.position.y || 0}
                </td>
                <td>
                  {miner.history.state === 0 && <span>Idle</span>}
                  {miner.history.state === 1 && <span>Traveling</span>}
                  {miner.history.state === 2 && <span>Mining</span>}
                  {miner.history.state === 3 && <span>Transferring</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Rodal
        visible={state.popupVisible}
        onClose={() => hidePopup()}
        width="782"
        height="480"
      >
        <h2>History of Miner {selectedMiner}</h2>
        <PopupContent minerId={selectedMiner} />
      </Rodal>
    </div>
  );
}

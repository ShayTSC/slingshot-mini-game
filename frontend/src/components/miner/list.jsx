/**
 * List of miners
 */

import React, { useEffect, useState, useReducer } from "react";
import Rodal from "rodal";
import PopupContent from "./popup.jsx";
import { apis } from "../../apis/index.js";
import { subject } from "../layout/app.jsx";

export default function MinerList() {
  const [state, setState] = useState({
    popupVisible: false,
    loading: true,
  });
  const [selectedMiner, setSelectedMiner] = useState(0);
  // const [miners, setMiners] = useState([]);
  const [miners, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "update":
        const index = state.findIndex(
          (miner) => miner.id === action.miner.id
        );
        if (index !== -1) {
          console.debug("Miner updated", action.miner);
          const newMiners = [...state];
          newMiners[index] = Object.assign({}, newMiners[index], action.miner);
          return newMiners;
        }
        return state;
      default:
        return action.miners;
    }
  }, []);

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
      dispatch({
        miners: miners.data,
      });
      setState({
        ...state,
        loading: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = subject.subscribe({
      next: (data) => {
        if (data.miner && data.action === "update") {
          const index = miners.findIndex((miner) => miner.id === data.miner.id);
          if (index !== -1) {
            console.debug("Miner updated", data.miner);
            const merged = Object.assign({}, miners[index], data.miner);
            dispatch({
              type: "update",
              miner: merged,
            });
          }
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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

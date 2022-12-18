/**
 * Planet popup
 */

import React, { useEffect } from "react";
import { apis } from "../../apis";

export default function PlanetPopup(props) {
  const [miners, setMiners] = React.useState([]);

  useEffect(() => {
    if (props.planetId !== 0) {
      apis.fetchMinerByPlanetId([props.planetId]).then((miners) => {
        if (miners.data) setMiners(miners.data);
      });
    }
  }, [props]);

  return (
    <div className="scrollable">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Carry capacity</th>
            <th>Travel speed</th>
            <th>Mining speed</th>
            <th>Position (x, y)</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {miners &&
            miners.map((miner, i) => {
              return (
                <tr key={i}>
                  <td>{miner.name}</td>
                  <td
                    className={
                      Number(miner.history.payload) ===
                      Number(miner.carryCapacity)
                        ? "green"
                        : ""
                    }
                  >
                    {miner.history.payload}/{miner.carryCapacity}
                  </td>
                  <td>{miner.travelSpeed}</td>
                  <td>{miner.miningSpeed}</td>
                  <td>
                    ({miner.history.metadata.position?.x || 0},
                    {miner.history.metadata.position?.y || 0})
                  </td>
                  <td>
                    {miner.history.state === 0 && <span>Idel</span>}
                    {miner.history.state === 1 && <span>Traveling</span>}
                    {miner.history.state === 2 && <span>Mining</span>}
                    {miner.history.state === 3 && <span>Transferring</span>}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

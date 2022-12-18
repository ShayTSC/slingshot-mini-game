/**
 * Miner popup
 */

import React, { useEffect, useState } from "react";
import { apis } from "../../apis";
import dayjs from "dayjs";

export default function MinerPopop(props) {
  const [miners, setMiners] = useState([]);

  useEffect(() => {
    if (Number(props.minerId) !== 0) {
      apis.fetchHistoryByMinerId(props.minerId).then((miners) => {
        setMiners(miners.data);
      });
    }
  }, [props.minerId]);

  return (
    <div className="scrollable">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Year</th>
            <th>Planet</th>
            <th>Carry capacity</th>
            <th>Travel speed</th>
            <th>Mining speed</th>
            <th>Position (x, y)</th>
            <th
              style={{
                maxWidth: "80px",
              }}
            >
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {miners?.map((miner) => {
            return (
              <tr key={miner.id}>
                <td>{dayjs(miner.timestamp).format("YYYY-MM-DD HH:mm:ss")}</td>
                <td>{miner.year}</td>
                <td>{miner.planet}</td>
                <td
                  className={
                    Number(miner.payload) === Number(miner.carryCapacity)
                      ? "green"
                      : ""
                  }
                >
                  {miner.payload}/{miner.carryCapacity}
                </td>
                <td>{miner.travelSpeed}</td>
                <td>{miner.miningSpeed}</td>
                <td>
                  {miner.metadata.position.x}, {miner.metadata.position.y}
                </td>
                <td
                  style={{
                    maxWidth: "80px",
                  }}
                >
                  {miner.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * List of asteroids
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import { apis } from "../../apis";

function AsteroidList() {
  const [asteroids, setAsteroids] = useState([]);

  useEffect(() => {
    apis
      .fetchAsteroids()
      .then((response) => {
        setAsteroids(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div className="list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Minerals</th>
            <th>Current miner</th>
            <th>Position (x, y)</th>
          </tr>
        </thead>

        <tbody>
          {asteroids.map((asteroid) => (
            <tr>
              <td>{asteroid.name}</td>
              <td>
                {asteroid.mined}/{asteroid.minerals}
              </td>
              <td>{asteroid.miner ? `Miner ${asteroid.miner}` : "-"}</td>
              <td>
                {asteroid.position.x}, {asteroid.position.y}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AsteroidList;

/**
 * List of asteroids
 */

import React, { useEffect, useState, useReducer } from "react";
import { apis } from "../../apis";
import { subject } from "../layout/app";

function AsteroidList() {
  const [loaded, setLoaded] = useState(false);

  const [asteroids, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "update":
        const index = state.findIndex(
          (asteroid) => asteroid.name === action.asteroid.name
        );
        if (index !== -1) {
          console.debug("Asteroid updated", action.asteroid);
          const newAsteroids = [...state];
          newAsteroids[index] = Object.assign(
            {},
            newAsteroids[index],
            action.asteroid
          );
          return newAsteroids;
        }
        return state;
      default:
        return action.asteroid;
    }
  }, []);

  useEffect(() => {
    apis
      .fetchAsteroids()
      .then((response) => {
        dispatch({
          asteroid: response.data,
        });
        setLoaded(true);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    const sub = subject.subscribe({
      next: (data) => {
        if (data.asteroid && data.action === "update") {
          const index = asteroids.findIndex(
            (asteroid) => asteroid.name === data.asteroid.name
          );
          if (index !== -1) {
            console.debug("Asteroid updated", data.asteroid);
            const merged = Object.assign({}, asteroids[index], data.asteroid);
            dispatch({
              type: "update",
              asteroid: merged,
            });
          }
        }
      },
      error: (err) => console.error(err),
    });

    return () => {
      sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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
            <tr key={asteroid.name}>
              <td>{asteroid.name}</td>
              <td>
                {asteroid.minerals - asteroid.mined}/{asteroid.minerals}
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

/**
 * Create miner popup
 */

import React, { useEffect } from "react";
import { apis } from "../../apis/index.js";

export default function CreateMiner(props) {
  const [carryCapacity, setCarryCapacity] = React.useState(0);
  const [travelSpeed, setTravelSpeed] = React.useState(0);
  const [miningSpeed, setMiningSpeed] = React.useState(0);
  const [totalPoints, setTotalPoints] = React.useState(0);
  const [limit] = React.useState(120);
  const [planets, setPlanets] = React.useState([]);
  const [planet, setPlanet] = React.useState(0);
  const [name, setName] = React.useState("");
  const [minerIsExist, setMinerIsExist] = React.useState(false);

  useEffect(() => {
    setTotalPoints(
      Number(carryCapacity) + Number(travelSpeed) + Number(miningSpeed)
    );
  }, [carryCapacity, travelSpeed, miningSpeed]);

  useEffect(() => {
    apis.fetchPlanet().then((planets) => {
      setPlanets(planets.data);
      setPlanet(planets.data?.[0].id || 0);
    });
  }, []);

  useEffect(() => {
    // Anti-throttle
    const timeout = setTimeout(() => {
      if (name) {
        apis.fetchMinerByName(name).then((miner) => {
          setMinerIsExist(miner.data.length > 0);
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [name]);

  const createMiner = () => {
    // TODO: this request got cancelled
    apis.createMiner({
      name: name,
      planetId: planet,
      carryCapacity: carryCapacity,
      travelSpeed: travelSpeed,
      miningSpeed: miningSpeed,
    });
  };

  return (
    <form>
      <div class={`field ${minerIsExist ? "error" : ""}`}>
        <label for="name">Miner name</label>
        <input
          type="text"
          id="name"
          placeholder="Miner name"
          onChange={(e) => {
            if (e.target.value === "") {
              setName("");
              setMinerIsExist(false);
            } else {
              setName(e.target.value);
              setMinerIsExist(false);
            }
          }}
        />
        {minerIsExist && (
          <div className="message">This name is already taken</div>
        )}
      </div>

      <div class="field">
        <label for="planet">Planet</label>
        <select
          placeholder="Select a planet"
          id="planet"
          onSelect={(e) => {
            setPlanet(Number(e.target.value));
          }}
          value={planet}
        >
          {planets?.map((planet) => (
            <option key={planet.id} value={planet.id}>
              Planet {planet.id}
            </option>
          ))}
        </select>
      </div>

      <h2>Assign points</h2>

      <div className="columns">
        <div className="column">
          <div className="field">
            <label for="carry-capacity">Carry capacity</label>
            <input
              value={carryCapacity}
              type="number"
              id="carry-capacity"
              placeholder="0"
              onChange={(e) =>
                Number(e.target.value) > 0 && setCarryCapacity(Number(e.target.value))
              }
            />
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label for="travel-speed">Travel speed</label>
            <input
              value={travelSpeed}
              type="number"
              id="travel-speed"
              placeholder="0"
              onChange={(e) =>
                Number(e.target.value) > 0 && setTravelSpeed(Number(e.target.value))
              }
            />
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label for="mining-speed">Mining speed</label>
            <input
              value={miningSpeed}
              type="number"
              id="mining-speed"
              placeholder="0"
              onChange={(e) =>
                Number(e.target.value) > 0 && setMiningSpeed(Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      <div className={totalPoints <= limit ? "green" : "red"}>
        {totalPoints}/{limit}
      </div>
      <div className="actions">
        <button
          className={minerIsExist || totalPoints > limit ? "disabled" : ""}
          onClick={() => createMiner()}
        >
          Save
        </button>
      </div>
    </form>
  );
}

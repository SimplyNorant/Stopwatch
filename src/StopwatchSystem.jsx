import { useState, useEffect } from "react";

export default function StopwatchSystem() {
  const [nameList, setNameList] = useState(
    JSON.parse(localStorage.getItem("nameList")) || [
      "Coding",
      "Piano",
      "Training",
    ]
  );
  const [input, setInput] = useState(2);

  function addStopwatch() {
    console.log(nameList.indexOf(input));
    if (nameList.indexOf(input) === -1 && input !== "") {
      const temp = [...nameList, input];
      localStorage.setItem("nameList", JSON.stringify(temp));
      setNameList(temp);
    } else {
      console.log("There is already a Stopwatch with such name!");
    }
  }

  function deleteStopwatch() {
    const temp = [...nameList];
    const place = temp.indexOf(input);
    if (place !== -1) {
      localStorage.removeItem(temp[place]);
      temp.splice(place, 1);
      localStorage.setItem("nameList", JSON.stringify(temp));
      setNameList(temp);
    } else {
      console.log("There is no Stopwatch with such name!");
    }
  }
  return (
    <>
      <div>
        <h1 className="text-center text-4xl mb-2">My Stopwatches</h1>
        <div className="mx-auto flex flex-col items-center">
          <button
            className="bg-[#25FFA8] w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20"
            onClick={addStopwatch}
          >
            Add Stopwatch
          </button>
          <button
            className="bg-[#FF2525] w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20"
            onClick={deleteStopwatch}
          >
            Delete Stopwatch
          </button>
        </div>

        <form className="text-center">
          <label className="text-3xl" htmlFor="sname">
            Stopwatch Name:
          </label>
          <br />
          <input
            value={input}
            onInput={(e) => setInput(e.target.value)}
            id="sname"
            name="sname"
            className="w-sm bg-white py-5 text-3xl text-center text-wrap"
          />
        </form>
        <div className="flex flex-col items-center gap-4">
          {nameList.map((el) => (
            <Stopwatch key={el} name={el} />
          ))}
        </div>
      </div>
    </>
  );
}

function Stopwatch({ name }) {
  const [time, setTime] = useState(JSON.parse(localStorage.getItem(name)) || 0);
  const [isRunning, setIsRunning] = useState(false);

  // Stopwatch time change
  useEffect(() => {
    let intervalId;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Update every 10ms for milliseconds
      }, 10);
    }

    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Saving time each time it changes
  useEffect(() => {
    localStorage.setItem(name, JSON.stringify(time));
  }, [time]);

  const startStop = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    localStorage.setItem(name, JSON.stringify(time));
    setTime(0);
    setIsRunning(false);
  };

  const formatTime = (timeInMs) => {
    const hours = Math.floor(timeInMs / 3600000);
    const minutes = Math.floor((timeInMs % 3600000) / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="">
      <div className="text-3xl text-center mb-1">{name}</div>
      <div className="bg-white text-center mb-2 text-3xl py-5 px-4 border rounded tracking-widest shadow-xl/10">
        {formatTime(time)}
      </div>
      <div className="flex justify-between gap-3 text-3xl">
        <button
          onClick={startStop}
          className={
            isRunning
              ? "bg-[#ff2525] w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10"
              : "bg-[#75FF25] w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10"
          }
        >
          {isRunning ? "Stop" : "Start"}
        </button>
        <button
          onClick={reset}
          className="bg-[#FFC125] w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import "./Stopwatch.css";

export default function StopwatchSystem() {
  const [isOpen, setOpen] = useState(
    JSON.parse(localStorage.getItem("is-open")) || false
  );

  const handleToggle = () => {
    localStorage.setItem("is-open", JSON.stringify(!isOpen));

    setOpen(!isOpen);
  };
  return (
    <>
      <div>
        <button onClick={handleToggle}>Toggle</button>
        {isOpen && <div>Content</div>}
      </div>
      <Stopwatch name={"Coding"}></Stopwatch>
      <Stopwatch name={"Piano"}></Stopwatch>
    </>
  );
}

function Stopwatch({ name }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Update every 10ms for milliseconds
      }, 10);
    }

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const startStop = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
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
    <div className="stopwatch">
      <div className="name">{name}</div>
      <div className="display">{formatTime(time)}</div>
      <div className="controls">
        <button onClick={startStop} className={isRunning ? "stop" : "start"}>
          {isRunning ? "Stop" : "Start"}
        </button>
        <button onClick={reset} className="reset">
          Reset
        </button>
      </div>
    </div>
  );
}

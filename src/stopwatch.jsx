import { useState, useRef } from "react";

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(Date.now());
  const [secondsPassed, setSecondsPassed] = useState(0);
  const intervalRef = useRef(null);

  function tick() {
    if (startTime) {
      setSecondsPassed(secondsPassed + (Date.now() - startTime) / 1000);
    } else {
      setStartTime(Date.now());
    }
  }

  function handleStart() {
    setStartTime(Date.now());

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 10);
  }

  function handleStop() {
    clearInterval(intervalRef.current);
    setStartTime(null);
  }

  return (
    <>
      <h1>Time passed: {secondsPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
    </>
  );
}

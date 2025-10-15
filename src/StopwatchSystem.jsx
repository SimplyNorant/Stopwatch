import { useState, useEffect } from "react";
import Stopwatch from "./stopwatch";

export default function StopwatchSystem() {
  function addStopwatch() {
    return <Stopwatch></Stopwatch>;
  }
  return (
    <>
      <ol>
        <li>
          <Stopwatch></Stopwatch>
        </li>
      </ol>
      <button onClick={addStopwatch}></button>
    </>
  );
}

import { useState } from "react";

export default function Testing() {
  const [startTime, setStartTime] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);

  function tick() {
    setNow(new Date());
  }

  setInterval(tick, 1000);
  setInterval(countdown, 1000);

  function countdown() {
    let newSeconds = (new Date().getSeconds() - startTime.getSeconds()) % 60;

    setSeconds(newSeconds);
    setMinutes(Math.floor(newSeconds / 60));
    setHours(Math.floor(newSeconds / 3600));
  }

  return (
    <>
      <div className="clock">
        <span>
          {now.getHours().toString()} : {now.getMinutes().toString()} :{" "}
          {now.getSeconds().toString()}
        </span>
      </div>
      <div className="text-red-500 text-2xl">
        {hours} : {minutes} : {seconds}
      </div>
    </>
  );
}

export default function Stopwatch() {
  const clock = document.querySelector(".clock");
  const stopwatch = document.querySelector(".stopwatch-text");
  const startBtn = document.getElementById("startBtn");

  clock.addEventListener("load", tick);
  stopwatch.addEventListener("load", countdown);

  function tick() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    const html = `
    <span>${h} :</span>
    <span>${m} :</span>
    <span>${s} </span>
    `;

    clock.innerHTML = html;
  }

  setInterval(tick, 1000);
  // COUNTDOWN START
  let counting,
    started = false;
  let seconds = (minutes = hours = 0);

  function startCountdown() {
    if (started) {
      clearInterval(counting);
      startBtn.innerHTML = "Start";
      started = false;
    } else {
      counting = setInterval(countdown, 1000);
      startBtn.innerHTML = "Stop";
      started = true;
    }
  }

  function resetCountdown() {
    seconds = 0;
    minutes = 0;
    hours = 0;
    stopwatch.innerHTML = `Time passed: ${hours} : ${minutes} : ${seconds}`;
  }

  function countdown() {
    seconds++;

    if (seconds >= 60) {
      minutes++;
      seconds = 0;
    }
    if (minutes >= 60) {
      hours++;
      minutes = 0;
    }
    const html = `Time passed: ${hours} : ${minutes} : ${seconds}`;

    stopwatch.innerHTML = html;
  }
  // COUNTDOWN END

  function addCountdown() {}

  return (
    <div className="system">
      <div className="stopwatch">
        <div className="stopwatch-text">Stop this watch</div>
        <button id="startBtn" onclick={startCountdown}>
          Start/Reset
        </button>
        <button onclick={resetCountdown}>Reset</button>
        <button onclick={addCountdown}>Add</button>
      </div>
    </div>
  );
}

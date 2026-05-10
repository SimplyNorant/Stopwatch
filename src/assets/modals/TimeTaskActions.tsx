import { useState } from "react";
import supabase from "../../supabase-client";

import { useSharedContext } from "../../assets/SharedContent";

interface EditProps {
  oldTitle?: string;
  oldTime?: number;
  oldDuration?: number;
  isAdding: boolean;
  id?: number;
}

export function AddStopwatch({
  oldTitle = "",
  oldTime = 0,
  isAdding,
  id,
}: EditProps) {
  const { session } = useSharedContext();

  const [title, setTitle] = useState<string>(oldTitle);

  const [time, setTime] = useState(oldTime);

  const totalSeconds = Math.floor(time / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const addStopwatch = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: title,
        email: session.user.email,
        duration: 0,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
  };

  const editStopwatch = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase
      .from("tasks")
      .update({ title: title, time: time })
      .eq("id", id);

    if (error) {
      console.error("Edit failed: ", error);
    }
  };

  return (
    <>
      <form className="text-center flex flex-col">
        <label className="text-3xl" htmlFor="sname">
          Stopwatch Name:
        </label>
        <textarea
          value={title}
          onInput={(e: any) => setTitle(e.target.value)}
          id="sname"
          name="sname"
          className="py-5 text-3xl text-center text-wrap border-2 bg-foreground"
        ></textarea>
        <div className="flex text-2xl">
          <div className="flex flex-col text-end mr-2">
            <label htmlFor="hours">Hours:</label>
            <label htmlFor="minutes">Minutes:</label>
            <label htmlFor="seconds">Seconds:</label>
          </div>
          <div className="flex flex-col *:w-10">
            <input
              id="hours"
              type="number"
              value={hours}
              onInput={(e: any) => {
                const newHours = Math.max(0, Number(e.target.value));
                setTime((newHours * 3600 + minutes * 60 + seconds) * 1000);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />{" "}
            <input
              id="minutes"
              type="number"
              value={minutes}
              onInput={(e: any) => {
                const newMinutes = Math.max(0, Number(e.target.value));
                setTime((hours * 3600 + newMinutes * 60 + seconds) * 1000);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />
            <input
              id="seconds"
              type="number"
              value={seconds}
              onInput={(e: any) => {
                const newSeconds = Math.max(0, Number(e.target.value));
                setTime((hours * 3600 + minutes * 60 + newSeconds) * 1000);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />
          </div>
        </div>
        <button
          className="w-70 py-2 mt-3 mx-auto bg-primary text-2xl border rounded  tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
          onClick={(e: any) => (isAdding ? addStopwatch(e) : editStopwatch(e))}
        >
          {isAdding ? (
            <p>
              Create <br /> Stopwatch
            </p>
          ) : (
            <p>
              Edit <br /> Stopwatch
            </p>
          )}
        </button>
      </form>
    </>
  );
}

export function AddTimer({
  oldTitle = "",
  oldDuration = 0,
  isAdding,
  id,
}: EditProps) {
  const { session } = useSharedContext();

  // TIMER
  const [title, setTitle] = useState<string>(oldTitle);
  const [timerDuration, setTimerDuration] = useState(oldDuration);
  const [endSound, setEndSound] = useState("timer_finish_ringing1.mp3");

  // TIMER DURATION
  const totalSeconds = Math.floor(timerDuration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const addTimer = async (e: any) => {
    e.preventDefault();
    const duration = Math.max(1, timerDuration);
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: title,
        email: session.user.email,
        duration: duration,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
  };

  const editTimer = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase
      .from("tasks")
      .update({ title: title, duration: timerDuration })
      .eq("id", id);

    if (error) {
      console.error("Edit failed: ", error);
    }
  };

  return (
    <>
      <form className="text-center flex flex-col">
        <label className="text-3xl" htmlFor="tname">
          Timer Name:
        </label>
        <textarea
          value={title}
          onInput={(e: any) => setTitle(e.target.value)}
          id="tname"
          name="tname"
          className="py-5 text-3xl text-center text-wrap border-2 bg-foreground"
        ></textarea>
        <div className="text-3xl">Settings</div>
        <div className="flex text-2xl">
          <div className="flex flex-col text-end mr-2">
            <label htmlFor="hours">Hours:</label>
            <label htmlFor="minutes">Minutes:</label>
            <label htmlFor="seconds">Seconds:</label>
          </div>
          <div className="flex flex-col *:w-10">
            <input
              id="hours"
              type="number"
              value={hours}
              onInput={(e: any) => {
                const newHours = Math.max(0, Number(e.target.value));
                setTimerDuration(
                  (newHours * 3600 + minutes * 60 + seconds) * 1000,
                );
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />{" "}
            <input
              id="minutes"
              type="number"
              value={minutes}
              onInput={(e: any) => {
                const newMinutes = Math.max(0, Number(e.target.value));
                setTimerDuration(
                  (hours * 3600 + newMinutes * 60 + seconds) * 1000,
                );
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />
            <input
              id="seconds"
              type="number"
              value={seconds}
              onInput={(e: any) => {
                const newSeconds = Math.max(0, Number(e.target.value));
                setTimerDuration(
                  (hours * 3600 + minutes * 60 + newSeconds) * 1000,
                );
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Hours"
              required
            />
          </div>
        </div>
        <div className="text-2xl flex">
          <div className="text-start mr-1">Ending sound:</div>
          <select
            className="text-font bg-background"
            value={endSound}
            onChange={(e) => setEndSound(e.target.value)}
          >
            <option value="timer_finish_countdown1.mp3">Countdown</option>
            <option value="timer_finish_buzz.mp3">Buzz</option>
            <option value="timer_finish_ringing1.mp3">Ringing</option>
          </select>
        </div>
        <button
          className="w-70 py-2 mt-3 mx-auto bg-primary text-2xl border rounded  tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
          onClick={(e: any) => (isAdding ? addTimer(e) : editTimer(e))}
        >
          {isAdding ? (
            <p>
              Create <br /> Timer
            </p>
          ) : (
            <p>
              Edit <br /> Timer
            </p>
          )}
        </button>
      </form>
    </>
  );
}

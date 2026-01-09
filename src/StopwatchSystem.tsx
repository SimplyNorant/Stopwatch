import { useState, useEffect, useRef } from "react";
import supabase from "./supabase-client";
import type { Session } from "@supabase/supabase-js";
import { playSound } from "./actions";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
}

export default function StopwatchSystem({ session }: { session: Session }) {
  const [stopwatchNameList, setStopwatchNameList] = useState<Task[]>([]);
  const [stopwatchInput, setStopwatchInput] = useState<string>("");

  const [timerNameList, setTimerNameList] = useState<Task[]>([]);
  const [timerInput, setTimerInput] = useState<string>("");
  const [timerDuration, setTimerDuration] = useState(0);

  useEffect(() => {
    fetchStopwatches();
    fetchTimers();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("tasks-channel");
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const newTask = payload.new as Task;
          console.log(newTask);
          if (newTask.duration === 0) {
            setStopwatchNameList((prev) => [...prev, newTask]);
          } else {
            setTimerNameList((prev) => [...prev, newTask]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const oldTask = payload.old;
          console.log(oldTask);
          if (oldTask.duration === 0) {
            setStopwatchNameList((prev) =>
              prev.filter((el) => el.id !== oldTask.id)
            );
          } else {
            setTimerNameList((prev) =>
              prev.filter((el) => el.id !== oldTask.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // I think, it is possible to merge those 2 fetching.
  const fetchStopwatches = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .eq("duration", 0)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Whoops! While fetching stopwatches: ", error.message);
      return;
    }

    setStopwatchNameList(data);
  };

  const fetchTimers = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .gt("duration", 0)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Whoops! While fetching timers: ", error.message);
      return;
    }

    setTimerNameList(data);
  };

  const addStopwatch = async () => {
    const { error } = await supabase
      .from("tasks")
      .insert({ title: stopwatchInput, email: session.user.email, duration: 0 })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
    setStopwatchNameList(stopwatchNameList);
  };

  const addTimer = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: timerInput,
        email: session.user.email,
        duration: timerDuration,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
    setTimerNameList(timerNameList);
  };

  return (
    <>
      <div className="mt-2 flex flex-col lg:flex-row justify-around gap-10 lg:gap-0">
        <div>
          {/* Stopwatches */}
          <h1 className="text-center text-4xl mb-2">My Stopwatches</h1>
          <div className="mx-auto  items-center">
            <button
              className="bg-[#25FFA8] w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20"
              onClick={addStopwatch}
            >
              Add Stopwatch
            </button>
          </div>

          <form className="text-center">
            <label className="text-3xl" htmlFor="sname">
              Stopwatch Name:
            </label>
            <br />
            <textarea
              value={stopwatchInput}
              onInput={(e: any) => setStopwatchInput(e.target.value)}
              id="sname"
              name="sname"
              className="w-sm bg-white py-5 text-3xl text-center text-wrap border-2"
            ></textarea>
          </form>
          <div className="flex flex-col items-center gap-4">
            {stopwatchNameList.map((el) => (
              <Stopwatch key={el.id} name={el.title} id={el.id} />
            ))}
          </div>
        </div>
        <div>
          {/* Timers */}
          <h1 className="text-center text-4xl mb-2">My Timers</h1>

          <form className="text-center flex flex-col">
            <button
              className="bg-[#25FFA8] w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20"
              onClick={(e: any) => addTimer(e)}
            >
              Add Timer
            </button>
            <label className="text-3xl" htmlFor="tname">
              Timer Name:
            </label>
            <textarea
              value={timerInput}
              onInput={(e: any) => setTimerInput(e.target.value)}
              id="tname"
              name="tname"
              className="w-sm bg-white py-5 text-3xl text-center text-wrap border-2"
            ></textarea>
            <input
              type="number"
              onInput={(e: any) => setTimerDuration(e.target.value)}
              className="border-2 mt-2"
              placeholder="Duration..."
              required
            />
          </form>
          <div className="flex flex-col items-center gap-4 ">
            {timerNameList.map((el) => (
              <Timer
                key={el.id}
                name={el.title}
                id={el.id}
                duration={el.duration}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Stopwatch({ name, id }: { name: string; id: number }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(0); // ...
  const startTimeRef = useRef(0);
  const savedTimeRef = useRef(0);

  useEffect(() => {
    fetchTime();
  }, []);
  // Инициализация и очистка
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Запуск/остановка секундомера
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - savedTimeRef.current;

      intervalRef.current = setInterval(() => {
        const currentTime = Date.now() - startTimeRef.current;
        setTime(currentTime);
        changeTime(currentTime);
        savedTimeRef.current = currentTime;
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, name]);

  const fetchTime = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("time")
      .eq("id", id);

    if (error) {
      console.error("Whoops! While fetching: ", error.message);
      return;
    }

    savedTimeRef.current = data[0].time;
    setTime(data[0].time);
  };

  const changeTime = async (change: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ time: change })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't change time: ", error.message);
      return;
    }
  };

  const startStop = () => {
    setIsRunning(!isRunning);
  };

  const reset = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({ time: 0 })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't reset time: ", error.message);
      return;
    }

    setTime(0);
    savedTimeRef.current = 0;

    if (isRunning) {
      startTimeRef.current = Date.now();
    }
  };

  const deleteStopwatch = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Whoops! Couldn't delete: ", error.message);
      return;
    }
  };

  const formatTime = (timeInMs: number) => {
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
      <div className="flex relative">
        <div
          className="text-3xl text-center mb-1 text-wrap wrap-anywhere w-80
    "
        >
          {name}
        </div>

        <button
          onClick={() => deleteStopwatch(id)}
          className="text-red-500 hover:text-red-700 transition absolute right-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

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

// It is also possible to merge Timer and Stopwatch. Or use OOP.
function Timer({
  name,
  id,
  duration,
}: {
  name: string;
  id: number;
  duration: number;
}) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(0); // ...
  const startTimeRef = useRef(0);
  const savedTimeRef = useRef(0);

  const soundEnd = playSound("/audio/timer_finish_buzz.mp3", 0.3);

  useEffect(() => {
    fetchTime();
  }, []);
  // Инициализация и очистка
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Запуск/остановка таймера
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - savedTimeRef.current;

      intervalRef.current = setInterval(() => {
        const currentTime = Date.now() - startTimeRef.current;
        if (currentTime > duration) {
          clearInterval(intervalRef.current);
          soundEnd.play();
          console.log("Timer has ended");
          setIsRunning(false);
          reset();
        }
        setTime(currentTime);
        changeTime(currentTime);
        savedTimeRef.current = currentTime;
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, name]);

  const fetchTime = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("time")
      .eq("id", id);

    if (error) {
      console.error("Whoops! While fetching: ", error.message);
      return;
    }

    savedTimeRef.current = data[0].time;
    setTime(data[0].time);
  };

  const changeTime = async (change: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ time: change })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't change time: ", error.message);
      return;
    }
  };

  const startStop = () => {
    setIsRunning(!isRunning);
    soundEnd.stop();
  };

  const reset = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({ time: 0 })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't reset time: ", error.message);
      return;
    }

    setTime(0);
    savedTimeRef.current = 0;
    localStorage.setItem(name, JSON.stringify(0));
    if (isRunning) {
      startTimeRef.current = Date.now();
    }
  };

  const deleteStopwatch = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Whoops! Couldn't delete: ", error.message);
      return;
    }
  };

  const formatTime = (timeInMs: number) => {
    timeInMs = duration - timeInMs;
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
      <div className="flex relative">
        <div
          className="text-3xl text-center mb-1 text-wrap wrap-anywhere w-80
    "
        >
          {name}
        </div>

        <button
          onClick={() => deleteStopwatch(id)}
          className="text-red-500 hover:text-red-700 transition absolute right-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

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

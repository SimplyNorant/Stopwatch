import { useState, useEffect, useRef } from "react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RxDragHandleDots2 } from "react-icons/rx";
import supabase from "../supabase-client";
import type { Session } from "@supabase/supabase-js";
import { playSound } from "../actions";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
  position: number;
}

export default function StopwatchSystem({ session }: { session: Session }) {
  // STOPWATCH
  const [stopwatchList, setStopwatchNameList] = useState<Task[]>([]);
  const [stopwatchInput, setStopwatchInput] = useState<string>("");

  // TIMER
  const [timerNameList, setTimerNameList] = useState<Task[]>([]);
  const [timerInput, setTimerInput] = useState<string>("");
  const [timerDuration, setTimerDuration] = useState(0);
  const [endSound, setEndSound] = useState("timer_finish_ringing1.mp3");

  const totalSeconds = Math.floor(timerDuration / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

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
        },
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

          setStopwatchNameList((prev) =>
            prev.filter((el) => el.id !== oldTask.id),
          );
          setTimerNameList((prev) => prev.filter((el) => el.id !== oldTask.id));
        },
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
      .order("position", { ascending: true });

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
    setStopwatchNameList(stopwatchList);
  };

  const addTimer = async (e: any) => {
    e.preventDefault();
    const duration = Math.max(1, timerDuration);
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: timerInput,
        email: session.user.email,
        duration: duration,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
    setTimerNameList(timerNameList);
  };

  // After adding async things went downhill

  const getTaskPos = (id: any) =>
    stopwatchList.findIndex((task) => task.id === id);

  const handleDragEnd = async (e: any) => {
    const { active, over } = e;
    if (active.id === over.id) return;

    let startPos, endPos;
    stopwatchList.forEach((el: any) => {
      if (el.id === active.id) startPos = el.position;
      else if (el.id === over.id) endPos = el.position;
    });

    const { error } = await supabase
      .from("tasks")
      .update({ position: endPos })
      .eq("id", active.id);

    if (error) {
      console.error("Whoops! Couldn't update POSITION after dragging!");
    }

    await supabase
      .from("tasks")
      .update({ position: startPos })
      .eq("id", over.id);

    console.log(startPos, endPos);
    setStopwatchNameList((tasks) => {
      const originalPos = getTaskPos(active.id);
      const newPos = getTaskPos(over.id);

      return arrayMove(tasks, originalPos, newPos);
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <>
      <div className="mt-2 flex flex-col lg:flex-row justify-around gap-10 lg:gap-0 text-font **:border-black">
        <div className="flex flex-col items-center">
          {/* Stopwatches */}
          <h2 className="text-center text-4xl mb-2">My Stopwatches</h2>
          <button
            className="bg-primary w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20 transition hover:-translate-y-0.5"
            onClick={addStopwatch}
          >
            Add Stopwatch
          </button>

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
              className="w-sm py-5 text-3xl text-center text-wrap border-2 bg-foreground"
            ></textarea>
          </form>
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
          >
            <div className="flex flex-col items-center gap-4 touch-none">
              <SortableContext
                items={stopwatchList}
                strategy={verticalListSortingStrategy}
              >
                {stopwatchList.map((el) => (
                  <Stopwatch key={el.id} name={el.title} id={el.id} />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </div>
        <div className="flex flex-col items-center">
          {/* Timers */}
          <h2 className="text-center text-4xl mb-2">My Timers</h2>

          <form className="text-center flex flex-col">
            <button
              className="bg-primary w-sm rounded mb-2 text-3xl py-5 tracking-widest border shadow-xl/20 transition hover:-translate-y-0.5"
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
              className="w-sm py-5 text-3xl text-center text-wrap border-2 bg-foreground"
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
          </form>
          <div className="flex flex-col items-center gap-4 ">
            {timerNameList.map((el) => (
              <Timer
                key={el.id}
                name={el.title}
                id={el.id}
                duration={el.duration}
                soundEndName={endSound}
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
  const intervalRef = useRef(0);
  const startTimeRef = useRef(0);
  const savedTimeRef = useRef(0);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    fetchTime();
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
  }, [isRunning]);

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
    <div ref={setNodeRef} style={style}>
      <div className="flex relative">
        <div className="text-3xl text-center mb-1 text-wrap wrap-anywhere w-80">
          {name}
        </div>

        <button
          onClick={() => deleteStopwatch(id)}
          className="text-delete hover:text-red-800 transition absolute right-0 z-1"
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
      <div>
        <div className="relative bg-foreground text-center mb-2 text-3xl py-5 px-4 border rounded tracking-widest shadow-xl/10">
          {formatTime(time)}
          <div
            {...listeners}
            {...attributes}
            className="top-6 -left-7 absolute cursor-grab active:cursor-grabbing"
          >
            <RxDragHandleDots2 size={25} />
          </div>
        </div>
      </div>

      <div className="relative flex justify-between gap-3 text-3xl">
        <button
          onClick={startStop}
          className={
            isRunning
              ? "bg-delete w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
              : "bg-primary w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
          }
        >
          {isRunning ? "Stop" : "Start"}
        </button>
        <button
          onClick={reset}
          className="bg-secondary w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
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
  soundEndName,
}: {
  name: string;
  id: number;
  duration: number;
  soundEndName: string;
}) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef(0);
  const startTimeRef = useRef(0);
  const savedTimeRef = useRef(0);

  const soundEnd = playSound(`audio/${soundEndName}`, 0.3);

  useEffect(() => {
    fetchTime();
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
          setIsFinished(true);
          return;
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
  }, [isRunning]);

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

    soundEnd.stop();
    setTime(0);
    setIsFinished(false);
    savedTimeRef.current = 0;
    localStorage.setItem(name, JSON.stringify(0));
    if (isRunning) {
      startTimeRef.current = Date.now();
    }
  };

  const deleteStopwatch = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    soundEnd.stop();

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
        <div className="text-3xl text-center mb-1 text-wrap wrap-anywhere w-80">
          {name}
        </div>

        <button
          onClick={() => deleteStopwatch(id)}
          className="text-delete hover:text-red-800 transition absolute right-0"
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

      <div className="bg-foreground text-center mb-2 text-3xl py-5 px-4 border rounded tracking-widest shadow-xl/10">
        {isFinished && (
          <div className="text-delete">Finished ({formatTime(0)})</div>
        )}
        <div>{formatTime(time)}</div>
      </div>
      <div className="flex justify-between gap-3 text-3xl">
        <button
          onClick={startStop}
          className={
            isRunning
              ? "bg-delete w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
              : "bg-primary w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
          }
        >
          {isRunning ? "Stop" : "Start"}
        </button>
        <button
          onClick={reset}
          className="bg-secondary w-40 border rounded px-8 py-2 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

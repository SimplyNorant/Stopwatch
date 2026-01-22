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
// import Spinner from "../assets/spinner";
import StopwatchSkeletonList from "../assets/skeleton";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
  position: number;
}

export default function StopwatchSystem({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  // STOPWATCH
  const [stopwatchList, setStopwatchList] = useState<Task[]>([]);
  const [stopwatchInput, setStopwatchInput] = useState<string>("");

  // TIMER
  const [timerList, setTimerList] = useState<Task[]>([]);
  const [timerInput, setTimerInput] = useState<string>("");
  const [timerDuration, setTimerDuration] = useState(0);
  const [endSound, setEndSound] = useState("timer_finish_ringing1.mp3");

  // TIMER DURATION
  const totalSeconds = Math.floor(timerDuration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  useEffect(() => {
    const load = async () => {
      await fetchTasks();
      setLoading(false);
    };

    load();
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
            setStopwatchList((prev) => [...prev, newTask]);
          } else {
            setTimerList((prev) => [...prev, newTask]);
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

          setStopwatchList((prev) => prev.filter((el) => el.id !== oldTask.id));
          setTimerList((prev) => prev.filter((el) => el.id !== oldTask.id));
        },
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error("Error while fetching tasks: ", error.message);
      return;
    }

    setStopwatchList(data.filter((task) => task.duration === 0));
    setTimerList(data.filter((task) => task.duration > 0));
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
    setStopwatchList(stopwatchList);
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
    setTimerList(timerList);
  };

  const handleDragEnd = async (e: any, isStopwatch: boolean) => {
    const { active, over } = e;
    if (active.id === over.id) return;

    try {
      if (isStopwatch) {
        setStopwatchList((tasks) => {
          const originalPos = tasks.findIndex((task) => task.id === active.id);
          const newPos = tasks.findIndex((task) => task.id === over.id);
          return arrayMove(tasks, originalPos, newPos);
        });
      } else {
        setTimerList((tasks) => {
          const originalPos = tasks.findIndex((task) => task.id === active.id);
          const newPos = tasks.findIndex((task) => task.id === over.id);
          return arrayMove(tasks, originalPos, newPos);
        });
      }

      const { error } = await supabase.rpc("swap_task_positions", {
        task_id_1: active.id,
        task_id_2: over.id,
      });

      if (error) {
        console.error("Swap failed:", error);
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
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
            onDragEnd={(e) => handleDragEnd(e, true)}
            collisionDetection={closestCorners}
          >
            <div className="flex flex-col items-center gap-4 touch-none">
              <SortableContext
                items={stopwatchList}
                strategy={verticalListSortingStrategy}
              >
                {loading ? (
                  <StopwatchSkeletonList count={3} />
                ) : (
                  stopwatchList.map((el) => (
                    <TimeTask
                      key={el.id}
                      name={el.title}
                      id={el.id}
                      duration={0}
                    />
                  ))
                )}
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
          <DndContext
            sensors={sensors}
            onDragEnd={(e) => handleDragEnd(e, false)}
            collisionDetection={closestCorners}
          >
            <div className="flex flex-col items-center gap-4 touch-none">
              <SortableContext
                items={timerList}
                strategy={verticalListSortingStrategy}
              >
                {loading ? (
                  <StopwatchSkeletonList count={3} />
                ) : (
                  timerList.map((el) => (
                    <TimeTask
                      key={el.id}
                      name={el.title}
                      id={el.id}
                      duration={el.duration}
                      soundEndName={endSound}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>
    </>
  );
}

function TimeTask({
  name,
  id,
  duration,
  soundEndName,
}: {
  name: string;
  id: number;
  duration: number;
  soundEndName?: string;
}) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef(0);
  const startTimeRef = useRef(0);
  const savedTimeRef = useRef(0);

  const soundEnd = playSound(`audio/${soundEndName}`, 0.3);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  // Dragging properties
  const style = {
    transition,
    transform: transform
      ? CSS.Transform.toString({
          x: transform.x,
          y: transform.y,
          scaleX: 1,
          scaleY: 1,
        })
      : undefined,
  };

  useEffect(() => {
    fetchTime();
  }, []);

  // Time Logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - savedTimeRef.current;

      intervalRef.current = setInterval(() => {
        let currentTime = Date.now() - startTimeRef.current;
        if (duration && currentTime > duration) {
          clearInterval(intervalRef.current);
          soundEnd.play();
          setIsRunning(false);
          setIsFinished(true);
          currentTime = 0;
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

  const startStop = async () => {
    if (isFinished) await reset();
    setIsRunning(!isRunning);
  };

  const reset = async () => {
    setIsRunning(false);
    setTime(0);
    savedTimeRef.current = 0;
    if (duration) {
      soundEnd.stop();
      setIsFinished(false);
    }

    if (isRunning) {
      startTimeRef.current = Date.now();
    }

    const { error } = await supabase
      .from("tasks")
      .update({ time: 0 })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't reset time: ", error.message);
      return;
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
    if (duration) {
      timeInMs = duration - timeInMs;
    }
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

      <div className="relative bg-foreground text-center mb-2 text-3xl py-5 px-4 border rounded tracking-widest shadow-xl/10">
        {isFinished ? (
          <div className="text-delete">
            Time! ({formatTime(0).slice(0, formatTime(0).length - 3)})
          </div>
        ) : (
          <div>{formatTime(time)}</div>
        )}

        {/* Handle for dragging */}
        <div
          {...listeners}
          {...attributes}
          className="absolute top-6 -left-7 cursor-grab active:cursor-grabbing"
        >
          <RxDragHandleDots2 size={25} />
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

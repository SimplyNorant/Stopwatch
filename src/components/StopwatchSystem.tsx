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
// import { TiPencil } from "react-icons/ti";

import supabase from "../supabase-client";
import type { Session } from "@supabase/supabase-js";
import { playSound } from "../actions";
import StopwatchSkeletonList from "../assets/skeleton";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
  position: number;
}

// interface EditableTask {
//   id: number;
//   title: string;
//   duration: number;
//   time: number;
// }

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

  // const [editingTask, setEditingTask] = useState<EditableTask | null>(null);

  useEffect(() => {
    const load = async () => {
      await fetchTasks();
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase.channel("tasks-channel");
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const newTask = payload.new as Task;
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
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const oldTask = payload.old;

          setStopwatchList((prev) => prev.filter((el) => el.id !== oldTask.id));
          setTimerList((prev) => prev.filter((el) => el.id !== oldTask.id));
        },
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.access_token]);

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
  };

  const deleteTask = async (duration: number, id: number) => {
    const isStopwatch = duration === 0;

    // Optimistic UI removal
    if (isStopwatch) {
      setStopwatchList((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTimerList((prev) => prev.filter((t) => t.id !== id));
    }

    // Server delete
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Delete failed: ", error);
    }
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
            <div className="flex flex-col items-center gap-4">
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
                      task={el}
                      onDelete={deleteTask}
                      // onEdit={() => setEditingTask(el)}
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
            <div className="flex flex-col items-center gap-4">
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
                      task={el}
                      soundEndName={endSound}
                      onDelete={deleteTask}
                      // onEdit={() => setEditingTask(el)}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>
      {/* {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (updated) => {
            await supabase
              .from("tasks")
              .update({
                title: updated.title,
                duration: updated.duration,
                time: updated.time,
              })
              .eq("id", updated.id);

            setEditingTask(null);
            fetchTasks(); // or optimistic update
          }}
        />
      )} */}
    </>
  );
}

function TimeTask({
  task,
  soundEndName,
  onDelete,
  // onEdit,
}: {
  task: Task;
  soundEndName?: string;
  onDelete: Function;
  // onEdit: (task: EditableTask) => void;
}) {
  const { id, title, duration } = task;

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [, forceRender] = useState(0);

  const startTimeRef = useRef<null | number>(null);
  const endTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Time Logic (Time is derived)
  let displayTime = 0;

  if (isRunning && startTimeRef.current) {
    const elapsed = time + (Date.now() - startTimeRef.current);

    if (duration && elapsed >= duration) {
      displayTime = elapsed - duration; // Overtime
    } else {
      displayTime = elapsed;
    }
  } else {
    displayTime = time;
  }

  const soundEnd = playSound(`audio/${soundEndName}`, 0.3);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  // Dragging Properties
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

  // Notification System
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showNotification = async () => {
    if (Notification.permission !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "TIMER_DONE",
      taskId: id,
      name: title,
    });
  };

  const closeNotification = async () => {
    if (!("serviceWorker" in navigator)) return;

    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "CLOSE_TIMER_NOTIFICATION",
      taskId: id,
    });
  };

  useEffect(() => {
    const onReset = (e: any) => {
      if (e.detail.taskId === id) {
        reset();
      }
    };

    const onRestart = (e: any) => {
      if (e.detail.taskId === id) {
        restart();
      }
    };

    window.addEventListener("timer-reset", onReset);
    window.addEventListener("timer-restart", onRestart);
    return () => {
      window.removeEventListener("timer-reset", onReset);
      window.removeEventListener("timer-restart", onRestart);
    };
  }, [id]);

  // Loading Time and the date of starting (if exists)
  useEffect(() => {
    const load = async () => {
      const { error, data } = await supabase
        .from("tasks")
        .select("time, started_at")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Whoops! While fetching: ", error.message);
        return;
      }

      setTime(data.time);
      if (data.started_at) {
        startTimeRef.current = new Date(data.started_at).getTime();
        setIsRunning(true);
      }

      if (data.started_at && duration) {
        const started = new Date(data.started_at).getTime();
        const elapsed = Date.now() - started;
        const total = data.time + elapsed;

        // TIMER ALREADY FINISHED
        if (total >= duration) {
          setIsFinished(true);
          if (document.visibilityState !== "visible") {
            showNotification();
          }

          return;
        }

        // TIMER STILL RUNNING
        startTimeRef.current = started;
        endTimeRef.current = started + (duration - data.time);
        setIsRunning(true);
      }
    };

    load();
  }, [id]);

  // Rerendering Logic
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      forceRender((t) => t + 1);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]);

  // Timer Logic
  useEffect(() => {
    if (!duration || !isRunning || !endTimeRef.current) return;

    const remaining = endTimeRef.current - Date.now();
    if (remaining <= 0) {
      setIsFinished(true);
      soundEnd.play();
      if (document.visibilityState !== "visible") {
        showNotification();
      }
      document.title = "⏰ Time's up!";
    }

    const timeout = setTimeout(() => {
      setIsFinished(true);

      soundEnd.play();

      if (document.visibilityState !== "visible") {
        showNotification();
      }

      document.title = "⏰ Time's up!";
    }, remaining);

    return () => clearTimeout(timeout);
  }, [isRunning, duration]);

  useEffect(() => {
    return () => soundEnd.stop();
  }, []);

  const startStop = async () => {
    if (isFinished) {
      restart();
      return;
    }

    if (isRunning) await stop();
    else await start();

    await closeNotification();
    await requestNotificationPermission();
  };

  const start = async () => {
    const now = Date.now();

    startTimeRef.current = now;
    endTimeRef.current = duration ? now + (duration - time) : null;

    setIsRunning(true);

    await supabase
      .from("tasks")
      .update({ started_at: new Date(now).toISOString() })
      .eq("id", id);
  };

  const stop = async () => {
    if (!startTimeRef.current) return;

    const elapsed = time + (Date.now() - startTimeRef.current);

    startTimeRef.current = null;
    endTimeRef.current = null;

    setTime(elapsed);
    setIsRunning(false);

    await supabase
      .from("tasks")
      .update({
        time: elapsed,
        started_at: null,
      })
      .eq("id", id);
  };

  const restart = async () => {
    await reset();
    await start();
  };

  const reset = async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsRunning(false);
    setTime(0);

    soundEnd.stop();
    document.title = "Stopwatches"; // Possible to use a variable for this, in case I'd want to change the website's name
    setIsFinished(false);

    await closeNotification();

    const { error } = await supabase
      .from("tasks")
      .update({
        time: 0,
        started_at: null,
      })
      .eq("id", id);

    if (error) {
      console.log("Whoops! Couldn't reset time: ", error.message);
      return;
    }
  };

  const formatTime = (timeInMs: number) => {
    if (duration && !isFinished) {
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
          {title}
        </div>
        <div className="absolute right-0 z-1">
          <div className="flex">
            {/* <button
              onClick={() => {
                stop();
                // onEdit({ id, title, duration, time });
              }}
              className="text-amber-600 hover:text-amber-800 transition"
            >
              <TiPencil size={25} />
            </button> */}
            <button
              onClick={() => onDelete(duration, id)}
              className="text-delete hover:text-red-800 transition "
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
        </div>
      </div>

      <div className="relative bg-foreground text-center mb-2 text-3xl py-5 px-4 border rounded tracking-widest shadow-xl/10">
        {isFinished ? (
          <div className="text-delete">
            Time! ({formatTime(0).slice(0, formatTime(0).length - 3)})
            <div className="absolute bottom-0.5 left-15 text-sm">
              Overtime: +{formatTime(displayTime)}
            </div>
          </div>
        ) : (
          <div>{formatTime(displayTime)}</div>
        )}

        {/* Handle for dragging */}
        <div
          {...listeners}
          {...attributes}
          className="absolute top-6 -left-7 cursor-grab active:cursor-grabbing touch-none"
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

// function EditTaskModal({
//   task,
//   onClose,
//   onSave,
// }: {
//   task: EditableTask;
//   onClose: () => void;
//   onSave: (updated: EditableTask) => void;
// }) {
//   const [title, setTitle] = useState(task.title);
//   const [duration, setDuration] = useState(task.duration);
//   const [time, setTime] = useState(task.time);

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-background p-6 rounded shadow-xl w-96">
//         <h2 className="text-2xl mb-4">Edit task</h2>

//         <label>Name</label>
//         <input
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="w-full border p-2 mb-4"
//         />
//         <input
//           value={duration}
//           onChange={(e: any) => setDuration(e.target.value)}
//           className="w-full border p-2 mb-4"
//         />
//         <input
//           value={time}
//           onChange={(e: any) => setTime(e.target.value)}
//           className="w-full border p-2 mb-4"
//         />
//         {/* Time inputs here */}

//         <div className="flex justify-end gap-2">
//           <button onClick={onClose}>Cancel</button>
//           <button
//             onClick={() => onSave({ ...task, title, duration, time })}
//             className="bg-primary px-4 py-2 rounded"
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

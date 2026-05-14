// HOOKS
import { useState, useEffect, useRef } from "react";

// --- LIBRARIES ---

// Hotkeys
import { useHotkeys } from "react-hotkeys-hook";

// Animation
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

// Dragging
import { useMergeRefs } from "../../assets/hooks/useMergeRefs";
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

// ICONS
import { RxDragHandleDots2 } from "react-icons/rx";
import { TiPencil } from "react-icons/ti";

// DATABASE
import supabase from "../../supabase-client";
import type { Session } from "@supabase/supabase-js";

// COMPONENTS
import { playSound } from "../../actions";

import { Modal } from "../../assets/modals/AddItemModal";

import { AddStopwatch } from "../../assets/modals/TimeTaskActions";
import { AddTimer } from "../../assets/modals/TimeTaskActions";

import StopwatchSkeletonList from "../../assets/skeleton";

// Stopwatch/Timer
interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number; // To differentiate between Stopwatch (duration === 0) and Timer (duration !== 0)
  position: number;
  time: number;
  started_at: string | null;
  endSound: string | null; // For Timers
}

// The core of Stopwatches/Timers
export default function StopwatchSystem({ session }: { session: Session }) {
  // LOADING TASKS
  const [loading, setLoading] = useState(true);

  // STOPWATCH
  const [stopwatchList, setStopwatchList] = useState<Task[]>([]);

  // TIMER
  const [timerList, setTimerList] = useState<Task[]>([]);

  // MODAL
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTimer, setIsTimer] = useState(false);

  // Getting Tasks from db
  useEffect(() => {
    const load = async () => {
      await fetchTasks();
      setLoading(false);
    };

    load();
  }, []);

  // Live subscription (changes on INSERT, UPDATE, DELETE)
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
            setStopwatchList((prev) =>
              prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask],
            );
          } else {
            setTimerList((prev) =>
              prev.some((t) => t.id === newTask.id) ? prev : [...prev, newTask],
            );
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const updatedNote = payload.new as Task;

          if (updatedNote.duration === 0) {
            setStopwatchList((prev) =>
              prev.map((task) =>
                task.id === updatedNote.id ? updatedNote : task,
              ),
            );
          } else {
            setTimerList((prev) =>
              prev.map((task) =>
                task.id === updatedNote.id ? updatedNote : task,
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.access_token]);

  // Fetching Tasks from db
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

  // Deleting with "Optimistic UI removal" then from db
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

  // <DRAGGING>
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
  // </DRAGGING>

  // <IMPORT / EXPORT DATA>
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("title, time, duration, position")
      .eq("email", session.user.email)
      .order("position", { ascending: true });

    if (error) {
      console.error("Export failed: ", error.message);
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stopwatch-timer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "This will replace ALL your current stopwatches and timers. Continue?",
      )
    ) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const importedTasks = JSON.parse(text) as Task[];

      // Validate structure
      if (!Array.isArray(importedTasks)) throw new Error("Invalid format");

      // Delete all current tasks for this user
      await supabase.from("tasks").delete().eq("email", session.user.email);

      // Insert imported tasks (let database generate new IDs/positions if needed)
      const tasksToInsert = importedTasks.map(
        ({ id, created_at, ...task }) => ({
          ...task,
          email: session.user.email, // Enforce ownership
          position: task.position ?? 0,
          time: task.time ?? 0,
          started_at: null, // Never import running state
        }),
      );

      const { error } = await supabase.from("tasks").insert(tasksToInsert);
      if (error) throw error;

      // Refresh lists
      await fetchTasks();
      alert("Import successful!");
    } catch (err: any) {
      console.error("Import failed: ", err);
      alert("Import failed: " + err.message);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };
  // </IMPORT/EXPORT DATA>

  return (
    <>
      {/* For adding/editing Tasks */}
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        {isTimer ? (
          <AddTimer isAdding={true} />
        ) : (
          <AddStopwatch isAdding={true} />
        )}
      </Modal>
      <div className="mt-2 flex flex-col lg:flex-row justify-around gap-10 lg:gap-0 text-font **:border-black">
        <div className="flex flex-col items-center">
          {/* Stopwatches */}
          <h2 className="text-center text-4xl mb-2">My Stopwatches</h2>
          <button
            className="bg-primary w-sm rounded mb-4 text-3xl py-5 tracking-widest border shadow-xl/20 transition hover:-translate-y-0.5"
            onClick={() => {
              setIsTimer(false);
              setIsDialogOpen(true);
            }}
          >
            Add Stopwatch
          </button>
          <DndContext
            sensors={sensors}
            onDragEnd={(e) => handleDragEnd(e, true)}
            collisionDetection={closestCorners}
          >
            <div className="flex flex-col items-center">
              <SortableContext
                items={stopwatchList}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {loading ? (
                    <StopwatchSkeletonList count={3} />
                  ) : (
                    stopwatchList.map((el) => (
                      <TimeTask key={el.id} task={el} onDelete={deleteTask} />
                    ))
                  )}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>
        <div className="flex flex-col items-center">
          {/* Timers */}
          <h2 className="text-center text-4xl mb-2">My Timers</h2>

          <button
            className="bg-primary w-sm rounded mb-4 text-3xl py-5 tracking-widest border shadow-xl/20 transition hover:-translate-y-0.5"
            onClick={() => {
              setIsTimer(true);
              setIsDialogOpen(true);
            }}
          >
            Add Timer
          </button>

          <DndContext
            sensors={sensors}
            onDragEnd={(e) => handleDragEnd(e, false)}
            collisionDetection={closestCorners}
          >
            <div className="flex flex-col items-center">
              <SortableContext
                items={timerList}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {loading ? (
                    <StopwatchSkeletonList count={3} />
                  ) : (
                    timerList.map((el) => (
                      <TimeTask key={el.id} task={el} onDelete={deleteTask} />
                    ))
                  )}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>
      <div className="mt-[80vh] flex justify-center items-center gap-2 text-font">
        <button
          className="hover:text-gray-400 transition"
          onClick={handleExport}
        >
          Export data
        </button>
        <label className="cursor-pointer hover:text-gray-400 transition">
          {isImporting ? "Importing…" : "Import data"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            hidden
          />
        </label>
      </div>
    </>
  );
}

function TimeTask({ task, onDelete }: { task: Task; onDelete: Function }) {
  const {
    id,
    title,
    duration,
    time = 0,
    endSound = "timer_finish_ringing1.mp3",
  } = task;

  // MODAL
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // TIME VARIABLES
  const currentTimeRef = useRef<number>(time);

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const startTimeRef = useRef<null | number>(null);
  const endTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // For display to work
  const [, forceRender] = useState(0);

  // Time Logic (Time is derived)
  let displayTime = 0;

  if (isRunning && startTimeRef.current) {
    const elapsed =
      currentTimeRef.current + (Date.now() - startTimeRef.current);

    if (duration && elapsed >= duration) {
      displayTime = elapsed - duration; // Overtime
    } else {
      displayTime = elapsed;
    }
  } else {
    displayTime = currentTimeRef.current;
  }

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

      currentTimeRef.current = data.time;

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

  // Keeping the ref in sync with the prop when the timer is stopped. Used for proper display changing after editing
  useEffect(() => {
    currentTimeRef.current = time;
    // forcing a re‑render to reflect the change immediately
    forceRender((t) => t + 1);
  }, [time]);

  // Sound for the end of the Timer
  const soundEnd = playSound(`audio/${endSound}`, 0.3);

  useEffect(() => {
    return () => soundEnd.stop();
  }, []);

  // Dragging Properties
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

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

  // <NOTIFICATION SYSTEM>
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

  // For the appearing window after the end of the Timer
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
  // </NOTIFICATION SYSTEM>

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
    endTimeRef.current = duration
      ? now + (duration - currentTimeRef.current)
      : null;

    setIsRunning(true);

    await supabase
      .from("tasks")
      .update({ started_at: new Date(now).toISOString() })
      .eq("id", id);
  };

  const stop = async () => {
    if (!startTimeRef.current) return;

    const elapsed =
      currentTimeRef.current + (Date.now() - startTimeRef.current);

    startTimeRef.current = null;
    endTimeRef.current = null;

    currentTimeRef.current = elapsed;
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
    currentTimeRef.current = 0;
    forceRender((t) => t + 1);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    startTimeRef.current = null;
    setIsRunning(false);

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

  // HOTKEYS
  const HotkeySwitchRef = useHotkeys<HTMLParagraphElement>("s", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    if (isFinished) restart();
    isRunning ? stop() : start();
  });

  const HotkeyResetRef = useHotkeys<HTMLParagraphElement>("r", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    reset();
  });

  // Reset all stopwatches
  useHotkeys<HTMLParagraphElement>("ctrl + r", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    if (duration === 0) reset();
  });

  const mergedRef = useMergeRefs(setNodeRef, HotkeySwitchRef, HotkeyResetRef);
  return (
    <>
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        {duration > 0 ? (
          <AddTimer
            isAdding={false}
            oldTitle={title}
            oldDuration={duration}
            id={id}
          />
        ) : (
          <AddStopwatch
            isAdding={false}
            oldTitle={title}
            oldTime={currentTimeRef.current}
            id={id}
          />
        )}
      </Modal>
      <div ref={mergedRef} style={style}>
        <motion.div
          initial={{ opacity: 0.9, scale: 0.9, marginBottom: 16 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0,
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          transition={{
            duration: 0.3,
            scale: { type: "spring", visualDuration: 0.3, bounce: 0.5 },
            height: { duration: 0.3 },
            marginBottom: { duration: 0.3 },
            paddingTop: { duration: 0.3 },
            paddingBottom: { duration: 0.3 },
          }}
        >
          <div className="flex relative">
            <div className="text-3xl text-center mb-1 text-wrap wrap-anywhere w-80">
              {title}
            </div>
            <div className="absolute right-0 z-1">
              <div className="flex">
                <button
                  onClick={() => {
                    setIsDialogOpen(true);
                  }}
                  className="text-amber-600 hover:text-amber-800 transition"
                >
                  <TiPencil size={25} />
                </button>
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
        </motion.div>
      </div>
    </>
  );
}

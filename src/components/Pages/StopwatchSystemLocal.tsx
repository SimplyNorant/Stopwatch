// ============================================================
// localStorage helpers – all synchronous
// ============================================================

interface LocalTask {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
  position: number;
  time: number; // elapsed ms
  started_at: string | null; // ISO string or null
}

const STORAGE_KEY = "guest_stopwatch_tasks";

function getAllLocal(): LocalTask[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllLocal(tasks: LocalTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addLocalTask(partial: Omit<LocalTask, "id" | "position">): LocalTask {
  const tasks = getAllLocal();
  const maxPos = tasks.reduce((max, t) => Math.max(max, t.position), -1);
  const newTask: LocalTask = {
    ...partial,
    id: Date.now() + Math.floor(Math.random() * 1000),
    position: maxPos + 1,
    time: partial.time ?? 0,
    started_at: partial.started_at ?? null,
    description: partial.description ?? "",
  };
  saveAllLocal([...tasks, newTask]);
  return newTask;
}

function updateLocalTask(id: number, changes: Partial<LocalTask>): void {
  const tasks = getAllLocal();
  const index = tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...changes };
    saveAllLocal(tasks);
  }
}

function deleteLocalTask(id: number): void {
  const tasks = getAllLocal().filter((t) => t.id !== id);
  saveAllLocal(tasks);
}

function swapLocalPositions(id1: number, id2: number): void {
  const tasks = getAllLocal();
  const t1 = tasks.find((t) => t.id === id1);
  const t2 = tasks.find((t) => t.id === id2);
  if (t1 && t2) {
    const temp = t1.position;
    t1.position = t2.position;
    t2.position = temp;
    saveAllLocal(tasks);
  }
}

// ============================================================
// Imports
// ============================================================

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
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RxDragHandleDots2 } from "react-icons/rx";
import { TiPencil } from "react-icons/ti";
import { playSound } from "../../actions";
import { Modal } from "../../assets/modals/AddItemModal";
import {
  AddStopwatch,
  AddTimer,
} from "../../assets/modals/TimeTaskActionsLocal";
import StopwatchSkeletonList from "../../assets/skeleton";
import { useMergeRefs } from "../../assets/hooks/useMergeRefs";

// ============================================================
// Task interface (for UI state)
// ============================================================

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  duration: number;
  position: number;
  time?: number;
  started_at?: string | null;
}

// ============================================================
// Main component
// ============================================================

export default function StopwatchSystemLocal() {
  const [loading, setLoading] = useState(true);
  const [stopwatchList, setStopwatchList] = useState<Task[]>([]);
  const [timerList, setTimerList] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTimer, setIsTimer] = useState(false);
  const endSound = "timer_finish_ringing1.mp3";

  // -----------------------------------------------
  // Persistence callbacks (synchronous)
  // -----------------------------------------------

  const loadTimeForTask = useCallback(
    (id: number): { time: number; started_at: string | null } => {
      const tasks = getAllLocal();
      const t = tasks.find((x) => x.id === id);
      return { time: t?.time ?? 0, started_at: t?.started_at ?? null };
    },
    [],
  );

  const onStart = useCallback((id: number, startedAtISO: string) => {
    updateLocalTask(id, { started_at: startedAtISO });
  }, []);

  const onStop = useCallback((id: number, elapsedMs: number) => {
    updateLocalTask(id, { time: elapsedMs, started_at: null });
  }, []);

  const onReset = useCallback((id: number) => {
    updateLocalTask(id, { time: 0, started_at: null });
  }, []);

  // Fetch tasks on mount
  const fetchTasks = useCallback(() => {
    const data = getAllLocal(); // <-- now calls getAllLocal directly
    const sorted = data.sort((a, b) => a.position - b.position);
    setStopwatchList(sorted.filter((t) => t.duration === 0));
    setTimerList(sorted.filter((t) => t.duration > 0));
  }, []);

  useEffect(() => {
    fetchTasks();
    setLoading(false);
  }, [fetchTasks]);

  // CRUD operations (optimistic)
  const addTask = (taskData: {
    title: string;
    duration: number;
    time?: number;
  }) => {
    const newTask = addLocalTask({
      title: taskData.title,
      duration: taskData.duration,
      time: taskData.time ?? 0,
      created_at: new Date().toISOString(),
      started_at: null,
      description: "",
    });

    if (taskData.duration === 0) {
      setStopwatchList((prev) => [...prev, newTask]);
    } else {
      setTimerList((prev) => [...prev, newTask]);
    }
  };

  const editTask = (id: number, changes: Partial<LocalTask>) => {
    updateLocalTask(id, changes);
    setStopwatchList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    );
    setTimerList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    );
  };

  const deleteTask = (duration: number, id: number) => {
    if (duration === 0) {
      setStopwatchList((prev) => prev.filter((t) => t.id !== id));
    } else {
      setTimerList((prev) => prev.filter((t) => t.id !== id));
    }
    deleteLocalTask(id);
  };

  const handleDragEnd = (e: any, isStopwatch: boolean) => {
    const { active, over } = e;
    if (active.id === over.id) return;

    if (isStopwatch) {
      setStopwatchList((tasks) => {
        const originalPos = tasks.findIndex((t) => t.id === active.id);
        const newPos = tasks.findIndex((t) => t.id === over.id);
        return arrayMove(tasks, originalPos, newPos);
      });
    } else {
      setTimerList((tasks) => {
        const originalPos = tasks.findIndex((t) => t.id === active.id);
        const newPos = tasks.findIndex((t) => t.id === over.id);
        return arrayMove(tasks, originalPos, newPos);
      });
    }

    swapLocalPositions(active.id, over.id);
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
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        {isTimer ? (
          <AddTimer
            onAdd={(taskData) => {
              addTask(taskData);
              setIsDialogOpen(false);
            }}
          />
        ) : (
          <AddStopwatch
            isAdding={true}
            onAdd={(taskData) => {
              addTask(taskData);
              setIsDialogOpen(false);
            }}
          />
        )}
      </Modal>

      <div className="mt-2 flex flex-col lg:flex-row justify-around gap-10 lg:gap-0 text-font **:border-black">
        {/* Stopwatches column */}
        <div className="flex flex-col items-center">
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
                      <TimeTask
                        key={el.id}
                        task={el}
                        onDelete={deleteTask}
                        loadTimeForTask={loadTimeForTask}
                        onStart={onStart}
                        onStop={onStop}
                        onReset={onReset}
                        onEdit={editTask}
                      />
                    ))
                  )}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>

        {/* Timers column */}
        <div className="flex flex-col items-center">
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
                      <TimeTask
                        key={el.id}
                        task={el}
                        soundEndName={endSound}
                        onDelete={deleteTask}
                        loadTimeForTask={loadTimeForTask}
                        onStart={onStart}
                        onStop={onStop}
                        onReset={onReset}
                        onEdit={editTask}
                      />
                    ))
                  )}
                </AnimatePresence>
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>
    </>
  );
}

// ============================================================
// TimeTask component (synchronous persistence)
// ============================================================

function TimeTask({
  task,
  soundEndName,
  onDelete,
  loadTimeForTask,
  onStart,
  onStop,
  onReset,
  onEdit,
}: {
  task: Task;
  soundEndName?: string;
  onDelete: (duration: number, id: number) => void;
  loadTimeForTask: (id: number) => { time: number; started_at: string | null };
  onStart: (id: number, startedAtISO: string) => void;
  onStop: (id: number, elapsedMs: number) => void;
  onReset: (id: number) => void;
  onEdit: (id: number, changes: Partial<LocalTask>) => void;
}) {
  const { id, title, duration, time = 0 } = task;

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const currentTimeRef = useRef<number>(time);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [, forceRender] = useState(0);

  const startTimeRef = useRef<null | number>(null);
  const endTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Derived display time
  let displayTime = 0;
  if (isRunning && startTimeRef.current) {
    const elapsed =
      currentTimeRef.current + (Date.now() - startTimeRef.current);
    if (duration && elapsed >= duration) {
      displayTime = elapsed - duration;
    } else {
      displayTime = elapsed;
    }
  } else {
    displayTime = currentTimeRef.current;
  }

  const soundEnd = playSound(`audio/${soundEndName}`, 0.3);

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

  // Notifications (async, but that's fine)
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

  // Custom events
  useEffect(() => {
    const onResetEvent = (e: any) => {
      if (e.detail.taskId === id) reset();
    };
    const onRestartEvent = (e: any) => {
      if (e.detail.taskId === id) restart();
    };
    window.addEventListener("timer-reset", onResetEvent);
    window.addEventListener("timer-restart", onRestartEvent);
    return () => {
      window.removeEventListener("timer-reset", onResetEvent);
      window.removeEventListener("timer-restart", onRestartEvent);
    };
  }, [id]);

  // Load persisted time and running state
  useEffect(() => {
    const { time: savedTime, started_at } = loadTimeForTask(id);
    currentTimeRef.current = savedTime;
    if (started_at) {
      const startedMs = new Date(started_at).getTime();
      startTimeRef.current = startedMs;
      setIsRunning(true);
      if (duration) {
        const end = startedMs + (duration - savedTime);
        endTimeRef.current = end;
        if (Date.now() >= end) {
          setIsFinished(true);
          if (document.visibilityState !== "visible") showNotification();
        }
      }
    }
    forceRender((t) => t + 1);
  }, [id, loadTimeForTask, duration]);

  // Re‑render loop
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

  // Timer finish
  useEffect(() => {
    if (!duration || !isRunning || !endTimeRef.current) return;
    const remaining = endTimeRef.current - Date.now();
    if (remaining <= 0) {
      setIsFinished(true);
      soundEnd.play();
      if (document.visibilityState !== "visible") showNotification();
      document.title = "⏰ Time's up!";
      return;
    }
    const timeout = setTimeout(() => {
      setIsFinished(true);
      soundEnd.play();
      if (document.visibilityState !== "visible") showNotification();
      document.title = "⏰ Time's up!";
    }, remaining);
    return () => clearTimeout(timeout);
  }, [isRunning, duration]);

  useEffect(() => {
    return () => soundEnd.stop();
  }, []);

  // ---------- Control functions ----------

  const start = () => {
    const now = Date.now();
    startTimeRef.current = now;
    endTimeRef.current = duration
      ? now + (duration - currentTimeRef.current)
      : null;
    setIsRunning(true);
    onStart(id, new Date(now).toISOString());
  };

  const stop = () => {
    if (!startTimeRef.current) return;
    const elapsed =
      currentTimeRef.current + (Date.now() - startTimeRef.current);
    startTimeRef.current = null;
    endTimeRef.current = null;
    currentTimeRef.current = elapsed;
    setIsRunning(false);
    onStop(id, elapsed);
  };

  const reset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    currentTimeRef.current = 0;
    startTimeRef.current = null;
    endTimeRef.current = null;
    setIsRunning(false);
    setIsFinished(false);
    forceRender((t) => t + 1);

    soundEnd.stop();
    document.title = "Stopwatches";
    closeNotification(); // fire‑and‑forget
    onReset(id);
  };

  const restart = () => {
    reset();
    start();
  };

  const startStop = async () => {
    if (isFinished) {
      restart();
      return;
    }
    if (isRunning) stop();
    else start();
    await closeNotification();
    await requestNotificationPermission();
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

  // Hotkeys
  const HotkeySwitchRef = useHotkeys<HTMLParagraphElement>("s", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    if (isFinished) restart();
    else isRunning ? stop() : start();
  });

  const HotkeyResetRef = useHotkeys<HTMLParagraphElement>("r", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    reset();
  });

  useHotkeys<HTMLParagraphElement>("ctrl + r", (e) => {
    e.preventDefault();
    if (e.repeat) return;
    if (duration === 0) reset();
  });

  const mergedRef = useMergeRefs(setNodeRef, HotkeySwitchRef, HotkeyResetRef);

  // Edit modal
  const openEditModal = () => setIsDialogOpen(true);
  const closeEditModal = () => setIsDialogOpen(false);

  const handleEditStopwatch = (
    id: number,
    changes: { title: string; time: number },
  ) => {
    onEdit(id, changes);
    closeEditModal();
  };

  const handleEditTimer = (
    id: number,
    changes: { title: string; duration: number },
  ) => {
    onEdit(id, changes);
    closeEditModal();
  };

  return (
    <>
      <Modal open={isDialogOpen} onClose={closeEditModal}>
        {duration > 0 ? (
          <AddTimer
            isEditing
            id={id}
            oldTitle={title}
            oldDuration={duration}
            onEdit={handleEditTimer}
          />
        ) : (
          <AddStopwatch
            isAdding={false}
            id={id}
            oldTitle={title}
            oldTime={currentTimeRef.current}
            onEdit={handleEditStopwatch}
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
                  onClick={openEditModal}
                  className="text-amber-600 hover:text-amber-800 transition"
                >
                  <TiPencil size={25} />
                </button>
                <button
                  onClick={() => onDelete(duration, id)}
                  className="text-delete hover:text-red-800 transition"
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

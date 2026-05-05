import { useState, useEffect } from "react";

// --------------------------------------------------
// Props for AddStopwatch
// --------------------------------------------------
interface AddStopwatchProps {
  isAdding: boolean;
  oldTitle?: string;
  oldTime?: number; // in ms
  id?: number;
  // Callback when creating a new stopwatch
  onAdd?: (taskData: { title: string; duration: number; time: number }) => void;
  // Callback when editing an existing stopwatch
  onEdit?: (id: number, changes: { title: string; time: number }) => void;
}

export function AddStopwatch({
  oldTitle = "",
  oldTime = 0,
  isAdding,
  id,
  onAdd,
  onEdit,
}: AddStopwatchProps) {
  const [title, setTitle] = useState<string>(oldTitle);
  const [time, setTime] = useState(oldTime);

  // Keep fields in sync when editing different tasks
  useEffect(() => {
    setTitle(oldTitle);
    setTime(oldTime);
  }, [oldTitle, oldTime]);

  const totalSeconds = Math.floor(time / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding && onAdd) {
      onAdd({ title, duration: 0, time });
    } else if (!isAdding && id !== undefined && onEdit) {
      onEdit(id, { title, time });
    }
  };

  return (
    <form className="text-center flex flex-col" onSubmit={handleSubmit}>
      <label className="text-3xl" htmlFor="sname">
        Stopwatch Name:
      </label>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        id="sname"
        name="sname"
        className="py-5 text-3xl text-center text-wrap border-2 bg-foreground"
      />
      <div className="flex text-2xl mt-3">
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
            onChange={(e) => {
              const newHours = Math.max(0, Number(e.target.value));
              setTime((newHours * 3600 + minutes * 60 + seconds) * 1000);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Hours"
            required
          />
          <input
            id="minutes"
            type="number"
            value={minutes}
            onChange={(e) => {
              const newMinutes = Math.max(0, Number(e.target.value));
              setTime((hours * 3600 + newMinutes * 60 + seconds) * 1000);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Minutes"
            required
          />
          <input
            id="seconds"
            type="number"
            value={seconds}
            onChange={(e) => {
              const newSeconds = Math.max(0, Number(e.target.value));
              setTime((hours * 3600 + minutes * 60 + newSeconds) * 1000);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Seconds"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-70 py-2 mt-3 mx-auto bg-primary text-2xl border rounded tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
      >
        {isAdding ? "Create Stopwatch" : "Edit Stopwatch"}
      </button>
    </form>
  );
}

// --------------------------------------------------
// Props for AddTimer
// --------------------------------------------------
interface AddTimerProps {
  // For editing
  isEditing?: boolean;
  oldTitle?: string;
  oldDuration?: number;
  id?: number;
  // Callbacks
  onAdd?: (taskData: { title: string; duration: number }) => void;
  onEdit?: (id: number, changes: { title: string; duration: number }) => void;
}

export function AddTimer({
  isEditing = false,
  oldTitle = "",
  oldDuration = 0,
  id,
  onAdd,
  onEdit,
}: AddTimerProps) {
  const [timerInput, setTimerInput] = useState<string>(oldTitle);
  const [timerDuration, setTimerDuration] = useState(oldDuration);
  const [endSound, setEndSound] = useState("timer_finish_ringing1.mp3");

  useEffect(() => {
    setTimerInput(oldTitle);
    setTimerDuration(oldDuration);
  }, [oldTitle, oldDuration]);

  const totalSeconds = Math.floor(timerDuration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Math.max(1, timerDuration);
    if (isEditing && id !== undefined && onEdit) {
      onEdit(id, { title: timerInput, duration });
    } else if (onAdd) {
      onAdd({ title: timerInput, duration });
    }
  };

  return (
    <form className="text-center flex flex-col" onSubmit={handleSubmit}>
      <label className="text-3xl" htmlFor="tname">
        Timer Name:
      </label>
      <textarea
        value={timerInput}
        onChange={(e) => setTimerInput(e.target.value)}
        id="tname"
        name="tname"
        className="py-5 text-3xl text-center text-wrap border-2 bg-foreground"
      />
      <div className="text-3xl mt-2">Settings</div>
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
            onChange={(e) => {
              const newHours = Math.max(0, Number(e.target.value));
              setTimerDuration(
                (newHours * 3600 + minutes * 60 + seconds) * 1000,
              );
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Hours"
            required
          />
          <input
            id="minutes"
            type="number"
            value={minutes}
            onChange={(e) => {
              const newMinutes = Math.max(0, Number(e.target.value));
              setTimerDuration(
                (hours * 3600 + newMinutes * 60 + seconds) * 1000,
              );
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Minutes"
            required
          />
          <input
            id="seconds"
            type="number"
            value={seconds}
            onChange={(e) => {
              const newSeconds = Math.max(0, Number(e.target.value));
              setTimerDuration(
                (hours * 3600 + minutes * 60 + newSeconds) * 1000,
              );
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Seconds"
            required
          />
        </div>
      </div>
      <div className="text-2xl flex mt-2">
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
        type="submit"
        className="w-70 py-2 mt-3 mx-auto bg-primary text-2xl border rounded tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
      >
        {isEditing ? "Save Changes" : "Create Timer"}
      </button>
    </form>
  );
}

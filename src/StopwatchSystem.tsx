import { useState, useEffect, useRef } from "react";
import supabase from "./supabase-client";
import type { Session } from "@supabase/supabase-js";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  image_url: string;
}

export default function StopwatchSystem({ session }: { session: Session }) {
  const [nameList, setNameList] = useState<Task[]>([]);
  const [input, setInput] = useState<string>("");

  useEffect(() => {
    fetchStopwatches();
  }, []);

  // --- REAL TIME UPDATES (IN PROGRESS) ---
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
          setNameList((prev) => [...prev, newTask]);
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
          setNameList((prev) => prev.filter((el) => el.id !== oldTask.id));
        }
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchStopwatches = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    // data.map((item) => {
    //   console.log(item.title);
    // });

    if (error) {
      console.error("Whoops! While fetching: ", error.message);
      return;
    }

    setNameList(data);
  };

  const addStopwatch = async () => {
    const { error } = await supabase
      .from("tasks")
      .insert({ title: input, email: session.user.email })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }

    setNameList(nameList);

    // console.log(nameList.indexOf(input));
    // if (nameList.indexOf(input) === -1 && input !== "") {
    //   const temp = [...nameList, input];
    //   localStorage.setItem("nameList", JSON.stringify(temp));
    //   setNameList(temp);
    // } else {
    //   console.log("There is already a Stopwatch with such name!");
    // }
  };
  return (
    <>
      <div className="mt-2 mb-5">
        <h1 className="text-center text-4xl mb-2">My Stopwatches</h1>
        <div className="mx-auto flex flex-col items-center">
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
            value={input}
            onInput={(e: any) => setInput(e.target.value)}
            id="sname"
            name="sname"
            className="w-sm bg-white py-5 text-3xl text-center text-wrap"
          ></textarea>
        </form>
        <div className="flex flex-col items-center gap-4">
          {nameList.map((el) => (
            <Stopwatch
              key={el.id}
              name={el.title}
              id={el.id}
              setNameList={setNameList}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function Stopwatch({
  name,
  id,
  setNameList,
}: {
  name: string;
  id: number;
  setNameList: any;
}) {
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
        // localStorage.setItem(name, JSON.stringify(currentTime));
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        // localStorage.setItem(name, JSON.stringify(savedTimeRef.current));
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, name]);

  // useEffect(() => {
  //   const channel = supabase.channel("tasks-delete");
  //   channel
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "DELETE",
  //         schema: "public",
  //         table: "tasks",
  //       },
  //       (payload) => {
  //         const oldTask = payload.old;
  //         console.log(oldTask);
  //       }
  //     )
  //     .subscribe((status) => {
  //       console.log("Subscription 2: ", status);
  //     });
  //   return () => {
  //     channel.unsubscribe();
  //   };
  // }, []);

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

  const reset = () => {
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

    // const temp = [...nameList];
    // const place = temp.indexOf(input);
    // if (place !== -1) {
    //   localStorage.removeItem(temp[place]);
    //   temp.splice(place, 1);
    //   localStorage.setItem("nameList", JSON.stringify(temp));
    //   setNameList(temp);
    // } else {
    //   console.log("There is no Stopwatch with such name!");
    // }
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

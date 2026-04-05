import { useState } from "react";
import supabase from "../supabase-client";
import type { Session } from "@supabase/supabase-js";

export default function AddStopwatch({ session }: { session: Session }) {
  const [stopwatchInput, setStopwatchInput] = useState<string>("");

  const addStopwatch = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: stopwatchInput,
        email: session.user.email,
        duration: 0,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
  };
  return (
    <>
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
        <button
          className="bg-primary w-70 text-2xl border rounded py-2 mt-3 tracking-widest shadow-xl/10 transition hover:-translate-y-0.5"
          onClick={(e: any) => addStopwatch(e)}
        >
          Create Stopwatch
        </button>
      </form>
    </>
  );
}

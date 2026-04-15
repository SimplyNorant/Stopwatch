import { useState } from "react";
import supabase from "../../supabase-client";
import type { Session } from "@supabase/supabase-js";

export default function AddNote({ session }: { session: Session }) {
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteDesc, setNoteDesc] = useState<string>("");

  const addNote = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from("tasks")
      .insert({
        title: noteTitle,
        description: noteDesc,
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
      <form className="flex items-start gap-2 mb-3">
        <div className="flex flex-col">
          <label htmlFor="title">Title</label>
          <textarea
            value={noteTitle}
            onInput={(e: any) => setNoteTitle(e.target.value)}
            id="description"
            className="w-[20vw] text-3xl text-wrap border-2 bg-foreground overflow-hidden resize-none"
          ></textarea>
        </div>
        <div className="flex flex-col">
          <label htmlFor="description">Description</label>
          <textarea
            value={noteDesc}
            onInput={(e: any) => setNoteDesc(e.target.value)}
            id="description"
            className="w-[40vw] text-3xl text-wrap border-2 bg-foreground overflow-hidden resize-none"
          ></textarea>
        </div>

        <button
          className="w-[20svw] h-19 py-2 mt-3 self-end bg-blue-200 text-2xl border rounded shadow-xl/5 transition hover:-translate-y-0.5"
          onClick={(e: any) => addNote(e)}
        >
          Create <br /> Note
        </button>
      </form>
    </>
  );
}

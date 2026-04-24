import { useState } from "react";
import supabase from "../../supabase-client";

import { useSharedContext } from "../SharedContent";
import { p } from "motion/react-client";

interface EditProps {
  oldTitle?: string;
  oldDescription?: string;
  isAdding: boolean;
  id?: number;
}

export default function NoteModal({
  oldTitle = "",
  oldDescription = "",
  isAdding,
  id,
}: EditProps) {
  const { session } = useSharedContext();

  const [noteTitle, setNoteTitle] = useState<string>(oldTitle);
  const [noteDesc, setNoteDesc] = useState<string>(oldDescription);

  const addNote = async (e: any) => {
    e.preventDefault();
    if (noteTitle === "" && noteDesc === "") return;
    const { error } = await supabase
      .from("notes")
      .insert({
        title: noteTitle,
        description: noteDesc,
        email: session.user.email,
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
  };

  const editNote = async (e: any) => {
    // setNotes((prev) => prev.filter((t) => t.id !== id));
    e.preventDefault();

    // Server delete
    const { error } = await supabase
      .from("notes")
      .update({ title: noteTitle, description: noteDesc })
      .eq("id", id);

    if (error) {
      console.error("Delete failed: ", error);
    }
  };

  return (
    <>
      <form className="flex flex-col justify-center items-center gap-2 mb-3">
        <div className="flex flex-col w-full">
          <label htmlFor="title">Title</label>
          <textarea
            value={noteTitle}
            onInput={(e: any) => setNoteTitle(e.target.value)}
            id="title"
            className="text-3xl text-wrap border-2 bg-foreground overflow-hidden resize-none"
          ></textarea>
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="description">Description</label>
          <textarea
            value={noteDesc}
            onInput={(e: any) => setNoteDesc(e.target.value)}
            id="description"
            className="text-3xl text-wrap border-2 bg-foreground overflow-hidden resize-none"
          ></textarea>
        </div>

        <button
          className="w-1/2 h-19 py-2 mt-3 bg-blue-200 text-2xl border rounded shadow-xl/5 transition hover:-translate-y-0.5"
          onClick={(e: any) => (isAdding ? addNote(e) : editNote(e))}
        >
          {isAdding ? (
            <p>
              Create <br /> Note
            </p>
          ) : (
            <p>
              Edit <br /> Note
            </p>
          )}
        </button>
      </form>
    </>
  );
}

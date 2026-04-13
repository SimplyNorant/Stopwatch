import { useState, useEffect, useRef } from "react";

// DATABASE
import supabase from "../../supabase-client";
import type { Session } from "@supabase/supabase-js";
import { li } from "motion/react-client";

interface Note {
  id?: number;
  title: string;
  description: string;
  created_at?: string;
}

export default function NoteSystem() {
  const [notes, setNotes] = useState<Note[]>([]);

  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteDesc, setNoteDesc] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      await fetchTasks();
    };

    load();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error while fetching tasks: ", error.message);
      return;
    }

    setNotes(data);
  };

  const addNote = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase
      .from("notes")
      .insert({
        title: noteTitle,
        description: noteDesc,
        email: "dobbyplay@outlook.com", // TEMPORARY!!!
      })
      .single();

    if (error) {
      console.error("Whoops! Couldn't add it: ", error.message);
      return;
    }
  };

  return (
    <>
      <div className="ml-5 mt-3 text-2xl">
        <div className="absolute top-3 right-3 text-3xl mr-5">
          <a href="/">back</a>
        </div>

        <div className="mb-1 text-4xl">Notes</div>
        <form className="flex items-start gap-2">
          <div className="flex flex-col">
            <label htmlFor="title">Title</label>
            <input type="text" className="border" id="title" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="description">Description</label>
            <textarea
              value={noteDesc}
              onInput={(e: any) => setNoteDesc(e.target.value)}
              id="description"
              className="text-3xl text-wrap border-2 bg-foreground"
            ></textarea>
          </div>

          <button
            className="w-30 py-2 mt-3 self-end bg-blue-200 text-2xl border rounded shadow-xl/5 transition hover:-translate-y-0.5"
            onClick={(e: any) => addNote(e)}
          >
            Create Note
          </button>
        </form>
        <ul className="list-disc pl-5">
          {notes.map((el) => (
            <li>
              <Note title={el.title} description={el.description} key={el.id} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Note({ title, description }: Note) {
  return (
    <>
      <div>
        <span className="text-3xl font-semibold">{title}</span> -{" "}
        <span>{description}</span>
      </div>
    </>
  );
}

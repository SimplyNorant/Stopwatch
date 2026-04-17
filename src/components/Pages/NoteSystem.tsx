import { useState, useEffect } from "react";
import { useSharedContext } from "../../assets/SharedContent";

// DATABASE
import supabase from "../../supabase-client";

// MODAL
import { Modal } from "../../assets/modals/AddItemModal";
import AddNote from "../../assets/modals/AddNote";
import EditNote from "../../assets/modals/EditNote";

// ICONS
import { TiPencil } from "react-icons/ti";

interface Note {
  id: number;
  title: string;
  description: string;
  created_at?: string;
}

interface NoteProp extends Note {
  onDelete: Function;
}

export default function NoteSystem() {
  const { session } = useSharedContext();

  const [notes, setNotes] = useState<Note[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      await fetchTasks();
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
          table: "notes",
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const newNote = payload.new as Note;

          setNotes((prev) => [...prev, newNote]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notes",
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const oldNote = payload.old;

          setNotes((prev) => prev.filter((el) => el.id !== oldNote.id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `email=eq.${session.user.email}`,
        },
        (payload) => {
          const updatedNote = payload.new as Note;

          setNotes((prev) =>
            prev.map((task) =>
              task.id === updatedNote.id ? updatedNote : task,
            ),
          );
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
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error while fetching tasks: ", error.message);
      return;
    }

    setNotes(data);
  };

  const deleteTask = async (id: number) => {
    setNotes((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      console.error("Delete failed: ", error);
    }
  };

  return (
    <>
      <Modal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        session={session}
      >
        <AddNote />
      </Modal>
      <div className="mx-5 mt-3 text-2xl">
        <div className="absolute top-3 right-3 text-3xl mr-5">
          <a href="/">back</a>
        </div>

        <div className="mb-1 text-4xl">Notes</div>
        <button
          className="bg-primary rounded mb-4 text-3xl px-2 py-4 tracking-widest border shadow-xl/20 transition hover:-translate-y-0.5"
          onClick={() => setIsDialogOpen(true)}
        >
          Add Note
        </button>
        <ul className="list-disc pl-5">
          {notes.map((el) => (
            <li key={el.id}>
              <Note
                id={el.id}
                title={el.title}
                description={el.description}
                onDelete={deleteTask}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Note({ id, title, description, onDelete }: NoteProp) {
  const { session } = useSharedContext();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  return (
    <>
      <Modal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        session={session}
      >
        <EditNote oldTitle={title} oldDescription={description} id={id} />
      </Modal>
      <div className="relative flex gap-3 items-end">
        <div className="w-full mr-15">
          <div className="text-3xl font-semibold text-wrap wrap-anywhere">
            {title}
          </div>
          <div className="text-wrap wrap-anywhere">{description}</div>
        </div>
        <button
          onClick={() => onDelete(id)}
          className="absolute top-0 right-0 text-delete hover:text-red-800 transition"
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
        <button
          onClick={() => setIsDialogOpen(true)}
          className="absolute top-1 right-10 text-amber-600 hover:text-amber-800 transition"
        >
          <TiPencil size={25} />
        </button>
      </div>
    </>
  );
}

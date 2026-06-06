import {
  useState,
  useEffect,
  useCallback,
  type DragEvent,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
  type KeyboardEvent,
} from "react";
import { FiPlus, FiTrash, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "motion/react";
import { FaFire } from "react-icons/fa";

// ---------- Types ----------
interface CardType {
  title: string;
  id: string;
  column: string;
}

type CardsSetter = Dispatch<SetStateAction<CardType[]>>;

// ---------- Custom Hook: Drag & Drop Logic ----------
const useColumnDrag = (
  column: string,
  cards: CardType[],
  setCards: CardsSetter,
) => {
  const [active, setActive] = useState(false);

  const getIndicators = useCallback((): HTMLElement[] => {
    return Array.from(
      document.querySelectorAll<HTMLElement>(`[data-column="${column}"]`),
    );
  }, [column]);

  const clearHighlights = useCallback(
    (els?: HTMLElement[]) => {
      const indicators = els || getIndicators();
      indicators.forEach((i) => (i.style.opacity = "0"));
    },
    [getIndicators],
  );

  const getNearestIndicator = (
    e: DragEvent,
    indicators: HTMLElement[],
  ): { offset: number; element: HTMLElement } => {
    const DISTANCE_OFFSET = 50;
    return indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      },
    );
  };

  const highlightIndicator = useCallback(
    (e: DragEvent) => {
      const indicators = getIndicators();
      clearHighlights(indicators);
      const { element } = getNearestIndicator(e, indicators);
      element.style.opacity = "1";
    },
    [clearHighlights, getIndicators],
  );

  const handleDragStart = (e: DragEvent, card: CardType) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);
    const before = element.dataset.before || "-1";

    if (before !== cardId) {
      let copy = [...cards];
      const cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;

      const updatedCard: CardType = { ...cardToTransfer, column };
      copy = copy.filter((c) => c.id !== cardId);

      const moveToBack = before === "-1";
      if (moveToBack) {
        copy.push(updatedCard);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === -1) return;
        copy.splice(insertAtIndex, 0, updatedCard);
      }

      setCards(copy);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  return {
    active,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  };
};

// ---------- Local Storage Helpers ----------
const STORAGE_KEY = "kanban-cards";

const loadCards = (): CardType[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CardType[]) : [];
  } catch {
    return [];
  }
};

const saveCards = (cards: CardType[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
};

// ---------- Components ----------

export const CustomKanban = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
      <Board />
    </div>
  );
};

const Board = () => {
  const [cards, setCards] = useState<CardType[]>(() => {
    const saved = loadCards();
    return saved.length ? saved : DEFAULT_CARDS;
  });

  // Persist to localStorage whenever cards change
  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  // Search state
  const [search, setSearch] = useState("");

  const filteredCards = cards.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="flex items-center justify-between px-12 pt-6">
        <h1 className="text-xl font-bold">Kanban Board</h1>
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Board columns */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-12">
        <Column
          title="Backlog"
          column="backlog"
          headingColor="text-neutral-400"
          cards={filteredCards}
          setCards={setCards}
        />
        <Column
          title="TODO"
          column="todo"
          headingColor="text-yellow-300"
          cards={filteredCards}
          setCards={setCards}
        />
        <Column
          title="In progress"
          column="doing"
          headingColor="text-blue-300"
          cards={filteredCards}
          setCards={setCards}
        />
        <Column
          title="Complete"
          column="done"
          headingColor="text-emerald-300"
          cards={filteredCards}
          setCards={setCards}
        />
        <BurnBarrel setCards={setCards} />
      </div>
    </div>
  );
};

interface ColumnProps {
  title: string;
  headingColor: string;
  cards: CardType[];
  column: string;
  setCards: CardsSetter;
}

const Column = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
}: ColumnProps) => {
  const {
    active,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
  } = useColumnDrag(column, cards, setCards);

  const filteredCards = cards.filter((c) => c.column === column);

  const updateCard = (id: string, newTitle: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex w-56 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 rounded-lg transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredCards.length === 0 && (
          <p className="mt-4 text-center text-xs text-neutral-500">
            No cards yet
          </p>
        )}
        <AnimatePresence>
          {filteredCards.map((c) => (
            <Card
              key={c.id}
              {...c}
              handleDragStart={handleDragStart}
              onUpdate={updateCard}
              onDelete={deleteCard}
            />
          ))}
        </AnimatePresence>
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

interface CardProps {
  title: string;
  id: string;
  column: string;
  handleDragStart: (e: DragEvent, card: CardType) => void;
  onUpdate: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

const Card = ({
  title,
  id,
  column,
  handleDragStart,
  onUpdate,
  onDelete,
}: CardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(title);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditText(title);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <>
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        draggable
        onDragStartCapture={(e: DragEvent) =>
          handleDragStart(e, { title, id, column })
        }
        className="group relative cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
        exit={{ opacity: 0, scale: 0.8 }}
      >
        {/* Delete button (appears on hover) */}
        <button
          onClick={() => onDelete(id)}
          className="absolute right-1 top-1 hidden rounded p-1 text-neutral-500 hover:text-red-400 group-hover:block"
          title="Delete card"
        >
          <FiX size={14} />
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full rounded bg-neutral-700 p-1 text-sm text-neutral-100 focus:outline-none"
          />
        ) : (
          <p
            onDoubleClick={handleDoubleClick}
            className="cursor-text select-none text-sm text-neutral-100"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDoubleClick();
            }}
          >
            {title}
          </p>
        )}
      </motion.div>
    </>
  );
};

interface DropIndicatorProps {
  beforeId: string | null;
  column: string;
}

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => (
  <div
    data-before={beforeId || "-1"}
    data-column={column}
    className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
  />
);

interface BurnBarrelProps {
  setCards: CardsSetter;
}

const BurnBarrel = ({ setCards }: BurnBarrelProps) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => setActive(false);

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setCards((pv) => pv.filter((c) => c.id !== cardId));
    setActive(false);
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl transition-colors ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

interface AddCardProps {
  column: string;
  setCards: CardsSetter;
}

const AddCard = ({ column, setCards }: AddCardProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim().length) return;

    const newCard: CardType = {
      column,
      title: text.trim(),
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    };

    setCards((pv) => [...pv, newCard]);
    setAdding(false);
    setText("");
  };

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit} className="mt-1">
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="mt-1 flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-300"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

// ---------- Default Data ----------
const DEFAULT_CARDS: CardType[] = [
  { title: "Look into render bug in dashboard", id: "1", column: "backlog" },
  { title: "SOX compliance checklist", id: "2", column: "backlog" },
  { title: "[SPIKE] Migrate to Azure", id: "3", column: "backlog" },
  { title: "Document Notifications service", id: "4", column: "backlog" },
  {
    title: "Research DB options for new microservice",
    id: "5",
    column: "todo",
  },
  { title: "Postmortem for outage", id: "6", column: "todo" },
  { title: "Sync with product on Q3 roadmap", id: "7", column: "todo" },
  {
    title: "Refactor context providers to use Zustand",
    id: "8",
    column: "doing",
  },
  { title: "Add logging to daily CRON", id: "9", column: "doing" },
  {
    title: "Set up DD dashboards for Lambda listener",
    id: "10",
    column: "done",
  },
];

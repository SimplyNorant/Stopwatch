import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { Session } from "@supabase/supabase-js";

// TEMPORARY FOR TESTING
import AddStopwatch from "./AddStopwatch";
import AddTimer from "./AddTimer";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  session: Session;
  isTimer: boolean;
};

export function Modal({ open, onClose, session, isTimer }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-md rounded-lg bg-white p-6 transition duration-300 ease-out">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-delete hover:text-red-800 transition "
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
          {isTimer ? (
            <AddTimer session={session} />
          ) : (
            <AddStopwatch session={session} />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

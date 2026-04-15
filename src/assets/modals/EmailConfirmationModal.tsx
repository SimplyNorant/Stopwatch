import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export function Modal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 transition duration-300 ease-out">
          <DialogTitle className="text-lg font-semibold">
            Confirmation
          </DialogTitle>

          <p className="mt-2 text-sm text-gray-600">
            Pleace follow the link sent to provided email in order to finish
            registration!
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

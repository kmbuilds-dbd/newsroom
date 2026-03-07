"use client";

import { useRef, useEffect, useCallback } from "react";
import SearchBar from "./SearchBar";

interface AddStoryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
  initialQuery?: string;
}

export default function AddStoryModal({
  open,
  onClose,
  onSubmit,
  initialQuery = "",
}: AddStoryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = useCallback(() => {
    document.body.style.overflow = "";
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (query: string) => {
      onSubmit(query);
      handleClose();
    },
    [onSubmit, handleClose]
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="fixed inset-0 m-0 h-full w-full md:m-auto md:h-auto md:max-w-2xl md:w-full md:rounded-lg bg-bg-card border border-timeline-line backdrop:bg-black/60 p-0 open:flex flex-col"
    >
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="font-serif text-xl italic text-text-primary">
          Add a Story
        </h2>
        <button
          onClick={handleClose}
          className="text-text-secondary hover:text-text-primary transition-colors text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="px-6 pb-6">
        <p className="text-text-secondary text-sm mb-4">
          Enter a news event to build its timeline.
        </p>
        <SearchBar onSubmit={handleSubmit} initialQuery={initialQuery} />
      </div>
    </dialog>
  );
}

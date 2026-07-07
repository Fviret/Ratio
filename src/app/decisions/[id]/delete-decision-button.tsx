"use client";

import { useRef } from "react";
import { deleteDecision } from "../actions";

export function DeleteDecisionButton({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={deleteDecision}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Supprimer cette décision ? Cette action est irréversible.")) {
            formRef.current?.requestSubmit();
          }
        }}
        className="rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
      >
        Supprimer
      </button>
    </form>
  );
}

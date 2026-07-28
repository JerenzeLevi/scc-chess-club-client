"use client";

import { SubmitButton } from "@/components/submit-button";

export function DeleteEventButton({
  action,
  eventName,
}: {
  action: () => Promise<void>;
  eventName: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${eventName}"? This permanently removes its registrations, rounds, and pairings.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        type="submit"
        variant="ghost"
        size="sm"
        pendingText="Deleting…"
        className="text-destructive hover:text-destructive"
      >
        Delete
      </SubmitButton>
    </form>
  );
}

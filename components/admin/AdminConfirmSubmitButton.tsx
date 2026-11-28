"use client";

import type { ReactNode } from "react";

type AdminConfirmSubmitButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
};

export default function AdminConfirmSubmitButton({
  children, confirmMessage, className,
}: AdminConfirmSubmitButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) return;
        const form = event.currentTarget.closest("form");
        if (form) form.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}

"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
};

export default function AdminConfirmSubmitButton({
  children, confirmMessage, className, name, value, disabled = false,
}: Props) {
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled || busy}
      className={className}
      aria-busy={busy}
      onClick={(event) => {
        event.preventDefault();
        if (disabled || submitting.current) return;
        const button = event.currentTarget;
        const form = button.form;
        if (!form || !form.reportValidity()) return;
        if (!window.confirm(confirmMessage)) return;
        submitting.current = true;
        setBusy(true);
        form.requestSubmit(button);
      }}
    >
      {busy ? "Processing…" : children}
    </button>
  );
}

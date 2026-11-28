"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  requiredFieldName?: string;
  requiredWhenValue?: string;
};

export default function AdminConfirmSubmitButton({
  children, confirmMessage, className, name, value, disabled = false,
  requiredFieldName, requiredWhenValue,
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
        if (!form) return;
        if (requiredFieldName && value === requiredWhenValue) {
          const field = form.elements.namedItem(requiredFieldName);
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            if (!field.value.trim()) {
              field.setCustomValidity("এই সিদ্ধান্তের জন্য review note লিখুন।");
              field.reportValidity();
              field.setCustomValidity("");
              field.focus();
              return;
            }
          }
        }
        if (!form.reportValidity()) return;
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

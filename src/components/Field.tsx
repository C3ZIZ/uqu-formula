// A labelled form field with an error message and an optional password toggle.
"use client";

import { CircleAlert } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  latin?: boolean;
  showLabel?: string;
  hideLabel?: string;
}

/** Shows an error next to its field, using an icon as well as text. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={id} role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      {message}
    </p>
  );
}

/** Renders an input with a visible label. Passwords get a show and hide button. */
export function Field({ label, error, latin, showLabel, hideLabel, type, ...input }: FieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={latin ? "field field--latin" : "field"}>
      <label htmlFor={id}>{label}</label>
      <div className="field-row">
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
        />
        {isPassword ? (
          <button type="button" className="field-toggle" onClick={() => setRevealed(!revealed)}>
            {revealed ? hideLabel : showLabel}
          </button>
        ) : null}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

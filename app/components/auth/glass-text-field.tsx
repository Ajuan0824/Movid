"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type GlassTextFieldProps = {
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  visibilityLabels?: { show: string; hide: string };
};

export function GlassTextField({
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  visibilityLabels = { show: "Show password", hide: "Hide password" },
}: GlassTextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const isPassword = type === "password";
  const resolvedType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-[#697061] dark:text-[#a6b0a3]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={`ios-input ${isPassword ? "pr-11" : ""} ${error ? "ios-input-error" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((current) => !current)}
            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-[#697061] dark:text-[#a0aa99] hover:text-[#53604e] dark:hover:text-[#d1dbc9]"
            aria-label={reveal ? visibilityLabels.hide : visibilityLabels.show}
            aria-pressed={reveal}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-[#b65742] dark:text-[#f2a18a]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

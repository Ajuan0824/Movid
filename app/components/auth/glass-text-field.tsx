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
};

export function GlassTextField({ label, type = "text", value, onChange, error, autoComplete }: GlassTextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const isPassword = type === "password";
  const resolvedType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#6d6b79] dark:text-[#a79fb5]">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={`ios-input ${isPassword ? "pr-11" : ""} ${error ? "ios-input-error" : ""}`}
          aria-invalid={Boolean(error)}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9996a4] dark:text-[#8b8697] hover:text-[#4f4d5a] dark:hover:text-[#d8d3e2]"
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-[#e0507a] dark:text-[#ff8fae]">{error}</p> : null}
    </div>
  );
}

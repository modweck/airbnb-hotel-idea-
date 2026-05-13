"use client";

import { useEffect, useRef, useState } from "react";

interface PlaceAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PlaceAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  required,
  className,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced fetch suggestions
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places-autocomplete?q=${encodeURIComponent(value)}`
        );
        if (res.ok) {
          const data = (await res.json()) as string[];
          setSuggestions(data);
          setOpen(data.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // silently ignore
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(s: string) {
    onChange(s);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative" style={{ zIndex: open ? 999 : "auto" }}>
      <input
        id={id}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {suggestions.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => selectSuggestion(s)}
              className={`cursor-pointer px-4 py-2.5 text-sm ${
                i === activeIndex
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

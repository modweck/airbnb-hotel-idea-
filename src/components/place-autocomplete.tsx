import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { autocompletePlaces } from "@/client/places";

interface PlaceAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After picking a suggestion the value updates to the full place name —
  // skip the next fetch so the dropdown doesn't reopen.
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (value.length < 2) {
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await autocompletePlaces(value);
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // silently ignore
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  function selectSuggestion(s: string) {
    skipNextFetchRef.current = true;
    onChange(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <View className="relative" style={open ? { zIndex: 9999 } : undefined}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={(v) => {
          if (v.length < 2 && suggestions.length > 0) {
            setSuggestions([]);
            setOpen(false);
          }
          onChange(v);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        autoCorrect={false}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <View
          className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          style={{ zIndex: 9999 }}
        >
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPressIn={() => selectSuggestion(s)}
              className="px-4 py-2.5 active:bg-zinc-100 hover:bg-zinc-50 dark:active:bg-zinc-800 dark:hover:bg-zinc-800/50"
            >
              <Text className="text-sm text-zinc-900 dark:text-zinc-100">{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

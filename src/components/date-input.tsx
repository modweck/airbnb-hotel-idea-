import { TextInput } from "react-native";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Fallback for native (iOS/Android) — replace with a native picker later. */
export function DateInput({ value, onChange, className }: DateInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      autoCapitalize="none"
      autoCorrect={false}
      className={className}
    />
  );
}

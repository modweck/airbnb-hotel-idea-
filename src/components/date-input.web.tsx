interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Web date picker — uses the native browser <input type="date"> which gives a
 * calendar popover for free. Native iOS/Android renders the TextInput fallback
 * in date-input.tsx until we wire up a native date picker.
 */
export function DateInput({ value, onChange, className }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => {
        // Open the calendar on any click in the field, not just the icon.
        // Older browsers (and Safari < 16.4) silently ignore showPicker.
        e.currentTarget.showPicker?.();
      }}
      className={className}
      style={{
        fontFamily: "inherit",
        fontSize: 16,
        cursor: "pointer",
      }}
    />
  );
}

import Select, { type SingleValue } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: SelectOption | null;
  placeholder?: string;
  onChange?: (option: SelectOption | null) => void;
  isDisabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  placeholder = "Select...",
  onChange,
  isDisabled = false,
}: SearchableSelectProps) {
  return (
    <Select
      options={options}
      value={value}
      placeholder={placeholder}
      isSearchable
      isDisabled={isDisabled}
      onChange={(option: SingleValue<SelectOption>) =>
        onChange?.(option ?? null)
      }
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 36,
          height: 36,
          borderRadius: 6,
          borderColor: state.isFocused ? "#2563eb" : "#d1d5db",
          boxShadow: "none",
          "&:hover": {
            borderColor: "#2563eb",
          },
        }),
        valueContainer: (base) => ({
          ...base,
          height: 36,
          padding: "0 8px",
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
          fontSize: "14px",
        }),
        placeholder: (base) => ({
          ...base,
          fontSize: "14px",
          color: "#9ca3af",
        }),
        singleValue: (base) => ({
          ...base,
          fontSize: "14px",
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: 36,
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: 6,
        }),
        clearIndicator: (base) => ({
          ...base,
          padding: 6,
        }),
      }}
    />
  );
}
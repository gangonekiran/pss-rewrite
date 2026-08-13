import type { ChangeEvent } from "react";

interface NotesProps {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function Notes({
  value = "",
  onChange,
  readOnly = false,
}: NotesProps) {
  function handleChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    onChange?.(event.target.value);
  }

  return (
    <div className="flex h-full flex-col">
      <label className="mb-2 text-sm font-medium text-gray-700">
        Notes
      </label>

      <textarea
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Enter notes here..."
        className={`min-h-[260px] flex-1 w-full resize-none rounded-md border p-2 text-sm outline-none transition-colors ${
          readOnly
            ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500"
            : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
      />
    </div>
  );
}
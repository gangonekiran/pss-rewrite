export default function Notes() {
  return (
    <div className="flex h-full flex-col">
      <label className="mb-2 text-sm font-medium text-gray-700">
        Notes
      </label>

      <textarea
        placeholder="Enter notes here..."
        className="
          min-h-[260px]
          flex-1
          w-full
          resize-none
          rounded-md
          border
          border-gray-300
          bg-white
          p-2
          text-sm
          text-gray-900
          outline-none
          transition-colors
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      />
    </div>
  );
}
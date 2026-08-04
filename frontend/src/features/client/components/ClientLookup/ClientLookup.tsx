import SearchableSelect, {
  type SelectOption,
} from "../../../../components/select/SearchableSelect";

const lastNames: SelectOption[] = [
  { value: "Austin", label: "Austin" },
  { value: "Johnson", label: "Johnson" },
  { value: "Smith", label: "Smith" },
];

const firstNames: SelectOption[] = [
  { value: "Jane", label: "Jane" },
  { value: "John", label: "John" },
  { value: "Michael", label: "Michael" },
];

const ssns: SelectOption[] = [
  { value: "123-45-6789", label: "123-45-6789" },
  { value: "987-65-4321", label: "987-65-4321" },
];

export default function ClientLookup() {
  return (
    <div className="bg-white">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Section */}
        <div className="col-span-4">
          <h2 className="mb-3 text-base font-semibold text-green-700">
            Lookup Client
          </h2>

          <div className="space-y-3">
            {/* Last Name */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                Last
              </label>

              <SearchableSelect
                options={lastNames}
                placeholder="Select Last Name"
              />

              <button className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100">
                →
              </button>
            </div>

            {/* First Name */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                First
              </label>

              <SearchableSelect
                options={firstNames}
                placeholder="Select First Name"
              />

              <button className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100">
                →
              </button>
            </div>

            {/* DOB */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                DOB
              </label>

              <input
                type="date"
                className="h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
              />

              <button className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100">
                →
              </button>
            </div>

            {/* SSN */}
            <div className="grid grid-cols-[60px_1fr_36px] items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                SSN
              </label>

              <SearchableSelect
                options={ssns}
                placeholder="Select SSN"
              />

              <button className="h-9 w-9 rounded-md border border-gray-300 text-base hover:bg-gray-100">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="col-span-1 flex justify-center">
          <div className="h-full border-l border-gray-300"></div>
        </div>

        {/* Right Section */}
        <div className="col-span-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">
              Client ID
            </span>

            <span className="text-2xl font-bold text-green-700">
              22596
            </span>
          </div>

          <div className="grid grid-cols-[85px_240px_90px_70px] items-center gap-3">
            <label className="text-xs font-medium text-gray-700">
              Last Name
            </label>

            <input
              value="Austin"
              readOnly
              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <label className="text-xs font-medium text-gray-700">
              Gender
            </label>

            <select className="h-9 rounded-md border border-gray-300 px-2 text-sm">
              <option>Female</option>
              <option>Male</option>
            </select>

            <label className="text-xs font-medium text-gray-700">
              First Name
            </label>

            <input
              value="Jane"
              readOnly
              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">
              SS#
            </label>

            <input
              value="123-45-6789"
              readOnly
              className="h-9 rounded-md border border-gray-300 bg-gray-50 px-2 text-sm"
            />

            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">
              Region
            </label>

            <select className="h-9 rounded-md border border-gray-300 px-2 text-sm">
              <option>St Albans</option>
            </select>

            <div />
            <div />

            <label className="text-xs font-medium text-gray-700">
              Birth Date
            </label>

            <input
              type="date"
              defaultValue="1996-01-11"
              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            />

            <div className="text-sm">
              <span className="text-gray-600">Age:</span>{" "}
              <span className="font-semibold text-green-700">
                28 years
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              Non-EI
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
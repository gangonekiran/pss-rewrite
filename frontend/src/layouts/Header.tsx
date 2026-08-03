import { Bell, ChevronDown, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="rounded-md p-2 transition hover:bg-gray-100">
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            View/Edit Clients
          </h1>

          <p className="text-xs text-gray-500">
            Lookup and manage client information and status
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Notification */}
        <div className="relative cursor-pointer">
          <Bell size={20} />

          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            3
          </span>
        </div>

        <div className="h-8 border-l border-gray-300" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
            JD
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">
              John Doe
            </div>

            <div className="text-xs text-gray-500">
              Admin
            </div>
          </div>

          <ChevronDown size={18} className="cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
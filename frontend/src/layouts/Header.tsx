import { Bell, ChevronDown, Menu } from 'lucide-react';

interface HeaderProps {
  pathname: string;
}

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/': {
    title: 'Dashboard',
  },

  '/clients': {
    title: 'View/Edit Clients',
    subtitle: 'Lookup and manage client information and status',
  },

  '/nopr-forms': {
    title: 'NOPR Forms',
  },

  '/referral-forms': {
    title: 'Referral Forms',
  },

  '/cos-forms': {
    title: 'COS Forms',
  },

  '/exit-forms': {
    title: 'Exit Forms',
  },

  '/insurance-forms': {
    title: 'Insurance Forms',
  },

  '/active-forms': {
    title: 'Active Forms',
  },

  '/reports': {
    title: 'Reports',
  },

  '/settings': {
    title: 'Settings',
  },
};

export default function Header({ pathname }: HeaderProps) {
  const config = pageConfig[pathname] ?? {
    title: 'CIS Rewrite',
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-5">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="rounded-md p-2 transition hover:bg-gray-100">
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {config.title}
          </h1>

          {config.subtitle && (
            <p className="text-xs text-gray-500">
              {config.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer">
          <Bell size={20} />

          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            3
          </span>
        </div>

        <div className="h-8 border-l border-gray-300" />

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
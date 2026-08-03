import { NavLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { navigation } from '../constants/menu';
import { APP } from '../constants/app';

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm">
      {/* Logo */}

      <div className="border-b border-gray-200 h-16 text-center">
        <img
          src={APP.COMPANY_LOGO}
          alt={APP.COMPANY_NAME}
          className="mx-auto mb-3 h-14 w-16 object-contain"
        />

      </div>

      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200
                  ${
                    isActive
                      ? 'bg-green-100 font-semibold text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={22} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}

      <div className="border-t border-gray-200 p-4">
        <button
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-200
            px-4
            py-3
            transition
            hover:bg-gray-100
          "
        >
          <ChevronLeft size={18} />
          Collapse
        </button>
      </div>
    </aside>
  );
}
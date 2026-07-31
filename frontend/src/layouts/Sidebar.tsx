import { navigation } from "../constants/menu";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 text-white">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className="block rounded px-3 py-2 hover:bg-slate-700"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
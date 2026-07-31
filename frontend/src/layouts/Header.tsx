import { APP } from "../constants/app";

export default function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <img
          src={APP.COMPANY_LOGO}
          alt={APP.COMPANY_NAME}
          className="h-9 w-9"
        />

        <div>
          <h1 className="font-semibold">{APP.HEADER_TITLE}</h1>

          <p className="text-xs text-gray-500">
            {APP.COMPANY_NAME}
          </p>
        </div>
      </div>

      <span>{APP.WELCOME_MESSAGE}</span>
    </header>
  );
}
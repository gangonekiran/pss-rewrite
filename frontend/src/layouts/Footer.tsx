import { APP } from "../constants/app";


export default function Footer() {
  return (
    <footer className="border-t p-4 text-center text-sm text-gray-500">
      {APP.COPYRIGHT}
    </footer>
  );
}
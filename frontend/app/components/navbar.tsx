import { Link } from "@remix-run/react";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold hover:text-blue-200">
            🏛️ PQRSD Hub
          </Link>
          <div className="flex gap-6">
            <Link to="/user" className="hover:text-blue-200 transition">
              Enviar PQRSD
            </Link>
            <Link to="/admin" className="hover:text-blue-200 transition">
              Panel Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Link } from "react-router-dom";
export default function Header() {
  return (
    <header className="fixed top-0 w-full bg-gradient-to-r from-indigo-800 to-blue-900 text-white shadow z-50">
      <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tight">CAREER PORTAL</Link>
        <Link to="/admin/login" className="bg-white text-indigo-800 px-4 py-1 rounded font-bold hover:bg-gray-100 transition-colors">Admin Login</Link>
      </div>
    </header>
  );
}

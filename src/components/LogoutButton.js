import React from "react";
import { MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const LogoutButton = ({ open }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className={`mt-auto transition-all duration-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 p-2.5 text-sm font-medium rounded-lg flex gap-3 items-center w-full ${
        !open && "justify-center"
      }`}
    >
      <span className="block shrink-0 text-lg">
        <MdLogout />
      </span>
      <span
        className={`text-sm text-start font-medium flex-1 ${
          !open && "hidden"
        }`}
      >
        Salir
      </span>
    </button>
  );
};

export default LogoutButton;

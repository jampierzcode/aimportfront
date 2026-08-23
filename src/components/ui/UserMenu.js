import React from "react";
import { Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLogOut, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../AuthContext";

/**
 * Bloque de usuario (avatar + nombre + email) en el TopNavigation. Al hacer
 * click abre un menú con "Mi perfil" y "Cerrar sesión". Se usa en todos los
 * roles (superadmin, repartidor, cliente, ...).
 */
const UserMenu = ({ initials, name, email, profilePath = "/perfil" }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = [
    {
      key: "profile",
      label: "Mi perfil",
      icon: <FiUser />,
      onClick: () => navigate(profilePath),
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Cerrar sesión",
      icon: <FiLogOut />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <button
        type="button"
        className="flex items-center gap-2 pl-4 border-l border-slate-100 cursor-pointer group"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 border border-primary-200">
          {initials}
        </div>
        <div className="flex flex-col text-left min-w-0">
          <h3 className="text-sm font-semibold text-slate-700 leading-none truncate max-w-[160px]">
            {name}
          </h3>
          <span className="text-slate-400 text-xs mt-0.5 truncate max-w-[160px]">
            {email}
          </span>
        </div>
        <FiChevronDown className="text-slate-400 text-sm shrink-0 group-hover:text-slate-600" />
      </button>
    </Dropdown>
  );
};

export default UserMenu;

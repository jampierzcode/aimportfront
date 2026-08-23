import React from "react";
import { NavLink } from "react-router-dom";
import LogoutButton from "../LogoutButton";

import { BsArrowLeftShort, BsArrowRightShort } from "react-icons/bs";
import { useAuth } from "../AuthContext";
import { FaTags } from "react-icons/fa";
import { FiUser } from "react-icons/fi";

const getInitials = (value) => {
  if (!value) return "?";
  const clean = value.split("@")[0].replace(/[._-]+/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Sidebar = ({ open, setOpen }) => {
  const { auth } = useAuth();
  const handlerSidebar = () => {
    setOpen(!open);
  };
  const menuCliente = [
    {
      is_title_head: true,
      title_head: "Envíos",
      items: [
        {
          title: "Mis Pedidos",
          url: "/cliente/pedidos",
          icon: <FaTags />,
        },
      ],
    },
    {
      is_title_head: true,
      title_head: "Sistema",
      items: [
        {
          title: "Mi Perfil",
          url: "/cliente/perfil",
          icon: <FiUser />,
        },
      ],
    },
  ];

  const displayName = auth?.user?.name || auth?.user?.email || "";
  const initials = getInitials(auth?.user?.name || auth?.user?.email);

  return (
    <div className="">
      <div
        className={`z-20 h-screen bg-white border-r border-slate-100 text-light-font p-4 pt-6 flex flex-col ${
          open
            ? "translate-x-0 md:translate-x-0 w-64 md:w-64"
            : "-translate-x-20 w-20 md:translate-x-0 md:block md:w-20"
        } duration-300 fixed md:relative block`}
      >
        {open ? (
          <BsArrowLeftShort
            onClick={handlerSidebar}
            className="hidden md:block bg-white text-primary-600 rounded-full absolute -right-3 top-9 text-3xl border border-slate-200 shadow-card cursor-pointer hover:bg-slate-50"
          />
        ) : (
          <BsArrowRightShort
            onClick={handlerSidebar}
            className="hidden md:block bg-white text-primary-600 rounded-full absolute -right-3 top-9 text-3xl border border-slate-200 shadow-card cursor-pointer hover:bg-slate-50"
          />
        )}

        <div className="overflow-hidden shrink-0">
          <div className="flex items-center justify-center bg-primary-600 rounded-xl py-3">
            <img
              className={`${open ? "h-14" : "h-10"} mx-auto object-contain block transition-all duration-300`}
              src="/logo.jpg"
              alt="Aimport Cargo"
            />
          </div>
        </div>

        <div
          className={`w-full mt-4 py-3 flex items-center gap-3 bg-slate-50 rounded-xl shrink-0 ${
            open ? "px-3" : "px-0 justify-center"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
            {initials}
          </div>
          {open ? (
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-sm font-bold text-slate-800 text-start overflow-hidden text-ellipsis whitespace-nowrap">
                {displayName}
              </h1>
              <span className="inline-block mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-600">
                cliente
              </span>
            </div>
          ) : null}
        </div>

        <nav className="pt-4 flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden">
          {menuCliente.map((item, index) => (
            <div key={index} className={index > 0 ? "mt-1" : ""}>
              {item.is_title_head ? (
                <span
                  className={`block mt-3 mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
                    !open && "text-center"
                  }`}
                >
                  {open ? item.title_head : "•"}
                </span>
              ) : null}
              {item.items.map((i, index) => {
                return (
                  <NavLink
                    key={index}
                    to={i.url}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg p-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-slate-500 font-medium hover:bg-slate-50 hover:text-primary-600"
                      } ${!open ? "justify-center" : ""}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600 transition-opacity ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span className="block text-lg shrink-0">{i.icon}</span>
                        <span className={`text-sm flex-1 text-left ${!open && "hidden"}`}>
                          {i.title}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="pt-2 mt-2 border-t border-slate-100 shrink-0">
          <LogoutButton open={open} />
        </div>
      </div>
      <div
        onClick={() => setOpen(false)}
        className={`${
          open ? "" : "hidden"
        } block md:hidden w-full bg-slate-900 opacity-50 fixed top-0 h-full bottom-0 left-0 right-0 z-10`}
      ></div>
    </div>
  );
};

export default Sidebar;

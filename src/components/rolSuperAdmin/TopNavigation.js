import dayjs from "dayjs";
import React from "react";
import { BsJustifyRight } from "react-icons/bs";

import { useAuth } from "../AuthContext";
import UserMenu from "../ui/UserMenu";
import NotificationBell from "../ui/NotificationBell";

const getInitials = (value) => {
  if (!value) return "?";
  const clean = value.split("@")[0].replace(/[._-]+/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const TopNavigation = ({ open, setOpen }) => {
  const { auth } = useAuth();

  const last_conection = dayjs().format("DD MMM • HH:mm");
  const displayName = auth?.user?.name || auth?.user?.nombre || auth?.user?.email;
  const initials = getInitials(auth?.user?.name || auth?.user?.email);

  return (
    <>
      <div className="hidden lg:block bg-white/80 backdrop-blur px-8 py-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-snug">
              ¡Hola, {displayName}! 👋
            </h1>
            <span className="text-slate-400 text-xs">
              Tu última conexión: {last_conection}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu
              initials={initials}
              name={auth?.user?.nombre || auth?.user?.name}
              email={auth?.user?.email}
              profilePath="/perfil"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between md:hidden bg-white px-4 py-4 border-b border-slate-100">
        <h1 className="text-base font-bold text-slate-800">
          ¡Hola, {displayName}!
        </h1>
        {open ? (
          <BsJustifyRight
            onClick={() => setOpen(false)}
            className="bg-white text-primary-600 text-2xl cursor-pointer"
          />
        ) : (
          <BsJustifyRight
            onClick={() => setOpen(true)}
            className="bg-white text-primary-600 text-2xl cursor-pointer"
          />
        )}
      </div>
    </>
  );
};

export default TopNavigation;

import React from "react";
import { Tooltip } from "antd";
import { BsBellFill } from "react-icons/bs";

/**
 * Campana de notificaciones. Desactivada por ahora: las notificaciones en
 * tiempo real (asignación de pedidos, etc.) se conectarán después vía SSE.
 */
const NotificationBell = () => (
  <Tooltip title="Notificaciones en tiempo real — próximamente">
    <button
      type="button"
      disabled
      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 cursor-not-allowed"
    >
      <BsBellFill className="text-base" />
    </button>
  </Tooltip>
);

export default NotificationBell;

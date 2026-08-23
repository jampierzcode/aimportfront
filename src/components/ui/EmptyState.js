import React from "react";
import { FiInbox } from "react-icons/fi";

/**
 * Estado vacío consistente para tablas/listados sin datos.
 */
const EmptyState = ({
  icon = <FiInbox />,
  title = "Nada por aquí todavía",
  subtitle,
  action,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 py-16 text-center ${className}`}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
      {icon}
    </div>
    <p className="text-sm font-semibold text-slate-600">{title}</p>
    {subtitle ? <p className="max-w-sm text-xs text-slate-400">{subtitle}</p> : null}
    {action ? <div className="mt-2">{action}</div> : null}
  </div>
);

export default EmptyState;

import React from "react";

/**
 * Encabezado estándar de página: eyebrow opcional, título, subtítulo y
 * un slot de acciones a la derecha (botones). Se usa al tope de cada
 * página del panel (Usuarios, Sedes, Pedidos, Dashboard, ...).
 */
const PageHeader = ({ eyebrow, title, subtitle, actions, className = "" }) => (
  <div
    className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}
  >
    <div>
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-800 leading-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    ) : null}
  </div>
);

export default PageHeader;

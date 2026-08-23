import React from "react";

const TONES = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-primary-50 text-primary-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
};

/**
 * Pill pequeño para estados / roles (ej. "entregado", "superadmin").
 * Mapea un status de texto libre a un tono de color razonable si no
 * se pasa `tone` explícito.
 */
const STATUS_TONE = {
  entregado: "emerald",
  finalizada: "emerald",
  "en reparto": "sky",
  "en camino": "sky",
  recepcionado: "sky",
  registrado: "slate",
  "en almacen": "indigo",
  ausente: "amber",
  rechazado: "rose",
  siniestrado: "rose",
  superadmin: "indigo",
  admin: "indigo",
  repartidor: "sky",
  cliente: "slate",
};

const Badge = ({ children, tone, className = "" }) => {
  const key = typeof children === "string" ? children.toLowerCase() : "";
  const resolvedTone = tone || STATUS_TONE[key] || "slate";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${TONES[resolvedTone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

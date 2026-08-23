import React from "react";
import Card from "./Card";

const TONES = {
  indigo: "bg-primary-50 text-primary-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

/**
 * Tarjeta de KPI: icono, etiqueta, valor grande y una pista/tendencia
 * opcional debajo. Usada en el Dashboard y en cabeceras de listados
 * (ej. "Total usuarios").
 */
const StatCard = ({ icon, label, value, hint, tone = "indigo", className = "" }) => (
  <Card className={`flex items-start gap-4 ${className}`}>
    {icon ? (
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${TONES[tone] || TONES.indigo}`}
      >
        {icon}
      </div>
    ) : null}
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-800 leading-none">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  </Card>
);

export default StatCard;

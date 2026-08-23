import React from "react";

/**
 * Contenedor base para todo el sistema: fondo blanco, borde muy sutil,
 * sombra suave y esquinas redondeadas. Úsalo en vez de <div className="bg-white ..."> suelto.
 */
const Card = ({ as: As = "div", className = "", padded = true, ...rest }) => (
  <As
    className={`bg-white rounded-2xl border border-slate-100 shadow-card ${
      padded ? "p-5 md:p-6" : ""
    } ${className}`}
    {...rest}
  />
);

export default Card;

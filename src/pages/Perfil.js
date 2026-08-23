import React, { useState } from "react";
import axios from "axios";
import { Input, Button, message } from "antd";
import { FiUser, FiMail, FiLock } from "react-icons/fi";

import { useAuth } from "../components/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const getInitials = (value) => {
  if (!value) return "?";
  const clean = value.split("@")[0].replace(/[._-]+/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const Perfil = () => {
  const { auth, fetchMe } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [name, setName] = useState(auth?.user?.name || "");
  const [email, setEmail] = useState(auth?.user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = getInitials(auth?.user?.name || auth?.user?.email);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      message.warning("Nombre y email son obligatorios");
      return;
    }
    if (password && password.length < 8) {
      message.warning("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password && password !== confirmPassword) {
      message.warning("Las contraseñas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const payload = { name, email };
      if (password) payload.password = password;

      const response = await axios.put(`${apiUrl}/me`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (response.data.status === "success") {
        message.success("Perfil actualizado correctamente");
        setPassword("");
        setConfirmPassword("");
        await fetchMe(auth.token);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || "No se pudo actualizar el perfil",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <PageHeader
        eyebrow="Sistema"
        title="Mi Perfil"
        subtitle="Actualiza tus datos de acceso al sistema"
      />

      <Card className="mt-6">
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700 border border-primary-200">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {auth?.user?.name}
            </h2>
            <p className="text-sm text-slate-400">{auth?.user?.email}</p>
            {auth?.user?.rol?.name ? (
              <div className="mt-1.5">
                <Badge>{auth.user.rol.name}</Badge>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Nombre completo
            </label>
            <Input
              prefix={<FiUser className="text-slate-400" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Email
            </label>
            <Input
              prefix={<FiMail className="text-slate-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div className="mt-2 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-3">
              Cambiar contraseña (opcional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Nueva contraseña
                </label>
                <Input.Password
                  prefix={<FiLock className="text-slate-400" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Confirmar contraseña
                </label>
                <Input.Password
                  prefix={<FiLock className="text-slate-400" />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="primary" loading={saving} onClick={handleSave}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Perfil;

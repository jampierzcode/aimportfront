import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Table, Spin } from "antd";
import {
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiUsers,
  FiTag,
  FiHome,
  FiArrowUpRight,
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { useAuth } from "../../components/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

const ESTADO_LABELS = {
  sin_estado: "Sin estado",
  entregado: "Entregado",
  registrado: "Registrado",
  recepcionado: "Recepcionado",
  "en camino": "En camino",
  "en almacen": "En almacén",
  "en reparto": "En reparto",
  ausente: "Ausente",
  rechazado: "Rechazado",
  siniestrado: "Siniestrado",
};

const ESTADO_COLORS = {
  entregado: "#10b981",
  registrado: "#94a3b8",
  recepcionado: "#38bdf8",
  "en camino": "#38bdf8",
  "en almacen": "#2d3484",
  "en reparto": "#6366f1",
  ausente: "#f59e0b",
  rechazado: "#f43f5e",
  siniestrado: "#f43f5e",
  sin_estado: "#cbd5e1",
};

const Dashboard = () => {
  const { auth } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, campaignsRes] = await Promise.all([
          axios.get(`${apiUrl}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          axios.get(`${apiUrl}/campaigns`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        if (statsRes.data?.status === "success") {
          setStats(statsRes.data.data);
        }

        const sorted = [...(campaignsRes.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setCampaigns(sorted.slice(0, 6));
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    if (!stats?.pedidosPorEstado) return [];
    return stats.pedidosPorEstado.map((row) => ({
      name: ESTADO_LABELS[row.status] || row.status,
      key: row.status,
      total: row.total,
    }));
  }, [stats]);

  const columns = [
    {
      title: "Campaña",
      dataIndex: "name",
      render: (text, record) => (
        <Link
          to={`/campaigns/${record.id}`}
          className="font-semibold text-slate-700 hover:text-primary-600"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Proveedor",
      dataIndex: ["cliente", "razon_social"],
      render: (_, record) => (
        <span className="text-slate-500">
          {record.cliente?.razon_social || "—"}
        </span>
      ),
    },
    {
      title: "Pedidos",
      dataIndex: ["meta", "totalPedidos"],
      align: "center",
      render: (_, record) => record.meta?.totalPedidos ?? 0,
    },
    {
      title: "Estado",
      align: "center",
      render: (_, record) => {
        const total = Number(record.meta?.totalPedidos ?? 0);
        const faltantes = Number(record.meta?.faltantesCount ?? 0);
        if (total === 0) return <Badge tone="slate">sin pedidos</Badge>;
        return faltantes === 0 ? (
          <Badge tone="emerald">finalizada</Badge>
        ) : (
          <Badge tone="amber">{`${faltantes} pendiente${faltantes === 1 ? "" : "s"}`}</Badge>
        );
      },
    },
    {
      title: "Creada",
      dataIndex: "createdAt",
      render: (value) => (
        <span className="text-slate-400 text-xs">
          {value ? dayjs(value).format("DD MMM YYYY") : "—"}
        </span>
      ),
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Panel general"
        title="Dashboard"
        subtitle="Resumen de pedidos, usuarios y campañas de Aimport Cargo"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          tone="indigo"
          icon={<FiPackage />}
          label="Pedidos totales"
          value={s.totalPedidos ?? 0}
          hint={`${s.pedidosEstaSemana ?? 0} creados esta semana`}
        />
        <StatCard
          tone="amber"
          icon={<FiAlertTriangle />}
          label="Faltantes esta semana"
          value={s.pedidosFaltantesEstaSemana ?? 0}
          hint={`de ${s.pedidosEstaSemana ?? 0} pedidos de la semana`}
        />
        <StatCard
          tone="emerald"
          icon={<FiCheckCircle />}
          label="Entregados esta semana"
          value={s.pedidosEntregadosEstaSemana ?? 0}
          hint="pedidos cerrados en la semana"
        />
        <StatCard
          tone="sky"
          icon={<FiUsers />}
          label="Usuarios"
          value={s.totalUsuarios ?? 0}
          hint="cuentas registradas"
        />
        <StatCard
          tone="indigo"
          icon={<FiTag />}
          label="Campañas activas"
          value={`${s.campanasActivas ?? 0}/${s.totalCampanas ?? 0}`}
          hint="con pedidos pendientes"
        />
        <StatCard
          tone="slate"
          icon={<FiHome />}
          label="Sedes"
          value={s.totalSedes ?? 0}
          hint="puntos registrados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padded={false}>
          <div className="flex items-center justify-between p-5 md:p-6 pb-0">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Campañas recientes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Últimas campañas creadas, con su avance de entrega
              </p>
            </div>
            <Link
              to="/pedidos"
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Ver todas <FiArrowUpRight />
            </Link>
          </div>
          <div className="p-5 md:p-6 pt-4">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={campaigns}
              pagination={false}
              size="middle"
              locale={{
                emptyText: (
                  <EmptyState
                    title="Aún no hay campañas"
                    subtitle="Cuando crees una campaña de pedidos, aparecerá aquí."
                  />
                ),
              }}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-slate-800">
            Pedidos por estado
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            Distribución del último estado registrado
          </p>
          {chartData.length === 0 ? (
            <EmptyState
              title="Sin pedidos todavía"
              subtitle="Los estados de tus pedidos aparecerán aquí."
            />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 34, 160)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #eef1f6",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={16}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={ESTADO_COLORS[entry.key] || "#2d3484"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

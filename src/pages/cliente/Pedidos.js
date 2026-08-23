import React, { useEffect, useState } from "react";
import { Table, message, Button } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEye, FiPackage } from "react-icons/fi";
import { useAuth } from "../../components/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

const PedidosCliente = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [campaigns, setCampaigns] = useState([]); // Estado para almacenar campañas
  const [loading, setLoading] = useState(true);

  const columnsCampaign = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Nombre de Campaña",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold text-slate-700">{text}</span>,
    },
    {
      title: "Fecha de Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (
        <span className="text-slate-400 text-xs">
          {text ? new Date(text).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FiEye />}
          onClick={() => navigate(`/clientecampaigns/${record.id}`)}
        >
          Ver Pedidos
        </Button>
      ),
    },
  ];

  // Función para obtener campañas desde la API
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/cliente/campaigns`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setCampaigns(response.data); // Guardar campañas en el estado
    } catch (error) {
      console.error("Error al obtener campañas:", error);
      message.error("No se pudieron cargar las campañas");
    } finally {
      setLoading(false);
    }
  };

  // useEffect para llamar a la API al montar el componente
  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Envíos"
        title="Mis Pedidos"
        subtitle="Puedes ver todas tus campañas de pedidos aquí"
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          tone="indigo"
          icon={<FiPackage />}
          label="Campañas"
          value={campaigns.length}
        />
      </div>

      <Card className="mt-6" padded={false}>
        <div className="p-2 md:p-3">
          <Table
            dataSource={campaigns}
            columns={columnsCampaign}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <EmptyState
                  title="Aún no tienes campañas"
                  subtitle="Cuando tengas pedidos registrados, tus campañas aparecerán aquí."
                />
              ),
            }}
          />
        </div>
      </Card>
    </div>
  );
};
export default PedidosCliente;

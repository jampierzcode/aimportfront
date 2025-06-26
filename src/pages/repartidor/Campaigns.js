import React, { useEffect, useState } from "react";
import { Table, Select, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";

const CampaignRepartidor = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [campaigns, setCampaigns] = useState([]); // Estado para almacenar campañas

  const columnsCampaign = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nombre de Campaña",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Fecha de Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <button
          className="bg-primary rounded text-white text-sm font-bold px-3 py-2"
          type="primary"
          onClick={() => navigate(`/repartidor/campaigns/${record.id}`)}
        >
          Ver Pedidos
        </button>
      ),
    },
  ];

  // Función para obtener campañas desde la API
  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${apiUrl}/campaignsAsignadas`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setCampaigns(response.data); // Guardar campañas en el estado
    } catch (error) {
      console.error("Error al obtener campañas:", error);
      message.error("No se pudieron cargar las campañas");
    }
  };

  // useEffect para llamar a la API al montar el componente
  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div>
      <Table
        dataSource={campaigns}
        columns={columnsCampaign}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
export default CampaignRepartidor;

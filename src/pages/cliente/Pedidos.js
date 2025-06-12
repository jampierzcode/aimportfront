import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";

const PedidosCliente = () => {
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
          onClick={() => navigate(`/clientecampaigns/${record.id}`)}
        >
          Ver Pedidos
        </button>
      ),
    },
  ];

  // Función para obtener campañas desde la API
  const fetchCampaigns = async () => {
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
    }
  };

  // useEffect para llamar a la API al montar el componente
  useEffect(() => {
    fetchCampaigns();
  }, []);
  // Función para obtener campañas desde la API

  const buscar_sedes = async () => {
    try {
      const response = await axios.get(`${apiUrl}/sedes`);
      console.log(response);
      if (response.data.status === "success") {
        setSedes(response.data.data);
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error("Error al obtener las sedes:", error);
    }
  };
  useEffect(() => {
    buscar_sedes();
  }, [0]);

  return (
    <div>
      <h2 className="text-2xl mb-4">
        <b>Campañas del cliente</b>
        <h3 className="text-xs">Puedes ver todas tus campañas aquí</h3>
      </h2>
      <Table
        dataSource={campaigns}
        columns={columnsCampaign}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};
export default PedidosCliente;

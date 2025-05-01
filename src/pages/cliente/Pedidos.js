import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Modal, Table, Select, message, Input } from "antd";
import axios from "axios";
import { FaFileExcel } from "react-icons/fa";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";

const { Option } = Select;

const PedidosCliente = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [campaigns, setCampaigns] = useState([]); // Estado para almacenar campañas
  const [clientes, setClientes] = useState([]); // Estado para almacenar campañas
  const [sedes, setSedes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleSede, setModalVisibleSede] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [sedeSeleccionadaDestino, setSedeSeleccionadaDestino] = useState(null);
  const [fileSelect, setFileSelect] = useState(null);
  const [selectCliente, setSelectCliente] = useState(null);
  const handleChange = (value) => {
    const clienteSeleccionado = clientes.find(
      (cliente) => cliente.id === value
    );
    setSelectCliente(clienteSeleccionado.id);
  };

  const filterOption = (input, option) => {
    const cliente = clientes.find((c) => c.id === option.value);
    if (!cliente) return false;
    const inputLower = input.toLowerCase();
    return (
      cliente.ruc.toLowerCase().includes(inputLower) ||
      cliente.razonSocial.toLowerCase().includes(inputLower)
    );
  };

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
  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${apiUrl}/clientes`);
      const data = response.data;
      if (data.status == "success") {
        setClientes(data.data); // Guardar campañas en el estado
      } else {
        new Error("Error de fetch");
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      message.error("No se pudieron cargar las clientes");
    }
  };

  // useEffect para llamar a la API al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

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

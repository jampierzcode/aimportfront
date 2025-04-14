import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Table, message, Spin, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { FaArrowLeft } from "react-icons/fa";
import { AiOutlineBarcode, AiOutlineSearch } from "react-icons/ai";
import BarcodeScanner from "../../components/rolSuperAdmin/BarCodeScanner";
import { useAuth } from "../../components/AuthContext";
const { confirm } = Modal;

const CampaignDetails = () => {
  const { auth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { id } = useParams(); // Obtener ID de la URL
  const [campaign, setCampaign] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [visiblePedidos, setVisiblePedidos] = useState([]);
  const [pedidosRegistrados, setPedidosRegistrados] = useState([]);

  const [pedidosCargados, setPedidosCargados] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const applyFilters = () => {
    const regex = /^[a-zA-Z0-9\s]*$/; // Solo letras, números y espacios
    const bol = regex.test(searchTerm);

    if (bol) {
      const filteredPedidos = pedidos.filter((pedido) => {
        const searchRegex = new RegExp(searchTerm, "i");

        const value = pedido.idSolicitante;
        const matchSearch =
          value !== null &&
          value !== undefined &&
          searchRegex.test(value.toString());

        return matchSearch;
      });

      setVisiblePedidos(filteredPedidos);
    } else {
      setSearchTerm("");
    }
  };

  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
  }, [searchTerm]);

  const handleReadPedidos = () => {
    setIsModalOpen(true);
  };

  const handleGenerateCodigos = () => {
    navigate(`/generar-codigos/${id}`);
  };

  const fetchCampaignData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/campaigns/${id}`);
      console.log(response);
      const allPedidos = response.data.pedidos || [];
      const registrados = allPedidos.filter(
        (pedido) => pedido.status === "registrado"
      );

      setCampaign(response.data);
      setPedidos(allPedidos);
      setVisiblePedidos(allPedidos);
      setPedidosRegistrados(registrados);
    } catch (error) {
      console.error("Error al obtener la campaña:", error);
      message.error("No se pudo cargar la campaña.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const columns = [
    {
      title: "ID Pedido",
      dataIndex: "idSolicitante",
      key: "idSolicitante",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let colorClass = "";

        switch (status.toLowerCase()) {
          case "registrado":
            colorClass = "bg-gray-700 text-white";
            break;
          case "recepcionado":
            colorClass = "bg-yellow-600 text-white"; // mostaza
            break;
          case "enviado":
            colorClass = "bg-green-800 text-white";
            break;
          case "recepcionado en destino":
            colorClass = "bg-primary text-white"; // usando tu clase personalizada
            break;
          case "entregado":
            colorClass = "bg-blue-600 text-white";
            break;
          default:
            colorClass = "bg-gray-300 text-black";
        }

        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "Dirección",
      dataIndex: "direccion",
      key: "direccion",
    },
    {
      title: "Sede Origen",
      key: "origen",
      render: (_, record) => {
        return (
          <h1 className={`font-bold text-sm`}>
            {record.origen?.nameReferential || "—"}
          </h1>
        );
      },
    },
    {
      title: "Sede Destino",
      key: "destino",
      render: (_, record) => {
        return (
          <h1 className={`font-bold text-sm`}>
            {record.destino?.nameReferential || "—"}
          </h1>
        );
      },
    },
  ];

  const sendDataCargados = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/senDataPedidosCargadaMasive`,
        { pedidos: pedidosCargados },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      console.log(response);
      const data = response.data;
      if (data.status === "success") {
        setPedidosCargados([]);
        await fetchCampaignData();
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const eliminarProductosNoEncontrados = () => {
    const codigosRegistrados = pedidosRegistrados.map((p) => p.idSolicitante);
    const nuevosPedidosCargados = pedidosCargados.filter((codigo) =>
      codigosRegistrados.includes(codigo)
    );
    setPedidosCargados(nuevosPedidosCargados);
  };
  const recogerPedidos = async () => {
    const codigosPedidos = pedidosRegistrados.map((p) => p.idSolicitante);
    const todosExisten = pedidosCargados.every((codigo) =>
      codigosPedidos.includes(codigo)
    );

    if (!todosExisten) {
      message.error(
        "Hay códigos recogidos que no existen en la lista de pedidos."
      );
      return;
    }

    if (pedidosCargados.length < pedidosRegistrados.length) {
      confirm({
        title: "Cantidad de productos menor",
        icon: <ExclamationCircleOutlined />,
        content:
          "La cantidad de productos recogidos es menor a los cargados en esta campaña, ¿estás seguro de recoger estos productos?",
        okText: "Sí",
        cancelText: "No",
        async onOk() {
          // 👇 Aquí va tu lógica de subida de pedidos cargados
          console.log("Subiendo pedidos cargados...");
          await sendDataCargados();
        },
      });
    } else if (pedidosCargados.length === pedidosRegistrados.length) {
      // 👇 Aquí va tu lógica de subida de pedidos cargados directamente sin confirmación
      console.log("Subiendo todos los pedidos cargados directamente...");
      await sendDataCargados();
    } else {
      message.error("Has recogido más productos de los que hay en la campaña.");
    }
  };

  return (
    <div className="px-6 py-12">
      <div className="flex justify-between gap-3">
        <h2 className="text-2xl">
          <b>Campaña: {campaign?.name}</b>
        </h2>
        <button
          onClick={() => navigate(`/generator-codigos/${id}`)}
          className="px-3 py-2 flex items-center gap-3 bg-black text-white text-sm"
        >
          <handleGenerateCodigos />
          Generar Codigos
        </button>
        {pedidosRegistrados.length > 0 ? (
          <button
            onClick={() => handleReadPedidos()}
            className="px-3 py-2 flex items-center gap-3 bg-blue-600 text-white text-sm"
          >
            <AiOutlineBarcode />
            Leer Pedidos
          </button>
        ) : null}

        <Modal
          title="Lectura de Pedidos"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <button
            onClick={() => eliminarProductosNoEncontrados()}
            className="px-3 py-2 flex items-center gap-3 bg-red-600 text-white text-sm"
          >
            Eliminar pedidos no registrados
          </button>
          <BarcodeScanner
            isModal={isModalOpen}
            pedidos={pedidosRegistrados}
            pedidosCargados={pedidosCargados}
            setPedidosCargados={setPedidosCargados}
          />
          <button
            onClick={() => recogerPedidos()}
            className="px-3 py-2 flex items-center gap-3 bg-primary text-white text-sm"
          >
            Recoger Pedidos
          </button>
        </Modal>
        <button
          onClick={() => navigate("/pedidos")}
          className="px-3 py-2 flex items-center gap-3 bg-primary text-white text-sm"
        >
          <FaArrowLeft /> Regresar
        </button>
      </div>
      {loading ? (
        <Spin size="large" />
      ) : (
        <div>
          <h3 className="text-xs">Puedes ver todos tus pedidos aquí</h3>
          <div className="search-hook flex-grow">
            <div className="inmocms-input bg-white border rounded border-gray-300 flex text-sm h-[46px] overflow-hidden font-normal">
              <input
                className="h-full px-[12px] w-full border-0 border-none focus:outline-none"
                placeholder="Ingresa numero de tracking 00000001"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="on"
              />
              <AiOutlineSearch className="h-full w-[24px] min-w-[24px] opacity-5 mx-[12px]" />
            </div>
          </div>
          <Table
            className="mt-8"
            dataSource={visiblePedidos}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
};

export default CampaignDetails;

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Table, message, Spin, Modal, Select } from "antd";
import { AiOutlineSearch } from "react-icons/ai";
import { useAuth } from "../../components/AuthContext";
import ImageUploadModal from "../../components/rolRepartidor/ImageUploadModal";
const { confirm } = Modal;

const { Option } = Select;
const PedidoRepartidor = () => {
  const { auth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;

  const apiUrlUpload = process.env.REACT_APP_UP_MULTIMEDIA;
  const { id } = useParams(); // Obtener ID de la URL
  const [pedidoId, setPedidoId] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [visiblePedidos, setVisiblePedidos] = useState([]);
  const [pedidosRegistrados, setPedidosRegistrados] = useState([]);

  const [pedidosCargados, setPedidosCargados] = useState([]);

  // pedidos que se suben al excel useState
  const [modalVisible, setModalVisible] = useState(false);

  const [pedidosExcel, setPedidosExcel] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [fileSelect, setFileSelect] = useState(null);

  // ✅ Enviar pedidos a la API
  const handleUpload = async (files) => {
    const formData = new FormData();
    const searchPedido = pedidos.find((p) => p.id === pedidoId);

    formData.append("folder", `${searchPedido.idSolicitante}`);

    files.forEach((file) => {
      formData.append("files[]", file);
    });

    try {
      const response = await axios.post(`${apiUrlUpload}/index.php`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = response.data;
      console.log(data);
      if (data.success) {
        console.log(data.files);
        const responseEnviiosMultimedia = await axios.post(
          `${apiUrl}/pedidosMultimedia`,
          { files: data.files, pedido_id: pedidoId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        console.log(response);
        const dataMultimedia = responseEnviiosMultimedia.data;
        if (dataMultimedia.status === "success") {
          message.success("Se subieron las imagenes correctamente");
          const responseUpdatePedido = await axios.put(
            `${apiUrl}/pedidos/${pedidoId}`,
            { status: "entregado" },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
              },
            }
          );
          const dataUpdate = responseUpdatePedido.data;
          if ((dataUpdate.status = "success")) {
            await fetchPedidosAsignados();
            message.success("Se entrego correctamente el pedido");
            setModalVisible(false);
          }
        } else {
          new Error("error de compilacion");
        }
      }
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      message.error("Ocurrió un error al subir las imágenes.");
    }
  };

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchField, setSearchField] = useState("idSolicitante");

  const applyFilters = () => {
    let filtered = pedidos;

    if (searchTerm.trim() !== "") {
      if (
        searchField === "idSolicitante" ||
        searchField === "nombreSolicitante"
      ) {
        const regex = /^[a-zA-Z0-9\s]*$/;
        if (!regex.test(searchTerm)) {
          setSearchTerm("");
          return;
        }

        const searchRegex = new RegExp(searchTerm, "i");

        filtered = pedidos.filter((pedido) => {
          const value = pedido[searchField];
          return (
            value !== null &&
            value !== undefined &&
            searchRegex.test(value.toString())
          );
        });
      }

      if (searchField === "status") {
        filtered = pedidos.filter((pedido) => {
          return (
            pedido.status &&
            pedido.status.toLowerCase() === searchTerm.toLowerCase()
          );
        });
      }
    }

    setVisiblePedidos(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, searchField]);

  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
  }, [searchTerm]);

  const fetchPedidosAsignados = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/pedidoByRepartidor/${auth.user.id}`
      );
      console.log(response);
      const pedidosAsignados = response.data.map((p) => p.pedido);

      setPedidos(pedidosAsignados);
      setVisiblePedidos(pedidosAsignados);
    } catch (error) {
      console.error("Error al obtener los pedidos asignados:", error);
      message.error("No se pudo cargar los pedidos asignados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidosAsignados();
  }, [0]);

  const handleEntregarPedido = (id) => {
    setPedidoId(id);
    setModalVisible(true);
  };
  const handleCancelEntrega = (id) => {
    setPedidoId(null);
    setModalVisible(false);
  };
  const [isOpenMultimedia, setIsOpenMultimedia] = useState(false);
  const [multimedia, setMultimedia] = useState([]);
  const handleVerFotos = (multimedia) => {
    setIsOpenMultimedia(true);
    setMultimedia(multimedia);
  };
  const handleCloseMultimedia = () => {
    setIsOpenMultimedia(false);
    setMultimedia([]);
  };

  const columns = [
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => {
        switch (record.status) {
          case "en reparto":
            return (
              <button
                onClick={() => handleEntregarPedido(record.id)}
                className="px-3 py-2 rounded text-white bg-primary"
              >
                Entregar
              </button>
            );

          default:
            return (
              <button
                onClick={() => handleVerFotos(record.multimedia)}
                className="px-3 py-2 rounded text-white bg-gray-700"
              >
                Ver fotos: {record?.multimedia?.length}
              </button>
            );
        }
      },
    },
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
            colorClass = "bg-yellow-400 text-ywllow-600"; // mostaza
            break;
          case "en camino":
            colorClass = "bg-blue-600 text-white";
            break;
          case "en almacen":
            colorClass = "bg-primary text-white"; // usando tu clase personalizada
            break;
          case "en reparto":
            colorClass = "text-yellow-700 bg-yellow-300"; // usando tu clase personalizada
            break;
          case "entregado":
            colorClass = "bg-green-600 text-white";
            break;
          default:
            colorClass = "bg-gray-300 text-gray-900";
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
      title: "Nombre Solicitante",
      dataIndex: "nombreSolicitante",
      key: "nombreSolicitante",
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

  return (
    <div className="px-6 py-12">
      <div className="flex justify-between gap-3">
        <h2 className="text-2xl">
          <b>Mis pedidos</b>
        </h2>
        <div className="flex gap-4">
          <div className="box px-3 py-2 rounded text-sm font-bold bg-primary text-white">
            Total asignados <span>{pedidos.length}</span>
          </div>
          <div className="box px-3 py-2 rounded text-sm font-bold bg-green-600 text-white">
            Entregados{" "}
            <span>
              {pedidos.filter((p) => p.status === "entregado").length}
            </span>
          </div>
          <div className="box px-3 py-2 rounded text-sm font-bold bg-yellow-300 text-yellow-700">
            Faltantes{" "}
            <span>
              {pedidos.length -
                pedidos.filter((p) => p.status === "entregado").length}
            </span>
          </div>
        </div>
      </div>
      <ImageUploadModal
        isOpen={modalVisible}
        onClose={() => handleCancelEntrega()}
        onUpload={handleUpload}
      />
      <Modal
        open={isOpenMultimedia}
        onCancel={handleCloseMultimedia}
        onClose={handleCloseMultimedia}
        footer={false}
      >
        <div className="flex gap-3 flex-wrap">
          {multimedia.map((m) => {
            return (
              <div className="m">
                <img className="h-[200px] object-contain" src={m.url} alt="" />
              </div>
            );
          })}
        </div>
      </Modal>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div>
          <h3 className="text-xs mb-6">Puedes ver todos tus pedidos aquí</h3>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Selector del tipo de búsqueda */}
            <select
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                setSearchTerm(""); // Resetear el input al cambiar tipo
              }}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="idSolicitante">Buscar por ID</option>
              <option value="nombreSolicitante">Buscar por Nombre</option>
              <option value="status">Buscar por Estado</option>
            </select>

            {/* Campo dinámico según tipo de búsqueda */}
            <div className="flex-grow">
              {searchField === "status" ? (
                <select
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="en reparto">En Reparto</option>
                  <option value="entregado">Entregado</option>
                </select>
              ) : (
                <div className="inmocms-input bg-white border rounded border-gray-300 flex text-sm h-[46px] overflow-hidden font-normal">
                  <input
                    className="h-full px-[12px] w-full border-0 border-none focus:outline-none"
                    placeholder={
                      searchField === "idSolicitante"
                        ? "Ingresa número de tracking 00000001"
                        : "Ingresa nombre del solicitante"
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="on"
                  />
                  <AiOutlineSearch className="h-full w-[24px] min-w-[24px] opacity-5 mx-[12px]" />
                </div>
              )}
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

export default PedidoRepartidor;

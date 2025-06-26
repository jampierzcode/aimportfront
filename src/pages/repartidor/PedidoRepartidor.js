import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Table,
  message,
  Spin,
  Modal,
  Select,
  Row,
  Button,
  Col,
  Checkbox,
  Image,
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { AiOutlineSearch } from "react-icons/ai";
import { useAuth } from "../../components/AuthContext";
import ImageUploadModal from "../../components/rolRepartidor/ImageUploadModal";
import { FiRefreshCw } from "react-icons/fi";
const { confirm } = Modal;
const { Option } = Select;
const PedidoRepartidor = () => {
  const { auth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const apiUrl = process.env.REACT_APP_API_URL;

  const apiUrlUpload = process.env.REACT_APP_UP_MULTIMEDIA;

  const [pedidoId, setPedidoId] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [visiblePedidos, setVisiblePedidos] = useState([]);

  // pedidos que se suben al excel useState
  const [modalVisibleMorePhotos, setModalVisibleMorePhotos] = useState(false);
  const [
    pedidoIdParaActualizarMultimedia,
    setPedidoIdParaActualizarMultimedia,
  ] = useState(null);
  // estados para eliminar imagenes
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const toggleImageSelection = (item) => {
    setSelectedImages((prev) => {
      const exists = prev.some((img) => img.url === item.url);
      return exists
        ? prev.filter((img) => img.url !== item.url)
        : [...prev, item];
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) {
      message.warning("No has seleccionado ninguna imagen.");
      return;
    }

    setLoadingDelete(true);

    try {
      const deleteMultimedia = await axios.post(
        `${apiUrl}/deleteMultimediaMasive`,
        { pedidos: selectedImages },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if ((deleteMultimedia.status = "success")) {
        const payload = {
          urls: selectedImages.map((img) => img.url),
        };
        const response = await axios.delete(`${apiUrlUpload}/index.php`, {
          headers: {
            "Content-Type": "application/json", // <--- JSON, no multipart
          },
          data: payload,
        });
        const data = response.data;
        if (data.success) {
          message.success("Imágenes eliminadas correctamente");
          await fetchPedidosAsignados(); // vuelve a cargar los datos del pedido
          setPedidoIdParaActualizarMultimedia(pedidoId);

          setSelectedImages([]);
        }
      } else {
        new Error(deleteMultimedia.error);
      }
    } catch (error) {
      console.error("Error al eliminar imágenes:", error);
      message.error("Ocurrió un error al eliminar las imágenes.");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ✅ Subir mas fotos a la API
  const handleUploadMorePhotos = async (files) => {
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
          await fetchPedidosAsignados();
          setPedidoIdParaActualizarMultimedia(pedidoId);

          setModalVisibleMorePhotos(false);
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

  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");

  const applyFilters = () => {
    let filtered = pedidos;

    // Filtro por campo textual (ID, nombre, estado)
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
        filtered = filtered.filter((pedido) => {
          const value = pedido[searchField];
          return (
            value !== null &&
            value !== undefined &&
            searchRegex.test(value.toString())
          );
        });
      }

      if (searchField === "status") {
        filtered = filtered.filter((pedido) => {
          return (
            pedido.status &&
            pedido.status.toLowerCase() === searchTerm.toLowerCase()
          );
        });
      }
    }

    // Filtro por departamento
    if (departamento) {
      filtered = filtered.filter(
        (pedido) => pedido.departamento === departamento
      );
    }

    // Filtro por provincia
    if (provincia) {
      filtered = filtered.filter((pedido) => pedido.provincia === provincia);
    }

    // Filtro por distrito
    if (distrito) {
      filtered = filtered.filter((pedido) => pedido.distrito === distrito);
    }

    setVisiblePedidos(filtered);
  };
  const handleResetFilters = () => {
    setSearchTerm("");
    setDepartamento("");
    setProvincia("");
    setDistrito("");
    setSearchField("idSolicitante");
  };

  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtros cuando cambian filtros de texto o ubicación
  }, [searchTerm, searchField, departamento, provincia, distrito]);

  const departamentosUnicos = useMemo(() => {
    const set = new Set();
    visiblePedidos.forEach((p) => set.add(p.departamento));
    return Array.from(set);
  }, [visiblePedidos]);

  const provinciasUnicas = useMemo(() => {
    const set = new Set();
    visiblePedidos.forEach((p) => {
      if (p.departamento === departamento) set.add(p.provincia);
    });
    return Array.from(set);
  }, [visiblePedidos, departamento]);

  const distritosUnicos = useMemo(() => {
    const set = new Set();
    visiblePedidos.forEach((p) => {
      if (p.departamento === departamento && p.provincia === provincia) {
        set.add(p.distrito);
      }
    });
    return Array.from(set);
  }, [visiblePedidos, departamento, provincia]);

  useEffect(() => {
    if (pedidoIdParaActualizarMultimedia && pedidos.length > 0) {
      const pedidoActualizado = pedidos.find(
        (p) => p.id === pedidoIdParaActualizarMultimedia
      );
      if (pedidoActualizado) {
        setMultimedia(pedidoActualizado.multimedia);
        setPedidoIdParaActualizarMultimedia(null); // Limpiar
        setModalVisibleMorePhotos(false); // Cerrar modal si quieres aquí
      }
    }
  }, [pedidos, pedidoIdParaActualizarMultimedia]);

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

  const sendPedidoEntregar = async (id) => {
    try {
      const response = await axios.post(
        `${apiUrl}/pedidoEntregar`,
        { pedido_id: id },
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
        await fetchPedidosAsignados();
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleEntregar = async (id) => {
    confirm({
      title: "Entregar pedido",
      icon: <ExclamationCircleOutlined />,
      content: "Esta seguro de entregar este pedido?",
      okText: "Sí",
      cancelText: "No",
      async onOk() {
        // 👇 Aquí va tu lógica de subida de pedidos cargados
        console.log("Subiendo pedidos cargados...");
        await sendPedidoEntregar(id);
      },
    });
  };
  const handleMorePhotos = () => {
    setModalVisibleMorePhotos(true);
  };
  const [isOpenMultimedia, setIsOpenMultimedia] = useState(false);
  const [multimedia, setMultimedia] = useState([]);
  const handleVerFotos = (multimedia, id) => {
    setPedidoId(id);
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
        return (
          <>
            <button
              onClick={() => handleVerFotos(record.multimedia, record.id)}
              className="px-3 py-2 rounded text-white bg-gray-700"
            >
              Ver fotos: {record?.multimedia?.length}
            </button>
            {record.status === "en reparto" ? (
              <button
                onClick={() => handleEntregar(record.id)}
                className="px-3 py-2 rounded text-white bg-primary"
              >
                Entregar
              </button>
            ) : null}
          </>
        );
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
      render: (_, record) => {
        return (
          <>
            <span>{record.direccion}</span>
            <h1>
              {record.departamento}-{record.provincia}-{record.distrito}
            </h1>
          </>
        );
      },
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
    <div>
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
        isOpen={modalVisibleMorePhotos}
        onClose={() => setModalVisibleMorePhotos(false)}
        onUpload={handleUploadMorePhotos}
      />

      <Modal
        title="Eliminar Imágenes"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedImages([]);
        }}
        footer={false}
        width={800}
      >
        <Row gutter={[16, 16]}>
          {multimedia.map((item) => (
            <Col key={item.id} span={6}>
              <div style={{ position: "relative" }}>
                <Image
                  src={item.url}
                  alt="Imagen"
                  width="100%"
                  height={150}
                  style={{ objectFit: "cover", borderRadius: "8px" }}
                />
                <Checkbox
                  checked={selectedImages.some((img) => img.url === item.url)}
                  onChange={() => toggleImageSelection(item)}
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "white",
                    padding: "2px",
                    borderRadius: "50%",
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Button
            danger
            type="primary"
            // icon={<DeleteOutlined />}
            onClick={handleDeleteSelected}
            loading={loadingDelete}
          >
            Eliminar seleccionadas
          </Button>
        </div>
      </Modal>

      <Modal
        open={isOpenMultimedia}
        onCancel={handleCloseMultimedia}
        onClose={handleCloseMultimedia}
        footer={false}
      >
        <div className="w-full">
          <div className="w-full flex gap-3 mb-6">
            <button
              onClick={() => handleMorePhotos()}
              className="px-3 py-2 rounded bg-primary text-white"
            >
              Subir imagenes
            </button>
            <button
              onClick={() => setDeleteModalVisible(true)}
              className="px-3 py-2 rounded bg-red-700 text-white"
            >
              Eliminar imagenes
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {multimedia.map((m, index) => {
              return (
                <div className="m" key={index}>
                  <img
                    className="h-[200px] object-contain"
                    src={m.url}
                    alt=""
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {loading ? (
        <Spin size="large" />
      ) : (
        <div>
          <h3 className="text-xs mb-6">Puedes ver todos tus pedidos aquí</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Select
              placeholder="Selecciona un departamento"
              value={departamento || undefined}
              onChange={(value) => {
                setDepartamento(value);
                setProvincia(""); // reset al cambiar
                setDistrito(""); // reset al cambiar
              }}
              className="w-full max-w-xs"
              allowClear
            >
              {departamentosUnicos.map((dep) => (
                <Option key={dep} value={dep}>
                  {dep}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Selecciona una provincia"
              value={provincia || undefined}
              onChange={(value) => {
                setProvincia(value);
                setDistrito(""); // reset al cambiar
              }}
              className="w-full max-w-xs"
              disabled={!departamento}
              allowClear
            >
              {provinciasUnicas.map((prov) => (
                <Option key={prov} value={prov}>
                  {prov}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Selecciona un distrito"
              value={distrito || undefined}
              onChange={(value) => setDistrito(value)}
              className="w-full max-w-xs"
              disabled={!provincia}
              allowClear
            >
              {distritosUnicos.map((dist) => (
                <Option key={dist} value={dist}>
                  {dist}
                </Option>
              ))}
            </Select>
          </div>
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

            <button
              onClick={() => handleResetFilters()}
              className="shadow px-3 py-2 rounded bg-white text-gray-800"
            >
              <FiRefreshCw />
            </button>
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

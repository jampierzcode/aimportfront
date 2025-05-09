import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Table,
  message,
  Spin,
  Modal,
  Select,
  Button,
  Row,
  Col,
  Image,
  Checkbox,
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
  FaArrowLeft,
  FaFileExcel,
  FaResearchgate,
  FaUsers,
} from "react-icons/fa";
import {
  AiOutlineBarcode,
  AiOutlineDoubleRight,
  AiOutlineDownload,
  AiOutlineSearch,
  AiOutlineUpload,
} from "react-icons/ai";
import BarcodeScanner from "../../components/rolSuperAdmin/BarCodeScanner";
import { useAuth } from "../../components/AuthContext";
import ImageUploadModal from "../../components/rolRepartidor/ImageUploadModal";

import ModalAsignarPedidos from "../../components/rolSuperAdmin/ModalAsignarPedidos";
import { BiBarcode } from "react-icons/bi";
import { FiRefreshCw } from "react-icons/fi";
import EstadisticasModal from "../superadmin/EstadisticasModal";
const { confirm } = Modal;

const { Option } = Select;
const CampaignDetailsCliente = () => {
  const { auth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { id } = useParams(); // Obtener ID de la URL
  const [campaign, setCampaign] = useState(null);
  const apiUrlUpload = process.env.REACT_APP_UP_MULTIMEDIA;

  const [pedidoId, setPedidoId] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [visiblePedidos, setVisiblePedidos] = useState([]);
  const [pedidosRegistrados, setPedidosRegistrados] = useState([]);

  // pedidos que se suben al excel useState
  const [modalVisible, setModalVisible] = useState(false);
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
          await fetchCampaignData(); // vuelve a cargar los datos del pedido
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

  const [modalVisibleSede, setModalVisibleSede] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [sedeSeleccionadaDestino, setSedeSeleccionadaDestino] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [pedidosExcel, setPedidosExcel] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [fileSelect, setFileSelect] = useState(null);

  // ✅ Leer Excel

  const [tempPedidos, setTempPedidos] = useState([]);
  const [tempAsignados, setTempAsignados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrigenId, setSelectedOrigenId] = useState(null);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileSelect(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Esta opción convierte todo a texto legible, incluyendo fechas
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      const nuevosPedidos = [];
      const nuevosAsignados = [];

      jsonData.forEach((row, index) => {
        const pedido = {
          id: index + 1,
          id_solicitante: String(row["ID Solicitante"] || ""),
          entrega: String(row["Entrega"] || ""),
          org_ventas: String(row["Org.Ventas"] || ""),
          fecha_pedido: String(row["Fecha Pedido"] || ""),
          dni: String(row["DNI"] || ""),
          bulto: String(row["BULTO"] || ""),
          empaque: String(row["EMPAQUE"] || ""),
          auditoria: String(row["AUDITORIA"] || ""),
          mail_plan: String(row["Mail Plan"] || ""),
          nombre_solicitante: String(row["Nombre Solicitante"] || ""),
          departamento: String(row["Departamento"] || ""),
          provincia: String(row["Provincia"] || ""),
          distrito: String(row["Distrito"] || ""),
          direccion: String(row["Dirección"] || ""),
          referencia: String(row["Referencia"] || ""),
          celular: String(row["Celular"] || ""),
          ubigeo: String(row["Ubigeo"] || ""),
          zona_ventas: String(row["Zona de ventas"] || ""),
          marca: String(row["Marca"] || ""),
          mp: String(row["MP"] || ""),
          num_cajas: String(row["Número de cajas"] || ""),
          status: "registrado",
          sede_id: null,
        };

        const sede = sedes.find((s) => s.department === pedido.departamento);

        if (sede) {
          nuevosAsignados.push({
            ...pedido,
            destino_id: sede.id,
          });
        } else {
          nuevosPedidos.push(pedido);
        }
      });

      console.log(nuevosPedidos);
      setTempPedidos(nuevosPedidos);
      setTempAsignados(nuevosAsignados);
      setShowModal(true); // mostrar modal para seleccionar origen
    };

    reader.readAsArrayBuffer(file);
  };

  // Cuando confirma la selección de origen
  const handleConfirmOrigen = () => {
    if (!selectedOrigenId) {
      alert("Por favor selecciona un origen.");
      return;
    }

    const asignadosConOrigen = tempAsignados.map((asignado) => ({
      ...asignado,
      origen_id: selectedOrigenId,
    }));

    setPedidosExcel(tempPedidos);
    setAsignados(asignadosConOrigen);
    setShowModal(false);
    setSelectedOrigenId(null);
  };

  // ✅ Asignar pedidos a una sede
  const asignarPedidos = () => {
    if (!sedeSeleccionada) {
      message.warning("Selecciona un origen");
      return;
    }
    if (!sedeSeleccionadaDestino) {
      message.warning("Selecciona un destino");
      return;
    }

    const pedidosAsignados = pedidosExcel
      .filter((p) => selectedRows.includes(p.id))
      .map((p) => ({
        ...p,
        origen_id: sedeSeleccionada,
        destino_id: sedeSeleccionadaDestino,
      }));

    console.log(pedidosAsignados);

    setAsignados([...asignados, ...pedidosAsignados]);
    setPedidosExcel(pedidosExcel.filter((p) => !selectedRows.includes(p.id)));
    setSelectedRows([]);
    setModalVisibleSede(false);
  };

  // ✅ Enviar pedidos a la API
  const subirPedidos = async () => {
    if (pedidosExcel.length > 0) {
      message.warning("Aún hay pedidos sin asignar");
      return;
    }
    if (fileSelect === null) {
      message.warning("No se subio ningun archivo excel");
      return;
    }

    const response = await fetch(`${apiUrl}/pedidosMasiveByCampaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: id, pedidos: asignados }),
    });
    console.log(response);

    message.success("Pedidos enviados correctamente");
    setPedidosExcel([]);
    setAsignados([]);
    await fetchCampaignData();
    setModalVisible(false);
  };

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

  const handleReadPedidos = () => {
    setIsModalOpen(true);
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
      title: "ID Pedido",
      key: "idSolicitante",
      render: (_, record) => {
        return (
          <>
            <button
              onClick={() => handleVerFotos(record.multimedia, record.id)}
              className="px-3 py-2 rounded text-white bg-gray-700"
            >
              Ver fotos: {record?.multimedia?.length}
            </button>
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
      render: (_, record) => {
        let colorClass = "";
        let status = record.status;

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
            colorClass = "bg-purple-600 text-white"; // usando tu clase personalizada
            break;
          case "entregado":
            colorClass = "bg-green-600 text-white";
            break;
          default:
            colorClass = "bg-gray-300 text-gray-900";
        }

        return (
          <>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
            >
              {status}
            </span>
          </>
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

  const exportToExcelReport = (pedidos) => {
    const data = pedidos.map((pedido) => {
      const entrega =
        pedido.status === "entregado"
          ? pedido.status_pedido.find((sp) => sp.status === "entregado")
          : null;

      return {
        "Nombre del Solicitante": pedido.nombreSolicitante,
        "ID del Solicitante": pedido.idSolicitante,
        Estado: pedido.status,
        Dirección: pedido.direccion,
        "Origen - Departamento": pedido.origen?.department || "",
        "Origen - Provincia": pedido.origen?.province || "",
        "Origen - Distrito": pedido.origen?.district || "",
        "Destino - Departamento": pedido.destino?.department || "",
        "Destino - Provincia": pedido.destino?.province || "",
        "Destino - Distrito": pedido.destino?.district || "",
        ...(entrega && {
          "Fecha de Entrega": new Date(entrega.createdAt).toLocaleString(),
        }),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Autoajustar el ancho de columnas
    const columnWidths = Object.keys(data[0]).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...data.map((row) => (row[key] ? row[key].toString().length : 0))
        ) + 2, // +2 para dejar algo de margen
    }));
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "pedidos.xlsx");
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <EstadisticasModal pedidos={pedidos} />
        <button
          onClick={() => exportToExcelReport(pedidos)}
          className="bg-blue-500 text-white px-4 py-2 rounded flex gap-3 items-center"
        >
          <AiOutlineDownload />
          Exportar
        </button>
      </div>
      <div className="flex justify-between gap-3">
        <h2 className="text-2xl">
          <b>Campaña: {campaign?.name}</b>
        </h2>
        <p className="text-xs">Puedes ver todos tus pedidos aquí</p>

        <button
          onClick={() => navigate("/cliente/pedidos")}
          className="px-3 py-2 flex items-center gap-3 bg-primary text-white text-sm"
        >
          <FaArrowLeft /> Regresar
        </button>
      </div>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <div className="modal">
          <h2>Algunos registros tienen sede asignada. Selecciona un origen:</h2>
          <Select
            showSearch
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            optionFilterProp="label"
            onChange={(value) => setSelectedOrigenId(value)} // Ahora devuelve el ID
            placeholder="Selecciona una sede"
            style={{ width: "100%" }}
          >
            {sedes.map((sede) => (
              <Option
                key={sede.id}
                value={sede.id} // 👈 Aquí ahora se usa el ID como valor
                label={`${sede.nameReferential} - ${sede.department} ${sede.province} ${sede.district}`}
              >
                {sede.nameReferential} - {sede.department} {sede.province}{" "}
                {sede.district}
              </Option>
            ))}
          </Select>

          <button
            className="px-3 py-2 rounded bg-primary text-white"
            onClick={handleConfirmOrigen}
          >
            Confirmar
          </button>
          <button
            className="px-3 py-2 rounded bg-gray-200 text-gray-500"
            onClick={() => setShowModal(false)}
          >
            Cancelar
          </button>
        </div>
      </Modal>
      <Modal
        open={modalVisibleSede}
        onCancel={() => setModalVisibleSede(false)}
        footer={null}
      >
        <span>Origen</span>
        <Select
          showSearch
          filterOption={(input, option) =>
            option?.label?.toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="label"
          onChange={(value) => setSedeSeleccionada(value)} // Ahora devuelve el ID
          placeholder="Selecciona una sede"
          style={{ width: "100%" }}
        >
          {sedes.map((sede) => (
            <Option
              key={sede.id}
              value={sede.id} // 👈 Aquí ahora se usa el ID como valor
              label={`${sede.nameReferential} - ${sede.department} ${sede.province} ${sede.district}`}
            >
              {sede.nameReferential} - {sede.department} {sede.province}{" "}
              {sede.district}
            </Option>
          ))}
        </Select>
        <span>Destino</span>
        <Select
          showSearch
          filterOption={(input, option) =>
            option?.label?.toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="label"
          onChange={(value) => setSedeSeleccionadaDestino(value)} // Ahora devuelve el ID
          placeholder="Selecciona un destino"
          style={{ width: "100%" }}
        >
          {sedes.map((sede) => (
            <Option
              key={sede.id}
              value={sede.id} // 👈 Aquí ahora se usa el ID como valor
              label={`${sede.nameReferential} - ${sede.department} ${sede.province} ${sede.district}`}
            >
              {sede.nameReferential} - {sede.department} {sede.province}{" "}
              {sede.district}
            </Option>
          ))}
        </Select>

        <Button onClick={asignarPedidos}>Asignar</Button>
      </Modal>
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90vw"
      >
        {" "}
        <div className="flex flex-col gap-3">
          <input type="file" onChange={handleFileUpload} />
          <div className="flex gap-3 justify-between">
            {/* 🟢 Panel Izquierdo - Pedidos sin asignar */}
            <Table
              className="max-w-[500px] overflow-auto"
              rowSelection={{
                selectedRowKeys: selectedRows,
                onChange: setSelectedRows,
              }}
              dataSource={pedidosExcel}
              columns={[
                { title: "ID solicitante", dataIndex: "id_solicitante" },
                { title: "Solicitante", dataIndex: "nombre_solicitante" },
                { title: "Numero de cajas", dataIndex: "num_cajas" },
                { title: "departamento", dataIndex: "departamento" },
                { title: "provincia", dataIndex: "provincia" },
                { title: "distrito", dataIndex: "distrito" },
                { title: "ubigeo", dataIndex: "ubigeo" },
              ]}
              rowKey="id"
            />

            {/* 🟢 Botón Precargar */}
            <div
              className="px-3 py-2 rounded bg-primary text-white font-bold flex items-center gap-3 max-h-max max-w-max"
              onClick={() => setModalVisibleSede(true)}
            >
              Precargar <AiOutlineDoubleRight />
            </div>

            {/* 🟢 Panel Derecho - Pedidos asignados */}
            <Table
              className="max-w-[500px] overflow-auto"
              dataSource={asignados}
              columns={[
                { title: "Solicitante", dataIndex: "nombre_solicitante" },
                { title: "Numero de cajas", dataIndex: "num_cajas" },
                { title: "departamento", dataIndex: "departamento" },
                { title: "provincia", dataIndex: "provincia" },
                { title: "distrito", dataIndex: "distrito" },
                { title: "ubigeo", dataIndex: "ubigeo" },
              ]}
              rowKey="id"
            />
          </div>

          <Button onClick={subirPedidos}>Subir Data</Button>
        </div>
      </Modal>

      <Modal
        open={isOpenMultimedia}
        onCancel={handleCloseMultimedia}
        onClose={handleCloseMultimedia}
        footer={false}
      >
        <div className="w-full">
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

            <div className="flex gap-4">
              <div className="box px-3 py-2 rounded text-sm font-bold bg-primary text-white">
                Total pedidos <span>{pedidos.length}</span>
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

export default CampaignDetailsCliente;

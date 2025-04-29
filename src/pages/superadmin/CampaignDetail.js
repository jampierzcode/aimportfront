import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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
import { FaArrowLeft, FaFileExcel } from "react-icons/fa";
import {
  AiOutlineBarcode,
  AiOutlineDoubleRight,
  AiOutlineSearch,
} from "react-icons/ai";
import BarcodeScanner from "../../components/rolSuperAdmin/BarCodeScanner";
import { useAuth } from "../../components/AuthContext";
import ImageUploadModal from "../../components/rolRepartidor/ImageUploadModal";
import EstadisticasModal from "./EstadisticasModal";
import ModalAsignarPedidos from "../../components/rolSuperAdmin/ModalAsignarPedidos";
const { confirm } = Modal;

const { Option } = Select;
const CampaignDetails = () => {
  const { auth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { id } = useParams(); // Obtener ID de la URL
  const [campaign, setCampaign] = useState(null);
  const apiUrlUpload = process.env.REACT_APP_UP_MULTIMEDIA;

  const [pedidoId, setPedidoId] = useState(null);
  const [showAsignar, setShowAsignar] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [repartidores, setRepartidores] = useState([]);
  const [visiblePedidos, setVisiblePedidos] = useState([]);
  const [pedidosRegistrados, setPedidosRegistrados] = useState([]);

  const [pedidosCargados, setPedidosCargados] = useState([]);

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const nuevosPedidos = [];
      const nuevosAsignados = [];

      jsonData.forEach((row, index) => {
        const pedido = {
          id: index + 1,
          id_solicitante: row["ID Solicitante"],
          nombre_solicitante: row["Nombre Solicitante"],
          departamento: row["Departamento"],
          provincia: row["Provincia"],
          distrito: row["Distrito"],
          direccion: row["Dirección"],
          referencia: row["Referencia"],
          celular: row["Celular"],
          ubigeo: row["Ubigeo"],
          zona_ventas: row["Zona de ventas"],
          marca: row["Marca"],
          mp: row["MP"],
          num_cajas: row["Número de cajas"],
          status: "registrado",
          sede_id: null,
        };

        const sede = sedes.find(
          (s) =>
            s.department === pedido.departamento &&
            s.province === pedido.provincia &&
            s.district === pedido.distrito
        );

        if (sede) {
          nuevosAsignados.push({
            ...pedido,
            destino_id: sede.id,
          });
        } else {
          nuevosPedidos.push(pedido);
        }
      });

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
  const buscar_repartidores = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users/repartidor`);
      console.log(response);
      if (response.data.status === "success") {
        setRepartidores(response.data.data);
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error("Error al obtener los repartidores:", error);
    }
  };
  useEffect(() => {
    buscar_repartidores();
  }, [0]);
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
          await fetchCampaignData();
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

  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
  }, [searchTerm, searchField]);

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

  const handleMorePhotos = () => {
    setModalVisibleMorePhotos(true);
  };

  const [isOpenMultimedia, setIsOpenMultimedia] = useState(false);
  const [multimedia, setMultimedia] = useState([]);

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
        await fetchCampaignData();
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
            {record.status === "en reparto" ? (
              <button
                onClick={() => handleEntregar(record.id)}
                className="px-3 py-2 rounded text-white bg-primary"
              >
                Entregar
              </button>
            ) : null}
            {}
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
            {record?.asignacion !== null ? (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white`}
              >
                Asignado
              </span>
            ) : null}
          </>
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
        <div
          className="max-w-max px-3 py-2 bg-primary text-white font-bold text-sm flex gap-3 items-center cursor-pointer"
          onClick={() => setModalVisible(true)}
        >
          <FaFileExcel /> Subir Masivamente
        </div>
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
      <EstadisticasModal pedidos={pedidos} />
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
          <h3 className="text-xs">Puedes ver todos tus pedidos aquí</h3>
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
          <div className="w-full">
            <button
              onClick={() => setShowAsignar(true)}
              className="rounded px-3 py-2 bg-primary text-white font-bold"
            >
              Asignar Pedidos
            </button>
          </div>
          <ModalAsignarPedidos
            open={showAsignar}
            onClose={setShowAsignar}
            pedidos={pedidos}
            repartidores={repartidores}
            fetchCampaignData={fetchCampaignData}
          />
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

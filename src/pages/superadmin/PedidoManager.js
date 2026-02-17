import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Modal,
  Table,
  Select,
  message,
  Input,
  Popconfirm,
  DatePicker,
  Tag,
} from "antd";
import axios from "axios";
import { FaFileExcel } from "react-icons/fa";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { FcDeleteRow } from "react-icons/fc";

const { Option } = Select;
const { RangePicker } = DatePicker;

const PedidoManager = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const [campaigns, setCampaigns] = useState([]);
  const [clientes, setClientes] = useState([]);

  // filtros
  const [filterClienteId, setFilterClienteId] = useState(null); // proveedor = cliente
  const [filterDateRange, setFilterDateRange] = useState(null); // [dayjs, dayjs]
  const [filterPedidoStatus, setFilterPedidoStatus] = useState(null);

  // otros estados ya existentes (los dejo)
  const [sedes, setSedes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [campaignName, setCampaignName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleSede, setModalVisibleSede] = useState(false);
  const [modalVisibleCreated, setModalVisibleCreated] = useState(false);
  const [sedeSeleccionada, setSedeSeleccionada] = useState(null);
  const [sedeSeleccionadaDestino, setSedeSeleccionadaDestino] = useState(null);
  const [fileSelect, setFileSelect] = useState(null);
  const [selectCliente, setSelectCliente] = useState(null);

  // ✅ helper: counts (vienen del backend como totalPedidos, entregadosCount, faltantesCount)
  const getTotalPedidos = (r) =>
    Number(
      r.meta.totalPedidos ?? r.meta.total_pedidos ?? r.meta.pedidos_count ?? 0,
    );
  const getEntregados = (r) =>
    Number(r.meta.entregadosCount ?? r.meta.entregados_count ?? 0);
  const getFaltantes = (r) => {
    const direct = r.meta.faltantesCount ?? r.meta.faltantes_count;
    if (direct !== undefined && direct !== null) return Number(direct);
    const total = getTotalPedidos(r);
    const ent = getEntregados(r);
    console.log(total);
    console.log(ent);
    return Math.max(total - ent, 0);
  };

  // ✅ status options (por pedidos)
  const pedidoStatusOptions = useMemo(
    () => [
      { value: "finalizada", label: "Finalizadas (todos entregados)" },
      { value: "faltan", label: "Faltan por finalizar" },
      { value: "registrado", label: "Registrado" },
      { value: "recepcionado", label: "Recepcionado" },
      { value: "en camino", label: "En camino" },
      { value: "en almacen", label: "En almacén" },
      { value: "en reparto", label: "En reparto" },
      { value: "entregado", label: "Entregado" },
      { value: "ausente", label: "Ausente" },
      { value: "rechazado", label: "Rechazado" },
      { value: "siniestrado", label: "Siniestrado" },
      { value: "otro", label: "Otro" },
    ],
    [],
  );

  const filterOptionCliente = (input, option) => {
    const cliente = clientes.find((c) => c.id === option.value);
    if (!cliente) return false;
    const inputLower = input.toLowerCase();
    return (
      (cliente.name || "").toLowerCase().includes(inputLower) ||
      (cliente.razon_social || "").toLowerCase().includes(inputLower)
    );
  };

  // ✅ Traer campañas con filtros (backend)
  const fetchCampaigns = async () => {
    try {
      const params = {};

      if (filterClienteId) params.cliente_id = filterClienteId;

      if (filterDateRange && filterDateRange.length === 2) {
        params.from = filterDateRange[0]?.format("YYYY-MM-DD");
        params.to = filterDateRange[1]?.format("YYYY-MM-DD");
      }

      if (filterPedidoStatus) params.pedido_status = filterPedidoStatus;

      const response = await axios.get(`${apiUrl}/campaigns`, { params });
      setCampaigns(response.data);
    } catch (error) {
      console.error("Error al obtener campañas:", error);
      message.error("No se pudieron cargar las campañas");
    }
  };

  // ✅ Traer clientes
  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${apiUrl}/clientes`);
      const data = response.data;
      if (data.status === "success") {
        setClientes(data.data);
      } else {
        throw new Error("Error de fetch");
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      message.error("No se pudieron cargar las clientes");
    }
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ refetch campañas cuando cambian filtros
  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClienteId, filterDateRange, filterPedidoStatus]);

  const limpiarFiltros = () => {
    setFilterClienteId(null);
    setFilterDateRange(null);
    setFilterPedidoStatus(null);
  };

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

    setPedidos(tempPedidos);
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

    const pedidosAsignados = pedidos
      .filter((p) => selectedRows.includes(p.id))
      .map((p) => ({
        ...p,
        origen_id: sedeSeleccionada,
        destino_id: sedeSeleccionadaDestino,
      }));

    console.log(pedidosAsignados);

    setAsignados([...asignados, ...pedidosAsignados]);
    setPedidos(pedidos.filter((p) => !selectedRows.includes(p.id)));
    setSelectedRows([]);
    setModalVisibleSede(false);
  };

  // ✅ Enviar pedidos a la API
  const subirPedidos = async () => {
    if (!campaignName.trim()) {
      message.warning("El nombre de la campaña es obligatorio");
      return;
    }
    if (pedidos.length > 0) {
      message.warning("Aún hay pedidos sin asignar");
      return;
    }
    if (fileSelect === null) {
      message.warning("No se subio ningun archivo excel");
      return;
    }

    const response = await fetch(`${apiUrl}/pedidosMasive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_name: campaignName,
        cliente: selectCliente,
        pedidos: asignados,
      }),
    });
    console.log(response);

    message.success("Pedidos enviados correctamente");
    setPedidos([]);
    setAsignados([]);
    setCampaignName("");
    await fetchCampaigns();
    setModalVisible(false);
  };
  const createdCampaing = async () => {
    if (!campaignName.trim()) {
      message.warning("El nombre de la campaña es obligatorio");
      return;
    }
    if (pedidos.length > 0) {
      message.warning("Aún hay pedidos sin asignar");
      return;
    }

    const response = await fetch(`${apiUrl}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaignName,
        cliente_id: selectCliente,
      }),
    });
    console.log(response);

    message.success("Campaña creada correctamente");

    setCampaignName("");
    await fetchCampaigns();
    setModalVisibleCreated(false);
  };
  // ✅ eliminar campaña
  const eliminarCampaign = async (id) => {
    try {
      await axios.delete(`${apiUrl}/campaigns/${id}`);
      message.success("Campaña eliminada");
      fetchCampaigns();
    } catch (error) {
      console.error("Error al eliminar campaña:", error);
      message.error("No se pudo eliminar la campaña");
    }
  };
  const handleChange = (value) => {
    const clienteSeleccionado = clientes.find(
      (cliente) => cliente.id === value,
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
  // ✅ columnas tabla campañas
  const columns = [
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
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: "Proveedor",
      key: "cliente",
      width: 180,
      render: (_, record) => {
        const c = record.cliente;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>
              {c?.name || c?.razon_social || "—"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {c?.ruc || c?.documento || ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Estado (por pedidos)",
      key: "estadoPedidos",
      width: 160,
      render: (_, record) => {
        const total = getTotalPedidos(record);
        const faltan = getFaltantes(record);

        if (total === 0) return <Tag>Sin pedidos</Tag>;

        if (faltan === 0) return <Tag color="green">Finalizada</Tag>;
        return <Tag color="orange">Faltan</Tag>;
      },
    },
    {
      title: "Totales",
      key: "totales",
      width: 180,
      render: (_, record) => {
        const total = getTotalPedidos(record);
        const ent = getEntregados(record);
        const faltan = getFaltantes(record);

        return (
          <div>
            <div>
              {ent}/{total} entregados
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{faltan} faltan</div>
          </div>
        );
      },
    },
    {
      title: "Fecha de Creación",
      key: "createdAt",
      width: 140,
      render: (_, record) => {
        // si viene createdAt ISO
        const v = record.createdAt || record.created_at;
        if (!v) return "—";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleDateString();
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 220,
      render: (_, record) => (
        <>
          <button
            className="btn btn-primary"
            style={{ marginRight: 8 }}
            onClick={() => navigate(`/campaigns/${record.id}`)}
          >
            Ver Pedidos
          </button>

          <Popconfirm
            title="¿Estás seguro de eliminar esta campaña?"
            okText="Sí"
            cancelText="No"
            onConfirm={() => eliminarCampaign(record.id)}
          >
            <Button danger icon={<FcDeleteRow />}>
              Eliminar
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [0]);

  return (
    <div style={{ padding: 20 }}>
      {/* Header acciones */}
      <div
        className="max-w-max px-3 py-2 bg-gray-300 text-gray-900 font-bold text-sm cursor-pointer"
        onClick={() => setModalVisibleCreated(true)}
      >
        + Crear Nueva Campaña
      </div>
      <div
        className="max-w-max px-3 py-2 bg-primary text-white font-bold text-sm flex gap-3 items-center cursor-pointer"
        onClick={() => setModalVisible(true)}
      >
        <FaFileExcel /> Subir Masivamente
      </div>

      {/* ✅ Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Select
          allowClear
          showSearch
          placeholder="Filtrar por proveedor"
          style={{ width: 240 }}
          value={filterClienteId}
          onChange={(v) => setFilterClienteId(v ?? null)}
          filterOption={filterOptionCliente}
        >
          {clientes.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.name || c.razonSocial}
            </Option>
          ))}
        </Select>

        <RangePicker
          style={{ width: 320 }}
          value={filterDateRange}
          onChange={(v) => setFilterDateRange(v)}
          placeholder={["Start date", "End date"]}
        />

        <Select
          allowClear
          placeholder="Estado por pedidos"
          style={{ width: 260 }}
          value={filterPedidoStatus}
          onChange={(v) => setFilterPedidoStatus(v ?? null)}
        >
          {pedidoStatusOptions.map((o) => (
            <Option key={o.value} value={o.value}>
              {o.label}
            </Option>
          ))}
        </Select>

        <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
      </div>

      {/* Tabla */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={campaigns}
        pagination={{ pageSize: 10 }}
      />
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
        open={modalVisibleCreated}
        onCancel={() => setModalVisibleCreated(false)}
        footer={null}
        width="90vw"
      >
        {" "}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nombre de la campaña"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
          <Select
            showSearch
            placeholder="Selecciona un cliente"
            onChange={handleChange}
            filterOption={filterOption}
            style={{ width: 300 }}
          >
            {clientes.map((cliente) => (
              <Option key={cliente.id} value={cliente.id}>
                {cliente.razonSocial} ({cliente.ruc})
              </Option>
            ))}
          </Select>

          <Button onClick={createdCampaing}>Crear Campaña</Button>
        </div>
      </Modal>
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="90vw"
      >
        {" "}
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nombre de la campaña"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
          <Select
            showSearch
            placeholder="Selecciona un cliente"
            onChange={handleChange}
            filterOption={filterOption}
            style={{ width: 300 }}
          >
            {clientes.map((cliente) => (
              <Option key={cliente.id} value={cliente.id}>
                {cliente.razonSocial} ({cliente.ruc})
              </Option>
            ))}
          </Select>
          <input type="file" onChange={handleFileUpload} />
          <div className="flex gap-3 justify-between">
            {/* 🟢 Panel Izquierdo - Pedidos sin asignar */}
            <Table
              className="max-w-[500px] overflow-auto"
              rowSelection={{
                selectedRowKeys: selectedRows,
                onChange: setSelectedRows,
              }}
              dataSource={pedidos}
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
    </div>
  );
};

export default PedidoManager;

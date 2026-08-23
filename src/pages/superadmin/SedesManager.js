import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, Space, message } from "antd";
import { FiHome, FiPlus } from "react-icons/fi";
import axios from "axios";

import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

const SedesManager = () => {
  const initialSede = {
    name_referential: "",
    direction: "",
    department: "",
    province: "",
    district: "",
  };
  const apiUrl = process.env.REACT_APP_API_URL;
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [modalCreateVisible, setModalCreateVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);

  const [sedeCreate, setSedeCreate] = useState(initialSede);
  const [sedeEdit, setSedeEdit] = useState(initialSede);
  const [selectedId, setSelectedId] = useState(null);

  const fetchSedes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/sedes`);
      console.log(response);

      const data = response.data;
      if (data.status === "success") {
        const reformData = data.data.map((d) => {
          return {
            id: d.id,
            direction: d.direction,
            name_referential: d.nameReferential,
            department: d.department,
            province: d.province,
            district: d.district,
          };
        });
        setSedes(reformData);
      } else {
        new Error("respuesta");
      }
    } catch (error) {
      console.log(error);
      message.error("Error al cargar las sedes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await axios.post(`${apiUrl}/sedes`, sedeCreate);
      message.success("Sede creada correctamente");
      await fetchSedes();
      setModalCreateVisible(false);
      setSedeCreate(initialSede);
    } catch (error) {
      message.error("Error al crear sede");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    console.log("edit");
    console.log(selectedId);
    if (selectedId === null) return;
    setUpdating(true);
    try {
      await axios.put(`${apiUrl}/sedes/${selectedId}`, sedeEdit);
      message.success("Sede actualizada correctamente");
      await fetchSedes();
      setModalEditVisible(false);
      setSedeEdit(initialSede);
      setSelectedId(null);
    } catch (error) {
      message.error("Error al actualizar sede");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: "Nombre Referencial",
      dataIndex: "name_referential",
      key: "name_referential",
      render: (text) => <span className="font-semibold text-slate-700">{text}</span>,
    },
    {
      title: "Dirección",
      dataIndex: "direction",
      key: "direction",
      render: (text) => <span className="text-slate-500">{text || "—"}</span>,
    },
    {
      title: "Departamento",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Provincia",
      dataIndex: "province",
      key: "province",
    },
    {
      title: "Distrito",
      dataIndex: "district",
      key: "district",
    },
    {
      title: "Acciones",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Button
          onClick={() => {
            console.log(record);
            setSedeEdit(record);
            setSelectedId(record.id);
            setModalEditVisible(true);
          }}
        >
          Editar
        </Button>
      ),
    },
  ];

  const renderSedeInputs = (sede, setSede, disabled = false) => (
    <Space direction="vertical" size={14} style={{ width: "100%" }}>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Nombre Referencial
        </label>
        <Input
          placeholder="Ej: Almacén Central"
          value={sede.name_referential}
          onChange={(e) =>
            setSede((prev) => ({ ...prev, name_referential: e.target.value }))
          }
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Dirección
        </label>
        <Input
          placeholder="Dirección completa"
          value={sede.direction}
          onChange={(e) =>
            setSede((prev) => ({ ...prev, direction: e.target.value }))
          }
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Departamento
          </label>
          <Input
            placeholder="Departamento"
            value={sede.department}
            onChange={(e) =>
              setSede((prev) => ({ ...prev, department: e.target.value }))
            }
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Provincia
          </label>
          <Input
            placeholder="Provincia"
            value={sede.province}
            onChange={(e) =>
              setSede((prev) => ({ ...prev, province: e.target.value }))
            }
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Distrito
          </label>
          <Input
            placeholder="Distrito"
            value={sede.district}
            onChange={(e) =>
              setSede((prev) => ({ ...prev, district: e.target.value }))
            }
            disabled={disabled}
          />
        </div>
      </div>
    </Space>
  );

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Logística"
        title="Sedes"
        subtitle="Almacenes y puntos registrados en el sistema"
        actions={
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={() => setModalCreateVisible(true)}
          >
            Crear Sede
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          tone="indigo"
          icon={<FiHome />}
          label="Total sedes"
          value={sedes.length}
        />
      </div>

      <Card className="mt-6" padded={false}>
        <div className="p-2 md:p-3">
          <Table
            dataSource={sedes}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={{
              emptyText: (
                <EmptyState
                  title="Aún no hay sedes"
                  subtitle="Crea la primera sede para empezar a asignar pedidos."
                />
              ),
            }}
          />
        </div>
      </Card>

      {/* Modal de Crear */}
      <Modal
        title="Crear Sede"
        open={modalCreateVisible}
        onCancel={() => setModalCreateVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalCreateVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCreate}
            loading={creating}
            disabled={creating}
          >
            Crear
          </Button>,
        ]}
      >
        {renderSedeInputs(sedeCreate, setSedeCreate, creating)}
      </Modal>

      {/* Modal de Editar */}
      <Modal
        title="Editar Sede"
        open={modalEditVisible}
        onCancel={() => setModalEditVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalEditVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEdit}
            loading={updating}
            disabled={updating}
          >
            Guardar
          </Button>,
        ]}
      >
        {renderSedeInputs(sedeEdit, setSedeEdit, updating)}
      </Modal>
    </div>
  );
};

export default SedesManager;

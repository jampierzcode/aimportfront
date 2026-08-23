import React, { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  message,
  Modal,
  Select,
  Space,
} from "antd";
import { MdAdd } from "react-icons/md";
import { TbAdjustments, TbCaretDownFilled } from "react-icons/tb";
import { AiOutlineSearch } from "react-icons/ai";
import axios from "axios";
import dayjs from "dayjs";
import {
  FaCopy,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaRedo,
  FaTrash,
  FaUserCog,
} from "react-icons/fa";
import { useAuth } from "../../components/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
const { RangePicker } = DatePicker;
const { Option } = Select;
const Usuarios = () => {
  const generateRandomPassword = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
  };
  const generateRandomUuid = (length) => {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
  };
  const { auth } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL;

  //   sedes
  const [sedes, setSedes] = useState([]);
  //   sedes
  const [roles, setRoles] = useState([]);
  //   usuarios
  const [loadingCreateUsuarios, setLoadingCreateUsuarios] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [filterUsuarios, setFilterUsuarios] = useState([]);
  const [usuarioCreate, setUsuarioCreate] = useState({
    name: "",
    email: "",
    password: generateRandomPassword(10),
    rol_id: 2,
    sede_id: 1,
  });
  const [clienteCreate, setClienteCreate] = useState({
    razon_social: "",
    ruc: "",
    usuario_id: null,
    direccion: "",
  });
  const [isCliente, setIsCliente] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [editGenerate, setEditGenerate] = useState(false);
  // const changeGeneratePassword = () => {
  //   setUsuarioCreate({
  //     ...usuarioCreate,
  //     password: generateRandomPassword(10),
  //   });
  // };
  const copiarCredentials = (type) => {
    let valor = usuarioCreate[type];
    console.log(valor);
    navigator.clipboard
      .writeText(valor)
      .then(() => {
        message.success("¡Copiado!");
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles: ", err);
      });
  };
  useEffect(() => {
    if (!editGenerate) {
      let newPass = generateRandomPassword(10);
      setUsuarioCreate({
        ...usuarioCreate,
        password: newPass,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editGenerate]);

  const exportToExcel = (data) => {
    // Mapeamos SOLO los datos necesarios
    const filteredData = data.map((item) => ({
      Name: item.name,
      Email: item.email,
      Sede: `${item.sede.department}, ${item.sede.province}, ${item.sede.district}`,
      Rol: `${item.rol.name}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, "bd_usuarios.xlsx");
  };

  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
  const createUsuario = async (newUsuario) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${apiUrl}/users`, newUsuario, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        });
        const data = response.data;

        resolve(data);
      } catch (error) {
        reject(error);
        console.error("Upload error:", error);
      }
    });
  };
  const createCliente = async (newCliente) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${apiUrl}/clientes`, newCliente, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        });
        const data = response.data;

        resolve(data);
      } catch (error) {
        reject(error);
        console.error("Upload error:", error);
      }
    });
  };
  const handleOkCreate = async () => {
    if (isCliente) {
      if (
        clienteCreate.razon_social === "" ||
        clienteCreate.ruc === "" ||
        clienteCreate.direccion === ""
      ) {
        message.warning(
          "Estas creando un usuario del tipo cliente, porfavor debes registrar los datos de la empresa como RUC, RAZON SOCIAL y DIRECCION",
        );
        return;
      }
    }
    if (
      usuarioCreate.name === "" ||
      usuarioCreate.email === "" ||
      usuarioCreate.sede_id === "" ||
      usuarioCreate.password === ""
    ) {
      message.warning(
        "Los Campos de nombre, email, sede y password deben estar llenos para poder crear al usuario",
      );
      return;
    }
    setLoadingCreateUsuarios(true);
    let uuid = generateRandomUuid(5);
    const newUsuario = { ...usuarioCreate };
    newUsuario.uuid = uuid;
    const userData = await createUsuario(newUsuario);
    console.log(userData);
    if (userData.status === "success") {
      if (isCliente) {
        const newCliente = { ...clienteCreate, usuario_id: userData.data.id };
        const clienteData = await createCliente(newCliente);
        if (clienteData.status === "success") {
          message.success("Se creo correctamente el usuario cliente");
          setUsuarioCreate({
            ...usuarioCreate,
            name: "",
            email: "",
          });
          await buscarUsuarios();
          setLoadingCreateUsuarios(false);
        } else {
          message.error(
            "Ocurrio un error al crear el usuario, intentelo mas tarde",
          );
          setLoadingCreateUsuarios(false);
        }
      } else {
        setUsuarioCreate({
          ...usuarioCreate,
          name: "",
          email: "",
        });
        await buscarUsuarios();
        setLoadingCreateUsuarios(false);
      }
    } else {
      message.error("Ocurrio un error al crear el modelo, intentelo mas tarde");
      setLoadingCreateUsuarios(false);
    }
  };
  const handleCancelCreate = () => {
    setUsuarioCreate({
      name: "",
      email: "",
      password: generateRandomPassword(10),
      rol_id: 2,
      sede_id: 1,
    });
    setIsModalOpenCreate(false);
  };
  // funciones para crear nuevo modelo

  const abrirModalCreate = (e) => {
    e.stopPropagation();
    setUsuarioCreate({
      ...usuarioCreate,
      password: generateRandomPassword(10),
    });
    setIsModalOpenCreate(true);
  };
  const handleUsuarioChangeCreate = (key, value) => {
    if (key === "rol_id") {
      let name_rol = roles.find((r) => r.id === value).name;
      console.log(name_rol);
      if (name_rol === "cliente") {
        setIsCliente(true);
      } else {
        setIsCliente(false);
      }
    }
    setUsuarioCreate((prev) => {
      const newModelo = { ...prev, [key]: value };

      return newModelo;
    });
  };
  const handleClienteChangeCreate = (key, value) => {
    setClienteCreate((prev) => {
      const newModelo = { ...prev, [key]: value };

      return newModelo;
    });
  };

  const items = [
    {
      key: "1",
      label: (
        <p
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.antgroup.com"
        >
          Editar
        </p>
      ),
    },
  ];

  const buscarUsuarios = async () => {
    try {
      const response = await axios.get(`${apiUrl}/usersSuperadmin`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      console.log(response);

      const data = response.data;
      if (data.status === "success") {
        setUsuarios(data.data);
        setFilterUsuarios(data.data);
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };
  useEffect(() => {
    buscarUsuarios();
    // eslint-disable-next-line
  }, [0]);

  const buscarSedes = async () => {
    try {
      const response = await axios.get(`${apiUrl}/sedes`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      console.log(response);

      const data = response.data;
      if (data.status === "success") {
        setSedes(data.data);
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };
  useEffect(() => {
    buscarSedes();
    // eslint-disable-next-line
  }, [0]);

  const buscarRoles = async () => {
    try {
      const response = await axios.get(`${apiUrl}/roles`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      console.log(response);

      const data = response.data;
      if (data.status === "success") {
        setRoles(data.data);
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line
    buscarRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [0]);

  // ESTADOS PARA LA TABLA DINAMICA
  // const [selectsProperties, setSelectsProperties] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10); //items por pagina
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleUsuarios, setVisibleUsuarios] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filters, setFilters] = useState({
    tipo: "",
    precioRange: [0, Infinity],
    pais: "",
    region: "",
    provincia: "",
    distrito: "",
    fechaCreatedRange: [null, null],
    fechaEntregaRange: [null, null],
  });

  // Función para aplicar el filtro
  const detectarTotalPages = (data) => {
    if (data.length === 0) {
      setTotalPages(1);
    } else {
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    }
  };
  const applyFilters = () => {
    const regex = /^[a-zA-Z0-9\s]*$/; // Permite solo letras, números y espacios
    const bol = regex.test(searchTerm) ? true : false;

    if (bol && filterUsuarios.length > 0) {
      const filteredUsuarios = filterUsuarios.filter((usuario) => {
        const searchRegex = new RegExp(searchTerm, "i");

        const matchSearch = Object.values(usuario).some((value) =>
          searchRegex.test(value.toString()),
        );

        const matchFilters =
          !filters.fechaCreatedRange[0] ||
          ((dayjs(usuario.fecha_created).isAfter(
            filters.fechaCreatedRange[0],
            "day",
          ) ||
            dayjs(usuario.fecha_created).isSame(
              filters.fechaCreatedRange[0],
              "day",
            )) &&
            (dayjs(usuario.fecha_created).isBefore(
              filters.fechaCreatedRange[1],
              "day",
            ) ||
              dayjs(usuario.fecha_created).isSame(
                filters.fechaCreatedRange[1],
                "day",
              )));

        return matchSearch && matchFilters;
      });
      detectarTotalPages(filteredUsuarios);
      const objetosOrdenados = filteredUsuarios.sort((a, b) =>
        dayjs(b.fecha_created).isAfter(dayjs(a.fecha_created)) ? 1 : -1,
      );
      const startIndex = (currentPage - 1) * itemsPerPage;
      // setCurrentPage(1);
      const paginatedUsuarios = objetosOrdenados.slice(
        startIndex,
        startIndex + itemsPerPage,
      );

      setVisibleUsuarios(paginatedUsuarios);
    } else {
      setSearchTerm("");
    }
  };

  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUsuarios, currentPage, itemsPerPage, searchTerm]);

  // const handleSelect = (e, id) => {
  //   e.stopPropagation();
  //   setSelectsProperties((prevSelects) => {
  //     if (prevSelects.includes(id)) {
  //       return prevSelects.filter((p) => p !== id);
  //     } else {
  //       return [...prevSelects, id];
  //     }
  //   });
  // };
  // const handleCheckSelect = (e, id) => {
  //   e.stopPropagation();
  //   let active = e.target.checked;
  //   if (active) {
  //     setSelectsProperties((prevSelects) => [...prevSelects, id]);
  //   } else {
  //     setSelectsProperties((prevSelects) =>
  //       prevSelects.filter((p) => p !== id)
  //     );
  //   }
  // };

  // const handleSelectAll = (e) => {
  //   const isChecked = e.target.checked;
  //   const visiblePropertyIds = visibleUsuarios.map((propiedad) => propiedad.id);

  //   if (isChecked) {
  //     setSelectsProperties((prevSelects) => [
  //       ...new Set([...prevSelects, ...visiblePropertyIds]),
  //     ]);
  //   } else {
  //     setSelectsProperties((prevSelects) =>
  //       prevSelects.filter((id) => !visiblePropertyIds.includes(id))
  //     );
  //   }
  // };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFiltersChange = (changedFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      tipo: "",
      precioRange: [0, Infinity],
      pais: "",
      region: "",
      provincia: "",
      distrito: "",
      fechaCreatedRange: [null, null],
      fechaEntregaRange: [null, null],
    });

    setSearchTerm("");
    setCurrentPage(1);
    detectarTotalPages(filterUsuarios);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsuarios = filterUsuarios.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

    setVisibleUsuarios(paginatedUsuarios);
  };

  const handleEliminarUsuario = async (id) => {
    try {
      await axios.delete(`${apiUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      await buscarUsuarios();
      message.success("Usuario eliminado correctamente");
    } catch (error) {
      message.error("No se pudo eliminar el usuario");
    }
  };

  // ✅ Cambiar contraseña (solo superadmin: esta página ya está restringida a ese rol)
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const abrirModalPassword = (usuario) => {
    setPasswordModalUser(usuario);
    setNewPasswordValue(generateRandomPassword(10));
  };

  const handleGuardarPassword = async () => {
    if (!passwordModalUser) return;
    if (!newPasswordValue || newPasswordValue.length < 8) {
      message.warning("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put(
        `${apiUrl}/users/${passwordModalUser.id}/password`,
        { password: newPasswordValue },
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      message.success(`Contraseña de ${passwordModalUser.name} actualizada`);
      setPasswordModalUser(null);
      setNewPasswordValue("");
    } catch (error) {
      message.error(
        error.response?.data?.message || "No se pudo cambiar la contraseña",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Equipo"
        title="Usuarios"
        subtitle="Administra las cuentas que tienen acceso al sistema"
        actions={
          <>
            <button
              onClick={() => exportToExcel(usuarios)}
              className="flex items-center gap-2 rounded-lg px-4 h-[38px] bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-sm font-semibold"
            >
              <FaFileExcel size={16} />
              Excel
            </button>
            <button
              onClick={(e) => abrirModalCreate(e)}
              className="flex items-center gap-2 rounded-lg px-4 h-[38px] bg-primary-600 hover:bg-primary-700 transition-colors text-white text-sm font-semibold"
            >
              <MdAdd className="text-base" />
              Nuevo Usuario
            </button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          tone="indigo"
          icon={<FaUserCog />}
          label="Total usuarios"
          value={usuarios.length}
        />
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex items-center gap-3 p-5 md:p-6">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg h-[42px] px-3 focus-within:border-primary-400 transition-colors">
            <AiOutlineSearch className="text-slate-400 text-lg shrink-0" />
            <input
              className="h-full w-full bg-transparent border-0 text-sm focus:outline-none placeholder:text-slate-400"
              placeholder="Buscar usuarios"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="on"
            />
          </div>
          <button
            onClick={() => setActiveFilter(!activeFilter)}
            className={`flex items-center justify-center h-[42px] w-[42px] shrink-0 rounded-lg border transition-colors ${
              activeFilter
                ? "bg-primary-600 border-primary-600 text-white"
                : "bg-white border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            <TbAdjustments className="text-lg" />
          </button>
        </div>

      <Modal
        footer={null}
        title="Crear usuario"
        open={isModalOpenCreate}
        onOk={handleOkCreate}
        onCancel={handleCancelCreate}
        width={"900px"}
      >
        <div className="relative w-full">
          {loadingCreateUsuarios ? (
            <div className="bg-dark-purple z-50 text-white absolute top-0 left-0 right-0 bottom-0 w-full flex items-center justify-center">
              Loading
            </div>
          ) : null}

          <div className="model grid grid-cols-1 gap-3 mt-4 relative">
            {isCliente ? (
              <>
                <div>
                  <label className="text-sm w-full block font-medium mb-4 ">
                    Razon Social
                  </label>
                  <input
                    placeholder="Ingresa la razon social Ejm: SA, SAC"
                    className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                    type="text"
                    value={clienteCreate?.razon_social}
                    onChange={(e) =>
                      handleClienteChangeCreate("razon_social", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-sm w-full block font-medium mb-4 ">
                    RUC
                  </label>
                  <input
                    placeholder="Ingresa RUC de 11 digitos"
                    className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                    type="text"
                    value={clienteCreate?.ruc}
                    onChange={(e) =>
                      handleClienteChangeCreate("ruc", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="text-sm w-full block font-medium mb-4 ">
                    Direccion
                  </label>
                  <input
                    placeholder="Ingresa la direccion"
                    className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                    type="text"
                    value={clienteCreate?.direccion}
                    onChange={(e) =>
                      handleClienteChangeCreate("direccion", e.target.value)
                    }
                  />
                </div>
              </>
            ) : null}
            <div>
              <label className="text-sm w-full block font-medium mb-4 ">
                Nombres
              </label>
              <input
                placeholder="Ingresa nombres completos"
                className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                type="text"
                value={usuarioCreate?.name}
                onChange={(e) =>
                  handleUsuarioChangeCreate("name", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm w-full block font-medium mb-4 ">
                  Sedes
                </label>
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                  value={usuarioCreate.sede_id}
                  optionFilterProp="label"
                  onChange={(value) =>
                    handleUsuarioChangeCreate("sede_id", value)
                  } // Ahora devuelve el ID
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
              </div>
              <div>
                <label className="text-sm w-full block font-medium mb-4 ">
                  Roles
                </label>
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                  value={usuarioCreate.rol_id}
                  optionFilterProp="label"
                  onChange={(value) =>
                    handleUsuarioChangeCreate("rol_id", value)
                  } // Ahora devuelve el ID
                  placeholder="Selecciona una sede"
                  style={{ width: "100%" }}
                >
                  {roles.map((rol) => (
                    <Option
                      key={rol.id}
                      value={rol.id} // 👈 Aquí ahora se usa el ID como valor
                      label={`${rol.name}`}
                    >
                      {rol.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm w-full block font-medium mb-4 ">
                  Email {"(Username)"}
                </label>
                <div className="flex gap-1">
                  <input
                    placeholder="ejm: agente@gmail.com"
                    className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                    type="email"
                    value={usuarioCreate?.email}
                    onChange={(e) =>
                      handleUsuarioChangeCreate("email", e.target.value)
                    }
                  />
                  <button
                    onClick={() => copiarCredentials("email")}
                    className="p-2 bg-gray-100 rounded text-gray-500"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm w-full font-medium mb-4  flex items-center gap-2">
                  <span>Password</span>{" "}
                  <button
                    onClick={() => setEditGenerate(!editGenerate)}
                    className="p-1 rounded text-xs bg-dark-purple text-white"
                  >
                    {editGenerate ? <FaRedo /> : <FaEdit />}
                  </button>
                  {editGenerate ? "(Edit)" : "(Autogenerate)"}
                </div>
                <div className="flex gap-1">
                  <input
                    disabled={editGenerate ? false : true}
                    className="bg-gray-100 rounded px-3 py-2 w-full text-sm"
                    type={openPassword ? "text" : "password"}
                    value={usuarioCreate?.password}
                    onChange={(e) =>
                      handleUsuarioChangeCreate("password", e.target.value)
                    }
                  />
                  <button
                    onClick={() => setOpenPassword(!openPassword)}
                    className="p-2 bg-gray-100 rounded text-gray-500"
                  >
                    {openPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={() => copiarCredentials("password")}
                    className="p-2 bg-gray-100 rounded text-gray-500"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => handleOkCreate()}
              className="bg-dark-purple text-white p-3 rounded"
            >
              Crear Usuario
            </button>
          </div>
        </div>
      </Modal>
      <div
        className={`${
          activeFilter ? "" : "hidden"
        } filters grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 border-y border-slate-100 py-4 px-5 md:px-6`}
      >
        <div className="col-span-2">
          <RangePicker
            className="w-full text-sm"
            value={filters.fechaCreatedRange}
            onChange={(dates) =>
              handleFiltersChange({ fechaCreatedRange: dates })
            }
            placeholder={["Fecha Creación Desde", "Fecha Creación Hasta"]}
          />
        </div>

        <div className="w-full flex gap-2 items-center">
          <button
            className="h-[38px] px-4 rounded-lg text-slate-500 hover:text-primary-600 text-xs font-semibold"
            onClick={() => handleClearFilters()}
          >
            Limpiar
          </button>
          <button
            className="h-[38px] px-4 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors text-white text-xs font-semibold"
            onClick={() => applyFilters()}
          >
            Buscar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto px-2 md:px-3 pt-2">
        <table
          className="inmocms-table"
          cellPadding="0"
          cellSpacing="0"
          border="0"
        >
          <thead>
            <tr>
              {/* <td className="check-field">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={visibleUsuarios.every((propiedad) =>
                    selectsProperties.includes(propiedad.id)
                  )}
                />
              </td> */}
              <td>Fecha Creacion </td>
              <td>Nombres </td>
              <td>Email </td>
              <td>Sede </td>
              <td>Rol </td>
              <td className="ajustes-tabla-celda"></td>
            </tr>
          </thead>
          <tbody>
            {visibleUsuarios.length > 0 &&
              visibleUsuarios.map((usuario, index) => {
                return (
                  <tr
                    className=""
                    key={index}
                    // onClick={(e) => handleSelect(e, usuario.id)}
                  >
                    {/* <td className="check-field">
                      <input
                        type="checkbox"
                        value={usuario.id || ""}
                        onClick={(e) => handleCheckSelect(e, usuario.id)}
                        checked={selectsProperties.find((s) => {
                          if (s === usuario.id) {
                            return true;
                          } else {
                            return false;
                          }
                        })}
                      />
                    </td> */}
                    <td>
                      <div className="flex flex-col align-center font-bold text-bold-font">
                        {dayjs(usuario.createdAt)
                          .locale("de")
                          .format("DD [de] MMMM [del] YYYY")}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col align-center">
                        {usuario.name}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col align-center">
                        {usuario.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ textAlign: "center" }}>
                        <div>
                          <span className="estado publicado">
                            {usuario.sede.nameReferential}{" "}
                            {usuario.sede.department} {usuario.sede.province}{" "}
                            {usuario.sede.district}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ textAlign: "center" }}>
                        <div>
                          <span className="estado publicado">
                            {usuario.rol.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="ajustes-tabla-celda">
                      <div className="ajustes-tabla-celda-item px-4">
                        <Dropdown
                          className="text-sm text-gray-500"
                          placement="bottomRight"
                          menu={{
                            items: [
                              {
                                label: (
                                  <button
                                    onClick={() => abrirModalPassword(usuario)}
                                    className="w-full rounded flex items-center gap-2 text-sm"
                                  >
                                    <FaLock /> Cambiar Contraseña
                                  </button>
                                ),
                                key: 0,
                              },
                              {
                                label: (
                                  <button
                                    onClick={() => {
                                      Modal.confirm({
                                        title:
                                          "¿Está seguro de eliminar este usuario?",
                                        content:
                                          "Esta acción no se puede deshacer.",
                                        onOk: () =>
                                          handleEliminarUsuario(usuario.id),
                                        okText: "Eliminar",
                                        cancelText: "Cancelar",
                                      });
                                    }}
                                    className="w-full rounded flex items-center gap-2 text-sm text-red-500"
                                  >
                                    <FaTrash /> Eliminar
                                  </button>
                                ),
                                key: 1,
                              },
                            ],
                          }}
                          trigger={["click"]}
                        >
                          <div
                            className="text-xs w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Space>
                              <FaEllipsisV />
                            </Space>
                          </div>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="table-controls">
        <div className="page">
          <div className="txt">
            Página {currentPage} de {totalPages}
          </div>
          <div style={{ marginBottom: "12px", marginRight: "24px" }}>
            <Select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e));
                setCurrentPage(1); // Reset page to 1 on items per page change
              }}
              // style={{
              //   width: 120,
              // }}
              // dropdownMatchSelectWidth={false}
              placement={"topLeft"}
              options={[
                {
                  value: "1",
                  label: "1",
                },
                {
                  value: "10",
                  label: "10",
                },
                {
                  value: "25",
                  label: "25",
                },
                {
                  value: "50",
                  label: "50",
                },
                {
                  value: "100",
                  label: "100",
                },
                {
                  value: "500",
                  label: "500",
                },
              ]}
            />
          </div>
          <div className="disabled" style={{ marginBottom: "12px" }}>
            <Dropdown
              menu={{ items }}
              placement="bottomLeft"
              trigger={["click"]}
              // disabled={selectsProperties.length > 0 ? false : true}
            >
              <Button>
                Editar selección <TbCaretDownFilled />
              </Button>
            </Dropdown>
          </div>
        </div>
        <div className="pagination-controls flex gap-1.5 items-center">
          <button
            className={`h-8 min-w-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
              currentPage === 1
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            1
          </button>
          <button
            className={`h-8 min-w-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
              currentPage === 1
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>
          <button className="h-8 min-w-8 px-2 rounded-lg bg-primary-600 text-white text-xs font-semibold">
            {currentPage}
          </button>
          <button
            className={`h-8 min-w-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
              currentPage === totalPages
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>
          <button
            className={`h-8 min-w-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
              currentPage === totalPages
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            {totalPages}
          </button>
        </div>
      </div>
      <div className="h-4" />
      </Card>

      <Modal
        title="Cambiar contraseña"
        open={!!passwordModalUser}
        onCancel={() => setPasswordModalUser(null)}
        footer={null}
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-slate-500">
            Nueva contraseña para{" "}
            <span className="font-semibold text-slate-700">
              {passwordModalUser?.name}
            </span>{" "}
            ({passwordModalUser?.email}).
          </p>
          <div className="flex gap-2">
            <Input
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
              placeholder="Nueva contraseña"
            />
            <Button
              onClick={() => setNewPasswordValue(generateRandomPassword(10))}
            >
              <FaRedo />
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(newPasswordValue);
                message.success("¡Copiado!");
              }}
            >
              <FaCopy />
            </Button>
          </div>
          <Button
            type="primary"
            block
            loading={savingPassword}
            onClick={handleGuardarPassword}
          >
            Guardar nueva contraseña
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Usuarios;

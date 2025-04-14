import axios from "axios";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "../../components/AuthContext";
import { Dropdown, message, Modal, Select, Space, DatePicker } from "antd";
import { FaEdit, FaEllipsisV, FaTags, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { AiOutlineSearch } from "react-icons/ai";
import { MdAdd } from "react-icons/md";
import { TbAdjustments } from "react-icons/tb";
const { Option } = Select;
const { RangePicker } = DatePicker;

const Categories = () => {
  const { auth } = useAuth();
  const [categoryCreate, setCategoryCreate] = useState({
    name: "",
    description: "",
  });

  const [categories, setCategories] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;

  const abrirModalCreate = (e) => {
    e.stopPropagation();
    setIsModalOpenCreate(true);
  };

  const buscar_categorias = async () => {
    try {
      const response = await axios.get(`${apiUrl}/categories`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
      console.log(response);
      if (response.data.status === "success") {
        setCategories(response.data.data);
        setFilterCategories(response.data.data);
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error("Error al obtener las categories:", error);
    }
  };
  useEffect(() => {
    buscar_categorias();
  }, [auth, apiUrl]);

  // ESTADOS PARA LA TABLA DINAMICA
  const [itemsPerPage, setItemsPerPage] = useState(10); //items por pagina
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    description: "",
    created_at: [null, null],
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
    const bol = regex.test(searchTerm) ? searchTerm : "";
    console.log(bol);

    if (bol === "") {
      const filteredBusiness = filterCategories.filter((company) => {
        const searchRegex = new RegExp(searchTerm, "i");

        const matchSearch = Object.values(company).some((value) =>
          searchRegex.test(value.toString())
        );

        const matchFilters =
          (!filters.name || company.name === filters.name) &&
          (!filters.description ||
            company.description === filters.description) &&
          (!filters.created_at[0] ||
            ((dayjs(company.created_at).isAfter(filters.created_at[0], "day") ||
              dayjs(company.created_at).isSame(filters.created_at[0], "day")) &&
              (dayjs(company.created_at).isBefore(
                filters.created_at[1],
                "day"
              ) ||
                dayjs(company.created_at).isSame(
                  filters.created_at[1],
                  "day"
                ))));

        return matchSearch && matchFilters;
      });
      detectarTotalPages(filteredBusiness);
      const objetosOrdenados = filteredBusiness.sort((a, b) =>
        dayjs(b.fecha_created).isAfter(dayjs(a.fecha_created)) ? 1 : -1
      );
      const startIndex = (currentPage - 1) * itemsPerPage;
      // setCurrentPage(1);
      const paginated = objetosOrdenados.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      setVisibleCategories(paginated);
    } else {
      setSearchTerm(bol);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFiltersChange = (changedFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: "",
      email: "",
      phone_contact: "",
      website: "",
      created_at: [null, null],
    });

    setSearchTerm("");
    setCurrentPage(1);
    detectarTotalPages(filterCategories);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filterCategories.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    setVisibleCategories(paginated);
  };
  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
  }, [filterCategories, currentPage, itemsPerPage, searchTerm]);

  // create category
  const handleCreateChange = (key, value) => {
    setCategoryCreate((prev) => {
      const newCategory = { ...prev, [key]: value };

      return newCategory;
    });
  };

  const handleCreate = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/categories`,
        categoryCreate,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      if (response.data.status === "success") {
        message.success("Se ha creado correctamente la categoria");
        await buscar_categorias();
        handleCancelCreate();
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      message.error("Ocurrio un error al crear la categoria");
    }
  };
  const handleCancelCreate = () => {
    setCategoryCreate({
      name: "",
      description: "",
    });
    setIsModalOpenCreate(false);
  };
  const handleEliminarCategories = async (id) => {
    console.log(id);
    // let propiedad_id = id;
    // try {
    //   const response = await eliminar_property(propiedad_id);
    //   buscarPropiedades();
    //   message.success("Se elimino correctamente la propiedad");
    // } catch (error) {
    //   message.error("No se elimino la propiedad, hubo un error");
    // }
  };

  return (
    <div className="p-6">
      {/* modal create */}
      <Modal
        footer={null}
        title="Register"
        open={isModalOpenCreate}
        onCancel={handleCancelCreate}
      >
        <div className="relative w-full">
          {loadingCreate ? (
            <div className="bg-dark-purple z-50 text-white absolute top-0 left-0 right-0 bottom-0 w-full flex items-center justify-center">
              Loading
            </div>
          ) : null}
          <div className="w-full mb-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <label htmlFor="Nombre" className="text-sm font-bold mb-2">
                  Nombre
                </label>
                <input
                  className="px-3 py-2 w-full bg-gray-200 text-sm"
                  type="text"
                  value={categoryCreate.name}
                  onChange={(e) => handleCreateChange("name", e.target.value)}
                />
              </div>
              <div className="w-full">
                <label htmlFor="Nombre" className="text-sm font-bold mb-2">
                  Descripcion
                </label>
                <input
                  className="px-3 py-2 w-full bg-gray-200 text-sm"
                  type="text"
                  value={categoryCreate.description}
                  onChange={(e) =>
                    handleCreateChange("description", e.target.value)
                  }
                />
              </div>
            </div>
            <button
              onClick={() => handleCreate()}
              className="px-3 py-2 rounded bg-primary text-white"
            >
              Registrar
            </button>
          </div>
        </div>
      </Modal>
      <div className="horizontal-options flex items-center mb-[24px]">
        <div className="search-hook flex-grow">
          <div className="inmocms-input bg-white border rounded border-gray-300 flex text-sm h-[46px] overflow-hidden font-normal">
            <input
              className="h-full px-[12px] w-full border-0 border-none focus:outline-none"
              placeholder="Buscar categoria"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="on"
            />
            <AiOutlineSearch className="h-full w-[24px] min-w-[24px] opacity-5 mx-[12px]" />
          </div>
        </div>
        <div className="horizontal-options-items ml-[28px] flex items-center">
          <button
            onClick={() => setActiveFilter(!activeFilter)}
            className="inmocms-button bg-secondary text-primary rounded p-4"
          >
            <TbAdjustments />
          </button>
          <button
            onClick={(e) => abrirModalCreate(e)}
            className="bg-primary text-white text-sm ml-[12px] h-[46px] flex gap-2 items-center px-3 rounded"
          >
            <MdAdd className="text-white" />
            <span className="mobile-hide">Nueva categoria</span>
          </button>
        </div>
      </div>
      <div
        className={`${
          activeFilter ? "" : "hidden"
        } filters grid grid-cols-1 md:grid-cols-6 gap-4 bg-white py-4 px-3 mb-4`}
      >
        <div className="col-span-2">
          <RangePicker
            className="w-full text-sm"
            value={filters.created_at}
            onChange={(dates) => handleFiltersChange({ created_at: dates })}
            placeholder={["Fecha Creación Desde", "Fecha Creación Hasta"]}
          />
        </div>
        <div className="w-full flex flex-col md:flex-row">
          <button
            className="p-3 rounded bg-white text-light-font text-xs"
            onClick={() => handleClearFilters()}
          >
            Limpiar
          </button>
          <button
            className="p-3 rounded bg-dark-purple text-white text-xs"
            onClick={() => applyFilters()}
          >
            Buscar
          </button>
        </div>
      </div>
      <div className="box-table">
        <table
          className="inmocms-table"
          cellPadding="0"
          cellSpacing="0"
          border="0"
        >
          <thead>
            <tr>
              <td>Name </td>
              <td>Description </td>
              <td>Fecha creacion </td>
              <td className="ajustes-tabla-celda">Acciones</td>
            </tr>
          </thead>
          <tbody>
            {visibleCategories.length > 0 &&
              visibleCategories.map((item, index) => {
                return (
                  <tr className="" key={index}>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>
                      {dayjs(item.created_at).format("DD/MM/YYYY HH:mm:ss")}
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
                                  <Link
                                    to={`/categories/edit/${item.id}`}
                                    className="pr-6 rounded flex items-center gap-2 text-sm text-gray-500"
                                  >
                                    <FaEdit /> Editar info
                                  </Link>
                                ),
                                key: 1,
                              },
                              {
                                label: (
                                  <button
                                    onClick={() => {
                                      Modal.confirm({
                                        title:
                                          "¿Está seguro de eliminar esta categoria?",
                                        content:
                                          "Al eliminar la categoria, se eliminarán los datos relacionados con la categoria como: cursos, lecciones y contenido multimedia",
                                        onOk: () =>
                                          handleEliminarCategories(item.id),
                                        okText: "Eliminar",
                                        cancelText: "Cancelar",
                                      });
                                    }}
                                    className="w-full rounded flex items-center gap-2 text-sm text-red-500"
                                  >
                                    <FaTrash /> Eliminar
                                  </button>
                                ),
                                key: 2,
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
        </div>
        <div className="pagination-controls flex gap-2 items-center">
          <button
            className={`p-3 text-xs rounded ${
              currentPage === 1
                ? "bg-light-purple text-dark-purple"
                : "bg-dark-purple text-white"
            }  `}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            1
          </button>
          <button
            className={`p-3 text-xs rounded ${
              currentPage === 1
                ? "bg-light-purple text-dark-purple"
                : "bg-dark-purple text-white"
            }  `}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>
          <button className="p-3 rounded bg-dark-purple text-white text-xs">
            {currentPage}
          </button>
          <button
            className={`p-3 text-xs rounded ${
              currentPage === totalPages
                ? "bg-light-purple text-dark-purple"
                : "bg-dark-purple text-white"
            }  `}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>
          <button
            className={`p-3 text-xs rounded ${
              currentPage === totalPages
                ? "bg-light-purple text-dark-purple"
                : "bg-dark-purple text-white"
            }  `}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            {totalPages}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Categories;

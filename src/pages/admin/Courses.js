import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import axios from "axios";
import { message, Modal, Select } from "antd";
import { AiOutlineSearch } from "react-icons/ai";
import { TbAdjustments } from "react-icons/tb";
import { MdAdd } from "react-icons/md";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

const Courses = () => {
  const { auth } = useAuth();
  const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const abrirModalCreate = (e) => {
    e.stopPropagation();
    setIsModalOpenCreate(true);
  };

  const apiUrl = process.env.REACT_APP_API_URL;

  const [courses, setCourses] = useState([]);
  const [filterCourses, setFilterCourses] = useState([]);
  const [courseCreate, setCourseCreate] = useState({
    title: "",
    description: "",
    thumbnail: "",
    duration: "",
  });
  const [categories, setCategories] = useState([]);
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
      } else {
        console.log(response.data.message);
      }
    } catch (error) {
      console.error("Error al obtener las categories:", error);
    }
  };
  const buscar_courses = async () => {
    try {
      const response = await axios.get(`${apiUrl}/courses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
      console.log(response);
      if (response.data.status === "success") {
        setCourses(response.data.data);
        setFilterCourses(response.data.data);
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
  useEffect(() => {
    buscar_courses();
  }, [auth, apiUrl]);

  const [searchCategory, setSearchCategory] = useState(""); // Estado para búsqueda
  const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal
  const [selectedCategories, setSelectedCategories] = useState([]); // Estado de categorías seleccionadas

  // Manejar búsqueda
  const handleSearch = (e) => {
    setSearchCategory(e.target.value);
  };

  // Manejar selección de categorías
  const handleCategorySelect = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.some((item) => item.category_id === categoryId)) {
        return prev.filter((item) => item.category_id !== categoryId);
      } else {
        return [...prev, { category_id: categoryId }];
      }
    });
  };

  // ESTADOS PARA LA TABLA DINAMICA
  const [itemsPerPage, setItemsPerPage] = useState(10); //items por pagina
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCourses, setVisibleCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState(false);
  const [filters, setFilters] = useState({
    title: "",
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
    const bol = regex.test(searchTerm) ? true : false;
    console.log(bol);

    if (bol) {
      const filteredCourses = filterCourses.filter((course) => {
        const searchRegex = new RegExp(searchTerm, "i");
        const matchSearch = Object.values(course).some(
          (value) => value != null && searchRegex.test(value.toString())
        );

        const matchFilters =
          (!filters.title || course.title === filters.title) &&
          (!filters.description ||
            course.description === filters.description) &&
          (!filters.created_at[0] ||
            ((dayjs(course.created_at).isAfter(filters.created_at[0], "day") ||
              dayjs(course.created_at).isSame(filters.created_at[0], "day")) &&
              (dayjs(course.created_at).isBefore(
                filters.created_at[1],
                "day"
              ) ||
                dayjs(course.created_at).isSame(
                  filters.created_at[1],
                  "day"
                ))));

        return matchSearch && matchFilters;
      });
      detectarTotalPages(filteredCourses);
      const objetosOrdenados = filteredCourses.sort((a, b) =>
        dayjs(b.created_at).isAfter(dayjs(a.created_at)) ? 1 : -1
      );
      const startIndex = (currentPage - 1) * itemsPerPage;
      // setCurrentPage(1);
      const paginated = objetosOrdenados.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      setVisibleCourses(paginated);
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
    detectarTotalPages(filterCourses);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filterCourses.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    setVisibleCourses(paginated);
  };
  // useEffect para manejar el filtrado y paginación
  useEffect(() => {
    applyFilters(); // Aplicar filtro inicialmente
  }, [filterCourses, currentPage, itemsPerPage, searchTerm]);

  // create category
  const handleCreateChange = (key, value) => {
    setCourseCreate((prev) => {
      const newCourse = { ...prev, [key]: value };

      return newCourse;
    });
  };

  const handleCreate = async () => {
    try {
      const response = await axios.post(`${apiUrl}/courses`, courseCreate, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (response.data.status === "success") {
        if (selectedCategories.length > 0) {
          const newCategories = selectedCategories.map((c) => ({
            ...c,
            course_id: response.data.data.id,
          }));
          const response_categories = await axios.post(
            `${apiUrl}/courses_categories`,
            { categories: newCategories }
          );
          console.log(response_categories);
        }
        await buscar_courses();
        handleCancelCreate();
        message.success("Se ha creado correctamente el curso");
      } else {
        console.log(response.data.message);
        message.error("Ocurrio un error al crear este curso");
      }
    } catch (error) {
      message.error("Ocurrio un error al crear la categoria");
    }
  };

  const handleCancelCreate = () => {
    setCourseCreate({
      title: "",
      description: "",
      thumbnail: "",
      duration: "",
    });
    setIsModalOpenCreate(false);
  };

  return (
    <div className="p-4">
      <h1 className="tetx-2xl font-bold">Tus Cursos</h1>
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
                {/* Campo tipo input */}
                <span
                  onClick={() => setShowModal(!showModal)}
                  className="cursor-pointer border rounded p-2"
                >
                  Seleccionar categorías
                </span>

                {/* Modal debajo del campo */}
                {showModal && (
                  <div className="absolute mt-2 border rounded bg-white shadow-lg w-80 p-4">
                    {/* Input de búsqueda */}
                    <input
                      type="text"
                      value={searchCategory}
                      onChange={handleSearch}
                      placeholder="Buscar categorías..."
                      className="border p-2 w-full mb-2 rounded"
                    />

                    {/* Listado de categorías con checkboxes */}
                    <div className="max-h-40 overflow-y-auto">
                      {categories
                        .filter((category) =>
                          category.name
                            .toLowerCase()
                            .includes(searchCategory.toLowerCase())
                        )
                        .map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center mb-2"
                          >
                            <input
                              type="checkbox"
                              id={`category-${category.id}`}
                              checked={selectedCategories.some(
                                (item) => item.category_id === category.id
                              )}
                              onChange={() => handleCategorySelect(category.id)}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="ml-2 cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Categorías seleccionadas */}
                {selectedCategories.length > 0 && (
                  <div className="mt-4">
                    <h4>Categorías seleccionadas:</h4>
                    <ul className="list-disc pl-5">
                      {selectedCategories.map((category) => (
                        <li key={category.category_id}>
                          {
                            categories.find(
                              (cat) => cat.id === category.category_id
                            )?.name
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="w-full">
                <label htmlFor="Nombre" className="text-sm font-bold mb-2">
                  Titulo
                </label>
                <input
                  className="px-3 py-2 w-full bg-gray-200 text-sm"
                  type="text"
                  value={courseCreate.title}
                  onChange={(e) => handleCreateChange("title", e.target.value)}
                />
              </div>
              <div className="w-full">
                <label htmlFor="Nombre" className="text-sm font-bold mb-2">
                  Descripcion
                </label>
                <input
                  className="px-3 py-2 w-full bg-gray-200 text-sm"
                  type="text"
                  value={courseCreate.description}
                  onChange={(e) =>
                    handleCreateChange("description", e.target.value)
                  }
                />
              </div>
              <div className="w-full">
                <label htmlFor="Nombre" className="text-sm font-bold mb-2">
                  Duracion
                </label>
                <input
                  className="px-3 py-2 w-full bg-gray-200 text-sm"
                  type="text"
                  value={courseCreate.duration}
                  onChange={(e) =>
                    handleCreateChange("duration", e.target.value)
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
              placeholder="Buscar curso"
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
            <span className="mobile-hide">Nueva Course</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCourses.length > 0 ? (
          visibleCourses.map((c, index) => {
            return (
              <div key={index} className="w-full p-3 rounded shadow-md">
                <img
                  src="/images/1.jpg"
                  className="w-full h-[180px] object-cover object-center"
                  alt=""
                />
                <h1 className="font-bold text-lg">{c.title}</h1>
                <p className="text-sm">{c.description}</p>
                <div className="flex justify-end">
                  <Link
                    to={`/course/${c.id}`}
                    className="inline-block p-2 rounded text-sm font-bold bg-primary text-white"
                  >
                    Ver curso
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <h1>Aun no hay cursos</h1>
        )}
      </div>
      <div className="table-controls mt-6">
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

export default Courses;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button, Input, Collapse, List, Modal, Upload, Select } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const { Panel } = Collapse;
const { Option } = Select;

const SectionItem = ({ section, index, moveSection, findSection }) => {
  const originalIndex = findSection(section.id).index;

  const [{ isDragging }, drag] = useDrag({
    type: "SECTION",
    item: { id: section.id, originalIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "SECTION",
    canDrop: () => false,
    hover: ({ id: draggedId }) => {
      if (draggedId !== section.id) {
        const { index: overIndex } = findSection(section.id);
        moveSection(draggedId, overIndex);
      }
    },
  });
  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1, padding: "5px 0" }}
    >
      {section.title}
    </div>
  );
};
const DraggableLesson = ({ lesson, index, sectionId, moveLesson }) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: "lesson",
    hover(item) {
      if (item.index !== index) {
        moveLesson(sectionId, item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "lesson",
    item: { id: lesson.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <List.Item ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {lesson.title}
    </List.Item>
  );
};

const CourseEditor = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const apiUrlUpload = process.env.REACT_UPLOAD_API_URL;
  const { id } = useParams(); // ID del curso desde la URL
  const [sections, setSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    resource: "",
    type_lesson: "video",
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const response = await axios.get(`${apiUrl}/sectionsByCourseId/${id}`);
    setSections(response.data);
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;

    const position = sections.length + 1; // Nueva posición
    const response = await axios.post(`${apiUrl}/sections`, {
      course_id: id,
      title: newSectionTitle,
      position,
    });
    setSections([...sections, response.data]);
    setNewSectionTitle("");
  };

  const addLesson = async () => {
    if (!newLesson.title.trim() || !currentSectionId) return;

    // Obtener la cantidad actual de lecciones en la sección seleccionada
    const sectionIndex = sections.findIndex(
      (sec) => sec.id === currentSectionId
    );
    const totalLessons = sections[sectionIndex].lessons.length;
    const newPosition = totalLessons + 1; // Se coloca al final

    // Enviar nueva lección a la API
    const response = await axios.post(`${apiUrl}/lessons`, {
      section_id: currentSectionId,
      title: newLesson.title,
      description: newLesson.description,
      resource: newLesson.resource,
      type_lesson: newLesson.type_lesson,
      position: newPosition,
    });

    // Actualizar el estado de las secciones con la nueva lección
    const updatedSections = sections.map((sec) =>
      sec.id === currentSectionId
        ? { ...sec, lessons: [...sec.lessons, response.data] }
        : sec
    );

    setSections(updatedSections);
    setModalVisible(false);
    setNewLesson({ title: "", description: "", resource: "", type_lesson: "" });
  };

  const handleUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append("video", file);
    const response = await axios.post(`${apiUrlUpload}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setNewLesson((prev) => ({ ...prev, resource: response.data.url }));
  };
  // Encuentra la posición de una sección en la lista
  const findSection = (id) => {
    const section = sections.find((s) => s.id === id);
    return { section, index: sections.indexOf(section) };
  };

  const moveSection = useCallback(
    async (draggedId, newIndex) => {
      const { index: oldIndex } = findSection(draggedId);
      if (oldIndex === newIndex) return;

      const updatedSections = [...sections];
      const [movedSection] = updatedSections.splice(oldIndex, 1);
      updatedSections.splice(newIndex, 0, movedSection);

      // Actualizar las posiciones en el estado
      setSections(
        updatedSections.map((section, idx) => ({
          ...section,
          position: idx + 1,
        }))
      );

      // Guardar en la base de datos la nueva posición
      await Promise.all(
        updatedSections.map((section, idx) =>
          axios.put(`${apiUrl}/sections/${section.id}`, { position: idx + 1 })
        )
      );
    },
    [sections]
  );

  // lessons movimiento
  const moveLesson = useCallback(
    async (sectionId, draggedId, newIndex) => {
      // Encontrar la sección donde se está moviendo la lección
      const sectionIndex = sections.findIndex((sec) => sec.id === sectionId);
      if (sectionIndex === -1) return;

      // Encontrar el índice original de la lección
      const oldIndex = sections[sectionIndex].lessons.findIndex(
        (lesson) => lesson.id === draggedId
      );
      if (oldIndex === newIndex) return; // No hacer nada si no cambia la posición

      // Clonar las secciones para actualizar el estado
      const updatedSections = [...sections];
      const updatedLessons = [...updatedSections[sectionIndex].lessons];

      // Mover la lección dentro de la sección
      const [movedLesson] = updatedLessons.splice(oldIndex, 1);
      updatedLessons.splice(newIndex, 0, movedLesson);

      // Recalcular posiciones
      updatedSections[sectionIndex].lessons = updatedLessons.map(
        (lesson, idx) => ({
          ...lesson,
          position: idx + 1,
        })
      );

      // Actualizar el estado
      setSections(updatedSections);

      // Guardar en la base de datos las nuevas posiciones
      await Promise.all(
        updatedLessons.map((lesson, idx) =>
          axios.put(`${apiUrl}/lessons/${lesson.id}`, { position: idx + 1 })
        )
      );
    },
    [sections]
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="py-12 px-8">
        <h2>Administrar Curso</h2>
        <Input
          placeholder="Nombre de la Sección"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
        />
        <Button type="primary" onClick={addSection} icon={<PlusOutlined />}>
          Agregar Sección
        </Button>

        <Collapse>
          {sections
            .sort((a, b) => a.position - b.position)
            .map((section, index) => (
              <Panel
                key={section.id}
                header={
                  <SectionItem
                    section={section}
                    index={index}
                    moveSection={moveSection}
                    findSection={findSection}
                  />
                }
              >
                <DndProvider backend={HTML5Backend}>
                  <List>
                    {section.lessons
                      .sort((a, b) => a.position - b.position)
                      .map((lesson, i) => (
                        <DraggableLesson
                          key={lesson.id}
                          lesson={lesson}
                          index={i}
                          sectionId={section.id}
                          moveLesson={moveLesson}
                        />
                      ))}
                  </List>
                </DndProvider>
                <Button
                  type="dashed"
                  onClick={() => {
                    setCurrentSectionId(section.id);
                    setModalVisible(true);
                  }}
                >
                  Agregar Lección
                </Button>
              </Panel>
            ))}
        </Collapse>

        <Modal
          title="Nueva Lección"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={addLesson}
        >
          <Input
            placeholder="Título"
            value={newLesson.title}
            onChange={(e) =>
              setNewLesson((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Input.TextArea
            placeholder="Descripción"
            value={newLesson.description}
            onChange={(e) =>
              setNewLesson((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <Select
            value={newLesson.type_lesson}
            onChange={(value) =>
              setNewLesson((prev) => ({ ...prev, type_lesson: value }))
            }
            style={{ width: "100%" }}
          >
            <Option value="video">Video</Option>
            <Option value="resource">Recurso</Option>
            <Option value="external_url">Enlace Externo</Option>
          </Select>
          {newLesson.type_lesson === "video" && (
            <Upload customRequest={handleUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Subir Video</Button>
            </Upload>
          )}
        </Modal>
      </div>
    </DndProvider>
  );
};

export default CourseEditor;

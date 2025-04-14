import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactPlayer from "react-player";
import { Checkbox } from "antd";

const LectureView = () => {
  const { id_lesson } = useParams();
  const [lesson, setLesson] = useState(null);
  const [sections, setSections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:8080/apicursos/lesson/${id_lesson}`)
      .then((res) => {
        setLesson(res.data);
      });
    axios.get("http://localhost:8080/apicursos/sections").then((res) => {
      setSections(res.data);
    });
  }, [id_lesson]);

  const handleProgress = (progress) => {
    if (lesson && lesson.type_lesson === "video" && lesson.resource) {
      if (progress.playedSeconds >= progress.loadedSeconds - 10) {
        axios.post("http://localhost:8080/apicursos/progress", {
          lesson_id: id_lesson,
          completed: 1,
        });
      }
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: "70%" }}>
        {lesson && lesson.type_lesson === "video" ? (
          <ReactPlayer
            url={lesson.resource}
            controls
            onProgress={handleProgress}
          />
        ) : (
          <a href={lesson?.resource} target="_blank" rel="noopener noreferrer">
            Ver recurso
          </a>
        )}
      </div>
      <div style={{ flex: "30%" }}>
        {sections.map((section) => (
          <div key={section.id}>
            <h3>{section.title}</h3>
            {section.lessons.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={l.completed}
                  onChange={() => navigate(`/lecture/${l.id}`)}
                />
                <span>{l.title}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LectureView;

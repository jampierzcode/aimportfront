import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Course = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;
  const buscar_course = async (id) => {
    try {
      const response = await axios.get(`${apiUrl}/courses/${id}`);
      console.log(response);
      const data = response.data;
      if (data.status === "success") {
        setCourse(data.data);
      } else {
        new Error("error de compilacion");
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (id) {
      buscar_course(id);
    }
  }, [id]);

  return (
    <div className="w-full p-4">
      <div className="w-full p-3 bg-primary text-white">
        <h1 className="text-2xl font-bold">{course?.title}</h1>
      </div>
    </div>
  );
};

export default Course;

import React, { useState } from "react";
import axios from "axios";
import { FiUpload } from "react-icons/fi";

const VideoUploader = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleVideoSelection = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedVideo(file);
      setPreviewUrl(URL.createObjectURL(file)); // Generar URL para preview
    }
  };

  const handleVideoUpload = async () => {
    if (!selectedVideo) {
      alert("Por favor, selecciona un video primero.");
      return;
    }

    const formData = new FormData();
    formData.append("folder", "lessons");
    formData.append("files", selectedVideo);

    try {
      const response = await axios.post(
        "http://localhost:8080/apicursos/index.php",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      alert("Video subido con éxito!");
      console.log(response.data);
    } catch (error) {
      console.error(error);
      alert("Error al subir el video.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Botón para seleccionar video */}
      <label
        htmlFor="videoInput"
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
      >
        <FiUpload className="text-xl" />
        <span>Cargar video</span>
      </label>
      <input
        id="videoInput"
        type="file"
        accept="video/*"
        onChange={handleVideoSelection}
        className="hidden"
      />

      {/* Vista previa del video */}
      {previewUrl && (
        <video
          src={previewUrl}
          controls
          className="w-full max-w-lg rounded-lg shadow-md"
        />
      )}

      {/* Botón para subir video */}
      {selectedVideo && (
        <button
          onClick={handleVideoUpload}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Subir video
        </button>
      )}

      {/* Barra de progreso */}
      {uploadProgress > 0 && (
        <div className="w-full max-w-lg">
          <div className="relative w-full bg-gray-300 rounded-lg h-4">
            <div
              className="absolute top-0 left-0 h-4 bg-green-500 rounded-lg"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-700 mt-1">
            {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;

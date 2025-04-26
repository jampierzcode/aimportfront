import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "@ant-design/v5-patch-for-react-19";

import { AuthProvider } from "./components/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Usuarios from "./pages/superadmin/Usuarios";
import Layout from "./components/rolAdmin/Layout";
import LayoutSuperadmin from "./components/rolSuperAdmin/Layout";
import LayoutRepartidor from "./components/rolRepartidor/Layout";
import Dashboard from "./pages/admin/Dashboard";
import NotFoundPage from "./pages/NotFoundPage";
import Identy from "./pages/Identy";
import Categories from "./pages/admin/Categories";
import Courses from "./pages/admin/Courses";
import VideoUploader from "./pages/admin/VideoUploader";
import Course from "./pages/admin/Course";
import CourseEditor from "./pages/admin/CourseEdit";
import PedidoManager from "./pages/superadmin/PedidoManager";
import CampaignDetails from "./pages/superadmin/CampaignDetail";
import BarcodeScanner from "./components/rolSuperAdmin/BarCodeScanner";
import Generador from "./pages/superadmin/Generador";
import PedidoRepartidor from "./pages/repartidor/PedidoRepartidor";
import SqlGenerator from "./pages/superadmin/SqlGenerator";
import ExcelUpload from "./pages/superadmin/ExcelUpload";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/identy" element={<Identy />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* RUTAS PARA USUARIO SUPERADMIN */}
          <Route
            path="/pedidos"
            element={
              <PrivateRoute roles={["superadmin"]}>
                <LayoutSuperadmin>
                  <PedidoManager />
                </LayoutSuperadmin>
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute roles={["superadmin"]}>
                <LayoutSuperadmin>
                  <Usuarios />
                </LayoutSuperadmin>
              </PrivateRoute>
            }
          />
          <Route path="/scanner" element={<BarcodeScanner />} />
          <Route path="/generator-codigos/:id" element={<Generador />} />
          <Route path="/generator-sqls" element={<SqlGenerator />} />
          <Route path="/generator-update" element={<ExcelUpload />} />
          <Route
            path="/campaigns/:id"
            element={
              <PrivateRoute roles={["superadmin"]}>
                <LayoutSuperadmin>
                  <CampaignDetails />
                </LayoutSuperadmin>
              </PrivateRoute>
            }
          />
          {/* RUTAS PARA USUARIO REPARTIDOR */}
          <Route
            path="/repartidor/pedidos"
            element={
              <PrivateRoute roles={["repartidor"]}>
                <LayoutRepartidor>
                  <PedidoRepartidor />
                </LayoutRepartidor>
              </PrivateRoute>
            }
          />
          {/* RUTAS PARA USUARIO ADMIN */}
          <Route
            path="/manager/dashboard"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout>
                  <Categories />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="/subirvideo" element={<VideoUploader />} />

          <Route
            path="/usuarios"
            element={
              <PrivateRoute roles={["customer"]}>
                <Layout>
                  <Usuarios />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* RUTA DE FORBIDDEN */}
          <Route path="/forbidden" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

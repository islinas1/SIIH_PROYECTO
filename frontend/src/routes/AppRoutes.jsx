import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

import LoginPage from "../features/auth/LoginPage";
import RegisterPatientPage from "../features/auth/RegisterPatientPage";
import VerifyRegistrationPage from "../features/auth/VerifyRegistrationPage";
import UserProfilePage from "../features/auth/UserProfilePage";
import ChangePasswordPage from "../features/auth/ChangePasswordPage";

import DashboardPage from "../features/dashboard/DashboardPage";
import ConsultaMedicaPage from "../features/atencion/ConsultaMedicaPage";
import DoctorQueuePage from "../features/atencion/DoctorQueuePage";
import FarmaciaPage from "../features/farmacia/FarmaciaPage";
import PacienteProfilePage from "../features/pacientes/PacienteProfilePage";
import CamasPage from "../features/hospitalizacion/CamasPage";
import AdminUsersPage from "../features/administracion/AdminUsersPage";

import PacientesPage from "../features/pacientes/PacientesPage";
import HistoriaClinicaPage from "../features/atencion/HistoriaClinicaPage";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/registro-paciente"
        element={<RegisterPatientPage />}
      />

      <Route
        path="/verificar-registro"
        element={
          <VerifyRegistrationPage />
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/mi-cuenta"
            element={<UserProfilePage />}
          />

          <Route
            path="/cambiar-contrasena"
            element={
              <ChangePasswordPage />
            }
          />

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "medico",
                  "enfermera",
                  "farmaceutico",
                  "almacen",
                  "laboratorio",
                  "cajero",
                  "recepcion",
                  "emergencias",
                  "administrador",
                  "direccion",
                ]}
              />
            }
          >
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "paciente",
                ]}
              />
            }
          >
            <Route
              path="/mi-perfil"
              element={
                <PacienteProfilePage />
              }
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "medico",
                  "enfermera",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/atencion/cola"
              element={<DoctorQueuePage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "medico",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/consulta-medica"
              element={
                <ConsultaMedicaPage />
              }
            />
            <Route
              path="/consulta-medica/:idPaciente"
              element={
                <ConsultaMedicaPage />
              }
            />

            
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "medico",
                  "enfermera",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/historia-clinica/:idPaciente"
              element={<HistoriaClinicaPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "farmaceutico",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/farmacia"
              element={<FarmaciaPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "medico",
                  "enfermera",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/hospitalizacion/camas"
              element={<CamasPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "recepcion",
                  "medico",
                  "enfermera",
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/pacientes"
              element={<PacientesPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "administrador",
                ]}
              />
            }
          >
            <Route
              path="/administracion/usuarios"
              element={<AdminUsersPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <div className="page-not-found">
            <h1>404</h1>

            <p>
              La página solicitada no
              existe o no tiene permiso
              para verla.
            </p>
          </div>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
import {
  FiActivity,
  FiClipboard,
  FiGrid,
  FiHeart,
  FiHome,
  FiList,
  FiPackage,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  {
    label: "Mi portal",
    path: "/mi-perfil",
    icon: FiUser,
    roles: ["paciente"],
  },
  {
    label: "Inicio",
    path: "/dashboard",
    icon: FiGrid,
    roles: [
      "medico",
      "enfermera",
      "laboratorio",
      "cajero",
      "recepcion",
      "emergencias",
      "almacen",
      "administrador",
      "direccion",
    ],
  },
  {
    label: "Cola de pacientes",
    path: "/atencion/cola",
    icon: FiList,
    roles: [
      "medico",
      "enfermera",
      "administrador",
    ],
  },
  {
    label: "Pacientes",
    path: "/pacientes",
    icon: FiUser,
    roles: [
      "recepcion",
      "medico",
      "enfermera",
      "administrador",
    ],
  },
  
  {
    label: "Consulta médica",
    path: "/consulta-medica",
    icon: FiHeart,
    roles: [
      "medico",
      "administrador",
    ],
  },
  {
    label: "Farmacia",
    path: "/farmacia",
    icon: FiPackage,
    roles: [
      "farmaceutico",
      "administrador",
    ],
  },
  {
    label: "Control de camas",
    path: "/hospitalizacion/camas",
    icon: FiHome,
    roles: [
      "medico",
      "enfermera",
      "administrador",
    ],
  },
  {
    label: "Usuarios del personal",
    path: "/administracion/usuarios",
    icon: FiUsers,
    roles: ["administrador"],
  },
  {
    label: "Órdenes clínicas",
    path: "/ordenes-clinicas",
    icon: FiClipboard,
    roles: [
      "laboratorio",
      "enfermera",
    ],
    disabled: true,
  },
  {
    label: "Auditoría",
    path: "/administracion/auditoria",
    icon: FiActivity,
    roles: ["administrador"],
    disabled: true,
  },
];

function Sidebar() {
  const { user } = useAuth();

  const currentRole =
    user?.role ?? "";

  const availableItems =
    menuItems.filter((item) =>
      item.roles.includes(currentRole),
    );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          ✚
        </div>

        <div>
          <strong>SIIH</strong>

          <span>
            Hospital San Andrés
          </span>
        </div>
      </div>

      <nav className="sidebar-navigation">
        {availableItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.path}
                className="sidebar-link sidebar-link-disabled"
                title="Este módulo se habilitará posteriormente"
              >
                <Icon />

                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <Icon />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-option"
        >
          <FiSettings />

          <span>Configuración</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
import { useState, useEffect } from "react";
import {
  FiKey,
  FiLock,
  FiSearch,
  FiUserPlus,
} from "react-icons/fi";
import Swal from "sweetalert2";
import {
  listStaff,
  createStaff,
} from "../../services/staffService";

const ROLE_OPTIONS = [
  { value: "recepcion", label: "Recepción" },
  { value: "medico", label: "Médico" },
  { value: "enfermera", label: "Enfermera" },
  { value: "farmaceutico", label: "Farmacéutico" },
  { value: "administrador", label: "Administrador" },
  { value: "direccion", label: "Dirección" },
];

const EMPTY_FORM = {
  ci: "",
  nombres: "",
  apellidos: "",
  role: "recepcion",
  nombre_usuario: "",
  password: "",
  email: "",
  matricula: "",
};

function AdminUsersPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("todos");

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await listStaff();
      setStaff(data);
    } catch (error) {
      console.error(
        "Error cargando personal:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const data = await listStaff();
        if (activo) {
          setStaff(data);
        }
      } catch (error) {
        console.error(
          "Error cargando personal:",
          error,
        );
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await createStaff(form);

      await Swal.fire({
        icon: "success",
        title: "Personal registrado",
        text: "La cuenta fue creada correctamente.",
        confirmButtonText: "Aceptar",
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      loadStaff();
    } catch (error) {
      const message =
        error.response?.data?.mensaje ??
        error.response?.data?.error ??
        "No se pudo registrar el personal.";

      await Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: message,
        confirmButtonText: "Aceptar",
      });
    } finally {
      setSaving(false);
    }
  };

  const notifyDisabled = () => {
    Swal.fire({
      icon: "info",
      title: "Función no disponible",
      text: "Esta acción se habilitará en una próxima fase del sistema.",
      confirmButtonText: "Entendido",
    });
  };

  const filteredStaff = staff.filter((member) => {
    const matchesRole =
      roleFilter === "todos" ||
      member.rol === roleFilter;

    const term = searchTerm.trim().toLowerCase();
    const fullName = (
      (member.nombres || "") +
      " " +
      (member.apellidos || "")
    ).toLowerCase();

    const matchesSearch =
      term === "" ||
      fullName.includes(term) ||
      (member.ci || "").includes(term) ||
      (member.nombre_usuario || "")
        .toLowerCase()
        .includes(term);

    return matchesRole && matchesSearch;
  });

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Usuarios del personal</h2>
          <p>
            Gestión del personal del hospital y sus
            cuentas de acceso.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => setShowForm((v) => !v)}
        >
          <FiUserPlus />
          {showForm
            ? "Cerrar formulario"
            : "Nuevo personal"}
        </button>
      </div>

      {showForm && (
        <div
          className="content-card"
          style={{ marginBottom: "20px" }}
        >
          <div className="card-heading">
            <div>
              <h3>Registrar nuevo personal</h3>
              <p>
                Se creará el registro del personal y
                su usuario de acceso.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="clinical-form-grid">
              <div className="form-group">
                <label htmlFor="ci">CI *</label>
                <input
                  id="ci"
                  name="ci"
                  value={form.ci}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Rol *</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option
                      key={r.value}
                      value={r.value}
                    >
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="nombres">
                  Nombres *
                </label>
                <input
                  id="nombres"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellidos">
                  Apellidos *
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombre_usuario">
                  Nombre de usuario *
                </label>
                <input
                  id="nombre_usuario"
                  name="nombre_usuario"
                  value={form.nombre_usuario}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Contraseña *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group clinical-full-column">
                <label htmlFor="matricula">
                  Matrícula profesional (opcional)
                </label>
                <input
                  id="matricula"
                  name="matricula"
                  value={form.matricula}
                  onChange={handleChange}
                  placeholder="Solo para personal médico"
                />
              </div>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                marginTop: "8px",
              }}
            >
              La contraseña debe tener mínimo 8
              caracteres, con mayúscula, minúscula,
              número y carácter especial.
            </p>

            <div className="clinical-action-bar">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-action-button"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : "Registrar personal"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card">
        <div className="card-heading">
          <div>
            <h3>Personal registrado</h3>
            <p>
              {loading
                ? "Cargando..."
                : `${filteredStaff.length} de ${staff.length} registro(s).`}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
            >
              <option value="todos">
                Todos los roles
              </option>
              {ROLE_OPTIONS.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                >
                  {r.label}
                </option>
              ))}
            </select>

            <div
              className="admin-users-search"
              style={{ maxWidth: "280px" }}
            >
              <FiSearch />
              <input
                placeholder="Buscar por nombre, CI o usuario..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>CI</th>
                <th>Nombre completo</th>
                <th>Rol</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        No hay personal que coincida.
                      </div>
                    </td>
                  </tr>
                )}

              {!loading &&
                filteredStaff.map((member) => (
                  <tr key={member.id_personal}>
                    <td>{member.ci}</td>
                    <td>
                      {member.nombres}{" "}
                      {member.apellidos}
                    </td>
                    <td>
                      <span className="status-badge">
                        {member.rol}
                      </span>
                    </td>
                    <td>
                      {member.nombre_usuario || "—"}
                    </td>
                    <td>
                      <span className="status-badge available">
                        {member.estado || "activo"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={notifyDisabled}
                          disabled
                          title="Se habilitará en una próxima fase"
                        >
                          <FiLock />
                          Bloquear
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={notifyDisabled}
                          disabled
                          title="Se habilitará en una próxima fase"
                        >
                          <FiKey />
                          Resetear
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminUsersPage;
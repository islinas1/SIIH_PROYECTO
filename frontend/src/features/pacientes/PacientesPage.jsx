import { useState, useEffect } from "react";
import { FiSearch, FiUserPlus } from "react-icons/fi";
import {
  listPatients,
  createPatient,
} from "../../services/patientService";
import { useNavigate } from "react-router-dom";

const EMPTY_FORM = {
  ci: "",
  nombres: "",
  apellidos: "",
  fecha_nacimiento: "",
  telefono: "",
  email: "",
  direccion: "",
};

function PacientesPage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadPatients = async (term = "") => {
    setLoading(true);
    setFeedback(null);

    try {
      const data = await listPatients(term);
      setPatients(data);
    } catch (error) {
      setFeedback({
        type: "danger",
        message:
          error.response?.data?.mensaje ??
          "No se pudieron cargar los pacientes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
      setLoading(true);
      try {
        const data = await listPatients("");
        if (activo) {
          setPatients(data);
        }
      } catch (error) {
        if (activo) {
          setFeedback({
            type: "danger",
            message:
              error.response?.data?.mensaje ??
              "No se pudieron cargar los pacientes.",
          });
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargarInicial();

    return () => {
      activo = false;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadPatients(searchTerm.trim());
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = { ...form };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          delete payload[key];
        }
      });

      await createPatient(payload);

      setFeedback({
        type: "success",
        message: "Paciente registrado correctamente.",
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadPatients();
    } catch (error) {
      setFeedback({
        type: "danger",
        message:
          error.response?.data?.mensaje ??
          error.response?.data?.error ??
          "No se pudo registrar el paciente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Gestión de pacientes</h2>
          <p>
            Registro y consulta de pacientes del
            hospital.
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
            : "Nuevo paciente"}
        </button>
      </div>

      {feedback && (
        <div
          className={
            feedback.type === "success"
              ? "system-alert information"
              : "system-alert danger"
          }
          style={{ marginBottom: "20px" }}
        >
          <strong>
            {feedback.type === "success"
              ? "Operación exitosa"
              : "Ocurrió un problema"}
          </strong>
          <span>{feedback.message}</span>
        </div>
      )}

      {showForm && (
        <div
          className="content-card"
          style={{ marginBottom: "20px" }}
        >
          <div className="card-heading">
            <div>
              <h3>Registrar nuevo paciente</h3>
              <p>
                Los campos marcados con * son
                obligatorios.
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
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_nacimiento">
                  Fecha de nacimiento *
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nombres">
                  Nombres *
                </label>
                <input
                  id="nombres"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group clinical-full-column">
                <label htmlFor="direccion">
                  Dirección
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleFormChange}
                />
              </div>
            </div>

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
                  : "Registrar paciente"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card">
        <div className="card-heading">
          <div>
            <h3>Pacientes registrados</h3>
            <p>
              {loading
                ? "Cargando..."
                : `${patients.length} paciente(s) encontrado(s).`}
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="admin-users-search"
            style={{ maxWidth: "320px" }}
          >
            <FiSearch />
            <input
              placeholder="Buscar por nombre o CI..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />
          </form>
        </div>

        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID Único</th>
                <th>CI</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                patients.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        No hay pacientes
                        registrados.
                      </div>
                    </td>
                  </tr>
                )}

              {!loading &&
                patients.map((p) => (
                  <tr key={p.id_paciente}>
                    <td>{p.id_unico}</td>
                    <td>{p.ci}</td>
                    <td>{p.nombres}</td>
                    <td>{p.apellidos}</td>
                    <td>{p.telefono || "—"}</td>
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
                          onClick={() =>
                            navigate(
                              `/consulta-medica/${p.id_paciente}`,
                            )
                          }
                        >
                          Atender
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/historia-clinica/${p.id_paciente}`,
                            )
                          }
                        >
                          Historia
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

export default PacientesPage;
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { getPatient } from "../../services/patientService";
import {
  getMedicalHistory,
  updateMedicalHistory,
  listAllergies,
  addAllergy,
  deleteAllergy,
} from "../../services/consultationService";

const SEVERITIES = [
  "LEVE",
  "MODERADA",
  "SEVERA",
  "CRITICA",
];

const EMPTY_ALLERGY = {
  principio_activo: "",
  severidad: "MODERADA",
  notas: "",
};

function HistoriaClinicaPage() {
  const { idPaciente } = useParams();

  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState({
    antecedentes: "",
    alergias: "",
    observaciones: "",
  });
  const [allergies, setAllergies] = useState([]);
  const [allergyForm, setAllergyForm] =
    useState(EMPTY_ALLERGY);
  const [loading, setLoading] = useState(
    Boolean(idPaciente),
  );
  const [savingHistory, setSavingHistory] =
    useState(false);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const [pac, hist, alerg] = await Promise.all([
          getPatient(idPaciente),
          getMedicalHistory(idPaciente),
          listAllergies(idPaciente).catch(() => []),
        ]);

        if (!activo) return;

        setPatient(pac);
        setHistory({
          antecedentes: hist.antecedentes || "",
          alergias: hist.alergias || "",
          observaciones: hist.observaciones || "",
        });
        setAllergies(alerg);
      } catch {
        if (activo) {
          Swal.fire({
            icon: "error",
            title: "No se pudo cargar la historia",
            text: "Verifique que el paciente exista.",
            confirmButtonText: "Aceptar",
          });
        }
      } finally {
        if (activo) setLoading(false);
      }
    };

    if (idPaciente) {
      cargar();
    }

    return () => {
      activo = false;
    };
  }, [idPaciente]);

  const handleHistoryChange = (event) => {
    const { name, value } = event.target;
    setHistory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveHistory = async () => {
    setSavingHistory(true);
    try {
      await updateMedicalHistory(idPaciente, history);
      await Swal.fire({
        icon: "success",
        title: "Historia actualizada",
        text: "Los cambios fueron guardados.",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text:
          error.response?.data?.mensaje ??
          "Ocurrió un problema al guardar.",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setSavingHistory(false);
    }
  };

  const handleAllergyChange = (event) => {
    const { name, value } = event.target;
    setAllergyForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAllergy = async (event) => {
    event.preventDefault();

    if (!allergyForm.principio_activo.trim()) {
      return;
    }

    try {
      const payload = {
        principio_activo:
          allergyForm.principio_activo.trim(),
        severidad: allergyForm.severidad,
      };

      if (allergyForm.notas.trim()) {
        payload.notas = allergyForm.notas.trim();
      }

      const nueva = await addAllergy(
        idPaciente,
        payload,
      );

      setAllergies((prev) => [...prev, nueva]);
      setAllergyForm(EMPTY_ALLERGY);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo agregar",
        text:
          error.response?.data?.mensaje ??
          "Ocurrió un problema.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const handleDeleteAllergy = async (idAlergia) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Eliminar alergia",
      text: "¿Confirma que desea eliminarla?",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteAllergy(idPaciente, idAlergia);
      setAllergies((prev) =>
        prev.filter(
          (a) => a.id_alergia !== idAlergia,
        ),
      );
    } catch {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        confirmButtonText: "Aceptar",
      });
    }
  };

  if (loading) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h2>Historia clínica</h2>
            <p>Cargando datos del paciente...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!patient) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h2>Historia clínica</h2>
            <p>
              No se encontró el paciente. Vuelva a la
              lista de pacientes.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Historia clínica</h2>
          <p>
            {patient.nombres} {patient.apellidos} ·
            CI: {patient.ci}
          </p>
        </div>
      </div>

      <div className="clinical-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Antecedentes y observaciones</h3>
              <p>
                Información general de la historia
                clínica.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="antecedentes">
              Antecedentes
            </label>
            <textarea
              id="antecedentes"
              name="antecedentes"
              value={history.antecedentes}
              onChange={handleHistoryChange}
              rows={4}
              placeholder="Antecedentes médicos, familiares, quirúrgicos..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="alergias">
              Alergias (texto libre)
            </label>
            <textarea
              id="alergias"
              name="alergias"
              value={history.alergias}
              onChange={handleHistoryChange}
              rows={2}
              placeholder="Resumen de alergias conocidas..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="observaciones">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={history.observaciones}
              onChange={handleHistoryChange}
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="clinical-action-bar">
            <button
              type="button"
              className="primary-action-button"
              onClick={saveHistory}
              disabled={savingHistory}
            >
              <FiSave />
              {savingHistory
                ? "Guardando..."
                : "Guardar historia"}
            </button>
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Alergias registradas</h3>
              <p>
                Alergias estructuradas con nivel de
                severidad.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddAllergy}>
            <div className="clinical-form-grid">
              <div className="form-group">
                <label htmlFor="principio_activo">
                  Principio activo
                </label>
                <input
                  id="principio_activo"
                  name="principio_activo"
                  value={
                    allergyForm.principio_activo
                  }
                  onChange={handleAllergyChange}
                  placeholder="Ej. Penicilina"
                />
              </div>

              <div className="form-group">
                <label htmlFor="severidad">
                  Severidad
                </label>
                <select
                  id="severidad"
                  name="severidad"
                  value={allergyForm.severidad}
                  onChange={handleAllergyChange}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group clinical-full-column">
                <label htmlFor="notas">
                  Notas
                </label>
                <input
                  id="notas"
                  name="notas"
                  value={allergyForm.notas}
                  onChange={handleAllergyChange}
                  placeholder="Reacción, contexto..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="secondary-button medication-add-button"
            >
              <FiPlus />
              Agregar alergia
            </button>
          </form>

          <div className="prescription-items">
            {allergies.length === 0 ? (
              <div className="empty-state">
                Sin alergias registradas.
              </div>
            ) : (
              allergies.map((a) => (
                <div
                  key={a.id_alergia}
                  className="prescription-item"
                >
                  <div>
                    <strong>
                      {a.principio_activo}
                    </strong>
                    <span>
                      Severidad: {a.severidad}
                    </span>
                    {a.notas && (
                      <small>{a.notas}</small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="icon-danger-button"
                    onClick={() =>
                      handleDeleteAllergy(
                        a.id_alergia,
                      )
                    }
                    aria-label="Eliminar alergia"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default HistoriaClinicaPage;
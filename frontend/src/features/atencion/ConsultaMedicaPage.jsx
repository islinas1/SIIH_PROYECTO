import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FiPlus,
  FiPrinter,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import Swal from "sweetalert2";
//import { useAuth } from "../../hooks/useAuth";
import {
  getPatient,
  getPatientAllergies,
} from "../../services/patientService";
import { listMedications } from "../../services/pharmacyService";
import {
  createConsultation,
  addDiagnosis,
  createPrescription,
} from "../../services/consultationService";

const initialMedicationForm = {
  medicationId: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
  quantity: "1",
};

function ConsultaMedicaPage() {
  //const { user } = useAuth();
  const { idPaciente } = useParams();

  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loadingPatient, setLoadingPatient] =
    useState(Boolean(idPaciente));

  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState({
    cie10: "",
    description: "",
  });
  const [notes, setNotes] = useState("");

  const [medicationForm, setMedicationForm] = useState(
    initialMedicationForm,
  );
  const [prescriptionItems, setPrescriptionItems] =
    useState([]);
  const [savedResult, setSavedResult] = useState(null);
  const [medicationCatalog, setMedicationCatalog] =
    useState([]);
  const [saving, setSaving] = useState(false);

  //const doctorName = user?.name ?? "Médico";

  // Carga el paciente, sus alergias y el catálogo de medicamentos.
  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setLoadingPatient(true);
      try {
        const [pac, alergiasData, meds] =
          await Promise.all([
            getPatient(idPaciente),
            getPatientAllergies(idPaciente).catch(
              () => [],
            ),
            listMedications(),
          ]);

        if (!activo) return;

        setPatient(pac);
        setAllergies(alergiasData);
        setMedicationCatalog(
          meds.map((m) => ({
            id: m.id_medicamento,
            name: m.nombre_comercial,
            stock: m.stock_total,
          })),
        );
      } catch {
        if (activo) {
          Swal.fire({
            icon: "error",
            title: "No se pudo cargar el paciente",
            text: "Verifique que el paciente exista.",
            confirmButtonText: "Aceptar",
          });
        }
      } finally {
        if (activo) setLoadingPatient(false);
      }
    };

    if (idPaciente) {
      cargar();
    } 

    return () => {
      activo = false;
    };
  }, [idPaciente]);

  const handleMedicationChange = (event) => {
    const { name, value } = event.target;
    setMedicationForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addMedication = async () => {
    if (
      !medicationForm.medicationId ||
      !medicationForm.dose.trim() ||
      !medicationForm.frequency.trim() ||
      !medicationForm.duration.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Medicamento incompleto",
        text: "Complete medicamento, dosis, frecuencia y duración.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const medication = medicationCatalog.find(
      (item) =>
        String(item.id) ===
        String(medicationForm.medicationId),
    );

    if (!medication) {
      await Swal.fire({
        icon: "error",
        title: "Medicamento no encontrado",
        text: "Seleccione nuevamente el medicamento.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const quantity = Number(medicationForm.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      await Swal.fire({
        icon: "warning",
        title: "Cantidad incorrecta",
        text: "La cantidad debe ser mayor o igual a uno.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const newItem = {
      id: medication.id + "-" + Date.now(),
      medicationId: medication.id,
      medicationName: medication.name,
      dose: medicationForm.dose.trim(),
      frequency: medicationForm.frequency.trim(),
      duration: medicationForm.duration.trim(),
      instructions:
        medicationForm.instructions.trim(),
      quantity,
      availableStock: medication.stock,
    };

    setPrescriptionItems((current) => [
      ...current,
      newItem,
    ]);
    setMedicationForm(initialMedicationForm);
  };

  const removeMedication = (itemId) => {
    setPrescriptionItems((current) =>
      current.filter((item) => item.id !== itemId),
    );
  };

  // Guarda la consulta contra el backend: consulta → diagnóstico → receta.
  const saveConsultation = async () => {
    if (!reason.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Motivo requerido",
        text: "Ingrese el motivo de la consulta.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    if (
      !diagnosis.cie10.trim() ||
      !diagnosis.description.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Diagnóstico incompleto",
        text: "Ingrese el código CIE-10 y la descripción.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    setSaving(true);

    try {
      // Paso 1: crear la consulta.
      const consulta = await createConsultation({
        idPaciente: Number(idPaciente),
        motivo: reason.trim(),
        tratamiento: notes.trim(),
        evolucion: notes.trim(),
      });

      // Paso 2: agregar el diagnóstico.
      await addDiagnosis({
        idConsulta: consulta.id_consulta,
        cie10: diagnosis.cie10.trim(),
        descripcion: diagnosis.description.trim(),
      });

      // Paso 3: emitir la receta si hay medicamentos.
      if (prescriptionItems.length > 0) {
        await createPrescription({
          idConsulta: consulta.id_consulta,
          detalles: prescriptionItems.map((item) => ({
            id_medicamento: item.medicationId,
            dosis: item.dose,
            frecuencia: item.frequency,
            duracion: item.duration,
            cantidad: item.quantity,
            indicaciones:
              item.instructions || undefined,
          })),
        });
      }

      setSavedResult({ consultation: consulta });

      await Swal.fire({
        icon: "success",
        title: "Consulta finalizada",
        text:
          prescriptionItems.length > 0
            ? "El diagnóstico fue guardado y la receta fue enviada a Farmacia."
            : "El diagnóstico fue guardado correctamente.",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      const message =
        error.response?.data?.mensaje ??
        error.response?.data?.error ??
        "No fue posible guardar la consulta.";

      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: message,
        confirmButtonText: "Aceptar",
      });
    } finally {
      setSaving(false);
    }
  };

  const printDocuments = async () => {
    if (!savedResult?.consultation) {
      await Swal.fire({
        icon: "warning",
        title: "Primero guarde la consulta",
        text: "Finalice la consulta antes de imprimir.",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    window.print();
  };

  if (loadingPatient) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h2>Consulta médica</h2>
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
            <h2>Consulta médica</h2>
            <p>
              No se encontró el paciente. Vuelva a la
              lista de pacientes y seleccione uno.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const patientFullName =
    patient.nombres + " " + patient.apellidos;

  return (
    <section className="clinical-page">
      <div className="page-heading">
        <div>
          <h2>Consulta médica activa</h2>
          <p>
            Registre el diagnóstico y la receta del
            paciente.
          </p>
        </div>
      </div>

      <article className="patient-summary-card">
        <div>
          <strong>{patientFullName}</strong>
          <span>
            ID: {patient.id_unico} · CI: {patient.ci}
          </span>
        </div>

        <div>
          <span>Fecha de nacimiento</span>
          <strong>
            {patient.fecha_nacimiento || "—"}
          </strong>
        </div>

        <div>
          <span>Correo</span>
          <strong>{patient.email || "—"}</strong>
        </div>

        <div className="patient-allergy">
          <span>Alergias</span>
          <strong>
            {allergies.length > 0
              ? allergies
                  .map((a) => a.principio_activo)
                  .join(", ")
              : "Sin alergias registradas"}
          </strong>
        </div>
      </article>

      <div className="clinical-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Diagnóstico médico</h3>
              <p>
                Información que se guardará en la
                historia clínica.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="consultationReason">
              Motivo de consulta
            </label>
            <textarea
              id="consultationReason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              rows={3}
              placeholder="Ej. Dolor de cabeza y fiebre desde hace dos días."
            />
          </div>

          <div className="clinical-form-grid">
            <div className="form-group">
              <label htmlFor="cie10">
                Código CIE-10 *
              </label>
              <input
                id="cie10"
                type="text"
                value={diagnosis.cie10}
                onChange={(event) =>
                  setDiagnosis((current) => ({
                    ...current,
                    cie10: event.target.value,
                  }))
                }
                placeholder="Ej. J06.9"
              />
            </div>

            <div className="form-group">
              <label htmlFor="diagnosisDescription">
                Diagnóstico *
              </label>
              <input
                id="diagnosisDescription"
                type="text"
                value={diagnosis.description}
                onChange={(event) =>
                  setDiagnosis((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Descripción del diagnóstico"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="clinicalNotes">
              Tratamiento, evolución y observaciones
            </label>
            <textarea
              id="clinicalNotes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={5}
              placeholder="Escriba las indicaciones clínicas..."
            />
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Receta médica</h3>
              <p>
                Los medicamentos confirmados
                aparecerán en Farmacia.
              </p>
            </div>
          </div>

          <div className="clinical-form-grid">
            <div className="form-group clinical-full-column">
              <label htmlFor="medicationId">
                Medicamento
              </label>
              <select
                id="medicationId"
                name="medicationId"
                value={medicationForm.medicationId}
                onChange={handleMedicationChange}
              >
                <option value="">
                  Seleccione un medicamento
                </option>
                {medicationCatalog.map(
                  (medication) => (
                    <option
                      key={medication.id}
                      value={medication.id}
                    >
                      {medication.name} — Stock:{" "}
                      {medication.stock}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dose">Dosis</label>
              <input
                id="dose"
                name="dose"
                type="text"
                value={medicationForm.dose}
                onChange={handleMedicationChange}
                placeholder="Ej. 1 tableta"
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequency">
                Frecuencia
              </label>
              <input
                id="frequency"
                name="frequency"
                type="text"
                value={medicationForm.frequency}
                onChange={handleMedicationChange}
                placeholder="Ej. Cada 8 horas"
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                Duración
              </label>
              <input
                id="duration"
                name="duration"
                type="text"
                value={medicationForm.duration}
                onChange={handleMedicationChange}
                placeholder="Ej. 5 días"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">
                Cantidad a dispensar
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={medicationForm.quantity}
                onChange={handleMedicationChange}
              />
            </div>

            <div className="form-group clinical-full-column">
              <label htmlFor="instructions">
                Indicaciones
              </label>
              <input
                id="instructions"
                name="instructions"
                type="text"
                value={medicationForm.instructions}
                onChange={handleMedicationChange}
                placeholder="Ej. Tomar después de los alimentos"
              />
            </div>
          </div>

          <button
            type="button"
            className="secondary-button medication-add-button"
            onClick={addMedication}
          >
            <FiPlus />
            Agregar medicamento
          </button>

          <div className="prescription-items">
            {prescriptionItems.length === 0 ? (
              <div className="empty-state">
                No se agregaron medicamentos.
              </div>
            ) : (
              prescriptionItems.map((item) => (
                <div
                  key={item.id}
                  className="prescription-item"
                >
                  <div>
                    <strong>
                      {item.medicationName}
                    </strong>
                    <span>
                      {item.dose} · {item.frequency}{" "}
                      · {item.duration}
                    </span>
                    <small>
                      Cantidad: {item.quantity}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="icon-danger-button"
                    onClick={() =>
                      removeMedication(item.id)
                    }
                    aria-label="Eliminar medicamento"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="clinical-action-bar">
        <button
          type="button"
          className="secondary-button"
          onClick={printDocuments}
        >
          <FiPrinter />
          Imprimir diagnóstico y receta
        </button>

        <button
          type="button"
          className="primary-action-button"
          onClick={saveConsultation}
          disabled={saving}
        >
          <FiSave />
          {saving
            ? "Guardando..."
            : "Finalizar consulta"}
        </button>
      </div>
    </section>
  );
}

export default ConsultaMedicaPage;
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getBeds } from "../../services/bedService";
import { listPatients } from "../../services/patientService";
import {
  listAdmissions,
  createAdmission,
  dischargeAdmission,
} from "../../services/consultationService";

function CamasPage() {
  const [beds] = useState(getBeds);
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedService, setSelectedService] =
    useState("todos");
  const [loading, setLoading] = useState(true);

  const loadBackendData = async () => {
    try {
      const [adm, pac] = await Promise.all([
        listAdmissions(true),
        listPatients(""),
      ]);
      setAdmissions(adm);
      setPatients(pac);
    } catch (error) {
      console.error(
        "Error cargando internaciones:",
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
        const [adm, pac] = await Promise.all([
          listAdmissions(true),
          listPatients(""),
        ]);
        if (activo) {
          setAdmissions(adm);
          setPatients(pac);
        }
      } catch (error) {
        console.error(
          "Error cargando internaciones:",
          error,
        );
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  const patientName = (idPaciente) => {
    const p = patients.find(
      (x) => x.id_paciente === idPaciente,
    );
    return p
      ? `${p.nombres} ${p.apellidos}`
      : `Paciente #${idPaciente}`;
  };

  // Busca si una cama (por su room) tiene una internación real activa.
  const admissionForBed = (bed) => {
    return admissions.find(
      (adm) => adm.habitacion === bed.room,
    );
  };

  const services = [
    ...new Set(beds.map((bed) => bed.serviceName)),
  ];

  const filteredBeds =
    selectedService === "todos"
      ? beds
      : beds.filter(
          (bed) =>
            bed.serviceName === selectedService,
        );

  // Cuenta ocupadas según internaciones reales.
  const occupiedCount = filteredBeds.filter((bed) =>
    admissionForBed(bed),
  ).length;

  const availableCount =
    filteredBeds.length - occupiedCount;

  const handleAdmit = async (bed) => {
    // Selecciona paciente y motivo mediante diálogos.
    const patientOptions = {};
    patients.forEach((p) => {
      patientOptions[p.id_paciente] =
        `${p.nombres} ${p.apellidos} — CI: ${p.ci}`;
    });

    if (patients.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin pacientes",
        text: "No hay pacientes registrados para internar.",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const { value: idPaciente } = await Swal.fire({
      title: `Internar en ${bed.room}`,
      input: "select",
      inputOptions: patientOptions,
      inputPlaceholder: "Seleccione un paciente",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        !value ? "Seleccione un paciente." : null,
    });

    if (!idPaciente) return;

    const { value: motivo } = await Swal.fire({
      title: "Motivo de ingreso",
      input: "text",
      inputPlaceholder: "Ej. Observación por dolor abdominal",
      showCancelButton: true,
      confirmButtonText: "Internar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        !value ? "Ingrese el motivo." : null,
    });

    if (!motivo) return;

    try {
      await createAdmission({
        id_paciente: Number(idPaciente),
        habitacion: bed.room,
        cama: bed.id,
        motivo_ingreso: motivo,
      });

      await Swal.fire({
        icon: "success",
        title: "Paciente internado",
        text: `Internado en ${bed.room}.`,
        confirmButtonText: "Aceptar",
      });

      loadBackendData();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo internar",
        text:
          error.response?.data?.mensaje ??
          error.response?.data?.error ??
          "Ocurrió un problema.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const handleDischarge = async (admission) => {
    const { value: motivo } = await Swal.fire({
      icon: "question",
      title: "Dar de alta",
      input: "text",
      inputLabel: "Motivo del alta",
      inputPlaceholder: "Ej. Mejoría clínica",
      showCancelButton: true,
      confirmButtonText: "Dar de alta",
      cancelButtonText: "Cancelar",
      inputValidator: (value) =>
        !value ? "Ingrese el motivo." : null,
    });

    if (!motivo) return;

    try {
      await dischargeAdmission(
        admission.id_internacion,
        motivo,
      );
      await Swal.fire({
        icon: "success",
        title: "Alta registrada",
        confirmButtonText: "Aceptar",
      });
      loadBackendData();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo dar de alta",
        text:
          error.response?.data?.mensaje ??
          "Ocurrió un problema.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Control de camas</h2>
          <p>
            Disponibilidad por servicio, sincronizada
            con las internaciones reales.
          </p>
        </div>
      </div>

      <div className="bed-toolbar">
        <div className="form-group">
          <label htmlFor="serviceFilter">
            Filtrar por servicio
          </label>

          <select
            id="serviceFilter"
            value={selectedService}
            onChange={(event) =>
              setSelectedService(event.target.value)
            }
          >
            <option value="todos">
              Todos los servicios
            </option>

            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="bed-summary">
          <span>
            Total:{" "}
            <strong>{filteredBeds.length}</strong>
          </span>

          <span>
            Disponibles:{" "}
            <strong>{availableCount}</strong>
          </span>

          <span>
            Ocupadas:{" "}
            <strong>{occupiedCount}</strong>
          </span>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          Cargando internaciones reales...
        </div>
      )}

      <div className="bed-grid">
        {filteredBeds.map((bed) => {
          const admission = admissionForBed(bed);
          const isOccupied = Boolean(admission);
          const statusClass = isOccupied
            ? "bed-ocupada"
            : "bed-disponible";

          return (
            <article
              key={bed.id}
              className={`bed-card ${statusClass}`}
            >
              <div className="bed-card-header">
                <strong>{bed.id}</strong>
                <span>{bed.serviceName}</span>
              </div>

              <p>Habitación: {bed.room}</p>

              {isOccupied ? (
                <>
                  <div className="bed-patient">
                    <span>Paciente</span>
                    <strong>
                      {patientName(
                        admission.id_paciente,
                      )}
                    </strong>
                  </div>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#64748b",
                    }}
                  >
                    {admission.motivo_ingreso}
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      handleDischarge(admission)
                    }
                    style={{ marginTop: "8px" }}
                  >
                    Dar de alta
                  </button>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#0d8888",
                    }}
                  >
                    Disponible
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleAdmit(bed)}
                    style={{ marginTop: "8px" }}
                  >
                    Internar aquí
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CamasPage;
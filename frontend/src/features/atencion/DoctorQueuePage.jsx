import { useState } from "react";
import {
  FiArrowDown,
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiRefreshCw,
  FiUserX,
  FiUsers,
  FiVolume2,
} from "react-icons/fi";
import {
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import {
  callNextPatient,
  getDoctorQueueSnapshot,
  markCurrentPatientAbsent,
  recallCurrentPatient,
  reincorporateAbsentPatient,
  sendCurrentPatientToEnd,
  startCurrentConsultation,
} from "../../services/medicalQueueService";

function DoctorQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const queueDoctorUsername =
    user?.role === "medico"
      ? user.username
      : "medico";

  const queueDoctorName =
    user?.role === "medico"
      ? user.name
      : "Dr. Roberto Méndez";

  const [queue, setQueue] = useState(
    () =>
      getDoctorQueueSnapshot(
        queueDoctorUsername,
        queueDoctorName,
      ),
  );

  const refreshQueue = () => {
    setQueue(
      getDoctorQueueSnapshot(
        queueDoctorUsername,
        queueDoctorName,
      ),
    );
  };

  const showError = async (message) => {
    await Swal.fire({
      icon: "warning",
      title:
        "No se pudo realizar la acción",
      text: message,
      confirmButtonText: "Aceptar",
    });
  };

  const handleCallNext = async () => {
    const result = callNextPatient(
      queueDoctorUsername,
      queueDoctorName,
    );

    if (!result.success) {
      await showError(result.message);
      return;
    }

    refreshQueue();

    await Swal.fire({
      icon: "info",
      title: "Paciente llamado",
      html:
        "<div style='font-size:24px;font-weight:800;margin:12px'>" +
        result.patient.ticketNumber +
        "</div>" +
        "<strong>" +
        result.patient.patientName +
        "</strong><br>" +
        "Pase al " +
        result.patient.consultingRoom,
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const handleRecall = async () => {
    const result = recallCurrentPatient(
      queueDoctorUsername,
      queueDoctorName,
    );

    if (!result.success) {
      await showError(result.message);
      return;
    }

    refreshQueue();

    await Swal.fire({
      icon: "info",
      title: "Paciente llamado nuevamente",
      text:
        result.patient.ticketNumber +
        " — Llamado número " +
        result.patient.callCount,
      timer: 1700,
      showConfirmButton: false,
    });
  };

  const handleMarkAbsent = async () => {
    const confirmation =
      await Swal.fire({
        icon: "warning",
        title:
          "Marcar paciente como ausente",
        text:
          "El paciente saldrá de la cola principal y podrá reincorporarse después.",
        showCancelButton: true,
        confirmButtonText:
          "Marcar ausente",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    const result =
      markCurrentPatientAbsent(
        queueDoctorUsername,
        queueDoctorName,
      );

    if (!result.success) {
      await showError(result.message);
      return;
    }

    refreshQueue();
  };

  const handleSendToEnd = async () => {
    const result =
      sendCurrentPatientToEnd(
        queueDoctorUsername,
        queueDoctorName,
      );

    if (!result.success) {
      await showError(result.message);
      return;
    }

    refreshQueue();

    await Swal.fire({
      icon: "success",
      title:
        "Paciente enviado al final",
      text:
        "Las posiciones de la cola fueron actualizadas.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleStartConsultation =
    async () => {
      const result =
        startCurrentConsultation(
          queueDoctorUsername,
          queueDoctorName,
        );

      if (!result.success) {
        await showError(result.message);
        return;
      }

      refreshQueue();

      navigate("/consulta-medica", {
        state: {
          queuePatient: result.patient,
        },
      });
    };

  const handleReincorporate =
    async (patientQueueId) => {
      const result =
        reincorporateAbsentPatient(
          patientQueueId,
          queueDoctorUsername,
          queueDoctorName,
        );

      if (!result.success) {
        await showError(result.message);
        return;
      }

      refreshQueue();

      await Swal.fire({
        icon: "success",
        title:
          "Paciente reincorporado",
        text:
          "El paciente fue colocado al final de la cola.",
        timer: 1500,
        showConfirmButton: false,
      });
    };

  const currentPatient =
    queue.currentPatient;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>
            Cola de atención médica
          </h2>

          <p>
            Llamado de pacientes y control
            de la atención del consultorio.
          </p>
        </div>

        <div className="doctor-room-label">
          <span>Consultorio</span>
          <strong>Consultorio 3</strong>
        </div>
      </div>

      <div className="indicator-grid doctor-queue-indicators">
        <article className="indicator-card">
          <div className="indicator-icon">
            <FiUsers />
          </div>

          <div>
            <p>En espera</p>
            <strong>
              {queue.waitingPatients.length}
            </strong>
            <span>Pacientes pendientes</span>
          </div>
        </article>

        <article className="indicator-card">
          <div className="indicator-icon">
            <FiVolume2 />
          </div>

          <div>
            <p>Llamando</p>
            <strong>
              {currentPatient?.status ===
              "llamado"
                ? "1"
                : "0"}
            </strong>
            <span>
              Paciente convocado
            </span>
          </div>
        </article>

        <article className="indicator-card">
          <div className="indicator-icon">
            <FiCheckCircle />
          </div>

          <div>
            <p>Atendidos</p>
            <strong>
              {
                queue.attendedPatients
                  .length
              }
            </strong>
            <span>Durante la jornada</span>
          </div>
        </article>

        <article className="indicator-card">
          <div className="indicator-icon">
            <FiUserX />
          </div>

          <div>
            <p>Ausentes</p>
            <strong>
              {
                queue.absentPatients
                  .length
              }
            </strong>
            <span>
              Pendientes de reincorporar
            </span>
          </div>
        </article>
      </div>

      <div className="doctor-queue-layout">
        <article className="content-card current-patient-card">
          <div className="card-heading">
            <div>
              <h3>
                Atendiendo ahora
              </h3>

              <p>
                Paciente actual del
                consultorio.
              </p>
            </div>

            <span
              className={
                currentPatient
                  ? currentPatient.status ===
                    "en_consulta"
                    ? "status-badge confirmed"
                    : "status-badge pending"
                  : "status-badge neutral"
              }
            >
              {currentPatient
                ? currentPatient.status ===
                  "en_consulta"
                  ? "En consulta"
                  : "Llamado"
                : "Sin paciente"}
            </span>
          </div>

          {!currentPatient ? (
            <div className="doctor-empty-current">
              <FiVolume2 />

              <h4>
                Ningún paciente llamado
              </h4>

              <p>
                Presione “Llamar al
                siguiente” para iniciar la
                atención.
              </p>
            </div>
          ) : (
            <>
              <div className="current-ticket-display">
                {
                  currentPatient.ticketNumber
                }
              </div>

              <div className="current-patient-information">
                <h4>
                  {
                    currentPatient.patientName
                  }
                </h4>

                <span>
                  CI: {currentPatient.ci}
                </span>

                <span>
                  Hora programada:{" "}
                  {
                    currentPatient.scheduledTime
                  }
                </span>

                <span>
                  Llegada:{" "}
                  {
                    currentPatient.arrivalTime
                  }
                </span>

                <span>
                  Motivo:{" "}
                  {currentPatient.reason}
                </span>
              </div>

              <div className="current-call-information">
                <span>
                  Número de llamados
                </span>

                <strong>
                  {
                    currentPatient.callCount
                  }
                </strong>
              </div>
            </>
          )}

          <div className="doctor-call-actions">
            <button
              type="button"
              className="primary-action-button"
              onClick={handleCallNext}
              disabled={Boolean(
                currentPatient,
              )}
            >
              <FiVolume2 />
              Llamar al siguiente
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleRecall}
              disabled={
                currentPatient?.status !==
                "llamado"
              }
            >
              <FiRefreshCw />
              Volver a llamar
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleSendToEnd}
              disabled={
                currentPatient?.status !==
                "llamado"
              }
            >
              <FiArrowDown />
              Enviar al final
            </button>

            <button
              type="button"
              className="secondary-button doctor-absent-button"
              onClick={handleMarkAbsent}
              disabled={
                currentPatient?.status !==
                "llamado"
              }
            >
              <FiUserX />
              Paciente ausente
            </button>

            <button
              type="button"
              className="primary-action-button doctor-start-button"
              onClick={
                handleStartConsultation
              }
              disabled={
                currentPatient?.status !==
                "llamado"
              }
            >
              <FiPlay />
              Iniciar consulta
            </button>
          </div>
        </article>

        <article className="content-card waiting-patients-card">
          <div className="card-heading">
            <div>
              <h3>
                Siguientes pacientes
              </h3>

              <p>
                Orden actual de atención.
              </p>
            </div>
          </div>

          {queue.waitingPatients.length ===
          0 ? (
            <div className="empty-state">
              No existen pacientes en
              espera.
            </div>
          ) : (
            <div className="waiting-patient-list">
              {queue.waitingPatients.map(
                (patient) => (
                  <div
                    key={patient.id}
                    className="waiting-patient-item"
                  >
                    <div className="queue-position">
                      {patient.position}
                    </div>

                    <div className="queue-ticket">
                      <strong>
                        {
                          patient.ticketNumber
                        }
                      </strong>

                      <span>
                        {
                          patient.patientName
                        }
                      </span>
                    </div>

                    <div className="queue-time">
                      <FiClock />

                      <span>
                        {
                          patient.scheduledTime
                        }
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </article>
      </div>

      {queue.absentPatients.length > 0 && (
        <article className="content-card absent-patients-card">
          <div className="card-heading">
            <div>
              <h3>
                Pacientes ausentes
              </h3>

              <p>
                Pueden reincorporarse al
                final de la cola.
              </p>
            </div>
          </div>

          <div className="absent-patient-list">
            {queue.absentPatients.map(
              (patient) => (
                <div
                  key={patient.id}
                  className="absent-patient-item"
                >
                  <div>
                    <strong>
                      {
                        patient.ticketNumber
                      }{" "}
                      —{" "}
                      {
                        patient.patientName
                      }
                    </strong>

                    <span>
                      Llamados realizados:{" "}
                      {patient.callCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      handleReincorporate(
                        patient.id,
                      )
                    }
                  >
                    <FiRefreshCw />
                    Reincorporar al final
                  </button>
                </div>
              ),
            )}
          </div>
        </article>
      )}
    </section>
  );
}

export default DoctorQueuePage;
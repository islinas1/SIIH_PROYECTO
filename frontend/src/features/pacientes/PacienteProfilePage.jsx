import { useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiMail,
  FiUser,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import {
  getPatientTickets,
  getSpecialties,
  requestPatientTicket,
} from "../../services/specialtyService";

function PacienteProfilePage() {
  const { user } = useAuth();

  const patientId =
    user?.patientId ?? "HUSA-000481";

  const patientName =
    user?.name ?? "Paciente";

  const [specialties, setSpecialties] =
    useState(() => getSpecialties());

  const [tickets, setTickets] =
    useState(() =>
      getPatientTickets(patientId),
    );

  const refreshTickets = () => {
    setSpecialties(getSpecialties());

    setTickets(
      getPatientTickets(patientId),
    );
  };

  const handleRequestTicket = async (
    specialty,
  ) => {
    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "Solicitar ficha",
        html:
          "<strong>" +
          specialty.name +
          "</strong><br>" +
          "Tiempo aproximado por consulta: " +
          specialty.consultationMinutes +
          " minutos.",
        showCancelButton: true,
        confirmButtonText:
          "Confirmar ficha",
        cancelButtonText: "Cancelar",
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    const result =
      requestPatientTicket({
        patientId,
        patientName,
        specialtyId: specialty.id,
      });

    if (!result.success) {
      await Swal.fire({
        icon: "warning",
        title:
          "No se pudo obtener la ficha",
        text: result.message,
      });

      return;
    }

    refreshTickets();

    await Swal.fire({
      icon: "success",
      title: "Ficha generada",
      html:
        "Su número de ficha es:<br>" +
        "<strong style='font-size:24px'>" +
        result.ticket.ticketNumber +
        "</strong>",
    });
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Mi portal de salud</h2>

          <p>
            Perfil, fichas, citas, recetas
            y resultados.
          </p>
        </div>

        <span className="role-badge">
          Paciente / Asegurado
        </span>
      </div>

      <article className="content-card patient-profile-header">
        <div className="patient-profile-avatar">
          <FiUser />
        </div>

        <div>
          <h3>{patientName}</h3>

          <p>
            ID hospitalario: {patientId}
          </p>

          {user?.registroUniversitario && (
            <span>
              Registro Universitario:{" "}
              {
                user.registroUniversitario
              }
            </span>
          )}
        </div>

        <div className="verified-email">
          <FiMail />

          <div>
            <span>
              Correo verificado
            </span>

            <strong>
              {user?.email ??
                "maria.condori@universidad.edu.bo"}
            </strong>
          </div>
        </div>
      </article>

      <div className="patient-services-grid">
        <article className="content-card patient-service-card">
          <FiCalendar />

          <h3>Mis citas</h3>

          <p>
            Consulte y administre sus citas
            programadas.
          </p>

          <button
            type="button"
            className="secondary-button"
          >
            Ver citas
          </button>
        </article>

        <article className="content-card patient-service-card">
          <FiFileText />

          <h3>Mis recetas</h3>

          <p>
            Consulte las recetas emitidas
            por sus médicos.
          </p>

          <button
            type="button"
            className="secondary-button"
          >
            Ver recetas
          </button>
        </article>

        <article className="content-card patient-service-card">
          <FiFileText />

          <h3>Mis resultados</h3>

          <p>
            Consulte resultados de
            laboratorio validados.
          </p>

          <button
            type="button"
            className="secondary-button"
          >
            Ver resultados
          </button>
        </article>
      </div>

      <article className="content-card patient-tickets-card">
        <div className="card-heading">
          <div>
            <h3>Mis fichas</h3>

            <p>
              Fichas solicitadas para la
              atención del día.
            </p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-state">
            Todavía no tiene fichas
            solicitadas.
          </div>
        ) : (
          <div className="patient-ticket-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="patient-ticket"
              >
                <div className="ticket-number">
                  {ticket.ticketNumber}
                </div>

                <div>
                  <strong>
                    {ticket.specialtyName}
                  </strong>

                  <span>
                    Fecha: {ticket.date}
                  </span>

                  <small>
                    Consulta aproximada:{" "}
                    {
                      ticket.consultationMinutes
                    }{" "}
                    minutos
                  </small>
                </div>

                <span className="status-badge pending">
                  En espera
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      <section className="specialties-section">
        <div className="page-heading specialties-heading">
          <div>
            <h2>
              Sacar ficha por especialidad
            </h2>

            <p>
              Seleccione la especialidad
              en la que desea recibir
              atención.
            </p>
          </div>
        </div>

        <div className="specialty-grid">
          {specialties.map(
            (specialty) => (
              <article
                key={specialty.id}
                className="specialty-card"
              >
                <div className="specialty-icon">
                  ✚
                </div>

                <h3>{specialty.name}</h3>

                <div className="specialty-detail">
                  <FiClock />

                  <span>
                    {
                      specialty.consultationMinutes
                    }{" "}
                    minutos por consulta
                  </span>
                </div>

                <div className="specialty-availability">
                  <span>
                    Fichas disponibles
                  </span>

                  <strong>
                    {
                      specialty.availableTickets
                    }
                  </strong>
                </div>

                <button
                  type="button"
                  className="primary-action-button specialty-button"
                  disabled={
                    specialty.availableTickets ===
                    0
                  }
                  onClick={() =>
                    handleRequestTicket(
                      specialty,
                    )
                  }
                >
                  {specialty.availableTickets >
                  0
                    ? "Sacar ficha"
                    : "Fichas agotadas"}
                </button>
              </article>
            ),
          )}
        </div>
      </section>

      <div className="patient-privacy-note">
        Su portal no muestra internaciones,
        disponibilidad de camas, auditoría,
        inventario ni módulos administrativos.
      </div>
    </section>
  );
}

export default PacienteProfilePage;
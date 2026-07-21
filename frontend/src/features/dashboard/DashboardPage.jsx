import {
  FiActivity,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiPackage,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABELS } from "../../config/roleConfig";
import { getMedicationCatalog } from "../../services/clinicalService";

function IndicatorCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <article className="indicator-card">
      <div className="indicator-icon">
        <Icon />
      </div>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
    </article>
  );
}

function DoctorDashboard() {
  const medications =
    getMedicationCatalog();

  return (
    <>
      <div className="indicator-grid">
        <IndicatorCard
          icon={FiCalendar}
          label="Citas de hoy"
          value="12"
          description="3 pacientes en espera"
        />

        <IndicatorCard
          icon={FiUsers}
          label="Pacientes atendidos"
          value="7"
          description="Durante la jornada"
        />

        <IndicatorCard
          icon={FiClipboard}
          label="Consultas pendientes"
          value="5"
          description="Agenda médica"
        />

        <IndicatorCard
          icon={FiPackage}
          label="Medicamentos"
          value={String(
            medications.length,
          )}
          description="Consulta de disponibilidad"
        />
      </div>

      <div className="dashboard-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Próximos pacientes</h3>
              <p>
                Agenda personal del médico.
              </p>
            </div>
          </div>

          <div className="appointment-list">
            <div className="appointment-item">
              <div className="appointment-time">
                09:00
              </div>

              <div>
                <strong>
                  María Condori
                </strong>

                <span>
                  Consulta de control
                </span>
              </div>

              <span className="status-badge confirmed">
                Confirmada
              </span>
            </div>

            <div className="appointment-item">
              <div className="appointment-time">
                09:30
              </div>

              <div>
                <strong>
                  Juan Pérez
                </strong>

                <span>
                  Primera consulta
                </span>
              </div>

              <span className="status-badge pending">
                En espera
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>
                Disponibilidad en farmacia
              </h3>

              <p>
                Consulta de stock. El médico
                no puede modificarlo.
              </p>
            </div>
          </div>

          <div className="doctor-stock-list">
            {medications.map(
              (medication) => (
                <div
                  key={medication.id}
                  className="doctor-stock-item"
                >
                  <div>
                    <strong>
                      {medication.name}
                    </strong>

                    <span>
                      {
                        medication.presentation
                      }
                    </span>
                  </div>

                  <span
                    className={
                      medication.stock <=
                      medication.minStock
                        ? "stock-status critical"
                        : "stock-status available"
                    }
                  >
                    {medication.stock} unidades
                  </span>
                </div>
              ),
            )}
          </div>
        </article>
      </div>
    </>
  );
}

function ReceptionDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiUsers}
        label="Pacientes registrados"
        value="1.248"
        description="Registro y actualización"
      />

      <IndicatorCard
        icon={FiCalendar}
        label="Citas de hoy"
        value="42"
        description="Agenda de admisión"
      />

      <IndicatorCard
        icon={FiClipboard}
        label="Nuevos asegurados"
        value="6"
        description="Pendientes de validación"
      />
    </div>
  );
}

function NurseDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiUsers}
        label="Pacientes asignados"
        value="18"
        description="Turno actual"
      />

      <IndicatorCard
        icon={FiActivity}
        label="Signos vitales pendientes"
        value="5"
        description="Requieren registro"
      />

      <IndicatorCard
        icon={FiClipboard}
        label="Notas de enfermería"
        value="9"
        description="Registradas hoy"
      />
    </div>
  );
}

function LaboratoryDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiClipboard}
        label="Órdenes pendientes"
        value="17"
        description="Esperando procesamiento"
      />

      <IndicatorCard
        icon={FiActivity}
        label="Resultados listos"
        value="23"
        description="Pendientes de validación"
      />
    </div>
  );
}

function CashierDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiCreditCard}
        label="Pagos pendientes"
        value="14"
        description="Atenciones por cobrar"
      />

      <IndicatorCard
        icon={FiClipboard}
        label="Facturas emitidas"
        value="36"
        description="Durante la jornada"
      />
    </div>
  );
}

function AdministratorDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiUsers}
        label="Usuarios activos"
        value="47"
        description="Personal y pacientes"
      />

      <IndicatorCard
        icon={FiShield}
        label="Roles configurados"
        value="9"
        description="Control de permisos"
      />

      <IndicatorCard
        icon={FiActivity}
        label="Eventos de auditoría"
        value="128"
        description="Registrados hoy"
      />

      <IndicatorCard
        icon={FiPackage}
        label="Módulos activos"
        value="8"
        description="Configuración general"
      />
    </div>
  );
}

function DirectionDashboard() {
  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiUsers}
        label="Pacientes atendidos"
        value="186"
        description="Durante el día"
      />

      <IndicatorCard
        icon={FiActivity}
        label="Ocupación hospitalaria"
        value="72%"
        description="Todos los servicios"
      />

      <IndicatorCard
        icon={FiCreditCard}
        label="Ingresos del día"
        value="Bs 24.580"
        description="Información ejecutiva"
      />
    </div>
  );
}

function FarmacyDashboard() {
  const medications =
    getMedicationCatalog();

  const critical = medications.filter(
    (medication) =>
      medication.stock <=
      medication.minStock,
  ).length;

  return (
    <div className="indicator-grid">
      <IndicatorCard
        icon={FiPackage}
        label="Medicamentos"
        value={String(
          medications.length,
        )}
        description="Catálogo activo"
      />

      <IndicatorCard
        icon={FiActivity}
        label="Stock crítico"
        value={String(critical)}
        description="Requiere reposición"
      />
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  const role =
    user?.role ?? "sin_rol";

  const dashboardByRole = {
    medico: <DoctorDashboard />,
    recepcion:
      <ReceptionDashboard />,
    enfermera: <NurseDashboard />,
    laboratorio:
      <LaboratoryDashboard />,
    cajero: <CashierDashboard />,
    administrador:
      <AdministratorDashboard />,
    direccion:
      <DirectionDashboard />,
    farmaceutico:
      <FarmacyDashboard />,
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>
            Bienvenido, {user?.name}
          </h2>

          <p>
            Panel personalizado según sus
            permisos.
          </p>
        </div>

        <span className="role-badge">
          {ROLE_LABELS[role] ?? role}
        </span>
      </div>

      {dashboardByRole[role] ?? (
        <div className="content-card">
          No existen indicadores
          configurados para este rol.
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
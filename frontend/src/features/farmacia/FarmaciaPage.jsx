import { useState, useEffect } from "react";
import {
  listMedications,
  listPrescriptions,
  dispensePrescription,
} from "../../services/pharmacyService";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiPackage,
} from "react-icons/fi";
import Swal from "sweetalert2";

function FarmaciaPage() {
  const [prescriptions, setPrescriptions] =
    useState([]);

  const [medications, setMedications] =
    useState([]);

  const refreshData = async () => {
    try {
      const [meds, recetas] = await Promise.all([
        listMedications(),
        listPrescriptions("EMITIDA"),
      ]);

      setMedications(
        meds.map((m) => ({
          id: m.id_medicamento,
          name: m.nombre_comercial,
          presentation: m.presentacion,
          stock: m.stock_total,
          minStock: m.stock_minimo,
        })),
      );

      setPrescriptions(recetas);
    } catch (error) {
      console.error(
        "Error recargando datos:",
        error,
      );
    }
  };

  // Carga inventario y recetas reales desde el backend al abrir la pantalla.
  useEffect(() => {
    let activo = true;

    const cargarTodo = async () => {
      try {
        const [meds, recetas] = await Promise.all([
          listMedications(),
          listPrescriptions("EMITIDA"),
        ]);

        if (!activo) return;

        setMedications(
          meds.map((m) => ({
            id: m.id_medicamento,
            name: m.nombre_comercial,
            presentation: m.presentacion,
            stock: m.stock_total,
            minStock: m.stock_minimo,
          })),
        );

        setPrescriptions(recetas);
      } catch (error) {
        console.error(
          "Error cargando datos de farmacia:",
          error,
        );
      }
    };

    cargarTodo();

    return () => {
      activo = false;
    };
  }, []);

  const handleDispense = async (receta) => {
    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmar dispensación",
      text: "Se descontarán los medicamentos del inventario.",
      showCancelButton: true,
      confirmButtonText: "Dispensar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await dispensePrescription(receta);
      await refreshData();

      await Swal.fire({
        icon: "success",
        title: "Medicamentos dispensados",
        text: "El inventario fue actualizado correctamente.",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      const message =
        error.response?.data?.mensaje ??
        error.response?.data?.error ??
        "No fue posible dispensar la receta.";

      await Swal.fire({
        icon: "error",
        title: "No se pudo dispensar",
        text: message,
        confirmButtonText: "Aceptar",
      });
    }
  };

  const criticalMedications = medications.filter(
    (medication) =>
      Number(medication.stock) <=
      Number(medication.minStock),
  );

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Farmacia e inventario</h2>

          <p>
            Recetas electrónicas pendientes y
            control de stock.
          </p>
        </div>
      </div>

      <div className="indicator-grid pharmacy-indicators">
        <article className="indicator-card">
          <div className="indicator-icon">
            <FiPackage />
          </div>

          <div>
            <p>Recetas pendientes</p>

            <strong>
              {prescriptions.length}
            </strong>

            <span>
              Esperando dispensación
            </span>
          </div>
        </article>

        <article className="indicator-card">
          <div className="indicator-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <p>Stock crítico</p>

            <strong>
              {criticalMedications.length}
            </strong>

            <span>Requieren reposición</span>
          </div>
        </article>

        <article className="indicator-card">
          <div className="indicator-icon">
            <FiCheckCircle />
          </div>

          <div>
            <p>Medicamentos activos</p>

            <strong>
              {medications.length}
            </strong>

            <span>Catálogo disponible</span>
          </div>
        </article>
      </div>

      <div className="pharmacy-layout">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Recetas pendientes</h3>

              <p>
                Enviadas desde la consulta médica.
              </p>
            </div>
          </div>

          <div className="pharmacy-prescriptions">
            {prescriptions.length === 0 ? (
              <div className="empty-state">
                No existen recetas pendientes.
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <article
                  key={prescription.id_receta}
                  className="pharmacy-prescription-card"
                >
                  <div className="prescription-patient">
                    <div>
                      <strong>
                        Receta #
                        {prescription.id_receta}
                      </strong>

                      <span>
                        Consulta:{" "}
                        {prescription.id_consulta}
                      </span>
                    </div>

                    <span className="status-badge pending">
                      {prescription.estado}
                    </span>
                  </div>

                  <div className="pharmacy-medication-list">
                    {Array.isArray(
                      prescription.detalles,
                    ) &&
                    prescription.detalles.length >
                      0 ? (
                      prescription.detalles.map(
                        (item) => (
                          <div
                            key={
                              item.id_detalle_receta
                            }
                            className="pharmacy-medication"
                          >
                            <div>
                              <strong>
                                {
                                  item.medicamento_nombre
                                }
                              </strong>

                              <span>
                                {item.dosis} ·{" "}
                                {item.frecuencia} ·{" "}
                                {item.duracion}
                              </span>
                            </div>

                            <span>
                              Cantidad:{" "}
                              {item.cantidad}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="empty-state">
                        La receta no tiene
                        medicamentos.
                      </div>
                    )}
                  </div>

                  <div className="pharmacy-card-footer">
                    <small>
                      Médico:{" "}
                      {prescription.medico
                        ? prescription.medico
                            .nombres +
                          " " +
                          prescription.medico
                            .apellidos
                        : "No registrado"}
                    </small>

                    <button
                      type="button"
                      className="primary-action-button"
                      onClick={() =>
                        handleDispense(prescription)
                      }
                    >
                      <FiCheckCircle />
                      Dispensar
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Inventario actual</h3>

              <p>
                Existencias reales por medicamento
              </p>
            </div>
          </div>

          <div className="inventory-list">
            {medications.length === 0 ? (
              <div className="empty-state">
                No existen medicamentos
                registrados.
              </div>
            ) : (
              medications.map((medication) => {
                const isCritical =
                  Number(medication.stock) <=
                  Number(
                    medication.minStock,
                  );

                return (
                  <div
                    key={medication.id}
                    className="inventory-item"
                  >
                    <div>
                      <strong>
                        {medication.name}
                      </strong>

                      <span>
                        {medication.presentation}
                      </span>
                    </div>

                    <div className="inventory-stock">
                      <strong>
                        {medication.stock}
                      </strong>

                      <span>unidades</span>
                    </div>

                    <span
                      className={
                        isCritical
                          ? "stock-status critical"
                          : "stock-status available"
                      }
                    >
                      {isCritical
                        ? "Stock crítico"
                        : "Disponible"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default FarmaciaPage;
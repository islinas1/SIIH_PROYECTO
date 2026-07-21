import apiClient from "../api/client";

// Lista el catálogo de medicamentos con su stock total calculado por el backend.
export async function listMedications() {
  const { data } = await apiClient.get(
    "/medicamentos",
  );

  return data;
}

// Lista solo los medicamentos con stock por debajo del mínimo.
export async function listLowStock() {
  const { data } = await apiClient.get(
    "/medicamentos/stock-bajo",
  );

  return data;
}

// Registra un medicamento nuevo en el catálogo.
export async function createMedication(medication) {
  const { data } = await apiClient.post(
    "/medicamentos",
    medication,
  );

  return data;
}

// Lista las recetas por estado. Por defecto trae las emitidas (pendientes).
export async function listPrescriptions(
  estado = "EMITIDA",
) {
  const { data } = await apiClient.get("/recetas", {
    params: { estado },
  });

  return data;
}

// Dispensa una receta completa: entrega la cantidad recetada de cada ítem.
// La receta trae detalles con id_detalle_receta y cantidad.
export async function dispensePrescription(receta) {
  const items = receta.detalles.map((d) => ({
    id_detalle_receta: d.id_detalle_receta,
    cantidad_a_entregar: d.cantidad,
  }));

  const { data } = await apiClient.post(
    `/recetas/${receta.id_receta}/dispensar`,
    { items },
  );

  return data;
}
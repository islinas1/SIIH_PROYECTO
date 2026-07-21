import apiClient from "../api/client";

// Paso 1: crea la consulta médica para un paciente.
// Devuelve la consulta creada, incluyendo su id_consulta.
export async function createConsultation({
  idPaciente,
  motivo,
  tratamiento,
  evolucion,
}) {
  const { data } = await apiClient.post(
    "/consultas",
    {
      id_paciente: idPaciente,
      motivo: motivo,
      tratamiento: tratamiento || undefined,
      evolucion: evolucion || undefined,
    },
  );

  return data;
}

// Paso 2: agrega un diagnóstico CIE-10 a una consulta existente.
export async function addDiagnosis({
  idConsulta,
  cie10,
  descripcion,
  tipo,
}) {
  const { data } = await apiClient.post(
    `/consultas/${idConsulta}/diagnosticos`,
    {
      codigo_cie10: cie10,
      descripcion: descripcion,
      tipo: tipo || "PRINCIPAL",
    },
  );

  return data;
}

// Paso 3: emite una receta electrónica asociada a la consulta.
// detalles = [{ id_medicamento, dosis, frecuencia, duracion, cantidad }]
export async function createPrescription({
  idConsulta,
  detalles,
}) {
  const { data } = await apiClient.post(
    "/recetas",
    {
      id_consulta: idConsulta,
      detalles: detalles,
    },
  );

  return data;
}

// ── Historia clínica ──────────────────────────────

// Obtiene la historia clínica de un paciente (antecedentes, alergias, observaciones).
export async function getMedicalHistory(idPaciente) {
  const { data } = await apiClient.get(
    `/pacientes/${idPaciente}/historia`,
  );

  return data;
}

// Actualiza los campos de la historia clínica.
export async function updateMedicalHistory(
  idPaciente,
  changes,
) {
  const { data } = await apiClient.patch(
    `/pacientes/${idPaciente}/historia`,
    changes,
  );

  return data;
}

// Lista las alergias registradas del paciente.
export async function listAllergies(idPaciente) {
  const { data } = await apiClient.get(
    `/pacientes/${idPaciente}/historia/alergias`,
  );

  return data;
}

// Registra una alergia nueva.
export async function addAllergy(
  idPaciente,
  allergy,
) {
  const { data } = await apiClient.post(
    `/pacientes/${idPaciente}/historia/alergias`,
    allergy,
  );

  return data;
}

// Elimina una alergia por su id.
export async function deleteAllergy(
  idPaciente,
  idAlergia,
) {
  const { data } = await apiClient.delete(
    `/pacientes/${idPaciente}/historia/alergias/${idAlergia}`,
  );

  return data;
}

// ── Internaciones (hospitalización) ──────────────

// Lista las internaciones. Por defecto solo las activas (sin alta).
export async function listAdmissions(
  soloActivas = true,
) {
  const { data } = await apiClient.get(
    "/internaciones",
    { params: { activas: soloActivas } },
  );

  return data;
}

// Interna a un paciente.
// admission = { id_paciente, habitacion, cama, motivo_ingreso }
export async function createAdmission(admission) {
  const { data } = await apiClient.post(
    "/internaciones",
    admission,
  );

  return data;
}

// Da de alta una internación.
export async function dischargeAdmission(
  idInternacion,
  motivoAlta,
) {
  const { data } = await apiClient.patch(
    `/internaciones/${idInternacion}/alta`,
    { motivo_alta: motivoAlta },
  );

  return data;
}
import apiClient from "../api/client";

// Lista pacientes. Si se pasa un término, filtra por nombre/CI en el backend.
export async function listPatients(searchTerm) {
  const params = searchTerm
    ? { q: searchTerm }
    : {};

  const { data } = await apiClient.get(
    "/pacientes",
    { params },
  );

  return data;
}

// Obtiene un paciente por su id.
export async function getPatient(idPaciente) {
  const { data } = await apiClient.get(
    `/pacientes/${idPaciente}`,
  );

  return data;
}

// Registra un paciente nuevo. Requiere rol recepción o administrador.
// patient = { ci, nombres, apellidos, fecha_nacimiento, direccion, telefono, email }
export async function createPatient(patient) {
  const { data } = await apiClient.post(
    "/pacientes",
    patient,
  );

  return data;
}

// Actualiza los datos de un paciente existente.
export async function updatePatient(
  idPaciente,
  changes,
) {
  const { data } = await apiClient.patch(
    `/pacientes/${idPaciente}`,
    changes,
  );

  return data;
}

// Obtiene las alergias registradas de un paciente 
export async function getPatientAllergies(idPaciente) {
  const { data } = await apiClient.get(
    `/pacientes/${idPaciente}/historia/alergias`,
  );

  return data;
}
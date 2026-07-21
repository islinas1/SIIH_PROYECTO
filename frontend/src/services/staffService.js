import apiClient from "../api/client";

// IDs de rol según el seed del backend (orden de creación).
// recepcion=1, medico=2, enfermera=3, farmaceutico=4,
// administrador=5, direccion=6, paciente=7
export const ROLE_IDS = {
  recepcion: 1,
  medico: 2,
  enfermera: 3,
  farmaceutico: 4,
  administrador: 5,
  direccion: 6,
};

// Lista todo el personal del hospital (con su rol, usuario y estado).
export async function listStaff() {
  const { data } = await apiClient.get("/personal");
  return data;
}

// Crea un miembro del personal + su usuario de acceso.
// staff = { ci, nombres, apellidos, role, nombre_usuario, password, matricula }
export async function createStaff(staff) {
  const payload = {
    ci: staff.ci,
    nombres: staff.nombres,
    apellidos: staff.apellidos,
    id_rol: ROLE_IDS[staff.role],
    nombre_usuario: staff.nombre_usuario,
    password: staff.password,
    email: staff.email,
  };

  if (staff.matricula) {
    payload.matricula = staff.matricula;
  }

  const { data } = await apiClient.post(
    "/personal",
    payload,
  );

  return data;
}
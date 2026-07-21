export const ROLE_OPTIONS = [
  {
    value: "paciente",
    label: "Paciente / Asegurado",
  },
  {
    value: "medico",
    label: "Médico / Especialista",
  },
  {
    value: "enfermera",
    label: "Enfermería",
  },
  {
    value: "farmaceutico",
    label: "Farmacia",
  },
  {
    value: "almacen",
    label: "Almacén / Abastecimiento",
  },
  {
    value: "laboratorio",
    label: "Laboratorio",
  },
  {
    value: "cajero",
    label: "Caja / Facturación",
  },
  {
    value: "recepcion",
    label: "Recepción / Admisión",
  },
  {
    value: "emergencias",
    label: "Emergencias",
  },
  {
    value: "administrador",
    label: "Administrador general",
  },
  {
    value: "direccion",
    label: "Dirección del hospital",
  },
];

export const STAFF_ROLE_OPTIONS =
  ROLE_OPTIONS.filter(
    (role) => role.value !== "paciente",
  );

export const ROLE_LABELS =
  ROLE_OPTIONS.reduce(
    (result, role) => ({
      ...result,
      [role.value]: role.label,
    }),
    {},
  );

export function getHomePathByRole(role) {
  const paths = {
    paciente: "/mi-perfil",
    medico: "/dashboard",
    enfermera: "/dashboard",
    farmaceutico: "/farmacia",
    almacen: "/dashboard",
    laboratorio: "/dashboard",
    cajero: "/dashboard",
    recepcion: "/dashboard",
    emergencias: "/dashboard",
    administrador: "/dashboard",
    direccion: "/dashboard",
  };

  return paths[role] ?? "/dashboard";
}
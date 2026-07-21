const BEDS_KEY = "siih_beds";

const hospitalServices = [
  {
    id: "EME",
    name: "Emergencias",
    prefix: "EME",
  },
  {
    id: "UTI",
    name: "Terapia intensiva",
    prefix: "UTI",
  },
  {
    id: "MAT",
    name: "Maternidad",
    prefix: "MAT",
  },
  {
    id: "POS",
    name: "Postcirugía",
    prefix: "POS",
  },
  {
    id: "TRA",
    name: "Traumatología",
    prefix: "TRA",
  },
  {
    id: "MED",
    name: "Medicina interna",
    prefix: "MED",
  },
  {
    id: "PED",
    name: "Pediatría",
    prefix: "PED",
  },
  {
    id: "NEO",
    name: "Neonatología",
    prefix: "NEO",
  },
];

const initialStatuses = [
  "disponible",
  "ocupada",
  "disponible",
  "limpieza",
  "disponible",
  "mantenimiento",
];

function generateInitialBeds() {
  return hospitalServices.flatMap((service) =>
    Array.from({ length: 6 }, (_, index) => ({
      id: `${service.prefix}-${String(index + 1).padStart(
        2,
        "0",
      )}`,
      serviceId: service.id,
      serviceName: service.name,
      room: `${service.prefix}-${100 + index + 1}`,
      status: initialStatuses[index],
      patient:
        index === 1
          ? {
              id: `HUSA-${service.prefix}-001`,
              name: "Paciente internado",
            }
          : null,
    })),
  );
}

export function getBeds() {
  try {
    const savedBeds = localStorage.getItem(BEDS_KEY);

    if (savedBeds) {
      return JSON.parse(savedBeds);
    }

    const initialBeds = generateInitialBeds();

    localStorage.setItem(
      BEDS_KEY,
      JSON.stringify(initialBeds),
    );

    return initialBeds;
  } catch {
    return generateInitialBeds();
  }
}

export function updateBedStatus(bedId, status) {
  const beds = getBeds();

  const updatedBeds = beds.map((bed) =>
    bed.id === bedId
      ? {
          ...bed,
          status,
          patient:
            status === "ocupada"
              ? bed.patient
              : null,
        }
      : bed,
  );

  localStorage.setItem(
    BEDS_KEY,
    JSON.stringify(updatedBeds),
  );

  return updatedBeds;
}
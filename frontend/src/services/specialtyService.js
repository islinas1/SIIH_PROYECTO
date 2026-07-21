const TICKETS_KEY = "siih_patient_tickets";

const specialties = [
  {
    id: "MED-GEN",
    name: "Medicina General",
    prefix: "MG",
    consultationMinutes: 20,
    dailyCapacity: 24,
  },
  {
    id: "CAR",
    name: "Cardiología",
    prefix: "CAR",
    consultationMinutes: 30,
    dailyCapacity: 16,
  },
  {
    id: "PED",
    name: "Pediatría",
    prefix: "PED",
    consultationMinutes: 25,
    dailyCapacity: 18,
  },
  {
    id: "TRA",
    name: "Traumatología",
    prefix: "TRA",
    consultationMinutes: 30,
    dailyCapacity: 14,
  },
  {
    id: "GIN",
    name: "Ginecología",
    prefix: "GIN",
    consultationMinutes: 30,
    dailyCapacity: 16,
  },
  {
    id: "DER",
    name: "Dermatología",
    prefix: "DER",
    consultationMinutes: 25,
    dailyCapacity: 15,
  },
  {
    id: "NEU",
    name: "Neurología",
    prefix: "NEU",
    consultationMinutes: 35,
    dailyCapacity: 12,
  },
  {
    id: "PSI",
    name: "Psicología",
    prefix: "PSI",
    consultationMinutes: 45,
    dailyCapacity: 10,
  },
  {
    id: "ODO",
    name: "Odontología",
    prefix: "ODO",
    consultationMinutes: 30,
    dailyCapacity: 16,
  },
  {
    id: "OFT",
    name: "Oftalmología",
    prefix: "OFT",
    consultationMinutes: 25,
    dailyCapacity: 16,
  },
  {
    id: "ORL",
    name: "Otorrinolaringología",
    prefix: "ORL",
    consultationMinutes: 30,
    dailyCapacity: 14,
  },
  {
    id: "URO",
    name: "Urología",
    prefix: "URO",
    consultationMinutes: 30,
    dailyCapacity: 14,
  },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function readTickets() {
  try {
    const savedTickets =
      localStorage.getItem(TICKETS_KEY);

    const tickets = savedTickets
      ? JSON.parse(savedTickets)
      : [];

    return Array.isArray(tickets) ? tickets : [];
  } catch {
    return [];
  }
}

function writeTickets(tickets) {
  localStorage.setItem(
    TICKETS_KEY,
    JSON.stringify(tickets),
  );
}

export function getSpecialties() {
  const tickets = readTickets();
  const today = getToday();

  return specialties.map((specialty) => {
    const issuedToday = tickets.filter(
      (ticket) =>
        ticket.specialtyId === specialty.id &&
        ticket.date === today &&
        ticket.status !== "cancelada",
    ).length;

    return {
      ...specialty,
      issuedToday,
      availableTickets: Math.max(
        specialty.dailyCapacity - issuedToday,
        0,
      ),
    };
  });
}

export function getPatientTickets(patientId) {
  return readTickets()
    .filter(
      (ticket) => ticket.patientId === patientId,
    )
    .sort(
      (first, second) =>
        new Date(second.createdAt) -
        new Date(first.createdAt),
    );
}

export function requestPatientTicket({
  patientId,
  patientName,
  specialtyId,
}) {
  const allTickets = readTickets();
  const today = getToday();

  const specialty = specialties.find(
    (item) => item.id === specialtyId,
  );

  if (!specialty) {
    return {
      success: false,
      message: "La especialidad no existe.",
    };
  }

  const duplicatedTicket = allTickets.find(
    (ticket) =>
      ticket.patientId === patientId &&
      ticket.specialtyId === specialtyId &&
      ticket.date === today &&
      !["cancelada", "atendida"].includes(
        ticket.status,
      ),
  );

  if (duplicatedTicket) {
    return {
      success: false,
      message:
        "Ya tiene una ficha activa para esta especialidad.",
    };
  }

  const issuedToday = allTickets.filter(
    (ticket) =>
      ticket.specialtyId === specialtyId &&
      ticket.date === today &&
      ticket.status !== "cancelada",
  ).length;

  if (issuedToday >= specialty.dailyCapacity) {
    return {
      success: false,
      message:
        "Las fichas de esta especialidad se agotaron por hoy.",
    };
  }

  const sequence = issuedToday + 1;

  const ticket = {
    id:
      specialty.prefix +
      "-" +
      today.replaceAll("-", "") +
      "-" +
      String(sequence).padStart(3, "0"),
    ticketNumber:
      specialty.prefix +
      "-" +
      String(sequence).padStart(3, "0"),
    patientId,
    patientName,
    specialtyId,
    specialtyName: specialty.name,
    consultationMinutes:
      specialty.consultationMinutes,
    date: today,
    status: "en_espera",
    createdAt: new Date().toISOString(),
  };

  allTickets.push(ticket);
  writeTickets(allTickets);

  return {
    success: true,
    ticket,
  };
}
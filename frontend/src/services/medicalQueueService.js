const MEDICAL_QUEUE_KEY = "siih_medical_queue";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function readQueue() {
  try {
    const savedQueue = localStorage.getItem(
      MEDICAL_QUEUE_KEY,
    );

    const queue = savedQueue
      ? JSON.parse(savedQueue)
      : [];

    return Array.isArray(queue) ? queue : [];
  } catch (error) {
    console.error(
      "Error leyendo la cola médica:",
      error,
    );

    return [];
  }
}

function writeQueue(queue) {
  localStorage.setItem(
    MEDICAL_QUEUE_KEY,
    JSON.stringify(queue),
  );
}

function createDailyQueue(
  doctorUsername,
  doctorName,
) {
  const today = getToday();

  const patients = [
    {
      patientId: "HUSA-000481",
      universityRegister: "202412345",
      ci: "4578129",
      patientName: "María Condori Quispe",
      email:
        "maria.condori@universidad.edu.bo",
      age: 24,
      allergies: "Penicilina",
      reason:
        "Dolor de cabeza y fiebre desde hace dos días.",
      ticketNumber: "MG-001",
      scheduledTime: "09:00",
      arrivalTime: "08:48",
    },
    {
      patientId: "HUSA-000482",
      universityRegister: "202412346",
      ci: "5487214",
      patientName: "Juan Pérez Flores",
      email: "juan.perez@correo.com",
      age: 35,
      allergies: "Ninguna conocida",
      reason: "Dolor abdominal",
      ticketNumber: "MG-002",
      scheduledTime: "09:20",
      arrivalTime: "09:02",
    },
    {
      patientId: "HUSA-000483",
      universityRegister: "202412347",
      ci: "6587412",
      patientName: "Ana Flores Mamani",
      email: "ana.flores@correo.com",
      age: 29,
      allergies: "Ibuprofeno",
      reason: "Consulta de control",
      ticketNumber: "MG-003",
      scheduledTime: "09:40",
      arrivalTime: "09:18",
    },
    {
      patientId: "HUSA-000484",
      universityRegister: "202412348",
      ci: "7485216",
      patientName: "Pedro Lima Choque",
      email: "pedro.lima@correo.com",
      age: 42,
      allergies: "Ninguna conocida",
      reason: "Dolor de espalda",
      ticketNumber: "MG-004",
      scheduledTime: "10:00",
      arrivalTime: "09:37",
    },
    {
      patientId: "HUSA-000485",
      universityRegister: "202412349",
      ci: "8475216",
      patientName: "Carla Mendoza Rojas",
      email: "carla.mendoza@correo.com",
      age: 31,
      allergies: "Amoxicilina",
      reason: "Dificultad respiratoria leve",
      ticketNumber: "MG-005",
      scheduledTime: "10:20",
      arrivalTime: "09:55",
    },
  ];

  return patients.map((patient, index) => ({
    id:
      "COLA-" +
      doctorUsername +
      "-" +
      today.replaceAll("-", "") +
      "-" +
      String(index + 1).padStart(3, "0"),
    ...patient,
    doctorUsername,
    doctorName,
    specialty: "Medicina General",
    consultingRoom: "Consultorio 3",
    date: today,
    position: index + 1,
    status: "en_espera",
    callCount: 0,
    calledAt: null,
    consultationStartedAt: null,
    consultationEndedAt: null,
    createdAt: new Date().toISOString(),
  }));
}

function ensureDoctorQueue(
  doctorUsername,
  doctorName,
) {
  const queue = readQueue();
  const today = getToday();

  const hasDailyQueue = queue.some(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today,
  );

  if (hasDailyQueue) {
    return queue;
  }

  const dailyQueue = createDailyQueue(
    doctorUsername,
    doctorName,
  );

  const updatedQueue = [
    ...queue,
    ...dailyQueue,
  ];

  writeQueue(updatedQueue);

  return updatedQueue;
}

function normalizePositions(
  queue,
  doctorUsername,
) {
  const today = getToday();

  const waitingPatients = queue
    .filter(
      (patient) =>
        patient.doctorUsername ===
          doctorUsername &&
        patient.date === today &&
        patient.status === "en_espera",
    )
    .sort((first, second) => {
      const firstPosition =
        Number(first.position) || 9999;

      const secondPosition =
        Number(second.position) || 9999;

      if (
        firstPosition !== secondPosition
      ) {
        return (
          firstPosition - secondPosition
        );
      }

      return (
        new Date(first.createdAt) -
        new Date(second.createdAt)
      );
    });

  const positions = new Map();

  waitingPatients.forEach(
    (patient, index) => {
      positions.set(
        patient.id,
        index + 1,
      );
    },
  );

  return queue.map((patient) => {
    if (positions.has(patient.id)) {
      return {
        ...patient,
        position: positions.get(
          patient.id,
        ),
      };
    }

    return patient;
  });
}

export function getDoctorQueueSnapshot(
  doctorUsername,
  doctorName,
) {
  const queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const normalizedQueue =
    normalizePositions(
      queue,
      doctorUsername,
    );

  writeQueue(normalizedQueue);

  const today = getToday();

  const doctorPatients =
    normalizedQueue.filter(
      (patient) =>
        patient.doctorUsername ===
          doctorUsername &&
        patient.date === today,
    );

  const currentPatient =
    doctorPatients.find(
      (patient) =>
        patient.status ===
          "en_consulta",
    ) ??
    doctorPatients.find(
      (patient) =>
        patient.status === "llamado",
    ) ??
    null;

  const waitingPatients = doctorPatients
    .filter(
      (patient) =>
        patient.status === "en_espera",
    )
    .sort(
      (first, second) =>
        first.position -
        second.position,
    );

  const absentPatients = doctorPatients
    .filter(
      (patient) =>
        patient.status === "ausente",
    )
    .sort(
      (first, second) =>
        new Date(second.absentAt) -
        new Date(first.absentAt),
    );

  const attendedPatients =
    doctorPatients.filter(
      (patient) =>
        patient.status === "atendido",
    );

  return {
    doctorUsername,
    doctorName,
    currentPatient,
    waitingPatients,
    absentPatients,
    attendedPatients,
    totalPatients:
      doctorPatients.length,
  };
}

export function callNextPatient(
  doctorUsername,
  doctorName,
) {
  let queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  queue = normalizePositions(
    queue,
    doctorUsername,
  );

  const today = getToday();

  const currentPatient = queue.find(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      [
        "llamado",
        "en_consulta",
      ].includes(patient.status),
  );

  if (currentPatient) {
    return {
      success: false,
      message:
        "Ya existe un paciente llamado o en consulta.",
    };
  }

  const nextPatient = queue
    .filter(
      (patient) =>
        patient.doctorUsername ===
          doctorUsername &&
        patient.date === today &&
        patient.status === "en_espera",
    )
    .sort(
      (first, second) =>
        first.position -
        second.position,
    )[0];

  if (!nextPatient) {
    return {
      success: false,
      message:
        "No existen pacientes en espera.",
    };
  }

  queue = queue.map((patient) =>
    patient.id === nextPatient.id
      ? {
          ...patient,
          status: "llamado",
          position: 0,
          callCount:
            Number(patient.callCount) +
            1,
          calledAt:
            new Date().toISOString(),
        }
      : patient,
  );

  queue = normalizePositions(
    queue,
    doctorUsername,
  );

  writeQueue(queue);

  return {
    success: true,
    patient: queue.find(
      (patient) =>
        patient.id === nextPatient.id,
    ),
  };
}

export function recallCurrentPatient(
  doctorUsername,
  doctorName,
) {
  const queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const today = getToday();

  const currentPatient = queue.find(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "llamado",
  );

  if (!currentPatient) {
    return {
      success: false,
      message:
        "No existe un paciente llamado.",
    };
  }

  const updatedQueue = queue.map(
    (patient) =>
      patient.id === currentPatient.id
        ? {
            ...patient,
            callCount:
              Number(
                patient.callCount,
              ) + 1,
            calledAt:
              new Date().toISOString(),
          }
        : patient,
  );

  writeQueue(updatedQueue);

  return {
    success: true,
    patient: updatedQueue.find(
      (patient) =>
        patient.id === currentPatient.id,
    ),
  };
}

export function markCurrentPatientAbsent(
  doctorUsername,
  doctorName,
) {
  let queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const today = getToday();

  const currentPatient = queue.find(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "llamado",
  );

  if (!currentPatient) {
    return {
      success: false,
      message:
        "No existe un paciente llamado.",
    };
  }

  queue = queue.map((patient) =>
    patient.id === currentPatient.id
      ? {
          ...patient,
          status: "ausente",
          position: null,
          absentAt:
            new Date().toISOString(),
        }
      : patient,
  );

  queue = normalizePositions(
    queue,
    doctorUsername,
  );

  writeQueue(queue);

  return {
    success: true,
  };
}

export function sendCurrentPatientToEnd(
  doctorUsername,
  doctorName,
) {
  let queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const today = getToday();

  const currentPatient = queue.find(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "llamado",
  );

  if (!currentPatient) {
    return {
      success: false,
      message:
        "No existe un paciente llamado.",
    };
  }

  const waitingPatients = queue.filter(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "en_espera",
  );

  const lastPosition =
    waitingPatients.length + 1;

  queue = queue.map((patient) =>
    patient.id === currentPatient.id
      ? {
          ...patient,
          status: "en_espera",
          position: lastPosition,
          calledAt: null,
          callCount: 0,
        }
      : patient,
  );

  queue = normalizePositions(
    queue,
    doctorUsername,
  );

  writeQueue(queue);

  return {
    success: true,
  };
}

export function startCurrentConsultation(
  doctorUsername,
  doctorName,
) {
  const queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const today = getToday();

  const currentPatient = queue.find(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "llamado",
  );

  if (!currentPatient) {
    return {
      success: false,
      message:
        "Primero debe llamar a un paciente.",
    };
  }

  const updatedQueue = queue.map(
    (patient) =>
      patient.id === currentPatient.id
        ? {
            ...patient,
            status: "en_consulta",
            consultationStartedAt:
              new Date().toISOString(),
          }
        : patient,
  );

  writeQueue(updatedQueue);

  return {
    success: true,
    patient: updatedQueue.find(
      (patient) =>
        patient.id === currentPatient.id,
    ),
  };
}

export function reincorporateAbsentPatient(
  patientQueueId,
  doctorUsername,
  doctorName,
) {
  let queue = ensureDoctorQueue(
    doctorUsername,
    doctorName,
  );

  const today = getToday();

  const absentPatient = queue.find(
    (patient) =>
      patient.id === patientQueueId &&
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "ausente",
  );

  if (!absentPatient) {
    return {
      success: false,
      message:
        "No se encontró al paciente ausente.",
    };
  }

  const waitingPatients = queue.filter(
    (patient) =>
      patient.doctorUsername ===
        doctorUsername &&
      patient.date === today &&
      patient.status === "en_espera",
  );

  queue = queue.map((patient) =>
    patient.id === absentPatient.id
      ? {
          ...patient,
          status: "en_espera",
          position:
            waitingPatients.length + 1,
          calledAt: null,
          callCount: 0,
          absentAt: null,
        }
      : patient,
  );

  queue = normalizePositions(
    queue,
    doctorUsername,
  );

  writeQueue(queue);

  return {
    success: true,
  };
}

export function finishQueueConsultation(
  patientQueueId,
) {
  let queue = readQueue();

  const patient = queue.find(
    (item) =>
      item.id === patientQueueId,
  );

  if (!patient) {
    return {
      success: false,
      message:
        "No se encontró al paciente en la cola.",
    };
  }

  queue = queue.map((item) =>
    item.id === patientQueueId
      ? {
          ...item,
          status: "atendido",
          consultationEndedAt:
            new Date().toISOString(),
        }
      : item,
  );

  queue = normalizePositions(
    queue,
    patient.doctorUsername,
  );

  writeQueue(queue);

  return {
    success: true,
  };
}
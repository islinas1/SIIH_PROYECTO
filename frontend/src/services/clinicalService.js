const MEDICATIONS_KEY = "siih_medications";
const CONSULTATIONS_KEY = "siih_consultations";
const PRESCRIPTIONS_KEY = "siih_prescriptions";

const initialMedications = [
  {
    id: "MED-001",
    name: "Paracetamol 500 mg",
    presentation: "Tabletas",
    stock: 120,
    minStock: 30,
  },
  {
    id: "MED-002",
    name: "Ibuprofeno 400 mg",
    presentation: "Tabletas",
    stock: 42,
    minStock: 30,
  },
  {
    id: "MED-003",
    name: "Amoxicilina 500 mg",
    presentation: "Cápsulas",
    stock: 80,
    minStock: 20,
  },
  {
    id: "MED-004",
    name: "Omeprazol 20 mg",
    presentation: "Cápsulas",
    stock: 65,
    minStock: 20,
  },
  {
    id: "MED-005",
    name: "Diclofenaco 50 mg",
    presentation: "Tabletas",
    stock: 18,
    minStock: 25,
  },
  {
    id: "MED-006",
    name: "Loratadina 10 mg",
    presentation: "Tabletas",
    stock: 55,
    minStock: 15,
  },
];

function readStorage(key, fallback = []) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.error(`Error leyendo ${key}:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix) {
  const random = Math.floor(Math.random() * 10000);

  return `${prefix}-${Date.now()}-${random}`;
}

export function getMedicationCatalog() {
  const savedMedications = readStorage(MEDICATIONS_KEY);

  if (savedMedications.length === 0) {
    writeStorage(MEDICATIONS_KEY, initialMedications);
    return initialMedications;
  }

  return savedMedications;
}

export function saveClinicalConsultation(data) {
  const consultations = readStorage(CONSULTATIONS_KEY);
  const prescriptions = readStorage(PRESCRIPTIONS_KEY);

  const consultation = {
    id: createId("CON"),
    patient: data.patient,
    doctor: data.doctor,
    appointmentId: data.appointmentId,
    reason: data.reason,
    diagnosis: data.diagnosis,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    status: "finalizada",
    emailSent: false,
  };

  let prescription = null;

  if (data.prescriptionItems.length > 0) {
    prescription = {
      id: createId("REC"),
      consultationId: consultation.id,
      patient: data.patient,
      doctor: data.doctor,
      items: data.prescriptionItems,
      createdAt: new Date().toISOString(),
      status: "pendiente",
      emailSent: false,
      dispensedAt: null,
    };

    prescriptions.push(prescription);
    writeStorage(PRESCRIPTIONS_KEY, prescriptions);
  }

  consultations.push(consultation);
  writeStorage(CONSULTATIONS_KEY, consultations);

  return {
    success: true,
    consultation,
    prescription,
  };
}

export function sendClinicalDocumentsEmail(consultationId) {
  const consultations = readStorage(CONSULTATIONS_KEY);
  const prescriptions = readStorage(PRESCRIPTIONS_KEY);

  const consultationIndex = consultations.findIndex(
    (consultation) => consultation.id === consultationId,
  );

  if (consultationIndex === -1) {
    return {
      success: false,
      message: "No se encontró la consulta.",
    };
  }

  consultations[consultationIndex] = {
    ...consultations[consultationIndex],
    emailSent: true,
    emailSentAt: new Date().toISOString(),
  };

  const prescriptionIndex = prescriptions.findIndex(
    (prescription) =>
      prescription.consultationId === consultationId,
  );

  if (prescriptionIndex !== -1) {
    prescriptions[prescriptionIndex] = {
      ...prescriptions[prescriptionIndex],
      emailSent: true,
      emailSentAt: new Date().toISOString(),
    };
  }

  writeStorage(CONSULTATIONS_KEY, consultations);
  writeStorage(PRESCRIPTIONS_KEY, prescriptions);

  return {
    success: true,
  };
}

export function getPendingPrescriptions() {
  const prescriptions = readStorage(PRESCRIPTIONS_KEY);

  return prescriptions.filter(
    (prescription) => prescription.status === "pendiente",
  );
}

export function getAllPrescriptions() {
  return readStorage(PRESCRIPTIONS_KEY);
}

export function dispensePrescription(prescriptionId) {
  const prescriptions = readStorage(PRESCRIPTIONS_KEY);
  const medications = getMedicationCatalog();

  const prescriptionIndex = prescriptions.findIndex(
    (prescription) => prescription.id === prescriptionId,
  );

  if (prescriptionIndex === -1) {
    return {
      success: false,
      message: "No se encontró la receta.",
    };
  }

  const prescription = prescriptions[prescriptionIndex];

  const insufficientMedication = prescription.items.find((item) => {
    const medication = medications.find(
      (currentMedication) =>
        currentMedication.id === item.medicationId,
    );

    return (
      !medication ||
      medication.stock < Number(item.quantity)
    );
  });

  if (insufficientMedication) {
    return {
      success: false,
      message: `No existe stock suficiente de ${insufficientMedication.medicationName}.`,
    };
  }

  prescription.items.forEach((item) => {
    const medicationIndex = medications.findIndex(
      (medication) => medication.id === item.medicationId,
    );

    medications[medicationIndex] = {
      ...medications[medicationIndex],
      stock:
        medications[medicationIndex].stock -
        Number(item.quantity),
    };
  });

  prescriptions[prescriptionIndex] = {
    ...prescription,
    status: "dispensada",
    dispensedAt: new Date().toISOString(),
  };

  writeStorage(MEDICATIONS_KEY, medications);
  writeStorage(PRESCRIPTIONS_KEY, prescriptions);

  return {
    success: true,
  };
}
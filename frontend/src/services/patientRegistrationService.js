const PENDING_PATIENT_KEY = "siih_pending_patient";
const PATIENT_ACCOUNTS_KEY = "siih_patient_accounts";

/*
 * Servicio provisional del frontend.
 *
 * Mientras no exista Flask y PostgreSQL:
 * - Los datos se guardan en localStorage.
 * - El código de verificación es 123456.
 * - La contraseña se guarda localmente solo para la demostración.
 *
 * En producción, la contraseña nunca debe guardarse de esta forma.
 */

function readStorage(key, fallback = null) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.error("Error leyendo almacenamiento:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getRegisteredPatients() {
  const patients = readStorage(PATIENT_ACCOUNTS_KEY, []);

  return Array.isArray(patients) ? patients : [];
}

export function getPendingPatient() {
  return readStorage(PENDING_PATIENT_KEY, null);
}

export function createPendingPatient(patientData) {
  const registeredPatients = getRegisteredPatients();

  const normalizedCi = patientData.ci.trim();
  const normalizedEmail = patientData.email
    .trim()
    .toLowerCase();

  const normalizedUniversityRegister =
    patientData.registroUniversitario.trim();

  const duplicatedPatient = registeredPatients.find(
    (patient) =>
      patient.ci === normalizedCi ||
      patient.email === normalizedEmail ||
      (
        normalizedUniversityRegister &&
        patient.registroUniversitario ===
          normalizedUniversityRegister
      ),
  );

  if (duplicatedPatient) {
    return {
      success: false,
      message:
        "Ya existe una cuenta con ese CI, correo o Registro Universitario.",
    };
  }

  const pendingPatient = {
    ...patientData,
    ci: normalizedCi,
    email: normalizedEmail,
    registroUniversitario:
      normalizedUniversityRegister,
    verificationCode: "123456",
    verified: false,
    createdAt: new Date().toISOString(),
  };

  writeStorage(PENDING_PATIENT_KEY, pendingPatient);

  return {
    success: true,
    email: pendingPatient.email,
  };
}

export function verifyPendingPatient(email, code) {
  const pendingPatient = getPendingPatient();

  if (!pendingPatient) {
    return {
      success: false,
      message:
        "No existe un registro pendiente de verificación.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  if (pendingPatient.email !== normalizedEmail) {
    return {
      success: false,
      message:
        "El correo no corresponde al registro pendiente.",
    };
  }

  if (
    pendingPatient.verificationCode !==
    normalizedCode
  ) {
    return {
      success: false,
      message:
        "El código de verificación es incorrecto.",
    };
  }

  const registeredPatients = getRegisteredPatients();

  const verifiedPatient = {
    idPaciente:
      "HUSA-" +
      String(Date.now()).slice(-6),
    role: "paciente",
    username: pendingPatient.email,
    tipoCuenta: pendingPatient.tipoCuenta,
    registroUniversitario:
      pendingPatient.registroUniversitario,
    ci: pendingPatient.ci,
    nombres: pendingPatient.nombres,
    apellidos: pendingPatient.apellidos,
    name:
      pendingPatient.nombres +
      " " +
      pendingPatient.apellidos,
    email: pendingPatient.email,
    fechaNacimiento:
      pendingPatient.fechaNacimiento,
    telefono: pendingPatient.telefono,
    direccion: pendingPatient.direccion,
    referenciaNombre:
      pendingPatient.referenciaNombre,
    referenciaTelefono:
      pendingPatient.referenciaTelefono,
    referenciaParentesco:
      pendingPatient.referenciaParentesco,
    aseguradora:
      pendingPatient.aseguradora,
    numeroSeguro:
      pendingPatient.numeroSeguro,
    password: pendingPatient.password,
    verified: true,
    verifiedAt: new Date().toISOString(),
  };

  registeredPatients.push(verifiedPatient);

  writeStorage(
    PATIENT_ACCOUNTS_KEY,
    registeredPatients,
  );

  localStorage.removeItem(PENDING_PATIENT_KEY);

  return {
    success: true,
    patient: verifiedPatient,
  };
}
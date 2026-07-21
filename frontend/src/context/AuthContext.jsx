import { useState } from "react";
import { AuthContext } from "./auth-context";
import { getRegisteredPatients } from "../services/patientRegistrationService";
import {
  findStaffAccountByIdentifier,
} from "../services/staffAccountService";
import {
  getAccountOverride,
  saveAccountOverride,
} from "../services/accountService";
import { loginRequest, logoutRequest } from "../features/auth/authService";

const STORAGE_KEY = "siih_user";

const demoUsers = [
  {
    username: "paciente",
    password: "123456",
    name: "María Condori Quispe",
    role: "paciente",
    email:
      "maria.condori@universidad.edu.bo",
    patientId: "HUSA-000481",
    tipoCuenta: "asegurado",
    ci: "4578129",
    registroUniversitario:
      "202412345",
    phone: "70000001",
    address: "La Paz, Bolivia",
    referenceName: "Juana Quispe",
    referencePhone: "70000002",
    referenceRelationship: "Madre",
    status: "activo",
  },
  {
    username: "medico",
    password: "123456",
    name: "Dr. Roberto Méndez",
    role: "medico",
    email: "roberto.mendez@husa.bo",
    phone: "70000101",
    ci: "4821567",
    cargo: "Médico especialista",
    service: "Consulta externa",
    specialty: "Medicina General",
    professionalLicense: "MED-45871",
    status: "activo",
  },
  {
    username: "enfermera",
    password: "123456",
    name: "Lic. Elena Vargas",
    role: "enfermera",
    email: "elena.vargas@husa.bo",
    phone: "70000102",
    ci: "5821467",
    cargo: "Licenciada en Enfermería",
    service: "Enfermería",
    shift: "Mañana",
    status: "activo",
  },
  {
    username: "farmacia",
    password: "123456",
    name: "Responsable de Farmacia",
    role: "farmaceutico",
    email: "farmacia@husa.bo",
    phone: "70000103",
    ci: "6821467",
    cargo: "Farmacéutico responsable",
    service: "Farmacia hospitalaria",
    professionalLicense: "FAR-1524",
    status: "activo",
  },
  {
    username: "almacen",
    password: "123456",
    name: "Responsable de Almacén",
    role: "almacen",
    email: "almacen@husa.bo",
    phone: "70000109",
    ci: "7821409",
    cargo: "Responsable de abastecimiento",
    service: "Almacén central",
    status: "activo",
  },
  {
    username: "laboratorio",
    password: "123456",
    name: "Técnico de Laboratorio",
    role: "laboratorio",
    email: "laboratorio@husa.bo",
    phone: "70000104",
    ci: "7821467",
    cargo: "Técnico de laboratorio",
    service: "Laboratorio clínico",
    status: "activo",
  },
  {
    username: "cajero",
    password: "123456",
    name: "Personal de Caja",
    role: "cajero",
    email: "caja@husa.bo",
    phone: "70000105",
    ci: "8821467",
    cargo: "Responsable de caja",
    service: "Caja y facturación",
    status: "activo",
  },
  {
    username: "recepcion",
    password: "123456",
    name: "Personal de Recepción",
    role: "recepcion",
    email: "recepcion@husa.bo",
    phone: "70000106",
    ci: "9821467",
    cargo: "Recepcionista",
    service: "Recepción y admisión",
    status: "activo",
  },
  {
    username: "emergencias",
    password: "123456",
    name: "Personal de Emergencias",
    role: "emergencias",
    email: "emergencias@husa.bo",
    phone: "70000110",
    ci: "7821410",
    cargo: "Personal de guardia",
    service: "Emergencias",
    shift: "Turno actual",
    status: "activo",
  },
  {
    username: "admin",
    password: "123456",
    name: "Administrador General",
    role: "administrador",
    email: "administrador@husa.bo",
    phone: "70000107",
    ci: "3821467",
    cargo: "Administrador del sistema",
    service:
      "Tecnologías de la información",
    status: "activo",
  },
  {
    username: "direccion",
    password: "123456",
    name: "Dirección del Hospital",
    role: "direccion",
    email: "direccion@husa.bo",
    phone: "70000108",
    ci: "2821467",
    cargo: "Director del hospital",
    service: "Dirección",
    status: "activo",
  },
];

function getStoredUser() {
  try {
    const savedUser =
      localStorage.getItem(STORAGE_KEY);

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  } catch (error) {
    console.error(
      "No se pudo recuperar la sesión:",
      error,
    );

    localStorage.removeItem(STORAGE_KEY);

    return null;
  }
}

function normalizeIdentifier(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findRegisteredPatient(
  identifier,
) {
  const normalizedIdentifier =
    normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  return (
    getRegisteredPatients().find(
      (patient) =>
        patient.verified &&
        [
          patient.idPaciente,
          patient.patientId,
          patient.username,
          patient.email,
          patient.ci,
          patient.registroUniversitario,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              normalizeIdentifier(value) ===
              normalizedIdentifier,
          ),
    ) ?? null
  );
}

function findDemoUser(identifier) {
  const normalizedIdentifier =
    normalizeIdentifier(identifier);

  return (
    demoUsers.find(
      (account) =>
        [
          account.username,
          account.email,
          account.ci,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              normalizeIdentifier(value) ===
              normalizedIdentifier,
          ),
    ) ?? null
  );
}

function findAccount(identifier) {
  return (
    findRegisteredPatient(identifier) ??
    findStaffAccountByIdentifier(
      identifier,
    ) ??
    findDemoUser(identifier)
  );
}

function getBaseAccountForCurrentUser(
  currentUser,
) {
  if (!currentUser) {
    return null;
  }

  const identifiers = [
    currentUser.patientId,
    currentUser.username,
    currentUser.email,
    currentUser.ci,
    currentUser.registroUniversitario,
  ].filter(Boolean);

  for (const identifier of identifiers) {
    const account =
      findAccount(identifier);

    if (account) {
      return account;
    }
  }

  return currentUser;
}

// eslint-disable-next-line no-unused-vars
function normalizeAuthenticatedUser(
  account,
) {
  return {
    username:
      account.username ??
      account.email ??
      account.ci,
    name:
      account.name ??
      [
        account.nombres,
        account.apellidos,
      ]
        .filter(Boolean)
        .join(" "),
    role: account.role,
    email: account.email ?? null,
    patientId:
      account.patientId ??
      account.idPaciente ??
      null,
    tipoCuenta:
      account.tipoCuenta ?? null,
    ci: account.ci ?? null,
    registroUniversitario:
      account.registroUniversitario ??
      null,
    phone:
      account.phone ??
      account.telefono ??
      null,
    address:
      account.address ??
      account.direccion ??
      null,
    referenceName:
      account.referenceName ??
      account.referenciaNombre ??
      null,
    referencePhone:
      account.referencePhone ??
      account.referenciaTelefono ??
      null,
    referenceRelationship:
      account.referenceRelationship ??
      account.referenciaParentesco ??
      null,
    cargo: account.cargo ?? null,
    service: account.service ?? null,
    specialty:
      account.specialty ?? null,
    professionalLicense:
      account.professionalLicense ??
      account.matriculaProfesional ??
      null,
    shift: account.shift ?? null,
    status:
      account.status ?? "activo",
    mustChangePassword:
      Boolean(
        account.mustChangePassword,
      ),
    token:
      "jwt-simulado-para-desarrollo",
  };
}

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(getStoredUser);

  const login = async ({
    username,
    password,
    selectedRole,
  }) => {
    try{
      const data = await loginRequest({
        nombreUsuario: username,
        password: password,
      });

      if ( selectedRole && data.rol !== selectedRole){
        return { success: false, message: "La cuenta no corresponde al tipo de acceso seleccionado.",};
      }
      const authenticatedUaser = {
        username: data.nombre_usuario,
        name: data.nombre_usuario,
        role:data.rol,
        token: data.access_token,
        status: "activo",
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authenticatedUaser),
      );

      setUser(authenticatedUaser);

      return {
        success: true,
        user: authenticatedUaser,
      };
    } catch (error) {
      const message = error.respose?.data?.mensaje ??
                      error.response?.data?.error ??
                      "usuario o contraseña incorrectos.";
      return {
        success: false,
        message,
      };
    }
  };

  const logout = () => {
    logoutRequest();
    localStorage.removeItem(
      STORAGE_KEY,
    );

    setUser(null);
  };

  const updateProfile = (changes) => {
    if (!user) {
      return {
        success: false,
        message:
          "No existe una sesión activa.",
      };
    }

    const allowedFields =
      user.role === "paciente"
        ? [
            "email",
            "phone",
            "address",
            "referenceName",
            "referencePhone",
            "referenceRelationship",
          ]
        : user.role ===
            "administrador"
          ? ["email", "phone"]
          : [];

    if (
      allowedFields.length === 0
    ) {
      return {
        success: false,
        message:
          "Los datos laborales solo pueden ser modificados por el administrador.",
      };
    }

    const sanitizedChanges = {};

    allowedFields.forEach((field) => {
      if (
        Object.prototype.hasOwnProperty.call(
          changes,
          field,
        )
      ) {
        sanitizedChanges[field] =
          String(
            changes[field] ?? "",
          ).trim();
      }
    });

    saveAccountOverride(
      user,
      sanitizedChanges,
    );

    const updatedUser = {
      ...user,
      ...sanitizedChanges,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedUser),
    );

    setUser(updatedUser);

    return {
      success: true,
      user: updatedUser,
    };
  };

  const changePassword = ({
    currentPassword,
    newPassword,
  }) => {
    if (!user) {
      return {
        success: false,
        message:
          "No existe una sesión activa.",
      };
    }

    const baseAccount =
      getBaseAccountForCurrentUser(
        user,
      );

    if (!baseAccount) {
      return {
        success: false,
        message:
          "No se encontró la cuenta.",
      };
    }

    const accountOverride =
      getAccountOverride(baseAccount);

    const effectivePassword =
      accountOverride.password ??
      baseAccount.password;

    if (
      effectivePassword !==
      currentPassword
    ) {
      return {
        success: false,
        message:
          "La contraseña actual es incorrecta.",
      };
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return {
        success: false,
        message:
          "La nueva contraseña debe ser diferente.",
      };
    }

    saveAccountOverride(
      baseAccount,
      {
        password: newPassword,
        mustChangePassword: false,
      },
    );

    return {
      success: true,
    };
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}
import { clearAccountOverride } from "./accountService";

const STAFF_ACCOUNTS_KEY =
  "siih_staff_accounts";

function readStaffAccounts() {
  try {
    const savedAccounts =
      localStorage.getItem(
        STAFF_ACCOUNTS_KEY,
      );

    const accounts = savedAccounts
      ? JSON.parse(savedAccounts)
      : [];

    return Array.isArray(accounts)
      ? accounts
      : [];
  } catch (error) {
    console.error(
      "Error leyendo cuentas del personal:",
      error,
    );

    return [];
  }
}

function writeStaffAccounts(accounts) {
  localStorage.setItem(
    STAFF_ACCOUNTS_KEY,
    JSON.stringify(accounts),
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function removeAccents(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

function createBaseUsername(fullName) {
  const cleanName = removeAccents(
    fullName,
  )
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "usuario";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1]
  );
}

function generateUniqueUsername(
  fullName,
  accounts,
) {
  const baseUsername =
    createBaseUsername(fullName);

  let username = baseUsername;
  let number = 1;

  while (
    accounts.some(
      (account) =>
        normalizeText(account.username) ===
        normalizeText(username),
    )
  ) {
    number += 1;
    username =
      baseUsername + number;
  }

  return username;
}

function generateTemporaryPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "#$%";

  const randomCharacter = (characters) => {
    const randomArray =
      new Uint32Array(1);

    crypto.getRandomValues(randomArray);

    return characters[
      randomArray[0] %
        characters.length
    ];
  };

  const passwordParts = [
    randomCharacter(uppercase),
    randomCharacter(lowercase),
    randomCharacter(lowercase),
    randomCharacter(numbers),
    randomCharacter(numbers),
    randomCharacter(symbols),
    randomCharacter(uppercase),
    randomCharacter(numbers),
  ];

  return passwordParts
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function getStaffAccounts() {
  return readStaffAccounts().sort(
    (first, second) =>
      new Date(second.createdAt) -
      new Date(first.createdAt),
  );
}

export function findStaffAccountByIdentifier(
  identifier,
) {
  const normalizedIdentifier =
    normalizeText(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  return (
    readStaffAccounts().find(
      (account) =>
        [
          account.username,
          account.email,
          account.ci,
        ]
          .filter(Boolean)
          .some(
            (value) =>
              normalizeText(value) ===
              normalizedIdentifier,
          ),
    ) ?? null
  );
}

export function createStaffAccount(data) {
  const accounts =
    readStaffAccounts();

  const requiredFields = [
    "name",
    "ci",
    "email",
    "phone",
    "cargo",
    "role",
    "service",
  ];

  const hasIncompleteFields =
    requiredFields.some(
      (field) =>
        !String(
          data[field] ?? "",
        ).trim(),
    );

  if (hasIncompleteFields) {
    return {
      success: false,
      message:
        "Complete todos los campos obligatorios.",
    };
  }

  const normalizedCi =
    normalizeText(data.ci);

  const normalizedEmail =
    normalizeText(data.email);

  const duplicatedAccount =
    accounts.find(
      (account) =>
        normalizeText(account.ci) ===
          normalizedCi ||
        normalizeText(account.email) ===
          normalizedEmail,
    );

  if (duplicatedAccount) {
    return {
      success: false,
      message:
        "Ya existe un trabajador registrado con ese CI o correo.",
    };
  }

  const username =
    generateUniqueUsername(
      data.name,
      accounts,
    );

  const temporaryPassword =
    generateTemporaryPassword();

  const account = {
    id:
      "PER-" +
      String(Date.now()).slice(-8),
    username,
    password: temporaryPassword,
    name: data.name.trim(),
    ci: data.ci.trim(),
    email: data.email
      .trim()
      .toLowerCase(),
    phone: data.phone.trim(),
    cargo: data.cargo.trim(),
    role: data.role,
    service: data.service.trim(),
    specialty:
      data.specialty?.trim() ?? "",
    professionalLicense:
      data.professionalLicense?.trim() ??
      "",
    shift:
      data.shift?.trim() ?? "",
    contractDate:
      data.contractDate ?? "",
    status: "activo",
    mustChangePassword: true,
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
  };

  accounts.push(account);
  writeStaffAccounts(accounts);

  return {
    success: true,
    account,
    temporaryPassword,
  };
}

export function changeStaffAccountStatus(
  accountId,
  newStatus,
) {
  const accounts =
    readStaffAccounts();

  const accountIndex =
    accounts.findIndex(
      (account) =>
        account.id === accountId,
    );

  if (accountIndex === -1) {
    return {
      success: false,
      message:
        "No se encontró la cuenta.",
    };
  }

  accounts[accountIndex] = {
    ...accounts[accountIndex],
    status: newStatus,
    updatedAt:
      new Date().toISOString(),
  };

  writeStaffAccounts(accounts);

  return {
    success: true,
    account: accounts[accountIndex],
  };
}

export function resetStaffPassword(
  accountId,
) {
  const accounts =
    readStaffAccounts();

  const accountIndex =
    accounts.findIndex(
      (account) =>
        account.id === accountId,
    );

  if (accountIndex === -1) {
    return {
      success: false,
      message:
        "No se encontró la cuenta.",
    };
  }

  const currentAccount =
    accounts[accountIndex];

  const temporaryPassword =
    generateTemporaryPassword();

  clearAccountOverride(currentAccount);

  accounts[accountIndex] = {
    ...currentAccount,
    password: temporaryPassword,
    mustChangePassword: true,
    updatedAt:
      new Date().toISOString(),
  };

  writeStaffAccounts(accounts);

  return {
    success: true,
    account: accounts[accountIndex],
    temporaryPassword,
  };
}
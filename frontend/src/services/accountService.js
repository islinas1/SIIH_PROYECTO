const ACCOUNT_OVERRIDES_KEY =
  "siih_account_overrides";

function readOverrides() {
  try {
    const savedValue = localStorage.getItem(
      ACCOUNT_OVERRIDES_KEY,
    );

    const parsedValue = savedValue
      ? JSON.parse(savedValue)
      : {};

    return parsedValue &&
      typeof parsedValue === "object"
      ? parsedValue
      : {};
  } catch (error) {
    console.error(
      "Error leyendo cambios de cuentas:",
      error,
    );

    return {};
  }
}

function writeOverrides(overrides) {
  localStorage.setItem(
    ACCOUNT_OVERRIDES_KEY,
    JSON.stringify(overrides),
  );
}

export function getAccountKey(account) {
  const role =
    account?.role ?? "sin_rol";

  const identity =
    account?.patientId ??
    account?.idPaciente ??
    account?.username ??
    account?.email ??
    account?.ci ??
    "sin_identificador";

  return (
    role +
    ":" +
    String(identity)
      .trim()
      .toLowerCase()
  );
}

export function getAccountOverride(account) {
  const overrides = readOverrides();
  const accountKey = getAccountKey(account);

  return overrides[accountKey] ?? {};
}

export function saveAccountOverride(
  account,
  changes,
) {
  const overrides = readOverrides();
  const accountKey = getAccountKey(account);

  const updatedOverride = {
    ...(overrides[accountKey] ?? {}),
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  overrides[accountKey] = updatedOverride;

  writeOverrides(overrides);

  return updatedOverride;
}

export function clearAccountOverride(account) {
  const overrides = readOverrides();
  const accountKey = getAccountKey(account);

  delete overrides[accountKey];

  writeOverrides(overrides);
}

export function mergeAccountOverride(account) {
  const override =
    getAccountOverride(account);

  return {
    ...account,
    ...override,
  };
}
import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { createPendingPatient } from "../../services/patientRegistrationService";

const initialForm = {
  tipoCuenta: "universitario",
  registroUniversitario: "",
  ci: "",
  nombres: "",
  apellidos: "",
  email: "",
  fechaNacimiento: "",
  telefono: "",
  direccion: "",
  referenciaNombre: "",
  referenciaTelefono: "",
  referenciaParentesco: "",
  aseguradora: "",
  numeroSeguro: "",
  password: "",
  confirmPassword: "",
};

function RegisterPatientPage() {
  const [form, setForm] =
    useState(initialForm);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "ci",
      "nombres",
      "apellidos",
      "email",
      "fechaNacimiento",
      "telefono",
      "referenciaNombre",
      "referenciaTelefono",
      "referenciaParentesco",
      "password",
      "confirmPassword",
    ];

    if (form.tipoCuenta === "universitario") {
      requiredFields.push(
        "registroUniversitario",
      );
    }

    if (form.tipoCuenta === "asegurado") {
      requiredFields.push(
        "aseguradora",
        "numeroSeguro",
      );
    }

    const incomplete = requiredFields.some(
      (field) => !form[field].trim(),
    );

    if (incomplete) {
      return "Complete todos los campos obligatorios.";
    }

    if (
      !form.email.includes("@") ||
      !form.email.includes(".")
    ) {
      return "Ingrese un correo electrónico válido.";
    }

    if (form.password.length < 6) {
      return "La contraseña debe tener al menos seis caracteres.";
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return "Las contraseñas no coinciden.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      await Swal.fire({
        icon: "warning",
        title: "Revise el formulario",
        text: validationError,
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        createPendingPatient(form);

      if (!result.success) {
        await Swal.fire({
          icon: "error",
          title:
            "No se pudo crear el registro",
          text: result.message,
        });

        return;
      }

      await Swal.fire({
        icon: "info",
        title:
          "Espere el código de verificación",
        text:
          "Se enviará un código de seis dígitos al correo " +
          result.email +
          ".",
        confirmButtonText:
          "Ingresar código",
      });

      navigate("/verificar-registro", {
        state: {
          email: result.email,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="public-form-page">
      <section className="public-form-card">
        <header className="public-form-header">
          <div className="login-logo">
            ✚
          </div>

          <div>
            <h1>
              Registro de paciente
            </h1>

            <p>
              Cree su cuenta como paciente
              universitario o asegurado.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <h2 className="form-section-title">
            Tipo de registro
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tipoCuenta">
                Tipo de paciente *
              </label>

              <select
                id="tipoCuenta"
                name="tipoCuenta"
                value={form.tipoCuenta}
                onChange={handleChange}
              >
                <option value="universitario">
                  Paciente universitario
                </option>

                <option value="asegurado">
                  Paciente asegurado
                </option>
              </select>
            </div>

            {form.tipoCuenta ===
              "universitario" && (
              <div className="form-group">
                <label htmlFor="registroUniversitario">
                  Registro Universitario *
                </label>

                <input
                  id="registroUniversitario"
                  name="registroUniversitario"
                  value={
                    form.registroUniversitario
                  }
                  onChange={handleChange}
                  placeholder="Ej. 202412345"
                />
              </div>
            )}
          </div>

          {form.tipoCuenta ===
            "asegurado" && (
            <>
              <h2 className="form-section-title">
                Información del seguro
              </h2>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="aseguradora">
                    Aseguradora *
                  </label>

                  <input
                    id="aseguradora"
                    name="aseguradora"
                    value={form.aseguradora}
                    onChange={handleChange}
                    placeholder="Nombre de la aseguradora"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="numeroSeguro">
                    Número de afiliación *
                  </label>

                  <input
                    id="numeroSeguro"
                    name="numeroSeguro"
                    value={form.numeroSeguro}
                    onChange={handleChange}
                    placeholder="Número del seguro"
                  />
                </div>
              </div>
            </>
          )}

          <h2 className="form-section-title">
            Datos personales
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ci">
                Carnet de Identidad *
              </label>

              <input
                id="ci"
                name="ci"
                value={form.ci}
                onChange={handleChange}
                placeholder="Ingrese su CI"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento">
                Fecha de nacimiento *
              </label>

              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                value={
                  form.fechaNacimiento
                }
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nombres">
                Nombres *
              </label>

              <input
                id="nombres"
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                placeholder="Nombres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellidos">
                Apellidos *
              </label>

              <input
                id="apellidos"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                placeholder="Apellidos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Correo electrónico *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">
                Teléfono *
              </label>

              <input
                id="telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+591..."
              />
            </div>

            <div className="form-group form-grid-full">
              <label htmlFor="direccion">
                Dirección
              </label>

              <input
                id="direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección de residencia"
              />
            </div>
          </div>

          <h2 className="form-section-title">
            Contacto de referencia
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="referenciaNombre">
                Nombre del contacto *
              </label>

              <input
                id="referenciaNombre"
                name="referenciaNombre"
                value={
                  form.referenciaNombre
                }
                onChange={handleChange}
                placeholder="Nombre completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="referenciaTelefono">
                Número de referencia *
              </label>

              <input
                id="referenciaTelefono"
                name="referenciaTelefono"
                value={
                  form.referenciaTelefono
                }
                onChange={handleChange}
                placeholder="+591..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="referenciaParentesco">
                Parentesco *
              </label>

              <select
                id="referenciaParentesco"
                name="referenciaParentesco"
                value={
                  form.referenciaParentesco
                }
                onChange={handleChange}
              >
                <option value="">
                  Seleccione una opción
                </option>

                <option value="padre">
                  Padre
                </option>

                <option value="madre">
                  Madre
                </option>

                <option value="hermano">
                  Hermano/a
                </option>

                <option value="conyuge">
                  Cónyuge
                </option>

                <option value="tutor">
                  Tutor
                </option>

                <option value="otro">
                  Otro
                </option>
              </select>
            </div>
          </div>

          <h2 className="form-section-title">
            Seguridad de la cuenta
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="password">
                Contraseña *
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmar contraseña *
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={
                  form.confirmPassword
                }
                onChange={handleChange}
                placeholder="Repita la contraseña"
              />
            </div>
          </div>

          <div className="verification-information">
            <strong>
              Verificación del correo
            </strong>

            <p>
              Al finalizar el formulario,
              espere el código de verificación
              que será enviado a su correo.
              Cuando conectemos el backend, el
              envío será real.
            </p>
          </div>

          <div className="public-form-actions">
            <Link
              to="/login"
              className="secondary-button"
            >
              Volver al login
            </Link>

            <button
              type="submit"
              className="login-button public-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Procesando..."
                : "Continuar y verificar correo"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default RegisterPatientPage;
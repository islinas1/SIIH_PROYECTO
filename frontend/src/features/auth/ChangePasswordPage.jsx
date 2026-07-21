import { useState } from "react";
import {
  FiCheckCircle,
  FiKey,
  FiLock,
} from "react-icons/fi";
import {
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";

function ChangePasswordPage() {
  const {
    changePassword,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validatePassword = () => {
    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      return "Complete todos los campos.";
    }

    if (form.newPassword.length < 8) {
      return "La nueva contraseña debe tener al menos 8 caracteres.";
    }

    if (
      !/[A-Z]/.test(
        form.newPassword,
      )
    ) {
      return "La contraseña debe contener una letra mayúscula.";
    }

    if (
      !/[a-z]/.test(
        form.newPassword,
      )
    ) {
      return "La contraseña debe contener una letra minúscula.";
    }

    if (
      !/[0-9]/.test(
        form.newPassword,
      )
    ) {
      return "La contraseña debe contener un número.";
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      return "Las nuevas contraseñas no coinciden.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validatePassword();

    if (validationError) {
      await Swal.fire({
        icon: "warning",
        title:
          "Revise la contraseña",
        text: validationError,
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        changePassword({
          currentPassword:
            form.currentPassword,
          newPassword:
            form.newPassword,
        });

      if (!result.success) {
        await Swal.fire({
          icon: "error",
          title:
            "No se pudo cambiar",
          text: result.message,
        });

        return;
      }

      await Swal.fire({
        icon: "success",
        title:
          "Contraseña actualizada",
        text:
          "Por seguridad, debe iniciar sesión nuevamente.",
        confirmButtonText:
          "Ir al inicio de sesión",
      });

      logout();

      navigate("/login", {
        replace: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>
            Cambiar contraseña
          </h2>

          <p>
            Actualice la contraseña de
            acceso a su cuenta.
          </p>
        </div>
      </div>

      <div className="password-page-grid">
        <article className="content-card password-form-card">
          <div className="password-form-icon">
            <FiKey />
          </div>

          <h3>
            Seguridad de la cuenta
          </h3>

          <p>
            Introduzca su contraseña
            actual y cree una nueva.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">
                Contraseña actual
              </label>

              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={
                  form.currentPassword
                }
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                Nueva contraseña
              </label>

              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmar nueva contraseña
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={
                  form.confirmPassword
                }
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="password-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(-1)
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-action-button"
                disabled={isSubmitting}
              >
                <FiLock />

                {isSubmitting
                  ? "Actualizando..."
                  : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </article>

        <article className="content-card password-requirements">
          <h3>
            La contraseña debe contener:
          </h3>

          <div>
            <FiCheckCircle />
            Al menos 8 caracteres
          </div>

          <div>
            <FiCheckCircle />
            Una letra mayúscula
          </div>

          <div>
            <FiCheckCircle />
            Una letra minúscula
          </div>

          <div>
            <FiCheckCircle />
            Un número
          </div>

          <div>
            <FiCheckCircle />
            Ser diferente de la contraseña
            actual
          </div>
        </article>
      </div>
    </section>
  );
}

export default ChangePasswordPage;
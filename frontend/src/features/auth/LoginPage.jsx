import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import {
  getHomePathByRole,
  ROLE_OPTIONS,
} from "../../config/roleConfig";

function LoginPage() {
  const [credentials, setCredentials] = useState({
    selectedRole: "",
    username: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const {
    user,
    login,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!credentials.selectedRole) {
      await Swal.fire({
        icon: "warning",
        title: "Seleccione el tipo de acceso",
        text:
          "Indique si ingresa como paciente, médico, farmacia u otro personal.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    if (
      !credentials.username.trim() ||
      !credentials.password.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Ingrese su usuario y contraseña.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        selectedRole: credentials.selectedRole,
        username: credentials.username.trim(),
        password: credentials.password,
      });

      if (
        !result ||
        !result.success ||
        !result.user
      ) {
        await Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text:
            result?.message ??
            "No fue posible iniciar sesión.",
          confirmButtonText: "Intentar nuevamente",
        });

        return;
      }

      /*
       * Una cuenta creada por el administrador entra primero
       * a la pantalla para cambiar su contraseña temporal.
       */
      if (result.user.mustChangePassword) {
        await Swal.fire({
          icon: "warning",
          title: "Contraseña temporal",
          text:
            "Por seguridad, debe crear una nueva contraseña antes de continuar.",
          confirmButtonText: "Cambiar contraseña",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        navigate("/cambiar-contrasena", {
          replace: true,
        });

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text:
          "Sesión iniciada como " +
          result.user.name +
          ".",
        timer: 1200,
        showConfirmButton: false,
      });

      const requestedPath =
        location.state?.from?.pathname;

      const destination =
        requestedPath ??
        getHomePathByRole(result.user.role);

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error iniciando sesión:",
        error,
      );

      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text:
          "No fue posible iniciar sesión. Revise la consola para conocer el error.",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />

        <p>Verificando sesión...</p>
      </div>
    );
  }

  /*
   * También se comprueba la contraseña temporal cuando
   * ya existe una sesión guardada en localStorage.
   */
  if (isAuthenticated) {
    const destination = user?.mustChangePassword
      ? "/cambiar-contrasena"
      : getHomePathByRole(user?.role);

    return (
      <Navigate
        to={destination}
        replace
      />
    );
  }

  return (
    <main className="login-page">
      <section className="login-introduction">
        <div>
          <div className="introduction-icon">
            ✚
          </div>

          <h1>
            Sistema Integrado de Información
            Hospitalaria
          </h1>

          <p>
            Acceso personalizado y seguro según las
            funciones de cada usuario.
          </p>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="login-logo">✚</div>

          <h2>SIIH</h2>

          <p className="login-subtitle">
            Hospital Universitario San Andrés
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="selectedRole">
                Tipo de acceso
              </label>

              <select
                id="selectedRole"
                name="selectedRole"
                value={credentials.selectedRole}
                onChange={handleChange}
              >
                <option value="">
                  Seleccione su perfil
                </option>

                {ROLE_OPTIONS.map((role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="username">
                Usuario, CI o correo
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Ingrese su identificación"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Verificando..."
                : "Iniciar sesión"}
            </button>
          </form>

          <div className="login-registration">
            <span>
              ¿Es paciente o asegurado?
            </span>

            <Link to="/registro-paciente">
              Crear cuenta
            </Link>
          </div>

          <div className="demo-credentials">
            <strong>
              Cuentas para probar
            </strong>

            <span>
              Médico: medico / 123456
            </span>

            <span>
              Farmacia: farmacia / 123456
            </span>

            <span>
              Almacén: almacen / 123456
            </span>

            <span>
              Paciente: paciente / 123456
            </span>

            <span>
              Administrador: admin / 123456
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
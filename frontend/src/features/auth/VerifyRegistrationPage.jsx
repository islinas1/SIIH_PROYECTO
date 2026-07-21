import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { verifyPendingPatient } from "../../services/patientRegistrationService";

function VerifyRegistrationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    location.state?.email ?? "",
  );

  const [code, setCode] =
    useState("");

  const [isVerifying, setIsVerifying] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !email.trim() ||
      !code.trim()
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text:
          "Ingrese el correo y el código de verificación.",
      });

      return;
    }

    setIsVerifying(true);

    try {
      const result =
        verifyPendingPatient(
          email,
          code,
        );

      if (!result.success) {
        await Swal.fire({
          icon: "error",
          title:
            "Verificación fallida",
          text: result.message,
        });

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Cuenta verificada",
        text:
          "Su identificador hospitalario es " +
          result.patient.idPaciente +
          ".",
        confirmButtonText:
          "Ir al inicio de sesión",
      });

      navigate("/login", {
        replace: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="verification-page">
      <section className="verification-card">
        <div className="verification-mail-icon">
          ✉
        </div>

        <h1>
          Espere el código de verificación
        </h1>

        <p>
          Se enviará un código de seis
          dígitos al correo registrado.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="verificationEmail">
              Correo electrónico
            </label>

            <input
              id="verificationEmail"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="verificationCode">
              Código de verificación
            </label>

            <input
              id="verificationCode"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value,
                )
              }
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isVerifying}
          >
            {isVerifying
              ? "Verificando..."
              : "Verificar cuenta"}
          </button>
        </form>

        <div className="demo-credentials">
          <strong>
            Prueba del frontend
          </strong>

          <span>
            Código temporal: 123456
          </span>
        </div>

        <Link to="/registro-paciente">
          Corregir datos del registro
        </Link>
      </section>
    </main>
  );
}

export default VerifyRegistrationPage;
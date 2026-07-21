import { useState } from "react";
import {
  FiBriefcase,
  FiEdit3,
  FiLock,
  FiMail,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ROLE_LABELS } from "../../config/roleConfig";
import { useAuth } from "../../hooks/useAuth";

function createProfileForm(user) {
  return {
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    referenceName: user?.referenceName ?? "",
    referencePhone: user?.referencePhone ?? "",
    referenceRelationship:
      user?.referenceRelationship ?? "",
  };
}

function UserProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const isPatient = user?.role === "paciente";

  const isAdministrator =
    user?.role === "administrador";

  const canEdit =
    isPatient || isAdministrator;

  const [isEditing, setIsEditing] =
    useState(false);

  const [form, setForm] = useState(() =>
    createProfileForm(user),
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setForm(createProfileForm(user));
    setIsEditing(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.email.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Correo requerido",
        text: "Ingrese un correo electrónico.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    const normalizedEmail = form.email
      .trim()
      .toLowerCase();

    const isValidEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      );

    if (!isValidEmail) {
      await Swal.fire({
        icon: "warning",
        title: "Correo incorrecto",
        text: "Ingrese un correo electrónico válido.",
        confirmButtonText: "Aceptar",
      });

      return;
    }

    try {
      const result = updateProfile({
        ...form,
        email: normalizedEmail,
      });

      if (!result?.success) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo actualizar",
          text:
            result?.message ??
            "No fue posible guardar los cambios.",
          confirmButtonText: "Aceptar",
        });

        return;
      }

      setForm(createProfileForm(result.user));
      setIsEditing(false);

      await Swal.fire({
        icon: "success",
        title: "Perfil actualizado",
        text: "Los cambios fueron guardados correctamente.",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      console.error(
        "Error actualizando el perfil:",
        error,
      );

      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No fue posible actualizar el perfil.",
        confirmButtonText: "Aceptar",
      });
    }
  };

  if (!user) {
    return (
      <section>
        <div className="content-card">
          No se pudo cargar la información del usuario.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Mi perfil</h2>

          <p>
            Información de identificación y seguridad de
            la cuenta.
          </p>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit3 />
            Editar información
          </button>
        )}
      </div>

      <article className="content-card account-profile-header">
        <div className="account-profile-avatar">
          {user.name?.charAt(0).toUpperCase() ?? "U"}
        </div>

        <div className="account-profile-title">
          <h3>{user.name}</h3>

          <span>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>

          <small>
            Usuario: {user.username}
          </small>
        </div>

        <div className="account-status">
          <FiShield />

          <div>
            <strong>Cuenta activa</strong>
            <span>Sesión verificada</span>
          </div>
        </div>
      </article>

      <div className="account-profile-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Información principal</h3>

              <p>
                Datos que identifican al usuario dentro del
                sistema.
              </p>
            </div>
          </div>

          <div className="profile-data-list">
            <div className="profile-data-item">
              <FiUser />

              <div>
                <span>Nombre completo</span>
                <strong>
                  {user.name ?? "No registrado"}
                </strong>
              </div>
            </div>

            <div className="profile-data-item">
              <FiShield />

              <div>
                <span>Carnet de identidad</span>
                <strong>
                  {user.ci ?? "No registrado"}
                </strong>
              </div>
            </div>

            {isPatient ? (
              <>
                <div className="profile-data-item">
                  <FiUser />

                  <div>
                    <span>
                      Identificador hospitalario
                    </span>

                    <strong>
                      {user.patientId ??
                        "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="profile-data-item">
                  <FiBriefcase />

                  <div>
                    <span>
                      Registro Universitario
                    </span>

                    <strong>
                      {user.registroUniversitario ??
                        "No corresponde"}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="profile-data-item">
                  <FiBriefcase />

                  <div>
                    <span>Cargo</span>

                    <strong>
                      {user.cargo ??
                        "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="profile-data-item">
                  <FiBriefcase />

                  <div>
                    <span>Servicio</span>

                    <strong>
                      {user.service ??
                        "No registrado"}
                    </strong>
                  </div>
                </div>

                {user.specialty && (
                  <div className="profile-data-item">
                    <FiBriefcase />

                    <div>
                      <span>Especialidad</span>
                      <strong>
                        {user.specialty}
                      </strong>
                    </div>
                  </div>
                )}

                {user.professionalLicense && (
                  <div className="profile-data-item">
                    <FiShield />

                    <div>
                      <span>
                        Matrícula profesional
                      </span>

                      <strong>
                        {user.professionalLicense}
                      </strong>
                    </div>
                  </div>
                )}

                {user.shift && (
                  <div className="profile-data-item">
                    <FiBriefcase />

                    <div>
                      <span>Turno asignado</span>
                      <strong>{user.shift}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!canEdit && (
            <div className="profile-readonly-notice">
              <FiLock />

              <p>
                Los datos laborales son administrados por el
                Administrador General. El personal no puede
                cambiar su cargo, rol, servicio o
                especialidad.
              </p>
            </div>
          )}
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Información de contacto</h3>

              <p>
                Datos utilizados para comunicaciones del
                sistema.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="profileEmail">
                Correo electrónico
              </label>

              <div className="profile-input-icon">
                <FiMail />

                <input
                  id="profileEmail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profilePhone">
                Teléfono
              </label>

              <div className="profile-input-icon">
                <FiPhone />

                <input
                  id="profilePhone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isPatient && (
              <>
                <div className="form-group">
                  <label htmlFor="profileAddress">
                    Dirección
                  </label>

                  <input
                    id="profileAddress"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <h4 className="profile-subtitle">
                  Contacto de referencia
                </h4>

                <div className="form-group">
                  <label htmlFor="referenceName">
                    Nombre completo
                  </label>

                  <input
                    id="referenceName"
                    name="referenceName"
                    value={form.referenceName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="referencePhone">
                    Teléfono
                  </label>

                  <input
                    id="referencePhone"
                    name="referencePhone"
                    type="tel"
                    value={form.referencePhone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="referenceRelationship">
                    Parentesco
                  </label>

                  <input
                    id="referenceRelationship"
                    name="referenceRelationship"
                    value={form.referenceRelationship}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </>
            )}

            {isEditing && (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-action-button"
                >
                  <FiSave />
                  Guardar cambios
                </button>
              </div>
            )}
          </form>
        </article>
      </div>

      <article className="content-card profile-security-card">
        <div>
          <FiLock />

          <div>
            <h3>Seguridad de la cuenta</h3>

            <p>
              Cambie periódicamente su contraseña para
              proteger su información.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/cambiar-contrasena")
          }
        >
          Cambiar contraseña
        </button>
      </article>
    </section>
  );
}

export default UserProfilePage;
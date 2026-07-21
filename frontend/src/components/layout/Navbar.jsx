import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FiBell,
  FiChevronDown,
  FiHelpCircle,
  FiKey,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import {
  useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABELS } from "../../config/roleConfig";

function Navbar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);

  const userMenuRef = useRef(null);

  const userName =
    user?.name ??
    "Usuario del sistema";

  const userRole =
    ROLE_LABELS[user?.role] ??
    user?.role ??
    "Sin rol";

  const userInitial =
    userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target,
        )
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  const goToProfile = () => {
    setIsUserMenuOpen(false);
    navigate("/mi-cuenta");
  };

  const goToChangePassword = () => {
    setIsUserMenuOpen(false);

    navigate(
      "/cambiar-contrasena",
    );
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "Cerrar sesión",
        text:
          "¿Está seguro de que desea salir del sistema?",
        showCancelButton: true,
        confirmButtonText:
          "Sí, cerrar sesión",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="top-navbar">
      <div className="navbar-heading">
        <h1 className="navbar-title">
          Sistema Hospitalario
        </h1>

        <p className="navbar-subtitle">
          Hospital Universitario San Andrés
        </p>
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <FiBell />
        </button>

        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <FiHelpCircle />
        </button>

        <div
          className="navbar-user-menu"
          ref={userMenuRef}
        >
          <button
            type="button"
            className="navbar-user-trigger"
            onClick={() =>
              setIsUserMenuOpen(
                (current) => !current,
              )
            }
            aria-expanded={
              isUserMenuOpen
            }
            aria-haspopup="menu"
          >
            <div className="user-avatar">
              {userInitial}
            </div>

            <div className="navbar-user-information">
              <strong>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>
            </div>

            <FiChevronDown
              className={
                isUserMenuOpen
                  ? "user-menu-arrow open"
                  : "user-menu-arrow"
              }
            />
          </button>

          {isUserMenuOpen && (
            <div
              className="user-dropdown"
              role="menu"
            >
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                  {userInitial}
                </div>

                <div>
                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {userRole}
                  </span>
                </div>
              </div>

              <div className="user-dropdown-divider" />

              <button
                type="button"
                className="user-dropdown-option"
                onClick={goToProfile}
              >
                <FiUser />

                <div>
                  <strong>
                    Mi perfil
                  </strong>

                  <span>
                    Consultar información
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="user-dropdown-option"
                onClick={
                  goToChangePassword
                }
              >
                <FiKey />

                <div>
                  <strong>
                    Cambiar contraseña
                  </strong>

                  <span>
                    Seguridad de la cuenta
                  </span>
                </div>
              </button>

              <div className="user-dropdown-divider" />

              <button
                type="button"
                className="user-dropdown-option logout"
                onClick={handleLogout}
              >
                <FiLogOut />

                <div>
                  <strong>
                    Cerrar sesión
                  </strong>

                  <span>
                    Salir de forma segura
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
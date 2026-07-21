import apiClient from "../../api/client";

export async function loginRequest({
    nombreUsuario,
    password,
}) {
    const { data } = await apiClient.post("/auth/login",{
        nombre_usuario: nombreUsuario,
        password: password,
    },);
    return data;
}

export async function logoutRequest() { 
    try {
        await apiClient.post("/auth/logout");
    }catch{ /* empty */ }
}
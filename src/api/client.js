import axios from 'axios';
import qs from 'qs';

const APIM_BASE = 'https://gf0js7uezg.execute-api.us-east-2.amazonaws.com/dev/api';
const API_URL = import.meta.env.VITE_API_URL || APIM_BASE;

// Configuración de Auth (Cognito)
const AUTH_URL = 'https://auth-banca-digiconecu-dev-lhd4go.auth.us-east-2.amazoncognito.com/oauth2/token';
const AUTH_BASIC = 'Basic N29qMTJqdHU4ZDNrZWlsdjFlMWdqa2M4ZTQ6MTZvOWJkcHBpMnFrdTY5dnVrN3FkY2ltNGZxcmtta2dnZGVyM2lxNDdwOWNzMjl0cXFvcQ==';
const SCOPE = 'https://switch-api.com/transfers.write';

// Claves para LocalStorage
const STORAGE_KEY_TOKEN = 'switch_access_token';
const STORAGE_KEY_EXPIRY = 'switch_token_expiry';

// Función para obtener token dinámicamente
async function getAccessToken() {
    // 1. Intentar recuperar de LocalStorage
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedExpiry = localStorage.getItem(STORAGE_KEY_EXPIRY);

    // Verificar si existe y NO ha expirado (damos 1 minuto de margen de seguridad)
    if (storedToken && storedExpiry && parseInt(storedExpiry) > Date.now()) {
        return storedToken;
    }

    try {
        console.log('Obteniendo nuevo token de Cognito...');
        const response = await axios.post(AUTH_URL, qs.stringify({
            grant_type: 'client_credentials',
            scope: SCOPE
        }), {
            headers: {
                'Authorization': AUTH_BASIC,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, expires_in } = response.data;

        // Calculamos expiración: Ahora + segundos de vida (menos 60s de margen)
        const expiryTime = Date.now() + (expires_in * 1000) - 60000;

        // 2. Guardar en LocalStorage
        localStorage.setItem(STORAGE_KEY_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());

        return access_token;
    } catch (error) {
        console.error('Error autenticando con Cognito:', error);
        // Si falla, limpiar storage por si acaso hay basura
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_EXPIRY);
        throw error;
    }
}

// Configuración de clientes según Guía APIM v2.0.0
export const nucleoApi = axios.create({ baseURL: `${API_URL}/v2/switch` });
export const directorioApi = axios.create({ baseURL: `${API_URL}/v1` });
export const contabilidadApi = axios.create({ baseURL: `${API_URL}/v1` }); // Funding/Ledger ahora en v1
export const compensacionApi = axios.create({ baseURL: `${API_URL}/v2/compensation` });

// Interceptor para inyectar Token Bearer en cada petición
const addAuthToken = async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
};

// Aplicar a todas las instancias
[nucleoApi, directorioApi, contabilidadApi, compensacionApi].forEach(api => {
    api.interceptors.request.use(addAuthToken, error => Promise.reject(error));

    api.interceptors.response.use(
        response => response,
        error => {
            console.error('API Error:', error.response?.data || error.message);
            return Promise.reject(error);
        }
    );
});

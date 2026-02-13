import axios from 'axios';

const APIM_BASE = 'https://gf0js7uezg.execute-api.us-east-2.amazonaws.com/dev/api';
const API_URL = import.meta.env.VITE_API_URL || APIM_BASE;

const headers = {
    'Authorization': 'Basic N29qMTJqdHU4ZDNrZWlsdjFlMWdqa2M4ZTQ6MTZvOWJkcHBpMnFrdTY5dnVrN3FkY2ltNGZxcmtta2dnZGVyM2lxNDdwOWNzMjl0cXFvcQ==',
    'Content-Type': 'application/json'
};

// Nucleo: /v2/switch
// Ejemplo de uso: .get('/transfers/{id}') -> /api/v2/switch/transfers/{id}
export const nucleoApi = axios.create({ baseURL: `${API_URL}/v2/switch`, headers });

// Directorio: /v2/switch/admin (Proxy via Nucleo)
// Ejemplo de uso: .post('/instituciones') -> /api/v2/switch/admin/instituciones
export const directorioApi = axios.create({ baseURL: `${API_URL}/v2/switch/admin`, headers });

// Contabilidad: /v2/switch/admin (Proxy via Nucleo)
// Ejemplo de uso: .post('/ledger/cuentas') -> /api/v2/switch/admin/ledger/cuentas
export const contabilidadApi = axios.create({ baseURL: `${API_URL}/v2/switch/admin`, headers });

// Compensacion: /v2/compensation
export const compensacionApi = axios.create({ baseURL: `${API_URL}/v2/compensation`, headers });

[nucleoApi, directorioApi, contabilidadApi, compensacionApi].forEach(api => {
    api.interceptors.response.use(
        response => response,
        error => {
            console.error('API Error:', error.response?.data || error.message);
            return Promise.reject(error);
        }
    );
});

import axios from 'axios';

const API = axios.create({ baseURL: 'https://pharmacybackend-80ww.onrender.com/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  signup: (data) => API.post('/auth/signup', data),
  getMe: () => API.get('/auth/me'),
  getUsers: () => API.get('/auth/users'),
  createUser: (data) => API.post('/auth/users', data),
  updateUser: (id, data) => API.put(`/auth/users/${id}`, data),
  deleteUser: (id) => API.delete(`/auth/users/${id}`),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

export const drugAPI = {
  getAll: (params) => API.get('/drugs', { params }),
  getOne: (id) => API.get(`/drugs/${id}`),
  create: (data) => API.post('/drugs', data),
  update: (id, data) => API.put(`/drugs/${id}`, data),
  delete: (id) => API.delete(`/drugs/${id}`),
  upload: (formData) => API.post('/drugs/upload', formData),
  downloadTemplate: () => API.get('/drugs/template', { responseType: 'blob' }),
};

export const supplierAPI = {
  getAll: (params) => API.get('/suppliers', { params }),
  getOne: (id) => API.get(`/suppliers/${id}`),
  create: (data) => API.post('/suppliers', data),
  update: (id, data) => API.put(`/suppliers/${id}`, data),
  delete: (id) => API.delete(`/suppliers/${id}`),
};

export const grnAPI = {
  getAll: (params) => API.get('/grn', { params }),
  getOne: (id) => API.get(`/grn/${id}`),
  create: (data) => API.post('/grn', data),
  parseExcel: (formData) => API.post('/grn/parse-excel', formData),
};

export const invoiceAPI = {
  getAll: (params) => API.get('/invoices', { params }),
  getOne: (id) => API.get(`/invoices/${id}`),
  create: (data) => API.post('/invoices', data),
  getDashboard: () => API.get('/invoices/dashboard'),
};

export const salesReturnAPI = {
  getAll: (params) => API.get('/returns', { params }),
  getOne: (id) => API.get(`/returns/${id}`),
  create: (data) => API.post('/returns', data),
};

export const purchaseReturnAPI = {
  getAll: (params) => API.get('/purchase-returns', { params }),
  getOne: (id) => API.get(`/purchase-returns/${id}`),
  create: (data) => API.post('/purchase-returns', data),
};

export const stockAPI = {
  getAdjustments: (params) => API.get('/stock/adjustments', { params }),
  createAdjustment: (data) => API.post('/stock/adjustments', data),
  getTransfers: (params) => API.get('/stock/transfers', { params }),
  createTransfer: (data) => API.post('/stock/transfers', data),
  getOpenings: (params) => API.get('/stock/openings', { params }),
  createOpening: (data) => API.post('/stock/openings', data),
  getLedger: (params) => API.get('/stock/ledger', { params }),
};

export const accountAPI = {
  getAll: (params) => API.get('/accounts', { params }),
  create: (data) => API.post('/accounts', data),
  remove: (id) => API.delete(`/accounts/${id}`),
};

const masterFactory = (base) => ({
  getAll: (params) => API.get(base, { params }),
  getOne: (id) => API.get(`${base}/${id}`),
  create: (data) => API.post(base, data),
  update: (id, data) => API.put(`${base}/${id}`, data),
  remove: (id) => API.delete(`${base}/${id}`),
});

export const categoryAPI = masterFactory('/categories');
export const unitAPI = masterFactory('/units');
export const companyAPI = masterFactory('/companies');
export const customerAPI = masterFactory('/customers');
export const doctorAPI = masterFactory('/doctors');

export const settingsAPI = {
  get: () => API.get('/settings'),
  update: (data) => API.put('/settings', data),
  uploadLogo: (formData) => API.post('/settings/upload-logo', formData),
};

export default API;

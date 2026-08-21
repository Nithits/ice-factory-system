import axios from 'axios';
import { getToken } from '../storage/auth';

export const api = axios.create({
  baseURL: 'http://172.20.10.5:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
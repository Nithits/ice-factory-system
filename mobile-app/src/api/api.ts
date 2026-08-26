import axios from 'axios';
import { getToken } from '../storage/auth';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://172.20.10.5:3000';

export const api = axios.create({
  baseURL: API_URL,
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
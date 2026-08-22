import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

export async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: AuthUser) {
  const value = JSON.stringify(user);

  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(USER_KEY, value);
}

export async function getUser(): Promise<AuthUser | null> {
  const value =
    Platform.OS === 'web'
      ? localStorage.getItem(USER_KEY)
      : await SecureStore.getItemAsync(USER_KEY);

  return value ? (JSON.parse(value) as AuthUser) : null;
}

export async function removeUser() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(USER_KEY);
}
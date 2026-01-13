// Auth0 OIDC authentication logic (initial scaffold)
import { createAuth0Client, Auth0Client } from '@auth0/auth0-spa-js';

let auth0: Auth0Client | null = null;

export async function initAuth() {
  auth0 = await createAuth0Client({
    domain: import.meta.env.VITE_AUTH0_DOMAIN!,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID!,
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  });
}

export async function login() {
  await auth0?.loginWithRedirect();
}

export async function logout() {
  auth0?.logout({ returnTo: window.location.origin });
}

export async function getUser() {
  return await auth0?.getUser();
}

export async function isAuthenticated() {
  return await auth0?.isAuthenticated();
}

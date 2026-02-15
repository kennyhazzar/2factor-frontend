"use client";

import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  Observable,
  from,
} from "@apollo/client/core";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:3001/graphql";

// Module-level token storage (memory + localStorage for persistence across refresh)
let accessToken: string | null = null;
let refreshToken: string | null = null;

const ACCESS_KEY = "2fa_access_token";
const REFRESH_KEY = "2fa_refresh_token";

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken() {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem(ACCESS_KEY);
  }
  return accessToken;
}

export function getRefreshToken() {
  if (!refreshToken && typeof window !== "undefined") {
    refreshToken = localStorage.getItem(REFRESH_KEY);
  }
  return refreshToken;
}

// Refresh tokens via raw fetch to avoid Apollo recursion
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation RefreshTokens($input: RefreshTokenInput) {
            refreshTokens(input: $input) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: { input: { refreshToken } },
      }),
    });

    const json = await response.json();
    const data = json?.data?.refreshTokens;

    if (data?.accessToken && data?.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

const authLink = new ApolloLink((operation, forward) => {
  if (accessToken) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
  return forward(operation);
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (!CombinedGraphQLErrors.is(error)) return;

  const hasUnauthError = error.errors.some(
    (e) => e.extensions?.code === "UNAUTHENTICATED"
  );

  if (!hasUnauthError) return;

  if (isRefreshing) {
    return new Observable((observer) => {
      pendingRequests.push(() => {
        forward(operation).subscribe(observer);
      });
    });
  }

  isRefreshing = true;

  return new Observable((observer) => {
    refreshAccessToken()
      .then((success) => {
        if (success) {
          pendingRequests.forEach((cb) => cb());
          pendingRequests = [];
          forward(operation).subscribe(observer);
        } else {
          clearTokens();
          observer.error(error);
        }
      })
      .catch(() => {
        clearTokens();
        observer.error(error);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});

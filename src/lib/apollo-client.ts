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

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getLocale(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "en";
}

// Refresh tokens via raw fetch to avoid Apollo recursion
async function refreshAccessToken(): Promise<boolean> {
  try {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        query: `
          mutation RefreshTokens {
            refreshTokens {
              csrfToken
            }
          }
        `,
      }),
    });

    const json = await response.json();
    return !!json?.data?.refreshTokens;
  } catch {
    return false;
  }
}

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  credentials: "include",
});

const headersLink = new ApolloLink((operation, forward) => {
  const headers: Record<string, string> = {
    "Accept-Language": getLocale(),
  };
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  operation.setContext({ headers });
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
          observer.error(error);
        }
      })
      .catch(() => {
        observer.error(error);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, headersLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
    query: { fetchPolicy: "network-only" },
  },
});

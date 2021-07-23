import { MatchHandler, router, Routes } from "https://crux.land/router@0.0.4";

class UnhandledRouteError extends Error {
  routes: Routes;
  request: Request;
  constructor(init: { request: Request; routes: Routes }) {
    const { request, routes } = init;

    const method = request.method;
    const reqPath = new URL(request.url).pathname;
    const routesNumber = Object.entries(routes).length;
    const routePlural = routesNumber === 1 ? "route" : "routes";

    // deno-fmt-ignore
    super(`${method} ${reqPath} (${routesNumber} ${routePlural} have handlers)`);

    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.routes = routes;
    this.request = request;
  }
}

type MockFetch = {
  fetch: typeof globalThis.fetch;
  mock: (route: string, handler: MatchHandler) => void;
  remove: (route: string) => void;
  reset: () => void;
};

/**
  * Create a stateful version of the global functions that do not contain
  * any global state.
  *
  * The returned object can be destructured.
  *
  * ```
  * const { fetch, mock, remove, reset } = sandbox()
  * ```
  */
export function sandbox(
  routeStore: Map<string, MatchHandler> = new Map(),
): MockFetch {
  return {
    mock: (route, handler) => routeStore.set(route, handler),
    remove: (route) => routeStore.delete(route),
    reset: () => routeStore.clear(),
    fetch: async (input, init) => {
      // Request constructor won't take a URL, so we need to normalize it first.
      if (input instanceof URL) input = input.toString();
      const req = new Request(input, init);

      const routes = Object.fromEntries(routeStore.entries());

      // The router needs to be constructed every time because the routes map is
      // very likely to change between fetches.
      return await router(
        routes,
        // If an unhandled route is fetched, throw an error.
        (request) => {
          throw new UnhandledRouteError({ request, routes });
        },
        // Errors thrown by a handler, including the unknown route handler, will
        // return a 500 Internal Server Error. That's the right behaviour in most
        // cases, but we actually *want* that to throw.
        (_, error) => {
          throw error;
        },
      )(req);
    },
  };
}

const globalMockFetch = sandbox();

/** This is the function that replaces `fetch` when you call `install()`. */
export const mockedFetch = globalMockFetch.fetch;

/**
 * Mock a new route, or override an existing handler.
 *
 * The route uses path-to-regexp syntax, with the additional extension of
 * (optional) method routing (prefix with METHOD@, eg. `POST@/user/:id`).
 *
 * The handler function can either be a function or an async function.
 *
 * ```
 * mock("GET@/users/:id", async (_req, match) => {
 *   const id = parseInt(match.params["id"]);
 *   const data = await magicallyGetMyUserData(id);
 *   return new Response(JSON.stringify(data));
 * })
 * ```
 */
export const mock = globalMockFetch.mock;

/** Remove an existing route handler. */
export const remove = globalMockFetch.remove;

/** Remove all existing route handlers. */
export const reset = globalMockFetch.reset;

// Store the original fetch so it can be restored later
const originalFetch = globalThis.fetch;

/**
 * Replace `window.fetch` with a mock that routes requests to a matching handler.
 *
 * To reset `window.fetch`, call `uninstall()`.
 */
export const install = () => {
  globalThis.fetch = mockedFetch;
};

/**
 * Restore `window.fetch` to what it was before `install()` was called.
 */
export const uninstall = () => {
  globalThis.fetch = originalFetch;
  reset();
};

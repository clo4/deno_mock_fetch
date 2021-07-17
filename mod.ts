import { MatchHandler, router } from "https://crux.land/router@0.0.3";

type Fetch = typeof globalThis.fetch;

const unmockedFetch = globalThis.fetch;

/** Global store of routes. */
const routeStore: Map<string, MatchHandler> = new Map();

/**
 * Replacement for `fetch` that implements the same interface, but mocks
 * requests using a store of routes and handlers.
 */
export async function mockedFetch(
  ...args: Parameters<Fetch>
): ReturnType<Fetch> {
  let [input, init] = args;
  if (input instanceof URL) input = input.toString();
  const routes = Object.fromEntries(routeStore.entries());
  const req = new Request(input, init);
  const res = router(routes, (req) => {
    const allRoutes = [...routeStore.keys()].join(", ");
    throw new Error(
      `Request not mocked: ${req.method} ${req.url}\n${allRoutes}`,
    );
  }, (_req, error) => {
    throw error;
  })(req);
  return await res;
}

/**
 * Replace `window.fetch` with mock that routes requests to a matching handler.
 *
 * To reset `window.fetch`, call `uninstall()`.
 */
export function install() {
  globalThis.fetch = mockedFetch;
}

/**
 * Restore `window.fetch` to what it was before `install()` was called.
 */
export function uninstall() {
  globalThis.fetch = unmockedFetch;
}

/**
 * Remove all mocked routes and handlers.
 */
export function reset() {
  routeStore.clear();
}

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
export function mock(route: string, handler: MatchHandler) {
  routeStore.set(route, handler);
}

/** Remove an existing route handler. */
export function remove(route: string) {
  routeStore.delete(route);
}

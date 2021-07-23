# deno_mock_fetch

An _extremely_ simple way to mock `window.fetch`.

[Read the documentation][docs], or see "Usage" below.

[docs]: https://doc.deno.land/https/deno.land/x/mock_fetch@0.2.0

## Usage

### 1. Setup

Import the library and install the mock. Any fetches after calling `install()`
will throw an error if you haven't explicitly added a mock for that route.

```typescript
import * as mf from "https://deno.land/x/mock_fetch@0.2.0/mod.ts";

// Replaces window.fetch with the mocked copy
mf.install();
```

<br>

### 2. Mocking routes

Call `mock` with a route (optionally starting with a method specifier, eg.
`DELETE@`) and a function (can be async). Whenever that route is fetched, the
function will be executed and the response will be returned.

The route uses [path-to-regexp], which allows you to use wildcard parameters.

[path-to-regexp]: https://github.com/pillarjs/path-to-regexp#parameters

```typescript
mf.mock("GET@/api/hello/:name", (_req, match) => {
  return new Response(`Hello, ${match.params["name"]}!`, {
    status: 200,
  });
});

const res = await fetch("https://localhost:1234/api/hello/SeparateRecords");
const text = await res.text(); //=> "Hello, SeparateRecords!"
```

<br>

### 3. Teardown

You can remove a single route's handler with `remove`, or reset all handlers
with `reset`. Once the handler has been removed, that route will go back to
throwing.

```typescript
mf.remove("GET@/api/hello/:name"); // OR: mf.reset()

await fetch("https://example.com/api/hello/world");
// UnhandledRouteError: GET /api/hello/world (0 routes have handlers)
```

To restore the original `fetch`, call `uninstall`.

```typescript
mf.uninstall();
```

<br>

## Advanced usage

You don't have to replace the global fetch, or even have global state, by using
the `sandbox` function. The returned object provides the same methods as the
module (minus install & uninstall). Calling these methods will not alter global
state.

```typescript
// Ky is an excellent and easy-to-use fetch wrapper.
import ky from "https://cdn.skypack.dev/ky?dts";

// This object can also be destructured.
const mockFetch = mf.sandbox();

// Create a ky instance that uses mocked fetch without ever touching the global
const myKy = ky.extend({
  fetch: mockFetch.fetch,
  // Using a prefix URL means you won't need to write the URL every time
  prefixUrl: "https://anyurlyouwant.com",
});

// Now you can mock the routes like normal
mockFetch.mock("PUT@/blog/posts", async (req) => {
  return new Response(/* ... */);
});

myKy.put("blog/posts", {
  /* ... */
});
```

You can destructure it, too.

<br>

## Credits

**[@eliassjogreen]**'s tiny router ([source][router]) does the bulk of the work.
It's general purpose, but works great for Deno Deploy.

[@eliassjogreen]: https://github.com/eliassjogreen
[router]: https://crux.land/router@0.0.4

# deno_mock_fetch

An _extremely_ simple way to mock `globalThis.fetch`.

[Read the documentation][docs], or see "Usage" below.

[docs]: https://doc.deno.land/https/deno.land/x/mock_fetch/mod.ts

## Usage

### 1. Setup

Import the library and install the mock. Any fetches after calling `install()`
will throw an error if you haven't explicitly added a mock for that route.

```typescript
import * as mf from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

// Replaces globalThis.fetch with the mocked copy
mf.install();
```

<br>

### 2. Mocking routes

Call `mock` with a route (optionally starting with a method specifier, eg.
`DELETE@`) and a function (can be async). Whenever that route is fetched, the
function will be executed and the response will be returned.

The route uses [URLPattern], which allows you to match patterns and wildcards.

**Only the path name will be used to match a handler**, so you can use literally
anything for the host when fetching.

[URLPattern]: https://github.com/WICG/urlpattern/blob/main/explainer.md#web-apis

```typescript
mf.mock("GET@/api/hello/:name", (_req, params) => {
  return new Response(`Hello, ${params["name"]}!`, {
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
mf.remove("GET@/api/hello/:name");
// OR: mf.reset()

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

// Make a ky instance that uses mocked fetch - never touching the global fetch.
// Using a prefix URL means you won't need to write the URL every time.
const myKy = ky.extend({
  fetch: mockFetch.fetch,
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

```typescript
const { fetch, mock, remove, reset} = mf.sandbox();
```

<br>

## Credits

**[@eliassjogreen]**'s tiny router ([source][router]) does the bulk of the work.
It's general-purpose, but works great for Deno Deploy.

[@eliassjogreen]: https://github.com/eliassjogreen
[router]: https://crux.land/router@0.0.5

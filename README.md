# deno_mock_fetch

An _extremely_ simple `window.fetch` mock for Deno.

## Usage

Import the library and install the mock. Any fetches after calling `install()`
will throw an error if you haven't mocked the route.

```typescript
import * as mf from "https://deno.land/x/mock_fetch@0.1.0/mod.ts";

// Replaces window.fetch with the mocked copy
mf.install();
```

Call `mock` with a route (optionally starting with a method specifier, eg.
`DELETE@`) and a function (can be async). Whenever that route is fetched, the
function will be executed and the response will be returned.

```typescript
mf.mock("GET@/api/hello/:name", (_req, match) => {
  return new Response(`Hello, ${match.params["name"]}!`, {
    status: 200,
  });
});

const res = await fetch("https://localhost:1234/api/hello/SeparateRecords");
const text = await res.text(); //=> "Hello, SeparateRecords!"
```

You can remove all routes by calling `reset()`.

```typescript
mf.reset();
// now, /api/hello/:name will throw again
```

And when you want to restore the un-mocked fetch, call `uninstall()`.

```typescript
mf.uninstall();
```

Of course, you don't have to replace the global `fetch` function, you can access
the mocked fetch directly via `mockedFetch`.

```typescript
import ky from "https://cdn.skypack.dev/ky?dts";

const mockedKy = ky.extend({
  fetch: mf.mockedFetch,
});
```

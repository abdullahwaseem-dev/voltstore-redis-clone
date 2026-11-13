# Contributing to VoltStore

VoltStore is a small TypeScript project for exploring RESP, TCP connections, and in-memory storage. Focused bug reports, documentation fixes, and test contributions are welcome.

## Set up locally

Use a maintained Node.js release compatible with the package's declared engine range.

```sh
git clone https://github.com/abdullahwaseem-dev/voltstore-redis-clone.git
cd voltstore-redis-clone
npm ci
npm run typecheck
npm run build
```

Start the backend with `npm start`, or use `npm run dev` while editing. See the README for the supported commands and local ports. The browser dashboard is a separate simulation; testing it does not test the TCP server.

## Report a bug

Include:

- Your Node.js version and operating system.
- The exact command sequence or input bytes needed to reproduce the issue.
- Expected and actual responses.
- Whether the issue affects the TCP backend, HTTP stats endpoint, or browser simulation.

Use synthetic data and remove credentials from logs. Report a suspected security vulnerability privately to [maw112266@gmail.com](mailto:maw112266@gmail.com), rather than publishing exploit details in an issue.

## Propose a change

Discuss substantial protocol or architecture changes in an issue first. For a small fix, open a focused pull request explaining the problem, the change, and how you verified it.

Before submitting:

1. Run `npm run typecheck` and `npm run build`.
2. Reproduce the affected behaviour before and after your change.
3. Update documentation when behaviour changes.
4. Include regression tests where the project has suitable test infrastructure, or describe the missing coverage explicitly.

There is currently no automated test script in `package.json`. A successful build is not a passing functional test suite.

## Useful starting points

- Add a test harness and parser cases for fragmented and malformed RESP frames.
- Test command arity, error responses, and TTL expiry.
- Improve documentation of the supported Redis command subset.
- Improve dashboard accessibility while keeping simulated metrics clearly labelled.

Do not present simulated dashboard metrics as backend benchmarks. Keep unsupported features and unverified compatibility explicit.

Contributions are subject to the repository's [MIT license](LICENSE).

# PLAN.md – Integration Test Refactor Plan

## Goal

Refactor test/integration/ to improve clarity, isolate rate-limited APIs, and enable mocking support.

## Key Rules

- Do not remove or alter any existing real API tests.
- Real API tests must never be included in the default `npm test` run.
- Avoid introducing new config files unless required.
- Keep environment variable logic isolated to the test runner or setup files.
- Ensure new tests follow clear naming and placement conventions.

---

## Phase 1: Introduce Mocking Support

1. **Add `test/integration/mock/` directory**
   - Place all mock-based tests here.
   - These are safe to run in every CI push or PR.

2. **Define environment variable**
   - Use `TEST_API_MODE=mock` (for mock-based tests) or `TEST_API_MODE=real` (for real API tests)
   - Avoid booleans; use string-based values for clarity and extensibility.

3. **Create client switcher**
   - Use a module like `github/client/index.js` to export either the real or mock client based on the mode.
   - This isolates all environment branching to one place.
   - Implement default fallback for safety: `const mode = process.env.TEST_API_MODE || 'mock'`

4. **Update test runner config (if needed)**
   - Load appropriate test files depending on the mode.
   - Do not bake `TEST_API_MODE` logic into individual test files.

---

## Phase 2: Add Mock Tests Gradually

1. **Start with GitHub model API (rate-limited)**
   - Move test logic to a new mock-based test file.
   - Add mock response using a tool like `nock`.
   - Example:

     ```javascript
     const nock = require('nock');
     
     // Mock GitHub API response
     nock('https://api.github.com')
       .get('/repos/owner/repo/issues/123')
       .reply(200, {
         id: 123,
         title: 'Test issue',
         body: 'This is a test issue body',
         labels: []
       });
     ```

2. **Keep real API test as-is**
   - Mark with `.real.js` or place in `test/integration/real/`.

3. **Add new mock test to regular `npm test`**
   - This allows fast, safe test cycles for development and CI.

4. **Repeat for other endpoints**
   - Add mocks one by one, expanding mock coverage over time.

---

## Phase 3: Real API Tests

1. **Retain real API tests in a dedicated location**
   - For example: `test/integration/real/`

2. **Run these only on main merge or manual trigger**
   - Avoid running them in regular development CI flow.
   - Example GitHub Actions configuration:
     
     ```yaml
     jobs:
       real-api-tests:
         if: github.ref == 'refs/heads/main' && env.TEST_API_MODE == 'real'
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v3
           - name: Run real API tests
             run: npm run test:integration:real
             env:
               TEST_API_MODE: real
     ```

3. **Ensure these tests use `TEST_API_MODE=real`**
   - Confirm that no logic inside them depends on default test mode behavior.

---

## Optional: Add Record Mode (Later)

- Consider a `TEST_API_MODE=record` mode to auto-capture real responses and store them for later use.
- Useful if mocking is too costly or if coverage is hard to write manually.
- Benefits include reduced manual effort in creating mock data, more realistic test scenarios, improved test coverage, and easier maintenance as API changes can be re-recorded rather than manually updated.
- Recommended libraries:
  - nock's recording feature: `nock.recorder.rec()`
  - @pollyjs/core for more advanced recording and replay features
  - node-vcr for simple HTTP recording

# JS Selenium E2E Automation Example

This project contains a small test suite written in JS using Selenium, and Mocha.

The suite includes:

- A positive login flow
- A negative login flow
- A small functional flow for adding and removing elements

The tests use a simple Arrange → Act → Assert structure, and all page interactions are grouped inside POM classes to keep things clean and easy to maintain. The framework also uses explicit waits, basic error handling, and light console logging to make the tests stable and easy to follow.

## How to run

Install dependencies:

```
npm install
```

Run the tests (defaults to Chrome, non‑headless):

```
npm test
```

Choose a browser:

```
Chrome:
npm test -- --browser chrome

Firefox:
npm test -- --browser firefox

Edge:
npm test -- --browser edge

Safari:
npm test -- --browser safari
```

Run in headless mode:

```
npm test -- --headless
```

## Run a specific test with --grep

You can now run an individual test (or a group of tests) by matching part of the test name:

```
npm test -- --grep "login successfully"
```

This will execute only tests whose names contain the provided substring.  
Case‑insensitive, and works across all test files.

Examples:

```
Run only the positive login test:
npm test -- --grep "login successfully"

Run only the negative login test:
npm test -- --grep "invalid credentials"

Run only the add/remove test:
npm test -- --grep "add and remove"
```

If no test matches the pattern, the runner prints an error and exits.

You can also combine options:

```
npm test -- --browser chrome --headless
```

## Project structure

```
pages/        # Page Objects
tests/        # Test files
helpers/      # Parallel runner
constants.js  # Shared constants
```

The test runner supports parallel execution and prefixes each worker’s output so logs remain easy to follow even when multiple tests run at the same time.

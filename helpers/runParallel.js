/**
 * Parallel Mocha Test Runner
 *
 * Features:
 *  - Discovers all test files from glob patterns.
 *  - Extracts individual test names from each file.
 *  - Supports running a single test or subset of tests using --grep "substring".
 *  - Spawns a dedicated Node process per test for full isolation.
 *  - Caps concurrency to CPU count or --jobs N.
 *  - Handles per-worker prefixed log output.
 *  - Applies browser validation early for safety.
 *
 * Why this exists:
 *  Mocha’s native parallel mode is limited and does not support parallelizing
 *  at the individual test level. This custom runner gives deterministic,
 *  isolated execution and allows running *exactly one test* via argument-level
 *  filtering, without modifying code (no .only needed).
 */

// forces Node to reload the file fresh on every invocation, so the browser detection is correct
delete require.cache[__filename];

const { ParallelConstants, Browsers } = require('../constants.js');

const { spawn } = require(ParallelConstants.MODULES.CHILD_PROCESS);
const os = require(ParallelConstants.MODULES.OS);
const glob = require(ParallelConstants.MODULES.GLOB);
const fs = require(ParallelConstants.MODULES.FS);

// extract browser argument globally so it's usable everywhere in the file
const browserArgIndex = process.argv.indexOf('--browser');
const browser =
  browserArgIndex !== -1
    ? process.argv[browserArgIndex + 1]?.toLowerCase()
    : null;

// !! validate browser before running anything !!
if (browser) {
  const valid = Object.values(Browsers);

  if (!valid.includes(browser)) {
    console.error(
      `[ParallelRunner] ERROR: Unsupported browser "${browser}". Valid options: ${valid.join(
        ', '
      )}`
    );
    process.exit(1);
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}][ParallelRunner] ${message}`);
}

/**
 * Parse CLI arguments.
 *
 * Splits input args into:
 *  - testFiles: glob patterns before the first flag
 *  - extraArgs: anything after the first flag (passed to mocha workers)
 *  - jobs: optional max worker count (via --jobs N)
 *  - grepPattern: substring used to filter individual test names
 *
 * Example:
 *   npm test -- --grep "login" --headless --jobs 3
 */
function parseArgs(argv) {
  const testFiles = [];
  const extraArgs = [];
  let foundFlag = false;
  let jobs = null;
  let grepPattern = null;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    /*
    SAFEGUARD
    prevent "headless" without -- from being treated as a file pattern
    */
    if (!arg.startsWith('--') && arg.toLowerCase().includes('headless')) {
      console.error(
        `[ParallelRunner] ERROR: Invalid flag "${arg}". Use "--headless" instead.`
      );
      process.exit(1);
    }
    if (arg === '--grep') {
      foundFlag = true;
      if (i + 1 >= argv.length) {
        console.error(
          `[ParallelRunner] ERROR: --grep requires a test name substring (e.g. --grep "login successfully")`
        );
        process.exit(1);
      }
      grepPattern = argv[i + 1];
      i++;
      continue;
    }
    if (!foundFlag && arg.startsWith(ParallelConstants.ARG_FLAG_PREFIX)) {
      foundFlag = true;
    }
    if (foundFlag) {
      extraArgs.push(arg);
      if (arg === '--jobs' && i + 1 < argv.length) {
        const val = Number(argv[i + 1]);
        if (!isNaN(val) && val > 0) {
          jobs = val;
          i++; // skip next arg since it's the jobs number
        }
      }
    } else {
      testFiles.push(arg);
    }
  }
  log(
    `Parsed arguments - testFiles: ${JSON.stringify(
      testFiles
    )}, extraArgs: ${JSON.stringify(
      extraArgs
    )}, jobs: ${jobs}, grep: ${JSON.stringify(grepPattern)}`
  );
  return { testFiles, extraArgs, jobs, grepPattern };
}

// reads a test file and extracts all test case names from it (looking for it(...) calls)
function extractTestsFromFile(file) {
  const content = fs.readFileSync(file, ParallelConstants.UTF8_ENCODING);
  const regex = ParallelConstants.TEST_NAME_REGEX;
  const tests = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    tests.push(match[1]);
  }
  return tests;
}

async function runTestsInParallel(testFiles, extraArgs, jobs, grepPattern) {
  // expand glob patterns to actual files
  const resolvedFiles = testFiles.flatMap((pattern) => glob.sync(pattern));
  log(`Discovered ${resolvedFiles.length} test files`);

  // gather all individual test cases with their file names
  const tests = [];
  for (const file of resolvedFiles) {
    const testNames = extractTestsFromFile(file);
    for (const name of testNames) {
      tests.push({ file, name });
    }
  }
  log(`Discovered ${tests.length} test cases`);

  let filteredTests = tests;
  if (grepPattern) {
    const pattern = grepPattern.toLowerCase();
    filteredTests = tests.filter((t) => t.name.toLowerCase().includes(pattern));
    if (filteredTests.length === 0) {
      log(
        `No tests matched --grep pattern "${grepPattern}". Exiting with failure.`
      );
      process.exitCode = 1;
      return;
    }
    log(
      `Filtered tests with pattern "${grepPattern}". Remaining tests: ${filteredTests.length}`
    );
  }

  // limit concurrency to number of CPU cores or number of tests, whichever is smaller, considering jobs flag
  const numCores = os.cpus().length;
  let maxWorkers;

  if (browser === Browsers.SAFARI) {
    console.log(
      `[${new Date().toISOString()}][ParallelRunner] Safari detected — forcing single-thread execution (SafariDriver limitation)`
    );
    maxWorkers = 1;
  } else {
    if (jobs && jobs > 0) {
      maxWorkers = Math.min(filteredTests.length, jobs);
    } else {
      maxWorkers = Math.min(filteredTests.length, numCores);
    }
  }

  log(
    `Detected ${numCores} cores, total tests: ${filteredTests.length}, max workers: ${maxWorkers}`
  );

  let running = 0;
  let index = 0;
  let exitCodes = [];

  return new Promise((resolve) => {
    // WOKER POOL: spawn new test runners until all tests are done
    function runNext() {
      if (index >= filteredTests.length && running === 0) {
        // tests finished -> set exit code if any failed
        if (exitCodes.some((code) => code !== 0)) {
          process.exitCode = 1;
        }
        const passed = exitCodes.filter((code) => code === 0).length;
        const failed = exitCodes.filter((code) => code !== 0).length;
        log(`All tests completed. Passed: ${passed}, Failed: ${failed}`);
        resolve();
        return;
      }

      while (running < maxWorkers && index < filteredTests.length) {
        const test = filteredTests[index];
        const workerLabel = `[Worker-${index}]`;
        index++;
        running++;
        log(`Running test: ${test.name} from ${test.file}`);

        /*
         * Spawn a dedicated mocha process for this specific test:
         *   mocha <file> --grep "<this test name>"
         *
         * This ensures:
         *   - True process-level isolation (no shared state between tests)
         *   - Ability to run tests in parallel safely
         *   - Compatibility with our --grep filtering at runner level
         *
         * The parent runner already applied global grep filtering,
         * but each worker applies a precise per-test grep so that only
         * the single intended test executes inside that mocha process.
         */
        const args = [
          require.resolve('mocha/bin/_mocha'),
          test.file,
          '--timeout',
          ParallelConstants.MOCHA_TIMEOUT.toString(),
          '--grep',
          test.name,
          ...extraArgs,
        ];
        const child = spawn(process.execPath, args, {
          stdio: [
            ParallelConstants.STDIO_CONST.IGNORE,
            ParallelConstants.STDIO_CONST.PIPE,
          ],
        });

        // Prefix stdout lines with worker label
        child.stdout.setEncoding(ParallelConstants.UTF8_ENCODING);
        child.stdout.on('data', (data) => {
          data.split(ParallelConstants.NEWLINE_SPLIT_REGEX).forEach((line) => {
            if (line.trim() !== '') {
              console.log(`${workerLabel} ${line}`);
            }
          });
        });

        // Prefix stderr lines with worker label
        child.stderr.setEncoding(ParallelConstants.UTF8_ENCODING);
        child.stderr.on('data', (data) => {
          data.split(ParallelConstants.NEWLINE_SPLIT_REGEX).forEach((line) => {
            if (line.trim() !== '') {
              console.error(`${workerLabel} ${line}`);
            }
          });
        });

        child.on('exit', (code) => {
          exitCodes.push(code);
          log(
            `Test finished: ${test.name} from ${test.file} with exit code ${code}`
          );
          running--;
          runNext();
        });

        child.on('error', () => {
          exitCodes.push(1);
          log(
            `Test finished: ${test.name} from ${test.file} with exit code 1 (error)`
          );
          running--;
          runNext();
        });
      }
    }
    runNext();
  });
}

const { testFiles, extraArgs, jobs, grepPattern } = parseArgs(process.argv);
runTestsInParallel(testFiles, extraArgs, jobs, grepPattern);

module.exports = runTestsInParallel;

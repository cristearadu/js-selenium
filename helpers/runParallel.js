/**
 * Small helper to run mocha tests in parallel across cores;
 * Spawns a process per test name (--grep) so everything runs isolated.
 * Keeps workers capped at CPU count.
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

// parses command line args into test file patterns, extra Mocha args (anything after a --flag), and jobs count
function parseArgs(argv) {
  const testFiles = [];
  const extraArgs = [];
  let foundFlag = false;
  let jobs = null;

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
    )}, extraArgs: ${JSON.stringify(extraArgs)}, jobs: ${jobs}`
  );
  return { testFiles, extraArgs, jobs };
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

async function runTestsInParallel(testFiles, extraArgs, jobs) {
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

  // limit concurrency to number of CPU cores or number of tests, whichever is smaller, considering jobs flag
  const numCores = os.cpus().length;
  let maxWorkers;

  if (browser === Browsers.SAFARI) {
    console.log(
      `[${new Date().toISOString()}][ParallelRunner] Safari detected — forcing single-thread execution (SafariDriver limitation)`
    );
    maxWorkers = 1;
  } else {
    maxWorkers = Math.min(tests.length, numCores);
  }

  log(
    `Detected ${numCores} cores, total tests: ${tests.length}, max workers: ${maxWorkers}`
  );

  let running = 0;
  let index = 0;
  let exitCodes = [];

  return new Promise((resolve) => {
    // WOKER POOL: spawn new test runners until all tests are done
    function runNext() {
      if (index >= tests.length && running === 0) {
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

      while (running < maxWorkers && index < tests.length) {
        const test = tests[index];
        const workerLabel = `[Worker-${index}]`;
        index++;
        running++;
        log(`Running test: ${test.name} from ${test.file}`);

        /*
        Spawn a new Node process running mocha with --grep to run only this test
        Why? Isolates tests and allows parallel execution
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

const { testFiles, extraArgs, jobs } = parseArgs(process.argv);
runTestsInParallel(testFiles, extraArgs, jobs);

module.exports = runTestsInParallel;

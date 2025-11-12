/**
 * Small helper to run mocha tests in parallel across cores;
 * Spawns a process per test name (--grep) so everything runs isolated.
 * Keeps workers capped at CPU count.
 */

const { ParallelConstants } = require('../constants.js');

const { spawn } = require(ParallelConstants.MODULES.CHILD_PROCESS);
const os = require(ParallelConstants.MODULES.OS);
const glob = require(ParallelConstants.MODULES.GLOB);
const fs = require(ParallelConstants.MODULES.FS);

// Parses command line args into test file patterns and extra Mocha args (anything after a --flag)
function parseArgs(argv) {
  const testFiles = [];
  const extraArgs = [];
  let foundFlag = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!foundFlag && arg.startsWith(ParallelConstants.ARG_FLAG_PREFIX)) {
      foundFlag = true;
    }
    if (foundFlag) {
      extraArgs.push(arg);
    } else {
      testFiles.push(arg);
    }
  }
  return { testFiles, extraArgs };
}

// Reads a test file and extracts all test case names from it (looking for it(...) calls)
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

async function runTestsInParallel(testFiles, extraArgs) {
  // Expand glob patterns to actual files
  const resolvedFiles = testFiles.flatMap((pattern) => glob.sync(pattern));

  // Gather all individual test cases with their file names
  const tests = [];
  for (const file of resolvedFiles) {
    const testNames = extractTestsFromFile(file);
    for (const name of testNames) {
      tests.push({ file, name });
    }
  }

  // Limit concurrency to number of CPU cores or number of tests, whichever is smaller
  const numCores = os.cpus().length;
  const maxWorkers = Math.min(tests.length, numCores);

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
        resolve();
        return;
      }

      while (running < maxWorkers && index < tests.length) {
        const test = tests[index++];
        running++;

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
          stdio: ParallelConstants.STDIO_MODE,
        });

        child.on('exit', (code) => {
          exitCodes.push(code);
          running--;
          runNext();
        });

        child.on('error', () => {
          exitCodes.push(1);
          running--;
          runNext();
        });
      }
    }
    runNext();
  });
}

const { testFiles, extraArgs } = parseArgs(process.argv);
runTestsInParallel(testFiles, extraArgs);

module.exports = runTestsInParallel;

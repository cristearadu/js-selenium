const ParallelConstants = {
  TEST_NAME_REGEX: /(?:^|\s)it\(['"`](.*?)['"`],/g,
  MOCHA_TIMEOUT: 10000,
  UTF8_ENCODING: 'utf8',
  STDIO_MODE: 'inherit',
  ARG_FLAG_PREFIX: '--',
  MODULES: {
    CHILD_PROCESS: 'child_process',
    OS: 'os',
    GLOB: 'glob',
    FS: 'fs',
  },
  DEFAULT_BROWSER: 'chrome',
  IMPLICIT_TIMEOUT: 5000,
  PAGELOAD_TIMEOUT: 10000,
  SCRIPT_TIMEOUT: 5000,
  WINDOW_SIZE: '--window-size=1280,800',
  DEFAULT_WAIT: 5000,
};

module.exports = { ParallelConstants };

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
  STDIO_CONST: {
    IGNORE: 'ignore',
    PIPE: 'pipe',
  },
  NEWLINE_SPLIT_REGEX: /\r?\n/,
};

const BasePageConstants = {
  DEFAULT_BROWSER: 'chrome',
  IMPLICIT_TIMEOUT: 5000,
  PAGELOAD_TIMEOUT: 10000,
  SCRIPT_TIMEOUT: 5000,
  WINDOW_SIZE: '--window-size=1280,800',
  DEFAULT_WAIT: 5000,
};

const LoginTestConstants = {
  VALID_USERNAME: 'tomsmith',
  VALID_PASSWORD: 'SuperSecretPassword!',
  INVALID_USERNAME: 'invalidUser',
  INVALID_PASSWORD: 'wrongPassword',
  SUCCESS_MESSAGE: 'You logged into a secure area!',
  ERROR_MESSAGE: 'Your username is invalid!',
};

const Browsers = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  EDGE: 'edge',
  SAFARI: 'safari',
};

module.exports = {
  ParallelConstants,
  BasePageConstants,
  LoginTestConstants,
  Browsers,
};

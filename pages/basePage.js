const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const {
  ParallelConstants,
  BasePageConstants,
  Browsers,
} = require('../constants.js');

class BasePage {
  /**
   * Instance of BasePage & WebDriver init for the specified browser.
   * If no browser is passed, tries to read from command line args (--browser) -> defaults to Chrome.
   * Supports headless mode (--headless=no disables headless).
   * @param {string} [browser] - Browser name ('chrome', 'firefox', 'edge', 'safari')
   */
  constructor(browser) {
    const timestamp = new Date().toISOString();
    // determines browser from CLI args if not provided
    if (!browser) {
      const browserArgIndex = process.argv.indexOf('--browser');
      switch (true) {
        case browserArgIndex !== -1 &&
          process.argv.length > browserArgIndex + 1:
          browser = process.argv[browserArgIndex + 1].toLowerCase();
          break;
        default:
          browser = BasePageConstants.DEFAULT_BROWSER; // default browser
          break;
      }
    }

    // determine if headless mode should be enabled (default true unless --headless=no)
    const isHeadless = !process.argv.includes('--headless=no');
    console.log(
      `[${timestamp}][BasePage] Initializing WebDriver for browser: ${browser} (headless=${isHeadless})`
    );
    const options = this.getBrowserOptions(browser, isHeadless);

    const driverBuilders = {
      [Browsers.CHROME]: () =>
        new Builder().forBrowser('chrome').setChromeOptions(options).build(),

      [Browsers.EDGE]: () =>
        new Builder()
          .forBrowser('MicrosoftEdge')
          .setEdgeOptions(options)
          .build(),

      [Browsers.FIREFOX]: () =>
        new Builder().forBrowser('firefox').setFirefoxOptions(options).build(),

      [Browsers.SAFARI]: () => new Builder().forBrowser('safari').build(),
    };

    if (!driverBuilders[browser]) {
      /*
      SAFEGUARD
      If somehow the code misbehaves or runParallel is bypassed,
      the worker will cleanly exit.
      */
      console.error(`[${timestamp}][BasePage] Unsupported browser: ${browser}`);
      process.exit(1);
    }

    this.driver = driverBuilders[browser]();

    this.driver.manage().setTimeouts({
      implicit: BasePageConstants.IMPLICIT_TIMEOUT,
      pageLoad: BasePageConstants.PAGELOAD_TIMEOUT,
      script: BasePageConstants.SCRIPT_TIMEOUT,
    });
    console.log(
      `[${new Date().toISOString()}][BasePage] WebDriver for ${browser} initialized successfully`
    );
  }

  static create(browser = BasePageConstants.DEFAULT_BROWSER) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}][BasePage] Creating new BasePage instance for browser: ${browser}`
    );
    return new BasePage(browser);
  }

  async open(url) {
    console.log(
      `[${new Date().toISOString()}][BasePage] Navigating to: ${url}`
    );
    try {
      await this.driver.get(url);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}][BasePage] Error navigating to ${url}:`,
        error
      );
    }
  }

  async find(locator) {
    try {
      await this.driver.wait(
        until.elementLocated(locator),
        ParallelConstants.DEFAULT_WAIT
      );
      const element = await this.driver.findElement(locator);
      console.log(
        `[${new Date().toISOString()}][BasePage] Element found for locator ${locator}`
      );
      return element;
    } catch (error) {
      console.warn(
        `[${new Date().toISOString()}][BasePage] Warning: Element not found for locator ${locator}:`,
        error
      );
      return null;
    }
  }

  async findAll(locator) {
    try {
      await this.driver.wait(
        until.elementsLocated(locator),
        BasePageConstants.DEFAULT_WAIT
      );
      const elements = await this.driver.findElements(locator);
      console.log(
        `[${new Date().toISOString()}][BasePage] Found ${
          elements.length
        } elements for locator ${locator}`
      );
      return elements;
    } catch (error) {
      console.warn(
        `[${new Date().toISOString()}][BasePage] Warning: Elements not found for locator ${locator}:`,
        error
      );
      return [];
    }
  }

  async quit() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][BasePage] Attempting to quit WebDriver...`);
    try {
      await this.driver.quit();
      console.log(
        `[${new Date().toISOString()}][BasePage] WebDriver quit successfully`
      );
    } catch (error) {
      console.warn(
        `[${new Date().toISOString()}][BasePage] Warning: Error quitting driver:`,
        error
      );
    }
  }

  /**
   * Returns browser-specific options configured for headless mode and window size.
   * @param {string} browser - Browser name.
   * @param {boolean} isHeadless - Whether to enable headless mode.
   * @returns {object|null} Browser options instance or null for unsupported browsers.
   */
  getBrowserOptions(browser, isHeadless) {
    const timestamp = new Date().toISOString();
    const commonArgs = [BasePageConstants.WINDOW_SIZE];

    switch (browser) {
      case 'chrome': {
        const options = new chrome.Options();
        if (isHeadless) {
          options.addArguments('--headless');
          options.addArguments('--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments(...commonArgs);
        console.log(
          `[${timestamp}][BasePage] Chrome options created (headless=${isHeadless})`
        );
        return options;
      }

      case 'edge': {
        const options = new edge.Options();
        if (isHeadless) {
          options.addArguments('--headless');
          options.addArguments('--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments(...commonArgs);
        console.log(
          `[${timestamp}][BasePage] Edge options created (headless=${isHeadless})`
        );
        return options;
      }

      case 'firefox': {
        const options = new firefox.Options();
        if (isHeadless) {
          options.addArguments('-headless');
        }
        // Firefox requires separate width and height args ..
        options.addArguments('-width=1280', '-height=800');
        console.log(
          `[${timestamp}][BasePage] Firefox options created (headless=${isHeadless})`
        );
        return options;
      }

      case 'safari':
        // Safari doesn't support headless mode or options in this context
        console.log(
          `[${timestamp}][BasePage] Safari does not use options/headless mode`
        );
        return null;

      default:
        throw new Error(`Unsupported browser: ${browser}`);
    }
  }
}

module.exports = { BasePage, By };

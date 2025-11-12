const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const { ParallelConstants } = require('../constants.js');

class BasePage {
  /**
   * Instance of BasePage & WebDriver init for the specified browser.
   * If no browser is passed, tries to read from command line args (--browser) -> defaults to Chrome.
   * Supports headless mode (--headless=no disables headless).
   * @param {string} [browser] - Browser name ('chrome', 'firefox', 'edge', 'safari')
   */
  constructor(browser) {
    // determines browser from CLI args if not provided
    if (!browser) {
      const browserArgIndex = process.argv.indexOf('--browser');
      switch (true) {
        case browserArgIndex !== -1 &&
          process.argv.length > browserArgIndex + 1:
          browser = process.argv[browserArgIndex + 1].toLowerCase();
          break;
        default:
          browser = ParallelConstants.DEFAULT_BROWSER; // default browser
          break;
      }
    }

    // determine if headless mode should be enabled (default true unless --headless=no)
    const isHeadless = !process.argv.includes('--headless=no');
    const options = this.getBrowserOptions(browser, isHeadless);

    switch (browser) {
      case 'chrome':
        this.driver = new Builder()
          .forBrowser('chrome')
          .setChromeOptions(options)
          .build();
        break;
      case 'edge':
        this.driver = new Builder()
          .forBrowser('MicrosoftEdge')
          .setEdgeOptions(options)
          .build();
        break;
      case 'firefox':
        this.driver = new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(options)
          .build();
        break;
      case 'safari':
        // Safari does not support options like headless mode
        this.driver = new Builder().forBrowser('safari').build();
        break;
      default:
        throw new Error(`Unsupported browser: ${browser}`);
    }

    this.driver.manage().setTimeouts({
      implicit: ParallelConstants.IMPLICIT_TIMEOUT,
      pageLoad: ParallelConstants.PAGELOAD_TIMEOUT,
      script: ParallelConstants.SCRIPT_TIMEOUT,
    });
  }

  static create(browser = ParallelConstants.DEFAULT_BROWSER) {
    return new BasePage(browser);
  }

  async open(url) {
    await this.driver.get(url);
  }

  async find(locator) {
    await this.driver.wait(
      until.elementLocated(locator),
      ParallelConstants.DEFAULT_WAIT
    );
    return this.driver.findElement(locator);
  }

  async findAll(locator) {
    await this.driver.wait(
      until.elementsLocated(locator),
      ParallelConstants.DEFAULT_WAIT
    );
    return this.driver.findElements(locator);
  }

  async quit() {
    await this.driver.quit();
  }

  /**
   * Returns browser-specific options configured for headless mode and window size.
   * @param {string} browser - Browser name.
   * @param {boolean} isHeadless - Whether to enable headless mode.
   * @returns {object|null} Browser options instance or null for unsupported browsers.
   */
  getBrowserOptions(browser, isHeadless) {
    const commonArgs = [ParallelConstants.WINDOW_SIZE];

    switch (browser) {
      case 'chrome': {
        const options = new chrome.Options();
        if (isHeadless) {
          options.addArguments('--headless');
          options.addArguments('--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments(...commonArgs);
        return options;
      }

      case 'edge': {
        const options = new edge.Options();
        if (isHeadless) {
          options.addArguments('--headless');
          options.addArguments('--no-sandbox', '--disable-dev-shm-usage');
        }
        options.addArguments(...commonArgs);
        return options;
      }

      case 'firefox': {
        const options = new firefox.Options();
        if (isHeadless) {
          options.addArguments('-headless');
        }
        // irefox requires separate width and height args ..
        options.addArguments('-width=1280', '-height=800');
        return options;
      }

      case 'safari':
        // Safari doesn't support headless mode or options in this context
        return null;

      default:
        throw new Error(`Unsupported browser: ${browser}`);
    }
  }
}

module.exports = { BasePage, By };

const { Browser } = require('selenium-webdriver');
const { BasePageConstants } = require('../constants');
const { BasePage, By } = require('./basePage');

class LoginPage extends BasePage {
  constructor() {
    super(undefined);
    this.browser = super.browser;
    this.url = 'https://the-internet.herokuapp.com/login';
    this.usernameInput = By.id('username');
    this.passwordInput = By.id('password');
    this.loginButton = By.xpath('//form[@id="login"]//button[@type="submit"]'); // safari does not support css button:submit
    this.flashMessage = By.id('flash');
  }

  async openLoginPage() {
    console.log(
      `[${new Date().toISOString()}][LoginPage] Starting navigation to login page`
    );
    await this.open(this.url);
    console.log(
      `[${new Date().toISOString()}][LoginPage] Finished navigation to login page`
    );
  }

  async login(username, password) {
    console.log(`[${new Date().toISOString()}][LoginPage] Typing username`);
    const userEl = await this.find(this.usernameInput);
    await userEl.sendKeys(username);

    console.log(`[${new Date().toISOString()}][LoginPage] Typing password`);
    const passEl = await this.find(this.passwordInput);
    await passEl.sendKeys(password);

    console.log(
      `[${new Date().toISOString()}][LoginPage] Clicking login button`
    );
    const button = await this.find(this.loginButton);
    await this.safeClick(button);
  }

  async getFlashText() {
    console.log(
      `[${new Date().toISOString()}][LoginPage] Fetching flash message`
    );
    const message = await this.find(this.flashMessage);
    const text = await message.getText();
    console.log(
      `[${new Date().toISOString()}][LoginPage] Retrieved flash message: ${text}`
    );
    return text;
  }
}

module.exports = LoginPage;

const { BasePage, By } = require('./basePage');

class LoginPage extends BasePage {
  constructor() {
    super();
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
    await (await this.find(this.usernameInput)).sendKeys(username);
    console.log(`[${new Date().toISOString()}][LoginPage] Typing password`);
    await (await this.find(this.passwordInput)).sendKeys(password);
    console.log(
      `[${new Date().toISOString()}][LoginPage] Clicking login button`
    );

    const button = await this.find(this.loginButton);

    if (this.browser === 'safari') {
      console.log(
        `[${new Date().toISOString()}][LoginPage] Using JS click for Safari`
      );
      await this.driver.executeScript('arguments[0].click();', button);
    } else {
      await button.click();
    }
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

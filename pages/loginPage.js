const { BasePage, By } = require('./basePage');

class LoginPage extends BasePage {
  constructor() {
    super();
    this.url = 'https://the-internet.herokuapp.com/login';
    this.usernameInput = By.id('username');
    this.passwordInput = By.id('password');
    this.loginButton = By.css('button.radius');
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
    await (await this.find(this.loginButton)).click();
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

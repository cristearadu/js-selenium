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
    await this.open(this.url);
  }

  async login(username, password) {
    await (await this.find(this.usernameInput)).sendKeys(username);
    await (await this.find(this.passwordInput)).sendKeys(password);
    await (await this.find(this.loginButton)).click();
  }

  async getFlashText() {
    const message = await this.find(this.flashMessage);
    return await message.getText();
  }
}

module.exports = LoginPage;

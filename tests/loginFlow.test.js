const { expect } = require('chai');
const LoginPage = require('../pages/loginPage');

describe('Login Tests', function () {
  let page;

  beforeEach(async function () {
    page = new LoginPage();
    await page.openLoginPage();
  });

  afterEach(async function () {
    await page.quit();
  });

  it('should login successfully with valid credentials', async function () {
    await page.login('tomsmith', 'SuperSecretPassword!');
    const message = await page.getFlashText();
    expect(message).to.include('You logged into a secure area!');
  });

  it('should show error with invalid credentials', async function () {
    await page.login('invalidUser', 'wrongPassword');
    const message = await page.getFlashText();
    expect(message).to.include('Your username is invalid!');
  });
});

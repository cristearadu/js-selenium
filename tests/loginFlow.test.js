const { expect } = require('chai');
const LoginPage = require('../pages/loginPage');
const { LoginTestConstants } = require('../constants.js');

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
    await page.login(
      LoginTestConstants.VALID_USERNAME,
      LoginTestConstants.VALID_PASSWORD
    );
    const message = await page.getFlashText();
    expect(message).to.include(LoginTestConstants.SUCCESS_MESSAGE);
  });

  it('should show error with invalid credentials', async function () {
    await page.login(
      LoginTestConstants.INVALID_USERNAME,
      LoginTestConstants.INVALID_PASSWORD
    );
    const message = await page.getFlashText();
    expect(message).to.include(LoginTestConstants.ERROR_MESSAGE);
  });
});

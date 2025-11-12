const { expect } = require('chai');
const LoginPage = require('../pages/loginPage');
const { LoginTestConstants } = require('../constants.js');

describe('Login Tests', function () {
  let page;

  beforeEach(async function () {
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Starting test setup`
    );
    page = new LoginPage();
    await page.openLoginPage();
  });

  afterEach(async function () {
    await page.quit();
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Finished test cleanup`
    );
  });

  it('should login successfully with valid credentials', async function () {
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Attempting login with valid credentials`
    );
    await page.login(
      LoginTestConstants.VALID_USERNAME,
      LoginTestConstants.VALID_PASSWORD
    );
    const message = await page.getFlashText();
    expect(message).to.include(LoginTestConstants.SUCCESS_MESSAGE);
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Verified success message`
    );
  });

  it('should show error with invalid credentials', async function () {
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Attempting login with invalid credentials`
    );
    await page.login(
      LoginTestConstants.INVALID_USERNAME,
      LoginTestConstants.INVALID_PASSWORD
    );
    const message = await page.getFlashText();
    expect(message).to.include(LoginTestConstants.ERROR_MESSAGE);
    console.log(
      `[${new Date().toISOString()}][LoginFlowTest] Verified error message`
    );
  });
});

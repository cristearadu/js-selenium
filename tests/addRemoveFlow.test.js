const { expect } = require('chai');
const AddRemovePage = require('../pages/addRemovePage');

describe('Add/Remove Elements Tests', function () {
  let page;

  beforeEach(async function () {
    page = new AddRemovePage();
    await page.openAddRemovePage();
  });

  afterEach(async function () {
    await page.quit();
  });

  it('should add and remove elements correctly', async function () {
    console.log(
      `[${new Date().toISOString()}][AddRemoveFlowTest] Starting to add elements`
    );
    await page.addElements(2);
    let count = await page.getElementsCount();
    expect(count).to.equal(2);
    console.log(
      `[${new Date().toISOString()}][AddRemoveFlowTest] Verified count equals 2`
    );

    console.log(
      `[${new Date().toISOString()}][AddRemoveFlowTest] Starting to remove an element`
    );
    await page.removeElement();
    count = await page.getElementsCount();
    expect(count).to.equal(1);
    console.log(
      `[${new Date().toISOString()}][AddRemoveFlowTest] Verified final count equals 1`
    );
  });
});

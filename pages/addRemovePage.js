const { BasePage, By } = require('./basePage');

class AddRemovePage extends BasePage {
  constructor() {
    super(undefined);
    this.browser = super.browser;
    this.url = 'https://the-internet.herokuapp.com/add_remove_elements/';
    this.addButton = By.css('button[onclick="addElement()"]');
    this.deleteButton = By.css('.added-manually');
  }

  async openAddRemovePage() {
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Navigating to Add/Remove Elements page`
    );
    await this.open(this.url);
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Navigation complete`
    );
  }

  async addElements(count = 1) {
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Adding ${count} element(s)`
    );
    const addBtn = await this.find(this.addButton);
    for (let i = 0; i < count; i++) {
      await this.safeClick(addBtn);
      console.log(
        `[${new Date().toISOString()}][AddRemovePage] Added element ${i + 1}`
      );
    }
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Finished adding elements`
    );
  }

  async getElementsCount() {
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Counting delete elements`
    );
    const elements = await this.findAll(this.deleteButton);
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Found ${
        elements.length
      } element(s)`
    );
    return elements.length;
  }

  async removeElement() {
    console.log(
      `[${new Date().toISOString()}][AddRemovePage] Removing one element`
    );
    const deleteBtn = await this.find(this.deleteButton);
    await this.safeClick(deleteBtn);
    console.log(`[${new Date().toISOString()}][AddRemovePage] Element removed`);
  }
}

module.exports = AddRemovePage;

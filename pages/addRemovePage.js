const { BasePage, By } = require('./basePage');

class AddRemovePage extends BasePage {
  constructor() {
    super();
    this.url = 'https://the-internet.herokuapp.com/add_remove_elements/';
    this.addButton = By.css('button[onclick="addElement()"]');
    this.deleteButton = By.css('.added-manually');
  }

  async openAddRemovePage() {
    await this.open(this.url);
  }

  async addElements(count = 1) {
    const addBtn = await this.find(this.addButton);
    for (let i = 0; i < count; i++) {
      await addBtn.click();
    }
  }

  async getElementsCount() {
    const elements = await this.findAll(this.deleteButton);
    return elements.length;
  }

  async removeElement() {
    const deleteBtn = await this.find(this.deleteButton);
    await deleteBtn.click();
  }
}

module.exports = AddRemovePage;

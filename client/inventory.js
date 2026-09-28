class InventoryManager {
  constructor() {
    this.items = new Map();
    this.maxSlots = 20;
  }

  addItem(itemId, itemType, quantity = 1, metadata = {}) {
    if (!this.items.has(itemId)) {
      this.items.set(itemId, {
        id: itemId,
        type: itemType,
        quantity,
        metadata
      });
    } else {
      const item = this.items.get(itemId);
      item.quantity += quantity;
    }
    return this.items.get(itemId);
  }

  removeItem(itemId, quantity = 1) {
    if (!this.items.has(itemId)) return null;
    const item = this.items.get(itemId);
    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.items.delete(itemId);
      return null;
    }
    return item;
  }

  hasItem(itemId) {
    return this.items.has(itemId);
  }

  getItem(itemId) {
    return this.items.get(itemId);
  }

  getAllItems() {
    return Array.from(this.items.values());
  }

  getItemCount() {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }
}

window.InventoryManager = InventoryManager;

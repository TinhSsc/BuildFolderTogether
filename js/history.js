// history.js - Undo / Redo functionality
window.TreeApp = window.TreeApp || {};

window.TreeApp.history = {
  pushHistory() {
    const state = window.TreeApp.state;
    state.undoStack.push(JSON.stringify(state.tree));
    if (state.undoStack.length > 50) state.undoStack.shift();
    state.redoStack = [];
  },

  mutate(fn) {
    this.pushHistory();
    fn();
    window.TreeApp.render.renderTree();
    window.TreeApp.storage.save();
    window.TreeApp.room.broadcastTreeChange();
  },

  undo() {
    const state = window.TreeApp.state;
    if (state.undoStack.length === 0) { 
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('undo_empty')); 
      return; 
    }
    state.redoStack.push(JSON.stringify(state.tree));
    state.tree = JSON.parse(state.undoStack.pop());
    state.selectedIds.clear();
    window.TreeApp.render.renderTree();
    window.TreeApp.storage.save();
    window.TreeApp.room.broadcastTreeChange();
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('undo_done'));
  },

  redo() {
    const state = window.TreeApp.state;
    if (state.redoStack.length === 0) { 
      window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('redo_empty')); 
      return; 
    }
    state.undoStack.push(JSON.stringify(state.tree));
    state.tree = JSON.parse(state.redoStack.pop());
    state.selectedIds.clear();
    window.TreeApp.render.renderTree();
    window.TreeApp.storage.save();
    window.TreeApp.room.broadcastTreeChange();
    window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('redo_done'));
  }
};

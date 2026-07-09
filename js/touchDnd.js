// touchDnd.js - Touch-based drag and drop for mobile devices
window.TreeApp = window.TreeApp || {};

window.TreeApp.touchDnd = (function () {
  let draggingId = null;
  let ghost = null;
  let lastTargetRow = null;

  function createGhost(row) {
    const g = document.createElement('div');
    g.id = 'touch-dnd-ghost';
    g.style.cssText = [
      'position:fixed', 'z-index:9999', 'pointer-events:none',
      'background:#dbeafe', 'border:2px dashed #6366f1', 'border-radius:6px',
      'padding:6px 12px', 'font-size:14px', 'font-family:inherit',
      'color:#1e40af', 'white-space:nowrap', 'opacity:0.9',
      'max-width:220px', 'overflow:hidden', 'text-overflow:ellipsis',
      'box-shadow:0 4px 12px rgba(99,102,241,0.25)'
    ].join(';');
    const nameInput = row.querySelector('.name-input');
    const icon = row.querySelector('.icon');
    g.textContent = (icon ? icon.textContent : '') + ' ' + (nameInput ? nameInput.value : '');
    document.body.appendChild(g);
    return g;
  }

  function getRowAtPoint(x, y) {
    if (ghost) ghost.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (ghost) ghost.style.display = '';
    if (!el) return null;
    return el.closest('[data-id]');
  }

  function clearTargetHighlight() {
    if (lastTargetRow) { lastTargetRow.classList.remove('drag-over'); lastTargetRow = null; }
  }

  function onHandleTouchStart(e, nodeId) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    draggingId = nodeId;
    const row = e.currentTarget.closest('[data-id]');
    if (!row) return;
    ghost = createGhost(row);
    const touch = e.touches[0];
    ghost.style.left = (touch.clientX + 12) + 'px';
    ghost.style.top = (touch.clientY - 20) + 'px';
  }

  function onTouchMove(e) {
    if (!draggingId || !ghost) return;
    e.preventDefault();
    const touch = e.touches[0];
    ghost.style.left = (touch.clientX + 12) + 'px';
    ghost.style.top = (touch.clientY - 20) + 'px';
    clearTargetHighlight();
    const targetRow = getRowAtPoint(touch.clientX, touch.clientY);
    if (targetRow && targetRow.dataset.id && targetRow.dataset.id !== draggingId) {
      targetRow.classList.add('drag-over');
      lastTargetRow = targetRow;
    }
  }

  function findNode(tree, id) {
    for (const n of tree) {
      if (n.id === id) return n;
      if (n.children) { const found = findNode(n.children, id); if (found) return found; }
    }
    return null;
  }

  function onTouchEnd(e) {
    if (!draggingId) return;
    if (ghost) { ghost.remove(); ghost = null; }

    let targetId = null;
    if (lastTargetRow) {
      targetId = lastTargetRow.dataset.id || null;
      clearTargetHighlight();
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const targetRow = getRowAtPoint(touch.clientX, touch.clientY);
      if (targetRow && targetRow.dataset.id && targetRow.dataset.id !== draggingId) {
        targetId = targetRow.dataset.id;
      }
    }

    const savedId = draggingId;
    draggingId = null;

    if (targetId) {
      const state = window.TreeApp.state;
      const treeLogic = window.TreeApp.treeLogic;
      const history = window.TreeApp.history;
      const targetNode = findNode(state.tree, targetId);
      const destinationId = (targetNode && targetNode.type === 'folder') ? targetId : null;
      history.mutate(() => treeLogic.moveNode(savedId, destinationId));
    }
  }

  function init() {
    const treeEl = document.getElementById('tree');
    if (!treeEl) return;
    treeEl.addEventListener('touchmove', onTouchMove, { passive: false });
    treeEl.addEventListener('touchend', onTouchEnd, { passive: true });
    treeEl.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  return {
    init,
    attachHandle(handleEl, nodeId) {
      handleEl.addEventListener('touchstart', (e) => onHandleTouchStart(e, nodeId), { passive: false });
    }
  };
})();

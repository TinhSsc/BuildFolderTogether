// zip.js - Text and ZIP export/import logic
window.TreeApp = window.TreeApp || {};

window.TreeApp.zipLogic = {
  buildTextTree(nodes, prefix) {
    let lines = [];
    nodes.forEach((node, i) => {
      const isLast = i === nodes.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      lines.push(prefix + connector + node.name + (node.type === 'folder' ? '/' : ''));
      if (node.type === 'folder' && node.children.length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        lines = lines.concat(this.buildTextTree(node.children, childPrefix));
      }
    });
    return lines;
  },

  addToZip(zipFolder, nodes) {
    nodes.forEach(node => {
      if (node.type === 'folder') {
        const sub = zipFolder.folder(node.name);
        this.addToZip(sub, node.children);
      } else if (node.type === 'gitkeep') {
        zipFolder.file(node.name, node.note || '');
      } else {
        zipFolder.file(node.name, '');
      }
    });
  },

  parseTextTree(text) {
    const rawLines = text.split('\n').map(l => l.replace(/\t/g, '    ').replace(/\r$/, ''));
    const lines = rawLines.filter(l => l.trim() !== '');

    // Pass 1: parse each line into { depth, name }
    const items = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip the root dot marker
      if (trimmed === '.' || trimmed === './' || trimmed === '') continue;

      let rest = line;
      let depth = 0;
      while (true) {
        if (rest.startsWith('│   '))      { rest = rest.slice(4); depth++; continue; }
        if (rest.startsWith('|   '))      { rest = rest.slice(4); depth++; continue; }
        if (rest.startsWith('    '))      { rest = rest.slice(4); depth++; continue; }
        if (rest.startsWith('│ '))        { rest = rest.slice(2); continue; } // thin variant
        if (rest.startsWith('├── '))      { rest = rest.slice(4); break; }
        if (rest.startsWith('└── '))      { rest = rest.slice(4); break; }
        if (rest.startsWith('├─ '))       { rest = rest.slice(3); break; }
        if (rest.startsWith('└─ '))       { rest = rest.slice(3); break; }
        if (rest.startsWith('|-- '))      { rest = rest.slice(4); break; }
        if (rest.startsWith('`-- '))      { rest = rest.slice(4); break; }
        break;
      }
      let name = rest.trim();
      // Strip trailing slash (we'll detect folder status by children)
      const forcedFolder = name.endsWith('/');
      if (forcedFolder) name = name.slice(0, -1);
      // Extract inline comment (e.g. ".gitkeep # purpose") - save as note for gitkeep
      let inlineNote = '';
      const commentMatch = name.match(/^(.+?)\s+#\s+(.+)$/);
      if (commentMatch) {
        name = commentMatch[1].trim();
        inlineNote = commentMatch[2].trim();
      }
      if (!name) continue;

      items.push({ depth, name, forcedFolder, inlineNote });
    }

    // Pass 2: build tree — a node is a folder if the NEXT item has depth > current depth
    const root = [];
    const stack = []; // { depth, node }

    for (let i = 0; i < items.length; i++) {
      const { depth, name, forcedFolder, inlineNote } = items[i];
      const nextDepth = i + 1 < items.length ? items[i + 1].depth : -1;
      // Dot-rule: if no children follow, decide by name
      // Has a dot (and not starts with dot only) → file; no dot → folder
      const hasChildren = nextDepth > depth;
      const hasDot = name.includes('.') && name !== '.';
      const isFolder = forcedFolder || hasChildren || (!hasDot);

      const node = {
        id: window.TreeApp.utils.uid(),
        name,
        type: name === '.gitkeep' ? 'gitkeep' : (isFolder ? 'folder' : 'file')
      };
      if (isFolder) node.children = [];
      if (node.type === 'gitkeep') node.note = inlineNote || '';

      // Pop stack until we find the correct parent depth
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();

      if (stack.length === 0) root.push(node);
      else stack[stack.length - 1].node.children.push(node);

      if (isFolder) stack.push({ depth, node });
    }

    return root;
  },



  async buildTreeFromZip(zip) {
    const root = [];
    const folderMap = new Map();
    folderMap.set('', root);

    function ensureFolder(path) {
      if (path === '') return root;
      if (folderMap.has(path)) return folderMap.get(path);
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');
      const parentChildren = ensureFolder(parentPath);
      const node = { id: window.TreeApp.utils.uid(), name, type: 'folder', children: [] };
      parentChildren.push(node);
      folderMap.set(path, node.children);
      return node.children;
    }

    const gitkeepReads = [];

    zip.forEach((relPath, zipEntry) => {
      if (relPath.startsWith('__MACOSX') || relPath.endsWith('.DS_Store')) return;
      const cleanPath = relPath.replace(/\/$/, '');
      if (zipEntry.dir) {
        ensureFolder(cleanPath);
      } else {
        const parts = cleanPath.split('/');
        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        const parentChildren = ensureFolder(parentPath);
        if (fileName === '.gitkeep') {
          const node = { id: window.TreeApp.utils.uid(), name: fileName, type: 'gitkeep', note: '' };
          parentChildren.push(node);
          gitkeepReads.push(zipEntry.async('string').then(text => { node.note = text; }));
        } else {
          parentChildren.push({ id: window.TreeApp.utils.uid(), name: fileName, type: 'file' });
        }
      }
    });

    await Promise.all(gitkeepReads);
    return root;
  },

  async exportZip() {
    if (typeof JSZip === 'undefined') { window.TreeApp.utils.showStatus(window.TreeApp.i18n.t('zip_no_lib')); return; }
    const zip = new JSZip();
    this.addToZip(zip, window.TreeApp.state.tree);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-structure.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

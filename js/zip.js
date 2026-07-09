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
    const root = [];
    const stack = []; // { depth, node }

    lines.forEach(line => {
      let rest = line;
      let depth = 0;
      while (true) {
        if (rest.startsWith('│   ')) { rest = rest.slice(4); depth++; continue; }
        if (rest.startsWith('    ')) { rest = rest.slice(4); depth++; continue; }
        if (rest.startsWith('├── ')) { rest = rest.slice(4); depth++; break; }
        if (rest.startsWith('└── ')) { rest = rest.slice(4); depth++; break; }
        break;
      }
      let name = rest.trim();
      if (!name) return;
      const isFolder = name.endsWith('/');
      if (isFolder) name = name.slice(0, -1);
      const node = { id: window.TreeApp.utils.uid(), name, type: isFolder ? 'folder' : (name === '.gitkeep' ? 'gitkeep' : 'file') };
      if (isFolder) node.children = [];
      if (node.type === 'gitkeep') node.note = '';

      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();

      if (stack.length === 0) root.push(node);
      else stack[stack.length - 1].node.children.push(node);

      if (isFolder) stack.push({ depth, node });
    });

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

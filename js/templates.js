// templates.js - Predefined project structures
window.TreeApp = window.TreeApp || {};

window.TreeApp.templates = [
  {
    id: 'react-vite',
    name: 'React (Vite)',
    icon: 'bxl-react',
    color: '#61dafb',
    description: 'Modern React SPA structure using Vite.',
    tree: [
      { id: "t1_1", name: "public", type: "folder", children: [{ id: "t1_2", name: "vite.svg", type: "file" }] },
      { id: "t1_3", name: "src", type: "folder", children: [
        { id: "t1_4", name: "assets", type: "folder", children: [{ id: "t1_5", name: "react.svg", type: "file" }] },
        { id: "t1_6", name: "components", type: "folder", children: [{ id: "t1_7", name: "Button.jsx", type: "file" }] },
        { id: "t1_8", name: "App.css", type: "file" },
        { id: "t1_9", name: "App.jsx", type: "file" },
        { id: "t1_10", name: "index.css", type: "file" },
        { id: "t1_11", name: "main.jsx", type: "file" }
      ]},
      { id: "t1_12", name: ".gitignore", type: "file" },
      { id: "t1_13", name: "index.html", type: "file" },
      { id: "t1_14", name: "package.json", type: "file" },
      { id: "t1_15", name: "vite.config.js", type: "file" }
    ]
  },
  {
    id: 'nextjs',
    name: 'Next.js (App Router)',
    icon: 'bxl-react',
    color: '#000000',
    description: 'Next.js full-stack app with App Router architecture.',
    tree: [
      { id: "t2_1", name: "app", type: "folder", children: [
        { id: "t2_2", name: "api", type: "folder", children: [{ id: "t2_3", name: "route.ts", type: "file" }] },
        { id: "t2_4", name: "favicon.ico", type: "file" },
        { id: "t2_5", name: "globals.css", type: "file" },
        { id: "t2_6", name: "layout.tsx", type: "file" },
        { id: "t2_7", name: "page.tsx", type: "file" }
      ]},
      { id: "t2_8", name: "components", type: "folder", children: [{ id: "t2_9", name: ".gitkeep", type: "gitkeep" }] },
      { id: "t2_10", name: "lib", type: "folder", children: [{ id: "t2_11", name: "utils.ts", type: "file" }] },
      { id: "t2_12", name: "public", type: "folder", children: [{ id: "t2_13", name: "next.svg", type: "file" }] },
      { id: "t2_14", name: ".gitignore", type: "file" },
      { id: "t2_15", name: "next.config.js", type: "file" },
      { id: "t2_16", name: "package.json", type: "file" },
      { id: "t2_17", name: "tsconfig.json", type: "file" }
    ]
  },
  {
    id: 'express',
    name: 'Express.js API',
    icon: 'bxl-nodejs',
    color: '#339933',
    description: 'Standard MVC architecture for Node.js Express.',
    tree: [
      { id: "t3_1", name: "src", type: "folder", children: [
        { id: "t3_2", name: "controllers", type: "folder", children: [{ id: "t3_3", name: "userController.js", type: "file" }] },
        { id: "t3_4", name: "models", type: "folder", children: [{ id: "t3_5", name: "User.js", type: "file" }] },
        { id: "t3_6", name: "routes", type: "folder", children: [{ id: "t3_7", name: "userRoutes.js", type: "file" }] },
        { id: "t3_8", name: "middleware", type: "folder", children: [{ id: "t3_9", name: "auth.js", type: "file" }] },
        { id: "t3_10", name: "config", type: "folder", children: [{ id: "t3_11", name: "db.js", type: "file" }] },
        { id: "t3_12", name: "index.js", type: "file" }
      ]},
      { id: "t3_13", name: ".env", type: "file" },
      { id: "t3_14", name: ".gitignore", type: "file" },
      { id: "t3_15", name: "package.json", type: "file" }
    ]
  }
];

window.TreeApp.templates.applyTemplate = function(templateId) {
  const tpl = this.find(t => t.id === templateId);
  if (!tpl) return;
  // Deep clone tree
  const newTree = JSON.parse(JSON.stringify(tpl.tree));
  
  // Ask for confirmation if tree is not empty
  if (window.TreeApp.state.tree.length > 0) {
    if (!confirm('This will replace your current structure. Continue?')) return;
  }
  
  window.TreeApp.history.mutate(() => {
    window.TreeApp.state.tree = newTree;
  });
};

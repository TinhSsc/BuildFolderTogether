# BuildFolderTogether

<!-- Banner can be placed here if available -->

## Badges
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

<!-- Screenshot can be placed here if available -->

## Demo
Live Demo: [https://buildfoldertogether.com](https://buildfoldertogether.com)

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Usage](#usage)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Import Format Specification](#import-format-specification)
- [Export Format Specification](#export-format-specification)
- [ZIP Specification](#zip-specification)
- [.gitkeep Specification](#gitkeep-specification)
- [Room Synchronization](#room-synchronization)
- [Data Structure](#data-structure)
- [Module APIs](#module-apis)
- [Event Flow](#event-flow)
- [Browser Compatibility](#browser-compatibility)
- [Performance](#performance)
- [Security](#security)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Introduction
**BuildFolderTogether** is an online collaborative folder structure generator for developers. It helps you design project architectures, mock file systems, share your design blueprints with teammates in real-time, and automatically export them to ZIP files or ASCII trees.

## Features

### Tree Management
Manage deeply nested directory trees without limits. Easily add, edit, or delete nodes (folders/files).

### Drag & Drop
Seamless drag and drop support for moving files and folders between different directories.

### Search
Real-time search functionality that automatically highlights files/folders matching your keywords.

### Clipboard
Support for cutting, copying, and pasting multiple files/folders at the same time.

### Undo/Redo
A powerful history system that lets you undo or redo mistakes instantly.

### Import
Paste an ASCII tree structure text directly to automatically generate the file tree representation.

### Export
Export the current directory tree into a clean ASCII tree format, ready to be embedded into your README files.

### ZIP
Compress the entire directory structure into a real `.zip` archive for download.

### .gitkeep Notes
Automatically inserts a `.gitkeep` file into empty folders during ZIP export, ensuring Git tracks those directories properly.

### Room Collaboration
Create a "Room" allowing multiple users to join and work on a single project simultaneously.

### WebRTC
Utilizes peer-to-peer WebRTC and WebSockets (via PeerJS) for real-time data synchronization between clients without requiring a complex backend.

## Architecture

### Folder Structure
The project applies Clean Architecture principles, clearly separating UI (CSS), Logic (JS Modules), and Configuration.

### Module
Features are divided into independent modules (e.g. `tree.js`, `history.js`, `room.js`) nested under the global `window.TreeApp` namespace.

### Data Flow
User Action -> JS Event Handling -> State Update -> Render Call -> UI Update.

### State
All application data is centralized within `window.TreeApp.state`.

### Storage
Automatically saves state changes to browser `localStorage` after every action, preventing data loss on page reloads.

## Project Structure
```text
project/
├── index.html
├── css/
│   ├── style.css
│   ├── layout.css
│   ├── tree.css
│   └── context-menu.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── render.js
│   ├── tree.js
│   ├── storage.js
│   ├── history.js
│   ├── search.js
│   ├── room.js
│   ├── zip.js
│   ├── contextMenu.js
│   ├── utils.js
│   └── lang/
│       ├── i18n.js
│       ├── vi.js
│       └── en.js
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── data/
│   └── templates/
├── libs/
│   └── jszip.min.js
└── README.md
```

## Installation
No complex library installations are required. The project uses vanilla HTML/CSS/JS and a single external library `jszip.min.js` (included).

1. Clone the repository: `git clone https://github.com/yourusername/BuildFolderTogether.git`
2. Open the project folder.

## Running the Project
Simply open `index.html` directly in your browser or use Live Server in VS Code:
```bash
npx http-server project/
```

## Usage

### Create Folder
Click `New Folder` on the toolbar or right-click to select `New Subfolder`.

### Create File
Click `New File` on the toolbar or right-click to select `New Subfile`.

### Rename
Double-click a file/folder name (or press `F2`, or right-click and select `Rename`) to edit the name.

### Delete
Select a file/folder and press the `Delete` key, or right-click and select `Delete`.

### Search
Type keywords into the search box on the toolbar.

### Context Menu
Right-click on any tree element to open the context menu.

### Keyboard Shortcut
Use standard shortcuts like `Ctrl+C`, `Ctrl+V`, `Ctrl+Z` for quick actions.

### ZIP
Click the `Download ZIP` button.

### Import Text
Click `Import Text`, paste your ASCII tree structure, and confirm.

### Export Text
Click `Export Text` to generate a plain-text ASCII tree.

### Room
Enter a `Room ID` to create a new room or join your colleague's room.

### WebRTC
Share a link containing `?room=ID` with others. WebRTC will automatically connect the browsers.

## Keyboard Shortcuts
- `Ctrl + C` / `Cmd + C`: Copy
- `Ctrl + X` / `Cmd + X`: Cut
- `Ctrl + V` / `Cmd + V`: Paste
- `Ctrl + D` / `Cmd + D`: Duplicate
- `Ctrl + Z` / `Cmd + Z`: Undo
- `Ctrl + Y` / `Cmd + Y`: Redo
- `Delete` / `Backspace`: Delete Node
- `F2`: Rename

## Import Format Specification
The system accepts plain text representing a tree structure using ASCII/Unicode box-drawing characters like `├──`, `└──`, `│`, or simply spaces for indentation.

## Export Format Specification
Exported files use standard UTF-8 box-drawing characters, resulting in a clean and readable structure:
```text
project/
├── src/
│   └── index.js
└── README.md
```

## ZIP Specification
Powered by `JSZip`. The system maps the entire logical structure into a ZIP file archive, creating empty text files for file nodes and respective directories.

## .gitkeep Specification
The ZIP module traverses the entire tree. Any folder node without child file nodes will automatically have an empty `.gitkeep` file inserted to prevent Git from ignoring empty directories.

## Room Synchronization
Every local state mutation (Add, Edit, Delete, Drag/Drop) is broadcast to all peers in the Room via WebRTC connections (using a PeerJS wrapper).

## Data Structure
The tree is represented by a nested array of objects.
Each Node follows this structure:
```json
{
  "id": "node-12345",
  "name": "index.js",
  "type": "file",
  "children": []
}
```

## Module APIs
- `window.TreeApp.tree`: Exposes `addNode`, `deleteNode`, `moveNode`.
- `window.TreeApp.history`: Exposes `saveState`, `undo`, `redo`.
- `window.TreeApp.storage`: `load`, `save`.
- `window.TreeApp.zip`: `exportToZip`.
- `window.TreeApp.render`: `renderTree`, `renderNode`.

## Event Flow
`UI Click` -> `window.TreeApp.tree.*` -> `window.TreeApp.history.saveState()` -> `window.TreeApp.storage.save()` -> `window.TreeApp.room.broadcast()` -> `window.TreeApp.render.renderTree()`.

## Browser Compatibility
Fully supports modern web browsers:
- Google Chrome 80+
- Mozilla Firefox 75+
- Apple Safari 13+
- Microsoft Edge 80+

## Performance
DOM operations are highly optimized, avoiding full tree re-renders unless necessary for large structural changes. All processing happens on the Client-side, resulting in millisecond response times. The tree supports thousands of nodes without lag.

## Security
- P2P Data Exchange: Data shared across Rooms is transmitted via encrypted peer-to-peer connections and never stored on a centralized server.
- No Backend: 100% Client-side.
- Sanitized Input: Prevent XSS when importing text.

## Roadmap
- [ ] Add Dark Mode.
- [ ] Support predefined Templates (React, Vue, Clean Architecture).
- [ ] Allow color coding for specific file types.
- [ ] Export files to JSON and XML formats.

## FAQ
**Q: Does this tool store my project code/data?**
A: No! BuildFolderTogether runs entirely within your browser (Client-side). Your data is only stored in your machine's LocalStorage and exchanged peer-to-peer.

**Q: Why can't I download the ZIP file on Safari?**
A: Ensure Safari is not blocking popups or restricting file download permissions.

## Contributing
All contributions (Pull Requests, Issues) are welcome!
1. Fork the project.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License
Distributed under the MIT License. See `LICENSE` for details.

## Acknowledgements
- [JSZip](https://stuk.github.io/jszip/) - Client-side ZIP generation library.
- [PeerJS](https://peerjs.com/) - Simple WebRTC data connection wrapper.

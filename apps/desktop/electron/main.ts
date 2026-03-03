import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({ width: 1440, height: 900, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  const url = process.env.VITE_DEV_SERVER_URL;
  if (url) win.loadURL(url);
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

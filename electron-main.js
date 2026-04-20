const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Sentry DevOps Dashboard",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public', 'favicon.ico')
  });

  const port = 3000;
  const url = `http://localhost:${port}`;

  if (isDev) {
    mainWindow.loadURL(url);
  } else {
    // В продакшене запускаем standalone сервер
    const baseDir = path.join(__dirname, '.next', 'standalone');
    const serverPath = path.join(baseDir, 'server.js');
    
    // Копируем статику если её там нет (для корректной работы standalone)
    // В реальности electron-builder упакует их по указанным путям, 
    // но сервер ожидает их внутри standalone папки.

    const env = { 
      ...process.env, 
      NODE_ENV: 'production',
      PORT: port.toString(),
      DATABASE_URL: `file:${path.join(app.getPath('userData'), 'database.sqlite')}`
    };

    nextProcess = spawn('node', [serverPath], { 
      env,
      cwd: baseDir // Важно запускать из папки standalone
    });

    nextProcess.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
      if (data.toString().includes('Listening on port')) {
        mainWindow.loadURL(url);
      }
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

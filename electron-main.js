const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextProcess;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    console.log('Initializing database...');
    // В продакшене мы копируем пустую базу или сидированную из ресурсов приложения
    // В данном случае мы можем использовать prisma/dev.db как шаблон, если он упакован
    const templateDbPath = isDev 
      ? path.join(__dirname, 'prisma', 'dev.db')
      : path.join(process.resourcesPath, 'prisma', 'dev.db');

    try {
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, dbPath);
        console.log('Database template copied to:', dbPath);
      } else {
        console.error('Database template not found at:', templateDbPath);
      }
    } catch (err) {
      console.error('Failed to copy database:', err);
    }
  }
  return dbPath;
}

function createWindow() {
  const dbPath = initDatabase();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Forge DevOps Dashboard",
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
    const baseDir = path.join(__dirname, '.next', 'standalone');
    const serverPath = path.join(baseDir, 'server.js');
    
    // В standalone режиме Next.js ожидает public и static в определенных местах
    // Мы должны убедиться, что они там есть или прокинуть пути

    const env = { 
      ...process.env, 
      NODE_ENV: 'production',
      PORT: port.toString(),
      DATABASE_URL: `file:${dbPath}`
    };

    nextProcess = spawn('node', [serverPath], { 
      env,
      cwd: baseDir
    });

    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Next.js: ${output}`);
      if (output.includes('Listening on port') || output.includes('started server on')) {
        mainWindow.loadURL(url);
      }
    });

    nextProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });
    
    // Если через 10 секунд не загрузилось, пробуем принудительно
    setTimeout(() => {
      if (mainWindow && !mainWindow.webContents.getURL()) {
        mainWindow.loadURL(url);
      }
    }, 10000);
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

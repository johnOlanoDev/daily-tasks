const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const Store = require("electron-store").default;
const sound = require("sound-play");

const store = new Store();
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 360,
    height: 520,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// Guardar y obtener tareas
ipcMain.handle("getTasks", () => store.get("tasks", []));
ipcMain.handle("saveTasks", (event, tasks) => store.set("tasks", tasks));

// Notificaciones y sonido (sin cambios)
ipcMain.on("show-notification", async (event, task) => {
  new Notification({
    title: "⏰ Tarea pendiente",
    body: `${task.hora} - ${task.nombre}`,
  }).show();

  let audioPath;

  if (isDev) {
    audioPath = path.join(__dirname, "sirena.wav");
  } else {
    audioPath = path.join(process.resourcesPath, "sirena.wav");
  }

  try {
    await sound.play(audioPath);
  } catch (err) {
    console.error("Error reproduciendo sonido:", err);
  }
});

app.whenReady().then(createWindow);

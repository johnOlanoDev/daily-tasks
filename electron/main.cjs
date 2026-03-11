const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const Store = require("electron-store").default;
const sound = require("sound-play"); // <-- nuevo

const store = new Store();

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

  win.loadURL("http://localhost:5173");
}

// Guardar y obtener tareas
ipcMain.handle("getTasks", () => store.get("tasks", []));
ipcMain.handle("saveTasks", (event, tasks) => store.set("tasks", tasks));

// Mostrar notificación y reproducir sonido
ipcMain.on("show-notification", async (event, task) => {
  new Notification({
    title: "⏰ Tarea pendiente",
    body: `${task.hora} - ${task.nombre}`,
  }).show();

  const audioPath = path.join(__dirname, "sirena.wav");

  try {
    await sound.play(audioPath); // reproduce el audio
  } catch (err) {
    console.error("Error reproduciendo sonido:", err);
  }
});

app.whenReady().then(createWindow);

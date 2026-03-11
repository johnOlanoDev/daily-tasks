const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getTasks: () => ipcRenderer.invoke("getTasks"),
  saveTasks: (tasks) => ipcRenderer.invoke("saveTasks", tasks),
  notify: (task) => ipcRenderer.send("show-notification", task),
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("closeReadApi", {
  analyze: (payload) => ipcRenderer.invoke("close-read:analyze", payload),
});

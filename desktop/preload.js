import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("closeReadApi", {
  analyze: (payload) => ipcRenderer.invoke("close-read:analyze", payload),
});

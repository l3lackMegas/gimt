'use strict';
const electron = require('electron')
const windowStateKeeper = require('electron-window-state');
const {download} = require("electron-dl");
const {ipcMain} = require('electron')
const fsExtra = require('fs-extra')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

let mainWindow

//to make singleton instance
const gotTheLock = app.requestSingleInstanceLock()

app.on('second-instance', (commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (!gotTheLock) {
  return app.quit()
}

global.Site = {
  version: app.getVersion(),
  startPath: `${__dirname}`,
  startPathUrl: `file://${__dirname}`,
  isError: false,
  errorTitle: "",
  errorMsg: "",
  isDev: true
};

function createWindow () {
  
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1100,
    defaultHeight: 600
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1230,
    minHeight: 700,
    frame: false,
    hasShadow: true,
    backgroundColor: "#374042",
    show: false,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //mainWindowState.manage(mainWindow)
  // and load the index.html of the app.

  mainWindow.loadURL(`file://${__dirname}/gui/index.html`)
  //mainWindow.loadURL(`file://${__dirname}/design/error.html`)
  mainWindow.show();
  // Open the DevTools.
  if(global.Site.isDev == true) mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  mainWindow.on('ready-to-show', function () {
    //mainWindow.maximize();
    //mainWindow.show();
  })
  
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)

app.on('ready', function() {
  ipcMain.on("download", (event, info) => {
    info.properties.onProgress = status => mainWindow.webContents.send("download progress", status);
    download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
        .then(dl => mainWindow.webContents.send("download complete", dl.getSavePath()));
  });

  createWindow();

});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('SAVE_FILE', (event, path, buffer, obj) => {
    fsExtra.outputFile(path, buffer, err => {
        if (err) {
            event.sender.send('ERROR', err.message)
        } else {
            event.sender.send('SAVED_FILE', path, obj)
            //console.log(obj);
        }
    })
})
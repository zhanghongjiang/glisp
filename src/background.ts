import {app, protocol, BrowserWindow, ipcMain} from 'electron'
import {platform} from 'os'
import {
	createProtocol,
	installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{scheme: 'app', privileges: {secure: true, standard: true}}
])

function createWindow() {
	// Create the browser window.
	let options = {
		width: 1280,
		height: 720,
		frame: false,
		backgroundColor: '#FFF',
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			// nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			enableRemoteModule: true,
			spellcheck: false
		}
	} as Electron.BrowserWindowConstructorOptions

	options =
		platform() === 'darwin'
			? (options = {...options, titleBarStyle: 'hiddenInset'})
			: (options = {...options, frame: false})
	win = new BrowserWindow(options)

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
		if (!process.env.IS_TEST) {
			win.webContents.openDevTools()
		}
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./index.html')
	}

	win.on('rotate-gesture', (e, rotation) => {
		win.webContents.send('rotate-gesture', rotation)
	})
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	app.quit()
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (!win) {
		createWindow()
	}
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		// Devtools extensions are broken in Electron 6.0.0 and greater
		// See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
		// Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
		// If you are not using Windows 10 dark mode, you may uncomment these lines
		// In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
		try {
			await installVueDevtools()
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', data => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}

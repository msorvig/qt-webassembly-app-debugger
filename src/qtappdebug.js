

var g_createWindowButton = undefined;
var g_initialWindows = [];
var g_windowCascade = 50;
var g_windowIndex = 0;
var g_qtLoader = undefined;
var g_spector = undefined;

async function qtappdebug_init(appname, appcontrolelement, rafdebugelement, timerdebugelement, spectordebugelement)
{
    // Create one inital window and canvas early, so that spector can target the canvas at app startup
    g_initialWindows = [createNumberedWindow(1, 50, 50)];
    g_windowIndex = 2;
    canvases = g_initialWindows.map(function(window) { console.log(window.content); return window.content });
    g_initialWindows.map(function(window) { window.visible = true });

    // Set up application controls
    let appnameLabel = qwebui_lineedit(appcontrolelement, appname);
    let createApplicationButton = qwebui_button(appcontrolelement, "Start Application", () => {
        createApplicationButton.setEnabled(false);
        loadApplication(appnameLabel.text());
    });
    g_createWindowButton = qwebui_button(appcontrolelement, "Create Screen", createAdditinalWindow);
    g_createWindowButton.setEnabled(false);

    // Set up requestAnimationFrame controls
    qrafdebug_interpose();
    let rafRun = qwebui_checkbox(rafdebugelement, "run", true, setRafRun);
    function setRafRun(enable) {
        qrafdebug_setRunning(enable);
        rafdebugstep.setEnabled(!enable);
        rafRun.setChecked(enable)
    }
    
    let rafdebugstep = qwebui_button(rafdebugelement, "step", qrafdebug_step);
    rafdebugstep.setEnabled(false);
    let frameCounter = 0;
    let label = qwebui_label(rafdebugelement, "");
    qrafdebug_setPendingRequestCallback((pending) => label.setText("Frame: " + frameCounter + "  "  + (pending ? "frame requested" : "")))
    qrafdebug_setRequestAnimationFrameObserverCallback((beginFrame) => { 
        if (beginFrame)  {
            ++frameCounter;
            label.setText("Frame: " + frameCounter);
            g_spector.setMarker("F" + frameCounter);
        } else {
            g_spector.clearMarker();
        }
    });

    // Set up timer controls
    qtimerdebug_interpose();
    let timerRun = qwebui_checkbox(timerdebugelement, "run", true, setTimerRun);
    function setTimerRun(enable) {
        qtimerdebug_setRunning(enable);
        timerdebugstep.setEnabled(!enable);
        timerdebugstepall.setEnabled(!enable);
        timerRun.setChecked(enable);
    }
    
    let timerdebugstep = qwebui_button(timerdebugelement, "step", qtimerdebug_step);
    timerdebugstep.setEnabled(false);
    let timerdebugstepall = qwebui_button(timerdebugelement, "step all", qtimerdebug_stepAll);
    timerdebugstepall.setEnabled(false);

    let timersLabel = qwebui_label(timerdebugelement, "Timer Ticks: 0 Active Timers []");
    // let intervalsLabel = qwebui_label(timerdebugelement, "Active Intervals []");
    qtimerdebug_setActiveTimersChangedCallback((ticks, timers, intervals) => {
        timersLabel.setText("Timer Ticks: " + ticks + " Active Timers [" + timers.join(", ") + "]");
    });

    // Set up Spector OpenGL capture
    g_spector = new SPECTOR.Spector();
    g_spector.spyCanvases();
    g_spectorResultUI = g_spector.getResultUI();
    g_spector.onCapture.add((capture) => {
        g_spectorResultUI.addCapture(capture);
    });
    
    // Set up spector controls
    qwebui_button(spectordebugelement, "Spector View", () => {
        // enable requestAnimationFrame and timers for the UI
        setRafRun(true);
        setTimerRun(true);

        g_spectorResultUI.display();
    });

    var g_currentCapture = [];
    qwebui_checkbox(spectordebugelement, "capture", false, (checked) => {
        let commandsToCapture = 10000;
        let fastCaptureNoFrameGrab = false;
        if (checked) {
            for (var i = 0; i < canvases.length; ++i)
                g_currentCapture[i] = g_spector.startCapture(canvases[i], commandsToCapture, fastCaptureNoFrameGrab);
        } else {
            for (var i = 0; i < g_currentCapture.length; ++i)
                g_spector.stopCapture(g_currentCapture[i]);
            g_currentCapture = [];
        }
    });
}

async function loadApplication(apppathname)
{
    // split out path and name
    let parts = apppathname.split("/"); 
    let path = parts.slice(0, Math.max(0, parts.length - 1)).join("/") + "/";
    let name = parts.slice(-1);

    // ### pre-define Module.locateFile, which will be called during
    // qtloader.js script eval.
    Module = {};
    Module["locateFile"] = (name) => { return path  + name; }

    // Fetch and eval qtloader.js here so that we can load it from the
    // correct location (next to the .wasm file), and do not have hardcode
    // it's location in qtappdebugger.html.
    let qtloaderPath = path + "qtloader.js";
    let response = await fetch(qtloaderPath);
    if (response.status != 200) {
        console.log("Fetch of "+ qtloaderPath + " failed with status " + response.status);
        console.log("Is the application path correct?");
        return;
    }

    let script = await response.text();
    self.eval(script);

    g_qtloader = QtLoader({
        canvasElements: canvases,
        path : path,
        showError: function(errorText) {
            console.log("error " + errorText);
        },
        showCanvas: () => {
            g_createWindowButton.setEnabled(true);
            g_initialWindows.map(function(window) { window.visible = true });
        }
    });
    g_qtloader.loadEmscriptenModule(name);
}

function createNumberedWindow(number, x, y)
{
    let window = new Window(x, y);
    window.title = "Canvas / QScreen " + number;
    window.onClose(() => g_qtloader.removeCanvasElement(window.content));
    window.onResize(() => g_qtloader.resizeCanvasElement(window.content));

    // Content: a <canvas> which usess 100% of the available size.
    let canvas = document.createElement("canvas");
    canvas.id = "QtCanvas" + number;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    window.content = canvas;

    return window;
}

function createAdditinalWindow()
{
    var window = createNumberedWindow(g_windowIndex, 10 + g_windowCascade, 10 + g_windowCascade);
    g_qtloader.addCanvasElement(window.content);
    window.visible = true;
    g_windowCascade += 25;
    g_windowIndex += 1;
}




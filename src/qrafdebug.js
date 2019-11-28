
var g_qrafdebug_realRequestAnimationFrame = undefined;
var g_qrafdebug_callbacks = [];
var g_qrafdebug_running = true;
var g_qrafdebug_haveRequestedFrame = false;
var g_qrafdebug_pendingRequestCallback = undefined;
var g_qrafdebug_requestAnimationFrameObserverCallback = undefined;

function qrafdebug_requestAnimationFrame(callback)
{
    g_qrafdebug_callbacks.push(callback)
    if (g_qrafdebug_haveRequestedFrame)
        return;
    g_qrafdebug_haveRequestedFrame = true;
    if (g_qrafdebug_pendingRequestCallback !== undefined)
        g_qrafdebug_pendingRequestCallback(true);
    if (g_qrafdebug_running)
        g_qrafdebug_realRequestAnimationFrame(qrafdebug_requestAnimationFrameCallback);
}

function qrafdebug_requestAnimationFrameCallback()
{
    g_qrafdebug_haveRequestedFrame = false;
    if (g_qrafdebug_pendingRequestCallback !== undefined)
        g_qrafdebug_pendingRequestCallback(false);
    if (g_qrafdebug_callbacks.length == 0)
        return;
    
    // call the observer callback - begin frame
    if (g_qrafdebug_requestAnimationFrameObserverCallback !== undefined)
        g_qrafdebug_requestAnimationFrameObserverCallback(true);
    
    // Call all registered callbacks. Note that we may get new
    // requests during each callback call, which should be processed
    // on the next requestAnimationFrame update.
    callbacks = Array.from(g_qrafdebug_callbacks);
    g_qrafdebug_callbacks = [];
    for (const callback of callbacks)
        callback();
    
    // call the observer callback - end frame
    if (g_qrafdebug_requestAnimationFrameObserverCallback !== undefined)
        g_qrafdebug_requestAnimationFrameObserverCallback(false);
}

function qrafdebug_interpose() {
    g_qrafdebug_realRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = qrafdebug_requestAnimationFrame;
}

function qrafdebug_pause() {
    qrafdebug_setRunning(false);
}

function qrafdebug_run() {
    qrafdebug_setRunning(true);
}

function qrafdebug_togglepause() {
    qrafdebug_setRunning(!g_qrafdebug_running);
}

function qrafdebug_setRunning(running) {
    g_qrafdebug_running = running;
    if (running && g_qrafdebug_callbacks.length > 0)
        g_qrafdebug_realRequestAnimationFrame(qrafdebug_requestAnimationFrameCallback);
}

function qrafdebug_step() {
    g_qrafdebug_realRequestAnimationFrame(qrafdebug_requestAnimationFrameCallback);
}

function qrafdebug_setPendingRequestCallback(callback) {
    g_qrafdebug_pendingRequestCallback = callback;
}

function qrafdebug_setRequestAnimationFrameObserverCallback(callback) {
    // the observer gets called on each frame, but does not itself request a new frame
    g_qrafdebug_requestAnimationFrameObserverCallback = callback;
}

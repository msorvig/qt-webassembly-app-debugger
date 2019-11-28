Qt WebAssembly App Debugger
===========================

The App debugger supports inspecting ands controlling parts of the web runtime environment:
 * Monitoring and single-stepping requestAnimationFrame callbacks
 * Monitoring and single-stepping timer callbacks
 * Testing canvas resize and support for multiple canvases
 * WebGL command capture with SpectorJS

Usage
-----

Edit qtappdebugger.html and provide the path to the application (or alternatively
enter the path in the browser later). Start a web server and open qtappdebugger.html.
Eamples:

    let appName = "appname";   // loads appname.wasm, appname.js etc.
    let appName = "path/to/app/appname"; // subdirectories are OK, too

The app debugger looks for qtloader.js, and uses its API to run the application.

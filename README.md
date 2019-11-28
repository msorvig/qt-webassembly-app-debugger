Qt WebAssembly App Debugger
===========================

The App debugger supports inspecting ands controlling parts of the web runtime environment:
 * Monitoring and single-stepping requestAnimationFrame callbacks
 * Monitoring and single-stepping timer callbacks
 * Testing canvas resize and support for multiple canvases
 * WebGL command capture with SpectorJS

Installation
------------
Build from source:

     npm run-script build

Install with npm:
    
    (npm init --yes) # create temp project if needed
    npm install qtappdebugger

Usage
-----
Copy node_modules/qtappdebugger/qtappdebugger.html to the project directory. It looks for
scripts in node_modules/, adjust the paths if needed.

Edit qtappdebugger.html and provide the name of application (or alternatively
enter the name in the browser later). Examples:

    let appName = "appname";   // loads appname.wasm, appname.js etc.
    let appName = "path/to/app/appname"; // subdirectories are OK, too

Start a web server and open qtappdebugger.html. The app debugger looks for qtloader.js
in the app directory, and uses its API to run the application.

Tips
----
* Link the application with -g2 to get functon names in stack traces captured by SpectorJS.
* Mulit-canvas support requires custom application code: Connect to the QGuiApplication::screenAdded()
  signal and show a new QWindow on the new screen.

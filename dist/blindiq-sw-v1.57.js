/*
 * Versioned service-worker entry point. Changing this filename forces installed
 * home-screen copies to request the current offline shell after deployment.
 */
importScripts("/sw.js?v=1.57");

// A version-specific service-worker URL forces installed home-screen apps to
// replace an older worker even when a previous deployment left /sw.js stale.
importScripts("/sw.js?v=1.56");

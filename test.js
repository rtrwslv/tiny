// Fallback: channel с правильными флагами
try {
  const uri = Services.io.newURI(attachment.url);
  const systemPrincipal =
    Services.scriptSecurityManager.getSystemPrincipal();

  // newChannelFromURI принимает ровно 6 аргументов
  const channel = Services.io.newChannelFromURI(
    uri,                  // aURI
    null,                 // aLoadingNode
    systemPrincipal,      // aLoadingPrincipal  
    null,                 // aTriggeringPrincipal
    Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
    Ci.nsIContentPolicy.TYPE_OTHER
  );

// Fallback: channel с правильными флагами
try {
  const uri = Services.io.newURI(attachment.url);
  const systemPrincipal =
    Services.scriptSecurityManager.getSystemPrincipal();

  // newChannelFromURI принимает ровно 6 аргументов
  const channel = Services.io.newChannelFromURI(
    uri,                  // aURI
    null,                 // aLoadingNode
    systemPrincipal,      // aLoadingPrincipal  
    null,                 // aTriggeringPrincipal
    Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
    Ci.nsIContentPolicy.TYPE_OTHER
  );

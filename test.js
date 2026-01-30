function hasMailServerConnection() {
  let servers = MailServices.accounts.allServers;

  for (let server of servers) {
    // интересуют только входящие (IMAP/POP)
    if (!server || !server.type) {
      continue;
    }

    // IMAP — главный индикатор VPN
    if (server.type === "imap") {
      try {
        // socketType !== unknown + не offline
        if (!server.isOffline && server.socketType !== 0) {
          return true;
        }
      } catch (e) {}
    }
  }

  return false;
}

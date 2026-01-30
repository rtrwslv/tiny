const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

async function checkVpnConnection() {
  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const folder = imapServer.rootFolder.QueryInterface(Ci.nsIMsgImapMailFolder);

      // noop() возвращает true, если соединение живое
      const connected = await new Promise(resolve => {
        folder.noop(null, {
          OnStopRunningUrl() { resolve(true); },
          OnStartRunningUrl() { /* noop */ }
        });
        // Если соединение уже сломано, catch сработает ниже
      });

      if (connected) return true;
    } catch (e) {
      continue;
    }
  }

  return false;
}

// Таймер каждые 2 секунды
setInterval(async () => {
  const vpnAlive = await checkVpnConnection();
  console.log(vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён");
}, 2000);

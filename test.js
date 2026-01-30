const { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

function hasLiveImapConnection() {
  let servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (server.type !== "imap") {
      continue;
    }

    let imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);

    try {
      // 🔑 ГЛАВНАЯ проверка
      if (imapServer.isConnected) {
        return true;
      }
    } catch (e) {
      // ignore
    }
  }

  return false;
}

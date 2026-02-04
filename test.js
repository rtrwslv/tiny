const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

const CHECK_TIMEOUT = 3000;

async function checkVpnConnection() {
  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const inbox = imapServer.rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Inbox);

      const connected = await new Promise((resolve) => {
        let finished = false;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve(false);
          }
        }, CHECK_TIMEOUT);

        try {
          const listener = {
            OnStartRunningUrl() {},
            OnStopRunningUrl(url) {
              if (finished) return;
              finished = true;
              clearTimeout(timer);
              resolve(true);
            }
          };

          inbox.getNewMessages(listener, null);
        } catch (e) {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve(false);
          }
        }
      });

      if (connected) return true;
    } catch (e) {
      continue;
    }
  }

  return false;
}

setInterval(async () => {
  const vpnAlive = await checkVpnConnection();
  console.log(vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён");
}, 2000);

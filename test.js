const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

async function checkVpnConnection() {
  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const inbox = imapServer.rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Inbox);

      await new Promise((resolve, reject) => {
        inbox.getNewMessages(null, {
          OnStartRunningUrl() { },
          OnStopRunningUrl(url) {
            resolve(true); // операция прошла
          }
        });
      });

      return true; // хоть один сервер доступен → VPN есть
    } catch (e) {
      continue; // ошибка на этом сервере → проверяем другие
    }
  }

  return false; // ни один сервер не дал ответ → VPN отключен
}

// Таймер каждые 2 секунды
setInterval(async () => {
  const vpnAlive = await checkVpnConnection();
  console.log(vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён");
}, 2000);

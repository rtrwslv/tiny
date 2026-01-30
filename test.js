const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

const CHECK_TIMEOUT = 3000; // таймаут 3 секунды

async function checkVpnConnection() {
  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") continue;

    try {
      const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);
      const inbox = imapServer.rootFolder.getFolderWithFlags(Ci.nsMsgFolderFlags.Inbox);

      // Пробуем получить новые письма с таймаутом
      const connected = await new Promise((resolve) => {
        let finished = false;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve(false); // таймаут → считаем VPN отключен
          }
        }, CHECK_TIMEOUT);

        try {
          inbox.getNewMessages(null, {
            OnStartRunningUrl() {},
            OnStopRunningUrl(url) {
              if (!finished) {
                finished = true;
                clearTimeout(timer);
                resolve(true); // операция успешна
              }
            }
          });
        } catch (e) {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve(false); // ошибка → VPN отключен
          }
        }
      });

      if (connected) return true; // хотя бы один сервер доступен → VPN есть
    } catch (e) {
      continue; // ошибка на этом сервере → проверяем следующий
    }
  }

  return false; // ни один сервер не дал ответ → VPN отключен
}

// Таймер каждые 2 секунды
setInterval(async () => {
  const vpnAlive = await checkVpnConnection();
  console.log(vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён");
}, 2000);

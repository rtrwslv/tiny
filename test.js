const { MailServices } = ChromeUtils.import(
  "resource:///modules/MailServices.jsm"
);
const { Ci } = ChromeUtils.import(
  "chrome://global/content/xpcom.jsm"
);

const CHECK_TIMEOUT = 3000;

async function checkVpnConnection() {
  const servers = MailServices.accounts.allServers;

  for (let server of servers) {
    if (!server || server.type !== "imap") {
      continue;
    }

    try {
      const imapServer =
        server.QueryInterface(Ci.nsIImapIncomingServer);

      const connected = await new Promise((resolve) => {
        let finished = false;

        const timer = setTimeout(() => {
          if (finished) return;
          finished = true;
          resolve(false);
        }, CHECK_TIMEOUT);

        const listener = {
          OnStartRunningUrl() {},

          OnStopRunningUrl(url, aExitCode) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);

            resolve(Components.isSuccessCode(aExitCode));
          },
        };

        try {
          imapServer.performBiff(listener);
        } catch (e) {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve(false);
          }
        }
      });

      if (connected) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }

  return false;
}

setInterval(async () => {
  const vpnAlive = await checkVpnConnection();
  console.log(
    vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён"
  );
}, 2000);

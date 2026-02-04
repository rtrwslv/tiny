const { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");

let lastStateOnline = false;
let lastVerifyAttempt = 0;
let verifyInProgress = false;

const VERIFY_INTERVAL = 5000;
const VERIFY_TIMEOUT = 3000;

function hasActiveImapConnection() {
  for (let server of MailServices.accounts.allServers) {
    if (server && server.type === "imap" && server.isConnected) {
      return true;
    }
  }
  return false;
}

async function verifyLogonOnce() {
  if (verifyInProgress) {
    return false;
  }

  verifyInProgress = true;

  try {
    for (let server of MailServices.accounts.allServers) {
      if (!server || server.type !== "imap") {
        continue;
      }

      try {
        const imapServer = server.QueryInterface(Ci.nsIImapIncomingServer);

        const ok = await new Promise((resolve) => {
          let finished = false;

          const timer = setTimeout(() => {
            if (!finished) {
              finished = true;
              resolve(false);
            }
          }, VERIFY_TIMEOUT);

          imapServer.verifyLogon(null, {
            OnStartRunningUrl() {},
            OnStopRunningUrl(url, exitCode) {
              if (finished) {
                return;
              }
              finished = true;
              clearTimeout(timer);
              resolve(exitCode === 0);
            }
          });
        });

        if (ok) {
          return true;
        }
      } catch (e) {}
    }
  } finally {
    verifyInProgress = false;
  }

  return false;
}

async function checkVpnState() {
  if (Services.io.offline) {
    lastStateOnline = false;
    return false;
  }

  if (hasActiveImapConnection()) {
    lastStateOnline = true;
    return true;
  }

  if (lastStateOnline) {
    lastStateOnline = false;
    return false;
  }

  const now = Date.now();
  if (now - lastVerifyAttempt < VERIFY_INTERVAL) {
    return false;
  }

  lastVerifyAttempt = now;

  const restored = await verifyLogonOnce();
  lastStateOnline = restored;
  return restored;
}

setInterval(async () => {
  const vpnAlive = await checkVpnState();
  console.log(vpnAlive ? "✅ VPN подключён" : "❌ VPN отключён");
}, 2000);

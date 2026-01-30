const { Ci } = ChromeUtils.import("chrome://global/content/xpcom.jsm");
const { Services } = ChromeUtils.import(
  "resource://gre/modules/Services.jsm"
);

let vpnLikeOffline = false;

const mailSession = Services.mailSession;

const connectionListener = {
  QueryInterface: ChromeUtils.generateQI([
    Ci.nsIMsgMailSessionListener,
  ]),

  onConnectionError(server, errorCode) {
    console.log("❌ IMAP connection error:", errorCode);
    vpnLikeOffline = true;
    updateConnectionIndicator();
  },

  onConnectionSuccess(server) {
    console.log("✅ IMAP connection restored");
    vpnLikeOffline = false;
    updateConnectionIndicator();
  },
};

mailSession.addListener(connectionListener);

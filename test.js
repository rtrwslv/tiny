const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

let mailNetworkOffline = false;

const networkObserver = {
  observe(subject, topic, data) {
    switch (topic) {
      case "mail:network-error":
        mailNetworkOffline = true;
        break;
      case "mail:connection-restored":
        mailNetworkOffline = false;
        break;
      case "network:offline-status-changed":
        mailNetworkOffline = data === "offline";
        break;
    }
  },
};

Services.obs.addObserver(networkObserver, "mail:network-error");
Services.obs.addObserver(networkObserver, "mail:connection-restored");
Services.obs.addObserver(networkObserver, "network:offline-status-changed");

setInterval(() => {
  console.log(mailNetworkOffline);
}, 2000);

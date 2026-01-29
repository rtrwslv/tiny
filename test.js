const { Services } = ChromeUtils.import(
  "resource://gre/modules/Services.jsm"
);

const Ci = Components.interfaces;

const InternetIndicator = {
  linkService: null,

  init() {
    this.linkService = Services.io
      .QueryInterface(Ci.nsINetworkLinkService);

    // первичное состояние
    this.update();

    // слушаем изменения
    Services.obs.addObserver(
      this,
      "network:link-status-changed"
    );
  },

  shutdown() {
    Services.obs.removeObserver(
      this,
      "network:link-status-changed"
    );
  },

  observe(subject, topic, data) {
    if (topic === "network:link-status-changed") {
      this.update();
    }
  },

  hasInternet() {
    // если физического линка нет — интернета точно нет
    if (!this.linkService.isLinkUp) {
      return false;
    }

    // если TB переведён в offline — тоже считаем что интернета нет
    if (Services.io.offline) {
      return false;
    }

    return true;
  },

  update() {
    if (this.hasInternet()) {
      console.log("🌐 Internet: ON");
      // тут включаешь зелёный индикатор
    } else {
      console.log("❌ Internet: OFF");
      // тут включаешь красный индикатор
    }
  }
};

// запуск
InternetIndicator.init();

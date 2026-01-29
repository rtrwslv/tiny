const { Services } = ChromeUtils.import(
  "resource://gre/modules/Services.jsm"
);

function logInternetState() {
  let hasInternet =
    Services.networkLinkService.isLinkUp &&
    !Services.io.offline;

  console.log(
    hasInternet
      ? "🌐 Internet: ON"
      : "❌ Internet: OFF"
  );
}

// первичный вывод
logInternetState();

// реагируем на изменения
Services.obs.addObserver(
  { observe: logInternetState },
  "network:link-status-changed"
);

Services.obs.addObserver(
  { observe: logInternetState },
  "network:offline-status-changed"
);

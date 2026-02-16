/**
 * Fallback: открываем вложение через channel с правильными
 * параметрами загрузки для внутренних протоколов Thunderbird.
 */
function streamViaChannel(attachment, tmpFile, resolve, reject) {
  try {
    const uri = Services.io.newURI(attachment.url);

    // ── Ключевое исправление: правильный principal и флаги ─────
    // Внутренние протоколы imap://, mailbox:// требуют
    // systemPrincipal и TYPE_OTHER без CORS-проверок
    const systemPrincipal =
      Services.scriptSecurityManager.getSystemPrincipal();

    const channel = Services.io.newChannelFromURIWithProxyFlags(
      uri,
      null,                 // loadingNode
      systemPrincipal,      // loadingPrincipal
      null,                 // triggeringPrincipal
      Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
      Ci.nsIContentPolicy.TYPE_OTHER,
      "",                   // cspNonce
      false,                // aSkipCheckForCookies
      0                     // aProxyResolveFlags
    );

    // Открываем выходной поток для записи в файл
    const outStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    outStream.init(tmpFile, 0x02 | 0x08 | 0x20, 0o600, 0);

    channel.asyncOpen({
      QueryInterface: ChromeUtils.generateQI(["nsIStreamListener"]),

      onStartRequest(request) {},

      onDataAvailable(request, inputStream, offset, count) {
        // Используем nsIInputStreamPump подход —
        // безопаснее чем ScriptableInputStream для бинарных данных
        const binStream = Cc["@mozilla.org/binaryinputstream;1"]
          .createInstance(Ci.nsIBinaryInputStream);
        binStream.setInputStream(inputStream);

        const data = binStream.readBytes(count);
        // Пишем как бинарные данные
        const binOutStream = Cc["@mozilla.org/binaryoutputstream;1"]
          .createInstance(Ci.nsIBinaryOutputStream);
        binOutStream.setOutputStream(outStream);
        binOutStream.writeBytes(data, data.length);
      },

      onStopRequest(request, statusCode) {
        try { outStream.close(); } catch {}

        if (Components.isSuccessCode(statusCode)) {
          resolve(tmpFile);
        } else {
          try { tmpFile.remove(false); } catch {}
          reject(new Error(
            `channel.asyncOpen failed: 0x${statusCode.toString(16)}`
          ));
        }
      },
    });

  } catch (e) {
    try { tmpFile.remove(false); } catch {}
    reject(e);
  }
}

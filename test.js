/**
 * Streams an .eml attachment to a temp file.
 * Uses the same approach as the existing attachment save mechanism
 * in Thunderbird — via messenger.saveAttachmentToFile().
 *
 * @param {AttachmentInfo} attachment
 * @returns {Promise<nsIFile>}
 */
function streamAttachmentToTempFile(attachment) {
  return new Promise((resolve, reject) => {

    // Создаём временный файл
    const tmpFile = Services.dirsvc
      .get("TmpD", Ci.nsIFile)
      .clone();
    tmpFile.append("tb_eml_template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    // ── Способ 1: через nsIMessenger.saveAttachmentToFile ──────
    // Это именно тот метод который Thunderbird использует
    // при "Save Attachment" — он знает как открывать
    // внутренние URI вложений правильно
    try {
      const messenger = Cc["@mozilla.org/messenger;1"]
        .getService(Ci.nsIMessenger);

      // saveAttachmentToFile принимает:
      // nsIFile, url, messageUri, contentType, msgWindow
      messenger.saveAttachmentToFile(
        tmpFile,
        attachment.url,        // строковый URL вложения
        attachment.uri,        // URI сообщения-родителя
        attachment.contentType,
        {                      // nsIUrlListener для колбэков
          QueryInterface: ChromeUtils.generateQI(["nsIUrlListener"]),
          OnStartRunningUrl(url) {},
          OnStopRunningUrl(url, exitCode) {
            if (Components.isSuccessCode(exitCode)) {
              resolve(tmpFile);
            } else {
              try { tmpFile.remove(false); } catch {}
              reject(new Error(
                `saveAttachmentToFile failed: 0x${exitCode.toString(16)}`
              ));
            }
          },
        }
      );
    } catch (e) {
      // saveAttachmentToFile недоступен в этой версии — пробуем способ 2
      console.warn("streamAttachmentToTempFile: способ 1 не сработал:", e);
      streamViaChannel(attachment, tmpFile, resolve, reject);
    }
  });
}

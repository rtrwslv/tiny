function streamAttachmentToTempFile(attachment) {
  return new Promise((resolve, reject) => {
    const tmpFile = Services.dirsvc.get("TmpD", Ci.nsIFile).clone();
    tmpFile.append("tb_eml_template.eml");
    tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0o600);

    try {
      const channel = Services.io.newChannelFromURI(
        Services.io.newURI(attachment.url),
        null,
        Services.scriptSecurityManager.getSystemPrincipal(),
        null,
        Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
        Ci.nsIContentPolicy.TYPE_OTHER
      );

      const outStream = Cc["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Ci.nsIFileOutputStream);
      outStream.init(tmpFile, 0x02 | 0x08 | 0x20, 0o600, 0);

      channel.asyncOpen({
        QueryInterface: ChromeUtils.generateQI(["nsIStreamListener"]),
        onStartRequest(request) {},
        onDataAvailable(request, inputStream, offset, count) {
          const binStream = Cc["@mozilla.org/binaryinputstream;1"]
            .createInstance(Ci.nsIBinaryInputStream);
          binStream.setInputStream(inputStream);
          const data = binStream.readBytes(count);

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
            reject(new Error(`channel failed: 0x${statusCode.toString(16)}`));
          }
        },
      });
    } catch (e) {
      try { tmpFile.remove(false); } catch {}
      reject(e);
    }
  });
}

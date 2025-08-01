bool nsMsgContentPolicy::IsExposedProtocol(nsIURI* aContentLocation) {
  nsAutoCString contentScheme;
  nsresult rv = aContentLocation->GetScheme(contentScheme);
  NS_ENSURE_SUCCESS(rv, false);

  // Explicitly allow all cid: URIs, including non-standard ones like cid:~WRD0000.jpg
  if (contentScheme.LowerCaseEqualsLiteral("cid")) {
    return true;
  }

  if (contentScheme.LowerCaseEqualsLiteral("mailto")) return true;

  if (contentScheme.LowerCaseEqualsLiteral("about")) {
    nsAutoCString fullSpec;
    rv = aContentLocation->GetSpec(fullSpec);
    NS_ENSURE_SUCCESS(rv, false);
    if (fullSpec.EqualsLiteral("about:blank")) {
      return false;
    }
    return true;
  }

  if (mCustomExposedProtocols.Contains(contentScheme)) return true;

  bool isChrome;
  rv = aContentLocation->SchemeIs("chrome", &isChrome);
  NS_ENSURE_SUCCESS(rv, false);

  bool isRes;
  rv = aContentLocation->SchemeIs("resource", &isRes);
  NS_ENSURE_SUCCESS(rv, false);

  bool isData;
  rv = aContentLocation->SchemeIs("data", &isData);
  NS_ENSURE_SUCCESS(rv, false);

  bool isMozExtension;
  rv = aContentLocation->SchemeIs("moz-extension", &isMozExtension);
  NS_ENSURE_SUCCESS(rv, false);

  return isChrome || isRes || isData || isMozExtension;
}

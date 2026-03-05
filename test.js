if (filteredGlodaMessages.length === 1) {
  const folderMsg = filteredGlodaMessages[0].folderMessage;
  const date = new Date(folderMsg.date / 1000);
  const dateStr = new Intl.DateTimeFormat(appLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat(appLocale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  bannerElement.textContent = await document.l10n.formatValue(
    "replied-banner-single",
    { date: dateStr, time: timeStr }
  );
} else {
  const count = filteredGlodaMessages.length;
  const pluralRules = new Intl.PluralRules(appLocale);
  const pluralForms = {
    "en-US": { one: "раз", few: "раза", other: "раз" },
    "en-GB": { one: "time", other: "times" },
  };
  const forms = pluralForms[appLocale] ?? pluralForms["en-GB"];
  const form = forms[pluralRules.select(count)] ?? forms.other;

  bannerElement.textContent = await document.l10n.formatValue(
    "replied-banner-multiple",
    { count, form }
  );
}

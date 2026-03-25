function formatFacetDate(date) {
  if (!(date instanceof Date)) {
    return "";
  }

  let now = new Date();

  let isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  let pad = n => String(n).padStart(2, "0");

  let hours = pad(date.getHours());
  let minutes = pad(date.getMinutes());

  if (isToday) {
    return `${hours}:${minutes}`;
  }

  let day = pad(date.getDate());
  let month = pad(date.getMonth() + 1);
  let year = date.getFullYear();

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

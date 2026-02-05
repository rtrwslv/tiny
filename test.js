if (folder.isServer) {
  let name = folder.prettyName;

  let parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    let lastName = parts[0];
    let initials = parts
      .slice(1)
      .map(p => p[0].toUpperCase() + ".")
      .join(" ");

    return `${lastName} ${initials}`;
  }

  return name;
}

appendTerms(aTermCreator, aTerms, aFilterValue) {
  if (!aFilterValue?.enabled || !aFilterValue?.allowedSet) {
    return;
  }

  for (let id of aFilterValue.allowedSet) {
    const term = aTermCreator.createTerm();

    // ✔ используем Custom, потому что MessageId нет в enum
    term.attrib = Ci.nsMsgSearchAttrib.Custom;

    const value = term.value;
    value.attrib = term.attrib;

    // Message-ID как строка
    value.str = id.replace(/^<|>$/g, "").trim();

    term.value = value;

    // ✔ сравнение строк
    term.op = Ci.nsMsgSearchOp.Contains;

    // OR логика
    term.booleanAnd = false;

    aTerms.push(term);
  }
}

appendTerms(aTermCreator, aTerms, aFilterValue) {
  if (!aFilterValue?.enabled || !aFilterValue?.allowedSet) {
    return;
  }

  for (let id of aFilterValue.allowedSet) {
    const term = aTermCreator.createTerm();

    term.attrib = Ci.nsMsgSearchAttrib.MessageId;

    const value = term.value;
    value.attrib = term.attrib;

    // messageId сравниваем как строку
    value.str = id.replace(/^<|>$/g, "").trim();

    term.value = value;

    // важно: Contains (Message-Id не всегда точный match в IMAP)
    term.op = Ci.nsMsgSearchOp.Contains;

    // OR логика между всеми ID
    term.booleanAnd = false;

    aTerms.push(term);
  }
}

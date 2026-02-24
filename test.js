# 1. Ищем определение команды Save as Template в XUL/XHTML
grep -rn "saveAsTemplate\|save.*[Tt]emplate" \
  comm/mail/base/content/*.xhtml \
  comm/mail/base/content/*.xul | grep -i "command\|menuitem"

# 2. Ищем функцию которая обновляет состояние этой команды
grep -rn "goUpdateCommand.*[Tt]emplate\|cmd_saveAsTemplate" \
  comm/mail/base/content/*.js

# 3. Ищем controller который управляет командами File меню
grep -rn "supportsCommand.*save\|isCommandEnabled.*save" \
  comm/mail/base/content/*.js | grep -i template

# 4. Ищем где меню File обновляется
grep -rn "onpopupshowing.*file\|updateFileMenu\|UpdateFileCommands" \
  comm/mail/base/content/*.js

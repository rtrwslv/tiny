dom::XULButtonElement*
MenuBarListener::GetMenuForKeyEvent(KeyboardEvent& aKeyEvent)
{
    if (!aKeyEvent.IsMenuAccessKeyPressed()) {
        return nullptr;
    }

    WidgetKeyboardEvent* nativeKeyEvent = aKeyEvent.WidgetEventPtr()->AsKeyboardEvent();

    uint32_t charCode = aKeyEvent.CharCode();
    if (charCode != 0) {
        dom::XULButtonElement* menu = mMenuBar->FindMenuWithShortcut(aKeyEvent);
        if (menu) {
            return menu;
        }
    }

    auto code = nativeKeyEvent->mCodeNameIndex; // KeyNameIndex
    if (code != dom::KeyboardEvent_Binding::CODE_UNKNOWN) {
        for (auto& menu : mMenuBar->mMenus) {
            uint32_t accessCode = menu->GetAccessKeyCode(); // кастомная функция
            if (accessCode == code) {
                return menu;
            }
        }
    }

    return nullptr;
}

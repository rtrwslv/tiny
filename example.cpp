
if (msgWindow) {
    nsCOMPtr<nsIMsgDBView> prevView;
    msgWindow->GetOpenFolderView(getter_AddRefs(prevView));
    if (prevView) {
        int16_t oldSortType = 0;
        int16_t oldSortOrder = 0;

        prevView->GetSortType(&oldSortType);
        prevView->GetSortOrder(&oldSortOrder);

        m_sortType = oldSortType;
        m_sortOrder = oldSortOrder;
    }
}

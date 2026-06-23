import { useAlbumStore } from '../store/albumStore';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../i18n';

export function Toolbar() {
  const { photos, pages, generatePages } = useAlbumStore();
  const { themeMode, language, toggleTheme, setLanguage } = useUiStore();
  const { t } = useTranslation();

  return (
    <div className="toolbar glass-panel">
      <div>
        <strong>{t('appTitle')}</strong>
        <span>{t('appSubtitle')}</span>
      </div>
      <button className="secondary-button" disabled={!photos.length} onClick={generatePages}>{t('regenerate')}</button>
      <span>{t('photoPageCount', { photos: photos.length, pages: pages.length })}</span>
      <div className="toolbar-toggles">
        <button
          className="icon-toggle"
          title={themeMode === 'dark' ? t('switchToLight') : t('switchToDark')}
          aria-label={themeMode === 'dark' ? t('switchToLight') : t('switchToDark')}
          onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
        >
          <span>{themeMode === 'dark' ? '☀︎' : '☾'}</span>
          <em>{themeMode === 'dark' ? t('themeDark') : t('themeLight')}</em>
        </button>
        <button className="language-toggle" onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
          {t('languageToggle')}
        </button>
      </div>
    </div>
  );
}

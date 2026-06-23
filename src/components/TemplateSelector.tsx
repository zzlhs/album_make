import { useAlbumStore } from '../store/albumStore';
import { useTranslation, type TranslationKey } from '../i18n';

const themeCopyKeys: Record<string, { name: TranslationKey; description: TranslationKey }> = {
  watercolor: { name: 'themeWatercolor', description: 'themeWatercolorDesc' },
  travel: { name: 'themeTravel', description: 'themeTravelDesc' },
  kids: { name: 'themeKids', description: 'themeKidsDesc' },
  memory: { name: 'themeMemory', description: 'themeMemoryDesc' },
  minimal: { name: 'themeMinimal', description: 'themeMinimalDesc' },
};

export function TemplateSelector() {
  const { selectedThemeId, setTheme, templateOptions, cdnTemplateStatus, cdnTemplateError } = useAlbumStore();
  const { t } = useTranslation();
  return (
    <section className="panel-section">
      <div className="section-heading">
        <span className="step-badge">2</span>
        <div>
          <h2>{t('templateTitle')}</h2>
          <p>{t('templateDesc')}</p>
        </div>
      </div>
      <div className="theme-grid">
        {templateOptions.map((theme) => {
          const copy = theme.source === 'built-in' ? themeCopyKeys[theme.id] : undefined;
          return (
            <button
              key={theme.id}
              className={selectedThemeId === theme.id ? `theme-card ${theme.id} active` : `theme-card ${theme.id}`}
              onClick={() => setTheme(theme.id)}
            >
              <span
                className="theme-chip"
                style={{ background: `linear-gradient(90deg, ${theme.accentSoft}, ${theme.accent})` }}
              />
              <strong>{copy ? t(copy.name) : theme.name}</strong>
              <small>{copy ? t(copy.description) : theme.description}</small>
            </button>
          );
        })}
      </div>
      {cdnTemplateStatus === 'loading' && <p className="cdn-template-status">{t('cdnTemplatesLoading')}</p>}
      {cdnTemplateStatus === 'ready' && <p className="cdn-template-status">{t('cdnTemplatesReady')}</p>}
      {cdnTemplateStatus === 'error' && <p className="cdn-template-status error">{cdnTemplateError || t('cdnTemplatesError')}</p>}
    </section>
  );
}

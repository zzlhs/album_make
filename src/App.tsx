import { useEffect } from 'react';
import { SizeSelector } from './components/SizeSelector';
import { TemplateSelector } from './components/TemplateSelector';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoList } from './components/PhotoList';
import { AlbumEditor } from './components/AlbumEditor';
import { Toolbar } from './components/Toolbar';
import { useUiStore } from './store/uiStore';
import { useAlbumStore } from './store/albumStore';
import { parseTemplateCdnUrls } from './templates/cdnTemplateLoader';
import './styles/globals.css';

export default function App() {
  const { themeMode, language, themeRipple, clearThemeRipple } = useUiStore();
  const loadCdnTemplates = useAlbumStore((state) => state.loadCdnTemplates);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [themeMode, language]);

  useEffect(() => {
    const urls = parseTemplateCdnUrls(import.meta.env.VITE_TEMPLATE_CDN_URLS);
    if (urls.length) {
      void loadCdnTemplates(urls);
    }
  }, [loadCdnTemplates]);

  return (
    <div className="app-shell">
      <a
        className="github-corner"
        href="https://github.com/zzlhs/album_make"
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub repository"
        title="Open GitHub repository"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
          <path d="M0 0h80v80z" />
          <path
            className="github-corner-mark"
            d="M40 12.8c-8.4 0-15.2 6.8-15.2 15.2 0 6.7 4.4 12.4 10.4 14.4.8.1 1-.3 1-.7v-2.7c-4.2.9-5.1-1.8-5.1-1.8-.7-1.7-1.7-2.2-1.7-2.2-1.4-.9.1-.9.1-.9 1.5.1 2.3 1.6 2.3 1.6 1.4 2.3 3.6 1.7 4.5 1.3.1-1 .5-1.7 1-2.1-3.4-.4-6.9-1.7-6.9-7.5 0-1.7.6-3 1.6-4.1-.2-.4-.7-2 .1-4 0 0 1.3-.4 4.2 1.6 1.2-.3 2.5-.5 3.8-.5s2.6.2 3.8.5c2.9-2 4.2-1.6 4.2-1.6.8 2 .3 3.6.1 4 1 1.1 1.6 2.4 1.6 4.1 0 5.8-3.5 7.1-6.9 7.5.6.5 1.1 1.5 1.1 3v4.4c0 .4.3.9 1 .7 6.1-2 10.4-7.7 10.4-14.4 0-8.4-6.8-15.2-15.2-15.2z"
          />
        </svg>
      </a>
      {themeRipple && (
        <div
          key={themeRipple.id}
          className="theme-reveal"
          style={{
            left: themeRipple.x,
            top: themeRipple.y,
            background: themeRipple.color,
          }}
          onAnimationEnd={() => clearThemeRipple(themeRipple.id)}
        />
      )}
      <Toolbar />
      <div className="app-grid">
        <aside className="setup-panel smooth-scroll">
          <SizeSelector />
          <TemplateSelector />
          <PhotoUploader />
          <PhotoList />
        </aside>
        <AlbumEditor />
      </div>
    </div>
  );
}

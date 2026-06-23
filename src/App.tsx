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

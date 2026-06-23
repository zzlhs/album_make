import { useState } from 'react';
import { albumSizePresets } from '../templates/templateRegistry';
import { useAlbumStore } from '../store/albumStore';
import { useTranslation, type TranslationKey } from '../i18n';

const sizeNameKeys: Record<string, TranslationKey> = {
  'a4-portrait': 'sizeA4',
  'a5-portrait': 'sizeA5',
  square: 'sizeSquare',
  'landscape-16-9': 'sizeLandscape',
  'portrait-3-4': 'sizePortrait34',
};

export function SizeSelector() {
  const { meta, size, setSize } = useAlbumStore();
  const { t } = useTranslation();
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(1600);

  return (
    <section className="panel-section">
      <div className="section-heading">
        <span className="step-badge">1</span>
        <div>
          <h2>{t('sizeTitle')}</h2>
          <p>{t('sizeDesc')}</p>
        </div>
      </div>
      <div className="preset-grid">
        {albumSizePresets.map((preset) => (
          <button
            key={preset.id}
            className={meta.sizePresetId === preset.id ? 'preset-card active' : 'preset-card'}
            onClick={() => setSize({ width: preset.width, height: preset.height, unit: preset.unit }, preset.id)}
          >
            <strong>{t(sizeNameKeys[preset.id] ?? 'sizeA5')}</strong>
            <span>{preset.ratioLabel}</span>
          </button>
        ))}
      </div>
      <div className="custom-size-row">
        <label>
          {t('customWidth')}
          <input type="number" min="300" value={customWidth} onChange={(event) => setCustomWidth(Number(event.target.value))} />
        </label>
        <label>
          {t('customHeight')}
          <input type="number" min="300" value={customHeight} onChange={(event) => setCustomHeight(Number(event.target.value))} />
        </label>
        <button className="secondary-button" onClick={() => setSize({ width: customWidth, height: customHeight, unit: 'px' }, 'custom')}>{t('applyPx')}</button>
      </div>
      <label className="inline-field">
        {t('exportDpi')}
        <select value={size.dpi} onChange={(event) => setSize({ dpi: Number(event.target.value) })}>
          <option value={150}>{t('dpi150')}</option>
          <option value={200}>{t('dpi200')}</option>
          <option value={300}>{t('dpi300')}</option>
        </select>
      </label>
    </section>
  );
}

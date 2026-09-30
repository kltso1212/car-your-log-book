import { useState } from 'react';

export interface PickerOption {
  value: number;
  label: string;
}

export interface PickerGroup {
  /** Group header, e.g. 引擎與傳動系統. Omit for a flat list. */
  title?: string;
  options: PickerOption[];
}

// Shared item picker body used by the full insert/edit dialogs. Layout:
// - top: selected bubbles with x to remove
// - middle: grouped checkbox list (bold group titles)
// - bottom: 其他 (請註明) textbox + [+] button
export function ItemSelectionBody({
  groups,
  selected,
  customs,
  onToggle,
  onRemoveCustom,
  onAddCustom,
  customPlaceholder = '其他 (請註明)',
}: {
  groups: PickerGroup[];
  selected: number[];
  customs: string[];
  onToggle: (id: number) => void;
  onRemoveCustom: (index: number) => void;
  onAddCustom: (text: string) => void;
  customPlaceholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');

  const allOptions = groups.flatMap(g => g.options);

  const labelOf = (id: number): string => {
    const found = allOptions.find(o => o.value === id);
    return found ? found.label : `項目 #${id}`;
  };

  const handleAdd = (): void => {
    const text = draft.trim();
    if (!text) return;
    const lowered = text.toLowerCase();
    // If the key-in matches a pre-defined item, tick that instead of
    // adding a custom entry.
    const match = allOptions.find(o => o.label.trim().toLowerCase() === lowered);
    if (match) {
      if (!selected.includes(match.value)) onToggle(match.value);
      setDraft('');
      setNotice(`「${match.label}」已在預設項目，已為你勾選`);
      return;
    }
    // Avoid duplicated custom items (case-insensitive, trimmed).
    if (customs.some(c => c.trim().toLowerCase() === lowered)) {
      setDraft('');
      setNotice(`「${text}」已在其他項目`);
      return;
    }
    onAddCustom(text);
    setDraft('');
    setNotice('');
  };

  const hasSelection = selected.length > 0 || customs.length > 0;

  return (
    <div className="picker-dialog-body">
      <div className="selected-bubbles" aria-live="polite">
        {!hasSelection && <span className="bubbles-empty">尚未選擇</span>}
        {selected.map(id => (
          <span key={id} className="bubble">
            <span className="bubble-text">{labelOf(id)}</span>
            <button
              type="button"
              className="bubble-remove"
              aria-label={`移除${labelOf(id)}`}
              onClick={() => onToggle(id)}>
              ✕
            </button>
          </span>
        ))}
        {customs.map((c, i) => (
          <span key={`custom-${c}-${i}`} className="bubble bubble-custom">
            <span className="bubble-text">{c}</span>
            <button
              type="button"
              className="bubble-remove"
              aria-label={`移除${c}`}
              onClick={() => onRemoveCustom(i)}>
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="check-list picker-group-list" role="group">
        {groups.map((g, gi) => (
          <div key={g.title ?? `group-${gi}`} className="picker-group">
            {g.title && (
              <div className="picker-group-title">
                <b>{g.title}</b>
              </div>
            )}
            <div className="picker-options">
              {g.options.map(o => (
                <label key={o.value} className="check-item">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.value)}
                    onChange={() => onToggle(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="other-row">
        <input
          value={draft}
          onChange={e => {
            setDraft(e.target.value);
            if (notice) setNotice('');
          }}
          placeholder={customPlaceholder}
          aria-label={customPlaceholder}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button
          type="button"
          className="icon-button"
          title="加入"
          aria-label="加入其他項目"
          onClick={handleAdd}>
          ➕
        </button>
      </div>
      {notice && (
        <div className="picker-notice" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

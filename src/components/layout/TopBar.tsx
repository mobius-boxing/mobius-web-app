import React from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TopBarProps {
  onOpenMenu: () => void;
  /** Refocused when the drawer closes, so keyboard/SR users land back where they opened it. */
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

/** < lg shell header: opens the off-canvas drawer; brand mirrors Sidebar's. */
const TopBar: React.FC<TopBarProps> = ({ onOpenMenu, menuButtonRef }) => {
  const { t } = useTranslation();

  return (
    <header className="gd-sidebar flex h-14 flex-none items-center gap-3 border-b border-secondary-200 px-3">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onOpenMenu}
        aria-label={t('nav.openMenu')}
        className="rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-800"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white shadow-sm">
          M
        </div>
        <span className="text-lg font-bold tracking-tight text-secondary-900">
          Mobius
        </span>
      </div>
    </header>
  );
};

export default TopBar;

import React, { useCallback, useState } from 'react';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import EntityHistoryDrawer from './EntityHistoryDrawer';

/**
 * The clock on a table row: one record's history, one click away.
 *
 * It owns the drawer's open state **itself**, which is the whole point. A page
 * that wants history adds one array element (see `historyColumn`) and keeps no
 * state, no handler and no drawer import — so the 43rd page costs exactly what
 * the first one did, and no page can get the wiring subtly wrong.
 *
 * The drawer is mounted only while open. That is not a micro-optimisation: the
 * panel fetches as soon as it mounts, and 20 page suites `jest.mock` the whole
 * of `services/api` with a factory whose default export is `undefined`. A
 * button that mounted a fetching drawer under every row would take those
 * suites down, and the failure would read as "the history column broke the
 * pages" rather than "the button fetches too eagerly".
 */

export interface HistoryButtonProps {
  /** The snake_case table name (`sales_orders`), never a label. */
  entityKey: string;
  /** The record's uuid. Without one there is nothing to look up. */
  uuid?: string | null;
  /** The record's own name or code, shown under the drawer's title. */
  recordLabel?: string;
  className?: string;
}

const HistoryButton: React.FC<HistoryButtonProps> = ({
  entityKey,
  uuid,
  recordLabel,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // A bare icon has no accessible name, and `title` alone is not one for a
  // screen reader — the label is spoken, the tooltip is seen.
  const label = t('audit.title');

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={open}
        disabled={!uuid}
        aria-label={label}
        title={label}
        data-testid={`history-${uuid ?? ''}`}
        className={className}
      >
        <History className="h-4 w-4" />
      </Button>

      {isOpen && (
        <EntityHistoryDrawer
          isOpen
          onClose={close}
          entityKey={entityKey}
          uuid={uuid}
          recordLabel={recordLabel}
        />
      )}
    </>
  );
};

export default HistoryButton;

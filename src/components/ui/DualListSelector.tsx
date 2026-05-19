import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import Button from './Button';

interface DualListSelectorProps<T> {
  availableItems: T[];
  assignedItems: T[];
  onAssign: (items: T[]) => void;
  onUnassign: (items: T[]) => void;
  getItemId: (item: T) => string | number;
  getItemLabel: (item: T) => string;
  getItemDescription?: (item: T) => string;
  availableLabel?: string;
  assignedLabel?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

function DualListSelector<T>({
  availableItems,
  assignedItems,
  onAssign,
  onUnassign,
  getItemId,
  getItemLabel,
  getItemDescription,
  availableLabel = 'Available',
  assignedLabel = 'Assigned',
  searchPlaceholder = 'Search...',
  loading = false,
  disabled = false,
}: DualListSelectorProps<T>) {
  const [availableSearch, setAvailableSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string | number>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string | number>>(new Set());

  const filteredAvailable = useMemo(() => {
    if (!availableSearch) return availableItems;
    const search = availableSearch.toLowerCase();
    return availableItems.filter(item => {
      const label = getItemLabel(item).toLowerCase();
      const desc = getItemDescription?.(item)?.toLowerCase() || '';
      return label.includes(search) || desc.includes(search);
    });
  }, [availableItems, availableSearch, getItemLabel, getItemDescription]);

  const filteredAssigned = useMemo(() => {
    if (!assignedSearch) return assignedItems;
    const search = assignedSearch.toLowerCase();
    return assignedItems.filter(item => {
      const label = getItemLabel(item).toLowerCase();
      const desc = getItemDescription?.(item)?.toLowerCase() || '';
      return label.includes(search) || desc.includes(search);
    });
  }, [assignedItems, assignedSearch, getItemLabel, getItemDescription]);

  const toggleAvailable = (id: string | number) => {
    const newSelection = new Set(selectedAvailable);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAvailable(newSelection);
  };

  const toggleAssigned = (id: string | number) => {
    const newSelection = new Set(selectedAssigned);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAssigned(newSelection);
  };

  const moveSelected = () => {
    const itemsToMove = availableItems.filter(item =>
      selectedAvailable.has(getItemId(item))
    );
    onAssign(itemsToMove);
    setSelectedAvailable(new Set());
  };

  const moveAll = () => {
    onAssign(filteredAvailable);
    setSelectedAvailable(new Set());
  };

  const removeSelected = () => {
    const itemsToRemove = assignedItems.filter(item =>
      selectedAssigned.has(getItemId(item))
    );
    onUnassign(itemsToRemove);
    setSelectedAssigned(new Set());
  };

  const removeAll = () => {
    onUnassign(filteredAssigned);
    setSelectedAssigned(new Set());
  };

  const renderList = (
    items: T[],
    selected: Set<string | number>,
    onToggle: (id: string | number) => void,
    emptyMessage: string
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center h-full py-8">
          <p className="text-sm text-secondary-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {items.map(item => {
          const id = getItemId(item);
          const isSelected = selected.has(id);
          return (
            <div
              key={id}
              onClick={() => !disabled && onToggle(id)}
              className={`
                px-3 py-2 rounded-lg cursor-pointer transition-colors
                ${isSelected
                  ? 'bg-primary-100 border border-primary-300'
                  : 'bg-white border border-secondary-200 hover:bg-secondary-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  disabled={disabled}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {getItemLabel(item)}
                  </p>
                  {getItemDescription && (
                    <p className="text-xs text-secondary-500 truncate">
                      {getItemDescription(item)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
      <div className="flex flex-col space-y-3">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {availableLabel}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              placeholder={searchPlaceholder}
              disabled={disabled}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="border border-secondary-300 rounded-lg p-3 h-80 overflow-y-auto bg-secondary-50">
          {renderList(
            filteredAvailable,
            selectedAvailable,
            toggleAvailable,
            'No items available'
          )}
        </div>
        <p className="text-xs text-secondary-600">
          {filteredAvailable.length} item{filteredAvailable.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col justify-center space-y-2 pt-8">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={moveAll}
          disabled={disabled || loading || filteredAvailable.length === 0}
          className="!p-2"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={moveSelected}
          disabled={disabled || loading || selectedAvailable.size === 0}
          className="!p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removeSelected}
          disabled={disabled || loading || selectedAssigned.size === 0}
          className="!p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removeAll}
          disabled={disabled || loading || filteredAssigned.length === 0}
          className="!p-2"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col space-y-3">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {assignedLabel}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={assignedSearch}
              onChange={(e) => setAssignedSearch(e.target.value)}
              placeholder={searchPlaceholder}
              disabled={disabled}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-secondary-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <div className="border border-secondary-300 rounded-lg p-3 h-80 overflow-y-auto bg-secondary-50">
          {renderList(
            filteredAssigned,
            selectedAssigned,
            toggleAssigned,
            'No items assigned'
          )}
        </div>
        <p className="text-xs text-secondary-600">
          {filteredAssigned.length} item{filteredAssigned.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

export default DualListSelector;

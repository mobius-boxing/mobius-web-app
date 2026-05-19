import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Warehouse, WarehouseLocation, LocationStock, PaperStock, SheetStock } from '../../types';
import { warehousesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Truck, AlertCircle, Archive, Box, ExternalLink, FileText, Layers } from 'lucide-react';
import { logger } from '../../utils/logger';

interface WarehouseStockViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
  onEditPaperStock?: (stock: PaperStock) => void;
  onEditSheetStock?: (stock: SheetStock) => void;
}

type LocationTypeOption = 'storage' | 'receiving' | 'shipping' | 'quarantine' | 'wip';

const LOCATION_TYPE_ICONS = {
  storage: Package,
  receiving: Truck,
  shipping: Truck,
  quarantine: AlertCircle,
  wip: Archive,
};

const LOCATION_TYPE_COLORS = {
  storage: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  receiving: 'bg-green-500 hover:bg-green-600 border-green-600',
  shipping: 'bg-purple-500 hover:bg-purple-600 border-purple-600',
  quarantine: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  wip: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
};

const WarehouseStockViewModal: React.FC<WarehouseStockViewModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  onEditPaperStock,
  onEditSheetStock,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [stockByLocation, setStockByLocation] = useState<Map<string, LocationStock>>(new Map());
  const [selectedCell, setSelectedCell] = useState<LocationStock | null>(null);
  const [unassignedPaperStock, setUnassignedPaperStock] = useState<PaperStock[]>([]);
  const [unassignedSheetStock, setUnassignedSheetStock] = useState<SheetStock[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);

  useEffect(() => {
    if (isOpen && warehouse) {
      fetchData();
      setSelectedCell(null);
      setShowUnassigned(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, warehouse]);

  const fetchData = async () => {
    if (!warehouse) return;

    try {
      setLoading(true);
      setError('');

      const [locationsData, stockData] = await Promise.all([
        warehousesApi.getWarehouseLocations(warehouse.uuid),
        warehousesApi.getWarehouseStock(warehouse.uuid),
      ]);

      setLocations(locationsData);

      const stockMap = new Map<string, LocationStock>();
      stockData.locations.forEach(loc => {
        const key = `${loc.row}-${loc.col}`;
        stockMap.set(key, loc);
      });
      setStockByLocation(stockMap);
      setUnassignedPaperStock(stockData.unassignedPaperStock || []);
      setUnassignedSheetStock(stockData.unassignedSheetStock || []);
    } catch (err: any) {
      logger.error('Error fetching warehouse data:', err);
      setError(err.response?.data?.message || t('warehouses.stockView.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const getLocationByPosition = (row: number, col: number): WarehouseLocation | undefined => {
    return locations.find(loc => loc.row === row && loc.col === col);
  };

  const getStockByPosition = (row: number, col: number): LocationStock | undefined => {
    return stockByLocation.get(`${row}-${col}`);
  };

  const handleCellClick = (row: number, col: number) => {
    const location = getLocationByPosition(row, col);
    if (!location || location.status !== 'active') return;

    const stock = getStockByPosition(row, col);
    if (stock && stock.totalItems > 0) {
      setSelectedCell(stock);
      setShowUnassigned(false);
    }
  };

  const handleNavigateToStock = (type: 'paper' | 'sheet', uuid: string) => {
    onClose();
    if (type === 'paper') {
      navigate(`/paper-stock?edit=${uuid}`);
    } else {
      navigate(`/sheet-stock?edit=${uuid}`);
    }
  };

  const renderGrid = () => {
    if (!warehouse) return null;

    const rows = warehouse.gridRows || 10;
    const cols = warehouse.gridCols || 10;
    const gridArray = [];

    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const location = getLocationByPosition(row, col);
        const stock = getStockByPosition(row, col);
        const isActive = location?.status === 'active';
        const locationType = (location?.locationType as LocationTypeOption) || 'storage';
        const hasStock = stock && stock.totalItems > 0;
        const isSelected = selectedCell?.locationCode === location?.locationCode;

        const cellClasses = [
          'relative border transition-all flex flex-col items-center justify-center',
          'aspect-square',
          isActive && hasStock ? 'cursor-pointer hover:scale-110 hover:z-10 hover:shadow-md' : '',
          isActive && !hasStock ? 'cursor-default' : '',
          !isActive ? 'cursor-not-allowed opacity-50' : '',
          isActive
            ? LOCATION_TYPE_COLORS[locationType]
            : 'bg-gray-100 border-gray-300',
          isSelected ? 'ring-4 ring-primary-500 ring-offset-2' : '',
          'text-xs',
        ].join(' ');

        const Icon = isActive ? LOCATION_TYPE_ICONS[locationType] : Box;

        rowCells.push(
          <div
            key={`${row}-${col}`}
            className={cellClasses}
            onClick={() => handleCellClick(row, col)}
            title={location ? `${location.locationCode} - ${hasStock ? `${stock.totalItems} items` : 'Empty'}` : ''}
          >
            <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            {isActive && hasStock && (
              <div className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                <span className="text-[10px] text-white font-bold">{stock.totalItems}</span>
              </div>
            )}
          </div>
        );
      }
      gridArray.push(
        <div key={row} className="grid gap-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {rowCells}
        </div>
      );
    }

    return <div className="grid gap-0">{gridArray}</div>;
  };

  const renderStockList = (paperStock: PaperStock[], sheetStock: SheetStock[], title: string) => {
    if (paperStock.length === 0 && sheetStock.length === 0) {
      return (
        <p className="text-sm text-gray-500 text-center py-4">
          {t('warehouses.stockView.noStock')}
        </p>
      );
    }

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {paperStock.map(stock => (
          <div
            key={stock.uuid}
            className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors"
            onClick={() => onEditPaperStock ? onEditPaperStock(stock) : handleNavigateToStock('paper', stock.uuid)}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stock.paperSupply?.name || stock.paperSupply?.code || t('warehouses.stockView.paperStock')}
                </p>
                <p className="text-xs text-gray-500">
                  {stock.weight ? `${stock.weight}kg` : ''}
                  {stock.width ? ` - ${stock.width}mm` : ''}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        ))}

        {sheetStock.map(stock => (
          <div
            key={stock.uuid}
            className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 cursor-pointer transition-colors"
            onClick={() => onEditSheetStock ? onEditSheetStock(stock) : handleNavigateToStock('sheet', stock.uuid)}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {stock.paperSheet?.name || stock.paperSheet?.code || t('warehouses.stockView.sheetStock')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('warehouses.stockView.quantity')}: {stock.quantity}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
    );
  };

  if (!warehouse) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('warehouses.stockView.title', { name: warehouse.name })}
      size="2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-600">
          {t('warehouses.stockView.instructions')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('warehouses.stockView.gridTitle')}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="inline-block min-w-full overflow-auto max-h-80">
                {renderGrid()}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {selectedCell
                  ? t('warehouses.stockView.locationStock', { code: selectedCell.locationCode })
                  : showUnassigned
                  ? t('warehouses.stockView.unassignedStock')
                  : t('warehouses.stockView.selectCell')}
              </h3>
              {(unassignedPaperStock.length > 0 || unassignedSheetStock.length > 0) && (
                <button
                  onClick={() => {
                    setShowUnassigned(!showUnassigned);
                    setSelectedCell(null);
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    showUnassigned
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {t('warehouses.stockView.unassigned')} ({unassignedPaperStock.length + unassignedSheetStock.length})
                </button>
              )}
            </div>

            {selectedCell ? (
              renderStockList(selectedCell.paperStock, selectedCell.sheetStock, selectedCell.locationCode)
            ) : showUnassigned ? (
              renderStockList(unassignedPaperStock, unassignedSheetStock, t('warehouses.stockView.unassigned'))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                {t('warehouses.stockView.clickToView')}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{t('warehouses.stockView.paperStock')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              <span>{t('warehouses.stockView.sheetStock')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">3</span>
              </div>
              <span>{t('warehouses.stockView.stockCount')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100"></div>
              <span>{t('warehouses.grid.inactive')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WarehouseStockViewModal;

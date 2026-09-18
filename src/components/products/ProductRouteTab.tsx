import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { CreateProductForm, Product, ProductionRoute } from '../../types';
import { productionRoutesApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { ProductFormOptions } from './ProductFormModal';
import { Skeleton } from '../ui/Skeleton';

interface Props {
  register: UseFormRegister<CreateProductForm>;
  watch: UseFormWatch<CreateProductForm>;
  options: ProductFormOptions;
  current: Product | null;
}

/**
 * Tab 3 — route select + a READ-ONLY view of that route's stages and their
 * supplies/machines (D-6/I-23): the single save writes only
 * `productionRouteUuid`, never the route's own stages.
 */
const ProductRouteTab: React.FC<Props> = ({ register, watch, options, current }) => {
  const { t } = useTranslation();
  const routeUuid = watch('productionRouteUuid');
  const [detail, setDetail] = useState<ProductionRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeUuid) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    productionRoutesApi
      .getRoute(routeUuid)
      .then((route) => {
        if (!cancelled) setDetail(route);
      })
      .catch((err) => {
        logger.error('Error loading route detail:', err);
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeUuid]);

  const isPrivateCurrentRoute =
    !!current?.productionRoute && !current.productionRoute.isGlobal && current.productionRoute.uuid === routeUuid;

  return (
    <div className="space-y-4">
      <div>
        <label className="gd-label">{t('products.fields.productionRoute')}</label>
        <select className="input-field w-full" {...register('productionRouteUuid')}>
          <option value="">{t('products.fields.rutaPropia')}</option>
          {current?.productionRoute && !current.productionRoute.isGlobal && (
            <option value={current.productionRoute.uuid}>{current.productionRoute.name}</option>
          )}
          {options.globalRoutes.map((o) => (
            <option key={o.uuid} value={o.uuid}>{o.label}</option>
          ))}
        </select>
        {isPrivateCurrentRoute && (
          <p className="mt-1.5 text-sm text-secondary-600">
            {t('products.fields.rutaPropiaNotice', { name: current?.productionRoute?.name })}
          </p>
        )}
        <p className="mt-1.5 text-xs text-secondary-500">{t('products.fields.rutaPropiaHint')}</p>
      </div>

      {loading ? (
        <Skeleton lines={2} />
      ) : detail?.stages && detail.stages.length > 0 ? (
        <div className="space-y-3">
          {detail.stages
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((stage) => (
              <div key={stage.uuid ?? stage.clientId} className="rounded-md border border-secondary-200 p-3">
                <p className="text-sm font-medium text-secondary-900">
                  {stage.number}. {stage.description ?? t('products.fields.stageUnnamed')}
                </p>
                {stage.machines.length > 0 && (
                  <p className="mt-1 text-xs text-secondary-600">
                    {t('products.fields.stageMachines')}: {stage.machines.map((m) => m.machine?.code ?? m.machineUuid).join(', ')}
                  </p>
                )}
                {stage.supplies.length > 0 && (
                  <p className="mt-1 text-xs text-secondary-600">
                    {t('products.fields.stageSupplies')}: {stage.supplies.map((s) => s.supply?.name ?? s.supply?.code ?? s.supplyUuid).join(', ')}
                  </p>
                )}
              </div>
            ))}
        </div>
      ) : routeUuid ? (
        <p className="text-sm text-secondary-500">{t('products.fields.routeNoStages')}</p>
      ) : (
        <p className="text-sm text-secondary-500">{t('products.fields.routeNoneSelected')}</p>
      )}

      <Link to="/production-routes" className="text-sm text-primary-600 hover:text-primary-700">
        {t('products.fields.routeLink')}
      </Link>
    </div>
  );
};

export default ProductRouteTab;

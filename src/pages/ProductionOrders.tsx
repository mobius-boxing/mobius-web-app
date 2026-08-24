import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import ProductionOrdersGrid from '../components/production-orders/ProductionOrdersGrid';

const ProductionOrders: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {t('productionOrders.title')}
          </h1>
          <p className="text-secondary-600">{t('productionOrders.subtitle')}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
          <ProductionOrdersGrid />
        </div>
      </div>
    </Layout>
  );
};

export default ProductionOrders;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import SalesOrdersGrid from '../components/sales-orders/SalesOrdersGrid';

/**
 * Pedidos — the daily-driver sales screen (`PedidosForm`). The page is the
 * shell: title, "Nuevo pedido" and the grid, which owns the filter bar, the
 * backend pagination and the row actions (including the fulfillment feature's
 * quick action).
 */
const SalesOrders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6" data-testid="sales-orders-list">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="gd-page-title">
              {t('salesOrders.title')}
            </h1>
            <p className="text-secondary-600">{t('salesOrders.subtitle')}</p>
          </div>
          <Button
            onClick={() => navigate('/sales-orders/new')}
            className="inline-flex items-center"
            data-testid="add-sales-order-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('salesOrders.addOrder')}
          </Button>
        </div>

        <SalesOrdersGrid />
      </div>
    </Layout>
  );
};

export default SalesOrders;

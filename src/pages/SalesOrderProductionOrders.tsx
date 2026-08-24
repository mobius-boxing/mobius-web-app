import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import { SalesOrder, SalesOrderProductionOrder } from '../types';
import { salesOrdersApi } from '../services/api';
import { formatBusinessDate } from '../utils/dates';
import { logger } from '../utils/logger';

const PAGE_SIZE = 20;

const tick = (on: boolean, testId: string) =>
  on ? (
    <Check className="h-4 w-4 text-green-600" data-testid={testId} />
  ) : (
    <span className="text-secondary-300">-</span>
  );

/**
 * Órdenes de producción asociadas al pedido (`OrdenesAsociadasForm`).
 *
 * READ-ONLY on purpose: the PLS variant of this screen has a single `Cerrar`
 * button (OrdenesAsociadasForm.cs:44,169-175), and the UI_main variant's
 * Edit/Delete buttons are deliberately not replicated. A routed page rather
 * than a modal (D-9), so the view is deep-linkable and the nav target is a real
 * route (L-011).
 */
const SalesOrderProductionOrders: React.FC = () => {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const [rows, setRows] = useState<SalesOrderProductionOrder[]>([]);
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await salesOrdersApi.getAssociatedProductionOrders(
        uuid,
        { page, limit },
      );
      setRows(response.data ?? []);
      setTotal(response.total ?? 0);
      setTotalPages(response.totalPages ?? 0);
    } catch (err: any) {
      logger.error('Error loading the associated production orders:', err);
      setError(
        err?.response?.data?.message ?? t('salesOrders.associatedOrders.error'),
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [uuid, page, limit, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // The pedido itself, for the title's number. A failure here must not hide
  // the orders, so it never sets the page's error state.
  useEffect(() => {
    if (!uuid) return;
    let cancelled = false;
    salesOrdersApi
      .getSalesOrder(uuid)
      .then((found) => {
        if (!cancelled) setOrder(found);
      })
      .catch((err) => logger.error('Error loading the sales order:', err));
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  const columns = [
    {
      key: 'number',
      header: t('salesOrders.associatedOrders.columns.number'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm font-medium text-secondary-900">
          {row.number}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('salesOrders.associatedOrders.columns.customer'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-700">
          {row.customer?.name ?? '-'}
        </span>
      ),
    },
    {
      key: 'part',
      header: t('salesOrders.associatedOrders.columns.part'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-700">
          {row.part?.code ?? '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('salesOrders.associatedOrders.columns.description'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-700">
          {row.part?.description ?? '-'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('salesOrders.associatedOrders.columns.quantity'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-900">{row.quantity}</span>
      ),
    },
    {
      key: 'orderDate',
      header: t('salesOrders.associatedOrders.columns.orderDate'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-500" data-testid="op-order-date">
          {formatBusinessDate(row.orderDate)}
        </span>
      ),
    },
    {
      key: 'deliveryDate',
      header: t('salesOrders.associatedOrders.columns.deliveryDate'),
      render: (_: unknown, row: SalesOrderProductionOrder) => (
        <span className="text-sm text-secondary-500" data-testid="op-delivery-date">
          {formatBusinessDate(row.deliveryDate)}
        </span>
      ),
    },
    {
      key: 'schedulingApproved',
      header: t('salesOrders.associatedOrders.columns.schedulingApproved'),
      render: (_: unknown, row: SalesOrderProductionOrder) =>
        tick(!!row.schedulingApprovedAt, 'op-tick-scheduling'),
    },
    {
      key: 'completed',
      header: t('salesOrders.associatedOrders.columns.completed'),
      render: (_: unknown, row: SalesOrderProductionOrder) =>
        tick(!!row.completedAt, 'op-tick-completed'),
    },
    {
      key: 'voided',
      header: t('salesOrders.associatedOrders.columns.voided'),
      render: (_: unknown, row: SalesOrderProductionOrder) =>
        tick(!!row.voidedAt, 'op-tick-voided'),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="sales-order-production-orders">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="gd-page-title">
              {t('salesOrders.associatedOrders.title', {
                number: order?.number ?? '',
              })}
            </h1>
          </div>
          <Link
            to="/sales-orders"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
            data-testid="back-to-sales-orders"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('salesOrders.associatedOrders.back')}
          </Link>
        </div>

        {/* A failed read has no rows to report, so the banner REPLACES the
            results panel: on a 404 the page used to claim "no se pudo cargar"
            and "este pedido no tiene órdenes" at the same time. */}
        {error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            data-testid="associated-orders-error"
          >
            {error}
          </div>
        ) : (
          <div className="rounded-lg border border-secondary-200 bg-white shadow-sm">
            <div className="p-6">
              {loading ? (
                <div
                  className="flex h-32 items-center justify-center"
                  data-testid="associated-orders-loading"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center" data-testid="associated-orders-empty">
                  <p className="text-sm text-secondary-500">
                    {t('salesOrders.associatedOrders.empty')}
                  </p>
                </div>
              ) : (
                <>
                  <Table columns={columns} data={rows} />
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(next) => {
                      setLimit(next);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalesOrderProductionOrders;

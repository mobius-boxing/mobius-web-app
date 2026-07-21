import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PartsGrid from '../components/parts/PartsGrid';

const Parts: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{t('parts.title')}</h1>
          <p className="text-secondary-600">{t('parts.subtitle')}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
          <PartsGrid />
        </div>
      </div>
    </Layout>
  );
};

export default Parts;

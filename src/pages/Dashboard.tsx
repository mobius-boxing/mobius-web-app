import React, { useEffect, useState } from 'react';
import useEffectiveCompany from '../hooks/useEffectiveCompany';
import { Users, Building, Mail, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { UserStats, CompanyStats, InvitationStats } from '../types';
import { usersApi, companiesApi, invitationsApi } from '../services/api';
import Card from '../components/ui/Card';
import Layout from '../components/layout/Layout';
import { logger } from '../utils/logger';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
}) => {
  const { t } = useTranslation();
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
          {title}
        </p>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 ring-1 ring-primary-100">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 tabular-nums">
        {value}
      </p>
      {description && (
        <p className="gd-page-sub">{description}</p>
      )}
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-sm text-secondary-500">{t('dashboard.vsLastMonth')}</span>
        </div>
      )}
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId } = useEffectiveCompany();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [invitationStats, setInvitationStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        if (user?.role === 'superAdmin') {
          // Honor the operating-as switcher: scoped stats when a company is
          // selected, platform-wide when none (companyStats is always global).
          const [userStatsData, companyStatsData, invitationStatsData] = await Promise.all([
            usersApi.getUserStats(effectiveCompanyId || undefined),
            companiesApi.getCompanyStats(),
            invitationsApi.getInvitationStats(effectiveCompanyId || undefined),
          ]);
          setUserStats(userStatsData);
          setCompanyStats(companyStatsData);
          setInvitationStats(invitationStatsData);
        } else if (user?.role === 'admin') {
          const [userStatsData, invitationStatsData] = await Promise.all([
            usersApi.getUserStats(user.companyId),
            invitationsApi.getInvitationStats(user.companyId),
          ]);
          setUserStats(userStatsData);
          setInvitationStats(invitationStatsData);
        }
      } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, effectiveCompanyId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-secondary-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="gd-page-title">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-sm text-secondary-500 mt-1">
            {user?.companyName
              ? t('dashboard.welcomeForCompany', {
                  role: t(`roleNames.${user?.role}`, { defaultValue: user?.role }),
                  company: user.companyName,
                })
              : t('dashboard.welcome', {
                  role: t(`roleNames.${user?.role}`, { defaultValue: user?.role }),
                })}
          </p>
        </div>

        {user?.role === 'member' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={t('dashboard.member.cardTitle')}>
              <p className="text-secondary-600">
                {t('dashboard.member.body')}
              </p>
            </Card>
            <Card title={t('dashboard.member.accountTitle')}>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{t('dashboard.member.email')}</span> {user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t('dashboard.member.role')}</span>{' '}
                  {t(`roleNames.${user.role}`, { defaultValue: user.role })}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{t('dashboard.member.company')}</span> {user.companyName}
                </p>
              </div>
            </Card>
          </div>
        )}

        {user?.role === 'admin' && userStats && invitationStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t('dashboard.stats.totalUsers')}
                value={userStats.totalUsers}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.activeUsers', { n: userStats.activeUsers })}
              />
              <StatCard
                title={t('dashboard.stats.pendingInvitations')}
                value={invitationStats.pendingInvitations}
                icon={<Mail className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.awaitingAcceptance')}
              />
              <StatCard
                title={t('dashboard.stats.recentInvitations')}
                value={userStats.recentInvitations}
                icon={<Activity className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.last30Days')}
              />
              <StatCard
                title={t('dashboard.stats.acceptedInvitations')}
                value={invitationStats.acceptedInvitations}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.allTime')}
              />
            </div>

            <Card title={t('dashboard.usersByRole.title')} subtitle={t('dashboard.usersByRole.subtitle')}>
              <div className="space-y-3">
                {userStats.usersByRole.map((roleData) => (
                  <div key={roleData.role} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900 capitalize">
                      {t(`roleNames.${roleData.role}`, { defaultValue: roleData.role })}
                    </span>
                    <span className="text-sm text-secondary-600">{roleData.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {user?.role === 'superAdmin' && userStats && companyStats && invitationStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={t('dashboard.stats.totalCompanies')}
                value={companyStats.totalCompanies}
                icon={<Building className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.activeCount', { n: companyStats.activeCompanies })}
              />
              <StatCard
                title={t('dashboard.stats.totalUsers')}
                value={userStats.totalUsers}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.activeUsers', { n: userStats.activeUsers })}
              />
              <StatCard
                title={t('dashboard.stats.platformInvitations')}
                value={invitationStats.totalInvitations}
                icon={<Mail className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.pendingCount', { n: invitationStats.pendingInvitations })}
              />
              <StatCard
                title={t('dashboard.stats.avgUsersPerCompany')}
                value={companyStats.averageUsersPerCompany.toFixed(1)}
                icon={<Activity className="h-6 w-6 text-primary-600" />}
                description={t('dashboard.desc.platformAverage')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title={t('dashboard.platformUsersByRole.title')} subtitle={t('dashboard.platformUsersByRole.subtitle')}>
                <div className="space-y-3">
                  {userStats.usersByRole.map((roleData) => (
                    <div key={roleData.role} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-secondary-900 capitalize">
                        {t(`roleNames.${roleData.role}`, { defaultValue: roleData.role })}
                      </span>
                      <span className="text-sm text-secondary-600">{roleData.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title={t('dashboard.companyOverview.title')} subtitle={t('dashboard.companyOverview.subtitle')}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      {t('dashboard.companyOverview.companiesWithUsers')}
                    </span>
                    <span className="text-sm text-secondary-600">
                      {companyStats.companiesWithUsers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      {t('dashboard.companyOverview.activeCompanies')}
                    </span>
                    <span className="text-sm text-secondary-600">
                      {companyStats.activeCompanies}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      {t('dashboard.companyOverview.totalCompanies')}
                    </span>
                    <span className="text-sm text-secondary-600">
                      {companyStats.totalCompanies}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
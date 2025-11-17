import React, { useEffect, useState } from 'react';
import { Users, Building, Mail, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserStats, CompanyStats, InvitationStats } from '../types';
import { usersApi, companiesApi, invitationsApi } from '../services/api';
import Card from '../components/ui/Card';
import Layout from '../components/layout/Layout';

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
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{value}</p>
          {description && (
            <p className="text-sm text-secondary-500 mt-1">{description}</p>
          )}
        </div>
        <div className="p-3 bg-primary-100 rounded-full">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-sm text-secondary-500 ml-2">vs last month</span>
        </div>
      )}
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [invitationStats, setInvitationStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch stats based on user role
        if (user?.role === 'superAdmin') {
          // SuperAdmin sees platform-wide stats
          const [userStatsData, companyStatsData, invitationStatsData] = await Promise.all([
            usersApi.getUserStats(),
            companiesApi.getCompanyStats(),
            invitationsApi.getInvitationStats(),
          ]);
          setUserStats(userStatsData);
          setCompanyStats(companyStatsData);
          setInvitationStats(invitationStatsData);
        } else if (user?.role === 'admin') {
          // Admin sees company-specific stats
          const [userStatsData, invitationStatsData] = await Promise.all([
            usersApi.getUserStats(user.companyId),
            invitationsApi.getInvitationStats(user.companyId),
          ]);
          setUserStats(userStatsData);
          setInvitationStats(invitationStatsData);
        }
        // Members see limited dashboard
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-secondary-600 mt-1">
            Welcome to your {user?.role} dashboard
            {user?.companyName && ` for ${user.companyName}`}
          </p>
        </div>

        {/* Member Dashboard */}
        {user?.role === 'member' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Welcome to Mobius">
              <p className="text-secondary-600">
                You have member access to Mobius.
                Contact your administrator if you need additional permissions.
              </p>
            </Card>
            <Card title="Your Account">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Role:</span> {user.role}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Company:</span> {user.companyName}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Admin Dashboard */}
        {user?.role === 'admin' && userStats && invitationStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={userStats.totalUsers}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description={`${userStats.activeUsers} active users`}
              />
              <StatCard
                title="Pending Invitations"
                value={invitationStats.pendingInvitations}
                icon={<Mail className="h-6 w-6 text-primary-600" />}
                description="Awaiting acceptance"
              />
              <StatCard
                title="Recent Invitations"
                value={userStats.recentInvitations}
                icon={<Activity className="h-6 w-6 text-primary-600" />}
                description="Last 30 days"
              />
              <StatCard
                title="Accepted Invitations"
                value={invitationStats.acceptedInvitations}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description="All time"
              />
            </div>

            {/* Users by Role */}
            <Card title="Users by Role" subtitle="Distribution of user roles in your company">
              <div className="space-y-3">
                {userStats.usersByRole.map((roleData) => (
                  <div key={roleData.role} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900 capitalize">
                      {roleData.role}
                    </span>
                    <span className="text-sm text-secondary-600">{roleData.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* SuperAdmin Dashboard */}
        {user?.role === 'superAdmin' && userStats && companyStats && invitationStats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Companies"
                value={companyStats.totalCompanies}
                icon={<Building className="h-6 w-6 text-primary-600" />}
                description={`${companyStats.activeCompanies} active`}
              />
              <StatCard
                title="Total Users"
                value={userStats.totalUsers}
                icon={<Users className="h-6 w-6 text-primary-600" />}
                description={`${userStats.activeUsers} active users`}
              />
              <StatCard
                title="Platform Invitations"
                value={invitationStats.totalInvitations}
                icon={<Mail className="h-6 w-6 text-primary-600" />}
                description={`${invitationStats.pendingInvitations} pending`}
              />
              <StatCard
                title="Avg Users/Company"
                value={companyStats.averageUsersPerCompany.toFixed(1)}
                icon={<Activity className="h-6 w-6 text-primary-600" />}
                description="Platform average"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Users by Role */}
              <Card title="Platform Users by Role" subtitle="Distribution across all companies">
                <div className="space-y-3">
                  {userStats.usersByRole.map((roleData) => (
                    <div key={roleData.role} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-secondary-900 capitalize">
                        {roleData.role}
                      </span>
                      <span className="text-sm text-secondary-600">{roleData.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Company Stats */}
              <Card title="Company Overview" subtitle="Platform-wide company statistics">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      Companies with Users
                    </span>
                    <span className="text-sm text-secondary-600">
                      {companyStats.companiesWithUsers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      Active Companies
                    </span>
                    <span className="text-sm text-secondary-600">
                      {companyStats.activeCompanies}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">
                      Total Companies
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
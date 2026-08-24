import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { logger } from '../utils/logger';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      logger.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        t('login.loginFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-bold shadow-sm">
              M
            </div>
            <span className="gd-page-title">
              Mobius
            </span>
          </div>
          <h2 className="mt-7 text-2xl font-bold tracking-tight text-secondary-900">
            {t('login.title')}
          </h2>
          <p className="mt-1.5 text-sm text-secondary-500">
            {t('login.subtitle')}
          </p>
        </div>

        <form
          className="space-y-5 bg-white border border-secondary-200 rounded-2xl shadow-lg p-8"
          onSubmit={handleSubmit(onSubmit)}
        >
          {error && (
            <div className="flex items-start gap-2.5 gd-alert gd-alert-danger">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              {...register('email', {
                required: t('login.validation.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('login.validation.emailInvalid'),
                },
              })}
              type="email"
              label={t('login.emailLabel')}
              placeholder={t('login.emailPlaceholder')}
              error={errors.email?.message}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                {...register('password', {
                  required: t('login.validation.passwordRequired'),
                })}
                type={showPassword ? 'text' : 'password'}
                label={t('login.passwordLabel')}
                placeholder={t('login.passwordPlaceholder')}
                error={errors.password?.message}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('login.forgotPassword')}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
{t('login.signInButton')}
          </Button>

          <div className="text-center">
            <p className="text-sm text-secondary-600">
              {t('login.needAccount')}{' '}
              <span className="text-primary-600">
                {t('login.contactAdmin')}
              </span>
            </p>
          </div>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-secondary-50 border border-secondary-200 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2">
              {t('login.devCredentials')}
            </h4>
            <div className="text-xs text-secondary-600 space-y-1">
              <p><strong className="font-semibold text-secondary-800">SuperAdmin:</strong> superadmin@mobius.local / SuperAdmin123!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
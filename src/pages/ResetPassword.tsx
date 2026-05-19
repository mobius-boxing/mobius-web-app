import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { logger } from '../utils/logger';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError(t('resetPassword.invalidToken'));
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, t]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError(t('resetPassword.invalidToken'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      logger.error('Password reset error:', err);
      setError(
        err.response?.data?.message ||
        t('resetPassword.resetFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Lock className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            {t('resetPassword.title')}
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">
                {t('resetPassword.successTitle')}
              </h3>
              <p className="text-sm text-green-700">
                {t('resetPassword.successMessage')}
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('newPassword', {
                    required: t('resetPassword.validation.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('resetPassword.validation.passwordMinLength'),
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: t('resetPassword.validation.passwordPattern'),
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  label={t('resetPassword.newPasswordLabel')}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  error={errors.newPassword?.message}
                  autoComplete="new-password"
                  autoFocus
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

              <div className="relative">
                <Input
                  {...register('confirmPassword', {
                    required: t('resetPassword.validation.confirmPasswordRequired'),
                    validate: (value) =>
                      value === newPassword || t('resetPassword.validation.passwordsMismatch'),
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label={t('resetPassword.confirmPasswordLabel')}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="text-xs text-secondary-600 space-y-1">
                <p>{t('resetPassword.passwordRequirements')}</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>{t('resetPassword.requirement1')}</li>
                  <li>{t('resetPassword.requirement2')}</li>
                  <li>{t('resetPassword.requirement3')}</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={!token}
              className="w-full"
              size="lg"
            >
              {t('resetPassword.submitButton')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

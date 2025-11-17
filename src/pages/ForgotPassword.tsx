import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authApi.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(
        err.response?.data?.message ||
        t('forgotPassword.requestFailed')
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
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">
                {t('forgotPassword.successTitle')}
              </h3>
              <p className="text-sm text-green-700 mb-6">
                {t('forgotPassword.successMessage')}
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
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
              <Input
                {...register('email', {
                  required: t('forgotPassword.validation.emailRequired'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('forgotPassword.validation.emailInvalid'),
                  },
                })}
                type="email"
                label={t('forgotPassword.emailLabel')}
                placeholder={t('forgotPassword.emailPlaceholder')}
                error={errors.email?.message}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                {t('forgotPassword.submitButton')}
              </Button>

              <Button
                type="button"
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

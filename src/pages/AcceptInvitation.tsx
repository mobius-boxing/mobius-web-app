import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { AcceptInvitationForm, ApiError, Invitation } from '../types';
import { logger } from '../utils/logger';
import { setToken } from '../utils/session';

const AcceptInvitation: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<AcceptInvitationForm>({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError(t('invitation.invalidExpired'));
      setLoading(false);
      return;
    }

    const validateInvitation = async () => {
      try {
        setLoading(false);
      } catch (err) {
        logger.error('Failed to validate invitation:', err);
        setError(t('invitation.invalidExpired'));
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;

    if (!formData.firstName.trim()) {
      setError(t('invitation.validation.firstNameRequired'));
      return false;
    }
    if (!nameRegex.test(formData.firstName.trim())) {
      setError(t('invitation.validation.firstNameInvalid'));
      return false;
    }

    if (!formData.lastName.trim()) {
      setError(t('invitation.validation.lastNameRequired'));
      return false;
    }
    if (!nameRegex.test(formData.lastName.trim())) {
      setError(t('invitation.validation.lastNameInvalid'));
      return false;
    }

    if (!formData.password) {
      setError(t('invitation.validation.passwordRequired'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('invitation.validation.passwordTooShort'));
      return false;
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError(t('invitation.validation.passwordNoLowercase'));
      return false;
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError(t('invitation.validation.passwordNoUppercase'));
      return false;
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      setError(t('invitation.validation.passwordNoNumber'));
      return false;
    }
    if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      setError(t('invitation.validation.passwordNoSpecial'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('invitation.validation.passwordMismatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await authApi.acceptInvitation(token, formData);

      setToken(response.token);

      window.location.href = '/dashboard';
    } catch (err) {
      logger.error('Failed to accept invitation:', err);
      const apiError = err as { response?: { data?: ApiError } };
      setError(apiError.response?.data?.message || t('invitation.validation.acceptFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-secondary-200 border-t-primary-600 mx-auto"></div>
            <h2 className="mt-6 text-lg font-medium text-secondary-900">
              {t('invitation.validating')}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center bg-white border border-secondary-200 rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold tracking-tight text-red-600">{t('invitation.invalidTitle')}</h2>
            <p className="mt-2 text-sm text-secondary-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-bold shadow-sm">
            M
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-secondary-900">
            {t('invitation.title')}
          </h2>
          <p className="mt-1.5 text-sm text-secondary-500">
            {t('invitation.subtitle')}
          </p>
        </div>

        <form className="space-y-6 bg-white border border-secondary-200 rounded-2xl shadow-lg p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700">
                {t('invitation.firstName')}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="input-field mt-1"
                placeholder={t('invitation.firstNamePlaceholder')}
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700">
                {t('invitation.lastName')}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="input-field mt-1"
                placeholder={t('invitation.lastNamePlaceholder')}
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
                {t('invitation.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field mt-1"
                placeholder={t('invitation.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                disabled={submitting}
              />
              <div className="mt-1.5 text-xs text-secondary-500">
                {t('invitation.passwordRequirements')}
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>{t('invitation.requirement1')}</li>
                  <li>{t('invitation.requirement2')}</li>
                  <li>{t('invitation.requirement3')}</li>
                  <li>{t('invitation.requirement4')}</li>
                  <li>{t('invitation.requirement5')}</li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
                {t('invitation.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field mt-1"
                placeholder={t('invitation.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  {t('invitation.creating')}
                </div>
              ) : (
                t('invitation.submitButton')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;
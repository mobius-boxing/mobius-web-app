import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { AcceptInvitationForm, ApiError, Invitation } from '../types';

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

    // Validate invitation token
    const validateInvitation = async () => {
      try {
        // You might want to create an API endpoint to validate the invitation
        // For now, we'll just store the token and validate when submitting
        setLoading(false);
      } catch (err) {
        console.error('Failed to validate invitation:', err);
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    // Name validation regex (matches backend validation)
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

    // Password validation (match backend rules)
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

      // Save token and user to localStorage (manual login)
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      // Redirect to dashboard - the user state will be updated by AuthProvider
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      const apiError = err as { response?: { data?: ApiError } };
      setError(apiError.response?.data?.message || t('invitation.validation.acceptFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="mt-6 text-xl font-medium text-gray-900">
              {t('invitation.validating')}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">{t('invitation.invalidTitle')}</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('invitation.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('invitation.subtitle')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                {t('invitation.firstName')}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('invitation.firstNamePlaceholder')}
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                {t('invitation.lastName')}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('invitation.lastNamePlaceholder')}
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('invitation.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('invitation.passwordPlaceholder')}
                value={formData.password}
                onChange={handleInputChange}
                disabled={submitting}
              />
              <div className="mt-1 text-xs text-gray-600">
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('invitation.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
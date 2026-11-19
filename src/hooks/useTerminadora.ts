import { useAuth } from '../contexts/AuthContext';
import { useOptionalCompany } from '../contexts/CompanyContext';

/**
 * `companies.isTerminadora` (D-72): shows Cotizaciones / Programas proveedores / Seguimiento.
 * A superAdmin has no company of their own, so the flag follows the company they operate as.
 */
export const useTerminadora = (): boolean => {
  const { user } = useAuth();
  const companyContext = useOptionalCompany();
  if (user?.role === 'superAdmin') return companyContext?.selectedCompany?.isTerminadora === true;
  return user?.companyIsTerminadora === true;
};

export default useTerminadora;

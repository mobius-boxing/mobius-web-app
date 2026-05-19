import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';

const resources = {
  en: {
    common: enCommon
  },
  es: {
    common: esCommon
  }
};

const legacyResources = {
  en: {
    common: {
      nav: {
        dashboard: "Dashboard",
        userManagement: "User Management",
        companyManagement: "Company Management",
        customers: "Customers",
        customerCategories: "Customer Categories",
        warehouses: "Warehouses",
        invitations: "Invitations",
        settings: "Settings",
        signOut: "Sign Out"
      },
      companies: {
        title: "Companies",
        subtitle: "Manage and oversee all companies",
        addCompany: "Add Company",
        allCompanies: "All Companies",
        searchPlaceholder: "Search companies...",
        columns: {
          company: "Company",
          status: "Status",
          created: "Created",
          actions: "Actions"
        },
        status: {
          active: "Active",
          inactive: "Inactive"
        },
        actions: {
          activate: "Activate",
          deactivate: "Deactivate"
        },
        fallbacks: {
          unknownCompany: "Unknown Company",
          noDescription: "No description available",
          noDate: "No date"
        },
        empty: {
          title: "No companies found",
          description: "No companies match your search criteria",
          noData: "Get started by creating your first company"
        },
        deleteConfirm: "Are you sure you want to delete this company? This action cannot be undone.",
        deleteFailed: "Failed to delete company. Please try again.",
        statusUpdateFailed: "Failed to update company status. Please try again."
      },
      auth: {
        accessDenied: "Access Denied",
        noPermission: "You don't have permission to access this page"
      },
      login: {
        title: "Sign in to Mobius",
        subtitle: "Enter your credentials to access your account",
        emailLabel: "Email Address",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        forgotPassword: "Forgot password?",
        signInButton: "Sign In",
        needAccount: "Need an account?",
        contactAdmin: "Contact your administrator for an invitation",
        devCredentials: "Development Credentials:",
        loginFailed: "Login failed. Please check your credentials and try again.",
        validation: {
          emailRequired: "Email is required",
          emailInvalid: "Please enter a valid email address",
          passwordRequired: "Password is required"
        }
      },
      forgotPassword: {
        title: "Forgot Password",
        subtitle: "Enter your email address and we'll send you a link to reset your password",
        emailLabel: "Email Address",
        emailPlaceholder: "Enter your email",
        submitButton: "Send Reset Link",
        backToLogin: "Back to Login",
        successTitle: "Check Your Email",
        successMessage: "If an account exists with this email, you will receive a password reset link shortly.",
        requestFailed: "Failed to send reset link. Please try again.",
        validation: {
          emailRequired: "Email is required",
          emailInvalid: "Please enter a valid email address"
        }
      },
      resetPassword: {
        title: "Reset Password",
        subtitle: "Enter your new password below",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "Enter your new password",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your new password",
        submitButton: "Reset Password",
        successTitle: "Password Reset Successful",
        successMessage: "Redirecting to login...",
        resetFailed: "Failed to reset password. The link may have expired.",
        invalidToken: "Invalid or missing reset token",
        passwordRequirements: "Password must contain:",
        requirement1: "At least 8 characters",
        requirement2: "One uppercase letter",
        requirement3: "One number",
        validation: {
          passwordRequired: "Password is required",
          passwordMinLength: "Password must be at least 8 characters",
          passwordPattern: "Password must contain at least one uppercase letter and one number",
          confirmPasswordRequired: "Please confirm your password",
          passwordsMismatch: "Passwords do not match"
        }
      },
      invitation: {
        title: "Complete Your Registration",
        subtitle: "Set up your account to accept the invitation",
        validating: "Validating invitation...",
        invalidTitle: "Invalid Invitation",
        invalidExpired: "Invalid or expired invitation link",
        firstName: "First Name",
        firstNamePlaceholder: "Enter your first name",
        lastName: "Last Name",
        lastNamePlaceholder: "Enter your last name",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Confirm your password",
        submitButton: "Complete Registration",
        creating: "Creating Account...",
        passwordRequirements: "Password must contain:",
        requirement1: "At least 8 characters",
        requirement2: "One lowercase letter (a-z)",
        requirement3: "One uppercase letter (A-Z)",
        requirement4: "One number (0-9)",
        requirement5: "One special character (@$!%*?&)",
        validation: {
          firstNameRequired: "First name is required",
          firstNameInvalid: "First name can only contain letters, spaces, hyphens, and apostrophes",
          lastNameRequired: "Last name is required",
          lastNameInvalid: "Last name can only contain letters, spaces, hyphens, and apostrophes",
          passwordRequired: "Password is required",
          passwordTooShort: "Password must be at least 8 characters",
          passwordNoLowercase: "Password must contain at least one lowercase letter",
          passwordNoUppercase: "Password must contain at least one uppercase letter",
          passwordNoNumber: "Password must contain at least one number",
          passwordNoSpecial: "Password must contain at least one special character (@$!%*?&)",
          passwordMismatch: "Passwords do not match",
          acceptFailed: "Failed to accept invitation. Please try again."
        }
      },
      customers: {
        title: "Customers",
        subtitle: "Manage customer information and relationships",
        addCustomer: "Add Customer",
        allCustomers: "All Customers",
        searchPlaceholder: "Search customers...",
        columns: {
          customerName: "Customer Name",
          supplierCode: "Supplier Code",
          category: "Category",
          salesPerson: "Sales Person",
          status: "Status",
          actions: "Actions"
        },
        status: {
          active: "Active",
          inactive: "Inactive"
        },
        actions: {
          edit: "Edit",
          delete: "Delete"
        },
        empty: {
          title: "No customers found",
          description: "Try adjusting your search terms.",
          noData: "Get started by creating a new customer."
        },
        deleteConfirm: "Are you sure you want to delete this customer?",
        deleteFailed: "Failed to delete customer. Please try again."
      },
      customerCategories: {
        title: "Customer Categories",
        subtitle: "Manage customer category classifications",
        addCategory: "Add Category",
        allCategories: "All Categories",
        searchPlaceholder: "Search categories...",
        columns: {
          categoryName: "Category Name",
          created: "Created",
          actions: "Actions"
        },
        actions: {
          edit: "Edit",
          delete: "Delete"
        },
        empty: {
          title: "No categories found",
          description: "Try adjusting your search terms.",
          noData: "Get started by creating a new category."
        },
        deleteConfirm: "Are you sure you want to delete this customer category?",
        deleteFailed: "Failed to delete customer category. Please try again."
      },
      warehouses: {
        title: "Warehouses",
        subtitle: "Manage your warehouse locations",
        addWarehouse: "Add Warehouse",
        allWarehouses: "All Warehouses",
        searchPlaceholder: "Search warehouses...",
        columns: {
          warehouse: "Warehouse",
          code: "Code",
          status: "Status",
          created: "Created",
          actions: "Actions"
        },
        status: {
          active: "Active",
          inactive: "Inactive"
        },
        actions: {
          activate: "Activate",
          deactivate: "Deactivate"
        },
        fallbacks: {
          unknownWarehouse: "Unknown Warehouse",
          noCode: "No code",
          noDate: "No date"
        },
        empty: {
          title: "No warehouses found",
          description: "No warehouses match your search criteria",
          noData: "Get started by creating your first warehouse"
        },
        deleteConfirm: "Are you sure you want to delete this warehouse? This action cannot be undone.",
        deleteFailed: "Failed to delete warehouse. Please try again.",
        statusUpdateFailed: "Failed to update warehouse status. Please try again."
      },
      customerModal: {
        createTitle: "Create New Customer",
        editTitle: "Edit Customer",
        basicInformation: "Basic Information",
        assignment: "Assignment",
        contacts: "Contacts",
        deliveryLocations: "Delivery Locations",
        deliveryDays: "Delivery Days",
        company: "Company",
        customerName: "Customer Name",
        legalName: "Legal Name",
        tradeName: "Trade Name",
        supplierCode: "Supplier Code",
        address: "Address",
        active: "Active",
        category: "Category",
        salesPerson: "Sales Person",
        selectCompany: "Select a company",
        enterCustomerName: "Enter customer name",
        enterLegalName: "Enter legal name (optional)",
        enterTradeName: "Enter trade name (optional)",
        enterSupplierCode: "Enter supplier code (optional)",
        enterAddress: "Enter customer address (optional)",
        selectCategory: "Select a category (optional)",
        selectSalesPerson: "Select a sales person (optional)",
        contact: "Contact",
        role: "Role",
        name: "Name",
        phone: "Phone",
        altPhone: "Alt Phone",
        mobile: "Mobile",
        email: "Email",
        notes: "Notes",
        location: "Location",
        code: "Code",
        availableTimes: "Available Times",
        deliveryZone: "Delivery Zone",
        latitude: "Latitude",
        longitude: "Longitude",
        day: "Day",
        selectDay: "Select Day",
        from: "From",
        to: "To",
        days: {
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        },
        addContact: "+ Add Contact",
        addLocation: "+ Add Location",
        addDay: "+ Add Day",
        remove: "Remove",
        cancel: "Cancel",
        createButton: "Create Customer",
        updateButton: "Update Customer",
        validation: {
          companyRequired: "Company is required",
          nameRequired: "Customer name is required",
          nameMinLength: "Customer name must be at least 2 characters"
        },
        errors: {
          createFailed: "Failed to create customer. Please try again.",
          updateFailed: "Failed to update customer. Please try again."
        }
      }
    }
  }
};

const legacyEsResources = {
  es: {
    common: {
      nav: {
        dashboard: "Panel de Control",
        userManagement: "Gestión de Usuarios",
        companyManagement: "Gestión de Empresas",
        customers: "Clientes",
        customerCategories: "Categorías de Clientes",
        warehouses: "Almacenes",
        invitations: "Invitaciones",
        settings: "Configuración",
        signOut: "Cerrar Sesión"
      },
      companies: {
        title: "Empresas",
        subtitle: "Gestiona y supervisa todas las empresas",
        addCompany: "Agregar Empresa",
        allCompanies: "Todas las Empresas",
        searchPlaceholder: "Buscar empresas...",
        columns: {
          company: "Empresa",
          status: "Estado",
          created: "Creado",
          actions: "Acciones"
        },
        status: {
          active: "Activo",
          inactive: "Inactivo"
        },
        actions: {
          activate: "Activar",
          deactivate: "Desactivar"
        },
        fallbacks: {
          unknownCompany: "Empresa Desconocida",
          noDescription: "No hay descripción disponible",
          noDate: "Sin fecha"
        },
        empty: {
          title: "No se encontraron empresas",
          description: "Ninguna empresa coincide con tus criterios de búsqueda",
          noData: "Comienza creando tu primera empresa"
        },
        deleteConfirm: "¿Estás seguro de que quieres eliminar esta empresa? Esta acción no se puede deshacer.",
        deleteFailed: "Error al eliminar empresa. Por favor intenta de nuevo.",
        statusUpdateFailed: "Error al actualizar el estado de la empresa. Por favor intenta de nuevo."
      },
      auth: {
        accessDenied: "Acceso Denegado",
        noPermission: "No tienes permisos para acceder a esta página"
      },
      login: {
        title: "Iniciar sesión en Mobius",
        subtitle: "Ingresa tus credenciales para acceder a tu cuenta",
        emailLabel: "Dirección de Email",
        emailPlaceholder: "Ingresa tu email",
        passwordLabel: "Contraseña",
        passwordPlaceholder: "Ingresa tu contraseña",
        forgotPassword: "¿Olvidaste tu contraseña?",
        signInButton: "Iniciar Sesión",
        needAccount: "¿Necesitas una cuenta?",
        contactAdmin: "Contacta a tu administrador para una invitación",
        devCredentials: "Credenciales de Desarrollo:",
        loginFailed: "Inicio de sesión fallido. Por favor verifica tus credenciales e intenta de nuevo.",
        validation: {
          emailRequired: "El email es requerido",
          emailInvalid: "Por favor ingresa una dirección de email válida",
          passwordRequired: "La contraseña es requerida"
        }
      },
      forgotPassword: {
        title: "Olvidé mi Contraseña",
        subtitle: "Ingresa tu dirección de email y te enviaremos un enlace para restablecer tu contraseña",
        emailLabel: "Dirección de Email",
        emailPlaceholder: "Ingresa tu email",
        submitButton: "Enviar Enlace de Restablecimiento",
        backToLogin: "Volver al Inicio de Sesión",
        successTitle: "Revisa tu Email",
        successMessage: "Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña en breve.",
        requestFailed: "Error al enviar el enlace de restablecimiento. Por favor intenta de nuevo.",
        validation: {
          emailRequired: "El email es requerido",
          emailInvalid: "Por favor ingresa una dirección de email válida"
        }
      },
      resetPassword: {
        title: "Restablecer Contraseña",
        subtitle: "Ingresa tu nueva contraseña a continuación",
        newPasswordLabel: "Nueva Contraseña",
        newPasswordPlaceholder: "Ingresa tu nueva contraseña",
        confirmPasswordLabel: "Confirmar Contraseña",
        confirmPasswordPlaceholder: "Confirma tu nueva contraseña",
        submitButton: "Restablecer Contraseña",
        successTitle: "Contraseña Restablecida Exitosamente",
        successMessage: "Redirigiendo al inicio de sesión...",
        resetFailed: "Error al restablecer la contraseña. El enlace puede haber expirado.",
        invalidToken: "Token de restablecimiento inválido o faltante",
        passwordRequirements: "La contraseña debe contener:",
        requirement1: "Al menos 8 caracteres",
        requirement2: "Una letra mayúscula",
        requirement3: "Un número",
        validation: {
          passwordRequired: "La contraseña es requerida",
          passwordMinLength: "La contraseña debe tener al menos 8 caracteres",
          passwordPattern: "La contraseña debe contener al menos una letra mayúscula y un número",
          confirmPasswordRequired: "Por favor confirma tu contraseña",
          passwordsMismatch: "Las contraseñas no coinciden"
        }
      },
      invitation: {
        title: "Completa tu Registro",
        subtitle: "Configura tu cuenta para aceptar la invitación",
        validating: "Validando invitación...",
        invalidTitle: "Invitación Inválida",
        invalidExpired: "Enlace de invitación inválido o expirado",
        firstName: "Nombre",
        firstNamePlaceholder: "Ingresa tu nombre",
        lastName: "Apellido",
        lastNamePlaceholder: "Ingresa tu apellido",
        password: "Contraseña",
        passwordPlaceholder: "Ingresa tu contraseña",
        confirmPassword: "Confirmar Contraseña",
        confirmPasswordPlaceholder: "Confirma tu contraseña",
        submitButton: "Completar Registro",
        creating: "Creando Cuenta...",
        passwordRequirements: "La contraseña debe contener:",
        requirement1: "Al menos 8 caracteres",
        requirement2: "Una letra minúscula (a-z)",
        requirement3: "Una letra mayúscula (A-Z)",
        requirement4: "Un número (0-9)",
        requirement5: "Un carácter especial (@$!%*?&)",
        validation: {
          firstNameRequired: "El nombre es requerido",
          firstNameInvalid: "El nombre solo puede contener letras, espacios, guiones y apostrofes",
          lastNameRequired: "El apellido es requerido",
          lastNameInvalid: "El apellido solo puede contener letras, espacios, guiones y apostrofes",
          passwordRequired: "La contraseña es requerida",
          passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
          passwordNoLowercase: "La contraseña debe contener al menos una letra minúscula",
          passwordNoUppercase: "La contraseña debe contener al menos una letra mayúscula",
          passwordNoNumber: "La contraseña debe contener al menos un número",
          passwordNoSpecial: "La contraseña debe contener al menos un carácter especial (@$!%*?&)",
          passwordMismatch: "Las contraseñas no coinciden",
          acceptFailed: "Error al aceptar la invitación. Por favor intenta de nuevo."
        }
      },
      customers: {
        title: "Clientes",
        subtitle: "Gestionar información y relaciones de clientes",
        addCustomer: "Agregar Cliente",
        allCustomers: "Todos los Clientes",
        searchPlaceholder: "Buscar clientes...",
        columns: {
          customerName: "Nombre del Cliente",
          supplierCode: "Código de Proveedor",
          category: "Categoría",
          salesPerson: "Vendedor",
          status: "Estado",
          actions: "Acciones"
        },
        status: {
          active: "Activo",
          inactive: "Inactivo"
        },
        actions: {
          edit: "Editar",
          delete: "Eliminar"
        },
        empty: {
          title: "No se encontraron clientes",
          description: "Intenta ajustar tus términos de búsqueda.",
          noData: "Comienza creando un nuevo cliente."
        },
        deleteConfirm: "¿Estás seguro de que quieres eliminar este cliente?",
        deleteFailed: "Error al eliminar cliente. Por favor intenta de nuevo."
      },
      customerCategories: {
        title: "Categorías de Clientes",
        subtitle: "Gestionar clasificaciones de categorías de clientes",
        addCategory: "Agregar Categoría",
        allCategories: "Todas las Categorías",
        searchPlaceholder: "Buscar categorías...",
        columns: {
          categoryName: "Nombre de Categoría",
          created: "Creado",
          actions: "Acciones"
        },
        actions: {
          edit: "Editar",
          delete: "Eliminar"
        },
        empty: {
          title: "No se encontraron categorías",
          description: "Intenta ajustar tus términos de búsqueda.",
          noData: "Comienza creando una nueva categoría."
        },
        deleteConfirm: "¿Estás seguro de que quieres eliminar esta categoría de cliente?",
        deleteFailed: "Error al eliminar categoría de cliente. Por favor intenta de nuevo."
      },
      warehouses: {
        title: "Almacenes",
        subtitle: "Gestiona tus ubicaciones de almacén",
        addWarehouse: "Agregar Almacén",
        allWarehouses: "Todos los Almacenes",
        searchPlaceholder: "Buscar almacenes...",
        columns: {
          warehouse: "Almacén",
          code: "Código",
          status: "Estado",
          created: "Creado",
          actions: "Acciones"
        },
        status: {
          active: "Activo",
          inactive: "Inactivo"
        },
        actions: {
          activate: "Activar",
          deactivate: "Desactivar"
        },
        fallbacks: {
          unknownWarehouse: "Almacén Desconocido",
          noCode: "Sin código",
          noDate: "Sin fecha"
        },
        empty: {
          title: "No se encontraron almacenes",
          description: "Ningún almacén coincide con tus criterios de búsqueda",
          noData: "Comienza creando tu primer almacén"
        },
        deleteConfirm: "¿Estás seguro de que quieres eliminar este almacén? Esta acción no se puede deshacer.",
        deleteFailed: "Error al eliminar almacén. Por favor intenta de nuevo.",
        statusUpdateFailed: "Error al actualizar el estado del almacén. Por favor intenta de nuevo."
      },
      customerModal: {
        createTitle: "Crear Nuevo Cliente",
        editTitle: "Editar Cliente",
        basicInformation: "Información Básica",
        assignment: "Asignación",
        contacts: "Contactos",
        deliveryLocations: "Ubicaciones de Entrega",
        deliveryDays: "Días de Entrega",
        company: "Empresa",
        customerName: "Nombre del Cliente",
        legalName: "Nombre Legal",
        tradeName: "Nombre Comercial",
        supplierCode: "Código de Proveedor",
        address: "Dirección",
        active: "Activo",
        category: "Categoría",
        salesPerson: "Vendedor",
        selectCompany: "Selecciona una empresa",
        enterCustomerName: "Ingresa nombre del cliente",
        enterLegalName: "Ingresa nombre legal (opcional)",
        enterTradeName: "Ingresa nombre comercial (opcional)",
        enterSupplierCode: "Ingresa código de proveedor (opcional)",
        enterAddress: "Ingresa dirección del cliente (opcional)",
        selectCategory: "Selecciona una categoría (opcional)",
        selectSalesPerson: "Selecciona un vendedor (opcional)",
        contact: "Contacto",
        role: "Rol",
        name: "Nombre",
        phone: "Teléfono",
        altPhone: "Teléfono Alt",
        mobile: "Móvil",
        email: "Email",
        notes: "Notas",
        location: "Ubicación",
        code: "Código",
        availableTimes: "Horarios Disponibles",
        deliveryZone: "Zona de Entrega",
        latitude: "Latitud",
        longitude: "Longitud",
        day: "Día",
        selectDay: "Seleccionar Día",
        from: "Desde",
        to: "Hasta",
        days: {
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo"
        },
        addContact: "+ Agregar Contacto",
        addLocation: "+ Agregar Ubicación",
        addDay: "+ Agregar Día",
        remove: "Eliminar",
        cancel: "Cancelar",
        createButton: "Crear Cliente",
        updateButton: "Actualizar Cliente",
        validation: {
          companyRequired: "La empresa es requerida",
          nameRequired: "El nombre del cliente es requerido",
          nameMinLength: "El nombre del cliente debe tener al menos 2 caracteres"
        },
        errors: {
          createFailed: "Error al crear cliente. Por favor intenta de nuevo.",
          updateFailed: "Error al actualizar cliente. Por favor intenta de nuevo."
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    lng: 'es',
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common'],

    resources,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;
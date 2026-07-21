import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Tag,
  UserCircle,
  Warehouse,
  Layers,
  FileText,
  Package,
  Wrench,
  Box,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Truck,
  Database,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  MapPin,
  Boxes,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { NavItem } from '../../types';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import CompanySwitcher from '../ui/CompanySwitcher';
import { logger } from '../../utils/logger';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { has } = usePermissions();
  const location = useLocation();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  const navigationItems: NavItem[] = [
    {
      id: 'masters',
      label: t('nav.masters'),
      icon: 'Database',
      roles: ['admin', 'superAdmin'],
      children: [
        {
          id: 'customers',
          label: t('nav.customers'),
          path: '/customers',
          icon: 'UserCircle',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'customer-categories',
          label: t('nav.customerCategories'),
          path: '/customer-categories',
          icon: 'Tag',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'delivery-zones',
          label: t('nav.deliveryZones'),
          path: '/delivery-zones',
          icon: 'MapPin',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'products',
          label: t('nav.products'),
          path: '/products',
          icon: 'Package',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'warehouses',
          label: t('nav.warehouses'),
          path: '/warehouses',
          icon: 'Warehouse',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'materials',
          label: t('nav.materials'),
          icon: 'Box',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'paper-types',
              label: t('nav.paperTypes'),
              path: '/paper-types',
              icon: 'FileText',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'flute-types',
              label: t('nav.fluteTypes'),
              path: '/flute-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'paper-classes',
              label: t('nav.paperClasses'),
              path: '/paper-classes',
              icon: 'BookOpen',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'corrugation-classes',
              label: t('nav.corrugationClasses'),
              path: '/corrugation-classes',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'corrugations',
              label: t('nav.corrugations'),
              path: '/corrugations',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
          ],
        },
        {
          id: 'others',
          label: t('nav.others'),
          icon: 'Box',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'manufacturers',
              label: t('nav.manufacturers'),
              path: '/manufacturers',
              icon: 'Wrench',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'suppliers',
              label: t('nav.suppliers'),
              path: '/suppliers',
              icon: 'Truck',
              roles: ['admin', 'superAdmin'],
            },
          ],
        },
        {
          id: 'supplies',
          label: t('nav.supplies'),
          icon: 'Package',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'paper-supplies',
              label: t('nav.paperSupplies'),
              path: '/supplies',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'paper-sheets',
              label: t('nav.paperSheets'),
              path: '/paper-sheets',
              icon: 'FileText',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'toolings',
              label: t('nav.toolings'),
              path: '/toolings',
              icon: 'Wrench',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'consumable-supplies',
              label: t('nav.consumableSupplies'),
              path: '/consumable-supplies',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'finished-goods',
              label: t('nav.finishedGoods'),
              path: '/finished-goods',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
          ],
        },
        {
          id: 'palletizations',
          label: t('nav.palletizations'),
          path: '/palletizations',
          icon: 'Boxes',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'pallet-types',
          label: t('nav.palletTypes'),
          path: '/pallet-types',
          icon: 'Layers',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'tooling-types',
          label: t('nav.toolingTypes'),
          path: '/tooling-types',
          icon: 'Wrench',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'consumable-types',
          label: t('nav.consumableTypes'),
          path: '/consumable-types',
          icon: 'Package',
          roles: ['admin', 'superAdmin'],
        },
        {
          id: 'product-specifications',
          label: t('nav.productSpecifications'),
          icon: 'Layers',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'flap-types',
              label: t('nav.flapTypes'),
              path: '/flap-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'product-types',
              label: t('nav.productTypes'),
              path: '/product-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'box-types',
              label: t('nav.boxTypes'),
              path: '/box-types',
              icon: 'Box',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'glue-types',
              label: t('nav.glueTypes'),
              path: '/glue-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'colors',
              label: t('nav.colors'),
              path: '/colors',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'color-types',
              label: t('nav.colorTypes'),
              path: '/color-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'fsc-types',
              label: t('nav.fscTypes'),
              path: '/fsc-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'strapping-types',
              label: t('nav.strappingTypes'),
              path: '/strapping-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'complements',
              label: t('nav.complements'),
              path: '/complements',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'trace-types',
              label: t('nav.traceTypes'),
              path: '/trace-types',
              icon: 'Layers',
              roles: ['admin', 'superAdmin'],
            },
          ],
        },
      ],
    },
    {
      id: 'production',
      label: t('nav.production'),
      icon: 'Package',
      roles: ['admin', 'superAdmin'],
      children: [
        {
          id: 'stock',
          label: t('nav.stock'),
          icon: 'Warehouse',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'paper-stock',
              label: t('nav.paperStock'),
              path: '/paper-stock',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'sheet-stock',
              label: t('nav.sheetStock'),
              path: '/sheet-stock',
              icon: 'FileText',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'tooling-stock',
              label: t('nav.toolingStock'),
              path: '/tooling-stock',
              icon: 'Wrench',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'consumable-stock',
              label: t('nav.consumableStock'),
              path: '/consumable-stock',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
          ],
        },
      ],
    },
    // RBAC administration — visible with the roles.edit permission (or its
    // read-only variant); legacy admins pass via the transition fallback.
    ...(has('roles.edit', { allowReadOnly: true })
      ? [
          {
            id: 'administration',
            label: t('nav.administration'),
            icon: 'ShieldCheck',
            // The has('roles.edit') check above is the real gate — include
            // 'member' so an RBAC-granted non-admin isn't filtered out by the
            // legacy role filter below.
            roles: ['member', 'admin', 'superAdmin'],
            children: [
              {
                id: 'roles',
                label: t('nav.roles'),
                path: '/roles',
                icon: 'ShieldCheck',
                roles: ['member', 'admin', 'superAdmin'],
              },
            ],
          } as NavItem,
        ]
      : []),
  ];

  const getIcon = (iconName: string, className: string = "h-5 w-5") => {
    const icons = {
      LayoutDashboard,
      Tag,
      UserCircle,
      Warehouse,
      Layers,
      FileText,
      Package,
      Wrench,
      Box,
      BookOpen,
      ChevronDown,
      ChevronRight,
      ChevronLeft,
      Truck,
      Database,
      PanelLeftClose,
      PanelLeft,
      ShieldCheck,
      MapPin,
      Boxes,
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isChildActive = (children?: NavItem[]): boolean => {
    if (!children) return false;
    return children.some((child) => {
      if (child.path === location.pathname) return true;
      if (child.children) return isChildActive(child.children);
      return false;
    });
  };

  const findParentIds = (items: NavItem[], targetPath: string, parentIds: string[] = []): string[] => {
    for (const item of items) {
      if (item.path === targetPath) {
        return parentIds;
      }
      if (item.children) {
        const foundIds = findParentIds(item.children, targetPath, [...parentIds, item.id]);
        if (foundIds.length > parentIds.length) {
          return foundIds;
        }
      }
    }
    return [];
  };

  useEffect(() => {
    const parentIds = findParentIds(navigationItems, location.pathname);
    if (parentIds.length > 0) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        parentIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const filteredNavigation = navigationItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  const renderNavItem = (item: NavItem, depth: number): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.path ? location.pathname === item.path : false;
    const hasActiveChild = isChildActive(item.children);

    const iconSize = depth === 0 ? 'h-5 w-5' : 'h-4 w-4';
    const textSize = depth === 0 ? '' : 'text-sm';

    if (isCollapsed && depth === 0) {
      if (hasChildren) {
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => toggleExpanded(item.id)}
              title={item.label}
              className={`sidebar-item ${
                hasActiveChild ? 'sidebar-item-active' : 'sidebar-item-inactive'
              } w-full justify-center`}
            >
              {getIcon(item.icon, iconSize)}
            </button>
          </div>
        );
      }
      return (
        <NavLink
          key={item.id}
          to={item.path!}
          title={item.label}
          className={`sidebar-item ${
            isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
          } justify-center`}
        >
          {getIcon(item.icon, iconSize)}
        </NavLink>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`sidebar-item ${
              hasActiveChild ? 'sidebar-item-active' : 'sidebar-item-inactive'
            } w-full text-left justify-between`}
          >
            <div className="flex items-center">
              {getIcon(item.icon, iconSize)}
              <span className={`ml-3 ${textSize}`}>{item.label}</span>
            </div>
            {getIcon(isExpanded ? 'ChevronDown' : 'ChevronRight', 'h-4 w-4')}
          </button>
          {isExpanded && item.children && (
            <div className="ml-[1.375rem] space-y-1 border-l border-secondary-200 pl-3">
              {item.children
                .filter((child) => user ? child.roles.includes(user.role) : false)
                .map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={item.path!}
        className={`sidebar-item ${
          isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
        }`}
      >
        {getIcon(item.icon, iconSize)}
        <span className={`ml-3 ${textSize}`}>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div
      className={`flex flex-col bg-white border-r border-secondary-200 h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-secondary-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold shadow-sm">
              M
            </div>
            <span className="text-lg font-bold tracking-tight text-secondary-900">
              Mobius
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 transition-colors"
          title={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className={`border-b border-secondary-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div
            className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"
            title={isCollapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
          >
            <span className="text-sm font-medium text-primary-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-secondary-500 capitalize truncate">
                {user?.role}
                {user?.companyName && ` • ${user.companyName}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'superAdmin' && !isCollapsed && (
        <div className="px-4 py-2 border-b border-secondary-200">
          <CompanySwitcher />
        </div>
      )}

      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {filteredNavigation.map((item) => renderNavItem(item, 0))}
      </nav>

      {!isCollapsed && (
        <div className="px-4 py-2 border-t border-secondary-200">
          <LanguageSwitcher />
        </div>
      )}

      <div className={`border-t border-secondary-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? t('nav.signOut') : undefined}
          className={`sidebar-item sidebar-item-inactive w-full ${isCollapsed ? 'justify-center' : 'text-left'}`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">{t('nav.signOut')}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
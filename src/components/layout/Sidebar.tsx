import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  Factory,
  Route,
  Cog,
  ScrollText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { NavItem } from '../../types';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import CompanySwitcher from '../ui/CompanySwitcher';
import { logger } from '../../utils/logger';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

/**
 * Surviving remounts: every page renders its own <Layout>, and the routes are
 * flat rather than nested under a layout route, so navigating unmounts this
 * Sidebar and mounts a fresh one. The new <nav> is a new DOM node, so its
 * scrollTop starts at 0 and the rail jumps back to the top on every click.
 * Module scope (not state) deliberately: the value has to outlive the
 * component instance, and writing it must not trigger a re-render on scroll.
 */
let navScrollTop = 0;

/**
 * ...and the same applies to which groups are open. Restoring only the scroll
 * offset is not enough: a remount starts with every group collapsed, the nav
 * gets much shorter, and the browser clamps the restored scrollTop to the new
 * (smaller) maximum — the rail still jumps, just less far. Keeping both means
 * the rail comes back exactly as the user left it.
 */
let expandedItemIds: string[] = [];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { has } = usePermissions();
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);

  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set(expandedItemIds));
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  // Restore before paint so the rail never flashes at the top. Keyed on
  // `expandedItems` because the effect below re-expands the active item's
  // parents a render after mount: that changes the nav's height, so the offset
  // has to be re-applied once it settles or it clamps against a stale height.
  // Re-running on a manual toggle is a no-op, since onScroll keeps
  // `navScrollTop` equal to where the user actually is. Same pass also mirrors
  // the open groups into module scope for the next mount to pick up.
  useLayoutEffect(() => {
    expandedItemIds = Array.from(expandedItems); // tsconfig target predates es2015 spread-over-Set
    const el = navRef.current;
    if (el) el.scrollTop = navScrollTop;
  }, [expandedItems]);

  /**
   * Collapsed rail: two separate affordances, because they answer two
   * different questions.
   *
   * `tip`     — hover/focus, instant, the section name and nothing else. The
   *             native `title` took about a second to appear and rendered in
   *             OS chrome that ignores the design.
   * `submenu` — click, and it stays open. Collapsed, a group icon used to be a
   *             dead control: it toggled `expandedItems`, but the collapsed
   *             branch never renders children, so nothing happened and the
   *             group was unreachable without expanding the whole rail.
   *
   * Both are `position: fixed` rather than absolutely-positioned children
   * because the <nav> is overflow-y-auto and would clip them against its edge.
   */
  const [tip, setTip] = useState<
    { label: string; top: number; left: number } | null
  >(null);
  const [submenu, setSubmenu] = useState<
    { item: NavItem; top: number; left: number } | null
  >(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);

  // Anchor off the rail's right edge, not the icon's: the icon sits inside the
  // rail's padding, so its own rect leaves a panel overlapping the border.
  const railRightOf = (el: HTMLElement) => {
    const rail = el.closest('.gd-sidebar');
    return rail
      ? rail.getBoundingClientRect().right
      : el.getBoundingClientRect().right;
  };

  const showTip = (label: string, el: HTMLElement, itemId?: string) => {
    // While a group's submenu is open, its own name is redundant.
    if (itemId && submenu?.item.id === itemId) return;
    const rect = el.getBoundingClientRect();
    setTip({
      label,
      top: rect.top + rect.height / 2,
      left: railRightOf(el) + 8,
    });
  };
  const hideTip = () => setTip(null);

  const toggleSubmenu = (item: NavItem, el: HTMLElement) => {
    setTip(null);
    setSubmenu((current) => {
      if (current && current.item.id === item.id) return null;
      const rect = el.getBoundingClientRect();
      return { item, top: rect.top, left: railRightOf(el) + 8 };
    });
  };

  // A group near the bottom of the rail can be taller than the space below it
  // (Maestros carries 36 links). Measure once mounted and pull it back into the
  // viewport by writing the style directly — adjusting state here would just
  // cause a second render for the same paint.
  useLayoutEffect(() => {
    const el = submenuRef.current;
    if (!el || !submenu) return;
    const maxTop = window.innerHeight - el.offsetHeight - 8;
    el.style.top = `${Math.max(8, Math.min(submenu.top, maxTop))}px`;
  }, [submenu]);

  // An open submenu is dismissed by clicking away or pressing Escape. The
  // trigger is excluded so its own click toggles rather than close-then-reopen.
  useEffect(() => {
    if (!submenu) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (submenuRef.current?.contains(target as Node)) return;
      if (target?.closest?.('[data-submenu-trigger]')) return;
      setSubmenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSubmenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [submenu]);

  useEffect(() => {
    if (!isCollapsed) {
      setTip(null);
      setSubmenu(null);
    }
  }, [isCollapsed]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  };

  const navigationItems: NavItem[] = [
    // Pedidos — the vendedor's daily entry point, so it leads the sidebar.
    {
      id: 'sales-orders',
      label: t('nav.salesOrders'),
      path: '/sales-orders',
      icon: 'FileText',
      roles: ['admin', 'superAdmin'],
    },
    {
      id: 'production-orders',
      label: t('nav.productionOrders'),
      path: '/production-orders',
      icon: 'Factory',
      roles: ['admin', 'superAdmin'],
    },
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
            {
              id: 'parts',
              label: t('nav.parts'),
              path: '/parts',
              icon: 'Package',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'models',
              label: t('nav.models'),
              path: '/models',
              icon: 'Box',
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
          id: 'production',
          label: t('nav.production'),
          icon: 'Factory',
          roles: ['admin', 'superAdmin'],
          children: [
            {
              id: 'production-routes',
              label: t('nav.productionRoutes'),
              path: '/production-routes',
              icon: 'Route',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'machines',
              label: t('nav.machines'),
              path: '/machines',
              icon: 'Factory',
              roles: ['admin', 'superAdmin'],
            },
            {
              id: 'machine-types',
              label: t('nav.machineTypes'),
              path: '/machine-types',
              icon: 'Cog',
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
    // Auditoría — visible with the audit.read permission (or its read-only
    // variant); legacy admins pass via the transition fallback. The route in
    // App.tsx is gated on the very same code, so link and page agree (L-011).
    ...(has('audit.read', { allowReadOnly: true })
      ? [
          {
            id: 'audit-logs',
            label: t('nav.audit'),
            path: '/audit-logs',
            icon: 'ScrollText',
            // The has('audit.read') check above is the real gate — include
            // 'member' so an RBAC-granted non-admin isn't filtered out by the
            // legacy role filter below.
            roles: ['member', 'admin', 'superAdmin'],
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
      Factory,
      Route,
      Cog,
      ScrollText,
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

  const renderSubmenuItems = (items: NavItem[]): React.ReactNode =>
    items
      .filter((child) => (user ? child.roles.includes(user.role) : false))
      .map((child) => {
        if (child.children && child.children.length > 0) {
          return (
            <div key={child.id} className="gd-sb-menu__group">
              <span className="gd-sb-menu__grouplabel">{child.label}</span>
              {renderSubmenuItems(child.children)}
            </div>
          );
        }
        if (!child.path) return null; // neither a link nor a group: nothing to show
        return (
          <NavLink
            key={child.id}
            to={child.path}
            className="gd-sb-menu__link"
            onClick={() => setSubmenu(null)}
          >
            {child.label}
          </NavLink>
        );
      });

  const renderNavItem = (item: NavItem, depth: number): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.path ? location.pathname === item.path : false;
    const hasActiveChild = isChildActive(item.children);

    const iconSize = depth === 0 ? 'h-5 w-5' : 'h-4 w-4';
    const textSize = depth === 0 ? '' : 'text-sm';

    if (isCollapsed && depth === 0) {
      // `aria-label` takes over the accessible name that `title` used to
      // provide: these controls are icon-only and the tooltip is presentational.
      const hoverProps = {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
          showTip(item.label, e.currentTarget, item.id),
        onMouseLeave: hideTip,
        onFocus: (e: React.FocusEvent<HTMLElement>) =>
          showTip(item.label, e.currentTarget, item.id),
        onBlur: hideTip,
      };

      if (hasChildren) {
        return (
          <div key={item.id} className="relative group">
            <button
              data-submenu-trigger
              onClick={(e) => toggleSubmenu(item, e.currentTarget)}
              aria-label={item.label}
              aria-haspopup="menu"
              aria-expanded={submenu?.item.id === item.id}
              {...hoverProps}
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
          aria-label={item.label}
          {...hoverProps}
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
      className={`gd-sidebar flex flex-col h-full transition-all duration-300 ${
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

      <nav
        ref={navRef}
        onScroll={(e) => {
          navScrollTop = e.currentTarget.scrollTop;
          // Both panels are anchored to an icon's rect, which the scroll
          // invalidates.
          setTip(null);
          setSubmenu(null);
        }}
        className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}
      >
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
          aria-label={isCollapsed ? t('nav.signOut') : undefined}
          onMouseEnter={
            isCollapsed ? (e) => showTip(t('nav.signOut'), e.currentTarget) : undefined
          }
          onMouseLeave={isCollapsed ? hideTip : undefined}
          onFocus={
            isCollapsed ? (e) => showTip(t('nav.signOut'), e.currentTarget) : undefined
          }
          onBlur={isCollapsed ? hideTip : undefined}
          className={`sidebar-item sidebar-item-inactive w-full ${isCollapsed ? 'justify-center' : 'text-left'}`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">{t('nav.signOut')}</span>}
        </button>
      </div>

      {isCollapsed && tip && (
        <div
          role="tooltip"
          className="gd-sb-tip"
          style={{ top: tip.top, left: tip.left }}
        >
          {tip.label}
        </div>
      )}

      {isCollapsed && submenu && (
        <div
          ref={submenuRef}
          role="menu"
          aria-label={submenu.item.label}
          className="gd-sb-menu"
          style={{ top: submenu.top, left: submenu.left }}
        >
          <span className="gd-sb-menu__title">{submenu.item.label}</span>
          {submenu.item.children && submenu.item.children.length > 0 && (
            <div className="gd-sb-menu__list">
              {renderSubmenuItems(submenu.item.children)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
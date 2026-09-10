/**
 * Pages registration file.
 *
 * Each page module calls Pages.register() to declare itself.
 * The shell iterates the registry to build the sidebar and route pages.
 *
 * Registration format:
 *   Pages.register({
 *     id: 'events-list',
 *     label: 'Events',
 *     icon: '🎬',
 *     section: 'Events',
 *     permission: 'events:read',    // optional — hides if missing
 *     module: EventsListPage,
 *   });
 */

(function () {
  'use strict';

  Pages.register({
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    section: 'Overview',
    module: DashboardPage,
  });

  Pages.register({
    id: 'events-list',
    label: 'Events',
    icon: '🎬',
    section: 'Events',
    permission: 'events:read',
    module: EventsListPage,
  });

  Pages.register({
    id: 'organizations-list',
    label: 'Organizations',
    icon: '🏢',
    section: 'Organizations',
    permission: 'organizations:read',
    module: OrganizationsListPage,
  });

  Pages.register({
    id: 'managers-list',
    label: 'Managers',
    icon: '👤',
    section: 'Admin',
    permission: 'managers:read',
    module: ManagersListPage,
  });

  Pages.register({
    id: 'movies-list',
    label: 'Movies',
    icon: '🎞',
    section: 'Cinema',
    permission: 'movies:read',
    module: MoviesListPage,
  });

  Pages.register({
    id: 'showtimes-list',
    label: 'Showtimes',
    icon: '🕐',
    section: 'Cinema',
    permission: 'showtimes:read',
    module: ShowtimesListPage,
  });

  Pages.register({
    id: 'turf-list',
    label: 'Turf Venues',
    icon: '⚽',
    section: 'Turf',
    permission: 'turf:read',
    module: TurfListPage,
  });

  Pages.register({
    id: 'media-list',
    label: 'Media Library',
    icon: '🖼',
    section: 'Media',
    permission: 'media:read',
    module: MediaListPage,
  });

  Pages.register({
    id: 'banners-list',
    label: 'Banners',
    icon: '📢',
    section: 'Media',
    permission: 'banners:read',
    module: BannersListPage,
  });

  Pages.register({
    id: 'promotions-packages',
    label: 'Ad Packages',
    icon: '📦',
    section: 'Promotions',
    permission: 'promotions:read',
    module: PromotionPackagesPage,
  });

  Pages.register({
    id: 'promotions-campaigns',
    label: 'Campaigns',
    icon: '📊',
    section: 'Promotions',
    permission: 'promotions:read',
    module: PromotionCampaignsPage,
  });

  Pages.register({
    id: 'users-list',
    label: 'Users',
    icon: '👥',
    section: 'People',
    permission: 'users:read',
    module: UsersListPage,
  });

  Pages.register({
    id: 'bookings-list',
    label: 'Bookings',
    icon: '🎫',
    section: 'Operations',
    permission: 'bookings:read',
    module: BookingsListPage,
  });

  Pages.register({
    id: 'refunds-list',
    label: 'Refunds',
    icon: '💸',
    section: 'Operations',
    permission: 'refunds:read',
    module: RefundsListPage,
  });

  Pages.register({
    id: 'team-list',
    label: 'Admin Team',
    icon: '🛡',
    section: 'Admin',
    permission: 'team:read',
    module: TeamListPage,
  });

  Pages.register({
    id: 'audit-logs-list',
    label: 'Audit Logs',
    icon: '📋',
    section: 'Operations',
    permission: 'audit:read',
    module: AuditLogsPage,
  });

})();

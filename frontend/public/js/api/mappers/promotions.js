/**
 * Normalize promotion package/campaign/analytics response data.
 *
 * Promotion endpoints return snake_case from mutation operations.
 * This mapper normalizes to camelCase for the frontend.
 */

const PromotionMapper = (function () {
  'use strict';

  // Package field mappings
  const packageFieldMap = {
    package_name: 'packageName',
    display_name: 'displayName',
    description: 'description',
    price_in_paise: 'priceInPaise',
    validity_days: 'validityDays',
    max_events: 'maxEvents',
    features: 'features',
    is_active: 'isActive',
    is_popular: 'isPopular',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  // Campaign field mappings
  const campaignFieldMap = {
    campaign_name: 'campaignName',
    package_id: 'packageId',
    organization_id: 'organizationId',
    event_id: 'eventId',
    budget_in_paise: 'budgetInPaise',
    spend_in_paise: 'spendInPaise',
    remaining_budget_in_paise: 'remainingBudgetInPaise',
    status: 'status',
    starts_at: 'startsAt',
    ends_at: 'endsAt',
    approved_at: 'approvedAt',
    rejected_at: 'rejectedAt',
    rejection_reason: 'rejectionReason',
    admin_notes: 'adminNotes',
    total_impressions: 'totalImpressions',
    total_clicks: 'totalClicks',
    total_conversions: 'totalConversions',
    is_active: 'isActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  // Analytics field mappings
  const analyticsFieldMap = {
    campaign_id: 'campaignId',
    date: 'date',
    impressions: 'impressions',
    clicks: 'clicks',
    conversions: 'conversions',
    spend_in_paise: 'spendInPaise',
  };

  function normalizePackage(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const out = {};
    Object.keys(raw).forEach(k => {
      const camel = packageFieldMap[k] || k;
      out[camel] = raw[k];
    });
    return out;
  }

  function normalizeCampaign(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const out = {};
    Object.keys(raw).forEach(k => {
      const camel = campaignFieldMap[k] || k;
      out[camel] = raw[k];
    });
    return out;
  }

  function normalizeAnalytics(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    if (Array.isArray(raw)) {
      return raw.map(normalizeAnalytics);
    }
    const out = {};
    Object.keys(raw).forEach(k => {
      const camel = analyticsFieldMap[k] || k;
      out[camel] = raw[k];
    });
    return out;
  }

  function normalizeList(data, type) {
    if (!data) return [];
    const items = data.data || data;
    if (!Array.isArray(items)) return [];
    const pagination = data.pagination || null;
    const normalizer = type === 'campaign' ? normalizeCampaign : normalizePackage;
    return {
      items: items.map(normalizer),
      pagination,
    };
  }

  return Object.freeze({
    normalizePackage,
    normalizeCampaign,
    normalizeAnalytics,
    normalizeList,
  });
})();

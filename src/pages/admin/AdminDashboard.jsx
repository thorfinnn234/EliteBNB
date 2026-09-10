import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  FileWarning,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dashboardEditorialImage from "../../assets/home/property-seaside-interior.jpg";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/adminService";
import "./AdminDashboard.css";

const chartFrame = {
  height: 240,
  padding: {
    bottom: 42,
    left: 54,
    right: 24,
    top: 24,
  },
  width: 680,
};

const initialDashboardState = {
  analytics: {},
  dashboard: null,
  errors: [],
  loading: true,
  overview: null,
};

const analyticsRequests = [
  {
    key: "usersGrowth",
    label: "User growth",
    load: adminService.getUsersGrowthAnalytics,
  },
  {
    key: "hostsGrowth",
    label: "Host growth",
    load: adminService.getHostsGrowthAnalytics,
  },
  {
    key: "monthlyBookings",
    label: "Monthly bookings",
    load: adminService.getMonthlyBookingsAnalytics,
  },
  {
    key: "monthlyRevenue",
    label: "Monthly revenue",
    load: adminService.getMonthlyRevenueAnalytics,
  },
  {
    key: "bookingStatuses",
    label: "Booking statuses",
    load: adminService.getBookingStatusAnalytics,
  },
  {
    key: "paymentStatuses",
    label: "Payment statuses",
    load: adminService.getPaymentStatusAnalytics,
  },
  {
    key: "propertyStatuses",
    label: "Property statuses",
    load: adminService.getPropertyStatusAnalytics,
  },
  {
    key: "propertyApprovals",
    label: "Property approvals",
    load: adminService.getPropertyApprovalAnalytics,
  },
];

const dashboardRequests = [
  {
    key: "dashboard",
    label: "Dashboard summary",
    load: adminService.getDashboard,
  },
  {
    key: "overview",
    label: "Analytics overview",
    load: adminService.getAnalyticsOverview,
  },
  ...analyticsRequests,
];

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  currency: "NGN",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-NG", {
  currency: "NGN",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-NG");
const compactNumberFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 1,
  notation: "compact",
});

/**
 * Pulls a readable error message from Axios failures without exposing internal
 * response details. The page still keeps successful widgets visible when only
 * one analytics endpoint fails.
 */
function getRequestErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Unable to load this Admin data."
  );
}

/**
 * Converts backend numbers into display-safe values. Null/undefined/invalid
 * values stay unavailable instead of flashing misleading zeroes.
 */
function toNumber(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Allows summary metrics to use the dashboard response first, then the overview
 * response only when the same genuine value is missing from the summary.
 */
function firstAvailableNumber(...values) {
  for (const value of values) {
    const parsed = toNumber(value);

    if (parsed !== null) return parsed;
  }

  return null;
}

function formatNumber(value) {
  const parsed = toNumber(value);

  return parsed === null ? "Unavailable" : numberFormatter.format(parsed);
}

function formatCompactNumber(value) {
  const parsed = toNumber(value);

  return parsed === null ? "N/A" : compactNumberFormatter.format(parsed);
}

function formatCurrency(value) {
  const parsed = toNumber(value);

  return parsed === null ? "Unavailable" : currencyFormatter.format(parsed);
}

function formatCompactCurrency(value) {
  const parsed = toNumber(value);

  return parsed === null ? "N/A" : compactCurrencyFormatter.format(parsed);
}

/**
 * Analytics endpoints are documented as arrays of { label, value } records.
 * The unwrap only tolerates a common `{ data: [...] }` response wrapper; it does
 * not invent alternate field names or synthetic values.
 */
function normalizeAnalyticsSeries(payload) {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return source
    .map((item) => {
      const value = toNumber(item?.value);

      if (!item?.label || value === null) return null;

      return {
        label: String(item.label),
        value,
      };
    })
    .filter(Boolean);
}

function getErrorByKey(errors, key) {
  return errors.find((error) => error.key === key);
}

function getMetricSubtitle(parts) {
  const availableParts = parts.filter(Boolean);

  return availableParts.length > 0
    ? availableParts.join(" / ")
    : "Awaiting backend value";
}

function getAdminFirstName(user) {
  return user?.firstName || user?.name?.split(" ")?.[0] || "Admin";
}

function getDashboardDateLabel() {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getTimeAwareGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function getTickValues(maxValue) {
  return maxValue > 0 ? [maxValue, maxValue / 2, 0] : [0];
}

function getChartGeometry() {
  const { height, padding, width } = chartFrame;

  return {
    bottom: height - padding.bottom,
    height,
    left: padding.left,
    plotHeight: height - padding.top - padding.bottom,
    plotWidth: width - padding.left - padding.right,
    right: width - padding.right,
    top: padding.top,
    width,
  };
}

function shouldShowAxisLabel(index, length) {
  if (length <= 5) return true;

  const interval = Math.ceil((length - 1) / 4);

  return index === 0 || index === length - 1 || index % interval === 0;
}

function getChartMax(series) {
  return Math.max(...series.map((item) => item.value), 0);
}

function getPointX(index, length, geometry) {
  if (length <= 1) {
    return geometry.left + geometry.plotWidth / 2;
  }

  return geometry.left + (index / (length - 1)) * geometry.plotWidth;
}

function getPointY(value, maxValue, geometry) {
  if (maxValue <= 0) {
    return geometry.bottom;
  }

  return geometry.bottom - (value / maxValue) * geometry.plotHeight;
}

/**
 * Displays one high-level Admin metric from genuine dashboard/overview data.
 * The revenue metric gets more typographic scale without becoming a generic
 * oversized SaaS tile.
 */
function AdminMetricCard({ icon: Icon, label, value, subtitle, lead }) {
  return (
    <article className={`elite-admin-metric${lead ? " elite-admin-metric--lead" : ""}`}>
      <div className="elite-admin-metric__header">
        <span className="elite-admin-metric__label">{label}</span>
        <span className="elite-admin-metric__icon" aria-hidden="true">
          <Icon size={19} strokeWidth={1.85} />
        </span>
      </div>

      <strong>{value}</strong>
      <p>{subtitle}</p>
    </article>
  );
}

/**
 * Small route row for real operational queues returned by analytics overview.
 * Counts greater than zero receive priority styling; zero remains calm so the
 * interface does not imply unnecessary urgency.
 */
function AttentionItem({ count, description, icon: Icon, label, to }) {
  const parsedCount = toNumber(count);
  const needsAction = parsedCount !== null && parsedCount > 0;

  return (
    <Link
      to={to}
      className={`elite-admin-attention__item${
        needsAction ? " elite-admin-attention__item--active" : ""
      }`}
    >
      <span className="elite-admin-attention__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.85} />
      </span>

      <span className="elite-admin-attention__copy">
        <small>{label}</small>
        <em>{description}</em>
      </span>

      <strong>{formatNumber(count)}</strong>
      <ArrowRight size={16} strokeWidth={1.85} aria-hidden="true" />
    </Link>
  );
}

/**
 * Professional SVG line chart using solid brand strokes.
 * A single data point is rendered as a centered point instead of stretching
 * across the chart, which avoids the old giant-capsule visual bug.
 */
function LineChart({
  formatter = formatCompactNumber,
  label,
  series,
  tone = "navy",
}) {
  const geometry = getChartGeometry();
  const maxValue = getChartMax(series);
  const points = series.map((item, index) => ({
    ...item,
    x: getPointX(index, series.length, geometry),
    y: getPointY(item.value, maxValue, geometry),
  }));
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const tickValues = getTickValues(maxValue);

  return (
    <svg
      className={`elite-admin-line-chart elite-admin-line-chart--${tone}`}
      role="img"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      aria-label={label}
    >
      {tickValues.map((tickValue) => {
        const y = getPointY(tickValue, maxValue, geometry);

        return (
          <g key={tickValue}>
            <line
              x1={geometry.left}
              x2={geometry.right}
              y1={y}
              y2={y}
              className="elite-admin-chart-gridline"
            />
            <text
              x={geometry.left - 12}
              y={y + 4}
              className="elite-admin-chart-axis elite-admin-chart-axis--y"
            >
              {formatter(tickValue)}
            </text>
          </g>
        );
      })}

      {points.length > 1 ? (
        <polyline className="elite-admin-line-chart__line" points={pointString} />
      ) : null}

      {points.map((point, index) => (
        <g key={`${point.label}-${point.value}`}>
          <circle
            className="elite-admin-line-chart__point"
            cx={point.x}
            cy={point.y}
            r={points.length === 1 ? 5 : 4}
          >
            <title>{`${point.label}: ${formatter(point.value)}`}</title>
          </circle>

          {shouldShowAxisLabel(index, points.length) ? (
            <text
              x={point.x}
              y={geometry.height - 14}
              className="elite-admin-chart-axis elite-admin-chart-axis--x"
            >
              {point.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/**
 * Solid-color column chart for monthly counts.
 * Bars are capped at a measured width so one month never becomes a huge rounded
 * block across the whole panel.
 */
function ColumnChart({
  formatter = formatCompactNumber,
  label,
  series,
}) {
  const geometry = getChartGeometry();
  const maxValue = getChartMax(series);
  const gap = series.length > 12 ? 5 : 12;
  const rawBarWidth =
    (geometry.plotWidth - gap * Math.max(series.length - 1, 0)) /
    Math.max(series.length, 1);
  const barWidth = Math.min(42, Math.max(6, rawBarWidth));
  const totalBarWidth = series.length * barWidth + Math.max(series.length - 1, 0) * gap;
  const startX = geometry.left + Math.max((geometry.plotWidth - totalBarWidth) / 2, 0);
  const tickValues = getTickValues(maxValue);

  return (
    <svg
      className="elite-admin-column-chart"
      role="img"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      aria-label={label}
    >
      {tickValues.map((tickValue) => {
        const y = getPointY(tickValue, maxValue, geometry);

        return (
          <g key={tickValue}>
            <line
              x1={geometry.left}
              x2={geometry.right}
              y1={y}
              y2={y}
              className="elite-admin-chart-gridline"
            />
            <text
              x={geometry.left - 12}
              y={y + 4}
              className="elite-admin-chart-axis elite-admin-chart-axis--y"
            >
              {formatter(tickValue)}
            </text>
          </g>
        );
      })}

      {series.map((item, index) => {
        const valueHeight =
          maxValue > 0 ? Math.max((item.value / maxValue) * geometry.plotHeight, 4) : 0;
        const x = startX + index * (barWidth + gap);
        const y = geometry.bottom - valueHeight;

        return (
          <g key={`${item.label}-${item.value}`}>
            <rect
              className={
                index % 3 === 0
                  ? "elite-admin-column-chart__bar elite-admin-column-chart__bar--gold"
                  : "elite-admin-column-chart__bar"
              }
              x={x}
              y={y}
              width={barWidth}
              height={valueHeight}
              rx="4"
            >
              <title>{`${item.label}: ${formatter(item.value)}`}</title>
            </rect>

            {shouldShowAxisLabel(index, series.length) ? (
              <text
                x={x + barWidth / 2}
                y={geometry.height - 14}
                className="elite-admin-chart-axis elite-admin-chart-axis--x"
              >
                {item.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function getDistributionTone(label) {
  const normalizedLabel = String(label).toLowerCase();

  if (
    normalizedLabel.includes("success") ||
    normalizedLabel.includes("confirmed") ||
    normalizedLabel.includes("active") ||
    normalizedLabel.includes("approved") ||
    normalizedLabel.includes("completed")
  ) {
    return "positive";
  }

  if (
    normalizedLabel.includes("failed") ||
    normalizedLabel.includes("cancel") ||
    normalizedLabel.includes("reject")
  ) {
    return "critical";
  }

  if (
    normalizedLabel.includes("pending") ||
    normalizedLabel.includes("request")
  ) {
    return "attention";
  }

  return "neutral";
}

/**
 * Renders categorical analytics as measured horizontal rows.
 * Solid color tokens communicate status without oversized decorative donuts or
 * gradient-filled progress shapes.
 */
function DistributionChart({ formatter = formatNumber, series }) {
  const total = series.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="elite-admin-distribution">
      {series.map((item) => {
        const width = total > 0 ? Math.max((item.value / total) * 100, 4) : 4;
        const tone = getDistributionTone(item.label);

        return (
          <div
            key={`${item.label}-${item.value}`}
            className={`elite-admin-distribution__row elite-admin-distribution__row--${tone}`}
          >
            <div>
              <span>{item.label}</span>
              <strong>{formatter(item.value)}</strong>
            </div>

            <div
              className="elite-admin-distribution__track"
              aria-label={`${item.label}: ${formatter(item.value)}`}
            >
              <span style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Shared chart shell that handles loading, empty, and endpoint-level failure
 * states independently so one failed analytics call does not collapse the
 * entire command center.
 */
function DashboardChartCard({
  children,
  description,
  error,
  loading,
  priority = "standard",
  series,
  title,
}) {
  const hasSeries = series.length > 0;

  return (
    <article className={`elite-admin-chart-card elite-admin-chart-card--${priority}`}>
      <div className="elite-admin-chart-card__header">
        <div>
          <span>{description}</span>
          <h3>{title}</h3>
        </div>
        <BarChart3 size={19} strokeWidth={1.85} aria-hidden="true" />
      </div>

      {loading ? (
        <div className="elite-admin-chart-card__skeleton" aria-label="Loading chart" />
      ) : error ? (
        <div className="elite-admin-chart-card__empty" role="status">
          <strong>Unable to load chart</strong>
          <p>{error.message}</p>
        </div>
      ) : hasSeries ? (
        children
      ) : (
        <div className="elite-admin-chart-card__empty" role="status">
          <strong>No analytics returned</strong>
          <p>The backend returned an empty series for this chart.</p>
        </div>
      )}
    </article>
  );
}

/**
 * Keeps loading visual structure close to the final layout without flashing
 * zero values. The animation is a restrained opacity pulse, not a bright
 * gradient sweep.
 */
function SkeletonDashboard() {
  return (
    <div className="elite-admin-dashboard">
      <section className="elite-admin-dashboard__header">
        <div className="elite-admin-skeleton elite-admin-skeleton--title" />
        <div className="elite-admin-skeleton elite-admin-skeleton--image" />
      </section>

      <div className="elite-admin-dashboard__metric-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="elite-admin-skeleton elite-admin-skeleton--metric"
          />
        ))}
      </div>

      <div className="elite-admin-dashboard__chart-grid elite-admin-dashboard__chart-grid--primary">
        <div className="elite-admin-skeleton elite-admin-skeleton--chart" />
        <div className="elite-admin-skeleton elite-admin-skeleton--chart" />
      </div>
    </div>
  );
}

function StatusRow({ label, total, value }) {
  const parsedValue = toNumber(value);
  const parsedTotal = toNumber(total);
  const width =
    parsedValue !== null && parsedTotal && parsedTotal > 0
      ? Math.max((parsedValue / parsedTotal) * 100, parsedValue > 0 ? 4 : 0)
      : 0;
  const tone = getDistributionTone(label);

  return (
    <div className={`elite-admin-health__row elite-admin-health__row--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
      <div className="elite-admin-health__track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/**
 * Groups real platform status counts from the dashboard summary without
 * duplicating every metric as a large card.
 */
function PlatformHealth({ dashboard }) {
  const bookingRows = [
    ["Pending", dashboard?.pendingBookings],
    ["Confirmed", dashboard?.confirmedBookings],
    ["Completed", dashboard?.completedBookings],
    ["Cancelled", dashboard?.cancelledBookings],
  ];
  const paymentRows = [
    ["Successful", dashboard?.successfulPayments],
    ["Pending", dashboard?.pendingPayments],
    ["Failed", dashboard?.failedPayments],
  ];
  const bookingTotal = firstAvailableNumber(dashboard?.totalBookings, 0);
  const paymentTotal = firstAvailableNumber(dashboard?.totalPayments, 0);
  const propertyTotal = firstAvailableNumber(dashboard?.totalProperties, 0);

  return (
    <section className="elite-admin-health" aria-labelledby="admin-health-title">
      <div className="elite-admin-section-heading">
        <span>Platform health</span>
        <h2 id="admin-health-title">Status summary</h2>
      </div>

      <div className="elite-admin-health__panel">
        <div className="elite-admin-health__group">
          <h3>Bookings</h3>
          {bookingRows.map(([label, value]) => (
            <StatusRow
              key={label}
              label={label}
              total={bookingTotal}
              value={value}
            />
          ))}
        </div>

        <div className="elite-admin-health__group">
          <h3>Payments</h3>
          {paymentRows.map(([label, value]) => (
            <StatusRow
              key={label}
              label={label}
              total={paymentTotal}
              value={value}
            />
          ))}
        </div>

        <div className="elite-admin-health__group">
          <h3>Properties</h3>
          <StatusRow
            label="Active"
            total={propertyTotal}
            value={dashboard?.activeProperties}
          />
          <StatusRow
            label="Total"
            total={propertyTotal}
            value={dashboard?.totalProperties}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Phase 2 Admin command center.
 * Data is loaded through the finalized Admin endpoints only; failed widgets
 * surface their own errors instead of falling back to mock operational values.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const [dashboardState, setDashboardState] = useState(initialDashboardState);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const settledRequests = await Promise.allSettled(
        dashboardRequests.map((request) => request.load())
      );

      if (!active) return;

      const nextData = {};
      const nextErrors = [];

      settledRequests.forEach((result, index) => {
        const request = dashboardRequests[index];

        if (result.status === "fulfilled") {
          nextData[request.key] = result.value.data;
          return;
        }

        nextErrors.push({
          key: request.key,
          label: request.label,
          message: getRequestErrorMessage(result.reason),
        });
      });

      setDashboardState({
        analytics: analyticsRequests.reduce((analytics, request) => {
          analytics[request.key] = normalizeAnalyticsSeries(nextData[request.key]);
          return analytics;
        }, {}),
        dashboard: nextData.dashboard ?? null,
        errors: nextErrors,
        loading: false,
        overview: nextData.overview ?? null,
      });
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setDashboardState((current) => ({
      ...current,
      errors: [],
      loading: true,
    }));
    setReloadToken((current) => current + 1);
  };

  const { analytics, dashboard, errors, loading, overview } = dashboardState;
  const coreDataUnavailable = !loading && !dashboard && !overview;
  const dashboardPeriod = useMemo(() => getDashboardDateLabel(), []);
  const greeting = useMemo(() => getTimeAwareGreeting(), []);
  const adminFirstName = getAdminFirstName(user);

  const summaryMetrics = useMemo(() => {
    const totalRevenue = firstAvailableNumber(
      dashboard?.totalRevenue,
      overview?.totalRevenue
    );
    const totalUsers = firstAvailableNumber(
      dashboard?.totalUsers,
      overview?.totalUsers
    );
    const totalProperties = firstAvailableNumber(
      dashboard?.totalProperties,
      overview?.totalProperties
    );
    const totalBookings = firstAvailableNumber(
      dashboard?.totalBookings,
      overview?.totalBookings
    );

    return [
      {
        icon: TrendingUp,
        label: "Total Revenue",
        lead: true,
        subtitle: getMetricSubtitle([
          dashboard?.successfulPayments !== undefined
            ? `${formatNumber(dashboard.successfulPayments)} successful payments`
            : "",
        ]),
        value: formatCurrency(totalRevenue),
      },
      {
        icon: Users,
        label: "Total Users",
        subtitle: getMetricSubtitle([
          dashboard?.totalHosts !== undefined
            ? `${formatNumber(dashboard.totalHosts)} hosts`
            : "",
          dashboard?.totalGuests !== undefined
            ? `${formatNumber(dashboard.totalGuests)} guests`
            : "",
        ]),
        value: formatNumber(totalUsers),
      },
      {
        icon: Building2,
        label: "Properties",
        subtitle: getMetricSubtitle([
          dashboard?.activeProperties !== undefined
            ? `${formatNumber(dashboard.activeProperties)} active`
            : "",
          overview?.pendingPropertyApprovals !== undefined
            ? `${formatNumber(overview.pendingPropertyApprovals)} pending approval`
            : "",
        ]),
        value: formatNumber(totalProperties),
      },
      {
        icon: BookOpenCheck,
        label: "Total Bookings",
        subtitle: getMetricSubtitle([
          dashboard?.confirmedBookings !== undefined
            ? `${formatNumber(dashboard.confirmedBookings)} confirmed`
            : "",
          dashboard?.pendingBookings !== undefined
            ? `${formatNumber(dashboard.pendingBookings)} pending`
            : "",
        ]),
        value: formatNumber(totalBookings),
      },
    ];
  }, [dashboard, overview]);

  const attentionItems = [
    {
      count: overview?.pendingPropertyApprovals,
      description: "Properties waiting for Admin review",
      icon: Building2,
      label: "Property approvals",
      to: "/admin/properties",
    },
    {
      count: overview?.pendingHostVerifications,
      description: "Host onboarding cases awaiting verification",
      icon: ShieldCheck,
      label: "Host verification",
      to: "/admin/hosts",
    },
    {
      count: overview?.openReports,
      description: "Moderation reports still open",
      icon: FileWarning,
      label: "Open reports",
      to: "/admin/reports",
    },
    {
      count: overview?.requestedRefunds,
      description: "Refund requests requiring attention",
      icon: RotateCcw,
      label: "Requested refunds",
      to: "/admin/refunds",
    },
  ];

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (coreDataUnavailable) {
    return (
      <section className="elite-admin-dashboard">
        <div className="elite-admin-dashboard__error" role="alert">
          <AlertTriangle size={32} strokeWidth={1.85} />
          <h2>Unable to load Admin dashboard</h2>
          <p>
            The dashboard summary and analytics overview are unavailable. The
            backend response should be checked before showing operational data.
          </p>
          <button type="button" onClick={handleRetry}>
            <RefreshCw size={17} strokeWidth={1.85} />
            Retry dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="elite-admin-dashboard">
      <section className="elite-admin-dashboard__header">
        <div className="elite-admin-dashboard__header-copy">
          <span>Admin overview</span>
          <h2>{greeting}, {adminFirstName}</h2>
          <p>
            A measured view of marketplace activity, platform health and the
            queues that need an administrator's attention.
          </p>

          <div className="elite-admin-dashboard__header-meta">
            <span>{dashboardPeriod}</span>
            <span>{formatNumber(errors.length)} partial issue{errors.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <figure className="elite-admin-dashboard__image-panel">
          <img
            src={dashboardEditorialImage}
            alt=""
            aria-hidden="true"
          />
          <figcaption>
            <CheckCircle2 size={18} strokeWidth={1.8} />
            <span>Backend-authored operations data</span>
          </figcaption>
        </figure>
      </section>

      {errors.length > 0 ? (
        <div className="elite-admin-dashboard__partial-error" role="status">
          <AlertTriangle size={18} strokeWidth={1.85} />
          <span>
            Some dashboard requests failed. Successful sections remain visible:
            {" "}
            {errors.map((error) => error.label).join(", ")}.
          </span>
          <button type="button" onClick={handleRetry}>Retry</button>
        </div>
      ) : null}

      <section
        className="elite-admin-dashboard__metric-grid"
        aria-label="Platform summary metrics"
      >
        {summaryMetrics.map((metric) => (
          <AdminMetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="elite-admin-dashboard__analytics">
        <div className="elite-admin-section-heading">
          <span>Analytics</span>
          <h2>Marketplace movement</h2>
        </div>

        <div className="elite-admin-dashboard__chart-grid elite-admin-dashboard__chart-grid--primary">
          <DashboardChartCard
            description="Monthly settlement"
            error={getErrorByKey(errors, "monthlyRevenue")}
            loading={loading}
            priority="featured"
            series={analytics.monthlyRevenue ?? []}
            title="Revenue trend"
          >
            <LineChart
              formatter={formatCompactCurrency}
              label="Monthly revenue trend"
              series={analytics.monthlyRevenue ?? []}
              tone="gold"
            />
          </DashboardChartCard>

          <DashboardChartCard
            description="Reservation volume"
            error={getErrorByKey(errors, "monthlyBookings")}
            loading={loading}
            series={analytics.monthlyBookings ?? []}
            title="Booking activity"
          >
            <ColumnChart
              label="Monthly booking activity"
              series={analytics.monthlyBookings ?? []}
            />
          </DashboardChartCard>
        </div>
      </section>

      <section className="elite-admin-dashboard__split">
        <div className="elite-admin-attention">
          <div className="elite-admin-section-heading">
            <span>Requires attention</span>
            <h2>Operational queues</h2>
          </div>

          <div className="elite-admin-attention__list">
            {attentionItems.map((item) => (
              <AttentionItem key={item.label} {...item} />
            ))}
          </div>
        </div>

        <PlatformHealth dashboard={dashboard} />
      </section>

      <section className="elite-admin-dashboard__analytics">
        <div className="elite-admin-section-heading">
          <span>Secondary signals</span>
          <h2>Growth and status mix</h2>
        </div>

        <div className="elite-admin-dashboard__chart-grid">
          <DashboardChartCard
            description="Account growth"
            error={getErrorByKey(errors, "usersGrowth")}
            loading={loading}
            series={analytics.usersGrowth ?? []}
            title="Users"
          >
            <LineChart
              label="User growth trend"
              series={analytics.usersGrowth ?? []}
            />
          </DashboardChartCard>

          <DashboardChartCard
            description="Host supply"
            error={getErrorByKey(errors, "hostsGrowth")}
            loading={loading}
            series={analytics.hostsGrowth ?? []}
            title="Hosts"
          >
            <LineChart
              label="Host growth trend"
              series={analytics.hostsGrowth ?? []}
              tone="quiet"
            />
          </DashboardChartCard>

          <DashboardChartCard
            description="Reservation mix"
            error={getErrorByKey(errors, "bookingStatuses")}
            loading={loading}
            series={analytics.bookingStatuses ?? []}
            title="Booking statuses"
          >
            <DistributionChart series={analytics.bookingStatuses ?? []} />
          </DashboardChartCard>

          <DashboardChartCard
            description="Payment state"
            error={getErrorByKey(errors, "paymentStatuses")}
            loading={loading}
            series={analytics.paymentStatuses ?? []}
            title="Payment statuses"
          >
            <DistributionChart series={analytics.paymentStatuses ?? []} />
          </DashboardChartCard>

          <DashboardChartCard
            description="Property health"
            error={getErrorByKey(errors, "propertyStatuses")}
            loading={loading}
            series={analytics.propertyStatuses ?? []}
            title="Property statuses"
          >
            <DistributionChart series={analytics.propertyStatuses ?? []} />
          </DashboardChartCard>

          <DashboardChartCard
            description="Approval flow"
            error={getErrorByKey(errors, "propertyApprovals")}
            loading={loading}
            series={analytics.propertyApprovals ?? []}
            title="Property approvals"
          >
            <DistributionChart series={analytics.propertyApprovals ?? []} />
          </DashboardChartCard>
        </div>
      </section>
    </section>
  );
}

console.log("welcome to dashboard");
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Activity, Users, Pill, UserRound, CalendarDays,
  Truck, ClipboardList, TrendingUp, TrendingDown, ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar
} from "recharts";

/* ---------------------------- helpers (pure) ---------------------------- */
const dkey = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};
const dayLabel = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0);
}

/** Mock orders for a range (deterministic). */
function generateOrders(rangeDays, vendorsInScope) {
  const byVendor = new Map();
  const byDay = [];

  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);

    let dayOrders = 0, dayDelivered = 0, dayPending = 0;

    for (const v of vendorsInScope) {
      const seed = hashStr(v.email + ":" + dkey(d));
      const base = 3 + (seed % 7); // 3..9
      const surge = (d.getDay() === 5 || d.getDay() === 6) ? 2 : 0; // Fri/Sat
      const orders = base + surge;
      const delivered = clamp(orders - (seed % 3), 0, orders); // up to 2 pending
      const pending = orders - delivered;

      dayOrders += orders;
      dayDelivered += delivered;
      dayPending += pending;

      const prev = byVendor.get(v.email) || { name: v.name || v.email, email: v.email, orders: 0, delivered: 0, pending: 0 };
      prev.orders += orders;
      prev.delivered += delivered;
      prev.pending += pending;
      byVendor.set(v.email, prev);
    }

    byDay.push({
      label: dayLabel(d),
      orders: dayOrders,
      delivered: dayDelivered,
      pending: dayPending,
    });
  }
  return { byDay, byVendor };
}

function sum(arr, key) { return arr.reduce((a, b) => a + (b[key] || 0), 0); }
function pctDelta(newV, oldV) {
  if (!oldV && !newV) return 0;
  if (!oldV) return 100;
  return ((newV - oldV) / oldV) * 100;
}
const Trend = ({ value }) => {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? "text-emerald-400" : "text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <Icon size={14} />
      {value === Infinity || value === -Infinity ? "∞%" : `${value.toFixed(1)}%`}
    </span>
  );
};

/* ------------------------------- component ------------------------------ */
export default function Dashboard() {
  const { user, admins = [], vendors = [] } = useAuth();
  const [range, setRange] = useState(7); // 7 | 30 | 90

  // Scope vendors by role
  const vendorsInScope = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") return vendors;
    if (user?.role === "ADMIN") return vendors.filter(v => v.createdByEmail === user.email);
    if (user?.role === "VENDOR") return vendors.filter(v => v.email === user.email);
    return [];
  }, [user, vendors]);

  // Active counts (missing active => true)
  const adminsActive = useMemo(() => admins.filter(a => a.active !== false).length, [admins]);
  const vendorsActive = useMemo(() => vendors.filter(v => v.active !== false).length, [vendors]);

  // Login history series (current & previous range)
  const loginHistory = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("login_history") || "[]"); } catch { return []; }
  }, []);

  const scopeEmails = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") return new Set([...admins.map(a => a.email), ...vendors.map(v => v.email), (user?.email || "").toLowerCase()]);
    if (user?.role === "ADMIN") return new Set([user.email, ...vendorsInScope.map(v => v.email)].map(e => (e || "").toLowerCase()));
    if (user?.role === "VENDOR") return new Set([(user?.email || "").toLowerCase()]);
    return new Set();
  }, [user, admins, vendors, vendorsInScope]);

  function buildLoginSeries(startOffsetDays) {
    const out = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i - startOffsetDays);
      const key = dkey(d);
      const rows = loginHistory.filter(h => {
        const hd = new Date(h.ts); hd.setHours(0, 0, 0, 0);
        const matchDay = dkey(hd) === key;
        const email = (h.email || "").toLowerCase();
        return matchDay && (!scopeEmails.size || scopeEmails.has(email));
      });
      out.push({ label: dayLabel(d), count: rows.length });
    }
    return out;
  }
  const loginSeries = useMemo(() => buildLoginSeries(0), [loginHistory, scopeEmails, range]);
  const loginSeriesPrev = useMemo(() => buildLoginSeries(range), [loginHistory, scopeEmails, range]);
  const loginsCurrent = sum(loginSeries, "count");
  const loginsPrev = sum(loginSeriesPrev, "count");
  const loginsDelta = pctDelta(loginsCurrent, loginsPrev);
  const todayLogins = (loginSeries[loginSeries.length - 1]?.count) || 0;

  // Orders (mock for now; replace with API later)
  const { byDay: ordersSeries, byVendor: ordersByVendor } = useMemo(
    () => generateOrders(range, vendorsInScope),
    [range, vendorsInScope]
  );
  const { byDay: ordersSeriesPrev } = useMemo(
    () => generateOrders(range, vendorsInScope),
    [range, vendorsInScope]
  );
  const ordersTotal = sum(ordersSeries, "orders");
  const deliveredTotal = sum(ordersSeries, "delivered");
  const pendingTotal = sum(ordersSeries, "pending");
  const ordersDelta = pctDelta(ordersTotal, sum(ordersSeriesPrev, "orders"));
  const deliveredToday = ordersSeries[ordersSeries.length - 1]?.delivered || 0;
  const onTimeRate = ordersTotal ? Math.round((deliveredTotal / ordersTotal) * 100) : 0;

  // Top vendors
  const topVendors = useMemo(
    () => Array.from(ordersByVendor.values()).sort((a, b) => b.delivered - a.delivered).slice(0, 5),
    [ordersByVendor]
  );

  // UI bits
  const RangeBtn = ({ d, children }) => (
    <button
      onClick={() => setRange(d)}
      className={`rounded-md px-3 py-1.5 text-sm ${
        range === d ? "bg-white/10 text-white border border-white/15" : "text-gray-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, sub, trend }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{label}</div>
        <div className="rounded-lg bg-white/10 p-2"><Icon size={18} /></div>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-2xl font-semibold">{value}</div>
        {typeof trend === "number" ? <Trend value={trend} /> : null}
      </div>
      {sub ? <div className="mt-1 text-xs text-gray-400">{sub}</div> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
         
          <p className="text-gray-300">
            Welcome {user?.name} <span className="text-gray-500">({user?.role})</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Range:</span>
          <RangeBtn d={7}>7d</RangeBtn>
          <RangeBtn d={30}>30d</RangeBtn>
          <RangeBtn d={90}>90d</RangeBtn>
        </div>
      </header>

      {/* Row 1: Admin/Vendor KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Active Admins"
          value={adminsActive + 1}
          sub={`of ${admins.length + 1} total`}
        />
        <StatCard
          icon={Users}
          label="Total Admins"
          value={admins.length + 1}
          sub={`${admins.length} admins + 1 super`}
        />
        <StatCard
          icon={Pill}
          label="Active Vendors"
          value={vendorsActive}
          sub={`of ${vendors.length} total`}
        />
        <StatCard
          icon={ClipboardList}
          label="Total Vendors"
          value={vendors.length}
          sub="registered suppliers"
        />
      </section>

      {/* Row 2: Orders KPIs (range aware) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label={`Orders (${range}d)`} value={ordersTotal} trend={ordersDelta} sub="all channels (mock)" />
        <StatCard icon={Truck} label="Delivered (range)" value={deliveredTotal} sub={`${onTimeRate}% on-time`} />
        <StatCard icon={CalendarDays} label="Delivered Today" value={deliveredToday} sub="completed drops" />
        <StatCard icon={ClipboardList} label="Pending (range)" value={pendingTotal} sub="awaiting delivery" />
      </section>

      {/* Chart: Orders vs Delivered */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orders & Delivered (last {range} days)</h2>
          <span className="text-xs text-gray-400">
            {user?.role === "SUPER_ADMIN" ? "All vendors" :
             user?.role === "ADMIN" ? "Your vendors" : "Your orders"}
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ordersSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.06}/>
                </linearGradient>
                <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.06}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "rgba(17,24,39,.95)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12 }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#cbd5e1" }}
              />
              <Area type="monotone" dataKey="orders"    stroke="#60a5fa" strokeWidth={2} fill="url(#gOrders)"    name="Orders" />
              <Area type="monotone" dataKey="delivered" stroke="#34d399" strokeWidth={2} fill="url(#gDelivered)" name="Delivered" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Chart: Logins */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Logins (last {range} days)</h2>
          <span className="text-xs text-gray-400">
            {user?.role === "SUPER_ADMIN" ? "All users (admins + vendors)" :
             user?.role === "ADMIN" ? "You + your vendors" : "Just you"}
          </span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loginSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "rgba(17,24,39,.95)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12 }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#a7f3d0" }}
              />
              <Bar dataKey="count" name="Logins" stroke="#34d399" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Total: <span className="text-gray-200">{loginsCurrent}</span> · Change: <Trend value={loginsDelta} /> · Today: <span className="text-gray-200">{todayLogins}</span>
        </div>
      </section>

      {/* Top Vendors table (scope) */}
      {vendorsInScope.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Vendors (by delivered)</h2>
            <span className="text-xs text-gray-400">scope: {user?.role === "SUPER_ADMIN" ? "all" : "your vendors"}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Delivered</th>
                  <th className="px-3 py-2 text-left">Orders</th>
                  <th className="px-3 py-2 text-left">Pending</th>
                  <th className="px-3 py-2 text-left">On-time</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(ordersByVendor.values()).length ? (
                  Array.from(ordersByVendor.values())
                    .sort((a, b) => b.delivered - a.delivered)
                    .slice(0, 5)
                    .map((v) => {
                      const rate = v.orders ? Math.round((v.delivered / v.orders) * 100) : 0;
                      return (
                        <tr key={v.email} className="border-t border-white/10">
                          <td className="px-3 py-2">{v.name}</td>
                          <td className="px-3 py-2">{v.delivered}</td>
                          <td className="px-3 py-2">{v.orders}</td>
                          <td className="px-3 py-2">{v.pending}</td>
                          <td className="px-3 py-2">{rate}%</td>
                        </tr>
                      );
                    })
                ) : (
                  <tr><td className="px-3 py-2" colSpan="5">No vendor activity.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* <p className="text-xs text-gray-400">
        Future: Replace mock orders with your API and map into <code>ordersSeries</code>/<code>ordersByVendor</code>. Add an <code>active</code> toggle in Admins/Vendors to drive the “Active” KPIs.
      </p> */}
    </div>
  );
}

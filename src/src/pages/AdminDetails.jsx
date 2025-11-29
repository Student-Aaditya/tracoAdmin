import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, CalendarClock, ShieldCheck, Ban, Mail,
  Pill, Users, Activity, Truck, ClipboardList,
  TrendingUp, TrendingDown
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar
} from "recharts";

/* --------------------- utils --------------------- */
const fmt = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleString();
};

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

/** Deterministic mock orders for a range, scoped to selected vendors. */
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
      const base = 3 + (seed % 7);                 // 3..9
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

/* --------------------- component --------------------- */
export default function AdminDetails() {
  const { id } = useParams();
  const { admins = [], vendors = [] } = useAuth();
  const [range, setRange] = useState(7); // 7 | 30 | 90

  const admin = useMemo(() => admins.find(a => String(a.id) === String(id)), [admins, id]);

  if (!admin) {
    return (
      <div className="space-y-4">
        <Link to="/admins" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <ArrowLeft size={16} /> Back to Admins
        </Link>
        <p className="text-red-400">Admin not found.</p>
      </div>
    );
  }

  const isActive = admin.active !== false;

  // Vendors created/managed by this admin
  const myVendors = useMemo(
    () => vendors.filter(v => (v.createdByEmail || "").toLowerCase() === (admin.email || "").toLowerCase()),
    [vendors, admin.email]
  );
  const myVendorsActive = useMemo(() => myVendors.filter(v => v.active !== false).length, [myVendors]);

  // Orders series (mock for demo; swap with API later)
  const { byDay: ordersSeries, byVendor: ordersByVendor } = useMemo(
    () => generateOrders(range, myVendors),
    [range, myVendors]
  );
  const { byDay: ordersSeriesPrev } = useMemo(
    () => generateOrders(range, myVendors),
    [range, myVendors]
  );
  const ordersTotal = sum(ordersSeries, "orders");
  const deliveredTotal = sum(ordersSeries, "delivered");
  const pendingTotal = sum(ordersSeries, "pending");
  const ordersDelta = pctDelta(ordersTotal, sum(ordersSeriesPrev, "orders"));
  const deliveredToday = ordersSeries[ordersSeries.length - 1]?.delivered || 0;

  // Login history scoped to this admin + their vendors
  const loginSeries = useMemo(() => {
    try {
      const rows = JSON.parse(localStorage.getItem("login_history") || "[]");
      const emails = new Set([admin.email, ...myVendors.map(v => v.email)].map(e => (e || "").toLowerCase()));

      const series = [];
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = dkey(d);

        const dayCount = rows.filter(r => {
          const rd = new Date(r.ts); rd.setHours(0, 0, 0, 0);
          return dkey(rd) === key && emails.has((r.email || "").toLowerCase());
        }).length;

        series.push({ label: dayLabel(d), count: dayCount });
      }
      return series;
    } catch {
      return [];
    }
  }, [admin.email, myVendors, range]);

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

  const StatCard = ({ icon: Icon, label, value, sub, right }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{label}</div>
        <div className="rounded-lg bg-white/10 p-2"><Icon size={18} /></div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold">{value}</div>
        {right}
      </div>
      {sub ? <div className="mt-1 text-xs text-gray-400">{sub}</div> : null}
    </div>
  );

  // Top Vendors table
  const topVendors = useMemo(
    () => Array.from(ordersByVendor.values()).sort((a, b) => b.delivered - a.delivered).slice(0, 5),
    [ordersByVendor]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admins" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <ArrowLeft size={16} /> Back to Admins
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Range:</span>
          <RangeBtn d={7}>7d</RangeBtn>
          <RangeBtn d={30}>30d</RangeBtn>
          <RangeBtn d={90}>90d</RangeBtn>
        </div>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-semibold">{admin.name}</h1>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="inline-flex items-center gap-2 text-sm text-gray-300">
            <Mail size={16} className="text-gray-400" />
            {admin.email}
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-300">
            <CalendarClock size={16} className="text-gray-400" />
            Created: {fmt(admin.createdAt)}
          </div>
          <div className="inline-flex items-center gap-2 text-sm">
            {isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                <ShieldCheck size={14} /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                <Ban size={14} /> Blocked
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            ID: <span className="text-gray-200">{admin.id}</span>
          </div>
        </div>
      </div>

      {/* KPI row: vendors & orders */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Vendors (added)"
          value={myVendors.length}
          sub="created by this admin"
        />
        <StatCard
          icon={Pill}
          label="Active Vendors"
          value={myVendorsActive}
          sub={`of ${myVendors.length} vendors`}
        />
        <StatCard
          icon={Activity}
          label={`Orders (${range}d)`}
          value={ordersTotal}
          right={<Trend value={pctDelta(ordersTotal, sum(ordersSeriesPrev, "orders"))} />}
          sub="all channels (mock)"
        />
        <StatCard
          icon={Truck}
          label="Delivered (range)"
          value={deliveredTotal}
          sub={`${ordersTotal ? Math.round((deliveredTotal / ordersTotal) * 100) : 0}% on-time`}
        />
      </section>

      {/* Orders vs Delivered chart */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orders & Delivered (last {range} days)</h2>
          <span className="text-xs text-gray-400">scope: vendors created by this admin</span>
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

      {/* Logins chart */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Logins (last {range} days)</h2>
          <span className="text-xs text-gray-400">scope: this admin + their vendors</span>
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
      </section>

      {/* Top Vendors */}
      {myVendors.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Vendors (by delivered)</h2>
            <span className="text-xs text-gray-400">created by this admin</span>
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
                {Array.from(ordersByVendor.values()).sort((a, b) => b.delivered - a.delivered).slice(0, 5).map(v => {
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
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

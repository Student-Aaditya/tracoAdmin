import { useLoading } from "../../context/LoadingContext";

export default function Preloader() {
  const { visible, message } = useLoading();

  return (
    <>
      {/* Scoped styles just for this preloader */}
      <style>{`
        .tl-preloader {
          --bg: #0b0f19;
          --glass: rgba(255,255,255,.06);
          --border: rgba(255,255,255,.12);
          --text: #e5e7eb;
          --muted: #9ca3af;
          --indigo: #6366f1;
          --emerald: #10b981;
          --pink: #ec4899;
        }

        .tl-preloader__overlay {
          position: fixed; inset: 0; z-index: 1000;
          display: grid; place-items: center;
          transition: opacity .35s ease, visibility .35s ease;
        }
        .tl-preloader__overlay[aria-hidden="true"] {
          opacity: 0; visibility: hidden; pointer-events: none;
        }

        /* Aurora backdrop */
        .tl-aurora {
          position: absolute; inset: 0; overflow: hidden; filter: blur(24px);
          background: radial-gradient(60% 60% at 50% 10%, rgba(99,102,241,.16), transparent 60%),
                      radial-gradient(40% 40% at 80% 90%, rgba(16,185,129,.14), transparent 60%),
                      var(--bg);
        }
        .tl-blob {
          position: absolute; width: 40vmax; height: 40vmax; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(236,72,153,.35), rgba(236,72,153,0));
          mix-blend-mode: screen; opacity: .6; animation: float 12s ease-in-out infinite;
        }
        .tl-blob--1 { top: -10vmax; left: -8vmax; }
        .tl-blob--2 { bottom: -12vmax; right: -10vmax; animation-delay: -6s; }

        @keyframes float {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(2vmax,-1vmax,0) scale(1.06); }
        }

        /* Glass card */
        .tl-card {
          position: relative; width: 320px; max-width: 90vw;
          padding: 22px 20px; border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
          border: 1px solid var(--border);
          box-shadow: 0 10px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
          color: var(--text); text-align: center;
        }
        .tl-brand { font-weight: 700; letter-spacing: .3px; }
        .tl-brand b { color: var(--indigo); }

        /* Conic ring spinner (donut) */
        .tl-ring {
          width: 70px; height: 70px; margin: 0 auto 12px auto; border-radius: 50%;
          background: conic-gradient(from 0turn, var(--indigo), var(--pink), var(--emerald), var(--indigo));
          -webkit-mask: radial-gradient(farthest-side, transparent 60%, #000 61%);
                  mask: radial-gradient(farthest-side, transparent 60%, #000 61%);
          animation: spin 1s linear infinite;
          filter: drop-shadow(0 0 16px rgba(99,102,241,.5));
        }

        /* Orbiting dots around the ring */
        .tl-orbit {
          position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none;
          animation: spin 3.2s linear infinite;
        }
        .tl-orbit .dot {
          position: absolute; width: 8px; height: 8px; border-radius: 9999px;
          background: #fff; box-shadow: 0 0 12px rgba(255,255,255,.8);
          transform: translateY(-44px);
        }
        .tl-orbit .dot:nth-child(2) { transform: translateY(-44px) rotate(120deg); }
        .tl-orbit .dot:nth-child(3) { transform: translateY(-44px) rotate(240deg); }

        @keyframes spin { to { transform: rotate(1turn) } }

        /* Shimmer line under text */
        .tl-shimmer {
          position: relative; height: 6px; border-radius: 9999px; overflow: hidden;
          background: rgba(255,255,255,.08); margin-top: 10px;
        }
        .tl-shimmer::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent);
          transform: translateX(-100%); animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tl-ring, .tl-orbit, .tl-blob, .tl-shimmer::before { animation: none !important; }
        }
      `}</style>

      <div
        className="tl-preloader tl-preloader__overlay"
        aria-live="polite"
        aria-busy={visible ? "true" : "false"}
        aria-hidden={visible ? "false" : "true"}
      >
        {/* Aurora backdrop */}
        <div className="tl-aurora">
          <div className="tl-blob tl-blob--1" />
          <div className="tl-blob tl-blob--2" />
        </div>

        {/* Glass card */}
        <div className="tl-card">
          <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 6px auto" }}>
            <div className="tl-ring" />
            <div className="tl-orbit">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>

          <div className="tl-brand">
            Traco<b>Admin</b>
          </div>
          <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>{message}</div>

          <div className="tl-shimmer" />
        </div>
      </div>
    </>
  );
}

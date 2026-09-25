export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col"
        style={{
          background: "linear-gradient(160deg, #fff0f4 0%, #fff 45%, #fff8f5 100%)",
          borderRight: "1px solid #F3F4F6",
        }}
      >
        {/* Decorative blurs */}
        <div
          className="absolute top-[-60px] right-[-60px] w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(224,92,131,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[60px] left-[-50px] w-[180px] h-[180px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(244,132,95,0.07) 0%, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-10">
          {/* Logo */}
          <div className="mb-9">
            <img src="/images/adverdize-logo.png" alt="Adverdize" className="h-9 w-auto object-contain" />
          </div>

          {/* Copy */}
          <p className="text-[10px] font-semibold uppercase tracking-[1.4px] mb-2.5" style={{ color: "#E05C83" }}>
            Client Portal
          </p>

          <h2
            className="font-display font-extrabold text-gray-900 leading-[1.2] mb-3"
            style={{ fontSize: "28px" }}
          >
            Your marketing,<br />
            <span
              style={{
                background: "linear-gradient(135deg, #E05C83, #F4845F)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              managed smarter.
            </span>
          </h2>

          <p className="text-[13px] leading-relaxed text-gray-500 mb-5 max-w-[300px]">
            Access real-time reports, manage your subscription, and stay aligned with your Adverdize team — all in one place.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-2.5 mb-7">
            {[
              "Real-time campaign performance",
              "Subscription & billing management",
              "Direct team communication",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div
                  className="w-[17px] h-[17px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[12px] text-gray-600">{item}</span>
              </div>
            ))}
          </div>

          {/* Dashboard peek */}
          <div
            className="overflow-hidden shrink-0"
            style={{
              height: "200px",
              margin: "0 -56px",
              maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
            }}
          >
            <div
              className="mx-14 rounded-[10px] border border-gray-200 overflow-hidden"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
            >
              {/* Topbar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[9px] font-bold text-white font-display"
                    style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                  >
                    A
                  </div>
                  <span className="text-[11px] font-bold text-gray-900 font-display">Adverdize</span>
                </div>
                <div className="flex gap-4">
                  {["Dashboard", "Reports", "Billing", "Support"].map((item, i) => (
                    <span
                      key={item}
                      className="text-[10px] font-medium"
                      style={{ color: i === 0 ? "#E05C83" : "#9CA3AF" }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #E05C83, #F4845F)" }}
                >
                  JD
                </div>
              </div>

              {/* Body */}
              <div className="flex bg-gray-50">
                {/* Sidebar */}
                <div className="w-[110px] bg-white border-r border-gray-100 py-3 shrink-0">
                  {[
                    { label: "Overview", active: true },
                    { label: "Campaigns", active: false },
                    { label: "Reports", active: false },
                    { label: "Billing", active: false },
                  ].map(({ label, active }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium"
                      style={{ color: active ? "#E05C83" : "#9CA3AF", background: active ? "#fdf2f6" : "transparent" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "currentColor" }}
                      />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Main */}
                <div className="flex-1 p-3.5 flex flex-col gap-2.5">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.8px] text-gray-400">
                    Overview — September 2026
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Impressions", value: "248K", delta: "↑ 12.4%", pink: true },
                      { label: "Clicks", value: "18.3K", delta: "↑ 8.1%", pink: false },
                      { label: "Ad Spend", value: "$4,280", delta: "↓ 2.3%", pink: false, down: true },
                    ].map(({ label, value, delta, pink, down }) => (
                      <div key={label} className="bg-white rounded-lg border border-gray-100 p-2.5">
                        <div className="text-[9px] text-gray-400 mb-1">{label}</div>
                        <div
                          className="text-base font-bold font-display leading-none mb-1"
                          style={pink ? {
                            background: "linear-gradient(135deg, #E05C83, #F4845F)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          } : { color: "#111827" }}
                        >
                          {value}
                        </div>
                        <div className="text-[8px] font-medium" style={{ color: down ? "#ef4444" : "#10b981" }}>
                          {delta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-gray-300 mt-auto pt-4">© 2026 Adverdize. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/images/adverdize-logo.png" alt="Adverdize" className="h-8 w-auto object-contain" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #E8405A 0%, #F4845F 100%)" }}>
        <div className="absolute inset-0 flex flex-col items-start justify-between p-12">
          <div className="flex items-center gap-3">
            <img src="/images/adverdize-logo-light.png" alt="Adverdize" className="h-16 w-auto" />
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-display font-bold text-white leading-tight mb-4">
              Your marketing, managed in one place.
            </h2>
            <p className="text-white/75 text-base leading-relaxed">
              Access your reports, manage your subscription, and stay aligned with your Adverdize team — all from your client portal.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { label: "Active clients", value: "200+" },
                { label: "Avg. ROI improvement", value: "3.4×" },
                { label: "Keywords ranked", value: "12k+" },
                { label: "Campaigns managed", value: "500+" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© 2026 Adverdize. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/images/adverdize-logo.png" alt="Adverdize" className="h-8 w-auto" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

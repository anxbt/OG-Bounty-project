import { Shield, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigateToDashboard: () => void;
}

export default function LandingPage({ onNavigateToDashboard }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative z-10">
        <header className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">iSentinel</span>
            </div>
            <button
              onClick={onNavigateToDashboard}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              View Incidents
            </button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <span className="text-blue-400 text-sm font-medium">
                  Blockchain-Verified AI Incident Reporting
                </span>
              </div>

              <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                AI Incident
                <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Transparency
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                Every AI failure becomes a verifiable, immutable NFT on the blockchain.
                Building trust through transparency and accountability.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={onNavigateToDashboard}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                View Incidents
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onNavigateToDashboard}
                className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm border border-slate-600"
              >
                Report Incident
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Immutable Records
                </h3>
                <p className="text-slate-400">
                  Every incident is permanently recorded on the blockchain, ensuring tamper-proof documentation
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Transferable Responsibility
                </h3>
                <p className="text-slate-400">
                  NFT ownership enables clear accountability and the ability to transfer incident responsibility
                </p>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Verified Evidence
                </h3>
                <p className="text-slate-400">
                  Cryptographic proofs ensure the authenticity and integrity of all incident data
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

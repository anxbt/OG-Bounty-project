import { useNetwork } from '../contexts/NetworkContext';
import { Settings, Check } from 'lucide-react';
import { useState } from 'react';

export default function NetworkSwitcher() {
  const { setActiveNetwork, isTestnet, isMainnet } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const switchNetwork = (network: 'TESTNET' | 'MAINNET') => {
    setActiveNetwork(network);
    setIsOpen(false);
    // Reload the page to apply new network settings
    window.location.reload();
  };

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all"
        title="Switch Network Mode"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Mode</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
              <h3 className="font-bold text-sm">Network Configuration</h3>
              <p className="text-xs opacity-90 mt-1">
                Choose network for demo
              </p>
            </div>

            {/* Options */}
            <div className="p-2">
              {/* Mainnet Option */}
              <button
                onClick={() => switchNetwork('MAINNET')}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                  isMainnet
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isMainnet ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">0G Mainnet</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-bold">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    ✅ Blockchain contracts deployed
                  </p>
                  <p className="text-xs text-gray-600">
                    ⚠️ Storage & Compute use testnet
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Use for production blockchain demos
                  </p>
                </div>
              </button>

              {/* Testnet Option */}
              <button
                onClick={() => switchNetwork('TESTNET')}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all mt-2 ${
                  isTestnet
                    ? 'bg-yellow-50 border-2 border-yellow-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isTestnet ? (
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">0G Galileo Testnet</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                      TEST
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    ✅ Full stack: Blockchain + Storage + Compute
                  </p>
                  <p className="text-xs text-gray-600">
                    ✅ All features available
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Use for full feature demos
                  </p>
                </div>
              </button>
            </div>

            {/* Footer Note */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 <strong>Note:</strong> Page will reload after switching
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

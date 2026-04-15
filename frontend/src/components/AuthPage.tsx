import React, { useState, useEffect } from 'react';
import { Activity, Power, Scan } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(false); // Default to signup for new user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Power sequence state
  const [powerState, setPowerState] = useState<'off' | 'scanning' | 'online'>('off');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setToastMessage('Error: Missing required fields.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Save to localStorage
    if (!isLogin) {
      localStorage.setItem('devhealth_user', JSON.stringify({ email, name }));
    } else {
      const existingUser = localStorage.getItem('devhealth_user');
      if (!existingUser) {
        setToastMessage('Error: No registered node found. Please sign up first.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
    }
    
    setToastMessage(isLogin ? 'Authentication successful...' : 'Account created successfully...');
    setShowToast(true);

    // Simulate API call and redirect
    setTimeout(() => {
      setShowToast(false);
      onLogin(); // Redirect to landing or dashboard
    }, 1500);
  };

  // Clear local storage for testing purposes
  useEffect(() => {
    localStorage.removeItem('devhealth_user');
  }, []);

  const handlePowerOn = () => {
    setPowerState('scanning');
    setTimeout(() => {
      setPowerState('online');
    }, 2500); // 2.5s scan duration
  };

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6 font-mono text-blue-500 overflow-hidden bg-[#0A0E17]">
      
      <style>{`
        @keyframes ecg-dash {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scan-laser {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes power-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 40px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .blinking-cursor::after {
          content: '█';
          animation: blink 1s step-end infinite;
          margin-left: 4px;
        }
        .terminal-input {
          background: transparent;
          border: none;
          outline: none;
          color: #3b82f6;
          width: 100%;
          font-family: inherit;
        }
        .terminal-input::placeholder {
          color: #1e3a8a;
        }
        .terminal-box {
          border: 1px solid #1e3a8a;
          box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.1);
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        .terminal-focus-within:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .scanner-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: #3b82f6;
          box-shadow: 0 0 20px 5px #3b82f6;
          z-index: 50;
        }
      `}</style>


      {/* -- STATE: OFF -- */}
      {powerState === 'off' && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="text-[#1e3a8a] mb-12 text-center">
            <h2 className="text-2xl tracking-[0.3em] font-bold opacity-50">DEV HEALTH</h2>
            <p className="text-xs tracking-widest mt-2 uppercase">Diagnostic System Offline</p>
          </div>

          <button 
            type="button"
            onClick={handlePowerOn}
            className="group relative w-32 h-32 rounded-full border-2 border-[#1e3a8a] bg-[#0A0E17] flex items-center justify-center hover:border-[#3b82f6] transition-all duration-500 overflow-hidden"
            style={{ animation: 'power-pulse 2s infinite' }}
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-[#3b82f6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <Power className="w-12 h-12 text-[#1e3a8a] group-hover:text-[#3b82f6] transition-colors duration-500" strokeWidth={1.5} />
          </button>
          <div className="mt-8 text-[#1e3a8a] tracking-widest uppercase text-xs animate-pulse">
            Awaiting Initialization
          </div>
        </div>
      )}

      {/* -- STATE: SCANNING -- */}
      {powerState === 'scanning' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0E17]/80 backdrop-blur-sm">
          {/* Laser Line */}
          <div className="scanner-line" style={{ animation: 'scan-laser 2.5s ease-in-out forwards' }} />
          
          <div className="flex flex-col items-center justify-center text-[#3b82f6]">
            <Scan className="w-24 h-24 mb-6 animate-pulse" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 15px #3b82f6)' }} />
            <div className="text-xl tracking-[0.4em] font-bold animate-pulse">BIOMETRIC SCAN IN PROGRESS</div>
            <div className="mt-4 text-xs tracking-widest uppercase opacity-70 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              Establishing Secure Connection...
            </div>
            
            {/* Decorative progress bars */}
            <div className="w-64 h-1 border border-[#1e3a8a] mt-8 overflow-hidden rounded-full">
              <div className="h-full bg-[#3b82f6] shadow-[0_0_10px_#3b82f6] transition-all duration-[2.5s] ease-out" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* -- STATE: ONLINE (Auth Form) -- */}
      {powerState === 'online' && (
        <>
          {/* Background ECG Animation */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center animate-fade-in-up">
            <svg
              className="w-full h-32"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,50 200,50 220,10 240,90 260,50 400,50 420,10 440,90 460,50 600,50 620,10 640,90 660,50 800,50 820,10 840,90 860,50 1000,50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                className="ecg-line"
                style={{
                  strokeDasharray: '1000',
                  strokeDashoffset: '1000',
                  animation: 'ecg-dash 3s linear infinite',
                  filter: 'drop-shadow(0 0 8px #3b82f6)'
                }}
              />
            </svg>
          </div>

          {/* Main Container */}
          <div 
            className="relative z-10 w-full max-w-md terminal-box p-8 rounded-lg animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            {/* Header / Tabs */}
            <div className="flex justify-between items-center mb-8 border-b border-[#1e3a8a] pb-4">
              <div className="flex space-x-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`text-lg font-bold tracking-wider transition-colors ${isLogin ? 'text-[#3b82f6] drop-shadow-[0_0_8px_#3b82f6]' : 'text-[#1e3a8a] hover:text-[#2563eb]'}`}
                >
                  [ LOGIN ]
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`text-lg font-bold tracking-wider transition-colors ${!isLogin ? 'text-[#3b82f6] drop-shadow-[0_0_8px_#3b82f6]' : 'text-[#1e3a8a] hover:text-[#2563eb]'}`}
                >
                  [ SIGN UP ]
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-[#2563eb]">Identification</label>
                  <div className="flex items-center bg-black/50 p-3 border border-[#1e3a8a] rounded terminal-focus-within transition-all">
                    <span className="text-[#1e3a8a] mr-3">{'>'}</span>
                    <input
                      type="text"
                      placeholder="enter_username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="terminal-input"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-[#2563eb]">Network Address</label>
                <div className="flex items-center bg-black/50 p-3 border border-[#1e3a8a] rounded terminal-focus-within transition-all">
                  <span className="text-[#1e3a8a] mr-3">{'>'}</span>
                  <input
                    type="email"
                    placeholder="user@system.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="terminal-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest text-[#2563eb]">Access Code</label>
                <div className="flex items-center bg-black/50 p-3 border border-[#1e3a8a] rounded terminal-focus-within transition-all">
                  <span className="text-[#1e3a8a] mr-3">{'>'}</span>
                  <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-8 bg-[#3b82f6]/10 border border-[#3b82f6] text-[#3b82f6] p-4 font-bold tracking-[0.2em] rounded hover:bg-[#3b82f6]/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex justify-center items-center group"
              >
                <span className="group-hover:blinking-cursor">
                  {isLogin ? 'INITIALIZE_SESSION' : 'REGISTER_NODE'}
                </span>
              </button>
            </form>

            {/* Footer info */}
            <div 
              className="mt-8 text-center text-xs text-[#1e3a8a] opacity-70 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <p>SYSTEM STATUS: ONLINE</p>
              <p>ENCRYPTION: ACTIVE</p>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-black border border-[#3b82f6] text-[#3b82f6] px-6 py-3 rounded shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-fade-in-up flex items-center gap-3">
          <span className="animate-pulse">●</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

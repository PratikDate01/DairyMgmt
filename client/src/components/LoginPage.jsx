import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, ShieldCheck, UserPlus, LogIn, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const { isAuthenticated, loginWithOTP } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [identityType, setIdentityType] = useState('phone'); // 'phone' | 'email'
  const [step, setStep] = useState(1); // 1: Input Form (Login/Register), 2: Verify OTP

  // Form Fields
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [role, setRole] = useState('farmer');
  const [otp, setOtp] = useState('');

  // States
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identity || !identity.trim()) {
      setError(
        identityType === 'email'
          ? 'Please enter your email address.'
          : 'Please enter your mobile number.'
      );
      return;
    }

    let normalizedIdentity = identity.trim();

    if (identityType === 'email') {
      normalizedIdentity = normalizedIdentity.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedIdentity)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const cleaned = normalizedIdentity.replace(/[\s\-()]/g, '');
      const phoneRegex = /^(?:\+91|91|0)?([6-9]\d{9})$/;
      if (!phoneRegex.test(cleaned)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setLoading(true);

    try {
      const data = await authService.requestOTP(normalizedIdentity);
      setSuccessMsg(data.message || 'OTP sent successfully!');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration & Send OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identity || !identity.trim()) {
      setError('Please enter your mobile number or email address.');
      return;
    }

    let normalizedIdentity = identity.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(normalizedIdentity)) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    } else {
      const cleaned = normalizedIdentity.replace(/[\s\-()]/g, '');
      const phoneRegex = /^(?:\+91|91|0)?([6-9]\d{9})$/;
      if (!phoneRegex.test(cleaned)) {
        setError('Please enter a valid 10-digit mobile number or email address.');
        return;
      }
    }

    setLoading(true);

    try {
      const data = await authService.register(name, normalizedIdentity, role);
      setSuccessMsg(data.message || 'Registration successful! OTP sent.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    try {
      await loginWithOTP(normalizedIdentity, otp);
      setSuccessMsg('Logged in successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { id: 'farmer', label: 'Farmer', icon: '🌾', desc: 'Manage milk supply & medical requests' },
    { id: 'dairyOwner', label: 'Dairy Owner', icon: '🥛', desc: 'Manage milk intake & farmer payouts' },
    { id: 'medicalProvider', label: 'Medical Provider', icon: '🩺', desc: 'Fulfill veterinary medicine orders' },
    { id: 'veterinarian', label: 'Veterinarian', icon: '👨‍⚕️', desc: 'Cattle disease screening & case reviews' },
    { id: 'admin', label: 'Admin', icon: '🛡️', desc: 'System management & security' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-xs">
            🐄
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gauseva HealthTech</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Dairy & Veterinary Medical Portal</p>
        </div>

        {/* Mode Switcher Tabs (Only visible on Step 1) */}
        {step === 1 && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start justify-between">
            <div className="flex-1 mr-2">
              <span className="font-bold block mb-0.5">Authentication Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl">
            <span className="font-bold block mb-0.5">Success</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dev OTP Display Banner */}
        {devOtp && step === 2 && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold block text-amber-800">🔑 Development Mode OTP</span>
              <span>Use verification code:</span>
            </div>
            <code className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg font-mono text-base font-extrabold border border-amber-300">
              {devOtp}
            </code>
          </div>
        )}

        {/* Step 1 Form: LOGIN or REGISTER */}
        {step === 1 ? (
          mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleRequestOTP} className="space-y-4">
              
              {/* Identity Type Switcher: Phone vs Email */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIdentityType('phone');
                    setIdentity('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    identityType === 'phone'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentityType('email');
                    setIdentity('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    identityType === 'email'
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </button>
              </div>

              <div>
                <label htmlFor="login-identity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {identityType === 'email' ? 'Registered Email Address' : 'Registered Mobile Number'}
                </label>
                <div className="relative">
                  <input
                    id="login-identity"
                    type={identityType === 'email' ? 'email' : 'tel'}
                    autoComplete={identityType === 'email' ? 'email' : 'tel'}
                    placeholder={identityType === 'email' ? 'name@example.com' : 'Enter 10-digit mobile number'}
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                  {identityType === 'email' ? (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  ) : (
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex justify-center items-center space-x-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Sending OTP...' : 'Request OTP'}</span>
              </button>

              {error && error.toLowerCase().includes('no account found') && (
                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Need a new user account?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition"
                  >
                    👉 Click here to register your account now
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-identity" className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number or Email Address
                </label>
                <div className="relative">
                  <input
                    id="reg-identity"
                    type="text"
                    placeholder="Enter mobile number or email address"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select User Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 ${
                        role === item.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold leading-tight">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex justify-center items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Register & Request OTP'}</span>
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Already registered? <span className="text-blue-600 font-bold underline">Log in here</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* STEP 2: VERIFY OTP FORM */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 mb-2">
              OTP sent to {identityType === 'email' || identity.includes('@') ? 'email address' : 'mobile number'}:{' '}
              <strong className="font-mono text-slate-900">{identity.trim()}</strong>
            </div>

            <div>
              <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength="6"
                placeholder="──────"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono tracking-[0.5em] text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex justify-center items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify OTP & Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition py-1 font-medium"
            >
              ← Back to Details
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

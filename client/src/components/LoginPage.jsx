import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  UserPlus, 
  LogIn, 
  KeyRound, 
  RotateCw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export const LoginPage = () => {
  const { isAuthenticated, loginWithOTP } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [identityType, setIdentityType] = useState('email'); // 'email' | 'phone'
  const [step, setStep] = useState(1); // 1: Email/Phone Input, 2: Role Selection, 3: Verify OTP

  // Form Fields
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [otp, setOtp] = useState('');

  // OTP Timers & State
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
  const [otpExpiryTime, setOtpExpiryTime] = useState(300); // 300 seconds (5 mins)
  const [loadingResend, setLoadingResend] = useState(false);

  // General States
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 60-Second Resend Cooldown Countdown
  useEffect(() => {
    let timer;
    if (step === 3 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // 5-Minute OTP Expiry Countdown
  useEffect(() => {
    let timer;
    if (step === 3 && otpExpiryTime > 0) {
      timer = setInterval(() => {
        setOtpExpiryTime((prev) => {
          if (prev <= 1) {
            setError('OTP expired. Please request a new OTP.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiryTime]);

  // Format Seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const roleLabels = {
    farmer: { label: 'Farmer', icon: '🌾', desc: 'Manage milk supply & medical requests' },
    dairyOwner: { label: 'Dairy Owner', icon: '🥛', desc: 'Manage milk intake & farmer payouts' },
    medicalProvider: { label: 'Medical Provider', icon: '🩺', desc: 'Fulfill veterinary medicine orders' },
    veterinarian: { label: 'Veterinarian', icon: '👨‍⚕️', desc: 'Cattle disease screening & case reviews' },
    admin: { label: 'Administrator', icon: '🛡️', desc: 'System management & security' }
  };

  // Step 1: Check Email & Fetch Registered Roles
  const handleCheckIdentity = async (e) => {
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

    if (identityType === 'email' || normalizedIdentity.includes('@')) {
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
      const checkRes = await authService.checkEmail(normalizedIdentity);
      
      if (!checkRes.exists) {
        setError('No account found for this mobile number or email address. Please register a new account.');
        return;
      }

      const roles = checkRes.roles && checkRes.roles.length > 0 ? checkRes.roles : ['farmer'];
      setAvailableRoles(roles);

      if (roles.length === 1) {
        // Single role found -> auto request OTP
        const singleRole = roles[0];
        setSelectedRole(singleRole);
        
        const otpData = await authService.requestOTP(normalizedIdentity, singleRole);
        setSuccessMsg(otpData.message || `OTP sent for ${roleLabels[singleRole]?.label || singleRole}!`);
        if (otpData.devOtp) setDevOtp(otpData.devOtp);

        setStep(3);
        setResendCooldown(60);
        setOtpExpiryTime(300);
        setOtp('');
      } else {
        // Multiple roles -> move to Step 2 for role selection
        setSelectedRole(roles[0]);
        setStep(2);
      }

    } catch (err) {
      setError(err.message || 'Failed to check account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request OTP for Selected Role
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    setLoading(true);

    try {
      const data = await authService.requestOTP(normalizedIdentity, selectedRole);
      setSuccessMsg(data.message || `OTP sent for ${roleLabels[selectedRole]?.label || selectedRole}!`);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(3);
      setResendCooldown(60);
      setOtpExpiryTime(300);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 Registration Form Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identity || !identity.trim()) {
      setError('Please enter your email address or mobile number.');
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
      const data = await authService.register(name, normalizedIdentity, selectedRole);
      setSuccessMsg(data.message || 'Role registration successful! OTP sent.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(3);
      setResendCooldown(60);
      setOtpExpiryTime(300);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle OTP Verification
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    try {
      await loginWithOTP(normalizedIdentity, cleanOtp, selectedRole);
      setSuccessMsg('Logged in successfully!');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loadingResend) return;

    setError('');
    setSuccessMsg('');
    setLoadingResend(true);

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    try {
      const data = await authService.requestOTP(normalizedIdentity, selectedRole);
      setSuccessMsg(data.message || 'New OTP sent successfully!');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setOtp('');
      setResendCooldown(60);
      setOtpExpiryTime(300);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-xs">
            🐄
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gauseva HealthTech</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Cattle Healthcare & Management System</p>
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
              <span>New Role / Account</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Success</span>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Dev OTP Display Banner */}
        {devOtp && step === 3 && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold block text-amber-800">🔑 Development Mode OTP</span>
              <span>Verification code:</span>
            </div>
            <code className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg font-mono text-base font-extrabold border border-amber-300">
              {devOtp}
            </code>
          </div>
        )}

        {/* STEP 1: LOGIN or REGISTER IDENTITY INPUT */}
        {step === 1 && (
          mode === 'login' ? (
            /* LOGIN STEP 1 */
            <form onSubmit={handleCheckIdentity} className="space-y-4">
              
              {/* Identity Type Switcher: Email vs Phone */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
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
                  <span>Mobile Number</span>
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
                    placeholder={identityType === 'email' ? 'abc@gmail.com' : 'Enter 10-digit mobile number'}
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
                <span>{loading ? 'Checking Account...' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
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
            /* REGISTER STEP 1 */
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
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <input
                    id="reg-identity"
                    type="text"
                    placeholder="abc@gmail.com or Mobile Number"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">If this email is already registered, the new role will be added to your account.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Role to Register
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(roleLabels)
                    .filter(([key]) => key !== 'admin')
                    .map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedRole(key)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 ${
                          selectedRole === key
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
                <span>{loading ? 'Processing...' : 'Register & Request OTP'}</span>
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
        )}

        {/* STEP 2: MULTI-ROLE SELECTION */}
        {step === 2 && (
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="font-bold text-sm mb-1">Select How You Want to Continue</div>
              <p className="text-blue-700">
                This account (<strong className="font-mono">{identity.trim()}</strong>) is registered with multiple roles.
              </p>
            </div>

            <div className="space-y-2.5 my-4">
              {availableRoles.map((r) => {
                const info = roleLabels[r] || { label: r, icon: '👤', desc: 'Registered Role' };
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-xs font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{info.label}</div>
                        <div className="text-xs text-slate-500 font-normal">{info.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={loading || !selectedRole}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex justify-center items-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Sending OTP...' : 'Continue / Request OTP'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition py-1 font-medium"
            >
              ← Back to email input
            </button>
          </form>
        )}

        {/* STEP 3: VERIFY OTP FORM */}
        {step === 3 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>Selected Role:</span>
                <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md text-xs">
                  {roleLabels[selectedRole]?.icon} {roleLabels[selectedRole]?.label || selectedRole}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span>OTP Sent to:</span>
                <strong className="font-mono text-slate-900">{identity.trim()}</strong>
              </div>
            </div>

            {/* Timer & Expiry Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {otpExpiryTime > 0 ? (
                    <>Code expires in <strong className="font-mono text-slate-700">{formatTime(otpExpiryTime)}</strong></>
                  ) : (
                    <strong className="text-red-600">Code Expired</strong>
                  )}
                </span>
              </div>
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
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3 px-4 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono tracking-[0.5em] text-center text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Verifying Code...' : 'Verify OTP & Login'}</span>
            </button>

            {/* Resend OTP Action */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center space-y-2">
              <div className="text-xs text-slate-500">Didn't receive the code?</div>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loadingResend}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                  resendCooldown > 0 || loadingResend
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-xs'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingResend ? 'animate-spin text-blue-600' : ''}`} />
                <span>
                  {loadingResend
                    ? 'Resending OTP...'
                    : resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend OTP'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep(availableRoles.length > 1 ? 2 : 1);
                setOtp('');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition py-1 font-medium"
            >
              ← Back to {availableRoles.length > 1 ? 'role selection' : 'email input'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './common/LanguageSwitcher';
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
  const { isAuthenticated, loginWithOTP, loginWithGoogle } = useAuth();
  const { t } = useTranslation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [identityType, setIdentityType] = useState('email'); // 'email' | 'phone'
  const [step, setStep] = useState(1); // 1: Email/Phone Input, 2: Role Selection, 3: Verify OTP

  // Form Fields
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [otp, setOtp] = useState('');

  // Professional Certification Fields (Phase 31)
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicName, setClinicName] = useState('');

  // OTP Timers & State
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds
  const [otpExpiryTime, setOtpExpiryTime] = useState(300); // 300 seconds (5 mins)
  const [loadingResend, setLoadingResend] = useState(false);

  // General States
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Google Identity Services Initialization
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) return;
          setLoading(true);
          setError('');
          try {
            await loginWithGoogle(response.credential, selectedRole);
          } catch (err) {
            setError(err.message || 'Google authentication failed');
          } finally {
            setLoading(false);
          }
        }
      });

      const btnEl = document.getElementById('googleSignInBtn');
      if (btnEl) {
        window.google.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'rectangular'
        });
      }
    } catch (gErr) {
      console.warn('Google Identity initialization notice:', gErr.message);
    }
  }, [mode, selectedRole, loginWithGoogle]);

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
            setError(t('auth:errors.otpExpired'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiryTime, t]);

  // Format Seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const roleLabels = {
    farmer: { label: t('roles.farmer'), icon: '🌾', desc: t('auth:roleDescriptions.farmer') },
    dairyOwner: { label: t('roles.dairyOwner'), icon: '🥛', desc: t('auth:roleDescriptions.dairyOwner') },
    medicalProvider: { label: t('roles.medicalProvider'), icon: '🩺', desc: t('auth:roleDescriptions.medicalProvider') },
    veterinarian: { label: t('roles.veterinarian'), icon: '👨‍⚕️', desc: t('auth:roleDescriptions.veterinarian') },
    admin: { label: t('roles.admin'), icon: '🛡️', desc: t('auth:roleDescriptions.admin') }
  };

  // Step 1: Check Email & Fetch Registered Roles
  const handleCheckIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identity || !identity.trim()) {
      setError(
        identityType === 'email'
          ? t('auth:errors.enterEmail')
          : t('auth:errors.enterMobile')
      );
      return;
    }

    let normalizedIdentity = identity.trim();

    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedIdentity)) {
        setError(t('auth:errors.validEmail'));
        return;
      }
    } else {
      const cleaned = normalizedIdentity.replace(/[\s\-()]/g, '');
      const phoneRegex = /^(?:\+91|91|0)?([6-9]\d{9})$/;
      if (!phoneRegex.test(cleaned)) {
        setError(t('auth:errors.validMobile'));
        return;
      }
    }

    setLoading(true);

    try {
      const checkRes = await authService.checkEmail(normalizedIdentity);
      
      if (!checkRes.exists) {
        setError(t('auth:errors.noAccount'));
        return;
      }

      const roles = checkRes.roles && checkRes.roles.length > 0 ? checkRes.roles : ['farmer'];
      setAvailableRoles(roles);

      if (roles.length === 1) {
        // Single role found -> auto request OTP
        const singleRole = roles[0];
        setSelectedRole(singleRole);
        
        const otpData = await authService.requestOTP(normalizedIdentity, singleRole);
        setSuccessMsg(otpData.message || t('auth:messages.otpSent', { role: roleLabels[singleRole]?.label || singleRole }));
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
      setError(err.message || t('auth:errors.checkFailed'));
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
      setError(t('auth:errors.selectRole'));
      return;
    }

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    setLoading(true);

    try {
      const data = await authService.requestOTP(normalizedIdentity, selectedRole);
      setSuccessMsg(data.message || t('auth:messages.otpSent', { role: roleLabels[selectedRole]?.label || selectedRole }));
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(3);
      setResendCooldown(60);
      setOtpExpiryTime(300);
      setOtp('');
    } catch (err) {
      setError(err.message || t('auth:errors.sendFailed'));
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
      setError(t('auth:errors.validIdentity'));
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
        setError(t('auth:errors.validMobileOrEmail'));
        return;
      }
    }

    setLoading(true);

    try {
      const data = await authService.register(name, normalizedIdentity, selectedRole, {
        licenseNumber,
        specialization,
        clinicName
      });
      setSuccessMsg(data.message || t('auth:messages.regSuccess'));
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep(3);
      setResendCooldown(60);
      setOtpExpiryTime(300);
      setOtp('');
    } catch (err) {
      setError(err.message || t('auth:errors.registerFailed'));
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
      setError(t('auth:errors.validOtp'));
      return;
    }

    setLoading(true);

    let normalizedIdentity = identity.trim();
    if (identityType === 'email' || normalizedIdentity.includes('@')) {
      normalizedIdentity = normalizedIdentity.toLowerCase();
    }

    try {
      await loginWithOTP(normalizedIdentity, cleanOtp, selectedRole);
      setSuccessMsg(t('auth:messages.loginSuccess'));
    } catch (err) {
      setError(err.message || t('auth:errors.verifyFailed'));
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
      setSuccessMsg(data.message || t('auth:messages.newOtpSent'));
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setOtp('');
      setResendCooldown(60);
      setOtpExpiryTime(300);
    } catch (err) {
      setError(err.message || t('auth:errors.resendFailed'));
    } finally {
      setLoadingResend(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        
        {/* Top bar with Language Switcher */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-xs">
            🐄
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('auth:brandTitle')}</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t('auth:brandSubtitle')}</p>
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
              <span>{t('auth:tabLogin')}</span>
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
              <span>{t('auth:tabRegister')}</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{t('labels.notice')}</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{t('labels.success')}</span>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Dev OTP Display Banner */}
        {devOtp && step === 3 && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold block text-amber-800">{t('auth:devOtpBanner')}</span>
              <span>{t('auth:devOtpLabel')}</span>
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
                  <span>{t('auth:emailAddress')}</span>
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
                  <span>{t('auth:mobileNumber')}</span>
                </button>
              </div>

              <div>
                <label htmlFor="login-identity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {identityType === 'email' ? t('auth:registeredEmail') : t('auth:registeredMobile')}
                </label>
                <div className="relative">
                  <input
                    id="login-identity"
                    type={identityType === 'email' ? 'email' : 'tel'}
                    autoComplete={identityType === 'email' ? 'email' : 'tel'}
                    placeholder={identityType === 'email' ? t('auth:emailPlaceholder') : t('auth:mobilePlaceholder')}
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
                <span>{loading ? t('auth:checkingAccount') : t('auth:continueBtn')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold">{t('auth:orDivider', 'Or continue with')}</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <div className="space-y-2">
                <div id="googleSignInBtn" className="w-full flex justify-center min-h-[44px]"></div>
                {(!window.google?.accounts?.id || !import.meta.env.VITE_GOOGLE_CLIENT_ID) && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(t('auth:googleConfigNotice', 'Google Sign-In is initialized. To complete login, ensure VITE_GOOGLE_CLIENT_ID is configured in the environment. Email OTP sign-in is fully active.'));
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{t('auth:signInWithGoogle', 'Sign in with Google')}</span>
                  </button>
                )}
              </div>

              {error && error.toLowerCase().includes('no account') && (
                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">{t('auth:needAccount')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition"
                  >
                    {t('auth:clickToRegister')}
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* REGISTER STEP 1 */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth:fullName')}
                </label>
                <div className="relative">
                  <input
                    id="reg-name"
                    type="text"
                    placeholder={t('auth:fullNamePlaceholder')}
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
                  {t('auth:emailAddress')} / {t('auth:mobileNumber')}
                </label>
                <div className="relative">
                  <input
                    id="reg-identity"
                    type="text"
                    placeholder={t('auth:identityPlaceholder')}
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{t('auth:identityHelp')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('auth:selectRoleToRegister')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(roleLabels)
                    .filter(([key]) => key !== 'admin' && key !== 'dairyOwner')
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

              {/* Professional Certification for Veterinarians */}
              {selectedRole === 'veterinarian' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>{t('auth:veterinaryCredentialsTitle', 'Veterinary Professional Verification')}</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('auth:vetLicenseNumber', 'Veterinary Registration / License Number')} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VCI/MSVC/2021/04589"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('auth:vetSpecialization', 'Specialization & Qualification')} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.V.Sc & A.H., M.V.Sc (Cattle Surgery)"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-purple-800 italic">
                    {t('auth:vetVerificationHelp', 'Your credentials will be verified by the admin before patient referrals are routed.')}
                  </p>
                </div>
              )}

              {/* Medical Store Verification for Medical Providers */}
              {selectedRole === 'medicalProvider' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>{t('auth:medicalStoreCredentialsTitle', 'Medical Store Business Verification')}</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('auth:drugLicenseNumber', 'Drug License / Pharmacy Registration Number')} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH-PUN-20B-184920"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t('auth:medicalStoreName', 'Pharmacy / Clinic Business Name')} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kisan Veterinary Medical & Agro"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-blue-800 italic">
                    {t('auth:storeVerificationHelp', 'Pharmacy license is required for medicine fulfillment verification by the system admin.')}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex justify-center items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? t('auth:processing') : t('auth:registerAndRequestOtp')}</span>
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
                  {t('auth:alreadyRegistered')} <span className="text-blue-600 font-bold underline">{t('auth:loginHere')}</span>
                </button>
              </div>
            </form>
          )
        )}

        {/* STEP 2: MULTI-ROLE SELECTION */}
        {step === 2 && (
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="font-bold text-sm mb-1">{t('auth:multiRolePromptTitle')}</div>
              <p className="text-blue-700">
                {identity.trim()}
              </p>
            </div>

            <div className="space-y-2.5 my-4">
              {availableRoles.map((r) => {
                const info = roleLabels[r] || { label: r, icon: '👤', desc: '' };
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
              <span>{loading ? t('auth:sendingOtp') : t('auth:continueRequestOtp')}</span>
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
              {t('auth:backToEmail')}
            </button>
          </form>
        )}

        {/* STEP 3: VERIFY OTP FORM */}
        {step === 3 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>{t('auth:selectedRoleLabel')}</span>
                <span className="font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md text-xs">
                  {roleLabels[selectedRole]?.icon} {roleLabels[selectedRole]?.label || selectedRole}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span>{t('auth:otpSentToLabel')}</span>
                <strong className="font-mono text-slate-900">{identity.trim()}</strong>
              </div>
            </div>

            {/* Timer & Expiry Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {otpExpiryTime > 0 ? (
                    <>
                      {t('auth:codeExpiresIn', { time: formatTime(otpExpiryTime) })}
                    </>
                  ) : (
                    <strong className="text-red-600">{t('auth:codeExpired')}</strong>
                  )}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                {t('auth:enterVerificationCode')}
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
              <span>{loading ? t('auth:verifyingCode') : t('auth:verifyAndLogin')}</span>
            </button>

            {/* Resend OTP Action */}
            <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center space-y-2">
              <div className="text-xs text-slate-500">{t('auth:didntReceiveCode')}</div>
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
                    ? t('auth:resendingOtp')
                    : resendCooldown > 0
                    ? t('auth:resendIn', { seconds: resendCooldown })
                    : t('auth:resendOtp')}
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
              {availableRoles.length > 1 ? t('auth:backToRoleSelection') : t('auth:backToEmail')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

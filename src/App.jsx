import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Utensils, 
  Flame, Apple, Coffee, Moon, Sun, AlertCircle, CheckCircle2, 
  Calendar, LogOut, Camera, Loader2, Sparkles, KeyRound
} from 'lucide-react';
import { supabase } from './supabaseClient';

const MEAL_CATEGORIES = [
  { id: 'breakfast', name: 'Breakfast', icon: Coffee },
  { id: 'lunch', name: 'Lunch', icon: Utensils },
  { id: 'dinner', name: 'Dinner', icon: Utensils },
  { id: 'snacks', name: 'Snacks', icon: Apple }
];

const PRESETS = [
  { name: 'Oatmeal & Banana', calories: 350, protein: 12, carbs: 62, fat: 6, category: 'breakfast' },
  { name: '3 Scrambled Eggs', calories: 230, protein: 18, carbs: 2, fat: 15, category: 'breakfast' },
  { name: 'Grilled Chicken Salad', calories: 420, protein: 42, carbs: 12, fat: 14, category: 'lunch' },
  { name: 'Turkey Wrap', calories: 480, protein: 32, carbs: 46, fat: 14, category: 'lunch' },
  { name: 'Salmon & Brown Rice', calories: 580, protein: 44, carbs: 48, fat: 18, category: 'dinner' },
  { name: 'Steak & Sweet Potato', calories: 650, protein: 52, carbs: 42, fat: 22, category: 'dinner' },
  { name: 'Greek Yogurt & Berries', calories: 180, protein: 17, carbs: 20, fat: 2, category: 'snacks' },
  { name: 'Protein Shake', calories: 160, protein: 30, carbs: 4, fat: 3, category: 'snacks' },
  { name: 'Almonds (1 oz)', calories: 165, protein: 6, carbs: 6, fat: 14, category: 'snacks' }
];

export default function App() {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [authError, setAuthError] = useState('');

  const [currentDate, setCurrentDate] = useState(getTodayString);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [entries, setEntries] = useState([]);
  const [activeCategory, setActiveCategory] = useState('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // AI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const fetchDayData = async () => {
      const { data: goalData } = await supabase
        .from('user_settings')
        .select('daily_goal')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (goalData?.daily_goal) {
        setDailyGoal(goalData.daily_goal);
      }

      const { data: mealData, error } = await supabase
        .from('meal_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', currentDate)
        .order('created_at', { ascending: true });

      if (!error && mealData) {
        setEntries(mealData);
      }
    };

    fetchDayData();
  }, [session, currentDate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword
      });
      if (error) setAuthError(error.message);
      else alert('Signup successful! Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });
      if (error) setAuthError(error.message);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail) {
      setAuthError('Please enter your email address first.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: window.location.origin
    });

    if (error) {
      setAuthError(error.message);
    } else {
      alert('Password reset link sent! Check your email inbox.');
      setIsResetMode(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!newPassword || newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setAuthError(error.message);
    } else {
      alert('Password successfully updated! You can now use your account.');
      setIsRecoverySession(false);
      setNewPassword('');
    }
  };

  const handleUpdateGoal = async (newGoal) => {
    const val = Number(newGoal) || 2000;
    setDailyGoal(val);
    if (!session?.user) return;

    await supabase.from('user_settings').upsert({
      user_id: session.user.id,
      daily_goal: val,
      updated_at: new Date().toISOString()
    });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!foodName || !calories || !session?.user) return;

    const newRecord = {
      user_id: session.user.id,
      date: currentDate,
      name: foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      category: activeCategory
    };

    const { data, error } = await supabase
      .from('meal_entries')
      .insert([newRecord])
      .select();

    if (!error && data) {
      setEntries((prev) => [...prev, data[0]]);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setAiSuccessMessage('');
    }
  };

  const handleAddPreset = async (item) => {
    if (!session?.user) return;

    const newRecord = {
      user_id: session.user.id,
      date: currentDate,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      category: item.category
    };

    const { data, error } = await supabase
      .from('meal_entries')
      .insert([newRecord])
      .select();

    if (!error && data) {
      setEntries((prev) => [...prev, data[0]]);
    }
  };

  const handleDeleteEntry = async (id) => {
    const { error } = await supabase
      .from('meal_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setEntries((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 900;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(dataUrl.split(',')[1]);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result.toString();
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAiSuccessMessage('');

    try {
      const base64Data = await compressImage(file);

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is missing in environment variables.');
      }

      const prompt = `Analyze this food image. Provide a realistic estimate of the meal summary name, calories, protein (g), carbs (g), fat (g), and category ("breakfast", "lunch", "dinner", or "snacks"). Return JSON only: {"name":"Meal Name","calories":500,"protein":30,"carbs":40,"fat":15,"category":"lunch"}`;

      // Direct call to Gemini 2.5 Flash on v1beta
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API error code: ${res.status}`);
      }

      const resData = await res.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setFoodName(String(parsed.name || 'AI Analyzed Meal'));
      setCalories(parsed.calories ? String(Math.round(Number(parsed.calories))) : '0');
      setProtein(parsed.protein ? String(Math.round(Number(parsed.protein))) : '0');
      setCarbs(parsed.carbs ? String(Math.round(Number(parsed.carbs))) : '0');
      setFat(parsed.fat ? String(Math.round(Number(parsed.fat))) : '0');

      if (parsed.category && ['breakfast', 'lunch', 'dinner', 'snacks'].includes(parsed.category.toLowerCase())) {
        setActiveCategory(parsed.category.toLowerCase());
      }

      setAiSuccessMessage('Meal analyzed! Verify the numbers and tap "Add Entry".');
    } catch (err) {
      alert(`AI Scan error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        try {
          fileInputRef.current.value = '';
        } catch {
          // ignore Safari quirks
        }
      }
    }
  };

  const changeDate = (days) => {
    const parts = currentDate.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setCurrentDate(`${year}-${month}-${day}`);
  };

  const getDateLabel = () => {
    const todayStr = getTodayString();
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;

    const tDate = new Date();
    tDate.setDate(tDate.getDate() + 1);
    const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;

    if (currentDate === todayStr) return 'Today';
    if (currentDate === yStr) return 'Yesterday';
    if (currentDate === tStr) return 'Tomorrow';

    const parts = currentDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: '#fff' }}>
        Connecting to cloud...
      </div>
    );
  }

  // Active password recovery flow (after clicking link in email)
  if (isRecoverySession) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '20px',
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: '#1e293b',
          padding: '30px',
          borderRadius: '16px',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            <KeyRound color="#f97316" size={30} />
            <h2 style={{ margin: 0, fontSize: '22px' }}>Set New Password</h2>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: '-10px', marginBottom: '24px' }}>
            Enter your new account password below.
          </p>

          {authError && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px',
                borderRadius: '8px',
                background: '#f97316',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login / Signup / Password Reset Request view
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '20px',
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: '#1e293b',
          padding: '30px',
          borderRadius: '16px',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            <Flame color="#f97316" size={32} />
            <h2 style={{ margin: 0, fontSize: '24px' }}>Calorie Cloud</h2>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: '-10px', marginBottom: '24px' }}>
            {isResetMode
              ? 'Enter your email to receive a password reset link'
              : isSignUp
              ? 'Create an account to sync logs across devices'
              : 'Sign in to access your persistent cloud logs'}
          </p>

          {authError && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => { setIsResetMode(false); setAuthError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />

              {!isSignUp && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(true); setAuthError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                {isSignUp ? 'Sign Up' : 'Log In'}
              </button>
            </form>
          )}

          {!isResetMode && (
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '13px',
                marginTop: '16px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const totals = entries.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0),
      fat: acc.fat + (Number(item.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goalNumber = Number(dailyGoal) || 2000;
  const remainingCalories = goalNumber - totals.calories;
  const isOverBudget = remainingCalories < 0;
  const progressPercent = Math.min(100, Math.round((totals.calories / goalNumber) * 100));

  return (
    <div style={{
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden',
      backgroundColor: darkMode ? '#121212' : '#f8fafc',
      color: darkMode ? '#f1f5f9' : '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 40px)',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* Top Header with iOS Dynamic Island & Status Bar Padding */}
      <header style={{
        maxWidth: '560px',
        margin: '0 auto',
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)',
        paddingBottom: '14px',
        paddingLeft: '20px',
        paddingRight: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame color="#f97316" size={26} />
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Calorie Tracker</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: darkMode ? '#27272a' : '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              color: 'inherit'
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            title="Log out"
            style={{
              background: darkMode ? '#27272a' : '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              color: 'inherit'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', width: '100%' }}>
        
        {/* Date Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: darkMode ? '#1e1e24' : '#ffffff',
          padding: '8px 14px',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <button onClick={() => changeDate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '6px' }}>
            <ChevronLeft size={22} />
          </button>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Calendar size={17} color="#f97316" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>{getDateLabel()}</span>
              <span style={{ fontSize: '11px', color: '#888' }}>{currentDate}</span>
            </div>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentDate !== getTodayString() && (
              <button
                onClick={() => setCurrentDate(getTodayString())}
                style={{ background: darkMode ? '#27272a' : '#f1f5f9', color: '#f97316', border: '1px solid #f97316', borderRadius: '10px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
            <button onClick={() => changeDate(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '6px' }}>
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div style={{
          background: isOverBudget ? (darkMode ? '#3b1212' : '#fef2f2') : (darkMode ? '#0f291e' : '#f0fdf4'),
          border: `1.5px solid ${isOverBudget ? '#ef4444' : '#10b981'}`,
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOverBudget ? <AlertCircle size={20} color="#ef4444" /> : <CheckCircle2 size={20} color="#10b981" />}
              <span style={{ fontSize: '14px', fontWeight: '700', color: isOverBudget ? '#ef4444' : '#10b981' }}>
                {isOverBudget ? 'Over Budget' : 'Remaining Calories'}
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '20px', background: isOverBudget ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isOverBudget ? '#ef4444' : '#10b981' }}>
              {isOverBudget ? `${Math.abs(remainingCalories)} kcal over` : `${Math.round(((goalNumber - totals.calories) / goalNumber) * 100)}% left`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1, color: isOverBudget ? '#ef4444' : (darkMode ? '#34d399' : '#059669') }}>
              {Math.abs(remainingCalories).toLocaleString()}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#888' }}>
              kcal {isOverBudget ? 'over target' : 'left for today'}
            </span>
          </div>
        </div>

        {/* Progress Ring Card */}
        <div style={{
          background: darkMode ? '#1e1e24' : '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={darkMode ? '#33333d' : '#e2e8f0'} strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="transparent"
                stroke={isOverBudget ? '#ef4444' : '#f97316'}
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '800' }}>{totals.calories}</span>
              <span style={{ fontSize: '13px', color: '#888' }}>of {goalNumber} kcal</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', textAlign: 'center', gap: '12px', borderTop: darkMode ? '1px solid #2e2e38' : '1px solid #f1f5f9', paddingTop: '16px', boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#888' }}>Total Eaten</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{totals.calories} kcal</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#888' }}>Target Goal</div>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => handleUpdateGoal(e.target.value)}
                style={{ width: '90px', textAlign: 'center', fontWeight: '700', fontSize: '18px', background: darkMode ? '#27272a' : '#f1f5f9', color: 'inherit', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '2px 6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Macros */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', gap: '10px', background: darkMode ? '#26262e' : '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center', boxSizing: 'border-box' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>Protein</span>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{totals.protein}g</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>Carbs</span>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{totals.carbs}g</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#ec4899', fontWeight: '600' }}>Fat</span>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{totals.fat}g</div>
            </div>
          </div>
        </div>

        {/* AI Scanner Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          borderRadius: '16px',
          padding: '16px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(249, 115, 22, 0.25)',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} /> AI Meal Scanner
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Take a photo to estimate calories & macros
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            style={{
              background: '#fff',
              color: '#ea580c',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isAnalyzing ? 'wait' : 'pointer'
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Camera size={16} /> Snap Photo
              </>
            )}
          </button>
        </div>

        {aiSuccessMessage && (
          <div style={{
            background: darkMode ? '#143823' : '#dcfce7',
            border: '1px solid #10b981',
            color: darkMode ? '#34d399' : '#15803d',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '500',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            {aiSuccessMessage}
          </div>
        )}

        {/* Quick Add Presets */}
        <div style={{ background: darkMode ? '#1e1e24' : '#ffffff', borderRadius: '16px', padding: '16px', boxSizing: 'border-box', width: '100%' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: '#888' }}>QUICK ADD PRESETS</h3>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAddPreset(p)}
                style={{
                  flexShrink: 0,
                  background: darkMode ? '#27272a' : '#f1f5f9',
                  border: '1px solid rgba(0,0,0,0.06)',
                  color: 'inherit',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#f97316' }}>{p.calories} kcal • {p.protein}g P</div>
              </button>
            ))}
          </div>
        </div>

        {/* Add Food Form */}
        <form onSubmit={handleAddEntry} style={{ background: darkMode ? '#1e1e24' : '#ffffff', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box', width: '100%' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#888' }}>LOG FOOD</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
            {MEAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: activeCategory === cat.id ? '#f97316' : (darkMode ? '#27272a' : '#f1f5f9'),
                  color: activeCategory === cat.id ? '#fff' : 'inherit',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <input
              type="text"
              placeholder="Food name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit',
                fontSize: '14px'
              }}
              required
            />
            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit',
                fontSize: '14px'
              }}
              required
            />
          </div>

          {/* 3-Column Macro Inputs with Guaranteed Container Bounds */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <input
              type="number"
              placeholder="Protein (g)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit',
                fontSize: '13px'
              }}
            />
            <input
              type="number"
              placeholder="Carbs (g)"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit',
                fontSize: '13px'
              }}
            />
            <input
              type="number"
              placeholder="Fat (g)"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              style={{
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit',
                fontSize: '13px'
              }}
            />
          </div>

          <button
            type="submit"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '10px', background: '#f97316', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
          >
            <Plus size={18} /> Add Entry
          </button>
        </form>

        {/* Meal History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '4px 0', color: '#888' }}>
            LOGS FOR {getDateLabel().toUpperCase()} ({entries.length})
          </h3>

          {entries.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: darkMode ? '#1e1e24' : '#ffffff', borderRadius: '14px', color: '#888', fontSize: '14px', boxSizing: 'border-box', width: '100%' }}>
              No items logged for this day.
            </div>
          ) : (
            entries.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: darkMode ? '#1e1e24' : '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  boxSizing: 'border-box',
                  width: '100%'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span style={{ textTransform: 'capitalize', color: '#f97316', fontWeight: '500' }}>{item.category}</span>
                    <span>• P: {item.protein}g</span>
                    <span>• C: {item.carbs}g</span>
                    <span>• F: {item.fat}g</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{item.calories} kcal</span>
                  <button
                    onClick={() => handleDeleteEntry(item.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
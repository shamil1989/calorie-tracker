import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight, Utensils, 
  Flame, Apple, Coffee, Moon, Sun, AlertCircle, CheckCircle2, 
  Calendar, LogOut, Camera, Loader2, Sparkles, KeyRound, User, 
  Activity, MapPin, Save, Mail, Lock, UserCheck, ShieldAlert, Database
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
  const [isGuestLoading, setIsGuestLoading] = useState(false);
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

  // Edit log state
  const [editingEntryId, setEditingEntryId] = useState(null);
  const formRef = useRef(null);

  // Database Autocomplete State
  const [dbSuggestions, setDbSuggestions] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef(null);

  // AI Meal Scanner State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  // Account Modal & Profile State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [activeAccountTab, setActiveAccountTab] = useState('about');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [aboutSavedMessage, setAboutSavedMessage] = useState('');

  // Guest Account Upgrade State
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');

  // Body Profile State
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('10');
  const [weightLbs, setWeightLbs] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);

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
      try {
        const { data: goalData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (goalData) {
          if (goalData.daily_goal) setDailyGoal(goalData.daily_goal);
          if (goalData.first_name) setFirstName(goalData.first_name);
          if (goalData.last_name) setLastName(goalData.last_name);
          if (goalData.location) setLocation(goalData.location);
          if (goalData.height_feet) setHeightFeet(String(goalData.height_feet));
          if (goalData.height_inches) setHeightInches(String(goalData.height_inches));
          if (goalData.weight_lbs) setWeightLbs(String(goalData.weight_lbs));
          if (goalData.age) setAge(String(goalData.age));
          if (goalData.gender) setGender(goalData.gender);
          if (goalData.activity_level) setActivityLevel(goalData.activity_level);
          if (goalData.ai_profile_analysis) setAiAssessment(goalData.ai_profile_analysis);
        }

        const { data: mealData, error } = await supabase
          .from('meal_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', currentDate)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(mealData)) {
          setEntries(mealData);
        }
      } catch (err) {
        console.error('Failed to load meal data:', err);
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

  const handleGuestSignIn = async () => {
    setAuthError('');
    setIsGuestLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || 'Failed to initialize guest session. Please verify Anonymous Auth is enabled in Supabase.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleUpgradeAccount = async (e) => {
    e.preventDefault();
    setUpgradeError('');
    setUpgradeSuccess('');

    if (!upgradeEmail || !upgradePassword || upgradePassword.length < 6) {
      setUpgradeError('Please provide a valid email and a password of at least 6 characters.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: upgradeEmail,
        password: upgradePassword
      });

      if (error) throw error;
      setUpgradeSuccess('Account linked successfully! Please check your email inbox to confirm your address.');
      setTimeout(() => setUpgradeSuccess(''), 4000);
    } catch (err) {
      setUpgradeError(err.message);
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

  const isAnonymousUser = Boolean(session?.user?.is_anonymous || !session?.user?.email);

  const getUserInitials = () => {
    if (isAnonymousUser) return 'G';
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    if (f || l) return `${f}${l}`;
    if (session?.user?.email) return session.user.email.charAt(0).toUpperCase();
    return null;
  };

  const handleSaveAboutUser = async (e) => {
    e.preventDefault();
    if (!session?.user) return;

    setAboutSavedMessage('');
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        location: location.trim(),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      setAboutSavedMessage('Profile information saved successfully!');
      setTimeout(() => setAboutSavedMessage(''), 3000);
    } catch (err) {
      alert(`Failed to save profile: ${err.message}`);
    }
  };

  // --- FAST SUPABASE DATABASE SEARCH (Prioritizing staples) ---
  const fetchDatabaseSuggestions = async (searchTerm) => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setDbSuggestions([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);

    try {
      const { data, error } = await supabase.rpc('search_foods', {
        search_term: query
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        setDbSuggestions(data);
        setShowSuggestions(true);
      } else {
        // Fallback to direct query if RPC isn't configured
        const { data: fallbackData } = await supabase
          .from('food_database')
          .select('id, name, calories, protein, carbs, fat, fiber, serving_size_g')
          .ilike('name', `%${query}%`)
          .limit(8);

        setDbSuggestions(fallbackData || []);
        setShowSuggestions(Boolean(fallbackData?.length));
      }
    } catch (err) {
      console.error('Database food lookup failed:', err);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const handleFoodNameChange = (val) => {
    setFoodName(val);
    setShowSuggestions(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 2) {
      setDbSuggestions([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    debounceTimerRef.current = setTimeout(() => {
      fetchDatabaseSuggestions(val);
    }, 180);
  };

  const handleSelectSuggestion = (item) => {
    setFoodName(item.name || '');
    setCalories(item.calories !== undefined ? String(Math.round(Number(item.calories))) : '0');
    setProtein(item.protein !== undefined ? String(Math.round(Number(item.protein) * 10) / 10) : '0');
    setCarbs(item.carbs !== undefined ? String(Math.round(Number(item.carbs) * 10) / 10) : '0');
    setFat(item.fat !== undefined ? String(Math.round(Number(item.fat) * 10) / 10) : '0');
    setShowSuggestions(false);
  };

  // AI BODY ASSESSMENT & TARGET CALORIES
  const handleCalculateAiGoal = async (e) => {
    e.preventDefault();
    if (!weightLbs || !heightFeet) {
      alert('Please enter your height and weight.');
      return;
    }

    setProfileLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY is not configured in your environment variables.');
      }

      const prompt = `You are an expert sports nutritionist and dietitian.
Analyze this user profile:
- Name: ${firstName ? `${firstName} ${lastName}` : 'User'}
- Height: ${heightFeet} feet ${heightInches || 0} inches
- Weight: ${weightLbs} lbs
- Age: ${age || 30} years old
- Gender: ${gender}
- Activity Level: ${activityLevel}

Task:
1. Determine their Body Mass Index (BMI) and categorization (Underweight, Normal, Overweight, Obese).
2. If their weight is too high for their height, recommend a safe caloric deficit goal for sustainable fat loss (-1 to -1.5 lbs/week).
3. If they are in a normal range, recommend a maintenance calorie goal.
4. If underweight, recommend a healthy surplus.
5. Provide a supportive, concise 2-sentence rationale.

Return strictly pure JSON with no markdown wrapping:
{
  "bmi": 26.4,
  "status": "Overweight",
  "weightProportionEvaluation": "Your weight is currently above the optimal range for your height.",
  "recommendedDailyCalories": 1950,
  "recommendedMacros": {
    "proteinGrams": 160,
    "carbsGrams": 180,
    "fatGrams": 65
  },
  "rationale": "We targeted a gentle 450 kcal deficit below your estimated maintenance of 2400 kcal to promote steady fat loss while preserving lean muscle mass."
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
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

      setAiAssessment(parsed);

      await supabase.from('user_settings').upsert({
        user_id: session.user.id,
        height_feet: Number(heightFeet),
        height_inches: Number(heightInches) || 0,
        weight_lbs: Number(weightLbs),
        age: Number(age) || null,
        gender,
        activity_level: activityLevel,
        ai_profile_analysis: parsed,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      alert(`AI Goal Calculation Error: ${err.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const applyRecommendedGoal = async () => {
    if (!aiAssessment?.recommendedDailyCalories) return;
    await handleUpdateGoal(aiAssessment.recommendedDailyCalories);
    alert(`Daily goal updated to ${aiAssessment.recommendedDailyCalories} kcal!`);
    setShowAccountModal(false);
  };

  const resetForm = () => {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setEditingEntryId(null);
    setAiSuccessMessage('');
    setShowSuggestions(false);
    setDbSuggestions([]);
  };

  const handleStartEdit = (item) => {
    if (!item) return;
    setEditingEntryId(item.id);
    setFoodName(item.name || '');
    setCalories(item.calories !== undefined && item.calories !== null ? String(item.calories) : '');
    setProtein(item.protein !== undefined && item.protein !== null ? String(item.protein) : '');
    setCarbs(item.carbs !== undefined && item.carbs !== null ? String(item.carbs) : '');
    setFat(item.fat !== undefined && item.fat !== null ? String(item.fat) : '');
    if (item.category && ['breakfast', 'lunch', 'dinner', 'snacks'].includes(item.category.toLowerCase())) {
      setActiveCategory(item.category.toLowerCase());
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAddOrUpdateEntry = async (e) => {
    e.preventDefault();
    if (!foodName || !calories || !session?.user) return;

    const parsedCalories = Number(calories) || 0;
    const parsedProtein = Number(protein) || 0;
    const parsedCarbs = Number(carbs) || 0;
    const parsedFat = Number(fat) || 0;

    if (editingEntryId) {
      const updatedFields = {
        name: foodName.trim(),
        calories: parsedCalories,
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFat,
        category: activeCategory
      };

      try {
        const { data, error } = await supabase
          .from('meal_entries')
          .update(updatedFields)
          .eq('id', editingEntryId)
          .eq('user_id', session.user.id)
          .select();

        if (error) {
          alert(`Could not update entry: ${error.message}`);
          return;
        }

        const updatedRow = (data && data.length > 0) 
          ? data[0] 
          : { id: editingEntryId, date: currentDate, user_id: session.user.id, ...updatedFields };

        setEntries((prev) => prev.map((item) => (item.id === editingEntryId ? updatedRow : item)));
        resetForm();
      } catch (err) {
        alert(`Error saving edit: ${err.message}`);
      }
    } else {
      const newRecord = {
        user_id: session.user.id,
        date: currentDate,
        name: foodName.trim(),
        calories: parsedCalories,
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFat,
        category: activeCategory
      };

      try {
        const { data, error } = await supabase
          .from('meal_entries')
          .insert([newRecord])
          .select();

        if (error) {
          alert(`Could not add entry: ${error.message}`);
          return;
        }

        if (data && data.length > 0) {
          setEntries((prev) => [...prev, data[0]]);
        }
        resetForm();
      } catch (err) {
        alert(`Error adding entry: ${err.message}`);
      }
    }
  };

  const handleAddPreset = async (item) => {
    if (!session?.user || !item) return;

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

    try {
      const { data, error } = await supabase
        .from('meal_entries')
        .insert([newRecord])
        .select();

      if (!error && data && data.length > 0) {
        setEntries((prev) => [...prev, data[0]]);
      }
    } catch (err) {
      console.error('Failed to add preset:', err);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (editingEntryId === id) {
      resetForm();
    }
    try {
      const { error } = await supabase
        .from('meal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (!error) {
        setEntries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 850;
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
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

  // AI MEAL SCANNER (Gemini Vision)
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
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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

  const initials = getUserInitials();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0b0f17', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        Connecting to cloud...
      </div>
    );
  }

  if (isRecoverySession) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f17',
        padding: '20px',
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(17, 24, 39, 0.95)',
          padding: '32px 28px',
          borderRadius: '20px',
          color: '#fff',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <KeyRound color="#f97316" size={28} />
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Set New Password</h2>
          </div>

          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: 0, marginBottom: '24px' }}>
            Enter your new account password below.
          </p>

          {authError && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: '#1b2234',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
              }}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f17',
        padding: '24px',
        paddingTop: 'calc(env(safe-area-inset-top, 20px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 24px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}>
        <h2 style={{
          margin: '0 0 24px 0',
          fontSize: '22px',
          fontWeight: '700',
          letterSpacing: '-0.3px',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #fb923c 0%, #fde68a 50%, #f97316 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Track smart. Eat with purpose.
        </h2>

        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: 'rgba(17, 24, 39, 0.92)',
          padding: '32px 28px',
          borderRadius: '24px',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(249, 115, 22, 0.3)',
              filter: 'blur(14px)'
            }} />
            <Flame color="#f97316" size={40} style={{ position: 'relative', zIndex: 1 }} />
          </div>

          <h1 style={{ margin: '0 0 4px 0', fontSize: '26px', fontWeight: '800', textAlign: 'center', letterSpacing: '-0.5px' }}>
            BiteTracks
          </h1>

          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: 0, marginBottom: '24px' }}>
            {isResetMode
              ? 'Enter your email to receive a password reset link'
              : isSignUp
              ? 'Create an account to start tracking'
              : 'Sign in to your persistent bite logs'}
          </p>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {authError}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: '#1b2234',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '4px',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
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
                  marginTop: '6px'
                }}
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#1b2234',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#1b2234',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {!isSignUp && (
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(true); setAuthError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
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
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: '4px',
                    boxShadow: '0 6px 18px rgba(249, 115, 22, 0.35)'
                  }}
                >
                  {isSignUp ? 'Sign Up' : 'Log In'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>

              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={isGuestLoading}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isGuestLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isGuestLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Starting guest mode...
                  </>
                ) : (
                  <>
                    <User size={16} color="#f97316" /> Continue as Guest
                  </>
                )}
              </button>
            </>
          )}

          {!isResetMode && (
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f97316',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const totals = (entries || []).reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item?.calories) || 0),
      protein: acc.protein + (Number(item?.protein) || 0),
      carbs: acc.carbs + (Number(item?.carbs) || 0),
      fat: acc.fat + (Number(item?.fat) || 0),
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
      {isAnonymousUser && (
        <div style={{
          background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <ShieldAlert size={15} />
          <span>You are browsing as a guest.</span>
          <button
            onClick={() => {
              setActiveAccountTab('about');
              setShowAccountModal(true);
            }}
            style={{
              background: '#fff',
              color: '#78350f',
              border: 'none',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Create Permanent Account
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{
        maxWidth: '560px',
        margin: '0 auto',
        paddingTop: isAnonymousUser ? '10px' : 'calc(env(safe-area-inset-top, 20px) + 14px)',
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
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>BiteTracks</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAccountModal(true)}
            title="My Account"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: initials ? '1.5px solid #f97316' : 'none',
              background: initials ? 'rgba(249, 115, 22, 0.15)' : (darkMode ? '#27272a' : '#e2e8f0'),
              color: initials ? '#f97316' : 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '13px',
              letterSpacing: '0.5px',
              boxSizing: 'border-box'
            }}
          >
            {initials ? initials : <User size={18} />}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: darkMode ? '#27272a' : '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            title={isAnonymousUser ? "Exit Guest Mode" : "Log out"}
            style={{
              background: darkMode ? '#27272a' : '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
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

        {/* AI Scanner Card (Gemini) */}
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
              Take a photo to estimate calories & macros with Gemini
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

        {/* Add / Edit Food Form */}
        <form 
          ref={formRef}
          onSubmit={handleAddOrUpdateEntry} 
          style={{ 
            background: darkMode ? '#1e1e24' : '#ffffff', 
            borderRadius: '16px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            boxSizing: 'border-box', 
            width: '100%',
            border: editingEntryId ? '2px solid #f97316' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: editingEntryId ? '#f97316' : '#888' }}>
              {editingEntryId ? 'EDIT FOOD ENTRY' : 'LOG FOOD'}
            </h3>
            {editingEntryId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: 0 }}
              >
                <X size={14} /> Cancel Edit
              </button>
            )}
          </div>
          
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

          {/* Row 1: Single Food Name Input & Calories Input */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#888' }}>Food Name</label>
                {isSearchingDb && (
                  <span style={{ fontSize: '10px', color: '#f97316', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Loader2 size={10} className="animate-spin" /> Searching DB...
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Search 1.8M foods (e.g. Avocado, chicken)..."
                value={foodName}
                onChange={(e) => handleFoodNameChange(e.target.value)}
                onFocus={() => foodName.trim().length >= 2 && setShowSuggestions(true)}
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

              {/* Suggestions Dropdown */}
              {showSuggestions && dbSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: darkMode ? '#1c1f26' : '#ffffff',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                  marginTop: '4px',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {dbSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={() => handleSelectSuggestion(item)}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: darkMode ? '1px solid #283040' : '1px solid #f1f5f9'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = darkMode ? '#283046' : '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                        <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span style={{ color: '#f97316' }}>{Math.round(item.calories)} kcal</span>
                          <span>• P: {Math.round(item.protein)}g</span>
                          <span>• C: {Math.round(item.carbs)}g</span>
                          <span>• F: {Math.round(item.fat)}g</span>
                        </div>
                      </div>
                      <Database size={13} color="#f97316" style={{ opacity: 0.6, flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calories Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#f97316' }}>Calories (kcal)</label>
              <input
                type="number"
                placeholder="0"
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
          </div>

          {/* Row 2: Macros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8' }}>Protein (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b' }}>Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#ec4899' }}>Fat (g)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
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
          </div>

          <button
            type="submit"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              padding: '12px', 
              borderRadius: '10px', 
              background: '#f97316', 
              color: '#fff', 
              border: 'none', 
              fontWeight: '700', 
              cursor: 'pointer', 
              width: '100%', 
              boxSizing: 'border-box' 
            }}
          >
            {editingEntryId ? (
              <>
                <Edit2 size={16} /> Update Entry
              </>
            ) : (
              <>
                <Plus size={18} /> Add Entry
              </>
            )}
          </button>
        </form>

        {/* Meal History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '4px 0', color: '#888' }}>
            LOGS FOR {getDateLabel().toUpperCase()} ({(entries || []).length})
          </h3>

          {(!entries || entries.length === 0) ? (
            <div style={{ padding: '24px', textAlign: 'center', background: darkMode ? '#1e1e24' : '#ffffff', borderRadius: '14px', color: '#888', fontSize: '14px', boxSizing: 'border-box', width: '100%' }}>
              No items logged for this day.
            </div>
          ) : (
            entries.map((item) => {
              if (!item) return null;
              return (
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
                    width: '100%',
                    border: editingEntryId === item.id ? '1.5px solid #f97316' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.name || 'Unnamed Food'}</div>
                    <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span style={{ textTransform: 'capitalize', color: '#f97316', fontWeight: '500' }}>{item.category || 'General'}</span>
                      <span>• P: {item.protein ?? 0}g</span>
                      <span>• C: {item.carbs ?? 0}g</span>
                      <span>• F: {item.fat ?? 0}g</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{item.calories ?? 0} kcal</span>
                    <button
                      onClick={() => handleStartEdit(item)}
                      title="Edit entry"
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      title="Delete entry"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Account Modal */}
      {showAccountModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: darkMode ? '#1e1e24' : '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxSizing: 'border-box',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '12px'
                }}>
                  {initials ? initials : <User size={16} />}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {isAnonymousUser ? 'Guest Profile' : 'My Account'}
                </h2>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: darkMode ? '#27272a' : '#f1f5f9',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => setActiveAccountTab('about')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeAccountTab === 'about' ? (darkMode ? '#1e1e24' : '#ffffff') : 'transparent',
                  color: activeAccountTab === 'about' ? '#f97316' : '#888',
                  boxShadow: activeAccountTab === 'about' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <User size={15} /> About You
              </button>
              <button
                type="button"
                onClick={() => setActiveAccountTab('body')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeAccountTab === 'body' ? (darkMode ? '#1e1e24' : '#ffffff') : 'transparent',
                  color: activeAccountTab === 'body' ? '#f97316' : '#888',
                  boxShadow: activeAccountTab === 'body' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Activity size={15} /> Body Profile
              </button>
            </div>

            {/* TAB 1: ABOUT USER */}
            {activeAccountTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isAnonymousUser && (
                  <div style={{
                    background: darkMode ? '#261b12' : '#fffbeb',
                    border: '1.5px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '16px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <UserCheck size={18} color="#d97706" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#fbbf24' : '#b45309' }}>
                        Upgrade to Permanent Account
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      Attach an email and password to sync your logs across all devices without losing any meals you logged as a guest.
                    </p>

                    {upgradeError && (
                      <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' }}>
                        {upgradeError}
                      </div>
                    )}
                    {upgradeSuccess && (
                      <div style={{ background: '#10b98120', border: '1px solid #10b981', color: '#10b981', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' }}>
                        {upgradeSuccess}
                      </div>
                    )}

                    <form onSubmit={handleUpgradeAccount} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="email"
                        placeholder="Your email"
                        value={upgradeEmail}
                        onChange={(e) => setUpgradeEmail(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#1e1e24' : '#fff',
                          color: 'inherit',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="password"
                        placeholder="Create password (min 6 chars)"
                        value={upgradePassword}
                        onChange={(e) => setUpgradePassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#1e1e24' : '#fff',
                          color: 'inherit',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: '#f97316',
                          color: '#fff',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        Save Account & Sync Logs
                      </button>
                    </form>
                  </div>
                )}

                <form onSubmit={handleSaveAboutUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                    Manage your personal profile details.
                  </p>

                  {aboutSavedMessage && (
                    <div style={{
                      background: darkMode ? '#143823' : '#dcfce7',
                      border: '1px solid #10b981',
                      color: darkMode ? '#34d399' : '#15803d',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {aboutSavedMessage}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Location</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <MapPin size={16} color="#888" style={{ position: 'absolute', left: '12px' }} />
                      <input
                        type="text"
                        placeholder="City, State"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Account Email</label>
                    <input
                      type="email"
                      value={session?.user?.email || (isAnonymousUser ? 'Guest Mode (No email linked)' : '')}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                        background: darkMode ? '#18181b' : '#f1f5f9',
                        color: '#888',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#f97316',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    <Save size={16} /> Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: BODY PROFILE */}
            {activeAccountTab === 'body' && (
              <div>
                <p style={{ fontSize: '13px', color: '#888', marginTop: 0, marginBottom: '14px' }}>
                  Input your measurements. Gemini evaluates your proportions and calculates an ideal caloric target.
                </p>

                <form onSubmit={handleCalculateAiGoal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Height</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="5"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                            background: darkMode ? '#27272a' : '#fff',
                            color: 'inherit',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#888' }}>ft</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="10"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                            background: darkMode ? '#27272a' : '#fff',
                            color: 'inherit',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <span style={{ fontSize: '13px', color: '#888' }}>in</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Weight (lbs)</label>
                      <input
                        type="number"
                        placeholder="e.g. 175"
                        value={weightLbs}
                        onChange={(e) => setWeightLbs(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Age (years)</label>
                      <input
                        type="number"
                        placeholder="e.g. 28"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#888', display: 'block', marginBottom: '4px' }}>Activity Level</label>
                      <select
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                          background: darkMode ? '#27272a' : '#fff',
                          color: 'inherit',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="sedentary">Sedentary (desk job)</option>
                        <option value="light">Lightly Active (1-2 days/wk)</option>
                        <option value="moderate">Moderately Active (3-5 days/wk)</option>
                        <option value="heavy">Very Active (6-7 days/wk)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: '#f97316',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '700',
                      cursor: profileLoading ? 'wait' : 'pointer',
                      marginTop: '6px'
                    }}
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Evaluating Proportions with Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Evaluate Body Proportions & Set Goal
                      </>
                    )}
                  </button>
                </form>

                {aiAssessment && (
                  <div style={{
                    marginTop: '18px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: darkMode ? '#27272a' : '#f8fafc',
                    border: '1.5px solid #f97316',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#f97316' }}>Gemini Body Assessment</span>
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', fontWeight: '600' }}>
                        BMI: {aiAssessment.bmi || 'N/A'} ({aiAssessment.status || 'Calculated'})
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                      {aiAssessment.weightProportionEvaluation}
                    </p>

                    <div style={{ background: darkMode ? '#1e1e24' : '#fff', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Recommended Daily Target</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#f97316' }}>
                          {aiAssessment.recommendedDailyCalories} kcal
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyRecommendedGoal}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={14} /> Apply This Goal
                      </button>
                    </div>

                    {aiAssessment.recommendedMacros && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                        <div style={{ padding: '6px', background: darkMode ? '#1e1e24' : '#fff', borderRadius: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>Protein</span>
                          <div style={{ fontSize: '14px', fontWeight: '700' }}>{aiAssessment.recommendedMacros.proteinGrams}g</div>
                        </div>
                        <div style={{ padding: '6px', background: darkMode ? '#1e1e24' : '#fff', borderRadius: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>Carbs</span>
                          <div style={{ fontSize: '14px', fontWeight: '700' }}>{aiAssessment.recommendedMacros.carbsGrams}g</div>
                        </div>
                        <div style={{ padding: '6px', background: darkMode ? '#1e1e24' : '#fff', borderRadius: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#ec4899', fontWeight: '600' }}>Fat</span>
                          <div style={{ fontSize: '14px', fontWeight: '700' }}>{aiAssessment.recommendedMacros.fatGrams}g</div>
                        </div>
                      </div>
                    )}

                    {aiAssessment.rationale && (
                      <p style={{ fontSize: '12px', color: '#888', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{aiAssessment.rationale}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
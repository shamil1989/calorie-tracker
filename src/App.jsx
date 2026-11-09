import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Utensils, 
  Flame, Award, Target, Apple, Coffee, Moon, Sun, AlertCircle, CheckCircle2
} from 'lucide-react';

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
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [currentDate, setCurrentDate] = useState(getTodayString);
  const [dailyGoal, setDailyGoal] = useState(() => {
    return Number(localStorage.getItem('calorie_goal')) || 2200;
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('calorie_logs');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeCategory, setActiveCategory] = useState('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('calorie_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (dailyGoal) {
      localStorage.setItem('calorie_goal', dailyGoal.toString());
    }
  }, [dailyGoal]);

  const currentEntries = logs[currentDate] || [];

  const totals = currentEntries.reduce(
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

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    const newEntry = {
      id: Date.now().toString(),
      name: foodName,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      category: activeCategory
    };

    setLogs((prev) => ({
      ...prev,
      [currentDate]: [...(prev[currentDate] || []), newEntry]
    }));

    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleAddPreset = (item) => {
    const newEntry = {
      id: Date.now().toString(),
      ...item
    };

    setLogs((prev) => ({
      ...prev,
      [currentDate]: [...(prev[currentDate] || []), newEntry]
    }));
  };

  const handleDeleteEntry = (id) => {
    setLogs((prev) => ({
      ...prev,
      [currentDate]: (prev[currentDate] || []).filter((item) => item.id !== id)
    }));
  };

  const changeDate = (days) => {
    const date = new Date(currentDate + 'T00:00:00');
    date.setDate(date.getDate() + days);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#121212' : '#f8fafc',
      color: darkMode ? '#f1f5f9' : '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '60px',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      {/* Top Bar */}
      <header style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame color="#f97316" size={26} />
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Calorie Tracker</h1>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: darkMode ? '#27272a' : '#e2e8f0',
            border: 'none',
            borderRadius: '50%',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'inherit'
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Date Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: darkMode ? '#1e1e24' : '#ffffff',
          padding: '10px 16px',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <button 
            onClick={() => changeDate(-1)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '6px' }}
          >
            <ChevronLeft size={22} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>{currentDate}</span>
            {currentDate !== getTodayString() && (
              <button
                onClick={() => setCurrentDate(getTodayString())}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
            )}
          </div>

          <button 
            onClick={() => changeDate(1)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '6px' }}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Dedicated Remaining Calories Card */}
        <div style={{
          background: isOverBudget 
            ? (darkMode ? '#3b1212' : '#fef2f2') 
            : (darkMode ? '#0f291e' : '#f0fdf4'),
          border: `1.5px solid ${isOverBudget ? '#ef4444' : '#10b981'}`,
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOverBudget ? (
                <AlertCircle size={20} color="#ef4444" />
              ) : (
                <CheckCircle2 size={20} color="#10b981" />
              )}
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: isOverBudget ? '#ef4444' : '#10b981'
              }}>
                {isOverBudget ? 'Over Budget' : 'Remaining Calories'}
              </span>
            </div>

            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 8px',
              borderRadius: '20px',
              background: isOverBudget ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isOverBudget ? '#ef4444' : '#10b981'
            }}>
              {isOverBudget 
                ? `${Math.abs(remainingCalories)} kcal over` 
                : `${Math.round(((goalNumber - totals.calories) / goalNumber) * 100)}% left`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '34px',
              fontWeight: '800',
              lineHeight: 1,
              color: isOverBudget ? '#ef4444' : (darkMode ? '#34d399' : '#059669')
            }}>
              {Math.abs(remainingCalories).toLocaleString()}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#888' }}>
              kcal {isOverBudget ? 'over target' : 'left for today'}
            </span>
          </div>

          {/* Mini progress bar */}
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, (totals.calories / goalNumber) * 100)}%`,
              height: '100%',
              backgroundColor: isOverBudget ? '#ef4444' : '#10b981',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Dashboard Progress Ring Card */}
        <div style={{
          background: darkMode ? '#1e1e24' : '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={darkMode ? '#33333d' : '#e2e8f0'}
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={isOverBudget ? '#ef4444' : '#f97316'}
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '32px', fontWeight: '800' }}>{totals.calories}</span>
              <span style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>of {goalNumber} kcal</span>
            </div>
          </div>

          {/* Calorie Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            width: '100%',
            textAlign: 'center',
            gap: '12px',
            borderTop: darkMode ? '1px solid #2e2e38' : '1px solid #f1f5f9',
            paddingTop: '16px'
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#888' }}>Total Eaten</div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>
                {totals.calories} <span style={{ fontSize: '12px', fontWeight: '500' }}>kcal</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#888' }}>Target Goal</div>
              <input
                type="number"
                value={dailyGoal === '' ? '' : dailyGoal}
                onChange={(e) => {
                  const val = e.target.value;
                  setDailyGoal(val === '' ? '' : Number(val));
                }}
                onBlur={() => {
                  if (!dailyGoal || dailyGoal < 100) setDailyGoal(2000);
                }}
                placeholder="2000"
                style={{
                  width: '90px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '18px',
                  background: darkMode ? '#27272a' : '#f1f5f9',
                  color: 'inherit',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '2px 6px'
                }}
              />
            </div>
          </div>

          {/* Macro Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            width: '100%',
            gap: '10px',
            background: darkMode ? '#26262e' : '#f8fafc',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
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

        {/* Quick Add Presets */}
        <div style={{
          background: darkMode ? '#1e1e24' : '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
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
        <form onSubmit={handleAddEntry} style={{
          background: darkMode ? '#1e1e24' : '#ffffff',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#888' }}>LOG FOOD</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                  color: activeCategory === cat.id ? '#fff' : 'inherit'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
            <input
              type="text"
              placeholder="Food name (e.g. Rice bowl)"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit'
              }}
              required
            />
            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #333' : '1px solid #cbd5e1',
                background: darkMode ? '#27272a' : '#fff',
                color: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <input
              type="number"
              placeholder="Protein (g)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              style={{
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
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Add Entry
          </button>
        </form>

        {/* Daily Food Log List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '4px 0', color: '#888' }}>
            TODAY'S LOGS ({currentEntries.length})
          </h3>

          {currentEntries.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              background: darkMode ? '#1e1e24' : '#ffffff',
              borderRadius: '14px',
              color: '#888',
              fontSize: '14px'
            }}>
              No items logged for this day. Tap a preset or add one above!
            </div>
          ) : (
            currentEntries.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: darkMode ? '#1e1e24' : '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
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
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
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
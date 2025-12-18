import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Plus, 
  Calculator, 
  Calendar, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  History, 
  UtensilsCrossed, 
  X, 
  Check, 
  Sun, 
  Moon, 
  Settings, 
  TrendingUp, 
  Download, 
  Dumbbell, 
  StickyNote, 
  Save, 
  Clock, 
  LayoutGrid,
  Pencil,
  PlusCircle,
  Heart,
  Sparkles,
  Smile,
  LogOut,
  User
} from 'lucide-react';

// --- Constants ---
const MEAL_TYPES = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack"];
const DEFAULT_EXERCISES = ["Running", "Strength Training", "HIIT Class", "Yoga", "Hiking"];

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCPgjd_HRSTJ_PDy45-vV_iiaFKTCdZ8cI",
  authDomain: "nutriflow-lite.firebaseapp.com",
  projectId: "nutriflow-lite",
  storageBucket: "nutriflow-lite.firebasestorage.app",
  messagingSenderId: "1039098272028",
  appId: "1:1039098272028:web:ff593ed08700351f1502d9",
  measurementId: "G-V0MYCEJ02Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const activeAppId = typeof __app_id !== 'undefined' ? __app_id : 'nutriflow-lite-jess';

// --- Global Helpers ---
const safeNum = (v) => {
  const n = parseInt(v);
  return isNaN(n) ? 0 : n;
};

const getPacificDate = (offset = 0) => {
  const date = new Date();
  if (offset !== 0) date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// --- Standalone Sub-Components ---

const LoginView = ({ onLogin, isDark }) => (
  <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
    <div className={`w-full max-w-md p-10 rounded-[3rem] text-center border shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8 rotate-3">
        <Heart size={40} className="text-white fill-white/20" />
      </div>
      <h1 className={`text-4xl font-black tracking-tighter mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>NutriFlow</h1>
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10">Jess's Personal Registry</p>
      
      <button 
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black py-5 rounded-[1.5rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Sign in with Google
      </button>
      
      <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
        <Sparkles size={14} className="text-emerald-500" />
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Exchange System V2</span>
      </div>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, isDark }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200`}>
        <div className={`p-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'} flex justify-between items-center`}>
          <h3 className="text-xl font-black tracking-tighter uppercase opacity-80">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, current, goal, color, isDark }) => {
  const remaining = Math.max(0, goal - current);
  return (
    <div className="flex-1 min-w-[140px] space-y-3">
      <div className="flex justify-between items-end px-1">
        <span className={`text-[11px] font-black uppercase tracking-widest text-${color}-600`}>{label}</span>
        <span className={`font-mono text-sm font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{current} / {goal}</span>
      </div>
      <div className={`h-3 w-full ${isDark ? 'bg-zinc-950 shadow-inner' : 'bg-zinc-100 shadow-inner'} rounded-full overflow-hidden`}>
        <div 
          className={`h-full bg-${color}-500 transition-all duration-1000 shadow-lg`} 
          style={{ width: `${Math.min(100, (current/goal)*100)}%` }}
        />
      </div>
      <div className="text-[10px] font-black uppercase opacity-60 text-center tracking-tighter h-3">
        {remaining > 0 ? `${remaining} more to target` : "Daily Goal Hit! ✨"}
      </div>
    </div>
  );
};

const MealRow = ({ type, exchanges, target, isDark, onUpdate }) => {
  const hasValue = exchanges.carbs > 0 || exchanges.protein > 0 || exchanges.fat > 0;
  
  return (
    <div className={`border rounded-[2rem] p-6 transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-lg' : 'bg-white border-zinc-200 shadow-xl shadow-black/5'} hover:border-emerald-500/30 shadow-md`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5 flex-1 w-full sm:w-auto">
          <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center transition-all ${hasValue ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : isDark ? 'bg-zinc-950 text-zinc-700 shadow-inner' : 'bg-zinc-50 text-zinc-300'}`}>
            {hasValue ? <CheckCircle2 size={32} /> : <Clock size={32} />}
          </div>
          <div>
            <h4 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-zinc-900'} leading-none`}>{type}</h4>
            <div className="flex gap-3 text-[10px] font-black uppercase opacity-60 mt-2 tracking-widest leading-none">
              <span>Goal:</span>
              <span className="text-blue-500 font-mono">C:{target.carbs || 0}</span>
              <span className="text-red-500 font-mono">P:{target.protein || 0}</span>
              <span className="text-yellow-600 font-mono">F:{target.fat || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 justify-center">
          {['carbs', 'protein', 'fat'].map(k => (
            <div key={k} className="flex flex-col items-center gap-2 min-w-[90px]">
              <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest leading-none">{k}</span>
              <div className={`flex items-center w-full ${isDark ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-md'} border rounded-2xl overflow-hidden h-12`}>
                <button onClick={() => onUpdate(type, k, -1)} className="flex-1 h-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-black text-2xl">-</button>
                <div className={`w-12 text-center font-mono font-black text-lg ${k==='carbs'?'text-blue-600':k==='protein'?'text-red-600':'text-yellow-600'}`}>
                  {exchanges[k] || 0}
                </div>
                <button onClick={() => onUpdate(type, k, 1)} className="flex-1 h-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors font-black text-2xl">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block w-36 shrink-0 space-y-1.5 text-center px-4 border-l dark:border-zinc-800">
          {['carbs', 'protein', 'fat'].map(k => {
            const diff = (target[k] || 0) - (exchanges[k] || 0);
            return (
              <div key={k} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none">
                <span className="opacity-40">{k[0]}</span>
                {diff > 0 ? (
                  <span className="text-zinc-400">{diff} left</span>
                ) : (
                  <span className="text-emerald-500 font-bold flex items-center gap-1 uppercase text-[8px]">Hit <Heart size={10} className="fill-emerald-500"/></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('planner');
  const [theme, setTheme] = useState('light');
  const [selectedDate, setSelectedDate] = useState(getPacificDate());

  // Config
  const [masterGoals, setMasterGoals] = useState({ carbs: 12, protein: 10, fat: 8 });
  const [mealTargets, setMealTargets] = useState({});
  const [exerciseList, setExerciseList] = useState(DEFAULT_EXERCISES);

  // Persistence
  const [intakeData, setIntakeData] = useState([]);
  const [journalRecords, setJournalRecords] = useState({});

  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExManagerOpen, setIsExManagerOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [editExValue, setEditExValue] = useState(null);

  const isDark = theme === 'dark';

  // --- Auth & Initial Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync Settings
    const configRef = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'config', 'settings');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.masterGoals) setMasterGoals(d.masterGoals);
        if (d.mealTargets) setMealTargets(d.mealTargets);
        if (d.exerciseList) setExerciseList(d.exerciseList);
      }
    });

    // Sync Intake
    const intakeCol = collection(db, 'artifacts', activeAppId, 'users', user.uid, 'intake');
    const unsubIntake = onSnapshot(intakeCol, (snap) => {
      setIntakeData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Sync Journal
    const journalCol = collection(db, 'artifacts', activeAppId, 'users', user.uid, 'journal');
    const unsubJournal = onSnapshot(journalCol, (snap) => {
      const map = {};
      snap.docs.forEach(d => map[d.id] = d.data());
      setJournalRecords(map);
    });

    return () => { unsubConfig(); unsubIntake(); unsubJournal(); };
  }, [user]);

  // --- Handlers ---
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const updateIntakeValue = async (mealType, field, delta) => {
    if (!user) return;
    
    // Use date + mealType as unique doc ID for stability
    const docId = `${selectedDate}_${mealType.replace(/\s+/g, '')}`;
    const docRef = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'intake', docId);

    const existing = intakeData.find(r => r.date === selectedDate && r.mealType === mealType);
    const currentEx = existing?.exchanges || { carbs: 0, protein: 0, fat: 0 };
    const newVal = Math.max(0, safeNum(currentEx[field]) + delta);
    
    const payload = { 
      date: selectedDate, 
      mealType, 
      exchanges: { ...currentEx, [field]: newVal }, 
      timestamp: new Date().toISOString() 
    };

    try {
      await setDoc(docRef, payload, { merge: true });
    } catch (err) { console.error("Update failed:", err); }
  };

  const updateJournal = async (field, value) => {
    if (!user) return;
    const ref = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'journal', selectedDate);
    const current = journalRecords[selectedDate] || { exercised: false, type: '', note: '' };
    await setDoc(ref, { ...current, [field]: value }, { merge: true });
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const ref = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'config', 'settings');
    await setDoc(ref, { masterGoals, mealTargets, exerciseList }, { merge: true });
    setIsSettingsOpen(false);
  };

  const addExercise = async () => {
    if (!newExName.trim()) return;
    const updated = [...exerciseList, newExName.trim()];
    setExerciseList(updated);
    setNewExName('');
    const ref = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'config', 'settings');
    await updateDoc(ref, { exerciseList: updated });
  };

  const renameExercise = async (oldName) => {
    if (!newExName.trim()) return;
    const updated = exerciseList.map(t => t === oldName ? newExName.trim() : t);
    setExerciseList(updated);
    setEditExValue(null);
    setNewExName('');
    const ref = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'config', 'settings');
    await updateDoc(ref, { exerciseList: updated });
  };

  const deleteExerciseType = async (type) => {
    const updated = exerciseList.filter(t => t !== type);
    setExerciseList(updated);
    const ref = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'config', 'settings');
    await updateDoc(ref, { exerciseList: updated });
  };

  const exportHistory = () => {
    const intake = intakeData.filter(i => i.date === selectedDate);
    const journal = journalRecords[selectedDate] || {};
    let content = `JESS'S NUTRIFLOW LOG: ${selectedDate}\n==============================\n\n`;
    MEAL_TYPES.forEach(m => {
      const log = intake.find(i => i.mealType === m);
      content += `[${m.toUpperCase()}]\nCarbs: ${log?.exchanges?.carbs || 0} | Protein: ${log?.exchanges?.protein || 0} | Fat: ${log?.exchanges?.fat || 0}\n\n`;
    });
    content += `EXERCISE: ${journal.exercised ? journal.type : 'None'}\nNOTES: ${journal.note || 'None'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `NutriFlow_Jess_${selectedDate}.txt`;
    a.click();
  };

  // --- Derived State ---
  const dayIntake = useMemo(() => intakeData.filter(i => i.date === selectedDate), [intakeData, selectedDate]);
  const dayTotals = useMemo(() => {
    return dayIntake.reduce((acc, i) => {
      acc.carbs += safeNum(i.exchanges?.carbs);
      acc.protein += safeNum(i.exchanges?.protein);
      acc.fat += safeNum(i.exchanges?.fat);
      return acc;
    }, { carbs: 0, protein: 0, fat: 0 });
  }, [dayIntake]);

  const currentJournal = journalRecords[selectedDate] || { exercised: false, type: '', note: '' };

  // --- Conditional Rendering ---
  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      <Heart size={64} className="animate-pulse text-emerald-500 fill-emerald-500/10 mb-6" />
      <h1 className={`text-xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Connecting Registry...</h1>
    </div>
  );

  if (!user) return <LoginView onLogin={loginWithGoogle} isDark={isDark} />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} font-sans flex flex-col lg:flex-row transition-colors`}>
      
      {/* Sidebar Navigation */}
      <nav className={`hidden lg:flex flex-col w-72 ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'} border-r p-8 shrink-0 h-screen sticky top-0 z-40 shadow-2xl`}>
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-14 h-14 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center shadow-lg rotate-3 shadow-emerald-500/30">
            <Heart size={28} className="text-white fill-white/10" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">NutriFlow</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Registry for Jess</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('planner')} className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${activeTab === 'planner' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/40 translate-x-2' : 'text-zinc-500 hover:bg-zinc-100 hover:text-emerald-600'}`}>
            <LayoutGrid size={20} /> <span className="uppercase text-[11px] tracking-tight">Day Planner</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/40 translate-x-2' : 'text-zinc-500 hover:bg-zinc-100 hover:text-emerald-600'}`}>
            <History size={20} /> <span className="uppercase text-[11px] tracking-tight">Daily Logs</span>
          </button>
        </div>
        <div className="space-y-4">
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-white shadow-inner' : 'bg-zinc-50 border border-zinc-100 text-zinc-400 hover:bg-white shadow-sm'}`}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />} {isDark ? 'Light' : 'Dark'} Mode
          </button>
          <button onClick={handleLogout} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-10 max-w-6xl mx-auto w-full pb-32 lg:pb-16 relative transition-all animate-in fade-in duration-300">
        
        <header className="mb-10 flex justify-between items-end gap-4 px-4">
          <div className="space-y-1">
            <h2 className={`text-5xl font-black tracking-tighter capitalize ${isDark ? 'text-white' : 'text-zinc-900'}`}>{activeTab}</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[11px] opacity-60">Personal Exchange Management</p>
          </div>
          <button className="lg:hidden p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl active:scale-95 transition-transform" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>

        {/* Date Selector */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[2.5rem] border ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-lg shadow-black/30' : 'bg-white border-zinc-200 shadow-xl shadow-black/5'} mb-10 transition-all`}>
           <div className="flex items-center gap-6">
              <button onClick={() => {
                const d = new Date(selectedDate + "T00:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]);
              }} className={`p-5 rounded-[1.2rem] transition-all active:scale-90 ${isDark ? 'bg-zinc-950 text-zinc-400 border border-zinc-800 shadow-inner' : 'bg-zinc-50 text-zinc-500 border border-zinc-100 shadow-sm'}`}><ChevronLeft size={24} /></button>
              <div className="text-center min-w-[160px]">
                <div className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.4em] mb-1 opacity-60 leading-none">Active Date</div>
                <div className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {selectedDate === getPacificDate() ? 'Today' : selectedDate}
                </div>
              </div>
              <button onClick={() => {
                const d = new Date(selectedDate + "T00:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]);
              }} className={`p-5 rounded-[1.2rem] transition-all active:scale-90 ${isDark ? 'bg-zinc-950 text-zinc-400 border border-zinc-800 shadow-inner' : 'bg-zinc-50 text-zinc-500 border border-zinc-100 shadow-sm'}`}><ChevronRight size={24} /></button>
           </div>
           
           <div className="flex gap-3">
              {activeTab === 'planner' ? (
                <>
                  <button onClick={() => setSelectedDate(getPacificDate())} className={`px-8 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${selectedDate === getPacificDate() ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all shadow-sm'}`}>Today</button>
                  <button onClick={() => setSelectedDate(getPacificDate(1))} className={`px-8 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${selectedDate === getPacificDate(1) ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-all shadow-sm'}`}>Tomorrow</button>
                </>
              ) : (
                <>
                  <button onClick={() => setSelectedDate(getPacificDate(-1))} className={`px-8 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${selectedDate === getPacificDate(-1) ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all shadow-sm'}`}>Yesterday</button>
                  <button onClick={() => setSelectedDate(getPacificDate())} className={`px-8 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all ${selectedDate === getPacificDate() ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all shadow-sm'}`}>Today</button>
                </>
              )}
           </div>
        </div>

        {activeTab === 'planner' ? (
          <div className="space-y-10">
             {/* Scorecard */}
             <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-2xl shadow-emerald-900/5'} border rounded-[3rem] p-10`}>
                <div className="flex justify-between items-center mb-12">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                        <TrendingUp size={28} />
                     </div>
                     <h3 className={`font-black text-2xl tracking-tighter ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Daily Progress</h3>
                   </div>
                   <button onClick={() => setIsSettingsOpen(true)} className="p-4 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 border border-transparent shadow-sm transition-all"><Settings size={24} /></button>
                </div>
                <div className="flex flex-wrap gap-12">
                   <ProgressBar label="Carbs" current={dayTotals.carbs} goal={masterGoals.carbs} color="blue" isDark={isDark} />
                   <ProgressBar label="Protein" current={dayTotals.protein} goal={masterGoals.protein} color="red" isDark={isDark} />
                   <ProgressBar label="Fat" current={dayTotals.fat} goal={masterGoals.fat} color="yellow" isDark={isDark} />
                </div>
             </div>

             {/* Meal Grid */}
             <div className="grid grid-cols-1 gap-6 px-1">
               {MEAL_TYPES.map(type => (
                 <MealRow 
                   key={type}
                   type={type}
                   exchanges={dayIntake.find(i => i.mealType === type)?.exchanges || { carbs: 0, protein: 0, fat: 0 }}
                   target={mealTargets[type] || { carbs: 0, protein: 0, fat: 0 }}
                   isDark={isDark}
                   onUpdate={updateIntakeValue}
                 />
               ))}
             </div>

             {/* Reflections */}
             <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-2xl shadow-emerald-900/5'} border rounded-[3rem] p-10`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                           <Dumbbell size={28} />
                        </div>
                        <h3 className={`text-xl font-black uppercase tracking-widest ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Activity Log</h3>
                      </div>
                      <div className="flex items-center gap-8">
                         <button 
                           onClick={() => updateJournal('exercised', !currentJournal.exercised)}
                           className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl shadow-emerald-500/30 ${currentJournal.exercised ? 'bg-emerald-500 text-white rotate-6' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-inner'}`}
                         >
                           <Check size={48} strokeWidth={4} />
                         </button>
                         {currentJournal.exercised && (
                           <div className="flex-1 space-y-3 animate-in slide-in-from-left-4">
                              <div className="flex justify-between items-center px-1">
                                 <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">Activity Type</span>
                                 <button onClick={() => setIsExManagerOpen(true)} className="text-[10px] font-black text-emerald-600 hover:underline">Manage List</button>
                              </div>
                              <select 
                                className={`w-full ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} border rounded-2xl p-4 text-sm font-bold focus:outline-none shadow-sm transition-all`}
                                value={currentJournal.type}
                                onChange={(e) => updateJournal('type', e.target.value)}
                              >
                                <option value="">Select activity...</option>
                                {exerciseList.map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                           </div>
                         )}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                           <Smile size={28} />
                        </div>
                        <h3 className={`text-xl font-black uppercase tracking-widest ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>Daily Reflections</h3>
                      </div>
                      <textarea 
                        className={`w-full h-36 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-inner'} border rounded-[2rem] p-6 text-sm font-medium focus:outline-none transition-all resize-none shadow-inner leading-relaxed`}
                        placeholder="What made you smile today? How are Alfie and Evie doing? ✨"
                        value={currentJournal.note || ''}
                        onChange={(e) => updateJournal('note', e.target.value)}
                      />
                   </div>
                </div>
             </div>
          </div>
        ) : (
          /* History View */
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 shadow-lg shadow-black/30' : 'bg-white border-zinc-200 shadow-2xl shadow-black/5'} border rounded-[3rem] p-10`}>
                <div className="flex justify-between items-center mb-12">
                   <h3 className={`font-black text-2xl tracking-tighter ${isDark ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-widest`}>Historical Totals</h3>
                   <button onClick={exportHistory} className="flex items-center gap-3 px-8 py-3 bg-zinc-900 text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"><Download size={20} /> Export log</button>
                </div>
                <div className="grid grid-cols-3 gap-12 text-center">
                   {['carbs', 'protein', 'fat'].map(k => (
                     <div key={k} className="group cursor-default">
                       <div className={`text-6xl font-black font-mono tracking-tighter ${isDark ? 'text-white' : 'text-zinc-900'} transition-transform group-hover:scale-110 duration-500`}>{dayTotals[k]}</div>
                       <div className={`text-[11px] font-black uppercase tracking-[0.2em] mt-3 ${k === 'carbs' ? 'text-blue-500' : k === 'protein' ? 'text-red-500' : 'text-yellow-600'}`}>{k} Total</div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl shadow-black/5'} border rounded-[2.5rem] p-10`}>
                   <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 font-bold opacity-40">LIFESTYLE HISTORY</h4>
                   <div className="space-y-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center ${currentJournal.exercised ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-300 shadow-inner'}`}>
                          <Dumbbell size={32} />
                        </div>
                        <div>
                          <div className="font-black text-lg tracking-tight">{currentJournal.exercised ? 'Session Completed' : 'Rest Day'}</div>
                          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1.5">{currentJournal.exercised ? currentJournal.type : '---'}</div>
                        </div>
                      </div>
                      <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'} min-h-[140px]`}>
                        <p className="text-sm font-medium italic opacity-80 whitespace-pre-wrap leading-relaxed">{currentJournal.note || "No entries found."}</p>
                      </div>
                   </div>
                </div>
                <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl shadow-black/5'} border rounded-[2.5rem] p-10 space-y-8`}>
                   <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 font-bold opacity-40">INTAKE SUMMARY</h4>
                   <div className="space-y-4">
                      {MEAL_TYPES.map(m => {
                        const ex = dayIntake.find(i => i.mealType === m)?.exchanges || { carbs: 0, protein: 0, fat: 0 };
                        if (ex.carbs === 0 && ex.protein === 0 && ex.fat === 0) return null;
                        return (
                          <div key={m} className="flex items-center justify-between border-b dark:border-zinc-800 pb-5 last:border-0 last:pb-0">
                             <div>
                               <div className="font-black text-lg tracking-tight">{m}</div>
                               <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 leading-none text-blue-500">C:{ex.carbs} P:{ex.protein} F:{ex.fat}</div>
                             </div>
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse"></div>
                          </div>
                        );
                      })}
                      {dayIntake.length === 0 && <p className="text-sm text-zinc-400 italic text-center py-10 uppercase tracking-widest opacity-30">No intake data discovered.</p>}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Registry Configuration" isDark={isDark}>
         <div className="space-y-12 pb-6">
            <section className="space-y-6">
               <div className="flex items-center gap-3 border-b dark:border-zinc-800 pb-3 leading-none">
                  <Heart className="text-emerald-500" size={20} />
                  <h4 className="text-[12px] font-black uppercase text-emerald-600 tracking-[0.25em]">1. Master Goals</h4>
               </div>
               <div className="grid grid-cols-1 gap-8">
                 {['carbs', 'protein', 'fat'].map(k => (
                   <div key={k} className="flex flex-col items-center gap-3">
                     <span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">{k} Daily Target</span>
                     <div className={`flex items-center rounded-3xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'} overflow-hidden shadow-sm`}>
                        <button onClick={() => setMasterGoals({...masterGoals, [k]: Math.max(0, masterGoals[k]-1)})} className="p-4 px-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black text-3xl transition-colors">-</button>
                        <div className="w-20 text-center font-mono font-black text-2xl">{masterGoals[k]}</div>
                        <button onClick={() => setMasterGoals({...masterGoals, [k]: masterGoals[k]+1})} className="p-4 px-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black text-3xl transition-colors">+</button>
                     </div>
                   </div>
                 ))}
               </div>
            </section>
            
            <section className="space-y-8 border-t dark:border-zinc-800 pt-10">
               <div className="flex items-center gap-3 border-b dark:border-zinc-800 pb-3 leading-none">
                  <Calculator className="text-emerald-500" size={20} />
                  <h4 className="text-[12px] font-black uppercase text-emerald-600 tracking-[0.25em]">2. Meal Allocations</h4>
               </div>
               <div className="space-y-5">
                 {MEAL_TYPES.map(type => (
                   <div key={type} className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'} space-y-5 shadow-sm`}>
                      <span className="text-[12px] font-black uppercase text-zinc-500 tracking-widest">{type} Target</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-4">
                        {['carbs', 'protein', 'fat'].map(k => (
                          <div key={k} className="flex-1 space-y-2 text-center">
                             <span className="text-[9px] font-black uppercase opacity-40 block leading-none">{k[0]}</span>
                             <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setMealTargets({...mealTargets, [type]: { ...(mealTargets[type] || {}), [k]: Math.max(0, (mealTargets[type]?.[k] || 0) - 1) }})} className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-black text-xl">-</button>
                                <span className="text-base font-black w-8">{mealTargets[type]?.[k] || 0}</span>
                                <button onClick={() => setMealTargets({...mealTargets, [type]: { ...(mealTargets[type] || {}), [k]: (mealTargets[type]?.[k] || 0) + 1 }})} className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-black text-xl">+</button>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                ))}
               </div>
            </section>
            <button onClick={handleSaveSettings} className="w-full bg-emerald-600 py-7 rounded-[2rem] font-black text-white shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3"><Save size={20}/> Save Registry</button>
         </div>
      </Modal>

      {/* Exercise Manager Modal */}
      <Modal isOpen={isExManagerOpen} onClose={() => setIsExManagerOpen(false)} title="Exercise Management" isDark={isDark}>
         <div className="space-y-8">
            <div className="flex gap-3">
               <input 
                 className={`flex-1 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'} border rounded-2xl p-5 text-sm font-bold focus:outline-none transition-all focus:ring-4 focus:ring-emerald-500/10`} 
                 placeholder="Activity name..." 
                 value={newExName} 
                 onChange={(e) => setNewExName(e.target.value)} 
               />
               <button onClick={addExercise} className="bg-zinc-900 text-white px-6 rounded-2xl transition-all active:scale-90 shadow-xl shadow-black/10"><Plus size={24} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
               {exerciseList.map((type, idx) => (
                 <div key={idx} className={`p-5 rounded-2xl border flex justify-between items-center ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-100 text-zinc-700 shadow-sm hover:shadow-md transition-all'}`}>
                    {editExValue === type ? (
                      <div className="flex gap-3 flex-1">
                        <input className="flex-1 bg-transparent border-b border-emerald-500 text-sm font-bold outline-none" value={newExName} onChange={(e) => setNewExName(e.target.value)} autoFocus />
                        <button onClick={() => renameExercise(type)} className="text-emerald-500 p-2"><Check size={20} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[12px] font-black uppercase tracking-widest">{type}</span>
                        <div className="flex gap-4">
                           <button onClick={() => { setEditExValue(type); setNewExName(type); }} className="text-zinc-300 hover:text-emerald-500 transition-all"><Pencil size={18} /></button>
                           <button onClick={() => deleteExerciseType(type)} className="text-zinc-300 hover:text-red-500 p-1 transition-all"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                 </div>
               ))}
            </div>
            <button onClick={() => setIsExManagerOpen(false)} className="w-full bg-emerald-600 py-5 rounded-[2rem] font-black text-white uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/10">Done</button>
         </div>
      </Modal>

      {/* Mobile Sticky Nav */}
      <nav className={`lg:hidden fixed bottom-6 left-6 right-6 ${isDark ? 'bg-zinc-900/95 border-zinc-800 shadow-black/50' : 'bg-white/95 border-zinc-200 shadow-black/10 shadow-2xl'} backdrop-blur-2xl border rounded-[2.5rem] flex justify-around p-4 z-50 transition-all`}>
        <button onClick={() => setActiveTab('planner')} className={`p-5 rounded-[2rem] transition-all active:scale-75 ${activeTab === 'planner' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/40' : 'text-zinc-400'}`}><LayoutGrid size={30} /></button>
        <button onClick={() => setActiveTab('history')} className={`p-5 rounded-[2rem] transition-all active:scale-75 ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/40' : 'text-zinc-400'}`}><History size={30} /></button>
      </nav>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Clock, Calendar, TrendingUp, Save } from 'lucide-react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema
interface CalorieTrackerDB extends DBSchema {
  entries: {
    key: number;
    value: FoodEntry;
    indexes: { 'by-date': string };
  };
  commonFoods: {
    key: string;
    value: CommonFood;
  };
}

interface FoodEntry {
  id: number;
  foodName: string;
  calories: number;
  volume?: string;
  notes?: string;
  timestamp: string;
  dateAdded: string;
}

interface CommonFood {
  name: string;
  baseCalories: number;
  defaultVolume: string;
  frequency: number;
  lastUsed: string;
}

// Initialize database
const initDB = async (): Promise<IDBPDatabase<CalorieTrackerDB>> => {
  return openDB<CalorieTrackerDB>('CalorieTrackerDB', 1, {
    upgrade(db) {
      // Create entries store
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('by-date', 'timestamp');
      }
      
      // Create common foods store
      if (!db.objectStoreNames.contains('commonFoods')) {
        db.createObjectStore('commonFoods', { keyPath: 'name' });
      }
    },
  });
};

const App: React.FC = () => {
  const [db, setDb] = useState<IDBPDatabase<CalorieTrackerDB> | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [volume, setVolume] = useState('');
  const [notes, setNotes] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [commonFoods, setCommonFoods] = useState<CommonFood[]>([]);
  const [suggestions, setSuggestions] = useState<CommonFood[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize database and load data
  useEffect(() => {
    const setup = async () => {
      try {
        const database = await initDB();
        setDb(database);
        
        // Load entries
        const allEntries = await database.getAll('entries');
        setEntries(allEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        
        // Load common foods
        const foods = await database.getAll('commonFoods');
        if (foods.length === 0) {
          // Initialize with default foods
          const defaultFoods: CommonFood[] = [
            { name: 'Apple', baseCalories: 95, defaultVolume: '1 medium', frequency: 0, lastUsed: '' },
            { name: 'Banana', baseCalories: 105, defaultVolume: '1 medium', frequency: 0, lastUsed: '' },
            { name: 'Coffee with milk', baseCalories: 30, defaultVolume: '1 cup', frequency: 0, lastUsed: '' },
            { name: 'Sandwich', baseCalories: 350, defaultVolume: '1 whole', frequency: 0, lastUsed: '' },
            { name: 'Salad', baseCalories: 150, defaultVolume: '1 bowl', frequency: 0, lastUsed: '' },
          ];
          
          for (const food of defaultFoods) {
            await database.put('commonFoods', food);
          }
          setCommonFoods(defaultFoods);
        } else {
          setCommonFoods(foods.sort((a, b) => b.frequency - a.frequency));
        }
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    setup();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFoodName(value);
    
    if (value.length > 0) {
      const filtered = commonFoods.filter(food =>
        food.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (food: CommonFood) => {
    setFoodName(food.name);
    setCalories(food.baseCalories.toString());
    setVolume(food.defaultVolume);
    setShowSuggestions(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    
    // Auto-scale calories
    const volumeMatch = newVolume.match(/(\d*\.?\d+)/);
    if (volumeMatch && calories) {
      const volumeNum = parseFloat(volumeMatch[1]);
      const suggestion = suggestions.find(s => s.name === foodName);
      if (suggestion && suggestion.defaultVolume) {
        const defaultMatch = suggestion.defaultVolume.match(/(\d*\.?\d+)/);
        if (defaultMatch) {
          const defaultNum = parseFloat(defaultMatch[1]);
          const scaledCalories = Math.round((suggestion.baseCalories * volumeNum) / defaultNum);
          setCalories(scaledCalories.toString());
        }
      }
    }
  };

  const addEntry = async () => {
    if (!foodName || !calories || !db) {
      if (!foodName || !calories) {
        alert('Please enter at least food name and calories');
      }
      return;
    }

    const now = new Date();
    const entryDateTime = customDateTime || now.toISOString();
    
    const newEntry: FoodEntry = {
      id: Date.now(),
      foodName,
      calories: parseInt(calories),
      volume: volume || undefined,
      notes: notes || undefined,
      timestamp: entryDateTime,
      dateAdded: now.toISOString()
    };

    try {
      // Save to IndexedDB
      await db.put('entries', newEntry);
      
      // Update common foods
      const existingFood = await db.get('commonFoods', foodName);
      if (existingFood) {
        existingFood.frequency += 1;
        existingFood.lastUsed = now.toISOString();
        existingFood.baseCalories = parseInt(calories);
        if (volume) existingFood.defaultVolume = volume;
        await db.put('commonFoods', existingFood);
      } else {
        const newCommonFood: CommonFood = {
          name: foodName,
          baseCalories: parseInt(calories),
          defaultVolume: volume || '1 serving',
          frequency: 1,
          lastUsed: now.toISOString()
        };
        await db.put('commonFoods', newCommonFood);
      }
      
      // Update state
      setEntries([newEntry, ...entries]);
      const updatedFoods = await db.getAll('commonFoods');
      setCommonFoods(updatedFoods.sort((a, b) => b.frequency - a.frequency));
      setLastSaved(new Date());
      
      // Clear form
      setFoodName('');
      setCalories('');
      setVolume('');
      setNotes('');
      setCustomDateTime('');
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  const deleteEntry = async (id: number) => {
    if (!db) return;
    
    try {
      await db.delete('entries', id);
      setEntries(entries.filter(e => e.id !== id));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Food Name', 'Calories', 'Volume', 'Notes', 'ISO Timestamp'];
    const csvContent = [
      headers.join(','),
      ...entries.map(e => {
        const date = new Date(e.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          `"${e.foodName}"`,
          e.calories,
          `"${e.volume || ''}"`,
          `"${e.notes || ''}"`,
          e.timestamp
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    a.download = `calorie-tracking-${localDateStr}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const importFromCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !db) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const foodNameIdx = headers.findIndex(h => h.includes('Food Name'));
        const caloriesIdx = headers.findIndex(h => h.includes('Calories'));
        const volumeIdx = headers.findIndex(h => h.includes('Volume'));
        const notesIdx = headers.findIndex(h => h.includes('Notes'));
        const isoTimestampIdx = headers.findIndex(h => h.includes('ISO Timestamp'));

        const importedEntries: FoodEntry[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (const char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current);
          
          const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
          
          const entry: FoodEntry = {
            id: Date.now() + i,
            foodName: cleanValues[foodNameIdx] || 'Unknown',
            calories: parseInt(cleanValues[caloriesIdx]) || 0,
            volume: cleanValues[volumeIdx] || undefined,
            notes: cleanValues[notesIdx] || undefined,
            timestamp: cleanValues[isoTimestampIdx] || new Date().toISOString(),
            dateAdded: new Date().toISOString()
          };
          
          if (entry.foodName && entry.calories > 0) {
            importedEntries.push(entry);
            await db.put('entries', entry);
          }
        }
        
        const allEntries = await db.getAll('entries');
        setEntries(allEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        setLastSaved(new Date());
        
        alert(`Successfully imported ${importedEntries.length} entries!`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing CSV. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const getFilteredEntries = () => {
    return entries.filter(e => {
      const entryDate = new Date(e.timestamp);
      const localDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
      return localDateStr === selectedDate;
    });
  };

  const getDailyTotal = () => {
    return getFilteredEntries().reduce((sum, e) => sum + e.calories, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" />
            Calorie Tracker
          </h1>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col xs:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={20} />
                Import
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={entries.length === 0}
              >
                <Download size={20} />
                Export
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
              {lastSaved && (
                <>
                  <Save size={12} />
                  Saved {lastSaved.toLocaleTimeString()}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Add New Entry</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                value={foodName}
                onChange={handleFoodNameChange}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Apple, Sandwich"
              />
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((food, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => selectSuggestion(food)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between items-center"
                    >
                      <span className="font-medium">{food.name}</span>
                      <span className="text-sm text-gray-500">{food.baseCalories} cal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories *
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume/Quantity
              </label>
              <input
                type="text"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 1 cup, 200g"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Date/Time
              </label>
              <input
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., homemade, restaurant meal"
              />
            </div>
          </div>

          <button
            onClick={addEntry}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={20} />
            Add Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Food Log</h2>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <div className="bg-indigo-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Daily Total: </span>
              <span className="font-bold text-indigo-600">{getDailyTotal()} cal</span>
            </div>
          </div>
        </div>

        {getFilteredEntries().length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="mx-auto mb-3 text-gray-400" size={48} />
            <p>No entries for {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredEntries().map(entry => (
              <div key={entry.id} className="bg-gradient-to-r from-gray-50 to-indigo-50 p-4 rounded-lg hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-gray-800">{entry.foodName}</h3>
                      <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                        {entry.calories} cal
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      {entry.volume && (
                        <span className="bg-blue-100 px-2 py-0.5 rounded">
                          {entry.volume}
                        </span>
                      )}
                      {entry.notes && (
                        <span className="italic">{entry.notes}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { X, Save, Bot, Loader2 } from 'lucide-react';

export default function CustomizeAgentModal({ onClose }) {
  const { user } = useContext(AuthContext);
  const [agentName, setAgentName] = useState('Aria');
  const [agentGender, setAgentGender] = useState('female');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load saved config from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.agentName) setAgentName(data.agentName);
          if (data.agentGender) setAgentGender(data.agentGender);
        }
      } catch (e) {
        console.error('Failed to load agent config:', e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        agentName: agentName.trim() || 'Aria',
        agentGender,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save agent config:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Customize Agent</h2>
                <p className="text-blue-100 text-sm">Personalize your AI assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. Aria, Max, Nova..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">This is what the agent will call itself.</p>
              </div>

              {/* Agent Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agent Voice / Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['female', 'male'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setAgentGender(g)}
                      className={`py-3 rounded-xl border-2 font-medium capitalize transition-all ${
                        agentGender === g
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {g === 'female' ? '👩 Female' : '👨 Male'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Affects how the agent introduces itself.</p>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2">Preview greeting</p>
                <p className="text-sm text-gray-700 italic">
                  "Hi! I'm {agentName || 'Aria'}, your personal AI journal assistant. How was your day?"
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : saved ? (
                '✅ Saved!'
              ) : (
                <><Save size={18} /> Save Config</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Shield, Moon, Sun, Trash2, Key, Award, TrendingUp, CheckCircle, Edit, MapPin, Camera, X } from 'lucide-react';
import { db, UserProfile } from '../lib/db';
import { PHILIPPINE_PROVINCES } from '../data/provinces';
import { motion, AnimatePresence } from 'motion/react';

interface CommuterProfileProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  onDeleteAccount: () => void;
}

export default function CommuterProfile({ profile, onProfileUpdate, onDeleteAccount }: CommuterProfileProps) {
  
  // App states
  const [pinInput, setPinInput] = useState('');
  const [pinEnabled, setPinEnabled] = useState(profile.pinEnabled);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState('');

  // Detailed Modal Update Form parameters
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(profile.firstName || '');
  const [editLastName, setEditLastName] = useState(profile.lastName || '');
  const [editMiddleInitial, setEditMiddleInitial] = useState(profile.middleInitial || '');
  const [editUsername, setEditUsername] = useState(profile.username || '');
  const [editCivilStatus, setEditCivilStatus] = useState(profile.civilStatus || 'Single');
  const [editGender, setEditGender] = useState(profile.gender || 'Male');
  const [editProvince, setEditProvince] = useState(profile.province || 'Metro Manila');
  const [editProfilePic, setEditProfilePic] = useState(profile.profilePic || '');

  // Toast status feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Custom delete confirmation modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Statistics
  const totalTrips = profile.tripsTaken;
  const totalSpentPhp = profile.totalSpent;

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleToggleTheme = () => {
    const nextTheme = profile.theme === 'light' ? 'dark' : 'light';
    db.updateProfile({ theme: nextTheme });
    onProfileUpdate(db.getProfile());
  };

  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast('Image must be under 1.5 MB to fit database local storage constraints.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim() || !editUsername.trim()) {
      showToast('First Name, Last Name, and Nickname are required fields.', 'error');
      return;
    }

    db.updateProfile({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      middleInitial: editMiddleInitial.trim(),
      username: editUsername.trim(),
      civilStatus: editCivilStatus,
      gender: editGender,
      province: editProvince,
      profilePic: editProfilePic
    });

    onProfileUpdate(db.getProfile());
    setIsEditModalOpen(false);
    showToast('Local profile credentials saved successfully!', 'success');
  };

  const handlePinSetup = () => {
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      setPinError('PIN must be exactly 6 numerical digits.');
      return;
    }
    db.updateProfile({
      pinCode: pinInput,
      pinEnabled: true
    });
    setPinEnabled(true);
    setShowPinSetup(false);
    setPinInput('');
    setPinError('');
    onProfileUpdate(db.getProfile());
    showToast('6-digit security PIN has been enabled successfully!', 'success');
  };

  const handleDisablePin = () => {
    db.updateProfile({
      pinCode: '',
      pinEnabled: false
    });
    setPinEnabled(false);
    onProfileUpdate(db.getProfile());
    showToast('Security PIN has been disabled.', 'info');
  };

  const formatFullName = () => {
    const fn = profile.firstName || '';
    const mi = profile.middleInitial ? `${profile.middleInitial.trim()}. ` : '';
    const ln = profile.lastName || '';
    if (!fn && !ln) return profile.username || 'Php Commuter';
    return `${fn} ${mi}${ln}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-y-auto select-none style-scrollbar">
      {/* Visual Header */}
      <div className="bg-[#46178f] p-6 text-white text-center pb-8 sticky top-0 z-10 shrink-0 border-b-4 border-[#361175]">
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center border-4 border-[#9174f4] mb-3 relative overflow-hidden shadow-md">
          {profile.profilePic ? (
            <img
              src={profile.profilePic}
              alt="Commuter Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-12 h-12 text-[#46178f] dark:text-purple-300" />
          )}
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-slate-900 text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full border-2 border-white uppercase">
            ACTIVE
          </div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-base font-black tracking-tight">{formatFullName()}</h2>
          <p className="text-[10px] text-purple-200 uppercase tracking-widest font-black">
            @{profile.username || 'commuter'} • {profile.province || 'Philippines'}
          </p>
        </div>

        <button
          onClick={() => {
            // Load editing state from active profile
            setEditFirstName(profile.firstName || '');
            setEditLastName(profile.lastName || '');
            setEditMiddleInitial(profile.middleInitial || '');
            setEditUsername(profile.username || '');
            setEditCivilStatus(profile.civilStatus || 'Single');
            setEditGender(profile.gender || 'Male');
            setEditProvince(profile.province || 'Metro Manila');
            setEditProfilePic(profile.profilePic || '');
            setIsEditModalOpen(true);
          }}
          className="mt-3.5 text-[9px] bg-white/20 text-white hover:bg-white/30 border border-white/40 px-3 py-1.5 rounded-xl uppercase font-black tracking-wider transition cursor-pointer"
        >
          Edit Profile Credentials
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Profile Details Sheet */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Personal Registry Metadata
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl relative border border-slate-100 dark:border-slate-800">
              <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Civil Status</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">{profile.civilStatus || 'Single'}</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl relative border border-slate-100 dark:border-slate-800">
              <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Gender Marker</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">{profile.gender || 'Male'}</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl relative col-span-2 border border-slate-100 dark:border-slate-800">
              <span className="block text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-0.5">Hometown / Province</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                {profile.province || 'Metro Manila'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Grid without Carbon offsetting */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#9174f4]" /> Commuter Journey Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/40 rounded-2xl p-3 text-center">
              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-extrabold">Trips Taken</span>
              <span className="text-xl font-black text-[#46178f] dark:text-purple-300">{totalTrips}</span>
            </div>

            <div className="bg-yellow-50/50 dark:bg-amber-950/10 border border-yellow-100 dark:border-amber-950/30 rounded-2xl p-3 text-center border-l">
              <span className="block text-[8px] uppercase tracking-wider text-slate-405 font-extrabold">Total Fare Saved</span>
              <span className="text-xl font-black text-amber-500">₱{totalSpentPhp.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Lock Security Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-[#46178f] dark:text-purple-400" />
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">
                6-PIN Security Vault
              </h4>
            </div>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
              pinEnabled ? 'bg-green-150 text-green-700 dark:bg-green-950/40' : 'bg-slate-200 text-slate-500'
            }`}>
              {pinEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <p className="text-[10px] text-slate-404 dark:text-slate-500 leading-normal">
            Secure your commute and budget analytics with a localized lock screen pin before the app renders.
          </p>

          {profile.pinEnabled ? (
            <button
              onClick={handleDisablePin}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border-b-2 border-slate-300 dark:border-slate-700 text-red-500 dark:text-red-400 text-[10px] font-black py-2.5 rounded-xl uppercase transition cursor-pointer"
            >
              Disable 6-PIN Lock
            </button>
          ) : (
            <div className="space-y-3">
              {showPinSetup ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Enter 6-Digit Number</label>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-center font-mono py-2 rounded-xl text-sm font-bold tracking-widest focus:outline-none focus:border-[#46178f]"
                    />
                    {pinError && <p className="text-[9px] text-[#e21b3c] font-bold mt-1 text-center">{pinError}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPinSetup(false);
                        setPinInput('');
                        setPinError('');
                      }}
                      className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-705 dark:text-slate-300 text-[9px] font-black py-2 rounded-xl uppercase transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePinSetup}
                      className="flex-1 bg-[#46178f] hover:bg-purple-800 text-white text-[9px] font-black py-2 rounded-xl uppercase transition cursor-pointer"
                    >
                      Enable lock
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPinSetup(true)}
                  className="w-full bg-purple-100 dark:bg-purple-950/40 hover:bg-purple-200 text-[#46178f] dark:text-purple-300 text-[10px] font-black py-2.5 rounded-xl uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" /> Enable 6-PIN Lock
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Settings with Core theme toggle */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">
            System Preferences
          </h4>
          
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Theme Toggle Mode</span>
            <button
              onClick={handleToggleTheme}
              className="flex items-center gap-1 text-[10px] font-black px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer uppercase border dark:border-slate-700"
            >
              {profile.theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#46178f]" /> Go Dark
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-yellow-500" /> Go Light
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dangerous Operations */}
        <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl p-4 border border-red-100 dark:border-red-950/20 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-red-655 dark:text-red-400">
            <Trash2 className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase tracking-tight">Danger Zone</h4>
          </div>
          <p className="text-[9px] text-slate-404 dark:text-slate-500">
            Deleting your Philippine travel account clears username, PIN codes, custom routes, and resets e-balance metrics immediately.
          </p>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="w-full bg-[#e21b3c] hover:bg-red-650 text-white text-[10px] font-black p-2.5 rounded-xl uppercase transition cursor-pointer border-b-4 border-red-800"
          >
            Reset App & Delete Profile
          </button>
        </div>

        {/* About & Legal Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">
            About & Legal
          </h4>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
            <p>
              <strong>Creator:</strong> I am Travis Miguel Cepe, the creator of Mooderia as well as Mooderia Commute. Currently studying at MAPÚA University as a Computer Engineer.
            </p>
            <div className="flex gap-2 font-bold uppercase mt-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <button 
                onClick={() => setIsTermsOpen(true)}
                className="text-[#46178f] dark:text-purple-400 hover:opacity-80 transition cursor-pointer"
              >
                Terms & Conditions
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button 
                onClick={() => setIsPrivacyOpen(true)}
                className="text-[#46178f] dark:text-purple-400 hover:opacity-80 transition cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-[#46178f] dark:text-purple-300 py-3 font-black tracking-widest uppercase mb-4">
          Mooderia Commute
        </div>
      </div>

      {/* --- REPLACEMENT MODAL: SECURE DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-1.5 text-[#e21b3c]">
                <Trash2 className="w-4.5 h-4.5" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Reset App & Erase Data?
                </h3>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-404 leading-relaxed space-y-2 font-bold uppercase">
                <p className="text-slate-800 dark:text-slate-250">
                  This action is permanent and completely irreversible.
                </p>
                <p className="normal-case font-normal text-slate-500 dark:text-slate-400">
                  By confirming, you will:
                </p>
                <div className="space-y-1 normal-case pl-1">
                  <div>• Wipe your entire traveler profile details</div>
                  <div>• Delete all custom registered routes</div>
                  <div>• Reset your commuter wallet balance to zero</div>
                  <div>• Turn off 6-pin lock mechanisms</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    onDeleteAccount();
                  }}
                  className="flex-1 bg-[#e21b3c] hover:bg-rose-700 text-white font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer border-b-2 border-red-900"
                >
                  Erase Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- IN-APP INLINE TOAST FEEDBACK --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 z-50 pointer-events-none flex justify-center"
          >
            <div className={`shadow-xl px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-2 border ${
              toast.type === 'error' 
                ? 'bg-[#e21b3c] border-[#a0132a]' 
                : toast.type === 'info'
                  ? 'bg-blue-600 border-blue-700'
                  : 'bg-emerald-600 border-emerald-700'
            }`}>
              {toast.type === 'error' ? '⚠️' : '🎉'} {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Profile Editor Form Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <form
            onSubmit={handleSaveProfileDetails}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-250 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto style-scrollbar"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-[#46178f] dark:text-purple-300 tracking-wider">
                Edit Profile Metadata
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Avatar upload & preview row */}
            <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-750">
              <div className="relative w-14 h-14 shrink-0">
                {editProfilePic ? (
                  <img
                    src={editProfilePic}
                    alt="Edit preview"
                    className="w-14 h-14 rounded-full object-cover border border-[#46178f]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950/50 rounded-full flex items-center justify-center text-[#46178f]">
                    <User className="w-7 h-7" />
                  </div>
                )}
                {/* Upload overlay */}
                <label htmlFor="edit-avatar-trigger" className="absolute bottom-0 right-0 bg-[#e21b3c] hover:bg-[#c21733] text-white p-1 rounded-full text-[9px] border border-white cursor-pointer shadow">
                  <Camera className="w-2.5 h-2.5" />
                </label>
                <input
                  id="edit-avatar-trigger"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicSelect}
                  className="hidden"
                />
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-500 font-bold uppercase">Change Profile Avatar</span>
                <span className="text-[8px] text-slate-404 block truncate">
                  {editProfilePic ? 'Custom Photo Uploaded' : 'Utilizing default vector'}
                </span>
                {editProfilePic && (
                  <button
                    type="button"
                    onClick={() => setEditProfilePic('')}
                    className="text-[8px] text-red-500 hover:text-red-700 font-black uppercase tracking-wide mt-1 underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Grid layout for Full Names */}
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Travis"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value.slice(0, 16))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miguel"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value.slice(0, 16))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1" title="Middle Initial">M.I.</label>
                <input
                  type="text"
                  placeholder="A."
                  maxLength={2}
                  value={editMiddleInitial}
                  onChange={(e) => setEditMiddleInitial(e.target.value.slice(0, 2))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1.5 px-1.5 text-center text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Screen tag name */}
            <div>
              <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Nickname / Screen Handle</label>
              <input
                type="text"
                required
                placeholder="e.g. TravisTag"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, '').slice(0, 14))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none"
              />
            </div>

            {/* Civil Status, Gender & Province */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Civil Status</label>
                <select
                  value={editCivilStatus}
                  onChange={(e) => setEditCivilStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-705 dark:text-white rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 text-slate-705 dark:text-white rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not</option>
                </select>
              </div>
            </div>

            {/* Philippine Province complete drop down */}
            <div>
              <label className="block text-[8px] text-slate-400 uppercase font-bold mb-1">Philippine Province</label>
              <select
                value={editProvince}
                onChange={(e) => setEditProvince(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg py-1.5 px-2.5 text-xs font-bold focus:outline-none max-h-40"
              >
                {PHILIPPINE_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Submitting buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 font-black text-xs py-2.5 rounded-xl uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 shadow border-b-4 border-emerald-700 text-white font-black text-xs py-2.5 rounded-xl uppercase transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Terms Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#46178f] dark:text-purple-300">
                  Terms & Conditions
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed pr-2 space-y-2 style-scrollbar">
                <p><strong>1. Introduction</strong><br/>Welcome to Mooderia Commute. These terms govern your use of this local offline routing application.</p>
                <p><strong>2. Offline Functionality</strong><br/>This app primarily functions via local network connectivity and embedded DB simulated nodes. Live tracking requires device GPS.</p>
                <p><strong>3. Use of Service</strong><br/>Do not use this app to spam or abuse simulated offline SQLite instances. Ensure safety while commuting.</p>
              </div>
              <div className="pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer border-b-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#46178f] dark:text-purple-300">
                  Privacy Policy
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed pr-2 space-y-2 style-scrollbar">
                <p><strong>1. Data Collection</strong><br/>Mooderia Commute operates offline using IndexedDB and LocalStorage in your browser. We do NOT sync your commuting history to any cloud server.</p>
                <p><strong>2. GPS Tracking</strong><br/>When using "Demo Ride" or "Live Tracking", geolocation data remains strictly within your device's memory to render the canvas layer.</p>
                <p><strong>3. Transparency</strong><br/>Your locally generated PIN and wallet balance cannot be recovered if you delete your browser data.</p>
              </div>
              <div className="pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs py-2 rounded-xl uppercase transition cursor-pointer border-b-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

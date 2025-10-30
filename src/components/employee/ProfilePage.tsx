import React, { useEffect, useState } from 'react';
import { Edit, Save, X, Download, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Profile as SupabaseProfile } from '../../lib/supabase';

const emptyForm = {
    full_name: '',
    phone: '',
    job_title: '',
    date_of_joining: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    profile_picture_url: '',
    status: 'active',
};

export const ProfilePage: React.FC = () => {
    const { profile, refreshProfile } = useAuth();
    const [form, setForm] = useState<any>(emptyForm);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setForm({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                job_title: profile.job_title || '',
                date_of_joining: profile.date_of_joining || '',
                date_of_birth: profile.date_of_birth || '',
                address: profile.address || '',
                emergency_contact: profile.emergency_contact || '',
                profile_picture_url: profile.profile_picture_url || '',
                status: profile.status || 'active',
            });
        } else {
            setForm(emptyForm);
        }
    }, [profile]);

    const handleChange = (key: string, value: any) => setForm((s: any) => ({ ...s, [key]: value }));

    const handleSave = async () => {
        if (!profile?.id) return;
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const updateObj: Partial<SupabaseProfile> = {
                full_name: form.full_name,
                phone: form.phone,
                job_title: form.job_title,
                date_of_joining: form.date_of_joining,
                date_of_birth: form.date_of_birth,
                address: form.address,
                emergency_contact: form.emergency_contact,
                profile_picture_url: form.profile_picture_url,
                status: form.status,
            };

            const { data, error: updateError } = await supabase
                .from('profiles')
                .update(updateObj)
                .eq('id', profile.id)
                .select()
                .maybeSingle();

            if (updateError) throw updateError;

            setMessage('Profile updated successfully.');
            setEditing(false);

            // Refresh global profile so other UI updates immediately
            if (refreshProfile) await refreshProfile();

            if (data) setForm((s: any) => ({ ...s, ...data }));
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setForm({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                job_title: profile.job_title || '',
                date_of_joining: profile.date_of_joining || '',
                date_of_birth: profile.date_of_birth || '',
                address: profile.address || '',
                emergency_contact: profile.emergency_contact || '',
                profile_picture_url: profile.profile_picture_url || '',
                status: profile.status || 'active',
            });
        }
        setError(null);
        setMessage(null);
        setEditing(false);
    };

    const handleDownloadJSON = () => {
        const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profile-${profile?.id || 'me'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Deactivate flow removed per latest UX decision (user requested removal)

    if (!profile) {
        return (
            <div className="min-h-screen p-6">
                <div className="bg-white rounded-xl p-8 border border-slate-200">
                    <h2 className="text-xl font-semibold">Profile</h2>
                    <p className="text-sm text-slate-600 mt-2">No profile available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="bg-white rounded-xl p-8 border border-slate-200 max-w-3xl mx-auto">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                            {form.profile_picture_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.profile_picture_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-400">{profile.full_name ? profile.full_name.charAt(0) : profile.email?.charAt(0)}</div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{form.full_name || profile.email}</h1>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                            <p className="text-xs text-slate-400 mt-1">Role: {profile.role}</p>
                            <p className="text-xs text-slate-400">Status: {form.status}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!editing ? (
                            <>
                                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md">
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={handleDownloadJSON} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md text-slate-700">
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </>
                        ) : (
                            <>
                                <button disabled={loading} onClick={handleSave} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md">
                                    <Save className="w-4 h-4" /> Save
                                </button>
                                <button disabled={loading} onClick={handleCancel} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md text-slate-700">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        {editing ? (
                            <input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.full_name || '—'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Phone</label>
                        {editing ? (
                            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.phone || '—'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Job Title</label>
                        {editing ? (
                            <input value={form.job_title} onChange={(e) => handleChange('job_title', e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.job_title || '—'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                        {editing ? (
                            <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString() : '—'}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Address</label>
                        {editing ? (
                            <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={3} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white"></textarea>
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.address || '—'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Emergency Contact</label>
                        {editing ? (
                            <input value={form.emergency_contact} onChange={(e) => handleChange('emergency_contact', e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.emergency_contact || '—'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Profile Picture URL</label>
                        {editing ? (
                            <input value={form.profile_picture_url} onChange={(e) => handleChange('profile_picture_url', e.target.value)} placeholder="https://..." className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-md bg-white" />
                        ) : (
                            <p className="mt-1 text-base text-slate-800">{form.profile_picture_url ? (<a className="text-indigo-600 underline" href={form.profile_picture_url} target="_blank" rel="noreferrer">View</a>) : '—'}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {message && <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm flex items-center gap-2"><Check className="w-4 h-4" />{message}</div>}
                        {error && <div className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Deactivate button removed per request */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

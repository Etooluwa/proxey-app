import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Icons } from '../components/Icons';
import { useSession } from '../auth/authContext';
import { useToast } from '../components/ui/ToastProvider';
import supabase from '../utils/supabase';

const AccountPage = () => {
    const navigate = useNavigate();
    const { session, profile, updateProfile, signOut } = useSession();
    const toast = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        defaultLocation: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                defaultLocation: profile.defaultLocation || profile.city || '',
            });
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Validate required fields
            if (!formData.name?.trim() || !formData.phone?.trim()) {
                toast.push({
                    title: 'Validation Error',
                    description: 'Name and phone are required fields',
                    variant: 'error'
                });
                return;
            }

            const userId = session?.user?.id;
            if (!userId) {
                throw new Error('No user session found');
            }

            // Update in Supabase
            if (supabase) {
                const { error } = await supabase
                    .from('client_profiles')
                    .upsert({
                        user_id: userId,
                        name: formData.name,
                        phone: formData.phone,
                        bio: formData.bio || '',
                        email: session.user.email,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            // Update local profile
            await updateProfile({
                ...formData,
                city: formData.defaultLocation,
                isProfileComplete: true
            });

            toast.push({
                title: 'Profile Updated',
                description: 'Your changes have been saved successfully',
                variant: 'success'
            });

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.push({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/auth/sign-in');
        } catch (error) {
            console.error('Sign out error:', error);
            toast.push({
                title: 'Error',
                description: 'Failed to sign out',
                variant: 'error'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="px-4 md:px-10 py-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
                    <p className="text-gray-600">Manage your profile and account preferences</p>
                </div>

                {/* Profile Section */}
                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                        {!isEditing && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                            >
                                <Icons.Edit size={16} className="mr-2" />
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    placeholder="Enter your full name"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.name || 'Not set'}</p>
                            )}
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <p className="text-gray-600 py-2">{session?.user?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    placeholder="+1 (555) 123-4567"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.phone || 'Not set'}</p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Default Location
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="defaultLocation"
                                    value={formData.defaultLocation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                    placeholder="e.g., San Francisco, CA"
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.defaultLocation || 'Not set'}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bio
                            </label>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                                    placeholder="Tell us a bit about yourself..."
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.bio || 'No bio added'}</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    {isSaving ? (
                                        <>
                                            <Icons.Loader size={16} className="mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form data
                                        setFormData({
                                            name: profile?.name || '',
                                            phone: profile?.phone || '',
                                            bio: profile?.bio || '',
                                            defaultLocation: profile?.defaultLocation || profile?.city || '',
                                        });
                                    }}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Account Actions */}
                <Card>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Account Actions</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-900">Switch to Provider</h3>
                                <p className="text-sm text-gray-600">Offer your services to clients</p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate('/provider')}
                            >
                                Switch Mode
                            </Button>
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <div>
                                <h3 className="font-semibold text-red-600">Sign Out</h3>
                                <p className="text-sm text-gray-600">Sign out of your account</p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSignOut}
                                className="!text-red-600 !border-red-200 hover:!bg-red-50"
                            >
                                <Icons.LogOut size={16} className="mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AccountPage;

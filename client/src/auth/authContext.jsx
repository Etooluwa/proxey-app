import { createContext, useContext, useEffect, useMemo, useState } from "react";
import supabase from "../utils/supabase";
import { uploadProfilePhoto } from "../utils/photoUpload";

const SAFE_STRING = (val) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.message) return String(val.message);
    if (val === null || val === undefined) return '';
    return String(val);
};

const SESSION_STORAGE_KEY = "proxey.auth.session";
const PROFILE_STORAGE_KEY = "proxey.profile";
const LOCAL_ROLE_KEY = "proxey.userRoles";

const AuthContext = createContext(null);

function loadStoredSession() {
    try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("[auth] Failed to parse stored session", error);
        return null;
    }
}

function sanitizeProfile(profile) {
    if (!profile || typeof profile !== 'object') return null;

    // Create a safe copy
    const safeProfile = { ...profile };

    // Helper to ensure string or null
    const asString = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        // If it's an object/array, return empty string (or JSON string if you prefer, but empty is safer for rendering)
        return '';
    };

    // Sanitize common fields expected to be strings
    // List sourced from usage in AccountPage.js, AppShell.js, etc.
    const stringFields = ['name', 'firstName', 'lastName', 'email', 'phone', 'bio', 'photo', 'avatar', 'city', 'defaultLocation'];

    stringFields.forEach(field => {
        if (field in safeProfile) {
            safeProfile[field] = asString(safeProfile[field]);
        }
    });

    return safeProfile;
}

function persistSession(session) {
    if (!session) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
    }
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function loadProfile(userId) {
    if (!userId) return null;
    try {
        const raw = window.localStorage.getItem(`${PROFILE_STORAGE_KEY}:${userId}`);
        const parsed = raw ? JSON.parse(raw) : null;
        return sanitizeProfile(parsed);
    } catch (error) {
        console.warn("[auth] Failed to parse stored profile", error);
        return null;
    }
}

function persistProfile(userId, profile) {
    if (!userId) return;
    if (!profile) {
        window.localStorage.removeItem(`${PROFILE_STORAGE_KEY}:${userId}`);
        return;
    }
    window.localStorage.setItem(
        `${PROFILE_STORAGE_KEY}:${userId}`,
        JSON.stringify(profile)
    );
}

function isProfileCompleteShape(profile) {
    if (!profile) return false;
    // If the profile explicitly has isProfileComplete flag, trust it
    if (profile.isProfileComplete === true) return true;
    // Otherwise, check for required fields (for legacy profiles or incomplete onboarding)
    return Boolean(profile.name && profile.phone && profile.defaultLocation);
}

function loadLocalRoles() {
    try {
        const raw = window.localStorage.getItem(LOCAL_ROLE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.warn("[auth] Failed to parse stored roles", error);
        return {};
    }
}

function getLocalRole(email) {
    if (!email) return null;
    const map = loadLocalRoles();
    return map[email.toLowerCase()] || null;
}

function setLocalRole(email, role) {
    if (!email || !role) return;
    const map = loadLocalRoles();
    map[email.toLowerCase()] = role;
    window.localStorage.setItem(LOCAL_ROLE_KEY, JSON.stringify(map));
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => loadStoredSession());
    const [profile, setProfile] = useState(() =>
        session?.user?.id ? loadProfile(session.user.id) : null
    );
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let unsubscribe;
        async function init() {
            if (supabase) {
                try {
                    const {
                        data: { session: sbSession },
                    } = await supabase.auth.getSession();
                    if (sbSession) {
                        const mapped = mapSupabaseSession(sbSession);
                        setSession(mapped);
                        persistSession(mapped);
                        const storedProfile = loadProfile(mapped.user.id);
                        if (storedProfile) {
                            setProfile(storedProfile);
                        } else if (sbSession.user?.user_metadata?.profile) {
                            setProfile(sanitizeProfile(sbSession.user.user_metadata.profile));
                        }
                    }
                } catch (error) {
                    console.warn("[auth] Failed to fetch Supabase session", error);
                }
                const { data } = supabase.auth.onAuthStateChange(async (_event, sbSession) => {
                    if (sbSession) {
                        const mapped = mapSupabaseSession(sbSession);

                        // Check if there's a pending role from OAuth sign-in
                        const pendingRole = window.localStorage.getItem('proxey.pending_role');
                        if (pendingRole && !sbSession.user?.user_metadata?.role) {
                            // Set the role for OAuth users
                            try {
                                await supabase.auth.updateUser({
                                    data: { role: pendingRole },
                                });
                                mapped.user.role = pendingRole;
                                setLocalRole(sbSession.user.email, pendingRole);
                            } catch (err) {
                                console.warn("[auth] Failed to set role for OAuth user", err);
                            }
                            window.localStorage.removeItem('proxey.pending_role');
                        }

                        setSession(mapped);
                        persistSession(mapped);
                        const storedProfile = loadProfile(mapped.user.id);
                        setProfile(
                            storedProfile || sanitizeProfile(sbSession.user?.user_metadata?.profile) || null
                        );
                    } else {
                        setSession(null);
                        persistSession(null);
                        setProfile(null);
                    }
                });
                unsubscribe = () => {
                    data?.subscription?.unsubscribe?.();
                };
            } else {
                const stored = loadStoredSession();
                if (stored) {
                    setSession(stored);
                    const storedProfile = loadProfile(stored.user.id);
                    setProfile(storedProfile);
                }
            }
            setLoading(false);
        }
        init();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            persistProfile(session.user.id, profile);
        }
    }, [session?.user?.id, profile]);

    const isProfileComplete = useMemo(() => {
        if (!session?.user) return false;
        return isProfileCompleteShape(profile);
    }, [profile, session]);

    const login = async ({ email, password, role = "client" }) => {
        setAuthError(null);
        if (!email || !password) {
            throw new Error("Email and password are required.");
        }

        const existingRole = getLocalRole(email);
        if (existingRole && existingRole !== role) {
            const roleLabel = existingRole === 'provider' ? 'Service Provider' : 'Client';
            const switchToRole = existingRole === 'provider' ? 'Service Provider tab' : 'Client tab';
            const err = new Error(
                `This account is registered as a ${roleLabel}. Please switch to the ${switchToRole} to sign in.`
            );
            setAuthError(err.message);
            throw err;
        }

        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                const msg = SAFE_STRING(error.message || error);
                setAuthError(msg);
                throw error;
            }
            if (!data.session) {
                const err = new Error("No session returned from Supabase.");
                setAuthError(err.message);
                throw err;
            }
            const storedRole = data.session.user?.user_metadata?.role;
            if (storedRole && storedRole !== role) {
                const roleLabel = storedRole === 'provider' ? 'Service Provider' : 'Client';
                const switchToRole = storedRole === 'provider' ? 'Service Provider tab' : 'Client tab';
                const err = new Error(
                    `This account is registered as a ${roleLabel}. Please switch to the ${switchToRole} to sign in.`
                );
                try {
                    await supabase.auth.signOut();
                } catch (signOutError) {
                    console.warn("[auth] Failed to sign out after role mismatch", signOutError);
                }
                setSession(null);
                setProfile(null);
                persistSession(null);
                setAuthError(err.message);
                throw err;
            }
            if (!storedRole && role) {
                try {
                    await supabase.auth.updateUser({
                        data: {
                            role,
                        },
                    });
                } catch (metaError) {
                    console.warn("[auth] Failed to persist role metadata", metaError);
                }
            }
            const mapped = mapSupabaseSession(data.session);
            mapped.user.role = storedRole || role;
            setSession(mapped);
            persistSession(mapped);
            setLocalRole(email, mapped.user.role || role);
            const storedProfile = loadProfile(mapped.user.id);
            if (storedProfile) {
                setProfile(storedProfile);
                return { session: mapped, profile: storedProfile };
            }
            const metaProfile = data.session.user?.user_metadata?.profile || null;
            if (metaProfile) {
                const sanitized = sanitizeProfile(metaProfile);
                setProfile(sanitized);
                return { session: mapped, profile: sanitized };
            }
            setProfile(null);
            return { session: mapped, profile: null };
        }

        const chosenRole = existingRole || role;
        const fallbackSession = {
            user: {
                id: email.toLowerCase(),
                email,
                role: chosenRole,
            },
            accessToken: `local-${Math.random().toString(36).slice(2)}`,
            mode: "local",
        };
        setSession(fallbackSession);
        persistSession(fallbackSession);
        setLocalRole(email, chosenRole);
        const storedProfile = loadProfile(fallbackSession.user.id);
        console.log('[authContext] Loading profile for user:', fallbackSession.user.id);
        console.log('[authContext] Loaded profile:', storedProfile);
        if (storedProfile) {
            setProfile(storedProfile);
            return { session: fallbackSession, profile: storedProfile };
        }
        setProfile(null);
        return { session: fallbackSession, profile: null };
    };

    const register = async ({ email, password, role = "client" }) => {
        setAuthError(null);
        if (!email || !password) {
            throw new Error("Email and password are required.");
        }

        if (supabase) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { role },
                },
            });
            if (error) {
                const msg = SAFE_STRING(error.message || error);
                setAuthError(msg);
                throw error;
            }
            setLocalRole(email, role);
            return { session: data.session ?? null, profile: null };
        }

        const fallbackSession = {
            user: {
                id: email.toLowerCase(),
                email,
                role,
            },
            accessToken: `local-${Math.random().toString(36).slice(2)}`,
            mode: "local",
        };
        setSession(fallbackSession);
        persistSession(fallbackSession);
        setLocalRole(email, role);
        return { session: fallbackSession, profile: null };
    };

    const logout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setSession(null);
        setProfile(null);
        persistSession(null);
    };

    const loginWithGoogle = async (role = "client") => {
        setAuthError(null);
        if (!supabase) {
            throw new Error("Supabase is not configured");
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            const msg = SAFE_STRING(error.message || error);
            setAuthError(msg);
            throw error;
        }

        // Store the intended role in localStorage so we can set it after redirect
        window.localStorage.setItem('proxey.pending_role', role);

        return data;
    };

    const updateProfile = async (partialProfile, photoFile = null) => {
        if (!session?.user) {
            throw new Error("No authenticated user.");
        }

        let photoUrl = partialProfile.photo || profile?.photo;

        // Handle photo upload if a file is provided
        if (photoFile) {
            try {
                photoUrl = await uploadProfilePhoto(photoFile, session.user.id);
                console.log("[auth] Photo uploaded successfully:", photoUrl);
            } catch (error) {
                console.error("[auth] Failed to upload photo", error);
                // Continue without photo if upload fails
            }
        }

        const nextProfile = {
            ...profile,
            ...partialProfile,
            photo: photoUrl,
        };

        if (supabase) {
            try {
                // Update auth user metadata
                const { error: authError } = await supabase.auth.updateUser({
                    data: {
                        profile: nextProfile,
                    },
                });
                if (authError) {
                    console.warn("[auth] Failed to update user metadata", authError);
                }

                // Also update the profiles table directly
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: session.user.id,
                        ...nextProfile,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.warn("[auth] Failed to update profiles table", profileError);
                }
            } catch (error) {
                console.warn("[auth] Failed to update profile via Supabase", error);
            }
        }

        setProfile(nextProfile);

        // Immediately persist to localStorage to ensure data is saved
        console.log('[authContext] Persisting profile to localStorage:', nextProfile);
        persistProfile(session.user.id, nextProfile);

        return nextProfile;
    };

    const clearAuthError = () => setAuthError(null);

    const value = useMemo(
        () => ({
            session,
            profile,
            loading,
            authError,
            clearAuthError,
            login,
            loginWithGoogle,
            register,
            logout,
            updateProfile,
            isProfileComplete,
            isProfileCompleteShape,
        }),
        [session, profile, loading, authError, isProfileComplete, updateProfile]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function mapSupabaseSession(sbSession) {
    const email = sbSession.user?.email;
    const fallbackRole = getLocalRole(email);
    return {
        user: {
            id: sbSession.user?.id,
            email: sbSession.user?.email,
            role: sbSession.user?.user_metadata?.role || fallbackRole || "client",
            metadata: sbSession.user?.user_metadata || {},
        },
        accessToken: sbSession.access_token,
        refreshToken: sbSession.refresh_token,
        expiresAt: sbSession.expires_at,
        mode: "supabase",
    };
}

export function useSession() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useSession must be used within an AuthProvider");
    }
    return ctx;
}

export const useAuth = useSession;

export default AuthContext;


export const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Clear any cached auth tokens
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('auth-token');
};

export const performSecureSignOut = async (supabase: any) => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out
    await supabase.auth.signOut({ scope: 'global' });
  } catch (error) {
    console.error('Sign out error:', error);
    // Continue even if sign out fails
  } finally {
    // Force page reload for complete cleanup
    window.location.href = '/auth';
  }
};

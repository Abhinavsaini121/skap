import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProfileQuery } from '../services/authApi';
import { selectIsAuthenticated, tokenValidationFailed } from '../store/authSlice';
import { tokenStorage } from '../utils/tokenStorage';

export const useAuthCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // Only fetch profile if we have a token
  const { data: userProfile, error: profileError, isLoading: profileLoading } = useGetProfileQuery(
    undefined, // No parameters needed
    {
      skip: !isAuthenticated || !accessToken,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from AsyncStorage like the APIs do
        const token = await tokenStorage.getAccessToken();
        setAccessToken(token);
        
        // If we have a token, validate it by fetching profile
        // The useGetProfileQuery will handle the validation
        // If it fails, the error will be caught and handled
      } catch (error) {
        // Auth check error
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []); // Remove isAuthenticated dependency to prevent infinite loops

  // If profile fetch fails with 401, user should be logged out
  useEffect(() => {
    if (profileError && profileError.status === 401) {
      dispatch(tokenValidationFailed());
    }
  }, [profileError, dispatch]);

  return {
    isChecking: isChecking || profileLoading,
    isAuthenticated,
    userProfile,
    profileError,
    hasValidToken: isAuthenticated && accessToken && !profileError,
  };
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import {createContext, useEffect, useState} from 'react';
import "core-js/stable/atob";
import axios from 'axios';
import {BASE_URL} from './urls/url';

const AuthContext = createContext();

const AuthProvider = ({children}) => {
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setToken(token);
        setAuthUser(token);
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        setUserId(userId);
      }
    };

    fetchUser();
  }, []);

  // Separate effect to fetch user info once userId is set
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (userId && !userInfo) {
        try {
          const response = await axios.get(`${BASE_URL}/user-info`, {
            params: {userId},
          });
          if (response.status === 200) {
            setUserInfo(response.data.user);
          }
        } catch (error) {
          console.log('Error fetching user info in AuthContext:', error);
        }
      }
    };

    fetchUserInfo();
  }, [userId, userInfo]);
  
  // Keep authUser in sync when token changes
  useEffect(() => {
    if (token) {
      setAuthUser(token);
    } else {
      setAuthUser(null);
    }
  }, [token]);

  // Also decode token when it changes so userId stays up to date
  useEffect(() => {
    try {
      if (token) {
        const decodedToken = jwtDecode(token);
        const uid = decodedToken?.userId;
        if (uid && uid !== userId) {
          setUserId(uid);
        }
      }
    } catch (e) {
      // ignore decode errors
    }
  }, [token]);
  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userId,
        setUserId,
        authUser,
        setAuthUser,
        userInfo,
        setUserInfo,
      }}>
      {children}
    </AuthContext.Provider>
  );
};


export {AuthContext,AuthProvider}
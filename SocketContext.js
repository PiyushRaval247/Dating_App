import {createContext, useContext, useState, useEffect} from 'react';
import {io} from 'socket.io-client';
import {AuthContext} from './AuthContext';
import {BASE_URL} from './urls/url';

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({children}) => {
  const [socket, setSocket] = useState(null);
  const {token, userId} = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      const s = io(BASE_URL, {
        query: {
          userId: userId,
        },
      });

      setSocket(s);

      return () => s.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [token, userId]);
  return (
    <SocketContext.Provider value={{socket, setSocket}}>
      {children}
    </SocketContext.Provider>
  );
};

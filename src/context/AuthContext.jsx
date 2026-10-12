import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('htm_team');
    return saved ? JSON.parse(saved) : null;
  });
  const [gameState, setGameState] = useState({
    is_started: false,
    started_at: null,
    round1_duration_minutes: 15
  });
  const [loading, setLoading] = useState(true);

  // Load game state & subscribe to real-time changes
  useEffect(() => {
    async function fetchGameState() {
      try {
        const { data, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('id', 1)
          .single();
        if (data && !error) {
          setGameState(data);
        }
      } catch (err) {
        console.error('Error fetching game state:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGameState();

    // Subscribe to realtime changes on game_state table
    const subscription = supabase
      .channel('public:game_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, (payload) => {
        if (payload.new) {
          setGameState(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loginTeam = (teamData) => {
    setTeam(teamData);
    localStorage.setItem('htm_team', JSON.stringify(teamData));
  };

  const logoutTeam = () => {
    setTeam(null);
    localStorage.removeItem('htm_team');
  };

  return (
    <AuthContext.Provider value={{ team, loginTeam, logoutTeam, gameState, setGameState, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  FullRepoAnalysis,
  SimulationResult,
  SignalFinding,
  SystemHealth
} from '../types';
import {
  analyzeRepository,
  fetchDemoAnalysis,
  fetchSystemHealth
} from '../services/api';

interface RepoContextType {
  currentRepo: FullRepoAnalysis | null;
  isLoading: boolean;
  error: string | null;
  periodDays: number;
  setPeriodDays: (days: number) => void;
  simulationResult: SimulationResult | null;
  setSimulationResult: (res: SimulationResult | null) => void;
  activeEvidence: SignalFinding | null;
  setActiveEvidence: (finding: SignalFinding | null) => void;
  systemHealth: SystemHealth | null;
  refreshHealth: () => Promise<void>;
  analyze: (url: string) => Promise<void>;
  loadDemo: () => Promise<void>;
  clearError: () => void;
  preselectedMaintainer: string | null;
  setPreselectedMaintainer: (login: string | null) => void;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export const RepoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRepo, setCurrentRepo] = useState<FullRepoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDaysState] = useState<number>(90);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<SignalFinding | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [preselectedMaintainer, setPreselectedMaintainer] = useState<string | null>(null);

  const refreshHealth = async () => {
    try {
      const data = await fetchSystemHealth();
      setSystemHealth(data);
    } catch {
      // Non-fatal if backend check fails temporarily
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const analyze = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeRepository(url, periodDays);
      setCurrentRepo(data);
      setSimulationResult(null);
      setPreselectedMaintainer(null);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository. Check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDemoAnalysis();
      setCurrentRepo(data);
      setSimulationResult(null);
      setPreselectedMaintainer(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  const setPeriodDays = (days: number) => {
    setPeriodDaysState(days);
    if (currentRepo && !currentRepo.is_demo) {
      analyze(currentRepo.metadata.html_url);
    }
  };

  const clearError = () => setError(null);

  return (
    <RepoContext.Provider
      value={{
        currentRepo,
        isLoading,
        error,
        periodDays,
        setPeriodDays,
        simulationResult,
        setSimulationResult,
        activeEvidence,
        setActiveEvidence,
        systemHealth,
        refreshHealth,
        analyze,
        loadDemo,
        clearError,
        preselectedMaintainer,
        setPreselectedMaintainer
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
};

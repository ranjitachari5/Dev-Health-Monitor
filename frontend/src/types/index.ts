export interface ToolHealth {
  tool_name: string;
  is_installed: boolean;
  current_version: string | null;
  required_version: string | null;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Unknown';
}

export interface HealthScanResponse {
  scan_timestamp: string;
  overall_score: number;
  platform: string;
  tools: ToolHealth[];
}

export interface AIAnalysis {
  required_tools: string[];
  missing_tools: string[];
  outdated_tools: string[];
  health_summary: string;
  critical_issues: string[];
  recommendations: string[];
}

export interface AnalyzeResponse {
  scan_results: ToolHealth[];
  ai_analysis: AIAnalysis;
  overall_score: number;
}

export interface FixResponse {
  success: boolean;
  message: string;
  terminal_output: string;
}

export interface ScanLog {
  scan_timestamp: string;
  overall_score: number;
  platform: string;
}

export interface InstallCommandResponse {
  tool: string;
  platform: string;
  command: string;
  notes: string;
}

export interface AppState {
  currentScreen: 'landing' | 'input' | 'dashboard';
  scanData: HealthScanResponse | null;
  aiAnalysis: AIAnalysis | null;
  isLoading: boolean;
  platform: string;
  projectDescription: string;
}

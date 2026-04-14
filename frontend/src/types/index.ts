export interface ToolHealth {
  tool_name: string;
  is_installed: boolean;
  current_version: string | null;
  required_version: string | null;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Unknown';
}

export interface HealthScanResponse {
  scan_id?: number;
  scan_timestamp?: string;
  timestamp?: string;
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

export type ToolStatus = 'ok' | 'outdated' | 'missing';
export type ToolCategory =
  | 'runtime'
  | 'package_manager'
  | 'database'
  | 'devtool'
  | 'container'
  | 'language';

export interface ToolResult {
  name: string;
  display_name: string;
  category: ToolCategory;
  status: ToolStatus;
  installed_version: string | null;
  min_version: string | null;
  install_url: string;
  why_needed: string;
  is_critical: boolean;
  host_os_name?: string;
  host_system?: string;
}

export interface ScanSummary {
  total: number;
  ok: number;
  outdated: number;
  missing: number;
}

export interface ScanEnvironmentMeta {
  os_name: string;
  system: string;
  platform: string;
}

export interface ScanResponse {
  scan_id: number;
  stack_name: string;
  results: ToolResult[];
  summary: ScanSummary;
  environment?: ScanEnvironmentMeta;
  timestamp?: string;
  ai_analysis?: AIAnalysis;
  overall_score?: number;
}

export interface GithubAnalysis {
  detected_tools: string[];
  stack_hint: string;
}

export interface ScanHistoryItem {
  scan_id: number;
  timestamp: string;
  stack_name: string;
  user_input_summary: string;
  summary: ScanSummary;
}

export type InputMode = 'chat' | 'folder' | 'github' | 'template';

export interface ProjectTemplate {
  name: string;
  icon: string;
  tools: string[];
  description: string;
}

export type AppView = 'auth' | 'brain' | 'landing' | 'input' | 'scanning' | 'results' | 'history';

export interface AppState {
  currentScreen: 'landing' | 'input' | 'dashboard';
  scanData: HealthScanResponse | null;
  aiAnalysis: AIAnalysis | null;
  isLoading: boolean;
  platform: string;
  projectDescription: string;
}

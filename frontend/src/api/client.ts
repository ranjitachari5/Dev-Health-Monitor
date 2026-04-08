import axios from 'axios';
import {
  HealthScanResponse,
  AnalyzeResponse,
  FixResponse,
  ScanLog,
  InstallCommandResponse
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

class ApiClient {
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message || 'An error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }

  async runHealthScan(): Promise<HealthScanResponse> {
    try {
      const response = await client.get<HealthScanResponse>('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async analyzeProject(description: string): Promise<AnalyzeResponse> {
    try {
      const response = await client.post<AnalyzeResponse>('/api/analyze', {
        project_description: description
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async fixTool(toolName: string, fixType: 'install' | 'path'): Promise<FixResponse> {
    try {
      const response = await client.post<FixResponse>(
        `/api/fix/${toolName}`,
        {},
        { params: { fix_type: fixType } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getScanHistory(): Promise<ScanLog[]> {
    try {
      const response = await client.get<ScanLog[]>('/api/scan/history');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInstallCommand(toolName: string): Promise<InstallCommandResponse> {
    try {
      const response = await client.get<InstallCommandResponse>(
        `/api/install-command/${toolName}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiClient = new ApiClient();

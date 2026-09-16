import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://maifelz-copilot-api.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export interface OdooConnection {
  id: string;
  label: string;
  url: string;
  database: string;
  username: string;
  odoo_version: string;
  company_name: string;
  uid: number;
  created_at: string;
  last_used: string;
}

export interface KPICard {
  title: string;
  value: string;
  change?: string;
  change_type?: 'up' | 'down' | 'neutral';
  icon?: string;
  description?: string;
}

export interface ReportSection {
  title: string;
  chart_type: string;
  data: Record<string, any>[];
  x_key?: string;
  y_keys?: string[];
  summary?: string;
  color_scheme?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'badge';
}

export interface AIReport {
  success: boolean;
  prompt: string;
  report_title: string;
  direct_answer?: string;
  executive_summary: string;
  kpi_cards: KPICard[];
  sections: ReportSection[];
  table_columns?: TableColumn[];
  table_records?: Record<string, any>[];
  insights: string[];
  recommendations: string[];
  clarification_question?: string;
  follow_up_suggestions?: string[];
  raw_data_available: boolean;
  error?: string;
}

export interface PromptSuggestion {
  category: string;
  icon: string;
  prompts: string[];
}

// Odoo Connection APIs
export const connectOdoo = async (data: {
  url: string;
  database: string;
  username: string;
  password: string;
  label?: string;
}) => {
  const res = await api.post('/odoo/connect', data);
  return res.data;
};

export const getConnections = async (): Promise<OdooConnection[]> => {
  const res = await api.get('/odoo/connections');
  return res.data.connections;
};

export const deleteConnection = async (id: string) => {
  const res = await api.delete(`/odoo/connections/${id}`);
  return res.data;
};

export const testConnection = async (id: string) => {
  const res = await api.get(`/odoo/connections/${id}/test`);
  return res.data;
};

// AI Report APIs
export const generateReport = async (connection_id: string, prompt: string): Promise<AIReport> => {
  const res = await api.post('/ai/report', { connection_id, prompt });
  return res.data;
};

export const getPromptSuggestions = async (connection_id: string): Promise<PromptSuggestion[]> => {
  const res = await api.get(`/ai/suggestions/${connection_id}`);
  return res.data.suggestions;
};

export const getQuickStats = async (connection_id: string) => {
  const res = await api.get(`/ai/quick-stats/${connection_id}`);
  return res.data.stats;
};

// AI Status & Config APIs
export const getAIStatus = async (): Promise<{ gemini_active: boolean; engine: string; key_preview?: string }> => {
  const res = await api.get('/ai/status');
  return res.data;
};

export const saveApiKey = async (apiKey: string): Promise<{ success: boolean; message: string }> => {
  const res = await api.post('/ai/api-key', { api_key: apiKey });
  return res.data;
};

// ── Master Admin SaaS & Licensing APIs ──
export interface TenantUser {
  email: string;
  name: string;
  role: string;
  password?: string;
  created_at: string;
  status: string;
}

export interface Tenant {
  id: string;
  company_name: string;
  contact_email: string;
  license_key: string;
  plan: string;
  monthly_limit: number;
  queries_used: number;
  seats_count?: number;
  user_logins?: TenantUser[];
  status: 'active' | 'suspended' | 'expired';
  connection_id: string;
  created_at: string;
  expires_at: string;
  last_query_at?: string;
  notes?: string;
}

export interface AdminSummary {
  total_clients: number;
  active_clients: number;
  total_queries_metered: number;
  estimated_mrr_usd: number;
  tenants: Tenant[];
}

export const getAdminSummary = async (): Promise<AdminSummary> => {
  const res = await api.get('/admin/summary');
  return res.data;
};

export const createTenant = async (data: {
  company_name: string;
  contact_email: string;
  plan: string;
  custom_limit?: number;
  notes?: string;
}): Promise<{ success: boolean; tenant: Tenant }> => {
  const res = await api.post('/admin/tenants', data);
  return res.data;
};

export const updateTenantStatus = async (
  tenant_id: string,
  status: 'active' | 'suspended' | 'expired'
): Promise<{ success: boolean }> => {
  const res = await api.post(`/admin/tenants/${tenant_id}/status`, { status });
  return res.data;
};

export const resetTenantUsage = async (
  tenant_id: string,
  additional_credits: number = 0
): Promise<{ success: boolean }> => {
  const res = await api.post(`/admin/tenants/${tenant_id}/reset`, { additional_credits });
  return res.data;
};

export const addTenantUser = async (
  tenant_id: string,
  email: string,
  name: string,
  role: string = 'manager',
  password?: string
): Promise<{ success: boolean; message: string; initial_password?: string; tenant: Tenant }> => {
  const res = await api.post(`/admin/tenants/${tenant_id}/users`, { email, name, role, password });
  return res.data;
};

export const deleteTenantUser = async (
  tenant_id: string,
  email: string
): Promise<{ success: boolean; message: string; tenant: Tenant }> => {
  const res = await api.delete(`/admin/tenants/${tenant_id}/users/${encodeURIComponent(email)}`);
  return res.data;
};

export const topupTenantCredits = async (
  tenant_id: string,
  credits: number
): Promise<{ success: boolean; message: string; tenant: Tenant }> => {
  const res = await api.post(`/admin/tenants/${tenant_id}/topup`, { credits });
  return res.data;
};

// ── Customer Auth & Session APIs ──
export interface AuthUser {
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface AuthTenant {
  id: string;
  company_name: string;
  license_key: string;
  plan: string;
  status: string;
  connection_id: string;
  monthly_limit: number;
  queries_used: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  tenant: AuthTenant;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getStoredAuth = (): { user: AuthUser; tenant: AuthTenant } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mfz_copilot_auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredAuth = (data: { user: AuthUser; tenant: AuthTenant }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mfz_copilot_auth', JSON.stringify(data));
};

export const logoutUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mfz_copilot_auth');
  window.location.href = '/login';
};



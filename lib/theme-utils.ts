/**
 * Calculate luminance of a color to determine if text should be dark or light
 * Uses the relative luminance formula from WCAG
 */
export function calculateLuminance(hexColor: string): number {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  // Formula: 0.299R + 0.587G + 0.114B
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Get appropriate text color based on background brightness
 * Returns white for dark backgrounds, dark gray for light backgrounds
 */
export function getContrastTextColor(bgColor: string): string {
  const luminance = calculateLuminance(bgColor);
  // If luminance > 128, use dark text; otherwise use white
  return luminance > 128 ? '#0f172a' : '#ffffff';
}

export interface CondoTheme {
  id: string;
  condo_id: string;
  enable_custom_theme: boolean;
  sidebar_bg_color: string;
  main_bg_color: string;
  card_bg_color: string;
  dialog_bg_color: string;
  input_bg_color: string;
  sidebar_text_color: string;
  main_text_color: string;
  card_text_color: string;
  dialog_text_color: string;
  input_text_color: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_THEME: Omit<CondoTheme, 'id' | 'condo_id' | 'created_at' | 'updated_at'> = {
  enable_custom_theme: false,
  sidebar_bg_color: '#1e293b',
  main_bg_color: '#f1f5f9',
  card_bg_color: '#ffffff',
  dialog_bg_color: '#1e293b',
  input_bg_color: '#ffffff',
  sidebar_text_color: '#ffffff',
  main_text_color: '#0f172a',
  card_text_color: '#0f172a',
  dialog_text_color: '#ffffff',
  input_text_color: '#0f172a',
};

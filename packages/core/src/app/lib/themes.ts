import { loadThemeDemo as load, themes as raw } from 'virtual:open-pdf/themes';
import type { DesignSystem } from './design';
import type { DocComponent } from './sdk';

export type Theme = {
  id: string;
  name: string;
  description: string;
  body: string;
  hasDemo: boolean;
};

export type ThemeDemoModule = {
  default: DocComponent;
  design?: DesignSystem;
};

export const themes: Theme[] = raw;

export async function loadThemeDemo(id: string): Promise<ThemeDemoModule> {
  return load(id);
}

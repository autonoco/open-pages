import { loadThemeDemo as load, themes as raw } from 'virtual:open-pages/themes';
import type { DesignSystem } from './design';
import type { PageComponent } from './sdk';

export type Theme = {
  id: string;
  name: string;
  description: string;
  body: string;
  hasDemo: boolean;
};

export type ThemeDemoModule = {
  default: PageComponent;
  design?: DesignSystem;
};

export const themes: Theme[] = raw;

export async function loadThemeDemo(id: string): Promise<ThemeDemoModule> {
  return load(id);
}

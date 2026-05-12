import { BasePage, BasePageOptions } from '../base/BasePage';

interface HACredentials {
  username: string;
  password: string;
}

export class HomeAssistant extends BasePage {
  private credentials: HACredentials;

  constructor(options: Omit<BasePageOptions, 'baseUrl'> & { url?: string; credentials: HACredentials }) {
    super({ ...options, baseUrl: options.url ?? process.env.HA_URL ?? 'http://homeassistant.local:8123' });
    this.credentials = options.credentials;
  }

  async login(): Promise<void> {
    const page = this.getPage();
    await this.navigate('/');
    await page.waitForSelector('home-assistant');

    // Handle the onboarding vs login flow
    const url = page.url();
    if (url.includes('onboarding')) {
      throw new Error('Home Assistant is in onboarding mode — complete setup manually first.');
    }

    await page.locator('ha-auth-flow input[name="username"]').fill(this.credentials.username);
    await page.locator('ha-auth-flow input[name="password"]').fill(this.credentials.password);
    await page.locator('ha-auth-flow mwc-button[type="submit"]').click();
    await page.waitForURL('**/lovelace/**', { timeout: 10_000 });
  }

  async takeOverviewScreenshot(outputPath: string): Promise<void> {
    await this.navigate('/lovelace/0');
    await this.getPage().waitForLoadState('networkidle');
    await this.screenshot(outputPath);
  }

  async reloadBrowser(): Promise<void> {
    await this.navigate('/');
  }
}

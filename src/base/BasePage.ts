import { Browser, BrowserContext, Page, chromium, LaunchOptions } from 'playwright';

export interface BasePageOptions {
  headless?: boolean;
  slowMo?: number;
  baseUrl: string;
}

export abstract class BasePage {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected baseUrl: string;
  private headless: boolean;
  private slowMo: number;

  constructor(options: BasePageOptions) {
    this.baseUrl = options.baseUrl;
    this.headless = options.headless ?? true;
    this.slowMo = options.slowMo ?? 0;
  }

  async launch(): Promise<void> {
    const launchOptions: LaunchOptions = {
      headless: this.headless,
      slowMo: this.slowMo,
    };
    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  protected getPage(): Page {
    if (!this.page) throw new Error('Browser not launched. Call launch() first.');
    return this.page;
  }

  protected async navigate(path: string = ''): Promise<void> {
    await this.getPage().goto(`${this.baseUrl}${path}`);
  }

  protected async screenshot(filename: string): Promise<void> {
    await this.getPage().screenshot({ path: filename, fullPage: true });
  }

  // Run an automation task with automatic launch/close lifecycle
  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.launch();
    try {
      return await task();
    } finally {
      await this.close();
    }
  }
}

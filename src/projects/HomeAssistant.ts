import { BasePage, BasePageOptions } from '../base/BasePage';

interface HAOptions extends Omit<BasePageOptions, 'baseUrl'> {
  url?: string;
  token: string;
}

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export class HomeAssistant extends BasePage {
  private token: string;
  private apiBase: string;

  constructor(options: HAOptions) {
    const url = options.url ?? process.env.HA_URL ?? 'http://homeassistant.local:8123';
    super({ ...options, baseUrl: url });
    this.token = options.token ?? process.env.HA_TOKEN ?? '';
    this.apiBase = url;
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  async login(): Promise<void> {
    await this.navigate('/');
    await this.getPage().evaluate((token) => {
      const hassUrl = window.location.origin;
      localStorage.setItem('hassTokens', JSON.stringify({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 1800,
        hassUrl,
        clientId: hassUrl + '/',
        expires_at: Date.now() / 1000 + 315_360_000,
        refresh_token: '',
      }));
    }, this.token);
    await this.navigate('/');
    await this.getPage().waitForURL('**/lovelace/**', { timeout: 10_000 });
  }

  // ── REST API helpers ─────────────────────────────────────────────────────────

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.apiBase}/api${path}`, {
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HA API ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  }

  private async apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiBase}/api${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HA API POST ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getState(entityId: string): Promise<EntityState> {
    return this.apiGet<EntityState>(`/states/${entityId}`);
  }

  async callService(domain: string, service: string, data: Record<string, unknown> = {}): Promise<void> {
    await this.apiPost(`/services/${domain}/${service}`, data);
  }

  // ── Lights ──────────────────────────────────────────────────────────────────

  async setAllLightsWhite(): Promise<void> {
    await this.callService('scene', 'turn_on', { entity_id: 'scene.all_lights_white' });
  }

  async setRandomScene(): Promise<void> {
    await this.callService('scene', 'turn_on', { entity_id: 'scene.random_scene' });
  }

  async setLightBrightness(entityId: string, brightness: number): Promise<void> {
    await this.callService('light', 'turn_on', { entity_id: entityId, brightness: Math.round(brightness * 2.55) });
  }

  async turnOffAllLights(): Promise<void> {
    await this.callService('light', 'turn_off', { entity_id: 'all' });
  }

  // ── Modes ───────────────────────────────────────────────────────────────────

  async setAwayMode(enabled: boolean): Promise<void> {
    await this.callService('input_boolean', enabled ? 'turn_on' : 'turn_off', {
      entity_id: 'input_boolean.away_mode',
    });
  }

  async setGuestMode(enabled: boolean): Promise<void> {
    await this.callService('input_boolean', enabled ? 'turn_on' : 'turn_off', {
      entity_id: 'input_boolean.guest_mode',
    });
  }

  // ── Climate ─────────────────────────────────────────────────────────────────

  async getClimate(): Promise<{ state: string; temperature: number; mode: string }> {
    const entity = await this.getState('climate.apartment');
    return {
      state: entity.state,
      temperature: entity.attributes['temperature'] as number,
      mode: entity.attributes['hvac_mode'] as string,
    };
  }

  async setTemperature(tempF: number): Promise<void> {
    await this.callService('climate', 'set_temperature', {
      entity_id: 'climate.apartment',
      temperature: tempF,
    });
  }

  // ── Media ───────────────────────────────────────────────────────────────────

  async getMediaPlayer(): Promise<{ title: string; artist: string; state: string } | null> {
    try {
      const entity = await this.getState('media_player.spotify');
      const attrs = entity.attributes;
      return {
        title: attrs['media_title'] as string,
        artist: attrs['media_artist'] as string,
        state: entity.state,
      };
    } catch {
      return null;
    }
  }

  async mediaPlayPause(entityId = 'media_player.spotify'): Promise<void> {
    await this.callService('media_player', 'media_play_pause', { entity_id: entityId });
  }

  // ── System stats ─────────────────────────────────────────────────────────────

  async getHostStats(): Promise<{ cpu: number; memory: number }> {
    const [cpu, mem] = await Promise.all([
      this.getState('sensor.processor_use'),
      this.getState('sensor.memory_use_percent'),
    ]);
    return { cpu: parseFloat(cpu.state), memory: parseFloat(mem.state) };
  }

  async getNASUsage(): Promise<{ nas: number; jellyfin: number }> {
    const [nas, jelly] = await Promise.all([
      this.getState('sensor.nas_disk_used_percent'),
      this.getState('sensor.jellyfin_disk_used_percent'),
    ]);
    return { nas: parseFloat(nas.state), jellyfin: parseFloat(jelly.state) };
  }

  // ── Running / fitness ────────────────────────────────────────────────────────

  async getRunningStats(): Promise<{ ytdRuns: number; ytdMiles: number; lastPace: string; lastAvgHR: number }> {
    const [runs, miles, pace, hr] = await Promise.all([
      this.getState('sensor.garmin_total_steps'),
      this.getState('sensor.garmin_ytd_distance'),
      this.getState('sensor.garmin_last_run_pace'),
      this.getState('sensor.garmin_last_run_avg_hr'),
    ]);
    return {
      ytdRuns: parseInt(runs.state),
      ytdMiles: parseFloat(miles.state),
      lastPace: pace.state,
      lastAvgHR: parseInt(hr.state),
    };
  }

  // ── Tesla ────────────────────────────────────────────────────────────────────

  async getTeslaLeaseVariance(): Promise<string> {
    const entity = await this.getState('sensor.tesla_lease_variance');
    return entity.state;
  }

  // ── Dashboard screenshot ─────────────────────────────────────────────────────

  async screenshotDashboard(tab: 'tablet' | 'mobile' | 'running' | 'energy' = 'tablet', outputPath = 'dashboard.png'): Promise<void> {
    await this.navigate(`/lovelace/${tab}`);
    await this.getPage().waitForLoadState('networkidle');
    await this.screenshot(outputPath);
  }
}

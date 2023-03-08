import { BaseProxyConfig } from "../base-proxy-config";
import { Executor } from "../executor";

export type WindowsProxyType = "http" | "https" | "ftp";

export class WindowsProxyConfig implements BaseProxyConfig {
  hostname: string;
  port: number;
  types: WindowsProxyType[];
  override?: string[];
}

export class WindowsProxied {
  private static REG = `"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"`;
  private static enableCommand = `reg add ${this.REG} /v ProxyEnable /t REG_DWORD /d 1 /f`;
  private static disableCommand = `reg add ${this.REG} /v ProxyEnable /t REG_DWORD /d 0 /f`;

  /**
   * proxy status
   *
   * @returns null if proxy is disabled
   */
  static status(): WindowsProxyConfig | null {
    const proxyEnable = Executor.executeSync(`reg query ${this.REG} /v ProxyEnable`);
    const proxyServer = Executor.executeSync(`reg query ${this.REG} /v ProxyServer`);
    const proxyOverride = Executor.executeSync(`reg query ${this.REG} /v ProxyOverride`);
    const proxyEnableValue = proxyEnable.split("REG_DWORD")[1].trim();
    const proxyServerValue = proxyServer.split("REG_SZ")[1].trim();
    const proxyOverrideValue = proxyOverride.split("REG_SZ")[1].trim();
    if (proxyEnableValue === "0x0") return null;
    const proxy = proxyServerValue.split(";");
    const types = proxy.map((p) => p.split("=")[0]) as WindowsProxyType[];
    const hostname = proxy[0].split("=")[1].split(":")[0];
    const port = parseInt(proxy[0].split("=")[1].split(":")[1]);
    return {
      hostname,
      port,
      types,
      override: proxyOverrideValue === "" ? undefined : proxyOverrideValue.split(";")
    };
  }

  static enable(config: WindowsProxyConfig): void {
    this.verifyConfig(config);
    const proxyCommand = this.generateProxyCommand(config);
    Executor.executeSync(proxyCommand);
    const overrideCommand = this.generateOverrideCommand(config);
    Executor.executeSync(overrideCommand);
    Executor.executeSync(this.enableCommand);
  }

  static disable(types?: WindowsProxyType[]): void {
    if (types) {
      const proxyConfig = this.status();
      if (!proxyConfig) return;
      const proxy = proxyConfig.types
        .filter((type) => !types.includes(type))
        .map((type) => `${type}=${proxyConfig.hostname}:${proxyConfig.port}`)
        .join(";");
      const proxyCommand = `reg add ${this.REG} /v ProxyServer /t REG_SZ /d "${proxy}" /f`;
      Executor.executeSync(proxyCommand);
    } else {
      Executor.executeSync(this.disableCommand);
    }
  }

  private static verifyConfig(config: WindowsProxyConfig): void {
    if (!config.hostname) throw new Error("hostname is required");
    if (!config.port) throw new Error("port is required");
    if (!config.types) throw new Error("types is required");
    if (config.types.length === 0) throw new Error("types is required");
  }

  private static generateProxyCommand(config: WindowsProxyConfig): string {
    const proxy = config.types.map((type) => `${type}=${config.hostname}:${config.port}`).join(";");
    return `reg add ${this.REG} /v ProxyServer /t REG_SZ /d "${proxy}" /f`;
  }

  private static generateOverrideCommand(config: WindowsProxyConfig): string {
    const override = config.override ? config.override.join(";") : "";
    return `reg add ${this.REG} /v ProxyOverride /t REG_SZ /d "${override}" /f`;
  }
}

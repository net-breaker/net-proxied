import { BaseProxyConfig } from "../base-proxy-config";
import { Executor } from "../executor";

export type MacProxyType = "web" | "secureweb" | "ftp" | "socksfirewall" | "gopher" | "streaming";

export class MacProxyConfig implements BaseProxyConfig {
  hostname: string;
  port: number;
  passDomains?: string[];
  authentification?: Authentication;

  /**
   * network service name
   *
   * default: ["Wi-Fi", "Ethernet"]
   */
  networkServiceNames: string[];

  /**
   * proxy type
   *
   * default: ["web", "secureweb"]
   */
  types: MacProxyType[];
}

export interface Authentication {
  username: string;
  password: string;
}

export interface NetworkService {
  name: string;
  enabled: boolean;
}

export interface NetworkServiceProxyStatus {
  name: string;
  type: MacProxyType;
  enabled: boolean;
  server?: string;
  port?: number;
  passDomains: string[];
}

export interface DisableProxyRequest {
  networkServiceNames: string[];
  types: MacProxyType[];
}

export class MacProxied {
  private static defaultNetworkServiceNames = ["Wi-Fi", "Ethernet"];
  private static defaultTypes = ["web", "secureweb"] as MacProxyType[];
  private static allProxyTypes: MacProxyType[] = ["web", "secureweb", "ftp", "socksfirewall", "gopher", "streaming"];

  static listNetworkServices(): NetworkService[] {
    const context = Executor.executeSync("networksetup -listallnetworkservices");
    return context
      .split("\n")
      .filter((content) => {
        return content.trim() !== "" && content.trim() !== "An asterisk (*) denotes that a network service is disabled.";
      })
      .map((name) => {
        const disabled = name.startsWith("*");
        return {
          name: disabled ? name.substring(1).trim() : name.trim(),
          enabled: !disabled
        };
      });
  }

  static status(): NetworkServiceProxyStatus[] | null {
    const allNetworkService = this.listNetworkServices();
    if (allNetworkService.length === 0) return null;
    const result = new Array<NetworkServiceProxyStatus>();
    allNetworkService.map((networkService) => {
      const passdomains = Executor.executeSync(`networksetup -getproxybypassdomains ${networkService.name}`);
      const passDomains = passdomains.split("\n").filter((content) => content.trim() !== "");
      this.allProxyTypes.map((type) => {
        const context = Executor.executeSync(`networksetup -get${type}proxy ${networkService.name}`);
        const lines = context.split("\n");
        const enabled = lines[0].startsWith("Enabled: Yes");
        if (enabled) {
          result.push({
            name: networkService.name,
            type: type,
            enabled: true,
            server: lines[1].split(":")[1].trim(),
            port: Number(lines[2].split(":")[1].trim()),
            passDomains: passDomains
          });
        } else {
          result.push({
            name: networkService.name,
            type: type,
            enabled: enabled,
            passDomains: passDomains
          });
        }
      });
    });
    return result;
  }

  static enable(config: MacProxyConfig): void {
    this.verifyConfig(config);
    config.networkServiceNames.map((networkServiceName) => {
      const proxyCommand = this.generateEnableProxyCommand(networkServiceName, config);
      Executor.executeSync(proxyCommand);
    });
    config.networkServiceNames.map((nenetworkServiceName) => {
      const overrideCommand = this.generatePassDomainsCommand(nenetworkServiceName, config.passDomains);
      Executor.executeSync(overrideCommand);
    });
  }

  static disable(disableProxyRequest?: DisableProxyRequest): void {
    if (disableProxyRequest !== undefined && disableProxyRequest.networkServiceNames.length === 0) return;
    if (disableProxyRequest === undefined) {
      // disable all
      const allNetworkService = this.listNetworkServices();
      allNetworkService.map((networkService) => {
        const proxyCommand = this.generateDisableProxyCommand(networkService.name, this.allProxyTypes);
        Executor.executeSync(proxyCommand);
      });
    } else {
      disableProxyRequest.networkServiceNames.map((networkServiceName) => {
        const proxyCommand = this.generateDisableProxyCommand(networkServiceName, disableProxyRequest.types);
        Executor.executeSync(proxyCommand);
      });
    }
  }

  private static verifyConfig(config: MacProxyConfig): void {
    if (!config.hostname) throw new Error("hostname is required");
    if (!config.port) throw new Error("port is required");
    if (!config.networkServiceNames) config.networkServiceNames = this.defaultNetworkServiceNames;
    if (!config.types) config.types = this.defaultTypes;
  }

  private static generateEnableProxyCommand(networkServiceName: string, config: MacProxyConfig): string {
    const proxyCommand = config.types
      .map((type) => {
        if (config.authentification !== undefined) {
          return `networksetup -set${type}proxy ${networkServiceName} ${config.hostname} ${config.port} on ${config.authentification.username} ${config.authentification.password} && networksetup -set${type}proxystate ${networkServiceName} on`;
        } else {
          return `networksetup -set${type}proxy ${networkServiceName} ${config.hostname} ${config.port} off && networksetup -set${type}proxystate ${networkServiceName} on`;
        }
      })
      .join(" && ");
    return proxyCommand;
  }

  private static generateDisableProxyCommand(networkServiceName: string, types: MacProxyType[]): string {
    const proxyCommand = types
      .map((type) => {
        return `networksetup -set${type}proxystate ${networkServiceName} off`;
      })
      .join(" && ");
    return proxyCommand;
  }

  private static generatePassDomainsCommand(networkServiceName: string, passDomains?: string[]): string {
    const passDomainsFixed = passDomains === undefined || passDomains.length === 0 ? "''" : passDomains.join(" ");
    return `networksetup -setproxybypassdomains ${networkServiceName} ${passDomainsFixed}`;
  }
}

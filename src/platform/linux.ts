import { BaseProxyConfig } from "../base-proxy-config";
import { Executor } from "../executor";

export type LinuxDesktopType = "GNOME" | "KDE" | "MATE";
export type LinuxProxyType = "http" | "https" | "ftp" | "socks";

export class LinuxProxyConfig implements BaseProxyConfig {
  hostname: string;
  port: number;
  noProxy?: string[];
  /**
   * proxy type
   *
   * default: ["http", "https"]
   */
  types: LinuxProxyType[];
}

export class LinuxProxied {
  private static defaultTypes = ["http", "https"] as LinuxProxyType[];
  private static desktopType = this.getDesktopType();

  static status(): LinuxProxyConfig | null {
    switch (this.desktopType) {
      case "GNOME":
        return GNOMECommander.status();
      case "KDE":
        return KDECommander.status();
      default:
        throw new Error("Unsupported desktop");
    }
  }

  static enable(config: LinuxProxyConfig): void {
    this.verifyConfig(config);
    switch (this.desktopType) {
      case "GNOME":
        GNOMECommander.enable(config);
        break;
      case "KDE":
        KDECommander.enable(config);
        break;
      default:
        throw new Error("Unsupported desktop");
    }
  }

  static disable(): void {
    switch (this.desktopType) {
      case "GNOME":
        GNOMECommander.disable();
        break;
      case "KDE":
        KDECommander.disable();
        break;
      default:
        throw new Error("Unsupported desktop");
    }
  }

  private static getDesktopType(): LinuxDesktopType {
    const desktop = Executor.executeSync("echo $XDG_CURRENT_DESKTOP");
    if (desktop.includes("GNOME")) return "GNOME";
    if (desktop.includes("KDE")) return "KDE";
    if (desktop.includes("MATE")) return "MATE";
    throw new Error("Unsupported desktop");
  }


  private static verifyConfig(config: LinuxProxyConfig): void {
    if (!config.hostname) throw new Error("hostname is required");
    if (!config.port) throw new Error("port is required");
    if (!config.types) config.types = this.defaultTypes;
  }
}

class KDECommander {
  static status(): LinuxProxyConfig | null {
    const types = [] as LinuxProxyType[];
    if (Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType"') === "1") {
      const noProxy = Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor"')
      if (Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy"') !== "") {
        types.push("http");
      }
      if (Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpsProxy"') !== "") {
        types.push("https");
      }
      if (Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "ftpProxy"') !== "") {
        types.push("ftp");
      }
      if (Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "socksProxy"') !== "") {
        types.push("socks");
      }
      return {
        hostname: Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy"').split(":")[0],
        port: Number(Executor.executeSync('kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy"').split(":")[1]),
        noProxy: noProxy ? noProxy.split(",") : undefined,
        types
      }
    } else {
      return null;
    }
  }
  static enable(config: LinuxProxyConfig): void {
    Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType" 1')
    config.types.forEach((type) => {
      switch (type) {
        case "http":
          Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy" "${config.hostname}:${config.port}"')
          break;
        case "https":
          Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "httpsProxy" "${config.hostname}:${config.port}"')
          break;
        case "ftp":
          Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ftpProxy" "${config.hostname}:${config.port}"')
          break;
        case "socks":
          Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "socksProxy" "${config.hostname}:${config.port}"')
          break;
      }
    })
    if (config.noProxy && config.noProxy.length > 0) {
      Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor" "${config.noProxy.join(",")}"')
    } else {
      Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor" ""')
    }
  }

  static disable(): void {
    Executor.executeSync('kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType" 0')
  }
}

class GNOMECommander {
  static status(): LinuxProxyConfig | null {

  }
  static enable(config: LinuxProxyConfig): void {

  }
  static disable(types?: LinuxProxyType[]): void {

  }
}

import { BaseProxyConfig } from "../base-proxy-config";
import { Executor } from "../executor";

export type LinuxDesktopType = "GNOME" | "KDE" | "MATE";
export type LinuxProxyType = "http" | "https" | "ftp" | "socks";

export interface Authentication {
  username: string;
  password: string;
}

export class LinuxProxyConfig {
  http?: BaseProxyConfig;
  https?: BaseProxyConfig;
  ftp?: BaseProxyConfig;
  socks?: BaseProxyConfig;
  noProxy?: string[];
  authentication?: Authentication;
}

export class LinuxProxied {
  static desktopType = this.getDesktopType();

  static status(): LinuxProxyConfig | null {
    switch (this.desktopType) {
      case "GNOME":
        return GNOMECommander.status();
      case "KDE":
        return KDECommander.status();
      default:
        throw new Error(`Unsupported desktop:${this.desktopType}`);
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
        throw new Error(`Unsupported desktop:${this.desktopType}`);
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
        throw new Error(`Unsupported desktop:${this.desktopType}`);
    }
  }

  private static getDesktopType(): LinuxDesktopType {
    const desktop = Executor.executeSync("echo $XDG_CURRENT_DESKTOP");
    if (desktop.includes("GNOME")) return "GNOME";
    if (desktop.includes("KDE")) return "KDE";
    if (desktop.includes("MATE")) return "MATE";
    throw new Error(`Unsupported desktop:${desktop}`);
  }


  private static verifyConfig(config: LinuxProxyConfig): void {
    switch (this.desktopType) {
      case "KDE":
        KDECommander.verifyConfig(config);
        break;
      case "GNOME":
        GNOMECommander.verifyConfig(config);
        break;
      default:
        throw new Error(`Unsupported desktop:${this.desktopType}`);
    }
  }
}

/**
 * KDE desktop environment
 */
class KDECommander {
  private static readonly newline = /\n/g;

  static status(): LinuxProxyConfig | null {
    const enabled = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType"`).trim() === "1";
    if (enabled) {
      const httpProxyConfig = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy"`).split(" ");
      const httpsProxyConfig = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "httpsProxy"`).split(" ");
      const ftpProxyConfig = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "ftpProxy"`).split(" ");
      const socksProxyConfig = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "socksProxy"`).split(" ");
      const noProxy = Executor.executeSync(`kreadconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor"`).replace(this.newline, "")
      return {
        http: !httpProxyConfig ? undefined : {
          hostname: httpProxyConfig[0],
          port: parseInt(httpProxyConfig[1])
        },
        https: !httpsProxyConfig ? undefined : {
          hostname: httpsProxyConfig[0],
          port: parseInt(httpsProxyConfig[1])
        },
        ftp: !ftpProxyConfig ? undefined : {
          hostname: ftpProxyConfig[0],
          port: parseInt(ftpProxyConfig[1])
        },
        socks: !socksProxyConfig ? undefined : {
          hostname: socksProxyConfig[0],
          port: parseInt(socksProxyConfig[1])
        },
        noProxy: !noProxy ? undefined : noProxy.split(",")
      }
    } else {
      return null;
    }
  }

  static enable(config: LinuxProxyConfig): void {
    Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType" 1`)
    if (config.http) {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "httpProxy" "${config.http.hostname} ${config.http.port}"`)
    }
    if (config.https) {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "httpsProxy" "${config.https.hostname} ${config.https.port}"`)
    }
    if (config.ftp) {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ftpProxy" "${config.ftp.hostname} ${config.ftp.port}"`)
    }
    if (config.socks) {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "socksProxy" "${config.socks.hostname} ${config.socks.port}"`)
    }
    if (config.noProxy && config.noProxy.length > 0) {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor" "${config.noProxy.join(",")}"`)
    } else {
      Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "NoProxyFor" ""`)
    }
  }

  static disable(): void {
    Executor.executeSync(`kwriteconfig5 --file kioslaverc --group "Proxy Settings" --key "ProxyType" 0`)
  }

  static verifyConfig(config: LinuxProxyConfig): void {
    if (config.authentication) {
      throw new Error("KDE does not support authentication");
    }
    if (config.http) {
      if (!config.http.hostname || !config.http.port) {
        throw new Error("Invalid http proxy config");
      }
    }
    if (config.https) {
      if (!config.https.hostname || !config.https.port) {
        throw new Error("Invalid https proxy config");
      }
    }
    if (config.ftp) {
      if (!config.ftp.hostname || !config.ftp.port) {
        throw new Error("Invalid ftp proxy config");
      }
    }
    if (config.socks) {
      if (!config.socks.hostname || !config.socks.port) {
        throw new Error("Invalid socks proxy config");
      }
    }
  }
}

/**
 * GNOME desktop environment
 */
class GNOMECommander {
  private static readonly newline = /\n/g;
  private static readonly singleQuotation = /'/g;
  private static readonly squareBrackets = /\[|\]/g;
  private static readonly space = / /g;

  static status(): LinuxProxyConfig | null {
    const enabled = Executor.executeSync(`gsettings get org.gnome.system.proxy mode`).replace(this.singleQuotation, "").replace(this.newline, "") !== "none"
    if (enabled) {
      const httpProxyHost = Executor.executeSync(`gsettings get org.gnome.system.proxy.http host`).replace(this.singleQuotation, "").replace(this.newline, "")
      const httpProxyPort = Executor.executeSync(`gsettings get org.gnome.system.proxy.http port`).trim();

      const httpsProxyHost = Executor.executeSync(`gsettings get org.gnome.system.proxy.https host`).replace(this.singleQuotation, "").replace(this.newline, "")
      const httpsProxyPort = Executor.executeSync(`gsettings get org.gnome.system.proxy.https port`).trim();

      const ftpProxyHost = Executor.executeSync(`gsettings get org.gnome.system.proxy.ftp host`).replace(this.singleQuotation, "").replace(this.newline, "")
      const ftpProxyPort = Executor.executeSync(`gsettings get org.gnome.system.proxy.ftp port`).trim();

      const socksProxyHost = Executor.executeSync(`gsettings get org.gnome.system.proxy.socks host`).replace(this.singleQuotation, "").replace(this.newline, "")
      const socksProxyPort = Executor.executeSync(`gsettings get org.gnome.system.proxy.socks port`).trim();

      const noProxy = Executor.executeSync(`gsettings get org.gnome.system.proxy ignore-hosts`).replace(this.squareBrackets, "").replace(this.singleQuotation, "").replace(this.space, "").replace(this.newline, "")
      const useAuthentication = Executor.executeSync(`gsettings get org.gnome.system.proxy.http use-authentication`)
      return {
        http: httpProxyHost === "" || httpProxyPort === "" ? undefined : {
          hostname: httpProxyHost,
          port: parseInt(httpProxyPort)
        },
        https: httpsProxyHost === "" || httpsProxyPort === "" ? undefined : {
          hostname: httpsProxyHost,
          port: parseInt(httpsProxyPort)
        },

        ftp: ftpProxyHost === "" || ftpProxyPort === "" ? undefined : {
          hostname: ftpProxyHost,
          port: parseInt(ftpProxyPort)
        },
        socks: socksProxyHost === "" || socksProxyPort === "" ? undefined : {
          hostname: socksProxyHost,
          port: parseInt(socksProxyPort)
        },
        noProxy: !noProxy ? undefined : noProxy.split(","),
        authentication: !useAuthentication ? undefined : {
          username: Executor.executeSync(`gsettings get org.gnome.system.proxy.http authentication-user`).replace(this.singleQuotation, "").replace(this.newline, ""),
          password: Executor.executeSync(`gsettings get org.gnome.system.proxy.http authentication-password`).replace(this.singleQuotation, "").replace(this.newline, "")
        }
      }
    } else {
      return null;
    }
  }

  static enable(config: LinuxProxyConfig): void {
    Executor.executeSync(`gsettings set org.gnome.system.proxy mode "manual"`);
    if (config.http) {
      Executor.executeSync(`gsettings set org.gnome.system.proxy.http host "${config.http.hostname}"`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.http port ${config.http.port}`);
    }
    if (config.https) {
      Executor.executeSync(`gsettings set org.gnome.system.proxy.https host "${config.https.hostname}"`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.https port ${config.https.port}`);
    }
    if (config.ftp) {
      Executor.executeSync(`gsettings set org.gnome.system.proxy.ftp host "${config.ftp.hostname}"`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.ftp port ${config.ftp.port}`);
    }
    if (config.socks) {
      Executor.executeSync(`gsettings set org.gnome.system.proxy.socks host "${config.socks.hostname}"`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.socks port ${config.socks.port}`);
    }
    if (config.noProxy && config.noProxy.length > 0) {
      const items = config.noProxy.map((item) => `'${item}'`).join(",");
      Executor.executeSync(`gsettings set org.gnome.system.proxy ignore-hosts "[${items}]"`);
    } else {
      Executor.executeSync(`gsettings set org.gnome.system.proxy ignore-hosts ""`);
    }
    if (config.authentication) {
      Executor.executeSync(`gsettings get org.gnome.system.proxy.http use-authentication true`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.http authentication-user "${config.authentication.username}"`);
      Executor.executeSync(`gsettings set org.gnome.system.proxy.http authentication-password "${config.authentication.password}"`);
    } else {
      Executor.executeSync(`gsettings set org.gnome.system.proxy.http use-authentication false`);
    }
  }

  static disable(): void {
    Executor.executeSync(`gsettings set org.gnome.system.proxy mode "none"`);
  }

  static verifyConfig(config: LinuxProxyConfig): void {
    if (config.authentication) {
      if (!config.authentication.username || !config.authentication.password) {
        throw new Error("Invalid authentication config");
      }
    }
    if (config.http) {
      if (!config.http.hostname || !config.http.port) {
        throw new Error("Invalid http proxy config");
      }
    }
    if (config.https) {
      if (!config.https.hostname || !config.https.port) {
        throw new Error("Invalid https proxy config");
      }
    }
    if (config.ftp) {
      if (!config.ftp.hostname || !config.ftp.port) {
        throw new Error("Invalid ftp proxy config");
      }
    }
    if (config.socks) {
      if (!config.socks.hostname || !config.socks.port) {
        throw new Error("Invalid socks proxy config");
      }
    }
  }
}

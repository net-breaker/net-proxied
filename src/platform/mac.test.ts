import { DisableProxyRequest, MacProxied, MacProxyConfig } from "./mac";

const needTest = process.platform === "darwin";

test("enable", () => {
  if (!needTest) return;
  const config: MacProxyConfig = {
    hostname: "10.20.30.40",
    port: 5060,
    passDomains: ["localhost", "192.168.*", "10.*"],
    types: ["web", "secureweb", "ftp", "socksfirewall", "gopher", "streaming"],
    networkServiceNames: ["Ethernet"]
  };
  MacProxied.enable(config);
  const status = MacProxied.status();
  if (status !== null) {
    status
      .filter((s) => s.name === "Ethernet")
      .forEach((item) => {
        expect(item.enabled).toBe(true);
        expect(item.server).toBe(config.hostname);
        expect(item.port).toBe(config.port);
        expect(item.passDomains).toEqual(config.passDomains);
      });
  }
});

test("disable", () => {
  if (!needTest) return;
  const config: DisableProxyRequest = {
    types: ["web", "secureweb", "ftp", "socksfirewall", "gopher", "streaming"],
    networkServiceNames: ["Ethernet"]
  };
  MacProxied.disable(config);
  const status = MacProxied.status();
  if (status !== null) {
    status
      .filter((s) => s.name === "Ethernet")
      .forEach((item) => {
        expect(item.enabled).toBe(false);
      });
  }
});

test("enableAll", () => {
  if (!needTest) return;
  const config: MacProxyConfig = {
    hostname: "10.20.30.40",
    port: 5060,
    networkServiceNames: MacProxied.listNetworkServices().map((s) => s.name),
    types: ["web", "secureweb", "ftp", "socksfirewall", "gopher", "streaming"]
  };
  MacProxied.enable(config);
  const status = MacProxied.status();
  if (status !== null) {
    status.forEach((item) => {
      expect(item.enabled).toBe(true);
      expect(item.server).toBe(config.hostname);
      expect(item.port).toBe(config.port);
      expect(item.passDomains).toEqual([]);
    });
  }
});

test("disableAll", () => {
  if (!needTest) return;
  const config: DisableProxyRequest = {
    types: ["web", "secureweb", "ftp", "socksfirewall", "gopher", "streaming"],
    networkServiceNames: MacProxied.listNetworkServices().map((s) => s.name)
  };
  MacProxied.disable(config);
  const status = MacProxied.status();
  if (status !== null) {
    status.forEach((item) => {
      expect(item.enabled).toBe(false);
    });
  }
});

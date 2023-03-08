import { WindowsProxied, WindowsProxyConfig } from "./windows";

const needTest = process.platform === "win32";

test("enable", () => {
  if (!needTest) return;
  const config: WindowsProxyConfig = {
    hostname: "10.20.30.40",
    port: 5060,
    types: ["http", "https", "ftp"],
    override: ["localhost", "192.168.*", "10.*"]
  };
  WindowsProxied.enable(config);
  const status = WindowsProxied.status();
  expect(status).not.toBeNull();
  expect(status!.hostname).toBe(config.hostname);
  expect(status!.port).toBe(config.port);
  expect(status!.types).toEqual(config.types);
  expect(status!.override).toEqual(config.override);
});

test("disable", () => {
  if (!needTest) return;
  WindowsProxied.disable();
  const status = WindowsProxied.status();
  expect(status).toBeNull();
});

test("enable-specify", () => {
  if (!needTest) return;
  const enableConfig: WindowsProxyConfig = {
    hostname: "10.20.30.40",
    port: 5060,
    types: ["http", "https", "ftp"],
    override: ["localhost", "192.168.*", "10.*"]
  };
  WindowsProxied.enable(enableConfig);
  WindowsProxied.disable(["http", "ftp"]);
  const status = WindowsProxied.status();
  expect(status).not.toBeNull();
  expect(status!.hostname).toBe(enableConfig.hostname);
  expect(status!.port).toBe(enableConfig.port);
  expect(status!.override).toEqual(enableConfig.override);
});

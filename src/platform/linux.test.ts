import { LinuxProxied, LinuxProxyConfig } from "./linux";

const needTest = process.platform === "linux";

test("desktop", () => {
  if (!needTest) return;
  expect(LinuxProxied.desktopType).toMatch(/KDE|GNOME|MATE/);
});


test("enable", () => {
  if (!needTest) return;
  const config: LinuxProxyConfig = {
    http: {
      hostname: "10.20.30.11",
      port: 1111,
    },
    https: {
      hostname: "10.20.30.22",
      port: 2222,
    },
    ftp: {
      hostname: "10.20.30.33",
      port: 3333,
    },
    socks: {
      hostname: "10.20.30.44",
      port: 4444,
    },
    noProxy: ["localhost", "192.168.*", "10.*"],
  };
  LinuxProxied.enable(config);
  const status = LinuxProxied.status();
  console.log(status);
  if (status !== null) {
    expect(status.http!.hostname).toBe(config.http?.hostname);
    expect(status.http!.port).toBe(config.http?.port);

    expect(status.https!.hostname).toBe(config.https?.hostname);
    expect(status.https!.port).toBe(config.https?.port);

    expect(status.ftp!.hostname).toBe(config.ftp?.hostname);
    expect(status.ftp!.port).toBe(config.ftp?.port);

    expect(status.socks!.hostname).toBe(config.socks?.hostname);
    expect(status.socks!.port).toBe(config.socks?.port);

    expect(status.noProxy).toEqual(config.noProxy);
  }
});

test("disable", () => {
  if (!needTest) return;
  LinuxProxied.disable();
  const status = LinuxProxied.status();
  expect(status).toBeNull();
});

# net-proxied: Set up proxy for operating systems

[![Published on npm](https://img.shields.io/npm/v/net-proxied.svg?logo=npm)](https://www.npmjs.com/package/net-proxied)
[![Build Status](https://github.com/net-breaker/net-proxied/actions/workflows/test.yml/badge.svg)](https://github.com/net-breaker/net-proxied/actions/workflows/test.yml)

## Supported

- Windows operating system
- Mac operating system
- Linux operating system (KDE,GNOME)

## Install

```shell
npm i net-proxied
```

## Example

Set up proxy on Windows:

```typescript
import { WindowsProxied, WindowsProxyConfig } from "net-proxied";

const config: WindowsProxyConfig = {
  hostname: "10.20.30.40",
  port: 5060,
  types: ["http", "https", "ftp"],
  override: ["localhost", "192.168.*", "10.*"]
};

WindowsProxied.enable(config);

// You can also disable it
// WindowsProxied.disable();
```

Set up proxy on Mac:

```typescript
import { MacProxied, MacProxyConfig } from "net-proxied";

const config: MacProxyConfig = {
  hostname: "10.20.30.40",
  port: 5060,
  networkServiceNames: ["Ethernet"],
  types: ["web", "secureweb", "ftp"],
  passDomains: ["localhost", "192.168.*", "10.*"]
};

MacProxied.enable(config);

// You can also disable it
// MacProxied.disable();
```

Set up proxy on Linux:

```typescript
import { LinuxProxied, LinuxProxyConfig } from "net-proxied";

const baseProxy: BaseProxyConfig = {
  hostname: "10.20.30.11",
  port: 1111
};
const config: LinuxProxyConfig = {
  http: baseProxy,
  https: baseProxy,
  ftp: baseProxy,
  socks: baseProxy,
  noProxy: ["localhost", "192.168.*", "10.*"]
};

LinuxProxied.enable(config);

// You can also disable it
// LinuxProxied.disable();
```

## License

[MIT](LICENSE) © [anonysoul](https://github.com/anonysoul/)

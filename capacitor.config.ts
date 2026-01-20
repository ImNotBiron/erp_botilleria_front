import type { CapacitorConfig } from "@capacitor/cli";

const liveReload = process.env.CAP_LR === "true";
const serverUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "cl.botilleriaelparaiso.app",
  appName: "Botilleria El Paraiso",
  webDir: "dist",

  ...(liveReload && serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;

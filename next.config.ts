import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["nodemailer"],
  experimental: {
    // O middleware de autenticação intercepta também os uploads. O padrão do
    // Next.js é apenas 10 MB, abaixo do limite configurável do módulo técnico.
    middlewareClientMaxBodySize: "2gb",
  },
};

export default nextConfig;

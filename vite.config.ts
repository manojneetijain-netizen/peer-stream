import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const customLoggerPlugin = () => ({
  name: 'custom-logger',
  configureServer(server: any) {
    server.printUrls = () => {
      const urls = server.resolvedUrls;
      if (!urls) return;
      const localUrl = urls.local[0] || 'http://localhost:8080/';
      
      const cyan = "\x1b[36m";
      const blue = "\x1b[34m";
      const green = "\x1b[32m";
      const dim = "\x1b[2m";
      const bold = "\x1b[1m";
      const reset = "\x1b[0m";

      console.clear();
      console.log(`\n`);
      console.log(`  ${cyan}╭───────────────────────────────────────────────────╮${reset}`);
      console.log(`  ${cyan}│${reset}                                                   ${cyan}│${reset}`);
      console.log(`  ${cyan}│${reset}   ${bold}${blue}🔥 PULSE APP${reset} ${dim}|${reset} ${bold}DEVELOPMENT SERVER 🔥${reset}           ${cyan}│${reset}`);
      console.log(`  ${cyan}│${reset}                                                   ${cyan}│${reset}`);
      console.log(`  ${cyan}│${reset}   ${green}➜${reset}  ${bold}Local:${reset}   ${localUrl.padEnd(31, " ")}${cyan}│${reset}`);
      
      if (urls.network && urls.network.length > 0) {
        urls.network.forEach((url: string) => {
          console.log(`  ${cyan}│${reset}   ${green}➜${reset}  ${bold}Network:${reset} ${url.padEnd(31, " ")}${cyan}│${reset}`);
        });
      }
      console.log(`  ${cyan}│${reset}                                                   ${cyan}│${reset}`);
      console.log(`  ${cyan}│${reset}   ${dim}Press H + Enter to show Vite help${reset}               ${cyan}│${reset}`);
      console.log(`  ${cyan}│${reset}                                                   ${cyan}│${reset}`);
      console.log(`  ${cyan}╰───────────────────────────────────────────────────╯${reset}`);
      console.log(`\n`);
    };
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), customLoggerPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

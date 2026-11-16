import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Archivo Black", "Archivo", "Impact", "sans-serif"],
        condensed: ["Archivo Black", "Archivo", "Impact", "sans-serif"],
        grunge: ["Archivo Black", "Archivo", "Impact", "sans-serif"],
        drip: ["Archivo Black", "Archivo", "Impact", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        // /start flow: the poster face from the Release Onboarding document.
        poster: ["Anton", "Impact", "Archivo Black", "sans-serif"],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        electric: {
          DEFAULT: "hsl(var(--electric))",
          foreground: "hsl(var(--electric-foreground))",
        },
        // /start flow palette, from the Release Onboarding document: ink, bone, one red.
        ink: "#111111",
        coal: "#1A1A1A",
        rule: "#3A3A3A",
        // Field and control outlines: 3:1 against ink so the box itself is visible.
        edge: "#707070",
        ash: "#9A9A9A",
        smoke: "#BDBDBD",
        bone: "#F2EFE8",
        blood: "#D7261E",
        // The red, lifted so small text on ink still passes contrast.
        "blood-hi": "#FF6A5E",
        // CRM team member accents
        mike:   "#00F0FF",
        steven: "#d97000",
        jay:    "#b366ff",
        stevie: "#F5FF00",
        // CRM surfaces
        "crm-bg":      "#0a0a0a",
        "crm-surface": "#1a1a1a",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

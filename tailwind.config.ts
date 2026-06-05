/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '96': '24rem',
        '112': '28rem',
        '128': '32rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        /* ── Brand accent palette ── */
        'brand-orange': {
          DEFAULT: '#d97757',
          light: '#f0c4b3',
          dark: '#c4593b',
          50: '#fdf3ef',
          100: '#fbe4da',
          500: '#d97757',
          600: '#c4593b',
          700: '#a4482f',
        },
        'brand-blue': {
          DEFAULT: '#6a9bcc',
          light: '#c7ddef',
          dark: '#4a7ba8',
          50: '#f0f5fa',
          500: '#6a9bcc',
          600: '#4a7ba8',
        },
        'brand-green': {
          DEFAULT: '#788c5d',
          light: '#d4ddc7',
          dark: '#606f4a',
          50: '#f3f5ef',
          500: '#788c5d',
          600: '#606f4a',
        },
        success: {
          DEFAULT: '#788c5d',
          foreground: '#ffffff',
          light: '#d4ddc7',
          dark: '#606f4a',
        },
        warning: {
          DEFAULT: '#d97757',
          foreground: '#ffffff',
          light: '#f0c4b3',
          dark: '#c4593b',
        },
        info: {
          DEFAULT: '#6a9bcc',
          foreground: '#ffffff',
          light: '#c7ddef',
          dark: '#4a7ba8',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-bg))',
          foreground: 'hsl(var(--sidebar-fg))',
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-fg))',
          border: 'hsl(var(--sidebar-border))',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
        body:    ['Lora', 'Georgia', 'ui-serif', 'serif'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" }
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" }
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 2s infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(200px, 1fr))',
        'fluid': 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
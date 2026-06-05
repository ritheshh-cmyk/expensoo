// Corporate Theme Configuration for CallMeMobiles Professional
export const corporateTheme = {
  "colors": {
    "primary": {
      "50": "#f0f4f8",
      "100": "#d9e2ec",
      "200": "#bcccdc",
      "300": "#9fb3c8",
      "400": "#829ab1",
      "500": "#627d98",
      "600": "#486581",
      "700": "#334e68",
      "800": "#243b53",
      "900": "#102a43"
    },
    "gray": {
      "50": "#f7fafc",
      "100": "#edf2f7",
      "200": "#e2e8f0",
      "300": "#cbd5e0",
      "400": "#a0aec0",
      "500": "#718096",
      "600": "#4a5568",
      "700": "#2d3748",
      "800": "#1a202c",
      "900": "#171923"
    },
    "success": {
      "50": "#f0fff4",
      "500": "#22c55e",
      "600": "#16a34a",
      "700": "#15803d"
    },
    "warning": {
      "50": "#fffbeb",
      "500": "#f59e0b",
      "600": "#d97706",
      "700": "#b45309"
    },
    "error": {
      "50": "#fef2f2",
      "500": "#ef4444",
      "600": "#dc2626",
      "700": "#b91c1c"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "sans-serif"
      ],
      "mono": [
        "ui-monospace",
        "SFMono-Regular",
        "Consolas",
        "monospace"
      ]
    },
    "fontSize": {
      "xs": [
        "0.75rem",
        {
          "lineHeight": "1rem"
        }
      ],
      "sm": [
        "0.875rem",
        {
          "lineHeight": "1.25rem"
        }
      ],
      "base": [
        "1rem",
        {
          "lineHeight": "1.5rem"
        }
      ],
      "lg": [
        "1.125rem",
        {
          "lineHeight": "1.75rem"
        }
      ],
      "xl": [
        "1.25rem",
        {
          "lineHeight": "1.75rem"
        }
      ],
      "2xl": [
        "1.5rem",
        {
          "lineHeight": "2rem"
        }
      ],
      "3xl": [
        "1.875rem",
        {
          "lineHeight": "2.25rem"
        }
      ],
      "4xl": [
        "2.25rem",
        {
          "lineHeight": "2.5rem"
        }
      ]
    }
  },
  "darkMode": {
    "background": "#000000",
    "surface": "#111111",
    "card": "#1a1a1a",
    "border": "#333333",
    "text": {
      "primary": "#ffffff",
      "secondary": "#a0a0a0",
      "muted": "#666666"
    }
  },
  "components": {
    "button": {
      "primary": "bg-primary-600 hover:bg-primary-700 text-white",
      "secondary": "bg-gray-200 hover:bg-gray-300 text-gray-900",
      "outline": "border border-primary-600 text-primary-600 hover:bg-primary-50"
    },
    "input": {
      "base": "border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500",
      "dark": "border-gray-600 bg-gray-800 text-white"
    },
    "card": {
      "base": "bg-white rounded-lg shadow-sm border border-gray-200",
      "dark": "bg-gray-800 border-gray-700"
    }
  }
};

export default corporateTheme;

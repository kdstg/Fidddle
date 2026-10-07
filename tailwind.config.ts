import type { Config } from "tailwindcss";

const config: Config = {
    theme: {
        extend: {
            colors: {
                canvas: "#202020",
                surface: {
                    DEFAULT: "#202020",
                    dark: "#1D1D1D",
                },
                border: {
                    dark: "#373737",
                },
                danger: "#F23C3C",
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "sans-serif"],
                brand: ["var(--font-alkaline-test)", "serif"],
            },
            borderWidth: {
                "0.5": "0.5px",
                "1.5": "1.5px",
            },
            borderRadius: {
                modal: "24px",
            },
            backgroundImage: {
                "blue-btn": "linear-gradient(180deg, #3C70F2 0%, #6792FF 50%, #1245C7 100%)",
                "blue-btn-stroke": "linear-gradient(180deg, #376EFB 0%, #1853EC 100%)",
            },
            backdropBlur: {
                glass: "8px",
            },
        },
    },
    plugins: [],
};

export default config;
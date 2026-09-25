import type { Metadata } from "next";
import FarmWeather from "@/components/tools/FarmWeather";

export const metadata: Metadata = {
  title: "Farm Weather Bangladesh | কৃষি আবহাওয়া ও বৃষ্টির পূর্বাভাস | AGRIVA",
  description: "Check farm weather, rainfall, temperature, humidity and wind forecasts for agriculture planning with AGRIVA.",
  alternates: { canonical: "/tools/farm-weather" },
  keywords: ["farm weather Bangladesh", "agriculture weather forecast", "farmer weather", "কৃষি আবহাওয়া", "বৃষ্টির পূর্বাভাস কৃষি"],
};

export default function FarmWeatherPage() {
  return <main className="min-h-screen bg-[#f5f7f2] text-[#17351f]"><section className="mx-auto max-w-6xl px-6 py-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#b58b28]">AGRIVA Farmer Tools</p><h1 className="mt-3 text-4xl font-black md:text-5xl">Farm Weather & Agriculture Forecast</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[#647468]">Check temperature, rainfall, humidity and wind forecasts to help plan farm activities. AGRIVA uses Open-Meteo's public weather API for this tool and displays forecasts as planning information.</p><FarmWeather /><article className="prose prose-green mt-14 max-w-none"><h2>Why weather matters for farming</h2><p>Rain, temperature, humidity and wind can affect irrigation, spraying, field work and harvest planning. A forecast can support planning, but conditions can change quickly.</p><h2>How AGRIVA's farm weather tool works</h2><p>Choose a location or enter latitude and longitude. The browser requests forecast data from Open-Meteo and presents a simple farmer-focused view. No AGRIVA server-side weather API key is required for this public-data integration.</p><h2>Important note</h2><p>Weather forecasts are estimates and should not be treated as guarantees. For pesticide or other regulated applications, follow the product label and applicable local agricultural guidance.</p><h2>Frequently asked questions</h2><h3>Does this require a paid weather API key?</h3><p>The current implementation uses Open-Meteo's public API. Commercial usage and applicable service limits should be reviewed before production-scale deployment.</p><h3>Can AI explain the forecast?</h3><p>Yes. The weather response can later be passed to AGRIVA's AI layer to generate a plain-language farm planning summary without replacing official weather warnings or agricultural advice.</p></article></section></main>;
}

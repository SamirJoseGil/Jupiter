import type { MetaFunction } from "@remix-run/node";
import Navbar from "~/components/navbar";
import Footer from "~/components/footer";
import HeroSection from "~/components/hero-section";
import WhatIsPQRSDf from "~/components/what-is-pqrs";
import EntitiesSection from "~/components/entities-section";
import HowWorksSection from "~/components/how-works-section";
import FaqSection from "~/components/faq-section";

export const meta: MetaFunction = () => {
  return [
    { title: "Jupiter" },
    { name: "description", content: "Plataforma municipal oficial para radicar peticiones, quejas, reclamos, sugerencias y denuncias en Medellín. Gestión inteligente con IA y seguimiento en tiempo real." },
    { name: "keywords", content: "PQRSDF, Medellín, Alcaldía, peticiones, quejas, reclamos, sugerencias, denuncias" },
    { name: "author", content: "Alcaldía de Medellín" },
    { property: "og:title", content: "Jupiter" },
    { property: "og:description", content: "Radicar y seguir tus PQRSDF ante la administración municipal con transparencia y eficiencia." },
    { property: "og:type", content: "website" },
    { name: "theme-color", content: "#3366CC" },
  ];
};

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 scroll-smooth">
      <Navbar />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <WhatIsPQRSDf />
        <EntitiesSection />
        <HowWorksSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

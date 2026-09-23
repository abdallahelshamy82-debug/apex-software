import Hero from "@/components/Hero";
import Philosophy from "@/components/Philosophy";
import Services from "@/components/Services";
import HorizontalPortfolio from "@/components/HorizontalPortfolio";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-bg-onyx">
      <Hero />
      <Philosophy />
      <Services />
      <Experience />
      <HorizontalPortfolio />
      <Contact />
      <Footer />
    </main>
  );
}

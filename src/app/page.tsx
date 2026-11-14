import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Portfolios from "@/components/Portfolios";
import Process from "@/components/Process";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Manifesto />
        <Services />
        <Work />
        <Portfolios />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

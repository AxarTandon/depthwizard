import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProductExplanation } from "@/components/landing/ProductExplanation";
import { Capabilities } from "@/components/landing/Capabilities";
import { Workflow } from "@/components/landing/Workflow";
import { VisualizationShowcase } from "@/components/landing/VisualizationShowcase";
import { CTA, Footer } from "@/components/landing/CTAFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      <main>
        <Hero />
        <ProductExplanation />
        <Capabilities />
        <Workflow />
        <VisualizationShowcase />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

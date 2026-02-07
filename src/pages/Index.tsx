import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import RealTimeSection from "@/components/landing/RealTimeSection";
import AISection from "@/components/landing/AISection";
import SecuritySection from "@/components/landing/SecuritySection";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ArchitectureSection />
      <RealTimeSection />
      <AISection />
      <SecuritySection />
      <CTASection />

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span className="gradient-text font-bold">Pulse</span>
          <span>© 2026 Pulse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;

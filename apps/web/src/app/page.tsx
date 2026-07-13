import { ArchitectureDiagram } from '@/components/landing/architecture-diagram';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { Hero } from '@/components/landing/hero';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <ArchitectureDiagram />
    </>
  );
}

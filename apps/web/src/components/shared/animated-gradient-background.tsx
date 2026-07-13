export function AnimatedGradientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-1/3 left-1/2 h-[80vh] w-[80vw] -translate-x-1/2 animate-gradient-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgb(237_28_36/0.14),transparent_60%)] blur-3xl" />
      <div className="absolute top-1/3 -left-1/4 h-[60vh] w-[60vw] animate-gradient-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgb(51_65_85/0.35),transparent_60%)] blur-3xl [animation-delay:-8s]" />
      <div className="absolute -right-1/4 bottom-0 h-[50vh] w-[50vw] animate-gradient-drift rounded-full bg-[radial-gradient(ellipse_at_center,rgb(237_28_36/0.08),transparent_60%)] blur-3xl [animation-delay:-14s]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.02)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  );
}

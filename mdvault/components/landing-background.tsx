"use client";

export function LandingBackground() {
  return (
    <>
      <style>{`
        .landing-bg-light {
          background-image: url('/landing-bg.svg');
        }
        
        html.dark .landing-bg-light {
          display: none;
        }
        
        .landing-bg-dark {
          background-image: url('/landing-bg-dark.svg');
          display: none;
        }
        
        html.dark .landing-bg-dark {
          display: block;
        }
      `}</style>
      {/* Light mode background */}
      <div className="landing-bg-light absolute inset-0 -z-10 w-full h-full bg-cover bg-center bg-no-repeat" />
      {/* Dark mode background */}
      <div className="landing-bg-dark absolute inset-0 -z-10 w-full h-full bg-cover bg-center bg-no-repeat" />
    </>
  );
}

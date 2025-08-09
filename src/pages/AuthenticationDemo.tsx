import { useEffect } from "react";
import { AuthDemoSteps } from "@/components/landing/AuthDemoSteps";

const AuthenticationDemo = () => {
  useEffect(() => {
    document.title = "Authentication Demo | Nuacha";
    // Canonical tag
    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", `${window.location.origin}/authentication-demo`);
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <main>
      <header className="py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-playfair tracking-tight">Authentication Demo</h1>
          <p className="text-muted-foreground mt-2">Experience our secure and user-friendly authentication system</p>
        </div>
      </header>
      <AuthDemoSteps />
    </main>
  );
};

export default AuthenticationDemo;

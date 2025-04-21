
import React from "react";

const AuthDemoHero = () => (
  <section className="py-20 px-4 md:px-6 lg:px-8 bg-background">
    <div className="max-w-6xl mx-auto space-y-8 text-center">
      {/* Hero Copy */}
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl font-playfair tracking-tight">
          Try Our Supabase Authentication Module
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience how Nuacha makes user management effortless with secure, production-ready login, signup, and password reset flows — all powered by Supabase.
        </p>
        <p className="text-md text-[#5A7684] font-medium">
          This interactive demo showcases Nuacha’s complete authentication system. From email verification to password recovery, you’ll see exactly how our reusable login module can be integrated into your app or sold as a SaaS-ready product.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs font-medium text-muted-foreground mt-2">
          <span className="px-2 py-1 rounded-full bg-soft-green/40">🔒 Secure by default</span>
          <span className="px-2 py-1 rounded-full bg-accent/30">⚙️ Fully configurable</span>
          <span className="px-2 py-1 rounded-full bg-blush/30">💡 Built with devs & end-users in mind</span>
        </div>
        <p className="text-sm text-muted-foreground mt-6 italic">
          ⚠️ This demo uses test credentials and sandboxed data. No real user accounts are created.
        </p>
      </div>
    </div>
  </section>
);

export default AuthDemoHero;

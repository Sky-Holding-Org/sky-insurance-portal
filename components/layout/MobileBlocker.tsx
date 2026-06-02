import { MonitorX } from "lucide-react";

export function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-100 bg-background flex flex-col items-center justify-center p-6 text-center md:hidden">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-6">
        <MonitorX className="w-8 h-8 text-teal-500" />
      </div>
      <h2 className="text-2xl font-syne font-bold text-foreground mb-3">
        Desktop Experience Only
      </h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
        Sky Insurance portal is strictly optimized for desktop screens. Please
        open this application on a computer or a larger device to access its
        full capabilities.
      </p>
    </div>
  );
}

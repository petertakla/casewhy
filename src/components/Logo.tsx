export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <img src="/brand/mark.svg" alt="" className="h-7 w-7 rounded-lg" />
      <span>
        Case<span style={{ color: "#1baf7a" }}>Why</span>
      </span>
    </span>
  );
}

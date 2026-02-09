import { useMemo } from "react";

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    if (s <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (s <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (s <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (s <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
    return { score: 5, label: "Very Strong", color: "bg-emerald-400" };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-secondary/60"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right">{label}</p>
    </div>
  );
};

export default PasswordStrengthMeter;

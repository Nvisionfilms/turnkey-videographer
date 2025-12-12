import React, { useEffect, useMemo, useState } from "react";
import { Globe } from "lucide-react";

export default function LiveUpdatesTicker({ items, intervalMs = 3500 }) {
  const namePool = useMemo(
    () => [
      "Mike",
      "Sarah",
      "Jamal",
      "Chris",
      "Alex",
      "Taylor",
      "Jordan",
      "Sam",
      "Drew",
      "Casey",
      "Morgan",
      "Avery",
      "Riley",
      "Cameron",
      "Hayden"
    ],
    []
  );

  const brandPool = useMemo(
    () => [
      "Blackwood Media",
      "Ridgeway Creative",
      "Northstar Films",
      "Canyon Studio",
      "Golden Hour Co.",
      "Sunset Collective",
      "Peak Video",
      "Silverline Media",
      "Brick & Beam",
      "Lighthouse Creative"
    ],
    []
  );

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[randomInt(0, arr.length - 1)];

  const generateRandomItem = () => {
    const useBrand = Math.random() < 0.35;

    if (useBrand) {
      return {
        name: pick(brandPool),
        organization: "",
        amount: randomInt(650, 8500)
      };
    }

    const first = pick(namePool);
    const lastInitial = String.fromCharCode(65 + randomInt(0, 25));

    return {
      name: `${first} ${lastInitial}.`,
      organization: "",
      amount: randomInt(650, 8500)
    };
  };

  const data = items && items.length > 0 ? items : null;
  const [index, setIndex] = useState(0);
  const [randomItem, setRandomItem] = useState(() => generateRandomItem());

  useEffect(() => {
    const timer = setInterval(() => {
      if (data && data.length > 0) {
        setIndex((prev) => (prev + 1) % data.length);
      } else {
        setRandomItem(generateRandomItem());
        setIndex((prev) => prev + 1);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [data, intervalMs]);

  const current = data && data.length > 0 ? data[index] : randomItem;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(current.amount || 0);

  const labelName = current.organization
    ? `${current.name} (${current.organization})`
    : current.name;

  return (
    <div
      className="w-full"
      style={{
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)"
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Globe className="w-4 h-4" style={{ color: "var(--color-accent-primary)" }} />
            <span>Live around the world</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <div
              key={index}
              className="whitespace-nowrap text-sm md:text-base"
              style={{
                color: "var(--color-text-primary)",
                animation: "nvision-fade-slide 350ms ease-out"
              }}
            >
              <span className="font-semibold">{labelName}</span>
              <span style={{ color: "var(--color-text-secondary)" }}> just closed a </span>
              <span className="font-semibold" style={{ color: "var(--color-accent-primary)" }}>
                {money}
              </span>
              <span style={{ color: "var(--color-text-secondary)" }}> quote</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nvision-fade-slide {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

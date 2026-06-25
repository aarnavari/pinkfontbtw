"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Block =
  | {
      id: string;
      type: "text";
      content: string;
    }
  | {
      id: string;
      type: "link";
      url: string;
    }
  | {
      id: string;
      type: "image";
      src: string;
    };

type StarredItem = {
  id: string;
  name: string;
  date: string;
  block: Block;
};

function formatDateForDisplay(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${day}.${month}.${year}`;
}

function formatIndexNumber(index: number) {
  return `(${String(index + 1).padStart(3, "0")})`;
}

export default function StarsPage() {
  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);

  useEffect(() => {
    const savedStars = localStorage.getItem("pinkfontbtw-stars");

    if (savedStars) {
      try {
        const parsedStars = JSON.parse(savedStars);

        if (Array.isArray(parsedStars)) {
          setStarredItems(parsedStars);
        }
      } catch {
        setStarredItems([]);
      }
    }
  }, []);

  const indexLabels = useMemo(() => {
    const grouped = starredItems.reduce<Record<string, StarredItem[]>>(
      (acc, item) => {
        const label = item.name.trim();

        if (!label) return acc;

        if (!acc[label]) {
          acc[label] = [];
        }

        acc[label].push(item);
        return acc;
      },
      {}
    );

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [starredItems]);

  return (
    <main className="notebook-page min-h-screen w-full py-6 text-[#171412]">
      <div className="subtext-shell flex min-h-screen flex-col pb-24 pt-[3.875rem]">
        <header className="grid grid-cols-[1fr_auto] items-start">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b86174]/65 transition hover:opacity-65"
          >
            ← daily field sheet
          </Link>

          <div className="text-right">
            <p className="font-title text-[28px] leading-none tracking-[-0.04em] text-[#b86174]">
              Subtext
            </p>

            <p className="font-mono mt-3 text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55">
              local index
            </p>
          </div>
        </header>

        <section className="mt-[3.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
          <div />

          <div className="w-full max-w-[780px]">
            <h1 className="font-title text-[86px] leading-none tracking-[-0.045em] text-[#171412] md:text-[112px]">
              index
            </h1>

            <p className="font-mono mt-5 max-w-[620px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/55">
              stored fragments from daily field sheets, organised by label
            </p>
          </div>
        </section>

        {indexLabels.length === 0 ? (
          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] grid-cols-[96px_1fr] gap-x-7 border border-black/12 bg-[#fbf8f4]/45 px-6 py-6">
              <div className="font-mono pt-[0.12rem] text-[11px] tracking-[0.12em] text-[#b86174]/55">
                (000)
              </div>

              <p className="font-mono max-w-[520px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/45">
                no indexed thoughts yet. return to the daily field sheet and
                use [index thought] on any fragment you want to keep.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] gap-[1.9375rem]">
              {indexLabels.map(([label, items], index) => {
                const latestItem = items[0];

                return (
                  <Link
                    key={label}
                    href={`/stars/folder?name=${encodeURIComponent(label)}`}
                    className="group grid min-h-[124px] grid-cols-[96px_1fr] gap-x-7 border border-black/12 bg-[#fbf8f4]/45 px-6 py-6 transition hover:border-[#b86174]/45 hover:bg-[#efc8d3]/20"
                  >
                    <div className="font-mono pt-[0.12rem] text-[11px] tracking-[0.12em] text-[#b86174]/55">
                      {formatIndexNumber(index)}
                    </div>

                    <div>
                      <h2 className="font-mono text-[13px] uppercase tracking-[0.22em] text-[#171412] transition group-hover:text-[#b86174]">
                        {label}
                      </h2>

                      <p className="font-mono mt-4 text-[11px] lowercase tracking-[0.12em] text-[#b86174]/55">
                        {items.length}{" "}
                        {items.length === 1 ? "fragment" : "fragments"}
                      </p>

                      <p className="font-mono mt-2 text-[11px] lowercase tracking-[0.12em] text-[#b86174]/45">
                        last indexed {formatDateForDisplay(latestItem.date)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
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

  const starFolders = useMemo(() => {
    const grouped = starredItems.reduce<Record<string, StarredItem[]>>(
      (acc, item) => {
        const folder = item.name.trim();

        if (!acc[folder]) {
          acc[folder] = [];
        }

        acc[folder].push(item);
        return acc;
      },
      {}
    );

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [starredItems]);

  return (
    <main className="notebook-page min-h-screen w-full px-6 py-10 text-[#171412] md:px-10">
      <div className="mx-auto max-w-5xl pb-24">
        <header className="mb-[4.65rem] flex items-center justify-between">
          <Link
            href="/"
            className="text-lg tracking-[-0.02em] text-[#b86174] transition hover:opacity-65 md:text-xl"
          >
            ← field notes
          </Link>

          <h1 className="text-lg font-bold italic tracking-[-0.02em] text-[#b86174] md:text-xl">
            ✦ star folders
          </h1>
        </header>

        {starFolders.length === 0 ? (
          <p className="mx-auto max-w-[780px] text-lg leading-relaxed text-[#171412]/45 md:text-xl">
            no star folders yet
          </p>
        ) : (
          <div className="mx-auto grid max-w-[780px] gap-[3.72rem]">
            {starFolders.map(([folder, items]) => {
              const latestItem = items[0];

              return (
                <Link
                  key={folder}
                  href={`/stars/${encodeURIComponent(folder)}`}
                  className="group block border-t border-black/10 pt-5 transition hover:opacity-75"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-lg font-bold italic tracking-[-0.02em] text-[#b86174] md:text-xl">
                        ✦ {folder}
                      </h2>

                      <p className="mt-2 text-sm text-[#171412]/45">
                        {items.length}{" "}
                        {items.length === 1 ? "fragment" : "fragments"}
                      </p>
                    </div>

                    <p className="text-sm text-[#171412]/45">
                      {formatDateForDisplay(latestItem.date)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
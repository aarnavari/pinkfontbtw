"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

function getLinkHost(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFragmentType(block: Block) {
  if (block.type === "text") return "text fragment";
  if (block.type === "link") return "link fragment";
  return "image fragment";
}

function StarFolderContent() {
  const searchParams = useSearchParams();
  const label = searchParams.get("name") || "";

  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);

  useEffect(() => {
    const savedStars = localStorage.getItem("pinkfontbtw-stars");

    if (!savedStars) return;

    try {
      const parsedStars = JSON.parse(savedStars);

      if (Array.isArray(parsedStars)) {
        setStarredItems(parsedStars);
      }
    } catch {
      setStarredItems([]);
    }
  }, []);

  const labelItems = starredItems.filter((item) => item.name.trim() === label);

  function deleteStar(starId: string) {
    const updatedStars = starredItems.filter((star) => star.id !== starId);

    setStarredItems(updatedStars);
    localStorage.setItem("pinkfontbtw-stars", JSON.stringify(updatedStars));
  }

  return (
    <main className="notebook-page min-h-screen w-full py-6 text-[#171412]">
      <div className="subtext-shell flex min-h-screen flex-col pb-24 pt-[3.875rem]">
        <header className="grid grid-cols-[1fr_auto] items-start">
          <Link
            href="/stars"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b86174]/65 transition hover:opacity-65"
          >
            ← index
          </Link>

          <div className="text-right">
            <p className="font-title text-[28px] leading-none tracking-[-0.04em] text-[#b86174]">
              Subtext
            </p>

            <p className="font-mono mt-3 text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55">
              local label
            </p>
          </div>
        </header>

        <section className="mt-[3.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
          <div />

          <div className="w-full max-w-[780px]">
            <h1 className="font-title text-[86px] lowercase leading-none tracking-[-0.045em] text-[#171412] md:text-[112px]">
              {label || "label"}
            </h1>

            <p className="font-mono mt-5 max-w-[620px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/55">
              indexed fragments from daily field sheets
            </p>
          </div>
        </section>

        {!label ? (
          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] grid-cols-[96px_1fr] gap-x-7 border border-black/12 bg-[#fbf8f4]/45 px-6 py-6">
              <div className="font-mono pt-[0.12rem] text-[11px] tracking-[0.12em] text-[#b86174]/55">
                (000)
              </div>

              <p className="font-mono max-w-[520px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/45">
                no index label selected.
              </p>
            </div>
          </section>
        ) : labelItems.length === 0 ? (
          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] grid-cols-[96px_1fr] gap-x-7 border border-black/12 bg-[#fbf8f4]/45 px-6 py-6">
              <div className="font-mono pt-[0.12rem] text-[11px] tracking-[0.12em] text-[#b86174]/55">
                (000)
              </div>

              <p className="font-mono max-w-[520px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/45">
                no fragments inside this label yet.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] gap-[1.9375rem]">
              {labelItems.map((star, index) => (
                <article
                  key={star.id}
                  className="grid min-h-[124px] grid-cols-[96px_1fr_96px] gap-x-7 border border-black/12 bg-[#fbf8f4]/45 px-6 py-6"
                >
                  <div className="font-mono pt-[0.12rem] text-[11px] tracking-[0.12em] text-[#b86174]/55">
                    {formatIndexNumber(index)}
                  </div>

                  <div>
                    <div className="font-mono flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-[#b86174]/50">
                      <span>{formatDateForDisplay(star.date)}</span>
                      <span>{getFragmentType(star.block)}</span>
                    </div>

                    {star.block.type === "text" && (
                      <p className="mt-6 whitespace-pre-wrap text-[19px] leading-[31px] tracking-[-0.01em] text-[#171412] md:text-[21px]">
                        {star.block.content}
                      </p>
                    )}

                    {star.block.type === "link" && (
                      <a
                        href={star.block.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono mt-6 block text-[12px] uppercase tracking-[0.14em] text-[#171412] underline-offset-4 transition hover:text-[#b86174] hover:underline"
                      >
                        {getLinkHost(star.block.url) || star.block.url}
                      </a>
                    )}

                    {star.block.type === "image" && (
                      <div className="mt-6 border border-black/12 bg-[#fbf8f4]/55 p-3">
                        <img
                          src={star.block.src}
                          alt={label}
                          className="max-h-[520px] w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="font-mono flex justify-end pt-[0.12rem]">
                    <button
                      onClick={() => deleteStar(star.id)}
                      className="text-[10px] uppercase tracking-[0.14em] text-[#b86174]/45 transition hover:text-[#b86174]"
                    >
                      [remove]
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function StarFolderPage() {
  return (
    <Suspense fallback={null}>
      <StarFolderContent />
    </Suspense>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

function getLinkHost(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function StarFolderPage() {
  const params = useParams();
  const folder = decodeURIComponent(String(params.category || ""));

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

  const folderItems = starredItems.filter(
    (item) => item.name.trim() === folder
  );

  function deleteStar(starId: string) {
    const updatedStars = starredItems.filter((star) => star.id !== starId);

    setStarredItems(updatedStars);
    localStorage.setItem("pinkfontbtw-stars", JSON.stringify(updatedStars));
  }

  return (
    <main className="notebook-page min-h-screen w-full px-6 py-10 text-[#171412] md:px-10">
      <div className="mx-auto max-w-5xl pb-24">
        <header className="mb-[4.65rem] flex items-center justify-between">
          <Link
            href="/stars"
            className="text-lg tracking-[-0.02em] text-[#b86174] transition hover:opacity-65 md:text-xl"
          >
            ← star folders
          </Link>

          <h1 className="text-lg font-bold italic tracking-[-0.02em] text-[#b86174] md:text-xl">
            ✦ {folder}
          </h1>
        </header>

        {folderItems.length === 0 ? (
          <p className="mx-auto max-w-[780px] text-lg leading-relaxed text-[#171412]/45 md:text-xl">
            nothing here yet
          </p>
        ) : (
          <div className="mx-auto grid max-w-[780px] gap-[3.72rem]">
            {folderItems.map((star) => (
              <article
                key={star.id}
                className="group relative border-t border-black/10 pt-5"
              >
                <div className="mb-[1.9rem] flex items-start justify-between gap-4">
                  <p className="text-sm text-[#171412]/45">
                    {formatDateForDisplay(star.date)}
                  </p>

                  <button
                    onClick={() => deleteStar(star.id)}
                    className="text-sm text-[#b86174]/60 hover:text-[#b86174]"
                  >
                    remove
                  </button>
                </div>

                {star.block.type === "text" && (
                  <p className="whitespace-pre-wrap text-lg leading-relaxed tracking-[-0.01em] text-[#171412] md:text-xl">
                    {star.block.content}
                  </p>
                )}

                {star.block.type === "link" && (
                  <a
                    href={star.block.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-sm bg-[#edc3cf]/75 px-4 py-3 text-center text-lg text-[#171412] hover:opacity-75 md:text-xl"
                  >
                    {getLinkHost(star.block.url) || star.block.url}
                  </a>
                )}

                {star.block.type === "image" && (
                  <img
                    src={star.block.src}
                    alt={folder}
                    className="max-h-[520px] w-full object-contain"
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
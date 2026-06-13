"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
    }
  | {
      id: string;
      type: "divider";
    };

type StarableBlock = Exclude<Block, { type: "divider" }>;

type DayEntry = {
  blocks: Block[];
};

type StarredItem = {
  id: string;
  name: string;
  date: string;
  block: StarableBlock;
};

const emptyEntry: DayEntry = {
  blocks: [{ id: "first-block", type: "text", content: "" }],
};

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

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

function createEmptyEntry(): DayEntry {
  return {
    blocks: [{ id: crypto.randomUUID(), type: "text", content: "" }],
  };
}

function normalizeEntry(parsedEntry: any): DayEntry {
  if (parsedEntry && parsedEntry.blocks && Array.isArray(parsedEntry.blocks)) {
    return {
      blocks:
        parsedEntry.blocks.length > 0
          ? parsedEntry.blocks
          : [{ id: crypto.randomUUID(), type: "text", content: "" }],
    };
  }

  const convertedBlocks: Block[] = [];

  if (parsedEntry?.note) {
    convertedBlocks.push({
      id: crypto.randomUUID(),
      type: "text",
      content: parsedEntry.note,
    });
  }

  if (parsedEntry?.linkUrl) {
    convertedBlocks.push({
      id: crypto.randomUUID(),
      type: "link",
      url: parsedEntry.linkUrl,
    });
  }

  if (parsedEntry?.images && Array.isArray(parsedEntry.images)) {
    parsedEntry.images.forEach((image: { src?: string }) => {
      if (image.src) {
        convertedBlocks.push({
          id: crypto.randomUUID(),
          type: "image",
          src: image.src,
        });
      }
    });
  }

  if (convertedBlocks.length === 0) {
    convertedBlocks.push({
      id: crypto.randomUUID(),
      type: "text",
      content: "",
    });
  }

  return {
    blocks: convertedBlocks,
  };
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [savedDates, setSavedDates] = useState<string[]>([getTodayKey()]);
  const [entry, setEntry] = useState<DayEntry>(emptyEntry);
  const [slashBlockId, setSlashBlockId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
  const [starModalOpen, setStarModalOpen] = useState(false);
  const [starDraftName, setStarDraftName] = useState("");
  const [selectedStarCategory, setSelectedStarCategory] = useState("");
  const [starDraftBlock, setStarDraftBlock] = useState<StarableBlock | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInsertAfterBlockId = useRef<string | null>(null);
  const starInputRef = useRef<HTMLInputElement | null>(null);

  const existingStarCategories = useMemo(() => {
    const categories = starredItems
      .map((item) => item.name.trim())
      .filter(Boolean);

    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  }, [starredItems]);

  useEffect(() => {
    const allDates = localStorage.getItem("pinkfontbtw-dates");
    const savedStars = localStorage.getItem("pinkfontbtw-stars");

    if (allDates) {
      try {
        const parsedDates = JSON.parse(allDates);

        if (Array.isArray(parsedDates)) {
          const datesWithToday = Array.from(
            new Set([...parsedDates, getTodayKey()])
          ) as string[];

          setSavedDates(datesWithToday.sort().reverse());
        }
      } catch {
        setSavedDates([getTodayKey()]);
      }
    }

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

  useEffect(() => {
    const savedEntry = localStorage.getItem(`pinkfontbtw-entry-${selectedDate}`);

    if (savedEntry) {
      try {
        const parsedEntry = JSON.parse(savedEntry);
        setEntry(normalizeEntry(parsedEntry));
      } catch {
        setEntry(createEmptyEntry());
      }
    } else {
      setEntry(createEmptyEntry());
    }

    setSlashBlockId(null);
    setDateMenuOpen(false);
  }, [selectedDate]);

  useEffect(() => {
    if (starModalOpen) {
      setTimeout(() => {
        starInputRef.current?.focus();
      }, 30);
    }
  }, [starModalOpen]);

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function createDividerFromTextBlock(
    blockId: string,
    beforeContent = "",
    afterContent = ""
  ) {
    setEntry((currentEntry) => {
      const newBlocks: Block[] = [];

      currentEntry.blocks.forEach((block) => {
        if (block.id === blockId && block.type === "text") {
          if (beforeContent.trim()) {
            newBlocks.push({
              ...block,
              content: beforeContent.trimEnd(),
            });
          }

          newBlocks.push({
            id: crypto.randomUUID(),
            type: "divider",
          });

          newBlocks.push({
            id: crypto.randomUUID(),
            type: "text",
            content: afterContent.trimStart(),
          });
        } else {
          newBlocks.push(block);
        }
      });

      return {
        ...currentEntry,
        blocks: newBlocks,
      };
    });

    setSlashBlockId(null);
  }

  function updateTextBlock(id: string, content: string) {
    setEntry((currentEntry) => ({
      ...currentEntry,
      blocks: currentEntry.blocks.map((block) =>
        block.id === id && block.type === "text"
          ? { ...block, content }
          : block
      ),
    }));

    if (content.endsWith("/")) {
      setSlashBlockId(id);
    } else {
      setSlashBlockId(null);
    }
  }

  function insertBlockAfter(blockId: string, newBlock: Block) {
    setEntry((currentEntry) => {
      const blockIndex = currentEntry.blocks.findIndex(
        (block) => block.id === blockId
      );

      const newBlocks = [...currentEntry.blocks];

      if (blockIndex === -1) {
        newBlocks.push(newBlock);
      } else {
        newBlocks.splice(blockIndex + 1, 0, newBlock);
      }

      return {
        ...currentEntry,
        blocks: newBlocks,
      };
    });

    setSlashBlockId(null);
  }

  function insertImageAfterLastBlock(imageSrc: string) {
    const lastBlock = entry.blocks[entry.blocks.length - 1];

    if (!lastBlock) {
      setEntry({
        blocks: [
          {
            id: crypto.randomUUID(),
            type: "image",
            src: imageSrc,
          },
        ],
      });

      return;
    }

    insertBlockAfter(lastBlock.id, {
      id: crypto.randomUUID(),
      type: "image",
      src: imageSrc,
    });
  }

  function removeSlashFromBlock(blockId: string) {
    setEntry((currentEntry) => ({
      ...currentEntry,
      blocks: currentEntry.blocks.map((block) => {
        if (block.id === blockId && block.type === "text") {
          return {
            ...block,
            content: block.content.replace(/\/$/, ""),
          };
        }

        return block;
      }),
    }));
  }

  function chooseText(blockId: string) {
    removeSlashFromBlock(blockId);
    insertBlockAfter(blockId, {
      id: crypto.randomUUID(),
      type: "text",
      content: "",
    });
  }

  function chooseLink(blockId: string) {
    removeSlashFromBlock(blockId);
    insertBlockAfter(blockId, {
      id: crypto.randomUUID(),
      type: "link",
      url: "",
    });
  }

  function chooseImage(blockId: string) {
    removeSlashFromBlock(blockId);
    imageInsertAfterBlockId.current = blockId;
    fileInputRef.current?.click();
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const blockId = imageInsertAfterBlockId.current;

    if (!file || !blockId) return;

    const reader = new FileReader();

    reader.onload = () => {
      insertBlockAfter(blockId, {
        id: crypto.randomUUID(),
        type: "image",
        src: reader.result as string,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const items = event.clipboardData.items;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
          insertImageAfterLastBlock(reader.result as string);
        };

        reader.readAsDataURL(file);
        event.preventDefault();
        return;
      }
    }
  }

  function updateLinkBlock(id: string, url: string) {
    setEntry((currentEntry) => ({
      ...currentEntry,
      blocks: currentEntry.blocks.map((block) =>
        block.id === id && block.type === "link" ? { ...block, url } : block
      ),
    }));
  }

  function deleteBlock(id: string) {
    setEntry((currentEntry) => {
      const remainingBlocks = currentEntry.blocks.filter(
        (block) => block.id !== id
      );

      return {
        ...currentEntry,
        blocks:
          remainingBlocks.length > 0
            ? remainingBlocks
            : [{ id: crypto.randomUUID(), type: "text", content: "" }],
      };
    });
  }

  function openStarModal(block: Block) {
    if (block.type === "divider") return;

    setStarDraftBlock(block);
    setStarDraftName("");
    setSelectedStarCategory(existingStarCategories[0] || "");
    setStarModalOpen(true);
  }

  function closeStarModal() {
    setStarModalOpen(false);
    setStarDraftBlock(null);
    setStarDraftName("");
    setSelectedStarCategory("");
  }

  function saveStar() {
    if (!starDraftBlock) return;

    const folderName = (
      starDraftName.trim() || selectedStarCategory.trim()
    ).trim();

    if (!folderName) return;

    const newStar: StarredItem = {
      id: crypto.randomUUID(),
      name: folderName,
      date: selectedDate,
      block: starDraftBlock,
    };

    const updatedStars = [newStar, ...starredItems];

    setStarredItems(updatedStars);
    localStorage.setItem("pinkfontbtw-stars", JSON.stringify(updatedStars));

    setSavedMessage(`added to ${folderName}`);
    setTimeout(() => setSavedMessage(""), 1200);

    closeStarModal();
  }

  function handleSave() {
    const updatedDates = Array.from(new Set([selectedDate, ...savedDates]))
      .sort()
      .reverse();

    localStorage.setItem(
      `pinkfontbtw-entry-${selectedDate}`,
      JSON.stringify(entry)
    );
    localStorage.setItem("pinkfontbtw-dates", JSON.stringify(updatedDates));

    setSavedDates(updatedDates);
    setSavedMessage("saved");
    setTimeout(() => setSavedMessage(""), 1200);
  }

  return (
    <main className="notebook-page min-h-screen w-full px-6 py-6 text-[#171412] md:px-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <section className="min-h-screen w-full" onPaste={handlePaste}>
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col pb-24 pt-[2.75rem]">
          <header className="flex items-center justify-center">
            <div className="relative">
              <button
                onClick={() => setDateMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-[#b86174] transition hover:opacity-75 md:text-xl"
              >
                <span>{formatDateForDisplay(selectedDate)}</span>
                <span className="translate-y-[1px] text-xs">⌄</span>
              </button>

              {dateMenuOpen && (
                <div className="date-menu absolute left-1/2 top-full z-30 mt-3 w-56 -translate-x-1/2 rounded-md border border-black/8 bg-[#faf7f2] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  {savedDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`block w-full rounded-sm px-3 py-2 text-center text-sm tracking-[-0.02em] transition ${
                        selectedDate === date
                          ? "bg-[#efd4db] text-[#171412]"
                          : "text-[#b86174] hover:bg-[#f4e7ea]"
                      }`}
                    >
                      {formatDateForDisplay(date)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          <h1 className="mt-[3.72rem] text-center text-lg font-bold italic tracking-[-0.02em] text-[#b86174] md:text-xl">
            today&apos;s field notes
          </h1>

          <div className="mx-auto mt-[4.65rem] w-full max-w-[780px] space-y-[3.72rem]">
            {entry.blocks.map((block) => (
              <div key={block.id} className="group relative">
                {block.type === "text" && (
                  <>
                    <textarea
                      value={block.content}
                      onChange={(event) => {
                        updateTextBlock(block.id, event.target.value);
                        resizeTextarea(event.target);
                      }}
                      onInput={(event) => {
                        resizeTextarea(event.currentTarget);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.shiftKey) return;

                        const textarea = event.currentTarget;
                        const cursorPosition = textarea.selectionStart;
                        const fullText = block.content;

                        const textBeforeCursor = fullText.slice(
                          0,
                          cursorPosition
                        );
                        const textAfterCursor = fullText.slice(cursorPosition);

                        const currentLineStart =
                          textBeforeCursor.lastIndexOf("\n") + 1;
                        const currentLine =
                          textBeforeCursor.slice(currentLineStart);

                        if (currentLine.trim() === "---") {
                          event.preventDefault();

                          const contentBeforeDivider =
                            fullText.slice(0, currentLineStart);
                          const contentAfterDivider = textAfterCursor.replace(
                            /^\n/,
                            ""
                          );

                          createDividerFromTextBlock(
                            block.id,
                            contentBeforeDivider,
                            contentAfterDivider
                          );
                        }
                      }}
                      placeholder="type / for options..."
                      className="block min-h-[62px] w-full resize-none overflow-hidden bg-transparent text-lg leading-relaxed tracking-[-0.01em] text-[#171412] outline-none placeholder:text-[#171412]/30 md:text-xl"
                    />

                    {slashBlockId === block.id && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-md border border-black/8 bg-[#faf7f2] p-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => chooseText(block.id)}
                          className="block w-full rounded-sm px-3 py-2 text-left text-[#171412] hover:bg-[#f4e7ea]"
                        >
                          text
                        </button>

                        <button
                          onClick={() => chooseLink(block.id)}
                          className="block w-full rounded-sm px-3 py-2 text-left text-[#171412] hover:bg-[#f4e7ea]"
                        >
                          embed link
                        </button>

                        <button
                          onClick={() => chooseImage(block.id)}
                          className="block w-full rounded-sm px-3 py-2 text-left text-[#171412] hover:bg-[#f4e7ea]"
                        >
                          paste picture
                        </button>
                      </div>
                    )}
                  </>
                )}

                {block.type === "divider" && (
                  <div className="py-[1.65rem]">
                    <div className="h-px w-full bg-[#b86174]/25" />
                  </div>
                )}

                {block.type === "link" && (
                  <div className="rounded-sm bg-[#edc3cf]/75 px-4 py-3">
                    <input
                      value={block.url}
                      onChange={(event) =>
                        updateLinkBlock(block.id, event.target.value)
                      }
                      placeholder="paste link..."
                      className="w-full bg-transparent text-center text-lg tracking-[-0.01em] text-[#171412] outline-none placeholder:text-[#171412]/45 md:text-xl"
                    />

                    {block.url && (
                      <a
                        href={block.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-center text-sm text-[#171412]/55 underline-offset-4 hover:underline"
                      >
                        {getLinkHost(block.url)}
                      </a>
                    )}
                  </div>
                )}

                {block.type === "image" && (
                  <img
                    src={block.src}
                    alt="daily visual"
                    className="max-h-[520px] w-full object-contain"
                  />
                )}

                <div className="absolute -right-12 top-0 hidden items-center gap-2 group-hover:flex">
                  {block.type !== "divider" && (
                    <button
                      onClick={() => openStarModal(block)}
                      className="text-lg text-[#b86174] transition hover:scale-110 hover:opacity-70"
                      title="add to star folder"
                    >
                      ✦
                    </button>
                  )}

                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="rounded-sm bg-[#f3d8df] px-2 py-1 text-[11px] text-[#8f5561] hover:bg-[#eec8d2]"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-6 left-6 flex items-center gap-2 md:bottom-8 md:left-8">
          <Link
            href="/stars"
            className="text-lg tracking-[-0.02em] text-[#b86174] transition hover:opacity-65 md:text-xl"
          >
            ✦ star folders
          </Link>

          {starredItems.length > 0 && (
            <span className="text-sm text-[#b86174]/60">
              {starredItems.length}
            </span>
          )}
        </div>

        <div className="fixed bottom-6 right-6 flex items-center gap-3 md:bottom-8 md:right-8">
          {savedMessage && (
            <p className="text-xs tracking-[-0.03em] text-[#b86174]/70 md:text-sm">
              {savedMessage}
            </p>
          )}

          <button
            onClick={handleSave}
            className="text-lg tracking-[-0.02em] text-[#b86174] transition hover:opacity-65 md:text-xl"
          >
            save
          </button>
        </div>

        {starModalOpen && (
          <div className="fixed inset-0 z-40 bg-[#fbf8f4]/55">
            <div className="notebook-page flex min-h-screen items-start justify-center px-6 pt-32">
              <div className="w-full max-w-md rounded-[26px] border border-[#e8d8dc] bg-[rgba(251,248,244,0.92)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                <p className="text-center text-2xl text-[#b86174]">✦</p>

                <h2 className="mt-3 text-center text-lg font-bold italic tracking-[-0.02em] text-[#b86174]">
                  add to star folder
                </h2>

                {existingStarCategories.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-center text-sm text-[#171412]/45">
                      choose folder
                    </p>

                    <select
                      value={selectedStarCategory}
                      onChange={(event) =>
                        setSelectedStarCategory(event.target.value)
                      }
                      className="w-full rounded-full border border-[#ead9dd] bg-white/70 px-5 py-3 text-center text-base text-[#171412] outline-none"
                    >
                      {existingStarCategories.map((category) => (
                        <option key={category} value={category}>
                          ✦ {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-5">
                  <p className="mb-2 text-center text-sm text-[#171412]/45">
                    or create new folder
                  </p>

                  <input
                    ref={starInputRef}
                    value={starDraftName}
                    onChange={(event) => setStarDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveStar();
                      if (event.key === "Escape") closeStarModal();
                    }}
                    placeholder="branding"
                    className="w-full rounded-full border border-[#ead9dd] bg-white/70 px-5 py-3 text-center text-base text-[#171412] outline-none placeholder:text-[#171412]/35"
                  />
                </div>

                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={closeStarModal}
                    className="rounded-full border border-[#ead9dd] px-4 py-2 text-sm text-[#b86174] transition hover:bg-[#f7eef1]"
                  >
                    cancel
                  </button>

                  <button
                    onClick={saveStar}
                    className="rounded-full bg-[#efc8d3] px-4 py-2 text-sm text-[#8f5561] transition hover:opacity-80"
                  >
                    add to folder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
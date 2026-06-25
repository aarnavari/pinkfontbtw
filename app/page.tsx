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

  const entryRef = useRef(entry);
  const selectedDateRef = useRef(selectedDate);
  const savedDatesRef = useRef(savedDates);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingStarCategories = useMemo(() => {
    const categories = starredItems
      .map((item) => item.name.trim())
      .filter(Boolean);

    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  }, [starredItems]);

  function showSavedMessage(message: string) {
    setSavedMessage(message);

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      setSavedMessage("");
    }, 1200);
  }

  function persistEntry(
    dateToSave = selectedDateRef.current,
    entryToSave = entryRef.current,
    shouldShowMessage = false
  ) {
    const updatedDates = Array.from(
      new Set([dateToSave, ...savedDatesRef.current])
    )
      .sort()
      .reverse();

    localStorage.setItem(
      `pinkfontbtw-entry-${dateToSave}`,
      JSON.stringify(entryToSave)
    );

    localStorage.setItem("pinkfontbtw-dates", JSON.stringify(updatedDates));

    entryRef.current = entryToSave;
    selectedDateRef.current = dateToSave;
    savedDatesRef.current = updatedDates;

    setSavedDates(updatedDates);

    if (shouldShowMessage) {
      showSavedMessage("saved locally");
    }
  }

  function updateEntryAndPersist(
    updater: DayEntry | ((currentEntry: DayEntry) => DayEntry)
  ) {
    setEntry((currentEntry) => {
      const nextEntry =
        typeof updater === "function" ? updater(currentEntry) : updater;

      entryRef.current = nextEntry;
      persistEntry(selectedDateRef.current, nextEntry, false);

      return nextEntry;
    });
  }

  function persistStars(nextStars: StarredItem[]) {
    setStarredItems(nextStars);
    localStorage.setItem("pinkfontbtw-stars", JSON.stringify(nextStars));
  }

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

          const sortedDates = datesWithToday.sort().reverse();

          savedDatesRef.current = sortedDates;
          setSavedDates(sortedDates);
        }
      } catch {
        savedDatesRef.current = [getTodayKey()];
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
    selectedDateRef.current = selectedDate;

    const savedEntry = localStorage.getItem(`pinkfontbtw-entry-${selectedDate}`);

    if (savedEntry) {
      try {
        const parsedEntry = JSON.parse(savedEntry);
        const normalizedEntry = normalizeEntry(parsedEntry);

        entryRef.current = normalizedEntry;
        setEntry(normalizedEntry);
      } catch {
        const newEntry = createEmptyEntry();

        entryRef.current = newEntry;
        setEntry(newEntry);
        persistEntry(selectedDate, newEntry, false);
      }
    } else {
      const newEntry = createEmptyEntry();

      entryRef.current = newEntry;
      setEntry(newEntry);
      persistEntry(selectedDate, newEntry, false);
    }

    setSlashBlockId(null);
    setDateMenuOpen(false);
  }, [selectedDate]);

  useEffect(() => {
    function saveBeforeQuit() {
      persistEntry(selectedDateRef.current, entryRef.current, false);
    }

    window.addEventListener("beforeunload", saveBeforeQuit);
    window.addEventListener("pagehide", saveBeforeQuit);
    document.addEventListener("visibilitychange", saveBeforeQuit);

    return () => {
      window.removeEventListener("beforeunload", saveBeforeQuit);
      window.removeEventListener("pagehide", saveBeforeQuit);
      document.removeEventListener("visibilitychange", saveBeforeQuit);
    };
  }, []);

  useEffect(() => {
    if (starModalOpen) {
      setTimeout(() => {
        starInputRef.current?.focus();
      }, 30);
    }
  }, [starModalOpen]);

  function selectDate(date: string) {
    persistEntry(selectedDateRef.current, entryRef.current, false);
    setSelectedDate(date);
  }

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function createDividerFromTextBlock(
    blockId: string,
    beforeContent = "",
    afterContent = ""
  ) {
    updateEntryAndPersist((currentEntry) => {
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
    updateEntryAndPersist((currentEntry) => ({
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
    updateEntryAndPersist((currentEntry) => {
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
    const lastBlock = entryRef.current.blocks[entryRef.current.blocks.length - 1];

    if (!lastBlock) {
      updateEntryAndPersist({
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
    updateEntryAndPersist((currentEntry) => ({
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
    updateEntryAndPersist((currentEntry) => ({
      ...currentEntry,
      blocks: currentEntry.blocks.map((block) =>
        block.id === id && block.type === "link" ? { ...block, url } : block
      ),
    }));
  }

  function deleteBlock(id: string) {
    updateEntryAndPersist((currentEntry) => {
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

    const labelName = (
      starDraftName.trim() || selectedStarCategory.trim()
    ).trim();

    if (!labelName) return;

    const newStar: StarredItem = {
      id: crypto.randomUUID(),
      name: labelName,
      date: selectedDate,
      block: starDraftBlock,
    };

    const updatedStars = [newStar, ...starredItems];

    persistStars(updatedStars);
    showSavedMessage(`indexed to ${labelName}`);

    closeStarModal();
  }

  function handleSave() {
    persistEntry(selectedDateRef.current, entryRef.current, true);
  }

  return (
    <main className="notebook-page min-h-screen w-full py-6 text-[#171412]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <section className="min-h-screen w-full" onPaste={handlePaste}>
        <div className="subtext-shell flex min-h-screen flex-col pb-24 pt-[3.875rem]">
          <header className="grid grid-cols-[1fr_auto] items-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55">
              local archive
            </p>

            <div className="text-right">
              <p className="font-title text-[28px] leading-none tracking-[-0.04em] text-[#b86174]">
                Subtext
              </p>

              <p className="font-mono mt-3 text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55">
                {savedMessage || "autosaves locally"}
              </p>
            </div>
          </header>

          <section className="mt-[3.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="relative w-full max-w-[780px]">
              <button
                onClick={() => setDateMenuOpen((open) => !open)}
                className="group inline-flex items-end gap-4 text-left"
              >
                <span className="font-title text-[72px] leading-none tracking-[-0.045em] text-[#171412] md:text-[96px]">
                  {formatDateForDisplay(selectedDate)}
                </span>

                <span className="font-mono mb-4 text-[13px] text-[#b86174]/65 transition group-hover:opacity-65">
                  ⌄
                </span>
              </button>

              {dateMenuOpen && (
                <div className="date-menu absolute left-0 top-full z-30 mt-5 w-64 border border-black/12 bg-[#fbf8f4] p-2">
                  {savedDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => selectDate(date)}
                      className={`font-mono block w-full px-3 py-3 text-left text-[11px] uppercase tracking-[0.14em] transition ${
                        selectedDate === date
                          ? "bg-[#efc8d3]/45 text-[#171412]"
                          : "text-[#b86174]/65 hover:bg-[#efc8d3]/25"
                      }`}
                    >
                      {formatDateForDisplay(date)}
                    </button>
                  ))}
                </div>
              )}

              <p className="font-mono mt-5 max-w-[620px] text-[11px] uppercase leading-relaxed tracking-[0.14em] text-[#b86174]/55">
                daily field sheet for loose thoughts, links, images and fragments
              </p>
            </div>
          </section>

          <section className="mt-[4.875rem] grid grid-cols-[144px_minmax(0,1fr)] gap-x-[72px]">
            <div />

            <div className="grid w-full max-w-[780px] gap-[3.1rem]">
              {entry.blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="group grid grid-cols-[72px_1fr_140px] gap-x-7"
                >
                  <div className="font-mono pt-[0.4rem] text-[11px] tracking-[0.12em] text-[#b86174]/45">
                    {block.type === "divider" ? "" : formatIndexNumber(index)}
                  </div>

                  <div className="min-w-0">
                    {block.type === "text" && (
                      <>
                        <textarea
                          value={block.content}
                          ref={(textarea) => {
                            if (textarea) resizeTextarea(textarea);
                          }}
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
                            const textAfterCursor =
                              fullText.slice(cursorPosition);

                            const currentLineStart =
                              textBeforeCursor.lastIndexOf("\n") + 1;
                            const currentLine =
                              textBeforeCursor.slice(currentLineStart);

                            if (currentLine.trim() === "---") {
                              event.preventDefault();

                              const contentBeforeDivider =
                                fullText.slice(0, currentLineStart);
                              const contentAfterDivider =
                                textAfterCursor.replace(/^\n/, "");

                              createDividerFromTextBlock(
                                block.id,
                                contentBeforeDivider,
                                contentAfterDivider
                              );
                            }
                          }}
                          placeholder="type / for options..."
                          className="font-body block min-h-[62px] w-full resize-none overflow-hidden bg-transparent text-[19px] leading-[31px] tracking-[-0.01em] text-[#171412] outline-none placeholder:text-[#171412]/28 md:text-[21px]"
                        />

                        {slashBlockId === block.id && (
                          <div className="date-menu absolute z-30 mt-2 w-48 border border-black/12 bg-[#fbf8f4] p-2">
                            <button
                              onClick={() => chooseText(block.id)}
                              className="font-mono block w-full px-3 py-2 text-left text-[11px] uppercase tracking-[0.14em] text-[#171412] hover:bg-[#efc8d3]/25"
                            >
                              text
                            </button>

                            <button
                              onClick={() => chooseLink(block.id)}
                              className="font-mono block w-full px-3 py-2 text-left text-[11px] uppercase tracking-[0.14em] text-[#171412] hover:bg-[#efc8d3]/25"
                            >
                              embed link
                            </button>

                            <button
                              onClick={() => chooseImage(block.id)}
                              className="font-mono block w-full px-3 py-2 text-left text-[11px] uppercase tracking-[0.14em] text-[#171412] hover:bg-[#efc8d3]/25"
                            >
                              paste picture
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {block.type === "divider" && (
                      <div className="py-[1.25rem]">
                        <div className="h-px w-full bg-[#b86174]/25" />
                      </div>
                    )}

                    {block.type === "link" && (
                      <div className="border border-black/12 bg-[#fbf8f4]/55 px-4 py-3">
                        <input
                          value={block.url}
                          onChange={(event) =>
                            updateLinkBlock(block.id, event.target.value)
                          }
                          placeholder="paste link..."
                          className="font-mono w-full bg-transparent text-[12px] uppercase tracking-[0.14em] text-[#171412] outline-none placeholder:text-[#171412]/35"
                        />

                        {block.url && (
                          <a
                            href={block.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono mt-3 block text-[11px] uppercase tracking-[0.14em] text-[#b86174]/65 underline-offset-4 hover:underline"
                          >
                            {getLinkHost(block.url)}
                          </a>
                        )}
                      </div>
                    )}

                    {block.type === "image" && (
                      <div className="border border-black/12 bg-[#fbf8f4]/55 p-3">
                        <img
                          src={block.src}
                          alt="daily visual"
                          className="max-h-[520px] w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="font-mono flex justify-end pt-[0.38rem] opacity-0 transition group-hover:opacity-100">
                    <div className="flex items-start gap-4">
                      {block.type !== "divider" && (
                        <button
                          onClick={() => openStarModal(block)}
                          className="text-right text-[10px] uppercase leading-[1.25] tracking-[0.14em] text-[#b86174]/45 transition hover:text-[#b86174]"
                          title="index thought"
                        >
                          [index
                          <br />
                          thought]
                        </button>
                      )}

                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="text-[10px] uppercase tracking-[0.14em] text-[#b86174]/35 transition hover:text-[#b86174]"
                      >
                        [x]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="subtext-fixed-left fixed bottom-8">
          <Link
            href="/stars"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b86174]/65 transition hover:opacity-65"
          >
            open index
            {starredItems.length > 0 ? ` / ${starredItems.length}` : ""}
          </Link>
        </div>

        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleSave}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55 transition hover:text-[#b86174]"
          >
            save now
          </button>
        </div>

        {starModalOpen && (
          <div className="fixed inset-0 z-40 bg-[#fbf8f4]/60 backdrop-blur-[2px]">
            <div className="flex min-h-screen items-start justify-center px-6 pt-32">
              <div className="w-full max-w-md border border-black/12 bg-[#fbf8f4] p-6">
                <p className="font-mono text-center text-[11px] uppercase tracking-[0.16em] text-[#b86174]/55">
                  index thought
                </p>

                <h2 className="font-title mt-4 text-center text-[42px] leading-none tracking-[-0.045em] text-[#171412]">
                  save fragment
                </h2>

                {existingStarCategories.length > 0 && (
                  <div className="mt-7">
                    <p className="font-mono mb-2 text-center text-[11px] uppercase tracking-[0.14em] text-[#b86174]/45">
                      choose label
                    </p>

                    <select
                      value={selectedStarCategory}
                      onChange={(event) =>
                        setSelectedStarCategory(event.target.value)
                      }
                      className="font-mono w-full border border-black/12 bg-[#fbf8f4] px-4 py-3 text-center text-[11px] uppercase tracking-[0.14em] text-[#171412] outline-none"
                    >
                      {existingStarCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-5">
                  <p className="font-mono mb-2 text-center text-[11px] uppercase tracking-[0.14em] text-[#b86174]/45">
                    or create new label
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
                    className="font-mono w-full border border-black/12 bg-[#fbf8f4] px-4 py-3 text-center text-[11px] uppercase tracking-[0.14em] text-[#171412] outline-none placeholder:text-[#171412]/35"
                  />
                </div>

                <div className="font-mono mt-6 flex items-center justify-center gap-5">
                  <button
                    onClick={closeStarModal}
                    className="text-[11px] uppercase tracking-[0.14em] text-[#b86174]/55 transition hover:text-[#b86174]"
                  >
                    cancel
                  </button>

                  <button
                    onClick={saveStar}
                    className="text-[11px] uppercase tracking-[0.14em] text-[#171412] transition hover:text-[#b86174]"
                  >
                    save to index
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
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { useClubData } from "../../context/DataContext";

const formatAlbumLabel = (item) => {
  if (!item?.eventDate) return item.album;
  return `${item.album} • ${item.eventDate}`;
};

export default function GalleryPage() {
  const { gallery } = useClubData();
  const [activeAlbum, setActiveAlbum] = useState("All");
  const [activeIndex, setActiveIndex] = useState(-1);

  const albums = useMemo(
    () => ["All", ...new Set(gallery.map((item) => formatAlbumLabel(item)))],
    [gallery]
  );

  const items = useMemo(
    () =>
      gallery.filter((item) =>
        activeAlbum === "All" ? true : formatAlbumLabel(item) === activeAlbum
      ),
    [gallery, activeAlbum]
  );

  const columns = useMemo(() => {
    const result = [[], [], []];
    items.forEach((item, index) => {
      result[index % 3].push({ ...item, sourceIndex: index });
    });
    return result;
  }, [items]);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow="Media"
        title="Gallery"
        subtitle="Browse event albums, photo highlights, and optional video reels from ClubSphere moments."
      />

      <div className="glass-card flex flex-wrap items-center gap-2 p-4">
        {albums.map((album) => (
          <button
            key={album}
            onClick={() => {
              setActiveAlbum(album);
              setActiveIndex(-1);
            }}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              activeAlbum === album
                ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-300"
                : "border-cyan-500/12 bg-slate-900 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300"
            }`}
          >
            {album}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {column.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(item.sourceIndex)}
                className="glass-card block w-full overflow-hidden p-0 text-left"
              >
                {item.type === "video" ? (
                  <div className="relative">
                    <video
                      src={item.src}
                      preload="metadata"
                      className="h-64 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                      <span className="rounded-full bg-slate-950/75 px-3 py-2 text-xs text-cyan-300">Video Reel</span>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.src}
                    alt={item.album}
                    width={900}
                    height={1200}
                    loading="lazy"
                    className="h-auto w-full object-cover"
                  />
                )}
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-200">{item.album}</p>
                  <p className="text-xs text-slate-500">{item.eventDate || "Undated album"}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-50 bg-slate-950/95 p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">{activeItem.album}</p>
                <p className="text-xs text-slate-500">{activeItem.eventDate || "Undated album"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
                      void document.documentElement.requestFullscreen();
                    }
                  }}
                  className="rounded-lg border border-cyan-500/15 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500/35 hover:text-cyan-300"
                >
                  Full Screen
                </button>
                <button
                  onClick={() => setActiveIndex(-1)}
                  className="rounded-lg border border-cyan-500/15 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500/35 hover:text-cyan-300"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1))}
                className="rounded-full border border-cyan-500/15 px-3 py-3 text-slate-200 hover:border-cyan-500/35 hover:text-cyan-300"
              >
                Prev
              </button>

              <div className="flex-1 overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-900">
                {activeItem.type === "video" ? (
                  <video src={activeItem.src} controls autoPlay className="h-[75vh] w-full object-contain" />
                ) : (
                  <Image
                    src={activeItem.src}
                    alt={activeItem.album}
                    width={1800}
                    height={1200}
                    className="h-[75vh] w-full object-contain"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1))}
                className="rounded-full border border-cyan-500/15 px-3 py-3 text-slate-200 hover:border-cyan-500/35 hover:text-cyan-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getMediaUrl } from "@/lib/client/utils";


interface YouTubePlayerProps {
    videoId: string;
    title?: string;
    thumbnailUrl?: string; // Optional custom thumbnail
}

export function YouTubePlayer({ videoId, title = "YouTube Video", thumbnailUrl }: YouTubePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    // If no custom thumbnail, use standard YouTube HQ thumbnail
    const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const posterUrl = getMediaUrl(thumbnailUrl) || defaultThumbnail;


    if (isPlaying) {
        return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted border border-border glow-effect">
                <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    return (
        <div
            className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-muted border border-border glow-effect"
            onClick={() => setIsPlaying(true)}
        >
            <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-foreground group-hover:text-background transition-all border border-border shadow-md">
                    <Play className="w-8 h-8 ml-1" />
                </div>
            </div>
        </div>
    );
}

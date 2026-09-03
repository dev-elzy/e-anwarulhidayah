"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { ThemeProvider } from "next-themes";
import { CommandPalette } from "@/components/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  // React.useEffect(() => {
  //   // Disable right click / context menu unless inside text inputs/textareas
  //   const handleContextMenu = (e: MouseEvent) => {
  //     const target = e.target as HTMLElement;
  //     if (
  //       target.tagName === "INPUT" ||
  //       target.tagName === "TEXTAREA" ||
  //       target.isContentEditable
  //     ) {
  //       return;
  //     }
  //     e.preventDefault();
  //   };

  //   // Disable keyboard shortcuts for inspecting/view source (F12, Ctrl+U, etc.)
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Prevent F12
  //     if (e.key === "F12") {
  //       e.preventDefault();
  //     }
  //     // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
  //     if (
  //       e.ctrlKey &&
  //       (e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C") ||
  //         e.key === "u" ||
  //         e.key === "U")
  //     ) {
  //       e.preventDefault();
  //     }
  //   };

  //   // Disable image & link dragging
  //   const handleDragStart = (e: DragEvent) => {
  //     const target = e.target as HTMLElement;
  //     if (target.tagName === "IMG" || target.tagName === "A") {
  //       e.preventDefault();
  //     }
  //   };

  //   document.addEventListener("contextmenu", handleContextMenu);
  //   document.addEventListener("keydown", handleKeyDown);
  //   document.addEventListener("dragstart", handleDragStart);

  //   return () => {
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //     document.removeEventListener("keydown", handleKeyDown);
  //     document.removeEventListener("dragstart", handleDragStart);
  //   };
  // }, []);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <CommandPalette />
      </ThemeProvider>
    </SessionProvider>
  );
}


"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-in fade-in duration-300 relative min-h-screen">
      {/* Global CSS for advanced shimmer effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-custom-shimmer {
          transform: translateX(-100%);
          animation: custom-shimmer 2s infinite;
        }
      `}} />

      {/* Top Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-xs p-6">
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-primary/5 to-transparent animate-custom-shimmer" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-xl bg-muted/60 animate-pulse shrink-0" />
          <div className="space-y-2.5 flex-1">
            <div className="h-5 w-48 max-w-[50%] bg-muted/80 rounded-md animate-pulse" />
            <div className="h-3 w-32 max-w-[30%] bg-muted/50 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats/Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 shadow-xs p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent animate-custom-shimmer" />
            <div className="flex justify-between items-center relative z-10">
              <div className="h-4 w-24 bg-muted/80 rounded-md animate-pulse" />
              <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-muted/80 rounded-md animate-pulse mt-2 relative z-10" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 shadow-xs p-6 relative overflow-hidden flex flex-col gap-5">
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent animate-custom-shimmer" />
          <div className="flex justify-between items-center relative z-10">
            <div className="h-5 w-40 bg-muted/80 rounded-md animate-pulse" />
            <div className="h-8 w-24 bg-muted/60 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-3 relative z-10">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-muted/40 rounded-xl animate-pulse flex items-center px-4 gap-4">
                 <div className="h-10 w-10 bg-muted/60 rounded-full shrink-0" />
                 <div className="flex-1 space-y-2">
                   <div className="h-4 w-1/3 bg-muted/60 rounded-md" />
                   <div className="h-3 w-1/4 bg-muted/40 rounded-md" />
                 </div>
                 <div className="h-8 w-16 bg-muted/60 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 shadow-xs p-6 relative overflow-hidden flex flex-col gap-4">
           <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent animate-custom-shimmer" />
           <div className="h-5 w-32 bg-muted/80 rounded-md animate-pulse mb-2 relative z-10" />
           <div className="flex-1 w-full bg-muted/20 rounded-xl flex items-center justify-center relative z-10 border border-dashed border-muted/50 min-h-[300px]">
             <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
               <Loader2 className="h-8 w-8 animate-spin" />
               <span className="text-xs font-medium">Memuat Halaman...</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

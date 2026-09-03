"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "destructive" | "primary" | "warning";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Konfirmasi Tindakan",
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  onConfirm,
  variant = "destructive"
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return (
          <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 animate-bounce">
            <Trash2 className="h-6 w-6" />
          </div>
        );
      case "warning":
        return (
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 animate-pulse">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      default:
        return (
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <HelpCircle className="h-6 w-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold px-5 py-2 cursor-pointer shadow-sm";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold px-5 py-2 cursor-pointer shadow-sm";
      default:
        return "bg-blue-gradient text-white rounded-xl font-bold px-5 py-2 cursor-pointer shadow-sm shadow-primary/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 bg-popover backdrop-blur-xl border border-border rounded-2xl shadow-xl flex flex-col items-center text-center outline-none">
        <DialogHeader className="space-y-3 w-full">
          {getIcon()}
          <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-3 w-full pt-4 mt-2 border-t border-border bg-transparent p-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold border-border bg-transparent hover:bg-muted text-foreground py-2 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

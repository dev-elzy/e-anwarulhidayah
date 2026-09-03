"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, ClipboardList, QrCode, Download, X, Share, Settings, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showIosModal, setShowIosModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isIos) {
      setShowIosModal(true);
    } else if (isAndroid) {
      setShowAndroidModal(true);
    } else {
      setShowDesktopModal(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse delay-1000" />

      {/* Navigation */}
      <header className="w-full py-5 px-6 md:px-12 flex justify-between items-center bg-white/30 backdrop-blur-md border-b border-white/20 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 md:h-10 md:w-10 rounded-full overflow-hidden shadow-md border border-white/20 shrink-0">
            <Image 
              src="https://res.cloudinary.com/dkwaosfda/image/upload/v1780534958/e-anwarulhidayah/settings/riheomgl2gzimuu2tvjh.jpg" 
              alt="Logo Anwarul Hidayah" 
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <span className="font-bold text-base md:text-lg text-glow-gold tracking-wide whitespace-nowrap">e-AnwarulHidayah</span>
        </div>
        <Link href="/login">
          <Button className="bg-blue-gradient text-white hover:opacity-95 shadow-md px-6 py-2 rounded-xl font-semibold flex items-center gap-2">
            Masuk <ArrowRight className="h-4.5 w-4.5" />
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="min-h-[calc(100dvh-100px)] flex flex-col items-center justify-center text-center px-6 py-12 md:py-24 z-10 w-full max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-glow-gold leading-tight"
        >
          Pesantren Digital <br />
          <span className="text-primary bg-clip-text">Anwarul Hidayah</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl font-medium"
        >
          Platform PWA enterprise untuk tata kelola santri, kelas, kehadiran terintegrasi QR code, setoran nadzom, bimbingan ustadz, dan monitoring pengasuh secara realtime.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full"
        >
          <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto bg-blue-gradient text-white hover:opacity-95 shadow-[0_4px_25px_rgba(30,136,229,0.35)] hover:shadow-[0_6px_35px_rgba(30,136,229,0.5)] transition-all duration-300 px-8 py-7 rounded-2xl font-bold text-base flex items-center gap-4 border border-white/20 group cursor-pointer">
            <div className="bg-white/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-lg">Download Aplikasi</span>
              <span className="text-xs font-medium text-blue-100 opacity-90 tracking-wide mt-1">Android & iOS</span>
            </div>
          </Button>
        </motion.div>

      </main>

      {/* About & Features Section */}
      <section className="w-full py-24 px-6 md:px-12 z-10 relative bg-card/60 backdrop-blur-xl border-t border-border/60 shadow-[0_-20px_50px_rgba(0,0,0,0.03)]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] -z-10" />
        
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold border border-primary/20 mb-6 shadow-inner"
            >
              <Sparkles className="h-4 w-4" />
              <span>Tentang Aplikasi</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight max-w-3xl mx-auto text-glow-gold"
            >
              Ekosistem Digital <br className="hidden md:block" />
              <span className="text-primary bg-clip-text">Pesantren Terintegrasi</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl mx-auto"
            >
              e-AnwarulHidayah menghadirkan 4 pilar utama yang memodernisasi tata kelola pondok pesantren secara komprehensif, realtime, dan aman.
            </motion.p>
          </div>

          {/* 3D Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full">
            
            {/* Feature 1: QR Absensi */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="glass-panel rounded-[2.5rem] p-8 hover:border-primary/40 transition-all group"
            >
              <div className="relative w-full h-56 flex items-center justify-center perspective-[1000px] mb-8">
                <div className="absolute bottom-8 w-40 h-10 bg-primary/30 rounded-[100%] blur-xl transition-all duration-500 group-hover:scale-75 group-hover:opacity-50" />
                
                <div className="relative w-36 h-36 bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/30 rounded-3xl backdrop-blur-xl flex items-center justify-center transition-all duration-500 group-hover:transform-[rotateX(20deg)_rotateY(-20deg)_scale(1.1)_translateY(-15px)] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                  <QrCode className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(30,136,229,0.5)]" />
                  
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-card border border-border rounded-xl backdrop-blur-lg flex items-center justify-center animate-pulse shadow-lg">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#1e88e5] opacity-0 group-hover:opacity-100 group-hover:translate-y-36 transition-all duration-2000 ease-in-out" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Absensi QR Pintar</h3>
              <p className="text-muted-foreground leading-relaxed">Sistem kehadiran otomatis dan terpusat untuk ustadz dan santri. Cukup scan QR kelas untuk pencatatan instan tanpa repot.</p>
            </motion.div>

            {/* Feature 2: Monitoring Akademik */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-panel rounded-[2.5rem] p-8 hover:border-primary/40 transition-all group"
            >
              <div className="relative w-full h-56 flex items-center justify-center perspective-[1000px] mb-8">
                <div className="absolute bottom-8 w-40 h-10 bg-primary/30 rounded-[100%] blur-xl transition-all duration-500 group-hover:scale-75 group-hover:opacity-50" />
                
                <div className="relative w-40 h-32 bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/30 rounded-2xl backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500 group-hover:transform-[rotateX(15deg)_rotateY(20deg)_scale(1.1)_translateY(-15px)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-6 bg-primary/20 border-b border-primary/20 flex items-center px-3 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
                    <div className="w-2 h-2 rounded-full bg-green-400/70" />
                  </div>
                  <ClipboardList className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(30,136,229,0.5)] mt-4" />
                  
                  <div className="absolute -bottom-4 -left-4 w-20 h-24 bg-card border border-border rounded-xl backdrop-blur-lg flex items-end justify-between p-3 transition-transform duration-700 group-hover:-translate-y-4 group-hover:translate-x-2 shadow-xl">
                    <div className="w-3 h-8 bg-primary/80 rounded-t-sm" />
                    <div className="w-3 h-12 bg-accent/80 rounded-t-sm" />
                    <div className="w-3 h-16 bg-primary/50 rounded-t-sm" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Monitoring Akademik</h3>
              <p className="text-muted-foreground leading-relaxed">Pantau perkembangan nilai akademik dan keaktifan santri secara realtime. Laporan lengkap ada dalam genggaman Anda.</p>
            </motion.div>

            {/* Feature 3: Setoran Nadzom */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-panel rounded-[2.5rem] p-8 hover:border-accent/40 transition-all group"
            >
              <div className="relative w-full h-56 flex items-center justify-center perspective-[1000px] mb-8">
                <div className="absolute bottom-8 w-40 h-10 bg-accent/30 rounded-[100%] blur-xl transition-all duration-500 group-hover:scale-75 group-hover:opacity-50" />
                
                <div className="relative w-44 h-28 bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl backdrop-blur-xl flex flex-col justify-between p-4 transition-all duration-500 group-hover:transform-[rotateX(25deg)_rotateY(-15deg)_scale(1.1)_translateY(-15px)] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                  <div className="w-8 h-6 bg-accent/30 rounded-md" />
                  <div className="flex justify-between items-end mt-4">
                    <div className="space-y-1.5">
                      <div className="w-16 h-2 bg-foreground/20 rounded-full" />
                      <div className="w-12 h-2 bg-foreground/20 rounded-full" />
                    </div>
                    <Sparkles className="w-10 h-10 text-accent drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" />
                  </div>
                  
                  <div className="absolute -top-6 -right-4 w-14 h-14 bg-gold-gradient border border-white/20 rounded-full flex items-center justify-center shadow-xl transition-all duration-700 group-hover:-translate-y-6 group-hover:translate-x-2 group-hover:rotate-12 z-10">
                    <span className="text-white font-extrabold text-sm">Alfiyah</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors">Setoran Target Nadzom</h3>
              <p className="text-muted-foreground leading-relaxed">Pencatatan hafalan bait kitab kuning terstruktur (Alfiyah, Imrithi, dll) dengan persentase progres yang otomatis terpantau oleh wali santri.</p>
            </motion.div>

            {/* Feature 4: Raport Digital */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-panel rounded-[2.5rem] p-8 hover:border-primary/40 transition-all group"
            >
              <div className="relative w-full h-56 flex items-center justify-center perspective-[1000px] mb-8">
                <div className="absolute bottom-8 w-40 h-10 bg-primary/30 rounded-[100%] blur-xl transition-all duration-500 group-hover:scale-75 group-hover:opacity-50" />
                
                <div className="relative w-36 h-40 bg-gradient-to-b from-primary/20 to-primary/10 border border-primary/30 backdrop-blur-xl flex items-center justify-center transition-all duration-500 group-hover:transform-[rotateX(10deg)_rotateY(25deg)_scale(1.1)_translateY(-15px)] shadow-[0_20px_50px_rgba(0,0,0,0.15)]" style={{ clipPath: "polygon(50% 0%, 100% 15%, 100% 75%, 50% 100%, 0% 75%, 0% 15%)" }}>
                  <ShieldCheck className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(30,136,229,0.5)]" />
                </div>
                
                <div className="absolute bottom-10 -right-2 w-14 h-14 bg-card border border-border rounded-full backdrop-blur-lg flex items-center justify-center transition-transform duration-700 group-hover:-translate-y-4 group-hover:scale-110 shadow-lg z-10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner">
                     <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">Raport &amp; Arsip Digital</h3>
              <p className="text-muted-foreground leading-relaxed">Cetak raport santri otomatis berbasis PDF, lengkap dengan rekap nilai ujian, kehadiran, serta catatan bimbingan akhlak dari ustadz.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-12 text-center text-xs text-muted-foreground border-t border-muted/15 bg-white/20 z-10">
        <p>© 2026 Develzy. All Rights Reserved. - Sistem Administrasi Pondok Pesantren Anwarul Hidayah</p>
      </footer>

      {/* iOS Install Instruction Modal */}
      <AnimatePresence>
        {showIosModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIosModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e2d] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowIosModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-blue-gradient flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Install di iOS</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Untuk memasang e-AnwarulHidayah di perangkat iOS Anda, ikuti langkah mudah berikut:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-white/10 text-white">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">1. Ketuk ikon Bagikan</h4>
                    <p className="text-xs text-muted-foreground">Buka halaman ini di Safari, lalu ketuk ikon Bagikan (Share) di menu bawah.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-white/10 text-white">
                    <span className="font-bold text-lg leading-none">+</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">2. Tambah ke Layar Utama</h4>
                    <p className="text-xs text-muted-foreground">Pilih "Tambah ke Layar Utama" dari menu yang muncul.</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => setShowIosModal(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-0">
                Saya Mengerti
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android Install Instruction Modal */}
      <AnimatePresence>
        {showAndroidModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAndroidModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e2d] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAndroidModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Download className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Download & Install (Android)</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Karena aplikasi diunduh di luar Play Store, Anda perlu memberikan izin instalasi. Ikuti langkah ini:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">1. Download File</h4>
                    <p className="text-xs text-muted-foreground">Klik tombol di bawah ini untuk mengunduh file <b>AnwarulHidayah.apk</b>.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">2. Izinkan Instalasi</h4>
                    <p className="text-xs text-muted-foreground">Buka file yang diunduh. Jika muncul peringatan keamanan, ketuk <b>Setelan (Settings)</b> lalu aktifkan opsi <b>Izinkan dari sumber ini</b>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">3. Selesai</h4>
                    <p className="text-xs text-muted-foreground">Lanjutkan instalasi hingga selesai, dan aplikasi siap digunakan dari layar utama Anda.</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/AnwarulHidayah.apk';
                  link.download = 'AnwarulHidayah.apk';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setShowAndroidModal(false);
                }} 
                className="w-full mt-6 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/25"
              >
                Mulai Download APK
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Instruction Modal */}
      <AnimatePresence>
        {showDesktopModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDesktopModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e2d] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowDesktopModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Ganti ke Perangkat Mobile</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Aplikasi e-AnwarulHidayah dirancang khusus untuk layar dan fitur perangkat mobile (Android & iOS).
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">1. Scan QR Code</h4>
                    <p className="text-xs text-muted-foreground">Buka kamera HP Anda, lalu pindai QR Code yang ada di menu 'Tentang Aplikasi'.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">2. Ketik URL di HP</h4>
                    <p className="text-xs text-muted-foreground">Atau ketikkan langsung alamat website ini pada browser Chrome atau Safari di handphone Anda.</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={() => setShowDesktopModal(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-0">
                Saya Mengerti
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

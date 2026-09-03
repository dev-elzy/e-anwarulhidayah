"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

const loginSchema = zod.object({
  username: zod.string().min(1, "Username wajib diisi"),
  password: zod.string().min(1, "Password wajib diisi"),
  rememberMe: zod.boolean(),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        username: values.username,
        password: values.password,
        rememberMe: values.rememberMe ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        toast.error("Masuk Gagal", {
          description: "Username atau Password yang Anda masukkan salah.",
        });
      } else {
        if (values.rememberMe) {
          document.cookie = `session_active=true; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
        } else {
          document.cookie = "session_active=true; path=/; SameSite=Lax";
        }

        toast.success("Masuk Berhasil", {
          description: "Selamat datang kembali di e-AnwarulHidayah.",
        });
        router.refresh();
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error(err);
      toast.error("Kesalahan Sistem", {
        description: "Terjadi kesalahan. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-background text-foreground">
      {/* Background 3D decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[150px] animate-pulse delay-700" />
      
      {/* 3D Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-40" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md perspective-[1000px] z-10"
      >
        <div className="relative transform-gpu transition-all duration-700 hover:transform-[rotateX(2deg)_rotateY(-2deg)_scale(1.01)]">
          {/* Glowing back panel */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[2.5rem] blur-xl opacity-15 dark:opacity-25" />
          
          <Card className="relative glass-panel rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border-border/80">
            {/* Top Light reflection */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            
            <CardHeader className="text-center pt-10 pb-4">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] overflow-hidden shadow-md border border-border/80 relative group bg-card">
                <Image 
                  src="https://res.cloudinary.com/dkwaosfda/image/upload/v1780534958/e-anwarulhidayah/settings/riheomgl2gzimuu2tvjh.jpg" 
                  alt="Logo Anwarul Hidayah" 
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-primary/20 rounded-[1.5rem]" />
              </div>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-glow-gold">
                e-AnwarulHidayah
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground mt-2">
                Sistem Administrasi Pondok Pesantren
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground ml-1">Username</FormLabel>
                        <FormControl>
                          <div className="relative group/input">
                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center">
                              <User className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                              <Input
                                autoComplete="username"
                                placeholder="Contoh: admin, ustadz, wali"
                                className="h-14 pl-12 bg-card/60 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary rounded-xl transition-all shadow-inner"
                                {...field}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-destructive ml-1" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground ml-1">Password</FormLabel>
                        <FormControl>
                          <div className="relative group/input">
                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex items-center">
                              <Lock className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="h-14 pl-12 pr-12 bg-card/60 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary rounded-xl transition-all shadow-inner"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-destructive ml-1" />
                      </FormItem>
                    )}
                  />

                  {/* Remember Me Checkbox */}
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }: any) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2 ml-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="rememberMe"
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5 rounded-md"
                          />
                        </FormControl>
                        <label
                          htmlFor="rememberMe"
                          className="text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        >
                          Simpan Login (Tetap Masuk)
                        </label>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 mt-4 bg-blue-gradient text-white font-bold text-lg rounded-xl shadow-[0_4px_20px_rgba(30,136,229,0.35)] hover:shadow-[0_6px_25px_rgba(30,136,229,0.5)] transition-all duration-300 relative overflow-hidden group/btn border-t border-white/20 cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        "Masuk ke Sistem"
                      )}
                    </span>
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col items-center pb-8 pt-6 bg-muted/20 border-t border-border/40 relative z-10 mt-auto">
              <p className="text-xs text-muted-foreground text-center font-medium">
                © 2026 Develzy. All Rights Reserved.
              </p>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

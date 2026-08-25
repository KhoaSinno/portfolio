"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Lock, Menu, X } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  id: string;
}

interface FloatingNavbarProps {
  hasExperience?: boolean;
  showProjects?: boolean;
  showSkills?: boolean;
  showExperience?: boolean;
  showEducation?: boolean;
}

export function FloatingNavbar({
  hasExperience = true,
  showProjects = true,
  showSkills = true,
  showExperience,
  showEducation = true,
}: FloatingNavbarProps) {
  const [activeSection, setActiveSection] = useState("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lockScrollUntil = useRef<number>(0);

  const isExpVisible = showExperience !== undefined ? showExperience : hasExperience;

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "About", href: "#about", id: "about" },
      ...(showProjects ? [{ label: "Projects", href: "#projects", id: "projects" }] : []),
      ...(showSkills ? [{ label: "Skills", href: "#skills", id: "skills" }] : []),
      ...(isExpVisible ? [{ label: "Experience", href: "#experience", id: "experience" }] : []),
      ...(showEducation ? [{ label: "Education", href: "#education", id: "education" }] : []),
      { label: "Contact", href: "#contact", id: "contact" },
    ],
    [showProjects, showSkills, isExpVisible, showEducation]
  );

  useEffect(() => {
    const handleScroll = () => {
      // 1. Ignore scroll events while tab-click animation is in progress
      if (Date.now() < lockScrollUntil.current) return;

      // 2. Top of page is always About
      if (window.scrollY < 120) {
        setActiveSection("about");
        return;
      }

      // 3. Check if near bottom of page -> Contact
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 90) {
        setActiveSection("contact");
        return;
      }

      // 4. Find current section by vertical offset
      const checkPosition = window.scrollY + 200;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const item = navItems[i];
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= checkPosition) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  /**
   * Smooth physics-based cubic scroll to section without browser jitter
   */
  const smoothScrollTo = (targetY: number, duration = 600) => {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    // easeInOutCubic curve for smooth slow start & slow finish
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startY + difference * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");

    // Lock scroll listener for 800ms to guarantee no intermediate section hijack
    lockScrollUntil.current = Date.now() + 800;
    setActiveSection(targetId);

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const topOffset = 80;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const targetY = Math.max(0, elementPosition + window.scrollY - topOffset);

      smoothScrollTo(targetY, 600);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full py-3 sm:py-4 pointer-events-none transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Brand Logo (Transparent Floating) */}
        <button
          type="button"
          onClick={(e) => handleNavClick(e, "#about")}
          className="pointer-events-auto group flex items-center transition hover:opacity-90 active:scale-95 cursor-pointer bg-transparent border-none p-0"
          title="Sinoo Hub Portfolio"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Sinoo Hub"
            className="h-9 w-auto rounded-xl object-contain shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {/* Center Floating Capsule Pill with LayoutGroup for Silk-Smooth Pill Sliding */}
        <LayoutGroup id="floating-navbar-capsule">
          <nav className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/15 bg-black/40 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl md:flex">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative px-4 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer select-none bg-transparent border-none ${
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-pill-bubble"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600/50 via-indigo-600/50 to-purple-600/50 border border-violet-400/40 shadow-md shadow-violet-500/20"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Action Buttons (Transparent Floating) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Admin CMS */}
          <a
            href="/admin/resume"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg shadow-black/40 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            title="Admin Resume CMS"
          >
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">CMS</span>
          </a>

          {/* View Full A4 CV CTA */}
          <a
            href="/resume"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-95"
          >
            <span className="flex items-center gap-1.5 rounded-[11px] bg-[#030712]/90 px-3.5 py-1.5 transition duration-300 group-hover:bg-opacity-0">
              <FileText className="h-3.5 w-3.5 text-indigo-300 group-hover:text-white" />
              <span>View CV (A4)</span>
            </span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 shadow-lg shadow-black/40 backdrop-blur-xl transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-auto mx-5 mt-3 rounded-2xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavClick(e, item.href);
                  }}
                  className={`w-full text-left rounded-xl px-3.5 py-2 text-sm font-medium transition bg-transparent border-none ${
                    activeSection === item.id
                      ? "bg-violet-600/30 text-white font-semibold border border-violet-500/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

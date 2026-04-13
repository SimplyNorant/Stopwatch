import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MenuItemType = {
  label: string;
  submenu?: MenuItemType[];
  func?: Function;
};

type Arguments = {
  userName: string;
  logout: Function;
};

export default function ProfileButton({ userName, logout }: Arguments) {
  const [open, setOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // DARK MODE
  const [dark, setDark] = useState(false);

  const menuData: MenuItemType[] = [
    { label: `User: ${userName}` },
    {
      label: "Appearance",
      submenu: [
        {
          label: `Light ${dark ? "" : "✔"}`,
          func: () => toggleDark(false),
        },
        { label: `Dark ${dark ? "✔" : ""}`, func: () => toggleDark(true) },
      ],
    },
    { label: "Sign Out", func: logout },
  ];
  // Auto-close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveSubmenu(null);
        setFocusedIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmenuEnter = (index: number) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    setActiveSubmenu(index);
  };

  const handleSubmenuLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 200); // 👈 tweak this (150–300ms is sweet spot)
  };

  // DARK MODE
  useEffect(() => {
    const stored = localStorage.getItem("theme");

    if (stored) {
      setDark(stored === "dark");
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleDark = (isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 rounded-md focus:outline-none"
      >
        <img src="images/placeholder_avatar.png" alt="user_avatar" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-60 rounded-md bg-foreground shadow-lg border z-50 origin-top-right"
          >
            {menuData.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => item.submenu && handleSubmenuEnter(index)}
                onMouseLeave={() => item.submenu && handleSubmenuLeave()}
              >
                <div
                  onClick={() => {
                    item.func ? item.func() : setActiveSubmenu(index);
                  }}
                  className={`flex justify-between px-4 py-2 rounded-md text-font hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer ${
                    focusedIndex === index ? "bg-gray-200" : ""
                  }`}
                >
                  {item.label}
                  <span>{item.submenu && ">"}</span>
                </div>

                {/* Submenu */}
                {item.submenu && activeSubmenu === index && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-0 right-full mr-1 w-25 rounded-md bg-foreground shadow-lg border"
                  >
                    {item.submenu.map((subItem, subIndex) => (
                      <div
                        key={subIndex}
                        onClick={() => {
                          subItem.func ? subItem.func() : undefined;
                        }}
                        className="px-4 py-2 rounded-md text-font hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer"
                      >
                        {subItem.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

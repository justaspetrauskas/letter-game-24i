import React from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, children }) => {
  return (
    <aside
      className={`absolute inset-y-0 right-0 z-10 flex w-80 flex-col gap-3 overflow-y-auto border-l-4 border-panel-outline bg-panel px-4 py-4 transition-transform duration-200 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      <div className="flex flex-row items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-dim">
          Stats
        </h2>
        <button
          type="button"
          className="rounded-sm px-2 py-1 font-display text-xs font-bold uppercase tracking-widest text-ink-faint transition-colors duration-150 hover:text-ink"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
        >
          Close
        </button>
      </div>

      {children}
    </aside>
  );
};

export default Sidebar;

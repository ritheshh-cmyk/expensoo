import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedListProps<T> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  className?: string;
  listClassName?: string;
  renderItem?: (item: T, index: number, isSelected: boolean) => React.ReactNode;
}

export default function AnimatedList<T>({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  className = '',
  listClassName = 'p-4 flex flex-col gap-2',
  renderItem,
}: AnimatedListProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < safeItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && selectedIndex !== -1 && onItemSelect) {
        e.preventDefault();
        onItemSelect(safeItems[selectedIndex], selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableArrowNavigation, safeItems, selectedIndex, onItemSelect]);

  const defaultRender = (item: any, index: number, isSelected: boolean) => (
    <div
      className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${
        isSelected 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'bg-card text-card-foreground hover:bg-muted border border-border'
      }`}
    >
      {String(item)}
    </div>
  );

  return (
    <div className={`relative overflow-hidden w-full h-full rounded-lg border border-border bg-background ${className}`}>
      {showGradients && (
        <>
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        </>
      )}
      
      <ul 
        ref={listRef}
        className={`w-full h-full overflow-y-auto ${listClassName} ${displayScrollbar ? '' : 'scrollbar-hide'}`}
        style={{ scrollbarWidth: displayScrollbar ? 'auto' : 'none' }}
      >
        <AnimatePresence>
          {safeItems.map((item, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => {
                setSelectedIndex(index);
                if (onItemSelect) onItemSelect(item, index);
              }}
            >
              {renderItem 
                ? renderItem(item, index, selectedIndex === index)
                : defaultRender(item, index, selectedIndex === index)
              }
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      
      {!displayScrollbar && (
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      )}
    </div>
  );
}

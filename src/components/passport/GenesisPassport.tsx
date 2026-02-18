import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PassportCover } from './Cover';
import { PassportBook } from './Book';

export const GenesisPassport = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center min-h-[600px] perspective-[2000px]">
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.div
                        key="cover"
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="w-full"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        <PassportCover onOpen={() => setIsOpen(true)} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="book"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="w-full flex justify-center"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        <PassportBook onClose={() => setIsOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

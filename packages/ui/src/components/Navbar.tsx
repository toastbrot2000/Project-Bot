import * as React from "react"
import { cn } from "../lib/utils"


export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    logo?: React.ReactNode;
    links?: { label: string; href: string; active?: boolean; target?: string }[];
    userMenu?: React.ReactNode;
}

export function Navbar({ className, logo, links, userMenu, ...props }: NavbarProps) {
    return (
        <nav
            className={cn(
                "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                className
            )}
            {...props}
        >
            <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
                <div className="flex items-center gap-6">
                    {logo && <div className="flex-shrink-0">{logo}</div>}
                    {links && (
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            {links.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target={link.target}
                                    className={cn(
                                        "transition-colors hover:text-primary/80",
                                        link.active ? "text-primary font-semibold" : "text-primary/60"
                                    )}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {userMenu}
                </div>
            </div>
        </nav>
    )
}

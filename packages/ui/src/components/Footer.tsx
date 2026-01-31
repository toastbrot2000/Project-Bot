import * as React from "react"
import { cn } from "../lib/utils"

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
    brandName?: string;
}

export function Footer({ className, brandName = "Lennart F.", ...props }: FooterProps) {
    return (
        <footer
            className={cn(
                "border-t bg-background py-2 md:py-3",
                className
            )}
            {...props}
        >
            <div className="container flex flex-col items-center justify-between gap-2 md:h-10 md:flex-row px-2 sm:px-8">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built by <span className="font-medium">{brandName}</span> with 🤖.
                    The source code is available on <a href="https://github.com/toastbrot2000/Project-Bot" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4 hover:text-primary transition-colors">GitHub</a>.
                </p>
            </div>
        </footer>
    )
}

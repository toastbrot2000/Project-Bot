import * as React from "react"
import { cn } from "../lib/utils"

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
    brandName?: string;
}

export function Footer({ className, brandName = "Project Bot", ...props }: FooterProps) {
    return (
        <footer
            className={cn(
                "border-t bg-background py-6 md:py-8",
                className
            )}
            {...props}
        >
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 sm:px-8">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built by <span className="font-medium underline underline-offset-4">{brandName}</span>.
                    The source code is available on <span className="font-medium underline underline-offset-4">GitHub</span>.
                </p>
            </div>
        </footer>
    )
}

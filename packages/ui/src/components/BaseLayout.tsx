import * as React from "react"
import { cn } from "../lib/utils"

export interface BaseLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function BaseLayout({ className, children, ...props }: BaseLayoutProps) {
    return (
        <div
            className={cn(
                "h-screen overflow-hidden bg-background font-sans text-foreground antialiased",
                className
            )}
            {...props}
        >
            <div className="relative flex h-full flex-col">
                {children}
            </div>
        </div>
    )
}

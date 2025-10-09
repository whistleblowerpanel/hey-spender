import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
)

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(avatarVariants(), className)}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
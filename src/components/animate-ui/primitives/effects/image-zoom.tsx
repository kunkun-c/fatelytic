"use client"

import * as React from "react"

interface ImageZoomProps {
  zoomScale?: number
  transition?: { type: string; stiffness: number; damping: number }
  zoomOnClick?: boolean
  zoomOnHover?: boolean
  disabled?: boolean
  width?: React.CSSProperties["width"]
  height?: React.CSSProperties["height"]
  children?: React.ReactElement
  className?: string
  style?: React.CSSProperties
}

const ImageZoom = React.forwardRef<HTMLDivElement, ImageZoomProps>(
  (
    {
      zoomScale = 2.5,
      transition = { type: "spring", stiffness: 200, damping: 28 },
      zoomOnClick = true,
      zoomOnHover = true,
      disabled = false,
      width = "100%",
      height = "100%",
      children,
      className,
      style,
    },
    ref
  ) => {
    const [isZoomed, setIsZoomed] = React.useState(false)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !zoomOnHover || !isZoomed) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setMousePosition({ x, y })
      },
      [disabled, zoomOnHover, isZoomed]
    )

    const handleMouseEnter = React.useCallback(() => {
      if (disabled || !zoomOnHover) return
      
      setIsZoomed(true)
    }, [disabled, zoomOnHover])

    const handleMouseLeave = React.useCallback(() => {
      if (disabled || !zoomOnHover) return
      
      setIsZoomed(false)
      setMousePosition({ x: 50, y: 50 }) // Reset to center
    }, [disabled, zoomOnHover])

    const handleClick = React.useCallback(() => {
      if (disabled || !zoomOnClick) return
      
      setIsZoomed(!isZoomed)
      if (!isZoomed) {
        setMousePosition({ x: 50, y: 50 }) // Center on click
      }
    }, [disabled, zoomOnClick, isZoomed])

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden cursor-pointer ${className || ""}`}
        style={{
          width,
          height,
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div
          style={{
            transform: isZoomed ? `scale(${zoomScale})` : "scale(1)",
            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
            transition: "transform 0.3s ease-out",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>
    )
  }
)

ImageZoom.displayName = "ImageZoom"

export { ImageZoom }

"use client"

import { useEffect, useRef } from 'react'
import { marked } from 'marked'

declare global {
  interface Window {
    MathJax: any
  }
}

interface MathJaxRendererProps {
  content: string
}

export function MathJaxRenderer({ content }: MathJaxRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert markdown to HTML
  const htmlContent = marked(content, {
    breaks: true,
    gfm: true,
  })

  useEffect(() => {
    // Load MathJax if not already loaded
    if (!window.MathJax) {
      const script = document.createElement('script')
      script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6'
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        const mathJaxScript = document.createElement('script')
        mathJaxScript.id = 'MathJax-script'
        mathJaxScript.async = true
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
        document.head.appendChild(mathJaxScript)
      }
    }

    // Configure MathJax
    if (window.MathJax) {
      window.MathJax = {
        ...window.MathJax,
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)'], ['\\{', '\\}']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true,
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
        },
        startup: {
          pageReady: () => {
            return window.MathJax.startup.defaultPageReady().then(() => {
              if (containerRef.current) {
                window.MathJax.typesetPromise([containerRef.current])
              }
            })
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    // Typeset the content when it changes
    if (window.MathJax && containerRef.current) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
        console.error('MathJax typeset error:', err)
      })
    }
  }, [htmlContent])

  return (
    <div 
      ref={containerRef}
      className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
} 
"use client"

import { useState, useRef } from "react"
import { Upload, Wand2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import { getLandingPage } from "@/services/page";


interface GenerationResult {
  originalImage: string
  generatedImage: string
  timestamp: number
}

interface LandingPageProps {
  page: Awaited<ReturnType<typeof getLandingPage>>
  locale: string
}


export default function LandingPage({ page, locale }: LandingPageProps) {
 
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [promptText, setPromptText] = useState<string>("")
  const [textGeneratedImage, setTextGeneratedImage] = useState<string | null>(null)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)

  // Load history from localStorage
  const loadHistory = (): GenerationResult[] => {
    try {
      const history = localStorage.getItem("coloring-book-history")
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error("Failed to load history:", error)
      return []
    }
  }

  // Save to localStorage
  const saveToHistory = (result: GenerationResult) => {
    try {
      const history = loadHistory()
      history.unshift(result)
      // Keep only the last 10 results
      const limitedHistory = history.slice(0, 10)
      localStorage.setItem("coloring-book-history", JSON.stringify(limitedHistory))
    } catch (error) {
      console.error("Failed to save to history:", error)
    }
  }

  const compressImage = (base64: string, quality: number, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Unable to create canvas context"))
          return
        }

        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedBase64)
      }
      img.onerror = () => reject(new Error("Image loading failed"))
      img.src = base64
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size cannot exceed 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result as string

      // Compress image if it's large
      let processedImage = result
      if (file.size > 1024 * 1024) {
        // Compress if larger than 1MB
        try {
          processedImage = await compressImage(result, 0.8, 1024)
          setDebugInfo(`Image compressed: ${file.name}, original size: ${(file.size / 1024).toFixed(2)}KB`)
        } catch (error) {
          console.error("Image compression failed:", error)
          setDebugInfo(`Image uploaded: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB (uncompressed)`)
        }
      } else {
        setDebugInfo(`Image uploaded: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB`)
      }

      setOriginalImage(processedImage)
      setGeneratedImage(null)
      setError(null)
    }
    reader.onerror = () => {
      setError("Image reading failed, please try again")
    }
    reader.readAsDataURL(file)
  }

  const generateColoringBook = async () => {
    if (!originalImage) {
      setError("Please upload an image first")
      return
    }

    setIsGenerating(true)
    setError(null)
    setDebugInfo("Starting to generate line art...")

    try {
      // Convert base64 to File object
      const response = await fetch(originalImage)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append("image", blob, "image.png")
      formData.append("prompt", "Convert to black and white line art coloring page, simple lines, suitable for children to color")
      formData.append("model", "gpt-image-1")
      formData.append("n", "1")
      formData.append("quality", "auto")
      formData.append("response_format", "b64_json")
      formData.append("size", "1024x1024")

      setDebugInfo("Calling API...")

      const apiResponse = await fetch("/api/generate-coloring-book", {
        method: "POST",
        body: formData,
      })

      const result = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(result.error || `API call failed: ${apiResponse.status}`)
      }

      if (result.success && result.image) {
        console.log('result: ', result.image)
        let generatedImageData = result.image
        const base64Prefix = "data:image/png;base64,"
        if (!generatedImageData.startsWith(base64Prefix)) {
          generatedImageData = base64Prefix + generatedImageData
        }
        setGeneratedImage(generatedImageData)
        

        // Save to history
        saveToHistory({
          originalImage,
          generatedImage: generatedImageData,
          timestamp: Date.now(),
        })

        setDebugInfo(`Generation successful! Time: ${result.processingTime}ms`)
      } else {
        throw new Error(result.error || "Generation failed")
      }
    } catch (error) {
      console.error("Generation error:", error)

      let errorMessage = "Generation failed, please try again"
      let debugDetails = ""

      if (error instanceof Error) {
        errorMessage = error.message
        debugDetails = `Error type: ${error.constructor.name}\nError message: ${error.message}\nTime: ${new Date().toISOString()}`

        // Special error handling
        if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
          debugDetails += "\nSuggestion: Image processing timeout, please try using a smaller image or retry later"
        } else if (error.message.includes("fetch")) {
          debugDetails += "\nPossible cause: Network connection issue or API service unavailable"
        }
      }

      setError(errorMessage)
      setDebugInfo(debugDetails)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `coloring-book-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const generateFromText = async () => {
    if (!promptText.trim()) {
      setTextError("Please enter a description")
      return
    }
    setIsGeneratingText(true)
    setTextError(null)
    setDebugInfo("Generating line art from text...")
    try {
      const response = await fetch("/api/generate-text-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `API call failed: ${response.status}`)
      if (result.success && result.image) {
        let textImageData = result.image
        const base64Prefix = "data:image/png;base64,"
        if (!textImageData.startsWith(base64Prefix)) {
          textImageData = base64Prefix + textImageData
        }
        setTextGeneratedImage(textImageData)
      } else {
        throw new Error(result.error || "Generation failed")
      }
    } catch (error) {
      setTextError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsGeneratingText(false)
    }
  }

  return (
    <>
       {/* ✅ Feature area below Hero */}
       {page.hero && <Hero hero={page.hero} />}

<div className="relative z-10 -mt-12 pb-8 px-4">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-32">

    {/* 🎨 Image-to-Image area */}
    <div className="flex flex-col items-center h-full">
      <h3 className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-medium h-10 px-4 mb-4">Convert Image to Coloring Page</h3>
      <Card className="flex flex-col flex-1 w-full p-6 bg-white/90 shadow-xl border rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" /> Upload Image to Generate Line Art
        </h2>
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-blue-300 rounded-lg w-full aspect-[5/4] overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
        >
          {originalImage ? (
            <img src={originalImage} alt="Upload" className="w-full h-full object-contain" />
          ) : (
            <p className="text-gray-500">Click to upload image</p>
          )}
        </div>
        <input ref={fileInputRef} type="file" onChange={handleImageUpload} className="hidden" />
        <Button onClick={generateColoringBook} disabled={!originalImage || isGenerating} className="w-full mt-4">
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
          ) : (
            <><Wand2 className="w-4 h-4 mr-2" />Generate Coloring Page</>
          )}
        </Button>
        {generatedImage && (
          <div className="mt-4 text-center">
            <img src={generatedImage} alt="Line Art" className="rounded-lg shadow max-h-64 mx-auto" />
            <Button onClick={downloadImage} className="mt-2 w-full">Download Image</Button>
          </div>
        )}
      </Card>
    </div>

    {/* ✏️ Text-to-Image area */}
    <div className="flex flex-col items-center h-full">
      <h3 className="inline-flex items-center justify-center bg-primary text-primary-foreground rounded-md text-sm font-medium h-10 px-4 mb-4">Convert Text to Coloring Book</h3>
      <Card className="flex flex-col flex-1 w-full p-6 bg-white/90 shadow-xl border rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-green-600" /> Generate Line Art from Text
        </h2>
        <Textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Example: A child playing on the beach"
          className="mb-4 w-full aspect-[5/4]"
        />
        <Button onClick={generateFromText} disabled={!promptText.trim() || isGeneratingText} className="w-full">
          {isGeneratingText ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
          ) : (
            <><Wand2 className="w-4 h-4 mr-2" />Generate Line Art</>
          )}
        </Button>
        {textGeneratedImage && (
          <div className="mt-4 text-center">
            <img src={textGeneratedImage} alt="Line Art" className="rounded-lg shadow max-h-64 mx-auto" />
            <Button onClick={() => {
              const link = document.createElement("a")
              link.href = textGeneratedImage
              link.download = `text-sketch-${Date.now()}.png`
              link.click()
            }} className="mt-2 w-full">Download Image</Button>
          </div>
        )}
      </Card>
    </div>
  </div>
</div>

{/* Continue rendering original content */}
{page.branding && <Branding section={page.branding} />}
{page.introduce && <Feature1 section={page.introduce} />}
{page.benefit && <Feature2 section={page.benefit} />}
{page.usage && <Feature3 section={page.usage} />}
{page.feature && <Feature section={page.feature} />}
{page.showcase && <Showcase section={page.showcase} />}
{page.stats && <Stats section={page.stats} />}
{page.pricing && <Pricing pricing={page.pricing} />}
{page.testimonial && <Testimonial section={page.testimonial} />}
{page.faq && <FAQ section={page.faq} />}
{page.cta && <CTA section={page.cta} />}
    </>
  );
}
